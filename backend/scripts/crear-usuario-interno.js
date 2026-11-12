// Uso local: node scripts/crear-usuario-interno.js admin "Nombre" correo telefono
// También admite rol empleado. No es un endpoint público.
require("dotenv").config();
const argon2 = require("argon2");
const pool = require("../src/config/db");
const readline = require("node:readline/promises");

async function main() {
  const [rol, nombre, correo, telefono] = process.argv.slice(2);
  if (!["admin", "empleado"].includes(rol) || !nombre || !correo || !telefono) {
    throw new Error('Uso: node scripts/crear-usuario-interno.js admin "Nombre" correo telefono');
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let password;
  try { password = await rl.question("Contraseña temporal (mínimo 8 caracteres): "); }
  finally { rl.close(); }
  if (password.length < 8) throw new Error("Contraseña demasiado corta");
  const [roles] = await pool.execute("SELECT id FROM roles WHERE nombre = ?", [rol]);
  if (!roles.length) throw new Error("El rol no existe en MySQL");
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  await pool.execute(
    `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol_id)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre.trim(), correo.trim().toLowerCase(), telefono.trim(), hash, roles[0].id]
  );
  console.log(`Cuenta ${rol} creada correctamente`);
}
main().catch(e => { console.error(e.message); process.exitCode = 1; })
  .finally(() => pool.end());
