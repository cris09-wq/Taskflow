const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || 'redisserver';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

/**
 * Opciones compartidas para todas las conexiones Redis del backend.
 * BullMQ requiere maxRetriesPerRequest = null en las conexiones que usa.
 */
const baseOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  }
};

// Cliente principal: caché de solicitudes y lecturas de estado.
const redisClient = new Redis(baseOptions);

// Cliente dedicado a suscripción (pub/sub) de eventos emitidos por el Worker.
// Debe ser una conexión separada porque un cliente en modo "subscribe"
// no puede ejecutar otros comandos.
const redisSubscriber = new Redis(baseOptions);

redisClient.on('connect', () => console.log('[Redis] Cliente principal conectado.'));
redisClient.on('error', (err) => console.error('[Redis] Error en cliente principal:', err.message));

redisSubscriber.on('connect', () => console.log('[Redis] Cliente de suscripción conectado.'));
redisSubscriber.on('error', (err) => console.error('[Redis] Error en cliente de suscripción:', err.message));

/**
 * Indica si Redis está disponible actualmente.
 */
function isRedisAvailable() {
  return redisClient.status === 'ready';
}

module.exports = { redisClient, redisSubscriber, isRedisAvailable, baseOptions };
