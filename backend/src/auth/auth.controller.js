const { z } = require("zod");
const { registroSchema } = require("./auth.schema");
const authService = require("./auth.service");

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

        return res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            usuario
        });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ mensaje: error.message });
        }

        console.error(error);
        return res.status(500).json({ mensaje: "Error interno del servidor" });
    }
}

module.exports = { registro };