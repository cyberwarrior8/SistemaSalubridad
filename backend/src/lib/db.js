import sql from 'mssql';
import sqlTrusted from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';

dotenv.config();

let poolPromise;
const trustedConnection = process.env.DB_TRUSTED_CONNECTION === 'true';
const driver = trustedConnection ? sqlTrusted : sql;
const encryptConnection = process.env.DB_ENCRYPT !== 'false';
const trustServerCertificate = process.env.DB_TRUST_SERVER_CERTIFICATE === 'true';
if (process.env.NODE_ENV === 'production' && trustServerCertificate) {
  throw new Error('DB_TRUST_SERVER_CERTIFICATE must be false in production');
}
if (process.env.NODE_ENV === 'production' && !encryptConnection) {
  throw new Error('DB_ENCRYPT must be enabled in production');
}

export function getConfig() {
  if (trustedConnection) {
    return {
        connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${process.env.DB_SERVER || 'localhost'};Database=${process.env.DB_DATABASE || 'SistemaSalubridad'};Trusted_Connection=Yes;Encrypt=${encryptConnection ? 'Yes' : 'No'};TrustServerCertificate=${trustServerCertificate ? 'Yes' : 'No'};`,
      server: process.env.DB_SERVER || 'localhost',
      database: process.env.DB_DATABASE || 'SistemaSalubridad',
      driver: 'msnodesqlv8',
      options: {
        trustedConnection: true,
        encrypt: encryptConnection,
        trustServerCertificate
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };
  }
  return {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'SistemaSalubridad',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    options: {
      encrypt: encryptConnection,
      trustServerCertificate
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
    poolPromise = new driver.ConnectionPool(getConfig())
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

export { driver as sql };

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
