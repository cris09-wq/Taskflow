const { Solicitud } = require('../models/Solicitud');
const { obtenerDeCache, guardarEnCache, invalidarCache } = require('./cache.service');
const { encolarSolicitud } = require('./queue.service');
const { emitEvent } = require('../config/socket');

/**
 * Crea una nueva solicitud, la persiste en MongoDB y la envía a la cola
 * de Redis para su procesamiento asíncrono (HU-01 y HU-04).
 */
async function crearSolicitud(datos) {
  const solicitud = await Solicitud.create({
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    categoria: datos.categoria,
    prioridad: datos.prioridad || 'media',
    estado: 'PENDIENTE'
  });

  emitEvent('solicitud-creada', solicitud.toJSON());

  // Se actualiza a EN_COLA antes de encolar para reflejar el estado real
  // en MongoDB en todo momento.
  solicitud.estado = 'EN_COLA';
  await solicitud.save();

  await encolarSolicitud(solicitud._id);

  emitEvent('solicitud-encolada', solicitud.toJSON());
  emitEvent('cola-actualizada', { motivo: 'nueva-solicitud', solicitudId: solicitud.id });

  return solicitud;
}

/**
 * Lista solicitudes aplicando filtros opcionales de búsqueda, categoría y estado.
 */
async function listarSolicitudes({ busqueda, categoria, estado, prioridad } = {}) {
  const filtro = {};

  if (categoria) filtro.categoria = categoria;
  if (estado) filtro.estado = estado;
  if (prioridad) filtro.prioridad = prioridad;

  if (busqueda) {
    filtro.$or = [
      { titulo: { $regex: busqueda, $options: 'i' } },
      { descripcion: { $regex: busqueda, $options: 'i' } }
    ];
  }

  return Solicitud.find(filtro).sort({ createdAt: -1 }).lean();
}

/**
 * Obtiene una solicitud por ID, utilizando caché Redis (HU-08).
 * Devuelve { solicitud, cache: 'HIT' | 'MISS' }.
 */
async function obtenerSolicitudPorId(id) {
  const { hit, data } = await obtenerDeCache(id);
  if (hit) {
    return { solicitud: data, cache: 'HIT' };
  }

  const solicitud = await Solicitud.findById(id).lean();
  if (!solicitud) {
    return { solicitud: null, cache: 'MISS' };
  }

  await guardarEnCache(id, solicitud);
  return { solicitud, cache: 'MISS' };
}

/**
 * Actualiza los campos editables de una solicitud (título, descripción,
 * categoría, prioridad). El estado es administrado exclusivamente por el sistema.
 */
async function actualizarSolicitud(id, cambios) {
  const solicitud = await Solicitud.findById(id);
  if (!solicitud) return null;

  const camposPermitidos = ['titulo', 'descripcion', 'categoria', 'prioridad'];
  camposPermitidos.forEach((campo) => {
    if (cambios[campo] !== undefined) {
      solicitud[campo] = cambios[campo];
    }
  });

  await solicitud.save();
  await invalidarCache(id);

  return solicitud;
}

/**
 * Elimina una solicitud e invalida su entrada en caché.
 */
async function eliminarSolicitud(id) {
  const solicitud = await Solicitud.findByIdAndDelete(id);
  if (solicitud) {
    await invalidarCache(id);
  }
  return solicitud;
}

/**
 * Calcula estadísticas agregadas para el Dashboard y el Monitor (HU-09).
 */
async function obtenerEstadisticas() {
  const resultados = await Solicitud.aggregate([
    { $group: { _id: '$estado', total: { $sum: 1 } } }
  ]);

  const base = {
    total: 0,
    PENDIENTE: 0,
    EN_COLA: 0,
    PROCESANDO: 0,
    RESPONDIDA: 0,
    ERROR: 0
  };

  resultados.forEach((r) => {
    base[r._id] = r.total;
    base.total += r.total;
  });

  return base;
}

module.exports = {
  crearSolicitud,
  listarSolicitudes,
  obtenerSolicitudPorId,
  actualizarSolicitud,
  eliminarSolicitud,
  obtenerEstadisticas
};
