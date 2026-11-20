
const pool = require("../config/db");

// 1. LISTAR TODAS LAS RESERVAS (ADMIN)
async function listar() {
  const [filas] = await pool.execute(`
    SELECT r.id, r.fecha_entrada, r.fecha_salida,
           r.estado, r.precio_reservado,
           r.usuario_id, u.nombre AS cliente,
           r.habitacion_id, h.nombre AS habitacion
    FROM reservas r
    JOIN usuarios u ON u.id = r.usuario_id
    JOIN habitaciones h ON h.id = r.habitacion_id
    ORDER BY r.id DESC
  `);

  return filas;
}

// 2. LISTAR RESERVAS DEL CLIENTE AUTENTICADO
async function listarPropias(usuarioId) {
  const [filas] = await pool.execute(
    `SELECT r.id, r.fecha_entrada, r.fecha_salida,
            r.estado, r.precio_reservado,
            r.habitacion_id, h.nombre AS habitacion
     FROM reservas r
     JOIN habitaciones h ON h.id = r.habitacion_id
     WHERE r.usuario_id = ?
     ORDER BY r.id DESC`,
    [usuarioId]
  );

  return filas;
}

// 3. CREAR RESERVA
async function crear(usuarioId, datos) {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // Bloquear la habitación durante la transacción
    const [habitaciones] = await conexion.execute(
      `SELECT id, precio, estado, activo
       FROM habitaciones
       WHERE id = ?
       FOR UPDATE`,
      [datos.habitacion_id]
    );

    const habitacion = habitaciones[0];

    if (
      !habitacion ||
      !habitacion.activo ||
      habitacion.estado !== "Disponible"
    ) {
      const error = new Error(
        "La habitación no está disponible"
      );
      error.status = 409;
      throw error;
    }

    // Verificar reservas que coincidan con las fechas
    const [conflictos] = await conexion.execute(
      `SELECT id
       FROM reservas
       WHERE habitacion_id = ?
         AND estado IN ('Pendiente', 'Confirmada')
         AND fecha_entrada < ?
         AND fecha_salida > ?
       LIMIT 1`,
      [
        datos.habitacion_id,
        datos.fecha_salida,
        datos.fecha_entrada
      ]
    );

    if (conflictos.length > 0) {
      const error = new Error(
        "La habitación ya está reservada para esas fechas"
      );
      error.status = 409;
      throw error;
    }

    // Calcular noches
    const noches = Math.round(
      (
        Date.parse(datos.fecha_salida + "T00:00:00Z") -
        Date.parse(datos.fecha_entrada + "T00:00:00Z")
      ) / 86400000
    );

    // Calcular precio total
    const total = Number(
      (Number(habitacion.precio) * noches).toFixed(2)
    );

    if (!Number.isFinite(total) || total <= 0) {
      const error = new Error(
        "No se pudo calcular el valor de la reserva"
      );
      error.status = 400;
      throw error;
    }

    // Guardar en MySQL
    const [resultado] = await conexion.execute(
      `INSERT INTO reservas
       (
         fecha_entrada,
         fecha_salida,
         estado,
         precio_reservado,
         usuario_id,
         habitacion_id
       )
       VALUES (?, ?, 'Pendiente', ?, ?, ?)`,
      [
        datos.fecha_entrada,
        datos.fecha_salida,
        total,
        usuarioId,
        datos.habitacion_id
      ]
    );

    await conexion.commit();

    return {
      id: resultado.insertId,
      ...datos,
      usuario_id: usuarioId,
      estado: "Pendiente",
      noches,
      precio_reservado: total
    };

  } catch (error) {
    await conexion.rollback();
    throw error;

  } finally {
    conexion.release();
  }
}

// 4. LISTAR HABITACIONES ACTIVAS Y DISPONIBLES
async function listarHabitacionesActivas() {
  const [filas] = await pool.execute(`
    SELECT id, nombre, tipo, precio, estado
    FROM habitaciones
    WHERE activo = 1
      AND estado = 'Disponible'
    ORDER BY id
  `);

  return filas;
}

// 5. CANCELAR RESERVA DEL CLIENTE
async function cancelar(usuarioId, reservaId) {
  // Solo modifica reservas del usuario autenticado
  // que estén pendientes o confirmadas.
  const [resultado] = await pool.execute(
    `UPDATE reservas
     SET estado = 'Cancelada'
     WHERE id = ?
       AND usuario_id = ?
       AND estado IN ('Pendiente', 'Confirmada')`,
    [reservaId, usuarioId]
  );

  if (resultado.affectedRows === 0) {
    const error = new Error(
      "Reserva no encontrada o no se puede cancelar"
    );
    error.status = 409;
    throw error;
  }

  // Consultar la reserva después de cancelarla
  const [filas] = await pool.execute(
    `SELECT id, fecha_entrada, fecha_salida,
            estado, precio_reservado,
            usuario_id, habitacion_id
     FROM reservas
     WHERE id = ?
       AND usuario_id = ?`,
    [reservaId, usuarioId]
  );

  return filas[0];
}

// 6. EXPORTAR FUNCIONES
module.exports = {
  listar,
  listarPropias,
  crear,
  listarHabitacionesActivas,
  cancelar
};
