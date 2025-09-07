# Sistema Salubridad - Backend (Node.js)

API REST en Node.js/Express conectada a SQL Server (mssql). Incluye autenticación con JWT/bcrypt y control de acceso por roles ("Registro de Datos", "Evaluador", "Validacion"). Las rutas invocan los procedimientos almacenados provistos en la BD.

## Requisitos
- Node.js 18+
- SQL Server (local o remoto) con la base `SistemaSalubridad` creada (ejecuta `SistemaSalubridad-BD.sql`).

## Configuración
1. Copia `.env.example` a `.env` y ajusta credenciales.
2. Instala dependencias:

```powershell
cd c:\Users\edgar\source\repos\SistemaSalubridad\backend
npm install
```

3. (Opcional) Crea datos iniciales (roles y usuarios):

```powershell
npm run seed
```

Usuarios sembrados (password por defecto: `Password!123`):
- registrador@example.com (Rol: Registro de Datos)
- evaluador@example.com (Rol: Evaluador)
- validador@example.com (Rol: Validacion)

## Ejecutar en desarrollo
```powershell
npm run dev
```

La API arranca en `http://localhost:4000` por defecto.

## Endpoints principales
- POST /api/auth/login { correo, password }
- POST /api/solicitantes (Registro de Datos)
- POST /api/muestras (Registro de Datos)
- POST /api/muestras/:id/asignar (Validacion)
- POST /api/ensayos (Evaluador)
- POST /api/informes (Evaluador)
- POST /api/informes/:id/validar (Validacion)

Revisa cada archivo en `src/routes` para el detalle de parámetros.

## Notas
- La columna de contraseña en SQL es `[contraseña_hash]` (con ñ). El código la referencia con corchetes. Si renombraste a `contrasena_hash`, ajusta la query en `src/routes/auth.js`.
- El CORS por defecto permite `http://localhost:5173` (Vite). Cambia `CORS_ORIGIN` según tu front.
