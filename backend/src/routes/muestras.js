import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { getPool, sql } from '../lib/db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();

router.post(
  '/',
  authRequired,
  requireRoles('Registro de Datos'),
  body('codigo').isString().isLength({ min: 3 }),
  body('tipo').isIn(['Agua', 'Alimento', 'Bebida']),
  body('fecha').isISO8601().toDate(),
  body('hora').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body('origen').optional().isString(),
  body('condiciones').optional().isString(),
  body('id_solicitante').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { codigo, tipo, fecha, hora, origen, condiciones, id_solicitante } = req.body;

    try {
      const pool = await getPool();
      await pool
        .request()
        .input('codigo', sql.NVarChar(50), codigo)
        .input('tipo', sql.NVarChar(50), tipo)
        .input('fecha', sql.Date, fecha)
        .input('hora', sql.Time, hora)
        .input('origen', sql.NVarChar(150), origen || null)
        .input('condiciones', sql.NVarChar(255), condiciones || null)
        .input('id_solicitante', sql.Int, id_solicitante)
        .execute('sp_RegistrarMuestra');

      res.status(201).json({ message: 'Muestra registrada' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error registrando muestra' });
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
