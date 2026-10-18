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
import multer from 'multer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const corsOrigins = (process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173'))
  .split(',').map(origin => origin.trim()).filter(Boolean);
if (corsOrigins.length === 0 || corsOrigins.includes('*')) {
  throw new Error('Set CORS_ORIGIN to an explicit comma-separated origin allowlist');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters');
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Cache-Control', 'no-store');
  if (process.env.NODE_ENV === 'production' || req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));
app.use(express.json({ limit: '256kb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '32kb', parameterLimit: 100 }));

// Healthcheck
app.get('/health', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 as ok');
    res.json({ ok: true });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({ ok: false });
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
  if (res.headersSent) return next(err);
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'PDF exceeds the 5 MB limit' });
  }
  if (err?.code === 'INVALID_PDF_TYPE') {
    return res.status(415).json({ message: 'Only PDF files are accepted' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }
  console.error('Unhandled request error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
