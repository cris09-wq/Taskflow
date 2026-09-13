const { Server } = require('socket.io');
const { redisSubscriber } = require('./redis');

const WORKER_EVENTS_CHANNEL = 'taskflow:eventos';

let io = null;

/**
 * Eventos Socket.IO soportados por TASKFLOW (ver sección 21.3 del enunciado):
 *  - solicitud-creada
 *  - solicitud-encolada
 *  - solicitud-procesando
 *  - solicitud-respondida
 *  - solicitud-error
 *  - cola-actualizada
 *  - monitor-actualizado
 */

/**
 * Inicializa el servidor Socket.IO sobre el servidor HTTP de Express
 * y se suscribe al canal Redis mediante el cual el Worker (proceso
 * independiente, sin acceso directo al navegador) notifica sus eventos.
 */
function initSocket(httpServer, corsOrigin) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Cliente conectado: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Cliente desconectado: ${socket.id} (${reason})`);
    });
  });

  // El Worker publica sus eventos en Redis (pub/sub) porque no tiene
  // conexión directa con el navegador. El backend actúa como puente:
  // recibe el mensaje y lo retransmite a todos los clientes Vue conectados.
  redisSubscriber.subscribe(WORKER_EVENTS_CHANNEL, (err) => {
    if (err) {
      console.error('[Socket.IO] No fue posible suscribirse al canal de eventos del Worker:', err.message);
      return;
    }
    console.log(`[Socket.IO] Suscrito al canal "${WORKER_EVENTS_CHANNEL}" para reenviar eventos del Worker.`);
  });

  redisSubscriber.on('message', (channel, message) => {
    if (channel !== WORKER_EVENTS_CHANNEL) return;
    try {
      const { evento, payload } = JSON.parse(message);
      emitEvent(evento, payload);
    } catch (err) {
      console.error('[Socket.IO] Error al procesar evento recibido del Worker:', err.message);
    }
  });

  return io;
}

/**
 * Emite un evento a todos los clientes Vue conectados.
 * Utilizado tanto por el propio backend (ej. al crear/encolar una solicitud)
 * como por el puente de eventos del Worker.
 */
function emitEvent(evento, payload) {
  if (!io) {
    console.warn(`[Socket.IO] Se intentó emitir "${evento}" pero el servidor aún no está inicializado.`);
    return;
  }
  io.emit(evento, payload);
}

function getIO() {
  return io;
}

module.exports = { initSocket, emitEvent, getIO, WORKER_EVENTS_CHANNEL };
