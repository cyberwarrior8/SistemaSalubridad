import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { getPool, sql } from '../lib/db.js';
import { upload } from '../middleware/upload.js';
import path from 'path';
import { authRequired, requireRoles } from '../middleware/auth.js';
import fs from 'fs';

const router = Router();

// Helper: construir el payload de datos usado para el PDF
async function buildInformePreviewData(id_muestra) {
  const pool = await getPool();
  // Ensayos con nombre/unidad de parámetro
  const eRs = await pool
    .request()
    .input('id_muestra', sql.Int, id_muestra)
    .query(`
      SELECT e.*, p.nombre, p.unidad
      FROM dbo.Ensayo e
      JOIN dbo.Parametro p ON p.id_parametro = e.id_parametro
      WHERE e.id_muestra = @id_muestra
      ORDER BY e.id_ensayo
    `);
  const ensayos = eRs.recordset || [];

  // Muestra + Solicitante
  const mRs = await pool
    .request()
    .input('id', sql.Int, id_muestra)
    .query(`
      SELECT m.id_muestra,
             m.codigo_unico,
             m.tipo,
             m.condiciones_transporte AS condiciones_transporte,
             m.condiciones_transporte AS condiciones,
             m.fecha_recepcion,
             m.id_solicitante,
             s.nombre_razon_social AS solicitante_nombre,
             s.nombre_razon_social AS nombre_razon_social,
             s.direccion,
             s.contacto,
             s.correo
      FROM dbo.Muestra m
      LEFT JOIN dbo.Solicitante s ON s.id_solicitante = m.id_solicitante
  WHERE m.id_muestra = @id AND m.eliminada = 0
    `);
  const muestra = mRs.recordset[0] || null;

  // Enriquecer con normas
  const ensayosRich = [];
  for (const e of ensayos) {
    const nRs = await pool
      .request()
      .input('id_parametro', sql.Int, e.id_parametro)
      .query(`
        SELECT TOP 1 pn.operador, pn.limite_minimo, pn.limite_maximo, nr.descripcion, nr.fuente
        FROM dbo.ParametroNorma pn
        LEFT JOIN dbo.NormaReferencia nr ON nr.id_norma = pn.id_norma
        WHERE pn.id_parametro = @id_parametro
      `);
    const n = nRs.recordset[0] || {};
    ensayosRich.push({
      id_ensayo: e.id_ensayo,
      id_parametro: e.id_parametro,
      nombre: e.nombre,
      unidad: e.unidad,
      resultado: e.resultado,
      dentro_norma: e.dentro_norma,
      fecha_registro: e.fecha_registro,
      operador: n.operador,
      limite_minimo: n.limite_minimo,
      limite_maximo: n.limite_maximo,
      norma_descripcion: n.descripcion,
      norma_fuente: n.fuente
    });
  }

  const norma_descripcion = ensayosRich.find(x => x.norma_descripcion)?.norma_descripcion || '';
  const norma_fuente = ensayosRich.find(x => x.norma_fuente)?.norma_fuente || '';

  return {
    muestra,
    apto: false,
    ensayos: ensayosRich,
    norma_descripcion,
    norma_fuente,
    qrText: `informe:${id_muestra}:preview`
  };
}

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

// Informes por muestra específica
router.get(
  '/muestra/:id',
  authRequired,
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
        .query('SELECT id_informe, id_muestra, version, estado, fecha_creacion, ruta_pdf FROM Informe WHERE id_muestra = @id_muestra ORDER BY id_informe DESC');
      const rows = (rs.recordset || []).map(r => ({
        ...r,
        download_url: `/api/informes/${r.id_informe}/pdf`
      }));
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error listando informes de la muestra' });
    }
  }
);

