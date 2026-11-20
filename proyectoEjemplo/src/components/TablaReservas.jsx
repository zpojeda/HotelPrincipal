
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { createRoot } from "react-dom/client";
import DataTable from "react-data-table-component";
import FormularioReserva from "./FormularioReserva";

import {
  consultarReservas,
  consultarHabitacionesParaReservar,
  crearReservaAPI,
  cancelarReservaAPI
} from "../services/reservasService";

function fechaISO(valor) {
  if (!valor) return "";
  return String(valor).slice(0, 10);
}

function moneda(valor) {
  return `$${Number(valor ?? 0).toLocaleString("es-CO")}`;
}

export default function TablaReservas({ esAdmin = false }) {
  const [reservas, setReservas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const datos = await consultarReservas(esAdmin);
      setReservas(datos);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [esAdmin]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function abrirFormulario() {
    let habitaciones;

    try {
      habitaciones = await consultarHabitacionesParaReservar();
    } catch (e) {
      await Swal.fire(
        "No se pudieron consultar habitaciones",
        e.message,
        "error"
      );
      return;
    }

    const contenedor = document.createElement("div");
    const raiz = createRoot(contenedor);

    let cerrarSolicitado = false;

    const cerrar = () => {
      if (!cerrarSolicitado) {
        cerrarSolicitado = true;
        Swal.close();
      }
    };

    raiz.render(
      <FormularioReserva
        habitaciones={habitaciones}
        cancelar={cerrar}
        guardar={async (datos) => {
          try {
            const respuesta = await crearReservaAPI({
              habitacion_id: Number(datos.habitacionId),
              fecha_entrada: datos.entrada,
              fecha_salida: datos.salida
            });

            cerrar();
            await cargar();

            await Swal.fire({
              icon: "success",
              title: "Reserva registrada",
              text: `Código ${respuesta.reserva?.id ?? "generado"}`,
              confirmButtonColor: "#344c5c"
            });

          } catch (error) {
            await Swal.fire({
              icon: "error",
              title: "No se puede realizar la reserva",
              text: error.message,
              confirmButtonColor: "#344c5c"
            });
          }
        }}
      />
    );

    await Swal.fire({
      title: "Nueva reserva",
      html: contenedor,
      showConfirmButton: false,
      didClose: () => {
        setTimeout(() => raiz.unmount(), 0);
      }
    });
  }

  async function cancelarReserva(reserva) {
    const confirmacion = await Swal.fire({
      title: "¿Cancelar esta reserva?",
      text: `Reserva ${reserva.id}. No se eliminará el registro de MySQL.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar reserva",
      cancelButtonText: "Volver"
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await cancelarReservaAPI(reserva.id);
      await cargar();

      await Swal.fire(
        "Reserva cancelada",
        "La reserva conserva su historial.",
        "success"
      );
    } catch (e) {
      await Swal.fire(
        "No se pudo cancelar",
        e.message,
        "error"
      );
    }
  }

  const columnas = [
    {
      name: "Código",
      selector: r => r.id,
      sortable: true
    },
    {
      name: "Habitación",
      selector: r => r.habitacion,
      sortable: true
    },
    ...(esAdmin
      ? [{
          name: "Cliente",
          selector: r => r.cliente ?? "—"
        }]
      : []),
    {
      name: "Entrada",
      selector: r => fechaISO(r.fecha_entrada),
      sortable: true
    },
    {
      name: "Salida",
      selector: r => fechaISO(r.fecha_salida),
      sortable: true
    },
    {
      name: "Estado",
      selector: r => r.estado,
      sortable: true
    },
    {
      name: "Total",
      selector: r => Number(r.precio_reservado),
      format: r => moneda(r.precio_reservado),
      sortable: true
    },
    ...(!esAdmin
      ? [{
          name: "Acciones",
          cell: r =>
            ["Pendiente", "Confirmada"].includes(r.estado)
              ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => cancelarReserva(r)}
                >
                  Cancelar
                </button>
              )
              : <span className="text-muted">—</span>
        }]
      : [])
  ];

  const filtradas = reservas.filter(r =>
    `${r.id} ${r.habitacion} ${r.estado} ${r.cliente ?? ""}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div className="d-flex justify-content-between mb-3 gap-2">
        <input
          className="form-control"
          style={{ maxWidth: 280 }}
          placeholder="Buscar reserva..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />

        {!esAdmin && (
          <button
            className="btn text-white"
            style={{ backgroundColor: "#344c5c" }}
            onClick={abrirFormulario}
          >
            Reservar habitación
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={cargar}
          >
            Reintentar
          </button>
        </div>
      )}

      <DataTable
        columns={columnas}
        data={filtradas}
        progressPending={cargando}
        pagination
        responsive
        highlightOnHover
        noDataComponent="No hay reservas registradas"
      />
    </div>
  );
}
