import { useEffect, useState } from "react"
import Swal from "sweetalert2"
import Sidebar from "../../components/Sidebar"
import TablaTareas from "../../components/TablaTareas"
import { obtenerPerfilAPI } from "../../services/authService"
import "../admin/Dashboard.css"

function EmpleadoDashboard({ empleadoId, onLogout }) {
    const [seccion, setSeccion] = useState("Mis tareas")
    const [empleado, setEmpleado] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let vigente = true

        async function cargarEmpleado() {
            setCargando(true)
            setError("")
            setEmpleado(null)

            try {
                const sesion = JSON.parse(
                    sessionStorage.getItem("sesionHotel") || "null"
                )

                if (!sesion?.token) {
                    throw new Error("No se encontró una sesión válida.")
                }

                const usuario = await obtenerPerfilAPI(sesion.token)

                if (usuario.rol !== "empleado" ||
                    String(usuario.id) !== String(empleadoId)) {
                    throw new Error("No tienes permiso para acceder a este panel.")
                }

                if (vigente) {
                    setEmpleado(usuario)
                }
            } catch (errorCarga) {
                if (vigente) {
                    setError(
                        errorCarga.message ||
                        "No se pudo cargar la cuenta del empleado."
                    )
                }
            } finally {
                if (vigente) {
                    setCargando(false)
                }
            }
        }

        cargarEmpleado()

        return () => {
            vigente = false
        }
    }, [empleadoId])

    const confirmarSalida = async () => {
        const resultado = await Swal.fire({
            title: "¿Deseas cerrar sesión?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, salir",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#344c5c"
        })

        if (resultado.isConfirmed) {
            onLogout()
        }
    }

    if (cargando) {
        return (
            <main className="hp-dashboard hp-main">
                <section className="hp-panel">
                    <p>Consultando información del empleado...</p>
                </section>
            </main>
        )
    }

    if (!empleado) {
        return (
            <main className="hp-dashboard hp-main">
                <section
                    className="hp-panel hp-empleado-inactivo"
                    role="alert"
                >
                    <h1>No se puede acceder al panel</h1>
                    <p>
                        {error ||
                            "No fue posible consultar la cuenta del empleado."}
                    </p>
                    <button
                        type="button"
                        className="btn-nueva-habitacion"
                        onClick={onLogout}
                    >
                        Cerrar sesión
                    </button>
                </section>
            </main>
        )
    }

    return (
        <div className="hp-dashboard">
            <Sidebar
                titulo="Espacio del empleado"
                opciones={["Mis tareas"]}
                seccion={seccion}
                cambiarSeccion={setSeccion}
                cerrarSesion={confirmarSalida}
            />

            <main className="hp-main">
                <header className="hp-header">
                    <div>
                        <p className="hp-eyebrow">PANEL DEL EMPLEADO</p>

                        <h1>Bienvenido, {empleado.nombre}</h1>

                        <p className="hp-subtitle">
                            Consulta tus asignaciones
                        </p>
                    </div>

                    <div className="hp-user">
                        <span className="hp-avatar">
                            {empleado.nombre.charAt(0).toUpperCase()}
                        </span>
                        <span>{empleado.nombre}</span>
                    </div>
                </header>

                <TablaTareas
                    empleadoId={empleadoId}
                    soloLectura
                />

                <footer className="hp-footer">
                    Hotel Paraíso · Panel del empleado
                </footer>
            </main>
        </div>
    )
}

export default EmpleadoDashboard