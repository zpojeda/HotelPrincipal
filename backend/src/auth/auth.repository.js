const pool = require("../config/db");

async function buscarPorCorreo(correo){
    const [filas] = await pool.execute(
        "SELECT id from usuarios where correo = ?", 
        [correo]
    ); 

    return filas[0] || null;
}

async function obtenerRolCliente() {
      const [filas] = await pool.execute(
        "SELECT id from roles where nombre = ?", 
        ["cliente"]
    ); 
    return filas[0] || null;

}

async function crearUsuario(datos) {
      const [resultado] = await pool.execute(
            `INSERT INTO usuarios 
            (nombre, correo, telefono, password_hash, rol_id)
            VALUES (?, ?, ?, ?, ?)`, 
            
            [
                datos.nombre,
                datos.correo, 
                datos.telefono, 
                datos.passwordHash,
                datos.rolId
            ]
       
    ); 
    return resultado.insertId;
}

module.exports ={
    buscarPorCorreo,
    obtenerRolCliente,
    crearUsuario
};

