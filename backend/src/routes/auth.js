import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPool, sql } from '../lib/db.js';

const router = Router();

router.post(
  '/login',
  body('correo').isEmail(),
  body('password').isString().isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { correo, password } = req.body;

    try {
      const pool = await getPool();
      const userResult = await pool
        .request()
        .input('correo', sql.NVarChar(100), correo)
        .query('SELECT TOP 1 id_usuario, nombre, correo, [contraseña_hash] AS password_hash, estado FROM Usuario WHERE correo = @correo');

      const user = userResult.recordset[0];
      if (!user || user.estado === false || user.estado === 0) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ message: 'Credenciales inválidas' });

      const rolesResult = await pool
        .request()
        .input('id_usuario', sql.Int, user.id_usuario)
        .query('SELECT r.nombre_rol FROM UsuarioRol ur JOIN Rol r ON r.id_rol = ur.id_rol WHERE ur.id_usuario = @id_usuario');
      const roles = rolesResult.recordset.map(r => r.nombre_rol);

      const token = jwt.sign(
        {
          sub: user.id_usuario,
          nombre: user.nombre,
          correo: user.correo,
          roles
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ token, user: { id: user.id_usuario, nombre: user.nombre, correo: user.correo, roles } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error de servidor' });
    }
  }
);

export default router;
