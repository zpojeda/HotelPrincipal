
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const repository = require("./auth.repository");

function errorConEstado(mensaje, status) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

// Registrar un cliente
async function registrar(datos) {
  const existente = await repository.buscarPorCorreo(datos.correo);

  if (existente) {
    throw errorConEstado("El correo ya está registrado", 409);
  }

  const rol = await repository.obtenerRolCliente();

  if (!rol) {
    throw new Error("No está configurado el rol cliente");
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
      throw errorConEstado("El correo ya está registrado", 409);
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

// Iniciar sesión
async function iniciarSesion(datos) {
  const usuario = await repository.buscarPorCorreo(datos.correo);

  const credencialesInvalidas = errorConEstado(
    "Correo o contraseña incorrectos",
    401
  );

  if (!usuario || !usuario.activo) {
    throw credencialesInvalidas;
  }

  const passwordCorrecta = await argon2.verify(
    usuario.password_hash,
    datos.password
  );

  if (!passwordCorrecta) {
    throw credencialesInvalidas;
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET no está configurada correctamente");
  }

  const token = jwt.sign(
    { rol: usuario.rol },
    process.env.JWT_SECRET,
    {
      subject: String(usuario.id),
      expiresIn: "2h",
      algorithm: "HS256"
    }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      telefono: usuario.telefono,
      rol: usuario.rol
    }
  };
}

// Consultar el usuario autenticado
async function obtenerUsuarioActual(id) {
  const usuario = await repository.buscarPorId(id);

  if (!usuario || !usuario.activo) {
    throw errorConEstado("Usuario no disponible", 401);
  }

  return usuario;
}

module.exports = {
  registrar,
  iniciarSesion,
  obtenerUsuarioActual
};
