const { z } = require('zod');
const repository = require('./reservas.repository');
function fechaReal(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(valor + 'T00:00:00Z');
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}
const schema = z.object({
  habitacion_id: z.number().int().positive(),
  fecha_entrada: z.string().refine(fechaReal, 'Fecha de entrada inválida'),
  fecha_salida: z.string().refine(fechaReal, 'Fecha de salida inválida')
}).strict().refine(d => d.fecha_salida > d.fecha_entrada, {
  message: 'La salida debe ser posterior a la entrada', path: ['fecha_salida']
});
async function listar(req, res, next) {
  try { res.json({ reservas: await repository.listar() }); }
  catch (error) { next(error); }
}
async function listarPropias(req, res, next) {
  try { res.json({ reservas: await repository.listarPropias(req.usuarioId) }); }
  catch (error) { next(error); }
}
async function habitacionesDisponibles(req, res, next) {
  try { res.json({ habitaciones: await repository.listarHabitacionesActivas() }); }
  catch (error) { next(error); }
}
async function crear(req, res, next) {
  const resultado = schema.safeParse(req.body);
  if (!resultado.success) return res.status(400).json({
    mensaje: 'Datos de reserva inválidos',
    errores: z.flattenError(resultado.error).fieldErrors
  });
  const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  if (resultado.data.fecha_entrada < hoy) return res.status(400).json({
    mensaje: 'No se permiten reservas en fechas pasadas'
  });
  try {
    const reserva = await repository.crear(req.usuarioId, resultado.data);
    res.status(201).json({ mensaje: 'Reserva registrada', reserva });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ mensaje: error.message });
    next(error);
  }
}
async function cancelar(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID de reserva inválido' });
  }
  try {
    const reserva = await repository.cancelar(req.usuarioId, id);
    return res.status(200).json({ mensaje: 'Reserva cancelada correctamente', reserva });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ mensaje: error.message });
    next(error);
  }
}
module.exports = { listar, listarPropias, habitacionesDisponibles, crear, cancelar };
