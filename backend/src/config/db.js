const mongoose = require('mongoose');

/**
 * Establece la conexión con MongoDB utilizando Mongoose.
 * El nombre de host debe corresponder al nombre del servicio definido
 * en docker-compose.yml (mongoserver), nunca "localhost" entre contenedores.
 */
async function connectDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://mongoserver:27017/taskflow';

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Conexión establecida correctamente.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Error de conexión:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Conexión perdida. Intentando reconectar...');
  });

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });

  return mongoose.connection;
}

/**
 * Indica si la conexión a MongoDB está activa.
 * readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
function isMongoAvailable() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isMongoAvailable };
