import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getPool, sql } from '../lib/db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();

router.post(
  '/',
  authRequired,
  requireRoles('Evaluador'),
  body('id_muestra').isInt(),
  body('id_parametro').isInt(),
  body('resultado').isString(),
  body('dentro_norma').isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id_muestra, id_parametro, resultado, dentro_norma } = req.body;
    const id_evaluador = req.user.sub;

    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id_muestra', sql.Int, id_muestra)
        .input('id_parametro', sql.Int, id_parametro)
        .input('resultado', sql.NVarChar(100), resultado)
        .input('dentro_norma', sql.Bit, dentro_norma)
        .input('id_evaluador', sql.Int, id_evaluador)
        .execute('sp_RegistrarEnsayo');

      res.status(201).json({ message: 'Ensayo registrado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error registrando ensayo' });
    }
  }
);

export default router;
