const API_URL = "http://localhost:3000/api/auth";

// Función reutilizable para enviar solicitudes POST
async function enviarSolicitud(ruta, datos) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  const resultado = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      resultado.mensaje || "Error en la solicitud."
    );
  }

  return resultado;
}

// Iniciar sesión
export function iniciarSesionAPI(correo, password) {
  return enviarSolicitud("/login", {
    correo,
    password
  });
}

// Registrar cliente
export function registrarClienteAPI(datos) {
  return enviarSolicitud("/registro", datos);
}

// Consultar perfil del usuario autenticado
export async function obtenerPerfilAPI(token) {
  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  const resultado = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      resultado.mensaje || "No se pudo consultar el perfil."
    );
  }

  return resultado.usuario;
}