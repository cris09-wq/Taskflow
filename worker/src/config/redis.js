const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || 'redisserver';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

const baseOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  }
};

// Cliente utilizado para: caché (invalidación), publicación de eventos
// hacia el backend y el latido de vida del Worker.
const redisClient = new Redis(baseOptions);

redisClient.on('connect', () => console.log('[Worker][Redis] Cliente conectado.'));
redisClient.on('error', (err) => console.error('[Worker][Redis] Error:', err.message));

module.exports = { redisClient, baseOptions };
