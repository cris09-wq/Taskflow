const { redisClient } = require('../config/redis');

const WORKER_EVENTS_CHANNEL = 'taskflow:eventos';

/**
 * El Worker no tiene conexión directa con el navegador (sección 21.5:
 * "El Worker no necesita una conexión directa con el navegador").
 * Por eso publica sus eventos en un canal Redis; el backend está suscrito
 * a ese canal y retransmite el evento a los clientes Vue mediante Socket.IO.
 */
async function publicarEvento(evento, payload) {
  try {
    await redisClient.publish(WORKER_EVENTS_CHANNEL, JSON.stringify({ evento, payload }));
  } catch (err) {
    console.error(`[Worker] No fue posible publicar el evento "${evento}":`, err.message);
  }
}

module.exports = { publicarEvento, WORKER_EVENTS_CHANNEL };
