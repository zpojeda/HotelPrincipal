import { Navigate } from "react-router-dom";

function tokenNoExpirado(token) {
  try {
    const partes = token.split(".");
    if (partes.length !== 3) return false;
    const payload = JSON.parse(atob(partes[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch { return false; }
}

function ProtectedRoute({ sesion, rolPermitido, children }) {
  if (!sesion?.token || !tokenNoExpirado(sesion.token)) {
    return <Navigate to="/" replace />;
  }
  if (sesion.rol !== rolPermitido) {
    const rutasPorRol = { admin: "/admin", cliente: "/cliente", empleado: "/empleado" };
    return <Navigate to={rutasPorRol[sesion.rol] || "/"} replace />;
  }
  return children;
}

export default ProtectedRoute;
