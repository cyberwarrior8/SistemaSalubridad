import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getPool } from './lib/db.js';
import authRouter from './routes/auth.js';
import solicitantesRouter from './routes/solicitantes.js';
import muestrasRouter from './routes/muestras.js';
import ensayosRouter from './routes/ensayos.js';
import informesRouter from './routes/informes.js';
import usuariosRouter from './routes/usuarios.js';
import parametrosRouter from './routes/parametros.js';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json());
app.use('/files', express.static(path.resolve(process.cwd(), 'uploads')));

// Healthcheck
app.get('/health', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 as ok');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/solicitantes', solicitantesRouter);
app.use('/api/muestras', muestrasRouter);
app.use('/api/ensayos', ensayosRouter);
app.use('/api/informes', informesRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/parametros', parametrosRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
