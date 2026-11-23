import {peticion} from './hotelAdminAPI';
export async function consultarEmpleados(){return (await peticion('/empleados')).empleados}
export const crearEmpleado=(datos)=>peticion('/empleados',{method:'POST',body:JSON.stringify(datos)});
export const actualizarEmpleado=(id,datos)=>peticion(`/empleados/${id}`,{method:'PUT',body:JSON.stringify(datos)});
export const cambiarEstadoEmpleado=(id,activo)=>peticion(`/empleados/${id}/estado`,{method:'PATCH',body:JSON.stringify({activo})});
