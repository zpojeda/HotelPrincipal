import {peticion} from './hotelAdminAPI';
export async function consultarTareas(soloPropias=false){return (await peticion(soloPropias?'/tareas/mis-tareas':'/tareas')).tareas}
export const crearTarea=(datos)=>peticion('/tareas',{method:'POST',body:JSON.stringify(datos)});
export const actualizarTarea=(id,datos)=>peticion(`/tareas/${id}`,{method:'PUT',body:JSON.stringify(datos)});
export const cancelarTareaAPI=(id)=>peticion(`/tareas/${id}/cancelar`,{method:'PATCH'});
