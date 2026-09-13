const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const solicitudesRoutes = require('./routes/solicitudes.routes');
const monitorRoutes = require('./routes/monitor.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/api/health', (req, res) => {
    res.json({ exito: true, mensaje: 'TASKFLOW API operativa.' });
  });

  app.use('/api/solicitudes', solicitudesRoutes);
  app.use('/api/monitor', monitorRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
