const argon2 = require("argon2");
const repository = require("./auth.repository");

async function registrar(datos) {
    const existente = await repository.buscarPorCorreo(datos.correo);

    if (existente) {
        const error = new Error("El correo ya existe");
        error.status = 409;
        throw error;
    }

    const rol = await repository.obtenerRolCliente();

    if (!rol) {
        throw new Error("No existe el rol cliente");
    }

    const passwordHash = await argon2.hash(datos.password, {
        type: argon2.argon2id
    });

    let id;

    try {
        id = await repository.crearUsuario({
            nombre: datos.nombre,
            correo: datos.correo,
            telefono: datos.telefono,
            passwordHash,
            rolId: rol.id
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            const conflicto = new Error("El correo ya está registrado");
            conflicto.status = 409;
            throw conflicto;
        }

        throw error;
    }

    return {
        id,
        nombre: datos.nombre,
        correo: datos.correo,
        telefono: datos.telefono,
        rol: "cliente"
    };
}

module.exports = { registrar };