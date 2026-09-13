require('dotenv').config();

const { Worker } = require('bullmq');
const { connectDB } = require('./config/db');
const { redisClient, baseOptions } = require('./config/redis');
const procesarSolicitud = require('./processors/solicitudProcessor');

const QUEUE_NAME = 'solicitudes';
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || 2);
const HEARTBEAT_INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS || 5000);
const WORKER_HEARTBEAT_KEY = 'taskflow:worker:heartbeat';

// El TTL del latido debe ser un poco mayor que el intervalo, para que si el
// Worker se detiene la clave expire por sí sola y el Monitor detecte el cambio.
const HEARTBEAT_TTL_SECONDS = Math.ceil((HEARTBEAT_INTERVAL_MS * 2.5) / 1000);

let heartbeatTimer = null;

/**
 * Publica periódicamente un "latido de vida" en Redis para que el backend
 * pueda informar en el Monitor si el Worker está disponible (HU-09).
 */
function iniciarHeartbeat() {
  const latir = async () => {
    try {
      await redisClient.set(WORKER_HEARTBEAT_KEY, String(Date.now()), 'EX', HEARTBEAT_TTL_SECONDS);
    } catch (err) {
      console.error('[Worker] Error al registrar el latido de vida:', err.message);
    }
  };

  latir();
  heartbeatTimer = setInterval(latir, HEARTBEAT_INTERVAL_MS);
}

async function start() {
  await connectDB();
  iniciarHeartbeat();

  const worker = new Worker(QUEUE_NAME, procesarSolicitud, {
    connection: baseOptions,
    concurrency: CONCURRENCY
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completado.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} falló de forma inesperada:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Error del proceso Worker:', err.message);
  });

  console.log(`[TASKFLOW Worker] Escuchando la cola "${QUEUE_NAME}" (concurrencia: ${CONCURRENCY}).`);

  const apagarGraciosamente = async () => {
    console.log('[Worker] Señal de apagado recibida. Cerrando conexiones...');
    clearInterval(heartbeatTimer);
    await redisClient.del(WORKER_HEARTBEAT_KEY);
    await worker.close();
    process.exit(0);
  };

  process.on('SIGTERM', apagarGraciosamente);
  process.on('SIGINT', apagarGraciosamente);
}

start().catch((err) => {
  console.error('[TASKFLOW Worker] Error fatal al iniciar:', err);
  process.exit(1);
});
