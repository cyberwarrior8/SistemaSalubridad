import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { getPool, sql } from '../lib/db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = Router();

// Lista de usuarios por rol (e.g., Evaluador)
router.get(
  '/',
  authRequired,
  requireRoles('Validacion'),
  query('rol').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { rol } = req.query;
    try {
      const pool = await getPool();
      const rs = await pool
        .request()
        .input('rol', sql.NVarChar(50), rol)
        .query(`
          SELECT u.id_usuario, u.nombre, u.correo
          FROM Usuario u
          JOIN UsuarioRol ur ON ur.id_usuario = u.id_usuario
          JOIN Rol r ON r.id_rol = ur.id_rol
          WHERE r.nombre_rol = @rol AND u.estado = 1
          ORDER BY u.nombre
        `);
      res.json(rs.recordset);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error listando usuarios' });
    }
  }
);

export default router;