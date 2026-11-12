const pool = require("../config/db");

async function buscarPorCorreo(correo) {
  const [filas] = await pool.execute(
    `SELECT u.id, u.nombre, u.correo, u.telefono, u.password_hash,
            u.activo, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.correo = ?`,
    [correo]
  );
  return filas[0] || null;
}

async function buscarPorId(id) {
  const [filas] = await pool.execute(
    `SELECT u.id, u.nombre, u.correo, u.telefono,
            u.activo, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.id = ?`,
    [id]
  );

  return filas[0] || null;
}

async function obtenerRolCliente() {
  const [filas] = await pool.execute(
    "SELECT id FROM roles WHERE nombre = ?", ["cliente"]
  );
  return filas[0] || null;
}

async function crearUsuario(datos) {
  const [resultado] = await pool.execute(
    `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol_id)
     VALUES (?, ?, ?, ?, ?)`,
    [datos.nombre, datos.correo, datos.telefono, datos.passwordHash, datos.rolId]
  );
  return resultado.insertId;
}

module.exports = {
  buscarPorCorreo,
  buscarPorId,
  obtenerRolCliente,
  crearUsuario
};
