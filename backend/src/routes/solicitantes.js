import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getPool, sql } from '../lib/db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();

router.post(
  '/',
  authRequired,
  requireRoles('Registro de Datos'),
  body('nombre').isString().isLength({ min: 2 }),
  body('direccion').optional().isString(),
  body('contacto').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, direccion, contacto } = req.body;
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('nombre', sql.NVarChar(150), nombre)
        .input('direccion', sql.NVarChar(255), direccion || null)
        .input('contacto', sql.NVarChar(100), contacto || null)
        .execute('sp_RegistrarSolicitante');

      res.status(201).json({ message: 'Solicitante registrado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error registrando solicitante' });
    }
  }
);

export default router;
