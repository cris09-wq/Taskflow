const { Router } = require('express');
const { obtenerEstadoSistema } = require('../controllers/monitor.controller');

const router = Router();

router.get('/', obtenerEstadoSistema);

module.exports = router;
