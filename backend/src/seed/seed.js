import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { getPool, sql, getPasswordColumnName } from '../lib/db.js';

dotenv.config();

async function ensureRole(pool, nombre) {
  await pool
    .request()
    .input('nombre', sql.NVarChar(50), nombre)
    .query(`IF NOT EXISTS (SELECT 1 FROM Rol WHERE nombre_rol = @nombre)
            INSERT INTO Rol (nombre_rol) VALUES (@nombre);`);
}

async function ensureUser(pool, { nombre, correo, password, roles }) {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  const hash = await bcrypt.hash(password, rounds);

  const pwdCol = await getPasswordColumnName(pool);

  // Insert user if not exists (parameterized)
  const req = pool.request();
  req.input('correo', sql.NVarChar(100), correo);
  req.input('nombre', sql.NVarChar(100), nombre);
  req.input('hash', sql.NVarChar(255), hash);
  const userResult = await req.query(`
    IF NOT EXISTS (SELECT 1 FROM Usuario WHERE correo = @correo)
      BEGIN
        INSERT INTO Usuario (nombre, correo, [${pwdCol}], estado)
        VALUES (@nombre, @correo, @hash, 1);
      END
    SELECT id_usuario FROM Usuario WHERE correo = @correo;
  `);
  const idUsuario = userResult.recordset[0].id_usuario;

  // Map roles
  for (const rol of roles) {
    const roleIdResult = await pool
      .request()
      .input('nombre', sql.NVarChar(50), rol)
      .query('SELECT id_rol FROM Rol WHERE nombre_rol = @nombre');
    const idRol = roleIdResult.recordset[0]?.id_rol;
    if (idRol) {
      await pool
        .request()
        .input('id_usuario', sql.Int, idUsuario)
        .input('id_rol', sql.Int, idRol)
        .query(`IF NOT EXISTS (SELECT 1 FROM UsuarioRol WHERE id_usuario = @id_usuario AND id_rol = @id_rol)
                  INSERT INTO UsuarioRol (id_usuario, id_rol) VALUES (@id_usuario, @id_rol);`);
    }
  }
}

async function main() {
  const pool = await getPool();

  const roleNames = ['Registro de Datos', 'Evaluador', 'Validacion'];
  for (const r of roleNames) await ensureRole(pool, r);

  await ensureUser(pool, {
    nombre: 'Registrador',
    correo: 'registrador@example.com',
    password: 'Password!123',
    roles: ['Registro de Datos']
  });
  await ensureUser(pool, {
    nombre: 'Evaluador',
    correo: 'evaluador@example.com',
    password: 'Password!123',
    roles: ['Evaluador']
  });
  await ensureUser(pool, {
    nombre: 'Validador',
    correo: 'validador@example.com',
    password: 'Password!123',
    roles: ['Validacion']
  });

  console.log('Seed completed.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
