import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { getPool, sql } from '../lib/db.js';

const router = Router();
const TIPOS = ['Agua', 'Alimento', 'Bebida Alcoholica'];

// Tipos disponibles
router.get('/tipos', authRequired, requireRoles('Validacion'), (req, res) => {
  res.json(TIPOS);
});

// Listar parámetros con filtros (tipo, q)
router.get(
  '/',
  authRequired,
  requireRoles('Validacion'),
  query('tipo').optional().isString(),
  query('q').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const tipo = (req.query.tipo || '').trim();
    const q = (req.query.q || '').trim();
    try {
      const pool = await getPool();
      const request = pool.request();
      let where = 'WHERE 1=1';
      if (tipo) {
        request.input('tipo', sql.NVarChar(50), tipo);
        where += ' AND p.tipo_muestra = @tipo';
      }
      if (q) {
        request.input('q', sql.NVarChar(200), `%${q}%`);
        where += ' AND (p.nombre LIKE @q OR p.unidad LIKE @q)';
      }
      const rs = await request.query(`
        SELECT p.id_parametro, p.nombre, p.tipo_muestra, p.unidad
        FROM Parametro p
        ${where}
        ORDER BY p.id_parametro DESC;
      `);
      res.json(rs.recordset);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error listando parámetros' });
    }
  }
);

// Crear parámetro
router.post(
  '/',
  authRequired,
  requireRoles('Validacion'),
  body('nombre').isString().notEmpty(),
  body('tipo_muestra').isIn(TIPOS),
  body('unidad').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { nombre, tipo_muestra, unidad } = req.body;
    try {
      const pool = await getPool();
      const rs = await pool
        .request()
        .input('nombre', sql.NVarChar(150), nombre)
        .input('tipo', sql.NVarChar(50), tipo_muestra)
        .input('unidad', sql.NVarChar(50), unidad || null)
        .query(`
          INSERT INTO Parametro (nombre, tipo_muestra, unidad)
          OUTPUT inserted.id_parametro
          VALUES (@nombre, @tipo, @unidad);
        `);
      res.status(201).json({ id_parametro: rs.recordset[0].id_parametro, message: 'Parámetro creado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error creando parámetro' });
    }
  }
);

// Actualizar parámetro
router.put(
  '/:id',
  authRequired,
  requireRoles('Validacion'),
  param('id').isInt(),
  body('nombre').isString().notEmpty(),
  body('tipo_muestra').isIn(TIPOS),
  body('unidad').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = parseInt(req.params.id, 10);
    const { nombre, tipo_muestra, unidad } = req.body;
    try {
      const pool = await getPool();
      await pool
        .request()
        .input('id', sql.Int, id)
        .input('nombre', sql.NVarChar(150), nombre)
        .input('tipo', sql.NVarChar(50), tipo_muestra)
        .input('unidad', sql.NVarChar(50), unidad || null)
        .query('UPDATE Parametro SET nombre = @nombre, tipo_muestra = @tipo, unidad = @unidad WHERE id_parametro = @id');
      res.json({ message: 'Parámetro actualizado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error actualizando parámetro' });
    }
  }
);

// Eliminar parámetro
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
      // Borrar norma asociada primero para evitar FK
      await pool.request().input('id', sql.Int, id).query('DELETE FROM ParametroNorma WHERE id_parametro = @id');
      await pool.request().input('id', sql.Int, id).query('DELETE FROM Parametro WHERE id_parametro = @id');
      res.json({ message: 'Parámetro eliminado' });
    } catch (err) {
      console.error(err);
      if (err?.number === 547) {
        return res.status(409).json({ message: 'No se puede eliminar: parámetro en uso' });
      }
      res.status(500).json({ message: 'Error eliminando parámetro' });
    }
  }
);

