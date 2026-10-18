import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
import { getPool, sql, getPasswordColumnName } from '../lib/db.js';
import { authRequired, csrfRequired, rateLimit } from '../middleware/auth.js';

dotenv.config();

const router = Router();
const sameSite = process.env.COOKIE_SAME_SITE || 'lax';
if (!['lax', 'strict', 'none'].includes(sameSite.toLowerCase())) {
  throw new Error('COOKIE_SAME_SITE must be Lax, Strict, or None');
}
if (sameSite.toLowerCase() === 'none' && process.env.NODE_ENV !== 'production' && process.env.COOKIE_SECURE !== 'true') {
  throw new Error('COOKIE_SECURE=true is required when COOKIE_SAME_SITE=None');
}
const cookieOptions = {
  secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
  sameSite: sameSite.toLowerCase(),
  path: '/api'
};

router.get('/csrf', (_req, res) => {
  const csrfToken = randomBytes(32).toString('hex');
  res.cookie('csrf_token', csrfToken, { ...cookieOptions, httpOnly: false, maxAge: 60 * 60 * 1000 });
  res.json({ csrfToken });
});

router.get('/me', authRequired, (req, res) => {
  const { sub, nombre, correo, roles } = req.user;
  res.json({ user: { id: Number(sub), nombre, correo, roles } });
});

router.post('/logout', authRequired, (_req, res) => {
  res.clearCookie('access_token', { ...cookieOptions, httpOnly: true });
  res.clearCookie('csrf_token', { ...cookieOptions, httpOnly: false });
  res.status(204).end();
});

router.post(
  '/login',
  csrfRequired,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  body('correo').isEmail(),
  body('correo').normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 128 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array().map(error => ({ field: error.path, message: error.msg })) });

    const { correo, password } = req.body;

    try {
      const pool = await getPool();
      const pwdCol = await getPasswordColumnName(pool);
      const userResult = await pool
        .request()
        .input('correo', sql.NVarChar(100), correo.toLowerCase())
        .query(`SELECT TOP 1 id_usuario, nombre, correo, [${pwdCol}] AS password_hash, estado FROM Usuario WHERE correo = @correo`);

      const user = userResult.recordset[0];
      if (!user) {
        await bcrypt.compare(password, '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
        console.warn(JSON.stringify({ event: 'auth.login_failed', reason: 'invalid_credentials' }));
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
      if (user.estado === false || user.estado === 0) {
        console.warn(JSON.stringify({ event: 'auth.login_failed', reason: 'invalid_credentials' }));
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        console.warn(JSON.stringify({ event: 'auth.login_failed', reason: 'invalid_credentials' }));
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

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
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      res.cookie('access_token', token, {
        ...cookieOptions,
        httpOnly: true,
        maxAge: 60 * 60 * 1000
      });
      console.info(JSON.stringify({ event: 'auth.login_succeeded', userId: user.id_usuario }));
      res.json({ user: { id: user.id_usuario, nombre: user.nombre, correo: user.correo, roles } });
    } catch (err) {
      console.error('Login failed due to an internal error:', err);
      res.status(500).json({ message: 'Error de servidor' });
    }
  }
);

export default router;
