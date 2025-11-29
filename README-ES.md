# Sistema Salubridad

Plataforma web para registro, evaluación y validación de muestras (agua, alimentos y bebidas) con generación de informes en PDF.

- Backend: Node.js + Express + SQL Server (mssql), JWT auth, plantillas EJS + Puppeteer para PDF, almacenamiento de PDFs en Base de Datos.
- Frontend: React + Vite.
- Base de Datos: SQL Server con procedimientos almacenados y triggers auxiliares.

## Características clave
- Registro de solicitantes con cédula única (11 dígitos), muestras y parámetros.
- Asignación de muestras a evaluadores y registro de ensayos/Resultados.
- Generación de informes PDF (render a HTML con EJS -> PDF con Puppeteer, fallback PDFKit), guardados como VARBINARY en tabla `InformeArchivo`.
- Descarga/visualización protegida de PDFs vía endpoint autenticado.
- Código de muestra generado automáticamente por tipo y fecha: `AG|AL|BE-yyyymmdd-####`.

## Requisitos
- Node.js 18+
- SQL Server 2019+ (o Azure SQL)
- PowerShell (Windows) o Bash (Linux/macOS)

## Estructura del repositorio
```
backend/        API Express y lógica de negocio
frontend/       Aplicación React (Vite)
*.sql           Scripts de BD (creación, updates, seeds)
```

## Configuración de Base de Datos
1) Crear BD y objetos iniciales:
- Ejecuta `SistemaSalubridad-BD.sql` en tu instancia SQL Server para crear tablas básicas y SPs iniciales.

2) Aplicar actualizaciones:
- Ejecuta `DB-update.sql` para:
  - Tabla `InformeArchivo` para PDFs (VARBINARY).
  - Soft-delete `Muestra.eliminada` + índices.
  - Triggers e historial de estados de muestra.
  - Procedimiento `sp_RegistrarMuestra` con generación de `codigo_unico` automática y robustez ante códigos legados.
  - Procedimiento `sp_RegistrarSolicitante` con `@cedula` (11 dígitos) y validación.

3) Usuario/roles y parámetros (opcional):
- Usa `backend/src/seed/seed.js` para sembrar roles/usuarios y parámetros base.

## Variables de entorno (Backend)
Crea `backend/.env` a partir de `.env.example` con:

```
PORT=4000
# Cadena de conexión MSSQL (ajusta instancia/credenciales)
DB_SERVER=localhost\\MSSQLSERVER
DB_DATABASE=SistemaSalubridad
DB_USER=sa
DB_PASSWORD=TuPasswordSeguro
DB_ENCRYPT=false
# Orígenes permitidos para CORS (separados por coma)
CORS_ORIGIN=http://localhost:5173
# JWT
JWT_SECRET=una_llave_segura
JWT_EXPIRES_IN=8h
```

## Puesta en marcha
Backend:
```powershell
cd backend
npm install
npm run dev
```
API disponible en `http://localhost:4000`.

Frontend:
```powershell
cd frontend
npm install
npm run dev
```
App en `http://localhost:5173` (Vite).

## Autenticación y roles
- Login: `POST /api/auth/login { correo, password }`
- Roles soportados: "Registro de Datos", "Evaluador", "Validacion".
- El frontend envía `Authorization: Bearer <token>`.
- Para visualizar PDFs en iframes, el backend acepta `?token=<JWT>` en la URL.

## Endpoints principales (resumen)
- Solicitantes
  - GET /api/solicitantes
  - POST /api/solicitantes { nombre, direccion?, contacto?, cedula }
- Muestras
  - GET /api/muestras/pendientes | /en-analisis | /evaluadas | /validadas
  - POST /api/muestras { tipo, fecha, hora, origen?, condiciones?, id_solicitante }
  - POST /api/muestras/:id/asignar { id_evaluador, comentario? }
  - DELETE /api/muestras/:id (soft-delete; solo estado=Recibida)
- Ensayos (Evaluador)
  - GET /api/ensayos/asignadas
  - GET /api/ensayos/muestras/:id/parametros
  - POST /api/ensayos { id_muestra, id_parametro, resultado, dentro_norma }
  - POST /api/ensayos/muestras/:id/completar { apto? }
- Informes
  - GET /api/informes/muestra/:id
  - GET /api/informes/muestra/:id/preview (autenticado)
  - GET /api/informes/:id/pdf (stream desde DB)
  - POST /api/informes/:id/validar { accion: Validado|Devuelto, comentario? }

## PDFs en Base de Datos
- Generación en memoria (buffer) y guardado en `dbo.InformeArchivo`.
- Descarga visualización: `/api/informes/:id/pdf?token=...`.
- Sin dependencia de sistema de archivos; no se sirven rutas estáticas.

## Notas de diseño
- Soft-delete en `Muestra` controlado en listados; no se elimina físicamente.
- Código de muestra auto-generado y seguro ante concurrencia.
- Evaluador: botón "Guardar todos" para registrar en lote; solo guarda parámetros con resultado no vacío. El campo "Dentro de norma" se auto-marca según límites.

## Troubleshooting
- "Procedure expects @codigo": actualiza la BD con `DB-update.sql` para el `sp_RegistrarMuestra` nuevo.
- "Conversion failed 'GU06'": ya manejado con `TRY_CONVERT` y filtro de patrón en el SP.
- IDs con saltos: esperado por caché de IDENTITY; usa `codigo_unico` como folio visible.
- Iframes sin token: añade `?token=<JWT>` a URLs de PDFs.

## Licencia
MIT
