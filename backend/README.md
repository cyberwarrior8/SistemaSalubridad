# Sistema Salubridad - Backend (Node.js)

API REST en Node.js/Express conectada a SQL Server (mssql). Incluye autenticación con JWT/bcrypt y control de acceso por roles ("Registro de Datos", "Evaluador", "Validacion"). Las rutas invocan los procedimientos almacenados provistos en la BD.

## Requisitos
- Node.js 18+
- SQL Server (local o remoto) con la base `SistemaSalubridad` creada (ejecuta `SistemaSalubridad-BD.sql`).

## Configuración
1. Copia `.env.example` a `.env` y ajusta credenciales. Genera un `JWT_SECRET` aleatorio con al menos 32 caracteres; no uses el valor de ejemplo ni guardes `.env` en Git.
2. Configura variables de entorno antes de iniciar la API:

```text
JWT_SECRET=<secreto aleatorio de al menos 32 caracteres>
CORS_ORIGIN=https://<origen-del-frontend>
COOKIE_SAME_SITE=lax
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
```

Configura `DB_SERVER`, `DB_DATABASE` y credenciales SQL de mínimo privilegio según el entorno. En producción el seed está deshabilitado y la API exige un `CORS_ORIGIN` explícito. Mantén la API detrás de HTTPS. Si frontend y API están en sitios distintos, define `COOKIE_SAME_SITE=none` y `COOKIE_SECURE=true`; conserva la allowlist de CORS exacta.

3. Instala dependencias:

```powershell
cd c:\Users\edgar\source\repos\SistemaSalubridad\backend
npm install
```

4. (Solo desarrollo) Crea datos iniciales (roles y usuarios) con una contraseña temporal definida fuera del repositorio:

```powershell
$env:SEED_PASSWORD = "<contraseña de desarrollo de al menos 12 caracteres>"
npm run seed
```

El seed no incluye credenciales conocidas y se niega a ejecutarse en producción. Cambia la contraseña temporal tras el primer uso.

## Ejecutar en desarrollo
```powershell
npm run dev
```

La API arranca en `http://localhost:4000` por defecto en desarrollo. La autenticación usa una cookie `HttpOnly` de una hora y protección CSRF para solicitudes que modifican datos; el navegador no almacena el JWT en `localStorage` ni lo envía en URLs.

## Endpoints principales
- POST /api/auth/login { correo, password }
- POST /api/solicitantes (Registro de Datos)
- POST /api/muestras (Registro de Datos)
- POST /api/muestras/:id/asignar (Validacion)
- POST /api/ensayos (Evaluador)
- POST /api/informes (Evaluador)
- POST /api/informes/:id/validar (Validacion)

Revisa cada archivo en `src/routes` para el detalle de parámetros.


