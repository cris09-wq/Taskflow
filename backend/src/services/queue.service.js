const { Queue, QueueEvents } = require('bullmq');
const { baseOptions } = require('../config/redis');

const QUEUE_NAME = 'solicitudes';

// La cola de BullMQ persiste sus jobs en Redis. Si el Worker está detenido,
// los jobs permanecen almacenados en Redis hasta que un Worker los reclame
// (HU-04: "Si el Worker está detenido, las solicitudes deben permanecer
// pendientes en la cola").
const solicitudesQueue = new Queue(QUEUE_NAME, { connection: baseOptions });

const queueEvents = new QueueEvents(QUEUE_NAME, { connection: baseOptions });
queueEvents.on('error', (err) => {
  console.error('[Cola] Error en QueueEvents:', err.message);
});

/**
 * Agrega una solicitud a la cola de procesamiento.
 * Se utiliza el propio ID de MongoDB como referencia identificable del job.
 */
async function encolarSolicitud(solicitudId) {
  return solicitudesQueue.add(
    'procesar-solicitud',
    { solicitudId: String(solicitudId) },
    {
      jobId: String(solicitudId),
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 86400, count: 1000 }
    }
  );
}

/**
 * Obtiene los contadores actuales de la cola (útil para Dashboard y Monitor).
 */
async function obtenerContadoresCola() {
  const counts = await solicitudesQueue.getJobCounts(
    'waiting',
    'active',
    'completed',
    'failed',
    'delayed'
  );
  return counts;
}

module.exports = { solicitudesQueue, encolarSolicitud, obtenerContadoresCola, QUEUE_NAME };
