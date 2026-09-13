const { Solicitud } = require('../models/Solicitud');
const { generarRespuesta } = require('../rules/responseRules');
const { publicarEvento } = require('../utils/events');
const { invalidarCache } = require('../utils/cache');

const PROCESSING_DELAY_MS = Number(process.env.PROCESSING_DELAY_MS || 2000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Procesa una solicitud completa siguiendo el flujo definido en la sección 8:
 *  1. Obtener la solicitud desde MongoDB.
 *  2. Cambiar estado a PROCESANDO.
 *  3. Identificar categoría y aplicar regla de respuesta.
 *  4. Guardar la respuesta y cambiar estado a RESPONDIDA.
 *  5. Invalidar caché y notificar mediante eventos.
 *
 * En caso de error, la solicitud pasa a estado ERROR sin detener el Worker
 * ni afectar el procesamiento de otras solicitudes (HU-11).
 */
async function procesarSolicitud(job) {
  const { solicitudId } = job.data;

  const solicitud = await Solicitud.findById(solicitudId);
  if (!solicitud) {
    console.warn(`[Worker] La solicitud ${solicitudId} ya no existe. Se omite.`);
    return { omitido: true };
  }

  try {
    solicitud.estado = 'PROCESANDO';
    solicitud.fechaProcesamiento = new Date();
    await solicitud.save();

    await invalidarCache(solicitudId);
    await publicarEvento('solicitud-procesando', solicitud.toJSON());
    await publicarEvento('cola-actualizada', { motivo: 'inicio-procesamiento', solicitudId });

    // Simula un tiempo de procesamiento real (identificación de categoría,
    // aplicación de regla y generación de la respuesta).
    await sleep(PROCESSING_DELAY_MS);

    // Simulación controlada de un error de procesamiento para demostrar HU-11:
    // si la descripción contiene la palabra clave "forzar-error", la solicitud
    // se marca deliberadamente como ERROR.
    if (/forzar-error/i.test(solicitud.descripcion)) {
      throw new Error('Error simulado de procesamiento solicitado explícitamente por el usuario.');
    }

    const respuesta = generarRespuesta(solicitud);

    solicitud.respuesta = respuesta;
    solicitud.estado = 'RESPONDIDA';
    solicitud.fechaRespuesta = new Date();
    solicitud.error = null;
    await solicitud.save();

    await invalidarCache(solicitudId);
    await publicarEvento('solicitud-respondida', solicitud.toJSON());
    await publicarEvento('cola-actualizada', { motivo: 'solicitud-respondida', solicitudId });
    await publicarEvento('monitor-actualizado', { motivo: 'solicitud-respondida' });

    return { exito: true };
  } catch (err) {
    console.error(`[Worker] Error al procesar la solicitud ${solicitudId}:`, err.message);

    solicitud.estado = 'ERROR';
    solicitud.error = 'No fue posible procesar la solicitud. El equipo ha sido notificado.';
    await solicitud.save();

    await invalidarCache(solicitudId);
    await publicarEvento('solicitud-error', solicitud.toJSON());
    await publicarEvento('cola-actualizada', { motivo: 'solicitud-error', solicitudId });
    await publicarEvento('monitor-actualizado', { motivo: 'solicitud-error' });

    // No se relanza el error para que BullMQ no reintente indefinidamente
    // un error de negocio ya controlado; el job se marca como completado
    // y la solicitud queda documentada en estado ERROR dentro de MongoDB.
    return { exito: false };
  }
}

module.exports = procesarSolicitud;
