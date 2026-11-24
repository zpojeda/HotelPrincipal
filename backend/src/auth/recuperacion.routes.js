const router = require('express').Router();

const {
  solicitarRecuperacion,
  restablecerPassword
} = require('./recuperacion.controller');

router.post('/solicitar', solicitarRecuperacion);
router.post('/restablecer', restablecerPassword);

module.exports = router;