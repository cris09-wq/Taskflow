const { Router } = require('express');
const controller = require('../controllers/solicitudes.controller');
const { validarCreacionSolicitud, validarActualizacionSolicitud } = require('../middlewares/validateRequest');

const router = Router();

// El orden importa: la ruta de estadísticas debe declararse antes de "/:id"
// para que Express no la interprete como un identificador de solicitud.
router.get('/estadisticas/resumen', controller.estadisticas);

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', validarCreacionSolicitud, controller.crear);
router.put('/:id', validarActualizacionSolicitud, controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;
