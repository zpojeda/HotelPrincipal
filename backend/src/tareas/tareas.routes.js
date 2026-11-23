const router=require('express').Router();
const verificarToken=require('../middlewares/verificarToken');const autorizarRoles=require('../middlewares/autorizarRoles');const c=require('./tareas.controller');
router.use(verificarToken);
router.get('/mis-tareas',autorizarRoles('empleado'),c.propias);
router.get('/',autorizarRoles('admin'),c.listar);
router.post('/',autorizarRoles('admin'),c.crear);
router.put('/:id',autorizarRoles('admin'),c.actualizar);
router.patch('/:id/cancelar',autorizarRoles('admin'),c.cancelar);
module.exports=router;
