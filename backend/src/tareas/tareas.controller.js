const pool = require('../config/db'); const { z } = require('zod');
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => !Number.isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s);
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const schema = z.object({ empleadoId: z.coerce.number().int().positive(), tipo: z.enum(['Recepción', 'Limpieza', 'Mantenimiento', 'Cocina', 'Administración', 'Otra']), piso: z.string().max(30).default(''), habitacion: z.string().max(30).default(''), fecha, horaInicio: hora, horaFin: hora, estado: z.enum(['Pendiente', 'En curso', 'Completada', 'Cancelada']).default('Pendiente') }).refine(x => x.horaInicio < x.horaFin, { message: 'Horario inválido' });
function err(mensaje, status = 400) { const e = new Error(mensaje); e.status = status; throw e }
function responder(res, e, next) { if (e.status) return res.status(e.status).json({ mensaje: e.message }); next(e) }
const consulta = `SELECT t.id,t.empleado_id AS empleadoId,t.tipo,t.piso,t.habitacion,DATE_FORMAT(t.fecha,'%Y-%m-%d') AS fecha,TIME_FORMAT(t.hora_inicio,'%H:%i') AS horaInicio,TIME_FORMAT(t.hora_fin,'%H:%i') AS horaFin,t.estado,u.nombre AS empleado FROM tareas t JOIN empleados e ON e.id=t.empleado_id JOIN usuarios u ON u.id=e.usuario_id`;
async function listar(req, res, next) { try { const [tareas] = await pool.execute(consulta + ' ORDER BY t.fecha,t.hora_inicio'); res.json({ tareas }) } catch (e) { next(e) } }
async function propias(req, res, next) { try { const [tareas] = await pool.execute(consulta + ' WHERE e.usuario_id=? ORDER BY t.fecha,t.hora_inicio', [req.usuarioId]); res.json({ tareas }) } catch (e) { next(e) } }
async function guardar(req, res, next, editar) {
    let c; try {
        const v = schema.safeParse(req.body); if (!v.success) err('Datos de tarea inválidos'); const d = v.data;
        const id = Number(req.params.id); if (editar && (!Number.isSafeInteger(id) || id < 1)) err('ID inválido');
        c = await pool.getConnection(); await c.beginTransaction();
        // Serializa las asignaciones del mismo empleado antes de verificar cruces.
        const [empleados] = await c.execute(`SELECT e.id FROM empleados e JOIN usuarios u ON u.id=e.usuario_id WHERE e.id=? AND u.activo=1 FOR UPDATE`, [d.empleadoId]); if (!empleados.length) err('Empleado inexistente o inactivo', 409);
        if (editar) { const [anteriores] = await c.execute('SELECT id,estado FROM tareas WHERE id=? FOR UPDATE', [id]); if (!anteriores.length) err('Tarea no encontrada', 404); if (anteriores[0].estado === 'Cancelada') err('No se edita una tarea cancelada', 409) }
        if (d.estado !== 'Cancelada') {
            const [cruces] = await c.execute(`SELECT id FROM tareas WHERE empleado_id=? AND fecha=? AND estado<>'Cancelada' AND hora_inicio<? AND hora_fin>? AND id<>? LIMIT 1`, [d.empleadoId, d.fecha, d.horaFin, d.horaInicio, editar ? id : 0]); if (cruces.length) err('Conflicto de horario para este empleado', 409);
        }
        if (editar) await c.execute(`UPDATE tareas SET empleado_id=?,tipo=?,piso=?,habitacion=?,fecha=?,hora_inicio=?,hora_fin=?,estado=? WHERE id=?`, [d.empleadoId, d.tipo, d.piso, d.habitacion, d.fecha, d.horaInicio, d.horaFin, d.estado, id]);
        else await c.execute(`INSERT INTO tareas (empleado_id,tipo,piso,habitacion,fecha,hora_inicio,hora_fin,estado) VALUES (?,?,?,?,?,?,?,?)`, [d.empleadoId, d.tipo, d.piso, d.habitacion, d.fecha, d.horaInicio, d.horaFin, d.estado]);
        await c.commit(); res.status(editar ? 200 : 201).json({ mensaje: editar ? 'Tarea actualizada' : 'Tarea registrada' });
    } catch (e) { if (c) await c.rollback(); responder(res, e, next) } finally { if (c) c.release() }
}
async function crear(req, res, next) { return guardar(req, res, next, false) } async function actualizar(req, res, next) { return guardar(req, res, next, true) }
async function cancelar(req, res, next) { try { const id = Number(req.params.id); if (!Number.isSafeInteger(id) || id < 1) err('ID inválido'); const [r] = await pool.execute(`UPDATE tareas SET estado='Cancelada' WHERE id=? AND estado<>'Cancelada'`, [id]); if (!r.affectedRows) err('Tarea inexistente o cancelada', 409); res.json({ mensaje: 'Tarea cancelada' }) } catch (e) { responder(res, e, next) } }
module.exports = { listar, propias, crear, actualizar, cancelar };
