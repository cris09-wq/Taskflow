const asyncHandler = require('../utils/asyncHandler');
const { isMongoAvailable } = require('../config/db');
const { redisClient, isRedisAvailable } = require('../config/redis');
const { obtenerContadoresCola } = require('../services/queue.service');
const { obtenerEstadisticas } = require('../services/solicitudes.service');

// Clave donde el Worker publica un "latido" periódico para indicar que
// está activo. Se define un TTL corto en el Worker; si el Worker se
// detiene, la clave expira y el monitor lo refleja automáticamente.
const WORKER_HEARTBEAT_KEY = 'taskflow:worker:heartbeat';

/**
 * GET /api/monitor
 * Consulta el estado general de los servicios y estadísticas de procesamiento.
 */
const obtenerEstadoSistema = asyncHandler(async (req, res) => {
  const mongoDisponible = isMongoAvailable();
  const redisDisponible = isRedisAvailable();

  let workerDisponible = false;
  if (redisDisponible) {
    const heartbeat = await redisClient.get(WORKER_HEARTBEAT_KEY);
    workerDisponible = Boolean(heartbeat);
  }

  const colaCounts = redisDisponible
    ? await obtenerContadoresCola()
    : { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };

  const stats = await obtenerEstadisticas();

  res.json({
    exito: true,
    datos: {
      servicios: {
        express: true,
        mongodb: mongoDisponible,
        redis: redisDisponible,
        worker: workerDisponible
      },
      cola: colaCounts,
      solicitudes: stats
    }
  });
});

module.exports = { obtenerEstadoSistema, WORKER_HEARTBEAT_KEY };
