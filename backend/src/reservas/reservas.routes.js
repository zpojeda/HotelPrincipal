const express = require('express');
const verificarToken = require('../middlewares/verificarToken');
const autorizarRoles = require('../middlewares/autorizarRoles');
const controller = require('./reservas.controller');
const router = express.Router();
router.use(verificarToken);
router.get(
    "/habitaciones",
    autorizarRoles("cliente"),
    controller.habitacionesDisponibles
);
router.get('/', autorizarRoles('admin'), controller.listar);
router.get('/mis-reservas', autorizarRoles('cliente'), controller.listarPropias);
router.post('/', autorizarRoles('cliente'), controller.crear);
router.patch(
    '/:id/cancelar',
    autorizarRoles('cliente'),
    controller.cancelar
);
module.exports = router;
