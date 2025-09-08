import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { getPool, sql, getPasswordColumnName } from '../lib/db.js';
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

// Lista de roles disponibles
router.get('/roles', authRequired, requireRoles('Validacion'), async (req, res) => {
  try {
    const pool = await getPool();
    const rs = await pool.request().query('SELECT id_rol, nombre_rol FROM Rol ORDER BY nombre_rol');
    res.json(rs.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error listando roles' });
  }
});

// Lista completa de usuarios con sus roles
router.get(
  '/todos',
  authRequired,
  requireRoles('Validacion'),
  query('q').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const q = (req.query.q || '').trim();
    try {
      const pool = await getPool();
      const request = pool.request();
      let where = '';
      if (q) {
        request.input('q', sql.NVarChar(200), `%${q}%`);
        where = 'WHERE (u.nombre LIKE @q OR u.correo LIKE @q)';
      }
      const rs = await request.query(`
        SELECT u.id_usuario, u.nombre, u.correo, u.estado, r.nombre_rol
        FROM Usuario u
        LEFT JOIN UsuarioRol ur ON ur.id_usuario = u.id_usuario
        LEFT JOIN Rol r ON r.id_rol = ur.id_rol
        ${where}
        ORDER BY u.id_usuario DESC, r.nombre_rol ASC;
      `);
      // Agrupar por usuario
      const map = new Map();
      for (const row of rs.recordset) {
        if (!map.has(row.id_usuario)) {
          map.set(row.id_usuario, {
            id_usuario: row.id_usuario,
            nombre: row.nombre,
            correo: row.correo,
            estado: row.estado,
            roles: []
          });
        }
        if (row.nombre_rol) {
          map.get(row.id_usuario).roles.push(row.nombre_rol);
        }
      }
      res.json(Array.from(map.values()));
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error listando usuarios' });
    }
  }
);

// Crear usuario
router.post(
  '/',
  authRequired,
  requireRoles('Validacion'),
  body('nombre').isString().notEmpty(),
  body('correo').isEmail(),
  body('password').isString().isLength({ min: 6 }),
  body('roles').isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, correo, password, roles } = req.body;

    try {
      const pool = await getPool();
      const pwdCol = await getPasswordColumnName(pool);

      // Verificar correo único
      const exists = await pool.request().input('correo', sql.NVarChar(150), correo).query('SELECT 1 FROM Usuario WHERE correo = @correo');
      if (exists.recordset.length > 0) return res.status(409).json({ message: 'Correo ya registrado' });

      const hash = await bcrypt.hash(password, 10);

      // Transacción
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const reqIns = new sql.Request(tx);
        reqIns.input('nombre', sql.NVarChar(150), nombre);
        reqIns.input('correo', sql.NVarChar(150), correo);
        reqIns.input('pwd', sql.NVarChar(255), hash);
        const insertUserQuery = `
          INSERT INTO Usuario (nombre, correo, ${pwdCol}, estado)
          OUTPUT inserted.id_usuario
          VALUES (@nombre, @correo, @pwd, 1);
        `;
        const rsUser = await reqIns.query(insertUserQuery);
        const id_usuario = rsUser.recordset[0].id_usuario;

        // Asignar roles
        for (const roleName of roles) {
          const rReq = new sql.Request(tx);
          rReq.input('id_usuario', sql.Int, id_usuario);
          rReq.input('nombre_rol', sql.NVarChar(50), roleName);
          const rsRol = await rReq.query('SELECT id_rol FROM Rol WHERE nombre_rol = @nombre_rol');
          if (rsRol.recordset.length === 0) throw new Error(`Rol no existe: ${roleName}`);
          const id_rol = rsRol.recordset[0].id_rol;
          await rReq.query(`INSERT INTO UsuarioRol (id_usuario, id_rol) VALUES (@id_usuario, ${id_rol})`);
        }

        await tx.commit();
        res.status(201).json({ id_usuario, message: 'Usuario creado' });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error creando usuario' });
    }
  }
);

// Actualizar usuario
router.put(
  '/:id',
  authRequired,
  requireRoles('Validacion'),
  param('id').isInt(),
  body('nombre').isString().notEmpty(),
  body('correo').isEmail(),
  body('password').optional().isString().isLength({ min: 6 }),
  body('roles').isArray(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id, 10);
    const { nombre, correo, password, roles } = req.body;

    try {
      const pool = await getPool();
      const pwdCol = await getPasswordColumnName(pool);

      // Verificar correo único para otros usuarios
      const exists = await pool
        .request()
        .input('correo', sql.NVarChar(150), correo)
        .input('id', sql.Int, id)
        .query('SELECT 1 FROM Usuario WHERE correo = @correo AND id_usuario <> @id');
      if (exists.recordset.length > 0) return res.status(409).json({ message: 'Correo ya registrado por otro usuario' });

      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        const reqUpd = new sql.Request(tx);
        reqUpd.input('id', sql.Int, id);
        reqUpd.input('nombre', sql.NVarChar(150), nombre);
        reqUpd.input('correo', sql.NVarChar(150), correo);
        let setPwd = '';
        if (password) {
          const hash = await bcrypt.hash(password, 10);
          reqUpd.input('pwd', sql.NVarChar(255), hash);
          setPwd = `, ${pwdCol} = @pwd`;
        }
        await reqUpd.query(`UPDATE Usuario SET nombre = @nombre, correo = @correo${setPwd} WHERE id_usuario = @id`);

        // Reset roles
        await new sql.Request(tx).input('id', sql.Int, id).query('DELETE FROM UsuarioRol WHERE id_usuario = @id');
        for (const roleName of roles) {
          const rReq = new sql.Request(tx);
          rReq.input('id_usuario', sql.Int, id);
          rReq.input('nombre_rol', sql.NVarChar(50), roleName);
          const rsRol = await rReq.query('SELECT id_rol FROM Rol WHERE nombre_rol = @nombre_rol');
          if (rsRol.recordset.length === 0) throw new Error(`Rol no existe: ${roleName}`);
          const id_rol = rsRol.recordset[0].id_rol;
          await rReq.query(`INSERT INTO UsuarioRol (id_usuario, id_rol) VALUES (@id_usuario, ${id_rol})`);
        }

        await tx.commit();
        res.json({ message: 'Usuario actualizado' });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error actualizando usuario' });
    }
  }
);

// Eliminar (soft delete) usuario
router.delete(
  '/:id',
  authRequired,
  requireRoles('Validacion'),
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = parseInt(req.params.id, 10);
    try {
      const pool = await getPool();
      await pool.request().input('id', sql.Int, id).query('UPDATE Usuario SET estado = 0 WHERE id_usuario = @id');
      res.json({ message: 'Usuario desactivado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error eliminando usuario' });
    }
  }
);

// Reactivar usuario (estado = 1)
router.post(
  '/:id/activar',
  authRequired,
  requireRoles('Validacion'),
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = parseInt(req.params.id, 10);
    try {
      const pool = await getPool();
      await pool.request().input('id', sql.Int, id).query('UPDATE Usuario SET estado = 1 WHERE id_usuario = @id');
      res.json({ message: 'Usuario activado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error activando usuario' });
    }
  }
);

export default router;