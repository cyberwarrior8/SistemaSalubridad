import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { getPool, sql } from '../lib/db.js';
import { authRequired, requireRoles } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const router = Router();

// Muestras asignadas al evaluador actual
router.get('/asignadas', authRequired, requireRoles('Evaluador'), async (req, res) => {
  try {
    const pool = await getPool();
    const rs = await pool
      .request()
      .input('id_usuario', sql.Int, req.user.sub)
      .query(`
        SELECT DISTINCT m.*
        FROM Muestra m
        JOIN BitacoraMuestra b ON b.id_muestra = m.id_muestra
        WHERE b.id_usuario_responsable = @id_usuario
          AND m.estado_actual = N'En análisis'
        ORDER BY m.id_muestra DESC;
      `);
    res.json(rs.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error obteniendo asignaciones' });
  }
});

// Parámetros sugeridos por tipo de muestra
router.get('/muestras/:id/parametros', authRequired, requireRoles('Evaluador'), param('id').isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const id = parseInt(req.params.id, 10);
  try {
    const pool = await getPool();
    const tipoRs = await pool.request().input('id', sql.Int, id).query('SELECT tipo FROM Muestra WHERE id_muestra = @id');
    const tipo = tipoRs.recordset[0]?.tipo;
    if (!tipo) return res.status(404).json({ message: 'Muestra no encontrada' });

    // Preferir parámetros asignados específicamente
    const asignados = await pool.request().input('id_muestra', sql.Int, id).query(`
      SELECT p.*,
             pn.operador,
             pn.limite_minimo,
             pn.limite_maximo,
             nr.descripcion AS norma_descripcion,
             nr.fuente AS norma_fuente,
             lastE.resultado AS resultado_guardado,
             lastE.dentro_norma AS dentro_norma_guardado
      FROM MuestraParametroAsignado a
      JOIN Parametro p ON p.id_parametro = a.id_parametro
      LEFT JOIN ParametroNorma pn ON pn.id_parametro = p.id_parametro
      LEFT JOIN NormaReferencia nr ON nr.id_norma = pn.id_norma AND (nr.tipo_muestra = p.tipo_muestra OR nr.tipo_muestra IS NULL)
      OUTER APPLY (
        SELECT TOP 1 e.resultado, e.dentro_norma
        FROM Ensayo e
        WHERE e.id_muestra = @id_muestra AND e.id_parametro = p.id_parametro
        ORDER BY e.id_ensayo DESC
      ) lastE
      WHERE a.id_muestra = @id_muestra
      ORDER BY p.id_parametro;
    `);
    if (asignados.recordset.length > 0) {
      return res.json(asignados.recordset);
    }

    // Si no hay asignados, devolver por tipo de muestra
    const prs = await pool
      .request()
      .input('tipo', sql.NVarChar(50), tipo)
      .input('id_muestra', sql.Int, id)
      .query(`
        SELECT p.*,
               pn.operador,
               pn.limite_minimo,
               pn.limite_maximo,
               nr.descripcion AS norma_descripcion,
               nr.fuente AS norma_fuente,
               lastE.resultado AS resultado_guardado,
               lastE.dentro_norma AS dentro_norma_guardado
        FROM Parametro p
        LEFT JOIN ParametroNorma pn ON pn.id_parametro = p.id_parametro
        LEFT JOIN NormaReferencia nr ON nr.id_norma = pn.id_norma AND (nr.tipo_muestra = p.tipo_muestra OR nr.tipo_muestra IS NULL)
        OUTER APPLY (
          SELECT TOP 1 e.resultado, e.dentro_norma
          FROM Ensayo e
          WHERE e.id_muestra = @id_muestra AND e.id_parametro = p.id_parametro
          ORDER BY e.id_ensayo DESC
        ) lastE
        WHERE p.tipo_muestra = @tipo
        ORDER BY p.id_parametro;
      `);
    res.json(prs.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error obteniendo parámetros' });
  }
});

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

// Ensayos guardados por muestra (último por parámetro)
router.get(
  '/muestras/:id/ensayos',
  authRequired,
  requireRoles('Evaluador'),
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id_muestra = parseInt(req.params.id, 10);
    try {
      const pool = await getPool();
      const rs = await pool
        .request()
        .input('id_muestra', sql.Int, id_muestra)
        .query(`
          SELECT p.id_parametro, p.nombre, e.resultado, e.dentro_norma, e.fecha_registro
          FROM Parametro p
          OUTER APPLY (
            SELECT TOP 1 e.* FROM Ensayo e
            WHERE e.id_muestra = @id_muestra AND e.id_parametro = p.id_parametro
            ORDER BY e.id_ensayo DESC
          ) e
          WHERE e.id_ensayo IS NOT NULL
          ORDER BY p.id_parametro;
        `);
      res.json(rs.recordset);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error obteniendo ensayos' });
    }
  }
);

// Completar evaluación: genera PDF, crea Informe y marca estado
router.post(
  '/muestras/:id/completar',
  authRequired,
  requireRoles('Evaluador'),
  param('id').isInt(),
  body('apto').isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id_muestra = parseInt(req.params.id, 10);
    const id_evaluador = req.user.sub;
    const apto = !!req.body.apto;

    try {
      const pool = await getPool();

      const eRs = await pool
        .request()
        .input('id_muestra', sql.Int, id_muestra)
  .query(`SELECT e.*, p.nombre FROM Ensayo e JOIN Parametro p ON p.id_parametro = e.id_parametro WHERE e.id_muestra = @id_muestra ORDER BY e.id_ensayo`);
  const ensayos = eRs.recordset;
  if (ensayos.length === 0) return res.status(400).json({ message: 'No hay ensayos registrados para esta muestra' });

      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
      const filename = `informe_${id_muestra}_${Date.now()}.pdf`;
      const filepath = path.join(uploadsDir, filename);
      await new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);
        doc.fontSize(16).text('Informe de Evaluación', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Muestra: ${id_muestra}`);
        doc.text(`Evaluador: ${id_evaluador}`);
        doc.moveDown();
  doc.text(`Resultado: ${apto ? 'APTO' : 'NO APTO'}`);
        doc.moveDown();
        doc.text('Parámetros:', { underline: true });
        ensayos.forEach((e) => {
          doc.text(`- ${e.nombre}: ${e.resultado} (${e.dentro_norma ? 'Dentro de norma' : 'Fuera de norma'})`);
        });
        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      const ruta_pdf = `/files/${filename}`;

      await pool
        .request()
        .input('id_muestra', sql.Int, id_muestra)
        .input('id_evaluador', sql.Int, id_evaluador)
        .input('ruta_pdf', sql.NVarChar(255), ruta_pdf)
        .execute('sp_CrearInforme');

      await pool
        .request()
        .input('id_muestra', sql.Int, id_muestra)
        .query(`UPDATE Muestra SET estado_actual = N'En Espera' WHERE id_muestra = @id_muestra`);

  res.json({ message: 'Evaluación completada', apto, ruta_pdf });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error completando evaluación' });
    }
  }
);

export default router;
