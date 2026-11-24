const pool = require('../config/db');

// 1. Reservas agrupadas por estado
const reservasPorEstado = async (req, res) => {
  try {
    const [resultados] = await pool.query(`
      SELECT estado, COUNT(*) AS cantidad
      FROM reservas
      GROUP BY estado
    `);

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar reservas' });
  }
};

// 2. Tareas asignadas a cada empleado
const tareasPorEmpleado = async (req, res) => {
  try {
    const [resultados] = await pool.query(`
      SELECT
        u.nombre AS empleado,
        e.cargo,
        COUNT(t.id) AS cantidad
      FROM empleados e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN tareas t ON t.empleado_id = e.id
      GROUP BY e.id, u.nombre, e.cargo
      ORDER BY cantidad DESC
    `);

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar tareas por empleado' });
  }
};

// 3. Tareas agrupadas por estado
const tareasPorEstado = async (req, res) => {
  try {
    const [resultados] = await pool.query(`
      SELECT estado, COUNT(*) AS cantidad
      FROM tareas
      GROUP BY estado
    `);

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar estados de tareas' });
  }
};

// 4. Habitaciones agrupadas por tipo
const habitacionesPorTipo = async (req, res) => {
  try {
    const [resultados] = await pool.query(`
      SELECT tipo, COUNT(*) AS cantidad
      FROM habitaciones
      GROUP BY tipo
    `);

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar habitaciones' });
  }
};

// Reporte: tareas agrupadas por tipo de actividad
const tareasPorTipo = async (req, res) => {
  try {
    const [resultados] = await pool.query(`
      SELECT tipo, COUNT(*) AS cantidad
      FROM tareas
      GROUP BY tipo
      ORDER BY cantidad DESC
    `);

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al consultar tareas por tipo'
    });
  }
};
module.exports = {
  reservasPorEstado,
  tareasPorEmpleado,
  tareasPorEstado,
  habitacionesPorTipo,
  tareasPorTipo
};