// Obtener norma del parámetro
router.get(
  '/:id/norma',
  authRequired,
  requireRoles('Validacion'),
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = parseInt(req.params.id, 10);
    try {
      const pool = await getPool();
      const rs = await pool
        .request()
        .input('id', sql.Int, id)
        .query(`
          SELECT TOP 1 pn.operador, pn.limite_minimo, pn.limite_maximo, pn.id_norma,
                 nr.descripcion, nr.fuente, nr.tipo_muestra
          FROM ParametroNorma pn
          LEFT JOIN NormaReferencia nr ON nr.id_norma = pn.id_norma
          WHERE pn.id_parametro = @id
          ORDER BY pn.id_parametro;
        `);
      res.json(rs.recordset[0] || null);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error obteniendo norma' });
    }
  }
);

// Upsert norma del parámetro
router.put(
  '/:id/norma',
  authRequired,
  requireRoles('Validacion'),
  param('id').isInt(),
  body('operador').isString().notEmpty(),
  body('limite_minimo').optional({ nullable: true }).isFloat(),
  body('limite_maximo').optional({ nullable: true }).isFloat(),
  body('descripcion').optional({ nullable: true }).isString(),
  body('fuente').optional({ nullable: true }).isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id = parseInt(req.params.id, 10);
    const { operador } = req.body;
    const limMin = req.body.limite_minimo === undefined ? null : Number(req.body.limite_minimo);
    const limMax = req.body.limite_maximo === undefined ? null : Number(req.body.limite_maximo);
    const descripcion = req.body.descripcion ?? null;
    const fuente = req.body.fuente ?? null;
    try {
      const pool = await getPool();
      const tx = new sql.Transaction(pool);
      await tx.begin();
      try {
        // Asegurar que el parámetro existe y obtener su tipo
        const pRow = await new sql.Request(tx).input('id', sql.Int, id).query('SELECT tipo_muestra FROM Parametro WHERE id_parametro = @id');
        if (pRow.recordset.length === 0) throw new Error('Parámetro no existe');
        const tipo = pRow.recordset[0].tipo_muestra;

        // Buscar si ya hay ParametroNorma
        const rsPN = await new sql.Request(tx).input('id', sql.Int, id).query('SELECT TOP 1 * FROM ParametroNorma WHERE id_parametro = @id');
        let id_norma = null;
        if (rsPN.recordset.length > 0 && rsPN.recordset[0].id_norma) {
          id_norma = rsPN.recordset[0].id_norma;
          // actualizar norma referencia
          await new sql.Request(tx)
            .input('id_norma', sql.Int, id_norma)
            .input('desc', sql.NVarChar(255), descripcion)
            .input('fuente', sql.NVarChar(255), fuente)
            .input('tipo', sql.NVarChar(50), tipo)
            .query('UPDATE NormaReferencia SET descripcion = @desc, fuente = @fuente, tipo_muestra = @tipo WHERE id_norma = @id_norma');
          // actualizar parámetros de norma
          await new sql.Request(tx)
            .input('id', sql.Int, id)
            .input('operador', sql.NVarChar(50), operador)
            .input('min', sql.Float, limMin)
            .input('max', sql.Float, limMax)
            .query('UPDATE ParametroNorma SET operador = @operador, limite_minimo = @min, limite_maximo = @max WHERE id_parametro = @id');
        } else {
          // crear norma referencia
          const rsNR = await new sql.Request(tx)
            .input('desc', sql.NVarChar(255), descripcion)
            .input('fuente', sql.NVarChar(255), fuente)
            .input('tipo', sql.NVarChar(50), tipo)
            .query('INSERT INTO NormaReferencia (descripcion, fuente, tipo_muestra) OUTPUT inserted.id_norma VALUES (@desc, @fuente, @tipo)');
          id_norma = rsNR.recordset[0].id_norma;
          // crear ParametroNorma
          await new sql.Request(tx)
            .input('id', sql.Int, id)
            .input('id_norma', sql.Int, id_norma)
            .input('operador', sql.NVarChar(50), operador)
            .input('min', sql.Float, limMin)
            .input('max', sql.Float, limMax)
            .query('INSERT INTO ParametroNorma (id_parametro, id_norma, operador, limite_minimo, limite_maximo) VALUES (@id, @id_norma, @operador, @min, @max)');
        }
        await tx.commit();
        res.json({ message: 'Norma actualizada' });
      } catch (e) {
        await tx.rollback();
        throw e;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error actualizando norma' });
    }
  }
);

export default router;
