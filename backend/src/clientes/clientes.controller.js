const pool = require('../config/db');


async function listar(req, res, next) {
    try {
        const [clientes] = await pool.execute(`SELECT u.id,u.nombre,u.correo,u.telefono,u.activo,COUNT(r.id) AS cantidad_reservas FROM usuarios u JOIN roles rol ON rol.id=u.rol_id AND rol.nombre='cliente' LEFT JOIN reservas r ON r.usuario_id=u.id GROUP BY u.id,u.nombre,u.correo,u.telefono,u.activo ORDER BY u.id DESC`);
        const [reservas] = await pool.execute(`SELECT r.id,r.usuario_id,r.fecha_entrada,r.fecha_salida,r.estado,h.nombre AS habitacion FROM reservas r JOIN usuarios u ON u.id=r.usuario_id JOIN roles rol ON rol.id=u.rol_id AND rol.nombre='cliente' JOIN habitaciones h ON h.id=r.habitacion_id ORDER BY r.id DESC`);
        res.json({ clientes, reservas });
    } catch (e) { next(e) }
}
async function estado(req, res, next) {
    try {
        const id = Number(req.params.id); if (!Number.isSafeInteger(id) || id < 1 || typeof req.body?.activo !== 'boolean') return res.status(400).json({ mensaje: 'ID o estado inválido' });
        const [r] = await pool.execute(`UPDATE usuarios u JOIN roles rol ON rol.id=u.rol_id AND rol.nombre='cliente' SET u.activo=? WHERE u.id=?`, [req.body.activo ? 1 : 0, id]);
        if (!r.affectedRows) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        res.json({ mensaje: 'Estado actualizado' });
    } catch (e) { next(e) }
}
module.exports = { listar, estado };