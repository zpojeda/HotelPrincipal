import { useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component'; import Swal from 'sweetalert2';
import FormularioEmpleado from './FormularioEmpleado';
import { consultarEmpleados, crearEmpleado, actualizarEmpleado, cambiarEstadoEmpleado } from '../services/empleadosService';
export default function TablaEmpleados() {
    const [empleados, setEmpleados] = useState([]), [error, setError] = useState(''), [cargando, setCargando] = useState(true), [busqueda, setBusqueda] = useState(''), [editando, setEditando] = useState(null), [mostrar, setMostrar] = useState(false);
    async function cargar() { setCargando(true); try { setEmpleados(await consultarEmpleados()); setError('') } catch (e) { setError(e.message) } finally { setCargando(false) } }
    useEffect(() => { cargar() }, []);
    async function guardar(datos) { try { if (editando) await actualizarEmpleado(editando.id, datos); else await crearEmpleado(datos); setMostrar(false); setEditando(null); await cargar(); await Swal.fire('Empleado guardado', '', 'success') } catch (e) { await Swal.fire('No se pudo guardar', e.message, 'error') } }
    async function cambiar(empleado) { const activo = !Boolean(empleado.activo); const r = await Swal.fire({ title: activo ? '¿Activar empleado?' : '¿Inhabilitar empleado?', showCancelButton: true, icon: 'question' }); if (!r.isConfirmed) return; try { await cambiarEstadoEmpleado(empleado.id, activo); await cargar() } catch (e) { await Swal.fire('Error', e.message, 'error') } }
    const filtrados = useMemo(() => empleados.filter(e => `${e.nombre} ${e.documento} ${e.cargo} ${e.correo}`.toLowerCase().includes(busqueda.toLowerCase())), [empleados, busqueda]);
    const columnas = [{ name: 'Documento', selector: r => r.documento }, { name: 'Nombre', selector: r => r.nombre }, { name: 'Correo', selector: r => r.correo }, { name: 'Teléfono', selector: r => r.telefono }, { name: 'Cargo', selector: r => r.cargo }, { name: 'Estado', selector: r => r.activo ? 'Activo' : 'Inactivo' }, { name: 'Acciones', cell: r => <div className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" onClick={() => { setEditando(r); setMostrar(true) }}>Editar</button><button className="btn btn-sm btn-outline-danger" onClick={() => cambiar(r)}>{r.activo ? 'Inhabilitar' : 'Activar'}</button></div> }];
    return <section className="hp-panel hp-empleados"><div className="hp-panel-header"><div><h2>Gestión de empleados</h2><p>Personal registrado en MySQL.</p></div><button className="btn-nueva-habitacion" onClick={() => { setEditando(null); setMostrar(true) }}>Nuevo empleado</button></div>
        {error && <div className="alert alert-danger">{error}<button className="btn btn-sm ms-2" onClick={cargar}>Reintentar</button></div>}
        {mostrar && <div className="card p-4 mb-4"><h3 className="h5">{editando ? 'Editar empleado' : 'Registrar empleado'}</h3><FormularioEmpleado key={editando?.id ?? 'nuevo'} empleado={editando} guardar={guardar} cancelar={() => setMostrar(false)} /></div>}
        <input className="form-control mb-3" placeholder="Buscar empleado..." value={busqueda} onChange={e => setBusqueda(e.target.value)} /><DataTable columns={columnas} data={filtrados} progressPending={cargando} pagination responsive highlightOnHover noDataComponent="No hay empleados registrados" /></section>
}
