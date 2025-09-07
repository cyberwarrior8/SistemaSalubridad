import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

let poolPromise;

export function getConfig() {
  return {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'SistemaSalubridad',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

export async function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(getConfig())
      .connect()
      .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
      })
      .catch(err => {
        console.error('Database Connection Failed!', err);
        throw err;
      });
  }
  return poolPromise;
}

export { sql };

// Detect the actual password column name in dbo.Usuario: 'contraseña_hash' or 'contrasena_hash'
let cachedPwdColName = null;
export async function getPasswordColumnName(pool = null) {
  if (cachedPwdColName) return cachedPwdColName;
  const p = pool || (await getPool());
  const q = `SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuario') AND name IN (N'contraseña_hash', N'contrasena_hash')`;
  const rs = await p.request().query(q);
  const name = rs.recordset[0]?.name;
  cachedPwdColName = name || 'contrasena_hash';
  return cachedPwdColName;
}
