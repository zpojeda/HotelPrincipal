
import { useEffect, useState } from 'react';

import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

import { Doughnut, Bar } from 'react-chartjs-2';

import {
  obtenerReservasPorEstado,
  obtenerTareasPorEmpleado,
  obtenerTareasPorTipo,
  obtenerHabitacionesPorTipo
} from '../services/reportesService';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function Reportes() {
  const [reportes, setReportes] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarReportes() {
      try {
        const [
          reservas,
          empleados,
          tareas,
          habitaciones
        ] = await Promise.all([
          obtenerReservasPorEstado(),
          obtenerTareasPorEmpleado(),
          obtenerTareasPorTipo(),
          obtenerHabitacionesPorTipo()
        ]);

        setReportes({
          reservas,
          empleados,
          tareas,
          habitaciones
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    cargarReportes();
  }, []);

  if (cargando) {
    return <p>Cargando reportes...</p>;
  }

  if (error) {
    return <p className="alert alert-danger">{error}</p>;
  }

  if (!reportes) {
    return <p>No hay información disponible.</p>;
  }

  // Gráfico 1: reservas por estado
  const graficoReservas = {
    labels: reportes.reservas.map(r => r.estado),
    datasets: [{
      label: 'Reservas',
      data: reportes.reservas.map(r => Number(r.cantidad)),
      backgroundColor: [
        '#D4A373',
        '#344C5C',
        '#A8B5A2',
        '#C97C7C'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Gráfico 2: tareas por empleado
  const graficoEmpleados = {
    labels: reportes.empleados.map(e => e.empleado),
    datasets: [{
      label: 'Tareas asignadas',
      data: reportes.empleados.map(e => Number(e.cantidad)),
      backgroundColor: '#344C5C',
      borderRadius: 6
    }]
  };

  // Gráfico 3: tareas por tipo
  const graficoTareas = {
    labels: reportes.tareas.map(t => t.tipo),
    datasets: [{
      label: 'Cantidad de tareas',
      data: reportes.tareas.map(t => Number(t.cantidad)),
      backgroundColor: '#A8B5A2',
      borderRadius: 6
    }]
  };

  // Gráfico 4: habitaciones por tipo
  const graficoHabitaciones = {
    labels: reportes.habitaciones.map(h => h.tipo),
    datasets: [{
      label: 'Habitaciones',
      data: reportes.habitaciones.map(h => Number(h.cantidad)),
      backgroundColor: '#D4A373',
      borderRadius: 6
    }]
  };

  const opcionesDona = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        enabled: true
      }
    }
  };

  const opcionesBarras = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const estiloTarjeta = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    minWidth: 0
  };

  return (
    <div style={{ padding: '12px 0' }}>

      <h2 style={{ marginBottom: '24px' }}>
        Reportes del Hotel Paraíso
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '24px'
        }}
      >

        {/* Gráfico 1 */}
        <div style={estiloTarjeta}>
          <h5>Reservas por estado</h5>
          <div style={{ height: '250px' }}>
            <Doughnut
              data={graficoReservas}
              options={opcionesDona}
            />
          </div>
        </div>

        {/* Gráfico 2 */}
        <div style={estiloTarjeta}>
          <h5>Tareas por empleado</h5>
          <div style={{ height: '250px' }}>
            <Bar
              data={graficoEmpleados}
              options={opcionesBarras}
            />
          </div>
        </div>

        {/* Gráfico 3 */}
        <div style={estiloTarjeta}>
          <h5>Tareas por tipo de actividad</h5>
          <div style={{ height: '250px' }}>
            <Bar
              data={graficoTareas}
              options={opcionesBarras}
            />
          </div>
        </div>

        {/* Gráfico 4 */}
        <div style={estiloTarjeta}>
          <h5>Habitaciones por tipo</h5>
          <div style={{ height: '250px' }}>
            <Bar
              data={graficoHabitaciones}
              options={opcionesBarras}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