// Preview JSON autenticado de los datos que alimentan el PDF
router.get(
  '/muestra/:id/preview',
  authRequired,
  // Permitir tanto Evaluador como Validacion
  (req, res, next) => requireRoles('Evaluador', 'Validacion')(req, res, next),
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id_muestra = parseInt(req.params.id, 10);
    try {
      const data = await buildInformePreviewData(id_muestra);
      if (!data.muestra) return res.status(404).json({ message: 'Muestra no encontrada' });
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error generando preview' });
    }
  }
);

// Variante pública para facilitar ver JSON en el navegador (solo desarrollo)
/*
router.get(
  '/muestra/:id/preview-public',
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id_muestra = parseInt(req.params.id, 10);
    try {
      const data = await buildInformePreviewData(id_muestra);
      if (!data.muestra) return res.status(404).json({ message: 'Muestra no encontrada' });
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error generando preview' });
    }
  }
);
*/


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
  const ruta_pdf = null;
    try {
      const pool = await getPool();
  await pool
        .request()
        .input('id_muestra', sql.Int, id_muestra)
        .input('id_evaluador', sql.Int, id_evaluador)
        .input('ruta_pdf', sql.NVarChar(255), ruta_pdf)
        .execute('sp_CrearInforme');
      // Guardar archivo en DB
      const infoRs = await pool.request().query('SELECT TOP 1 id_informe FROM dbo.Informe WHERE id_muestra = '+id_muestra+' ORDER BY id_informe DESC');
      const id_informe = infoRs.recordset[0]?.id_informe;
      if (id_informe && req.file?.buffer) {
        const buffer = req.file.buffer;
        await pool.request()
          .input('id_informe', sql.Int, id_informe)
          .input('contenido_pdf', sql.VarBinary(sql.MAX), buffer)
          .input('nombre_pdf', sql.NVarChar(255), req.file.originalname || `upload_${Date.now()}.pdf`)
          .query(`
            MERGE dbo.InformeArchivo AS tgt
            USING (SELECT @id_informe AS id_informe) AS src
            ON tgt.id_informe = src.id_informe
            WHEN MATCHED THEN UPDATE SET contenido_pdf = @contenido_pdf, nombre_pdf = @nombre_pdf
            WHEN NOT MATCHED THEN INSERT (id_informe, contenido_pdf, nombre_pdf) VALUES (@id_informe, @contenido_pdf, @nombre_pdf);
          `);
      }
      res.status(201).json({ message: 'Informe creado', id_informe });
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

  // Reflejar estado de la muestra para controlar visibilidad en listados
  // Si Validado -> 'Validada'; si Devuelto -> 'En análisis'
      const estado = accion === 'Validado' ? 'Validada' : 'En análisis';
      await pool
        .request()
        .input('estado', sql.NVarChar(50), estado)
        .input('id_informe', sql.Int, parseInt(id, 10))
        .query(`
          UPDATE m
          SET m.estado_actual = @estado
          FROM Muestra m
          JOIN Informe i ON i.id_muestra = m.id_muestra
          WHERE i.id_informe = @id_informe;
        `);

      res.json({ message: `Informe ${accion.toLowerCase()}` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error en validación de informe' });
    }
  }
);

// Descargar/stream PDF desde la base de datos; cae a filesystem si no existe en DB
router.get(
  '/:id/pdf',
  authRequired,
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const id_informe = parseInt(req.params.id, 10);
    try {
      const pool = await getPool();
      const rs = await pool.request().input('id_informe', sql.Int, id_informe).query(`
        SELECT ia.contenido_pdf, ia.nombre_pdf, i.ruta_pdf
        FROM dbo.Informe i
        LEFT JOIN dbo.InformeArchivo ia ON ia.id_informe = i.id_informe
        WHERE i.id_informe = @id_informe
      `);
      const row = rs.recordset[0];
  if (row?.contenido_pdf) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${row.nombre_pdf || 'informe.pdf'}"`);
        return res.end(row.contenido_pdf);
      }
      return res.status(404).json({ message: 'PDF no encontrado' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error obteniendo PDF' });
    }
  }
);

export default router;
