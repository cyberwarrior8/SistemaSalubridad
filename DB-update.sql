USE SistemaSalubridad;
GO

-- Create table to store Informe PDF content in DB (idempotent)
IF NOT EXISTS (
    SELECT 1 FROM sys.tables t
    WHERE t.name = N'InformeArchivo' AND t.schema_id = SCHEMA_ID(N'dbo')
)
BEGIN
    CREATE TABLE dbo.InformeArchivo (
        id_informe INT NOT NULL PRIMARY KEY,
        contenido_pdf VARBINARY(MAX) NOT NULL,
        nombre_pdf NVARCHAR(255) NULL,
        content_type NVARCHAR(100) NOT NULL DEFAULT N'application/pdf',
        fecha_alta DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_InformeArchivo_Informe FOREIGN KEY (id_informe)
            REFERENCES dbo.Informe(id_informe) ON DELETE CASCADE
    );
END
GO

-- Soft-delete flag on Muestra
IF COL_LENGTH('dbo.Muestra', 'eliminada') IS NULL
BEGIN
    ALTER TABLE dbo.Muestra ADD eliminada BIT NOT NULL DEFAULT 0;
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Muestra_eliminada' AND object_id = OBJECT_ID('dbo.Muestra'))
    CREATE INDEX IX_Muestra_eliminada ON dbo.Muestra(eliminada);
GO

-- 0) Normalizar nombre de columna con carácter especial
IF COL_LENGTH('dbo.Usuario', N'contraseña_hash') IS NOT NULL
BEGIN
    EXEC sp_rename 'dbo.Usuario.[contraseña_hash]', 'contrasena_hash', 'COLUMN';
END
GO

