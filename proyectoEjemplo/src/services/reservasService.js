const API_URL = "http://localhost:3000/api/reservas";

function tokenActual() {
  const sesion = JSON.parse(sessionStorage.getItem("sesionHotel") || "null");
  if (!sesion?.token) throw new Error("Debes iniciar sesión nuevamente.");
  return sesion.token;
}

async function solicitar(ruta, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${tokenActual()}`,
        ...(opciones.body ? { "Content-Type": "application/json" } : {}),
        ...opciones.headers
      }
    });
  } catch {
    throw new Error("No fue posible conectar con el backend.");
  }
  const resultado = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(resultado.mensaje || `Error HTTP ${respuesta.status}`);
  return resultado;
}

export async function consultarReservas(esAdmin = false) {
  const resultado = await solicitar(esAdmin ? "" : "/mis-reservas");
  return resultado.reservas ?? [];
}

export async function consultarHabitacionesParaReservar() {
  const resultado = await solicitar("/habitaciones");
  return resultado.habitaciones ?? [];
}

export async function crearReservaAPI({ habitacion_id, fecha_entrada, fecha_salida }) {
  return solicitar("", {
    method: "POST",
    body: JSON.stringify({ habitacion_id: Number(habitacion_id), fecha_entrada, fecha_salida })
  });
}

export async function cancelarReservaAPI(id) {
  return solicitar(`/${encodeURIComponent(id)}/cancelar`, { method: 'PATCH' });
}
