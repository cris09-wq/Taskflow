/**
 * Reglas predefinidas de generación de respuesta según la categoría
 * de la solicitud (sección 14 y HU-06 del enunciado).
 * No se utiliza inteligencia artificial: cada categoría tiene una plantilla fija.
 */
const REGLAS = {
  informacion: (solicitud) =>
    `Hemos recibido tu solicitud de información "${solicitud.titulo}". ` +
    'Nuestro equipo revisó el contenido y confirma que la información solicitada ' +
    'ha sido procesada correctamente. Si necesitas más detalles, puedes registrar una nueva consulta.',

  soporte: (solicitud) =>
    `Tu reporte de soporte "${solicitud.titulo}" fue recibido y analizado. ` +
    'Se ha registrado el incidente y el equipo técnico dará seguimiento según la prioridad asignada ' +
    `(${solicitud.prioridad}). Gracias por reportarlo.`,

  documento: (solicitud) =>
    `La solicitud de documento "${solicitud.titulo}" fue procesada exitosamente. ` +
    'El documento solicitado ha quedado generado y disponible para su entrega según los canales habituales.',

  consulta: (solicitud) =>
    `Consultamos el estado del proceso relacionado con "${solicitud.titulo}". ` +
    'El proceso se encuentra en curso y avanza según lo esperado. Te notificaremos ante cualquier novedad.',

  actualizacion: (solicitud) =>
    `La solicitud de actualización "${solicitud.titulo}" fue aplicada correctamente. ` +
    'La información fue modificada según lo indicado en la descripción.'
};

const RESPUESTA_GENERICA = (solicitud) =>
  `Tu solicitud "${solicitud.titulo}" fue recibida y procesada por el sistema. ` +
  'No fue posible asociarla a una categoría específica, por lo que se generó una respuesta general. ' +
  'Un miembro del equipo podrá darle seguimiento manual si es necesario.';

/**
 * Genera el texto de respuesta para una solicitud según su categoría.
 * Si la categoría no coincide con ninguna regla, se utiliza la respuesta genérica.
 */
function generarRespuesta(solicitud) {
  const regla = REGLAS[solicitud.categoria];
  if (typeof regla === 'function') {
    return regla(solicitud);
  }
  return RESPUESTA_GENERICA(solicitud);
}

module.exports = { generarRespuesta, REGLAS, RESPUESTA_GENERICA };
