-- =============================================
-- CREACIÓN DE BASE DE DATOS
-- =============================================
CREATE DATABASE SistemaSalubridad;
GO

USE SistemaSalubridad;
GO

-- =============================================
-- TABLAS PRINCIPALES
-- =============================================

-- ROLES Y USUARIOS
CREATE TABLE Rol (
    id_rol INT IDENTITY PRIMARY KEY,
    nombre_rol NVARCHAR(50) NOT NULL
);

CREATE TABLE Usuario (
    id_usuario INT IDENTITY PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    correo NVARCHAR(100) UNIQUE NOT NULL,
    contraseña_hash NVARCHAR(255) NOT NULL,
    estado BIT DEFAULT 1
);

CREATE TABLE UsuarioRol (
    id_usuario INT,
    id_rol INT,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol)
);

-- SOLICITANTES
CREATE TABLE Solicitante (
    id_solicitante INT IDENTITY PRIMARY KEY,
    nombre_razon_social NVARCHAR(150) NOT NULL,
    direccion NVARCHAR(255),
    contacto NVARCHAR(100)
);

-- MUESTRAS
CREATE TABLE Muestra (
    id_muestra INT IDENTITY PRIMARY KEY,
    codigo_unico NVARCHAR(50) UNIQUE NOT NULL,
    tipo NVARCHAR(50) CHECK (tipo IN ('Agua','Alimento','Bebida')),
    fecha_recepcion DATE NOT NULL,
    hora_recepcion TIME NOT NULL,
    origen NVARCHAR(150),
    condiciones_transporte NVARCHAR(255),
    id_solicitante INT NOT NULL,
    estado_actual NVARCHAR(50) DEFAULT 'Recibida',
    FOREIGN KEY (id_solicitante) REFERENCES Solicitante(id_solicitante)
);

-- BITÁCORA
CREATE TABLE BitacoraMuestra (
    id_bitacora INT IDENTITY PRIMARY KEY,
    id_muestra INT NOT NULL,
    id_usuario_responsable INT NOT NULL,
    fecha_asignacion DATETIME DEFAULT GETDATE(),
    estado NVARCHAR(50),
    comentario NVARCHAR(255),
    FOREIGN KEY (id_muestra) REFERENCES Muestra(id_muestra),
    FOREIGN KEY (id_usuario_responsable) REFERENCES Usuario(id_usuario)
);

-- PARÁMETROS Y ENSAYOS
CREATE TABLE Parametro (
    id_parametro INT IDENTITY PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    tipo_muestra NVARCHAR(50) CHECK (tipo_muestra IN ('Agua','Alimento','Bebida')),
    unidad NVARCHAR(50)
);

CREATE TABLE Ensayo (
    id_ensayo INT IDENTITY PRIMARY KEY,
    id_muestra INT NOT NULL,
    id_parametro INT NOT NULL,
    resultado NVARCHAR(100),
    dentro_norma BIT,
    fecha_registro DATETIME DEFAULT GETDATE(),
    id_evaluador INT NOT NULL,
    FOREIGN KEY (id_muestra) REFERENCES Muestra(id_muestra),
    FOREIGN KEY (id_parametro) REFERENCES Parametro(id_parametro),
    FOREIGN KEY (id_evaluador) REFERENCES Usuario(id_usuario)
);

-- NORMAS
CREATE TABLE NormaReferencia (
    id_norma INT IDENTITY PRIMARY KEY,
    descripcion NVARCHAR(255),
    fuente NVARCHAR(150),
    tipo_muestra NVARCHAR(50)
);

CREATE TABLE ParametroNorma (
    id_parametro INT NOT NULL,
    id_norma INT NOT NULL,
    PRIMARY KEY (id_parametro, id_norma),
    FOREIGN KEY (id_parametro) REFERENCES Parametro(id_parametro),
    FOREIGN KEY (id_norma) REFERENCES NormaReferencia(id_norma)
);

-- INFORMES
CREATE TABLE Informe (
    id_informe INT IDENTITY PRIMARY KEY,
    id_muestra INT NOT NULL,
    version INT NOT NULL,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    id_evaluador INT NOT NULL,
    id_validador INT,
    estado NVARCHAR(50) DEFAULT 'Pendiente', -- Pendiente, Validado, Devuelto
    ruta_pdf NVARCHAR(255),
    FOREIGN KEY (id_muestra) REFERENCES Muestra(id_muestra),
    FOREIGN KEY (id_evaluador) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_validador) REFERENCES Usuario(id_usuario)
);

