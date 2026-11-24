
const API_URL = 'http://localhost:3000/api/reportes';

async function consultarReporte(ruta) {
  const sesion = JSON.parse(
    sessionStorage.getItem('sesionHotel') || 'null'
  );

  const token = sesion?.token;

  if (!token) {
    throw new Error('Debes iniciar sesión como administrador');
  }

  const respuesta = await fetch(`${API_URL}/${ruta}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!respuesta.ok) {
    throw new Error(`Error al consultar ${ruta}: ${respuesta.status}`);
  }

  return respuesta.json();
}

export const obtenerReservasPorEstado = () =>
  consultarReporte('reservas-estado');

export const obtenerTareasPorEmpleado = () =>
  consultarReporte('tareas-empleado');

export const obtenerTareasPorTipo = () =>
  consultarReporte('tareas-tipo');

export const obtenerHabitacionesPorTipo = () =>
  consultarReporte('habitaciones-tipo');
