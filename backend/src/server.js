require('dotenv').config();

const http = require('http');
const createApp = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB();

    const app = createApp();
    const httpServer = http.createServer(app);

    initSocket(httpServer, process.env.CORS_ORIGIN);

    httpServer.listen(PORT, () => {
      console.log(`[TASKFLOW Backend] Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error('[TASKFLOW Backend] Error fatal al iniciar el servidor:', err);
    process.exit(1);
  }
}

start();
