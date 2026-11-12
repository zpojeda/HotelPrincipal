const express = require("express");
const { registro, login, obtenerPerfil } = require("./auth.controller");
const verificarToken = require("../middlewares/verificarToken");

const router = express.Router();

router.post("/registro", registro);
router.post("/login", login);

// Ruta protegida: requiere un JWT válido
router.get("/me", verificarToken, obtenerPerfil);

module.exports = router;