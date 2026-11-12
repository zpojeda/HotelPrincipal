import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/admin/Dashboard";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import EmpleadoDashboard from "./pages/empleado/EmpleadoDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function leerSesion() {
  try {
    const sesion = JSON.parse(sessionStorage.getItem("sesionHotel") || "null");
    if (!sesion?.token || !sesion?.rol || sesion?.id == null) return null;
    return sesion;
  } catch { return null; }
}

function App() {
  const [sesion, setSesion] = useState(leerSesion);
  const navigate = useNavigate();

  const iniciarSesion = (rol, id, token) => {
    if (!token || !["admin", "cliente", "empleado"].includes(rol) || id == null) return;
    const nuevaSesion = { rol, id, token };
    sessionStorage.setItem("sesionHotel", JSON.stringify(nuevaSesion));
    setSesion(nuevaSesion);
    const rutasPorRol = { admin: "/admin", cliente: "/cliente", empleado: "/empleado" };
    navigate(rutasPorRol[rol]);
  };

  const cerrarSesion = () => {
    setSesion(null);
    sessionStorage.removeItem("sesionHotel");
    localStorage.removeItem("usuarioHotel");
    localStorage.removeItem("usuarioHotelId");
    navigate("/");
  };

  return (
    <Routes>
      <Route path="/" element={<Home onLogin={iniciarSesion} />} />
      <Route path="/admin" element={
        <ProtectedRoute sesion={sesion} rolPermitido="admin">
          <Dashboard onLogout={cerrarSesion} />
        </ProtectedRoute>
      } />
      <Route path="/cliente" element={
        <ProtectedRoute sesion={sesion} rolPermitido="cliente">
          <ClienteDashboard clienteId={sesion?.id} onLogout={cerrarSesion} />
        </ProtectedRoute>
      } />
      <Route path="/empleado" element={
        <ProtectedRoute sesion={sesion} rolPermitido="empleado">
          <EmpleadoDashboard empleadoId={sesion?.id} onLogout={cerrarSesion} />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
