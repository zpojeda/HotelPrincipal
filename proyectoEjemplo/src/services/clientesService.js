import {peticion} from './hotelAdminAPI';
export const consultarClientes=()=>peticion('/clientes');
export const cambiarEstadoCliente=(id,activo)=>peticion(`/clientes/${id}/estado`,{method:'PATCH',body:JSON.stringify({activo})});
