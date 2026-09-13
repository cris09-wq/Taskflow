const mongoose = require('mongoose');

/**
 * Establece la conexión con MongoDB para el Worker.
 * El Worker se conecta directamente a MongoDB porque forma parte de la
 * infraestructura interna del sistema (no es atendido por el navegador).
 */
async function connectDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://mongoserver:27017/taskflow';

  mongoose.connection.on('connected', () => {
    console.log('[Worker][MongoDB] Conexión establecida correctamente.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Worker][MongoDB] Error de conexión:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Worker][MongoDB] Conexión perdida. Intentando reconectar...');
  });

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });

  return mongoose.connection;
}

module.exports = { connectDB };
