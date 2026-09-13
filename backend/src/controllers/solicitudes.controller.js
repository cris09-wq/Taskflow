const asyncHandler = require('../utils/asyncHandler');
const solicitudesService = require('../services/solicitudes.service');
const { emitEvent } = require('../config/socket');

/**
 * POST /api/solicitudes
 * Registra una nueva solicitud (HU-01).
 */
const crear = asyncHandler(async (req, res) => {
  const solicitud = await solicitudesService.crearSolicitud(req.body);
  res.status(201).json({
    exito: true,
    mensaje: 'Solicitud registrada correctamente y enviada a procesamiento.',
    datos: solicitud
  });
});

/**
 * GET /api/solicitudes
 * Lista solicitudes con filtros opcionales (HU-02).
 */
const listar = asyncHandler(async (req, res) => {
  const { q: busqueda, categoria, estado, prioridad } = req.query;
  const solicitudes = await solicitudesService.listarSolicitudes({ busqueda, categoria, estado, prioridad });
  res.json({ exito: true, total: solicitudes.length, datos: solicitudes });
});

/**
 * GET /api/solicitudes/:id
 * Consulta el detalle de una solicitud, utilizando caché (HU-03, HU-08).
 */
const obtener = asyncHandler(async (req, res) => {
  const { solicitud, cache } = await solicitudesService.obtenerSolicitudPorId(req.params.id);

  res.set('X-Cache', cache);

  if (!solicitud) {
    return res.status(404).json({ exito: false, mensaje: 'La solicitud no fue encontrada.' });
  }

  res.json({ exito: true, cache, datos: solicitud });
});

/**
 * PUT /api/solicitudes/:id
 * Actualiza los campos editables de una solicitud.
 */
const actualizar = asyncHandler(async (req, res) => {
  const solicitud = await solicitudesService.actualizarSolicitud(req.params.id, req.body);

  if (!solicitud) {
    return res.status(404).json({ exito: false, mensaje: 'La solicitud no fue encontrada.' });
  }

  emitEvent('solicitud-actualizada', solicitud.toJSON());

  res.json({ exito: true, mensaje: 'Solicitud actualizada correctamente.', datos: solicitud });
});

/**
 * DELETE /api/solicitudes/:id
 * Elimina una solicitud.
 */
const eliminar = asyncHandler(async (req, res) => {
  const solicitud = await solicitudesService.eliminarSolicitud(req.params.id);

  if (!solicitud) {
    return res.status(404).json({ exito: false, mensaje: 'La solicitud no fue encontrada.' });
  }

  emitEvent('cola-actualizada', { motivo: 'solicitud-eliminada', solicitudId: req.params.id });

  res.json({ exito: true, mensaje: 'Solicitud eliminada correctamente.' });
});

/**
 * GET /api/solicitudes/estadisticas/resumen
 * Estadísticas agregadas para el Dashboard.
 */
const estadisticas = asyncHandler(async (req, res) => {
  const stats = await solicitudesService.obtenerEstadisticas();
  res.json({ exito: true, datos: stats });
});

module.exports = { crear, listar, obtener, actualizar, eliminar, estadisticas };
