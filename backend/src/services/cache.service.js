const { redisClient } = require('../config/redis');

const CACHE_TTL = Number(process.env.CACHE_TTL || 60);
const PREFIX = 'taskflow:solicitud:';

function keyFor(id) {
  return `${PREFIX}${id}`;
}

/**
 * Intenta obtener una solicitud desde la caché.
 * Devuelve { hit: boolean, data: object|null }.
 */
async function obtenerDeCache(id) {
  try {
    const raw = await redisClient.get(keyFor(id));
    if (raw) {
      return { hit: true, data: JSON.parse(raw) };
    }
    return { hit: false, data: null };
  } catch (err) {
    console.error('[Cache] Error al leer de Redis, se continúa sin caché:', err.message);
    return { hit: false, data: null };
  }
}

/**
 * Almacena una solicitud en caché con TTL configurable.
 */
async function guardarEnCache(id, data) {
  try {
    await redisClient.set(keyFor(id), JSON.stringify(data), 'EX', CACHE_TTL);
  } catch (err) {
    console.error('[Cache] Error al escribir en Redis:', err.message);
  }
}

/**
 * Invalida (elimina) la entrada de caché de una solicitud.
 * Debe invocarse cada vez que la solicitud cambia (actualización, eliminación,
 * o procesamiento por parte del Worker) para mantener consistencia con MongoDB.
 */
async function invalidarCache(id) {
  try {
    await redisClient.del(keyFor(id));
  } catch (err) {
    console.error('[Cache] Error al invalidar caché:', err.message);
  }
}

module.exports = { obtenerDeCache, guardarEnCache, invalidarCache, CACHE_TTL };