-- 1) Restringir estados permitidos y claves únicas
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Muestra_Estado')
ALTER TABLE dbo.Muestra ADD CONSTRAINT CK_Muestra_Estado CHECK (estado_actual IN (N'Recibida', N'En análisis', N'Evaluada', N'Certificada', N'Devuelta'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Informe_Estado')
ALTER TABLE dbo.Informe ADD CONSTRAINT CK_Informe_Estado CHECK (estado IN (N'Pendiente', N'Validado', N'Devuelto'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Informe_MuestraVersion' AND object_id = OBJECT_ID('dbo.Informe'))
ALTER TABLE dbo.Informe ADD CONSTRAINT UQ_Informe_MuestraVersion UNIQUE (id_muestra, version);
GO

-- 2) Extender datos de Solicitante y Muestra (correo y fecha límite)
IF COL_LENGTH('dbo.Solicitante', 'correo') IS NULL
    ALTER TABLE dbo.Solicitante ADD correo NVARCHAR(150) NULL;
GO

IF COL_LENGTH('dbo.Muestra', 'fecha_limite') IS NULL
    ALTER TABLE dbo.Muestra ADD fecha_limite DATE NULL;
GO

-- Añadir cédula (11 dígitos, única opcional) a Solicitante
IF COL_LENGTH('dbo.Solicitante','cedula') IS NULL
    ALTER TABLE dbo.Solicitante ADD cedula NVARCHAR(11) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Solicitante_cedula')
    CREATE UNIQUE INDEX UX_Solicitante_cedula ON dbo.Solicitante(cedula) WHERE cedula IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Solicitante_cedula_formato')
    ALTER TABLE dbo.Solicitante WITH NOCHECK ADD CONSTRAINT CK_Solicitante_cedula_formato CHECK (cedula IS NULL OR (LEN(cedula)=11 AND cedula NOT LIKE '%[^0-9]%'));
GO


IF EXISTS (SELECT 1 FROM sys.columns WHERE name='cedula' AND object_id = OBJECT_ID('dbo.Solicitante'))
   AND NOT EXISTS (SELECT 1 FROM dbo.Solicitante WHERE cedula IS NULL)
   AND (SELECT is_nullable FROM sys.columns WHERE name='cedula' AND object_id = OBJECT_ID('dbo.Solicitante')) = 1
BEGIN
    ALTER TABLE dbo.Solicitante ALTER COLUMN cedula NVARCHAR(11) NOT NULL;
END

-- Redefinir sp_RegistrarSolicitante para aceptar cédula
IF OBJECT_ID('dbo.sp_RegistrarSolicitante','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RegistrarSolicitante;
GO
CREATE PROCEDURE dbo.sp_RegistrarSolicitante
    @nombre NVARCHAR(150),
    @direccion NVARCHAR(255),
    @contacto NVARCHAR(100),
    @cedula NVARCHAR(11) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF (@cedula IS NOT NULL AND (LEN(@cedula)<>11 OR @cedula LIKE '%[^0-9]%'))
    BEGIN
        RAISERROR('Cédula inválida. Debe ser 11 dígitos numéricos.',16,1);
        RETURN;
    END
    INSERT INTO dbo.Solicitante (nombre_razon_social, direccion, contacto, cedula)
    VALUES (@nombre, @direccion, @contacto, @cedula);
END;
GO

-- Trigger para asignar fecha_limite por defecto (p.ej., +5 días) si no se especifica
IF OBJECT_ID('dbo.TR_Muestra_SetFechaLimite', 'TR') IS NOT NULL DROP TRIGGER dbo.TR_Muestra_SetFechaLimite;
GO
CREATE TRIGGER dbo.TR_Muestra_SetFechaLimite
ON dbo.Muestra
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE m
    SET fecha_limite = DATEADD(DAY, 5, i.fecha_recepcion)
    FROM dbo.Muestra m
    JOIN inserted i ON m.id_muestra = i.id_muestra
    WHERE m.fecha_limite IS NULL;
END;
GO

-- 3) Historial de estados de Muestra + trigger de auditoría de estado
IF OBJECT_ID('dbo.HistorialEstadoMuestra', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.HistorialEstadoMuestra (
        id_historial_estado INT IDENTITY PRIMARY KEY,
        id_muestra INT NOT NULL,
        estado NVARCHAR(50) NOT NULL,
        fecha DATETIME NOT NULL DEFAULT GETDATE(),
        id_usuario INT NULL,
        comentario NVARCHAR(255) NULL,
        FOREIGN KEY (id_muestra) REFERENCES dbo.Muestra(id_muestra),
        FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario(id_usuario)
    );
END
GO

IF OBJECT_ID('dbo.TR_Muestra_LogEstado', 'TR') IS NOT NULL DROP TRIGGER dbo.TR_Muestra_LogEstado;
GO
CREATE TRIGGER dbo.TR_Muestra_LogEstado
ON dbo.Muestra
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(estado_actual)
    BEGIN
        INSERT INTO dbo.HistorialEstadoMuestra (id_muestra, estado, comentario)
        SELECT i.id_muestra, i.estado_actual, N'Cambio automático por actualización de estado'
        FROM inserted i
        JOIN deleted d ON d.id_muestra = i.id_muestra
        WHERE ISNULL(i.estado_actual, N'') <> ISNULL(d.estado_actual, N'');
    END
END;
GO

-- 4) Asignación de pruebas por muestra (plan de ensayos)
IF OBJECT_ID('dbo.MuestraParametroAsignado', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.MuestraParametroAsignado (
        id_muestra INT NOT NULL,
        id_parametro INT NOT NULL,
        estado NVARCHAR(20) NOT NULL DEFAULT N'Pendiente', -- Pendiente | Completado | Omitido
        fecha_asignacion DATETIME NOT NULL DEFAULT GETDATE(),
        id_asignador INT NULL,
        PRIMARY KEY (id_muestra, id_parametro),
        FOREIGN KEY (id_muestra) REFERENCES dbo.Muestra(id_muestra),
        FOREIGN KEY (id_parametro) REFERENCES dbo.Parametro(id_parametro),
        FOREIGN KEY (id_asignador) REFERENCES dbo.Usuario(id_usuario)
    );
END
GO

-- SP para poblar plan de ensayos según tipo de muestra
IF OBJECT_ID('dbo.sp_AsignarPruebasPorTipo', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_AsignarPruebasPorTipo;
GO
CREATE PROCEDURE dbo.sp_AsignarPruebasPorTipo
    @id_muestra INT,
    @id_asignador INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @tipo NVARCHAR(50);
    SELECT @tipo = tipo FROM dbo.Muestra WHERE id_muestra = @id_muestra;

    INSERT INTO dbo.MuestraParametroAsignado (id_muestra, id_parametro, id_asignador)
    SELECT @id_muestra, p.id_parametro, @id_asignador
    FROM dbo.Parametro p
    WHERE p.tipo_muestra = @tipo
      AND NOT EXISTS (
            SELECT 1 FROM dbo.MuestraParametroAsignado a
            WHERE a.id_muestra = @id_muestra AND a.id_parametro = p.id_parametro
      );
END
GO

-- 5) Campos de validación en Ensayo
IF COL_LENGTH('dbo.Ensayo', 'estado') IS NULL
    ALTER TABLE dbo.Ensayo ADD estado NVARCHAR(20) NOT NULL DEFAULT N'Registrado'; -- Registrado | Validado | Rechazado
GO
IF COL_LENGTH('dbo.Ensayo', 'validado_por') IS NULL
    ALTER TABLE dbo.Ensayo ADD validado_por INT NULL CONSTRAINT FK_Ensayo_ValidadoPor FOREIGN KEY (validado_por) REFERENCES dbo.Usuario(id_usuario);
GO
IF COL_LENGTH('dbo.Ensayo', 'fecha_validacion') IS NULL
    ALTER TABLE dbo.Ensayo ADD fecha_validacion DATETIME NULL;
GO

-- 6) Extender ParametroNorma con límites para comparación
IF COL_LENGTH('dbo.ParametroNorma', 'operador') IS NULL
    ALTER TABLE dbo.ParametroNorma ADD operador NVARCHAR(10) NULL; -- <=, <, =, >=, BETWEEN, IN
GO
IF COL_LENGTH('dbo.ParametroNorma', 'limite_minimo') IS NULL
    ALTER TABLE dbo.ParametroNorma ADD limite_minimo DECIMAL(18,6) NULL;
GO
IF COL_LENGTH('dbo.ParametroNorma', 'limite_maximo') IS NULL
    ALTER TABLE dbo.ParametroNorma ADD limite_maximo DECIMAL(18,6) NULL;
GO

-- 7) Notificaciones (cola)
IF OBJECT_ID('dbo.Notificacion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notificacion (
        id_notificacion INT IDENTITY PRIMARY KEY,
        id_muestra INT NULL,
        id_solicitante INT NULL,
        tipo NVARCHAR(50) NOT NULL, -- Plazo | FueraDeNorma | General
        asunto NVARCHAR(200) NOT NULL,
        cuerpo NVARCHAR(MAX) NOT NULL,
        dirigido_a NVARCHAR(150) NULL, -- correo destino
        fecha_programada DATETIME NOT NULL DEFAULT GETDATE(),
        enviada BIT NOT NULL DEFAULT 0,
        fecha_envio DATETIME NULL,
        FOREIGN KEY (id_muestra) REFERENCES dbo.Muestra(id_muestra),
        FOREIGN KEY (id_solicitante) REFERENCES dbo.Solicitante(id_solicitante)
    );
END
GO

-- Trigger: cuando un ensayo se marca fuera de norma, crear notificación
IF OBJECT_ID('dbo.TR_Ensayo_AlertaFueraNorma', 'TR') IS NOT NULL DROP TRIGGER dbo.TR_Ensayo_AlertaFueraNorma;
GO
CREATE TRIGGER dbo.TR_Ensayo_AlertaFueraNorma
ON dbo.Ensayo
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Notificacion (id_muestra, id_solicitante, tipo, asunto, cuerpo, dirigido_a)
    SELECT e.id_muestra,
           m.id_solicitante,
           N'FueraDeNorma',
           N'Resultado fuera de norma',
           CONCAT(N'La muestra ', m.codigo_unico, N' tiene un parámetro fuera de norma.'),
           s.correo
    FROM inserted i
    JOIN dbo.Ensayo e ON e.id_ensayo = i.id_ensayo
    JOIN dbo.Muestra m ON m.id_muestra = e.id_muestra
    JOIN dbo.Solicitante s ON s.id_solicitante = m.id_solicitante
    WHERE i.dentro_norma = 0
      AND s.correo IS NOT NULL;
END
GO

-- 8) Índices recomendados
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Muestra_id_solicitante')
    CREATE INDEX IX_Muestra_id_solicitante ON dbo.Muestra(id_solicitante);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Muestra_estado')
    CREATE INDEX IX_Muestra_estado ON dbo.Muestra(estado_actual);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Ensayo_Muestra')
    CREATE INDEX IX_Ensayo_Muestra ON dbo.Ensayo(id_muestra);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Ensayo_Parametro')
    CREATE INDEX IX_Ensayo_Parametro ON dbo.Ensayo(id_parametro);
GO

-- 9) Ajustes a procedimientos existentes para SLA (opcional)
IF OBJECT_ID('dbo.sp_RegistrarMuestra', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RegistrarMuestra;
GO
CREATE PROCEDURE dbo.sp_RegistrarMuestra
    @tipo NVARCHAR(50),
    @fecha DATE,
    @hora TIME,
    @origen NVARCHAR(150),
    @condiciones NVARCHAR(255),
    @id_solicitante INT,
    @fecha_limite DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET XACT_ABORT ON;
    DECLARE @pref NVARCHAR(4);
    SET @pref = CASE @tipo WHEN N'Agua' THEN N'AG' WHEN N'Alimento' THEN N'AL' WHEN N'Bebida' THEN N'BE' ELSE N'MS' END;
    DECLARE @yyyymmdd NVARCHAR(8) = CONVERT(CHAR(8), @fecha, 112);
    DECLARE @seq INT;
    DECLARE @codigo NVARCHAR(50);

    BEGIN TRAN;
        -- Serializar lectura para evitar duplicados en concurrencia
                -- Secuencia: soportar códigos legados cuyo final no es numérico (evitar error de conversión)
                SELECT @seq = ISNULL(MAX(TRY_CONVERT(INT, RIGHT(codigo_unico, 4))), 0) + 1
                FROM dbo.Muestra WITH (UPDLOCK, HOLDLOCK)
                WHERE tipo = @tipo
                    AND CONVERT(CHAR(8), fecha_recepcion, 112) = @yyyymmdd;

        SET @codigo = @pref + N'-' + @yyyymmdd + N'-' + RIGHT('0000' + CAST(@seq AS NVARCHAR(10)), 4);

        INSERT INTO dbo.Muestra (codigo_unico, tipo, fecha_recepcion, hora_recepcion, origen, condiciones_transporte, id_solicitante, fecha_limite)
        VALUES (@codigo, @tipo, @fecha, @hora, @origen, @condiciones, @id_solicitante, @fecha_limite);

        DECLARE @id_muestra INT = SCOPE_IDENTITY();
        INSERT INTO dbo.HistorialEstadoMuestra (id_muestra, estado, comentario)
        VALUES (@id_muestra, N'Recibida', N'Ingreso al sistema');
    COMMIT TRAN;

    -- Retornar identificadores generados
    SELECT @id_muestra AS id_muestra, @codigo AS codigo_unico;
END;
GO

-- 10) Opcional: tras asignar evaluador, auto-asignar pruebas por tipo
IF OBJECT_ID('dbo.sp_AsignarEvaluador', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_AsignarEvaluador;
GO
CREATE PROCEDURE dbo.sp_AsignarEvaluador
    @id_muestra INT,
    @id_evaluador INT,
    @comentario NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.BitacoraMuestra (id_muestra, id_usuario_responsable, estado, comentario)
    VALUES (@id_muestra, @id_evaluador, N'Asignada', @comentario);

    UPDATE dbo.Muestra
    SET estado_actual = N'En análisis'
    WHERE id_muestra = @id_muestra;

    EXEC dbo.sp_AsignarPruebasPorTipo @id_muestra = @id_muestra, @id_asignador = @id_evaluador;
END;