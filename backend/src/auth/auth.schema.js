const { z } = require("zod");

const registroSchema = z.object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio"), 
    correo: z.email("Correo electronico invalido")
    .trim()
    .toLowerCase(), 

    telefono: z.string().trim()
    .min(7, "el telefono debe ser minimo 7 digitos")
    .max(20, "Tiene demasiados numeros "), 

    password : z.string()
     .min(8, "La contraseña debe ser minimo 8 caracteres")
    .max(120, "La contraseña es demasiado larga"), 
});

module.exports = { registroSchema }; 