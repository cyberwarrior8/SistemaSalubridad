-- Verifica versión actual (opcional)
EXEC sp_helptext 'dbo.sp_RegistrarMuestra';
GO

-- Remueve la versión vieja
IF OBJECT_ID('dbo.sp_RegistrarMuestra','P') IS NOT NULL
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

    DECLARE @pref NVARCHAR(4) =
        CASE @tipo WHEN N'Agua' THEN N'AG'
                   WHEN N'Alimento' THEN N'AL'
                   WHEN N'Bebida' THEN N'BE'
                   ELSE N'MS' END;

    DECLARE @yyyymmdd CHAR(8) = CONVERT(CHAR(8), @fecha, 112);
    DECLARE @seq INT;
    DECLARE @codigo NVARCHAR(50);

    BEGIN TRAN;
        -- Solo considerar códigos ya en el formato con guiones y 4 dígitos finales
        SELECT @seq = ISNULL(MAX(TRY_CONVERT(INT, RIGHT(codigo_unico,4))),0) + 1
        FROM dbo.Muestra WITH (UPDLOCK, HOLDLOCK)
        WHERE tipo = @tipo
          AND CONVERT(CHAR(8), fecha_recepcion, 112) = @yyyymmdd
          AND codigo_unico LIKE '%-[0-9][0-9][0-9][0-9]';

        SET @codigo = @pref + N'-' + @yyyymmdd + N'-' + RIGHT('0000' + CAST(@seq AS NVARCHAR(10)), 4);

        INSERT INTO dbo.Muestra (codigo_unico, tipo, fecha_recepcion, hora_recepcion, origen, condiciones_transporte, id_solicitante, fecha_limite)
        VALUES (@codigo, @tipo, @fecha, @hora, @origen, @condiciones, @id_solicitante, @fecha_limite);

        DECLARE @id_muestra INT = SCOPE_IDENTITY();

        INSERT INTO dbo.HistorialEstadoMuestra (id_muestra, estado, comentario)
        VALUES (@id_muestra, N'Recibida', N'Ingreso al sistema');
    COMMIT TRAN;

    SELECT @id_muestra AS id_muestra, @codigo AS codigo_unico;
END;
GO

EXEC sp_helptext 'dbo.sp_RegistrarMuestra';