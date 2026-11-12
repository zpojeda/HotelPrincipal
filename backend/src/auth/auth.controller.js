const { z } = require("zod");
const { registroSchema, loginSchema } = require("./auth.schema");
const authService = require("./auth.service");

function responderError(res, error) {
  console.error("Error de autenticación:", error.message);
  return res.status(error.status || 500).json({
    mensaje: error.status ? error.message : "Error interno del servidor"
  });
}

async function registro(req, res) {
  const validacion = registroSchema.safeParse(req.body);
  if (!validacion.success) {
    return res.status(400).json({
      mensaje: "Datos de registro inválidos",
      errores: z.flattenError(validacion.error).fieldErrors
    });
  }
  try {
    const usuario = await authService.registrar(validacion.data);
    return res.status(201).json({ mensaje: "Cuenta creada correctamente", usuario });
  } catch (error) {
    return responderError(res, error);
  }
}

async function login(req, res) {
  const validacion = loginSchema.safeParse(req.body);
  if (!validacion.success) {
    return res.status(400).json({
      mensaje: "Datos de inicio de sesión inválidos",
      errores: z.flattenError(validacion.error).fieldErrors
    });
  }
  try {
    const resultado = await authService.iniciarSesion(validacion.data);
    return res.status(200).json({ mensaje: "Sesión iniciada correctamente", ...resultado });
  } catch (error) {
    return responderError(res, error);
  }
}

module.exports = { registro, login };
