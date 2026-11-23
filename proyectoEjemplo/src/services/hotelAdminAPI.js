const BASE = 'http://localhost:3000/api';
export async function peticion(ruta, opciones = {}) {
    const sesion = JSON.parse(sessionStorage.getItem('sesionHotel') || 'null'); if (!sesion?.token) throw new Error('Inicia sesión nuevamente');
    let respuesta; try { respuesta = await fetch(BASE + ruta, { ...opciones, headers: { Authorization: `Bearer ${sesion.token}`, ...(opciones.body ? { 'Content-Type': 'application/json' } : {}), ...opciones.headers } }) } catch { throw new Error('No se pudo conectar con el backend') }
    const datos = await respuesta.json().catch(() => ({})); if (!respuesta.ok) throw new Error(datos.mensaje || `Error HTTP ${respuesta.status}`); return datos;
}
