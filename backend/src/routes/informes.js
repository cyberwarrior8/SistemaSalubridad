import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { getPool, sql } from '../lib/db.js';
import { upload } from '../middleware/upload.js';
import path from 'path';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, async (req, res) => {
  try {
    const pool = await getPool();
    const rs = await pool.request().query('SELECT TOP 100 * FROM Informe ORDER BY id_informe DESC');
    res.json(rs.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error listando informes' });
  }
});

router.post(
  '/',
  authRequired,
  requireRoles('Evaluador'),
  body('id_muestra').isInt(),
  body('ruta_pdf').isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id_muestra, ruta_pdf } = req.body;
    const id_evaluador = req.user.sub;

    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id_muestra', sql.Int, id_muestra)
        .input('id_evaluador', sql.Int, id_evaluador)
        .input('ruta_pdf', sql.NVarChar(255), ruta_pdf)
        .execute('sp_CrearInforme');

      res.status(201).json({ message: 'Informe creado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error creando informe' });
    }
  }
);

// Upload de PDF + creación de informe
router.post(
  '/upload',
  authRequired,
  requireRoles('Evaluador'),
  upload.single('pdf'),
  body('id_muestra').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (!req.file) return res.status(400).json({ message: 'Archivo PDF requerido (campo "pdf")' });

    const id_evaluador = req.user.sub;
    const id_muestra = parseInt(req.body.id_muestra, 10);
    const ruta_pdf = `/files/${req.file.filename}`;
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id_muestra', sql.Int, id_muestra)
        .input('id_evaluador', sql.Int, id_evaluador)
        .input('ruta_pdf', sql.NVarChar(255), ruta_pdf)
        .execute('sp_CrearInforme');
      res.status(201).json({ message: 'Informe creado', ruta_pdf });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error creando informe' });
    }
  }
);

router.post(
  '/:id/validar',
  authRequired,
  requireRoles('Validacion'),
  param('id').isInt(),
  body('accion').isIn(['Validado', 'Devuelto']),
  body('comentario').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { accion, comentario } = req.body;
    const id_validador = req.user.sub;

    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id_informe', sql.Int, parseInt(id, 10))
        .input('id_validador', sql.Int, id_validador)
        .input('accion', sql.NVarChar(50), accion)
        .input('comentario', sql.NVarChar(255), comentario || null)
        .execute('sp_ValidarInforme');

      res.json({ message: `Informe ${accion.toLowerCase()}` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error en validación de informe' });
    }
  }
);

export default router;