CREATE TABLE HistorialInforme (
    id_historial INT IDENTITY PRIMARY KEY,
    id_informe INT NOT NULL,
    version INT NOT NULL,
    fecha_modificacion DATETIME DEFAULT GETDATE(),
    id_usuario INT NOT NULL,
    comentario NVARCHAR(255),
    FOREIGN KEY (id_informe) REFERENCES Informe(id_informe),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- AUDITORÍA
CREATE TABLE Auditoria (
    id_auditoria INT IDENTITY PRIMARY KEY,
    id_usuario INT NOT NULL,
    accion NVARCHAR(100) NOT NULL,
    fecha DATETIME DEFAULT GETDATE(),
    detalle NVARCHAR(255),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

-- =============================================
-- STORED PROCEDURES
-- =============================================

-- 1. Registrar un solicitante
CREATE PROCEDURE sp_RegistrarSolicitante
    @nombre NVARCHAR(150),
    @direccion NVARCHAR(255),
    @contacto NVARCHAR(100)
AS
BEGIN
    INSERT INTO Solicitante (nombre_razon_social, direccion, contacto)
    VALUES (@nombre, @direccion, @contacto);
END;
GO

-- 2. Registrar una muestra
CREATE PROCEDURE sp_RegistrarMuestra
    @codigo NVARCHAR(50),
    @tipo NVARCHAR(50),
    @fecha DATE,
    @hora TIME,
    @origen NVARCHAR(150),
    @condiciones NVARCHAR(255),
    @id_solicitante INT
AS
BEGIN
    INSERT INTO Muestra (codigo_unico, tipo, fecha_recepcion, hora_recepcion, origen, condiciones_transporte, id_solicitante)
    VALUES (@codigo, @tipo, @fecha, @hora, @origen, @condiciones, @id_solicitante);
END;
GO

-- 3. Asignar evaluador (Validación)
CREATE PROCEDURE sp_AsignarEvaluador
    @id_muestra INT,
    @id_evaluador INT,
    @comentario NVARCHAR(255)
AS
BEGIN
    INSERT INTO BitacoraMuestra (id_muestra, id_usuario_responsable, estado, comentario)
    VALUES (@id_muestra, @id_evaluador, 'Asignada', @comentario);

    UPDATE Muestra
    SET estado_actual = 'En análisis'
    WHERE id_muestra = @id_muestra;
END;
GO

-- 4. Registrar resultado de ensayo (Evaluador)
CREATE PROCEDURE sp_RegistrarEnsayo
    @id_muestra INT,
    @id_parametro INT,
    @resultado NVARCHAR(100),
    @dentro_norma BIT,
    @id_evaluador INT
AS
BEGIN
    INSERT INTO Ensayo (id_muestra, id_parametro, resultado, dentro_norma, id_evaluador)
    VALUES (@id_muestra, @id_parametro, @resultado, @dentro_norma, @id_evaluador);
END;
GO

-- 5. Crear nuevo informe (Evaluador)
CREATE PROCEDURE sp_CrearInforme
    @id_muestra INT,
    @id_evaluador INT,
    @ruta_pdf NVARCHAR(255)
AS
BEGIN
    DECLARE @version INT;
    SELECT @version = ISNULL(MAX(version), 0) + 1 FROM Informe WHERE id_muestra = @id_muestra;

    INSERT INTO Informe (id_muestra, version, id_evaluador, ruta_pdf)
    VALUES (@id_muestra, @version, @id_evaluador, @ruta_pdf);
END;
GO

-- 6. Validar o devolver informe (Validación)
CREATE PROCEDURE sp_ValidarInforme
    @id_informe INT,
    @id_validador INT,
    @accion NVARCHAR(50), -- 'Validado' o 'Devuelto'
    @comentario NVARCHAR(255)
AS
BEGIN
    UPDATE Informe
    SET estado = @accion,
        id_validador = @id_validador
    WHERE id_informe = @id_informe;

    INSERT INTO HistorialInforme (id_informe, version, id_usuario, comentario)
    SELECT id_informe, version, @id_validador, @comentario
    FROM Informe WHERE id_informe = @id_informe;

    IF @accion = 'Validado'
        UPDATE Muestra SET estado_actual = 'Certificada' WHERE id_muestra = (SELECT id_muestra FROM Informe WHERE id_informe = @id_informe);
    ELSE
        UPDATE Muestra SET estado_actual = 'Devuelta' WHERE id_muestra = (SELECT id_muestra FROM Informe WHERE id_informe = @id_informe);
END;
GO
