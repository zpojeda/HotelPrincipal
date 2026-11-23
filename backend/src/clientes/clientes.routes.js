const router = require('express').Router();
const verificarToken = require('../middlewares/verificarToken');
const autorizarRoles = require('../middlewares/autorizarRoles');
const controller = require('./clientes.controller');
router.use(verificarToken, autorizarRoles('admin'));
router.get('/', controller.listar);
router.patch('/:id/estado', controller.estado);
module.exports = router;
