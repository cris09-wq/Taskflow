const { redisClient } = require('../config/redis');

// Debe coincidir exactamente con el prefijo utilizado en backend/src/services/cache.service.js
const PREFIX = 'taskflow:solicitud:';

/**
 * Invalida la caché de una solicitud luego de que el Worker la modifica,
 * garantizando que la próxima consulta desde Express refleje la información
 * actualizada en MongoDB (HU-08: "La información debe mantenerse
 * consistente con MongoDB").
 */
async function invalidarCache(id) {
  try {
    await redisClient.del(`${PREFIX}${id}`);
  } catch (err) {
    console.error('[Worker][Cache] Error al invalidar caché:', err.message);
  }
}

module.exports = { invalidarCache };
