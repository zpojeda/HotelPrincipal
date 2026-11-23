const pool = require('../config/db');
const argon2 = require('argon2');
const { z } = require('zod');
const esquema = z.object({ documento: z.string().trim().min(5).max(20), nombre: z.string().trim().min(2).max(100), correo: z.email().max(254).transform(x => x.toLowerCase()), telefono: z.string().trim().min(7).max(25), cargo: z.string().trim().min(2).max(100), password: z.string().optional(), confirmarPassword: z.string().optional() });
function fallo(mensaje, status = 400) { const e = new Error(mensaje); e.status = status; throw e }
function responder(res, e, next) { if (e.status) return res.status(e.status).json({ mensaje: e.message }); if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'Documento o correo ya registrado' }); next(e) }
async function listar(req, res, next) { try { const [empleados] = await pool.execute(`SELECT e.id,e.usuario_id,e.documento,e.cargo,u.nombre,u.correo,u.telefono,u.activo FROM empleados e JOIN usuarios u ON u.id=e.usuario_id ORDER BY e.id DESC`); res.json({ empleados }) } catch (e) { next(e) } }
async function crear(req, res, next) {
    let conexion; try {
        const v = esquema.safeParse(req.body); if (!v.success) fallo('Datos de empleado inválidos'); const d = v.data;
        if (!d.password || d.password.length < 8 || d.password !== d.confirmarPassword) fallo('Contraseña de mínimo 8 caracteres y confirmación coincidente');
        const hash = await argon2.hash(d.password, { type: argon2.argon2id }); conexion = await pool.getConnection(); await conexion.beginTransaction();
        const [roles] = await conexion.execute(`SELECT id FROM roles WHERE nombre='empleado'`); if (!roles.length) fallo('No existe el rol empleado', 500);
        const [r] = await conexion.execute(`INSERT INTO usuarios (nombre,correo,telefono,password_hash,rol_id,activo) VALUES (?,?,?,?,?,1)`, [d.nombre, d.correo, d.telefono, hash, roles[0].id]);
        await conexion.execute(`INSERT INTO empleados (usuario_id,documento,cargo) VALUES (?,?,?)`, [r.insertId, d.documento, d.cargo]); await conexion.commit(); res.status(201).json({ mensaje: 'Empleado registrado' });
    } catch (e) { if (conexion) await conexion.rollback(); responder(res, e, next) } finally { if (conexion) conexion.release() }
}
async function actualizar(req, res, next) {
    let conexion; try {
        const id = Number(req.params.id); if (!Number.isSafeInteger(id) || id < 1) fallo('ID inválido'); const v = esquema.safeParse(req.body); if (!v.success) fallo('Datos de empleado inválidos'); const d = v.data;
        if (d.password && (d.password.length < 8 || d.password !== d.confirmarPassword)) fallo('La nueva contraseña debe tener 8 caracteres y coincidir');
        const hash = d.password ? await argon2.hash(d.password, { type: argon2.argon2id }) : null;
        conexion = await pool.getConnection(); await conexion.beginTransaction(); const [rows] = await conexion.execute('SELECT usuario_id FROM empleados WHERE id=? FOR UPDATE', [id]); if (!rows.length) fallo('Empleado no encontrado', 404);
        await conexion.execute('UPDATE empleados SET documento=?,cargo=? WHERE id=?', [d.documento, d.cargo, id]);
        if (hash) await conexion.execute('UPDATE usuarios SET nombre=?,correo=?,telefono=?,password_hash=? WHERE id=?', [d.nombre, d.correo, d.telefono, hash, rows[0].usuario_id]);
        else await conexion.execute('UPDATE usuarios SET nombre=?,correo=?,telefono=? WHERE id=?', [d.nombre, d.correo, d.telefono, rows[0].usuario_id]);
        await conexion.commit(); res.json({ mensaje: 'Empleado actualizado' });
    } catch (e) { if (conexion) await conexion.rollback(); responder(res, e, next) } finally { if (conexion) conexion.release() }
}
async function estado(req, res, next) {
    try {
        const id = Number(req.params.id); if (!Number.isSafeInteger(id) || id < 1 || typeof req.body?.activo !== 'boolean') fallo('ID o estado inválido');
        const [r] = await pool.execute(`UPDATE usuarios u JOIN empleados e ON e.usuario_id=u.id SET u.activo=? WHERE e.id=?`, [req.body.activo ? 1 : 0, id]); if (!r.affectedRows) fallo('Empleado no encontrado', 404); res.json({ mensaje: 'Estado actualizado' });
    } catch (e) { responder(res, e, next) }
}
module.exports = { listar, crear, actualizar, estado };
