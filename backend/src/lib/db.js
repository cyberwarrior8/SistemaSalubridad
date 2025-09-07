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
