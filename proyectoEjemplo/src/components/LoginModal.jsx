import { useState } from "react";
import Swal from "sweetalert2";
import { iniciarSesionAPI, registrarClienteAPI } from "../services/authService";

function LoginModal({ mostrar, cerrar, onLogin }) {
  const [modo, setModo] = useState("login");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [procesando, setProcesando] = useState(false);

  if (!mostrar) return null;

  const iniciarSesion = async (e) => {
    e.preventDefault();
    if (procesando) return;
    setProcesando(true);
    try {
      const resultado = await iniciarSesionAPI(correo.trim().toLowerCase(), password);
      if (!resultado.token || !resultado.usuario?.rol || resultado.usuario?.id == null) {
        throw new Error("La respuesta del servidor no contiene una sesión válida.");
      }
      await Swal.fire({
        icon: "success", title: `¡Bienvenido, ${resultado.usuario.nombre || "usuario"}!`,
        text: "Sesión iniciada correctamente", confirmButtonText: "Continuar",
        confirmButtonColor: "#344c5c"
      });
      onLogin(resultado.usuario.rol, resultado.usuario.id, resultado.token);
      cerrar();
    } catch (error) {
      await Swal.fire({ icon: "error", title: "Acceso denegado", text: error.message,
        confirmButtonText: "Intentar nuevamente", confirmButtonColor: "#344c5c" });
    } finally {
      setProcesando(false);
    }
  };

  const crearCuenta = async (e) => {
    e.preventDefault();
    if (procesando) return;
    if (password.length < 8) {
      await Swal.fire({ icon: "warning", title: "Contraseña demasiado corta",
        text: "Usa al menos 8 caracteres para crear tu cuenta.", confirmButtonColor: "#344c5c" });
      return;
    }
    if (password !== confirmarPassword) {
      await Swal.fire({ icon: "warning", title: "Las contraseñas no coinciden",
        text: "Verifica ambas contraseñas antes de continuar.", confirmButtonColor: "#344c5c" });
      return;
    }
    setProcesando(true);
    try {
      await registrarClienteAPI({ nombre: nombre.trim(), correo: correo.trim().toLowerCase(),
        telefono: telefono.trim(), password });
      await Swal.fire({ icon: "success", title: "Cuenta creada",
        text: "Ahora puedes iniciar sesión con tus credenciales.",
        confirmButtonText: "Continuar", confirmButtonColor: "#344c5c" });
      setModo("login");
      setPassword("");
      setConfirmarPassword("");
    } catch (error) {
      await Swal.fire({ icon: "error", title: "No se pudo crear la cuenta", text: error.message,
        confirmButtonText: "Entendido", confirmButtonColor: "#344c5c" });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content rounded-4 shadow">
          <div className="modal-header border-0">
            <h4 className="modal-title fw-bold">{modo === "login" ? "Bienvenido" : "Crear cuenta"}</h4>
            <button type="button" className="btn-close" onClick={cerrar} />
          </div>
          <div className="modal-body px-4 pb-4">
            <p className="text-muted">{modo === "login" ? "Ingresa a tu cuenta del hotel" : "Regístrate para gestionar tus reservas"}</p>
            {modo === "login" ? (
              <form onSubmit={iniciarSesion}>
                <div className="mb-3">
                  <label className="form-label">Correo electrónico</label>
                  <input type="email" className="form-control" placeholder="correo@ejemplo.com"
                    value={correo} onChange={(e) => setCorreo(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="form-label">Contraseña</label>
                  <input type="password" className="form-control" placeholder="Ingresa tu contraseña"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" disabled={procesando} className="btn w-100 text-white py-2"
                  style={{ backgroundColor: "#6b7017" }}>
                  {procesando ? "Ingresando..." : "Iniciar sesión"}
                </button>
              </form>
            ) : (
              <form onSubmit={crearCuenta}>
                <div className="mb-3">
                  <label className="form-label">Nombre completo</label>
                  <input type="text" className="form-control" autoComplete="name" value={nombre}
                    onChange={(e) => setNombre(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Correo electrónico</label>
                  <input type="email" className="form-control" autoComplete="email" placeholder="correo@ejemplo.com"
                    value={correo} onChange={(e) => setCorreo(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Teléfono</label>
                  <input type="tel" className="form-control" autoComplete="tel" value={telefono}
                    onChange={(e) => setTelefono(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contraseña (mínimo 8 caracteres)</label>
                  <input type="password" className="form-control" autoComplete="new-password" minLength={8}
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="form-label">Confirmar contraseña</label>
                  <input type="password" className="form-control" autoComplete="new-password"
                    value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required />
                </div>
                <button type="submit" disabled={procesando} className="btn w-100 text-white py-2"
                  style={{ backgroundColor: "#6b7017" }}>
                  {procesando ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              </form>
            )}
            <p className="text-center mt-3 mb-0">
              {modo === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <a href="#" onClick={(e) => { e.preventDefault(); if (!procesando) setModo(modo === "login" ? "registro" : "login"); }}>
                {modo === "login" ? "Regístrate" : "Inicia sesión"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
