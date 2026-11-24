const router = require('express').Router();

const verificarToken = require('../middlewares/verificarToken');
const autorizarRoles = require('../middlewares/autorizarRoles');

const {
  reservasPorEstado,
  tareasPorEmpleado,
  tareasPorEstado,
  habitacionesPorTipo,
  tareasPorTipo
} = require('./reportes.controller');

// Todas las rutas requieren un JWT válido
router.use(verificarToken);

// Reportes exclusivos del administrador
router.get('/reservas-estado',
  autorizarRoles('admin'), reservasPorEstado);

router.get('/tareas-empleado',
  autorizarRoles('admin'), tareasPorEmpleado);

router.get('/tareas-estado',
  autorizarRoles('admin'), tareasPorEstado);

router.get('/habitaciones-tipo',
  autorizarRoles('admin'), habitacionesPorTipo);

router.get(
  '/tareas-tipo',
  autorizarRoles('admin'),
  tareasPorTipo
);

module.exports = router;