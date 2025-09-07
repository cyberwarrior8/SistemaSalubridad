import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { getPool, sql } from '../lib/db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();

function parseTimeToDate(horaStr) {
  if (!horaStr || typeof horaStr !== 'string') return null;
  const parts = horaStr.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parts.length >= 3 ? parseInt(parts[2], 10) : 0;
  if ([h, m, s].some(n => Number.isNaN(n))) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;
  // Use local time, date part irrelevant for SQL TIME
  return new Date(1970, 0, 1, h, m, s, 0);
}

// Listado básico de muestras
router.get('/', authRequired, async (req, res) => {
  try {
    const pool = await getPool();
    const rs = await pool.request().query('SELECT TOP 100 * FROM Muestra ORDER BY id_muestra DESC');
    res.json(rs.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error listando muestras' });
  }
});

// Muestras pendientes por asignar (estado Recibida)
router.get('/pendientes', authRequired, requireRoles('Validacion'), async (req, res) => {
  try {
    const pool = await getPool();
    const rs = await pool.request().query(`
      SELECT m.*
      FROM Muestra m
      WHERE m.estado_actual = N'Recibida'
      ORDER BY m.fecha_recepcion DESC, m.id_muestra DESC
    `);
    res.json(rs.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error listando pendientes' });
  }
});

// Muestras en análisis con evaluador asignado (última asignación)
router.get('/en-analisis', authRequired, requireRoles('Validacion'), async (req, res) => {
  try {
    const pool = await getPool();
    const rs = await pool.request().query(`
      SELECT m.*, u.id_usuario AS id_evaluador, u.nombre AS evaluador_nombre, u.correo AS evaluador_correo
      FROM Muestra m
      OUTER APPLY (
        SELECT TOP 1 b.id_usuario_responsable
        FROM BitacoraMuestra b
        WHERE b.id_muestra = m.id_muestra
        ORDER BY b.fecha_asignacion DESC, b.id_bitacora DESC
      ) last_b
      LEFT JOIN Usuario u ON u.id_usuario = last_b.id_usuario_responsable
      WHERE m.estado_actual = N'En análisis'
      ORDER BY m.fecha_recepcion DESC, m.id_muestra DESC;
    `);
    res.json(rs.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error listando en análisis' });
  }
});

router.post(
  '/',
  authRequired,
  requireRoles('Registro de Datos'),
  body('codigo')
    .trim()
    .notEmpty().withMessage('El código es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('El código debe tener entre 3 y 50 caracteres'),
  body('tipo')
    .isIn(['Agua', 'Alimento', 'Bebida']).withMessage('Tipo inválido'),
  body('fecha')
    .isISO8601().withMessage('Fecha inválida')
    .toDate(),
  body('hora')
    .matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Hora inválida (HH:mm)'),
  body('origen').optional().isString().isLength({ max: 150 }).withMessage('Origen debe tener máximo 150 caracteres'),
  body('condiciones').optional().isString().isLength({ max: 255 }).withMessage('Condiciones debe tener máximo 255 caracteres'),
  body('id_solicitante').isInt().withMessage('Solicitante inválido'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { codigo, tipo, fecha, hora, origen, condiciones, id_solicitante } = req.body;

    // Normalizar y convertir hora a Date para tipo TIME
    const normalizedHora = /^\d{2}:\d{2}$/.test(hora) ? `${hora}:00` : hora;
    const horaDate = parseTimeToDate(normalizedHora);
    if (!horaDate) {
      return res.status(400).json({ message: 'Hora inválida (use HH:mm)' });
    }

    try {
      const pool = await getPool();
      await pool
        .request()
        .input('codigo', sql.NVarChar(50), codigo)
        .input('tipo', sql.NVarChar(50), tipo)
        .input('fecha', sql.Date, fecha)
  .input('hora', sql.Time, horaDate)
        .input('origen', sql.NVarChar(150), origen || null)
        .input('condiciones', sql.NVarChar(255), condiciones || null)
        .input('id_solicitante', sql.Int, id_solicitante)
        .execute('sp_RegistrarMuestra');

      res.status(201).json({ message: 'Muestra registrada' });
    } catch (err) {
      console.error(err);
      // SQL Server error mapping
      // 2627/2601: Unique violation, 8152/2628: String truncation, 547: Constraint violation (FK/CHECK)
  const number = err?.number || err?.originalError?.info?.number
      if (number === 2627 || number === 2601) {
        return res.status(409).json({ message: 'El código de muestra ya existe' });
      }
      if (number === 8152 || number === 2628) {
        return res.status(400).json({ message: 'Longitud de campo excedida (código ≤ 50, origen ≤ 150, condiciones ≤ 255)' });
      }
      if (number === 547) {
        return res.status(400).json({ message: 'Violación de restricción (verifique tipo, solicitante o valores permitidos)' });
      }
      if (err?.code === 'EPARAM') {
        return res.status(400).json({ message: 'Hora inválida (formato HH:mm)' });
      }
      if (number === 2812) {
        return res.status(500).json({ message: 'No se encontró el procedimiento almacenado sp_RegistrarMuestra' });
      }
      if (number === 229) {
        return res.status(403).json({ message: 'Permiso denegado al ejecutar sp_RegistrarMuestra' });
      }
  const details = err?.originalError?.info?.message || err?.message;
  res.status(500).json({ message: 'Error registrando muestra', code: number, details: process.env.NODE_ENV !== 'production' ? details : undefined });
    }
  }
);

router.post(
  '/:id/asignar',
  authRequired,
  requireRoles('Validacion'),
  param('id').isInt(),
  body('id_evaluador').isInt(),
  body('comentario').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { id_evaluador, comentario } = req.body;

    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id_muestra', sql.Int, parseInt(id, 10))
        .input('id_evaluador', sql.Int, id_evaluador)
        .input('comentario', sql.NVarChar(255), comentario || null)
        .execute('sp_AsignarEvaluador');

      res.json({ message: 'Evaluador asignado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error asignando evaluador' });
    }
  }
);

export default router;
