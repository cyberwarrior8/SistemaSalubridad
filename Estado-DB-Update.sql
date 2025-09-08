USE SistemaSalubridad;
GO

-- 1) Ver qué valores hay hoy (para chequear tildes/variantes)
SELECT DISTINCT estado_actual FROM dbo.Muestra;

-- 2) Ajustar el CHECK para incluir 'En Espera'
ALTER TABLE dbo.Muestra DROP CONSTRAINT CK_Muestra_Estado;
ALTER TABLE dbo.Muestra ADD CONSTRAINT CK_Muestra_Estado
CHECK (estado_actual IN (
  N'Recibida',
  N'En análisis',  -- ojo con el acento; ajusta si en tu BD es 'En analisis'
  N'En Espera',
  N'Evaluada',     -- se mantiene por compatibilidad/histórico
  N'Validada'
));
-- (Opcional) reforzar el check inmediatamente
ALTER TABLE dbo.Muestra CHECK CONSTRAINT CK_Muestra_Estado;

-- 3) Migrar estados antiguos a 'En Espera'
UPDATE dbo.Muestra
SET estado_actual = N'En Espera'
WHERE estado_actual = N'Evaluada';


-- 4) Procedimiento almacenado para validar o devolver informes
CREATE OR ALTER PROCEDURE dbo.sp_ValidarInforme
    @id_informe   INT,
    @id_validador INT,
    @accion       NVARCHAR(50), -- 'Validado' o 'Devuelto'
    @comentario   NVARCHAR(255) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  -- Actualiza el informe
  UPDATE dbo.Informe
  SET estado = @accion,
      id_validador = @id_validador
  WHERE id_informe = @id_informe;

  -- Historial
  INSERT INTO dbo.HistorialInforme (id_informe, version, id_usuario, comentario)
  SELECT id_informe, version, @id_validador, @comentario
  FROM dbo.Informe
  WHERE id_informe = @id_informe;

  -- Muestra asociada
  DECLARE @id_muestra INT;
  SELECT @id_muestra = i.id_muestra
  FROM dbo.Informe i
  WHERE i.id_informe = @id_informe;

  IF @id_muestra IS NULL
  BEGIN
    RAISERROR(N'Informe no encontrado', 16, 1);
    RETURN;
  END

  IF @accion = N'Validado'
  BEGIN
    UPDATE dbo.Muestra
    SET estado_actual = N'Validada'
    WHERE id_muestra = @id_muestra;
  END
  ELSE IF @accion = N'Devuelto'
  BEGIN
    UPDATE dbo.Muestra
    SET estado_actual = N'En análisis' -- Si en tu BD es 'En analisis', usa exactamente ese texto
    WHERE id_muestra = @id_muestra;
  END
  ELSE
  BEGIN
    RAISERROR(N'Acción no soportada. Use ''Validado'' o ''Devuelto''.', 16, 1);
  END
END
GO

USE SistemaSalubridad;
GO
ALTER TABLE dbo.Muestra DROP CONSTRAINT CK_Muestra_Estado;
ALTER TABLE dbo.Muestra ADD CONSTRAINT CK_Muestra_Estado
CHECK (estado_actual IN (N'Recibida', N'En análisis', N'En Espera', N'Validada'));

UPDATE dbo.Muestra SET estado_actual = N'Validada'   WHERE estado_actual = N'Certificada';
UPDATE dbo.Muestra SET estado_actual = N'En análisis' WHERE estado_actual = N'Devuelta';
UPDATE dbo.Muestra SET estado_actual = N'En Espera'   WHERE estado_actual = N'Evaluada';

CREATE OR ALTER PROCEDURE dbo.sp_ValidarInforme
  @id_informe INT, @id_validador INT, @accion NVARCHAR(50), @comentario NVARCHAR(255)=NULL
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.Informe SET estado=@accion, id_validador=@id_validador WHERE id_informe=@id_informe;
  INSERT INTO dbo.HistorialInforme (id_informe, version, id_usuario, comentario)
    SELECT id_informe, version, @id_validador, @comentario FROM dbo.Informe WHERE id_informe=@id_informe;

  DECLARE @id_muestra INT;
  SELECT @id_muestra = i.id_muestra FROM dbo.Informe i WHERE i.id_informe=@id_informe;
  IF @accion = N'Validado'
    UPDATE dbo.Muestra SET estado_actual = N'Validada'   WHERE id_muestra=@id_muestra;
  ELSE IF @accion = N'Devuelto'
    UPDATE dbo.Muestra SET estado_actual = N'En análisis' WHERE id_muestra=@id_muestra;
END
GO

SELECT TOP 5 * FROM dbo.Informe ORDER BY id_informe DESC;