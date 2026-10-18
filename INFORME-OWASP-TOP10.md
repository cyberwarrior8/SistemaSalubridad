# Informe de análisis de vulnerabilidades OWASP Top 10

**Proyecto:** SistemaSalubridad  
**Fecha:** 2026-09-02  
**Tipo de revisión:** análisis estático manual del código y documentación versionada  
**Referencia:** OWASP Top 10 2021

## 1. Resumen ejecutivo

La revisión identificó **8 hallazgos**, de los cuales **3 son de severidad alta**, **4 media** y **1 baja**. El riesgo más importante es el control de acceso a nivel de objeto: las rutas verifican el rol, pero no siempre verifican que el usuario esté autorizado para la muestra o el informe concreto solicitado. Esto puede permitir lectura o modificación de información perteneciente a otras muestras.

Los siguientes riesgos deben atenderse antes de una puesta en producción:

1. Añadir autorización por objeto para muestras, ensayos e informes.
2. Restringir y validar estrictamente la carga de PDFs.
3. Eliminar los JWT de las URLs y revisar el modelo de almacenamiento de tokens.
4. Activar cifrado y validación de certificados para la conexión a SQL Server.
5. Añadir protección contra fuerza bruta y retirar credenciales iniciales predecibles.

Este documento **no sustituye una prueba de penetración**. No se ejecutó la aplicación, no se inspeccionó la configuración real del servidor ni se validaron permisos efectivos de SQL Server. Se intentó ejecutar `npm audit`, pero `npm` no está disponible en el PATH de este entorno.

## 2. Alcance y método

Se revisaron:

- API Express en `backend/src`.
- Middleware de autenticación y carga de archivos.
- Rutas de muestras, ensayos, informes, usuarios y autenticación.
- Cliente React en `frontend/src`.
- Generación de PDFs y plantilla EJS.
- Configuración documentada y scripts de seed.
- Consultas y procedimientos SQL relevantes.

Cada hallazgo se clasifica como **confirmado** cuando la condición es visible directamente en el código. Los riesgos dependientes del entorno se identifican como **no confirmados** y requieren verificación operativa.

## 3. Matriz de cobertura OWASP

| Categoría | Estado | Observación principal |
|---|---|---|
| A01 Broken Access Control | **Alto** | Falta autorización por muestra/informe; asignación de evaluador insuficientemente validada. |
| A02 Cryptographic Failures | **Medio** | JWT en URL, tokens en `localStorage` y SQL Server sin cifrado configurado. |
| A03 Injection | **Riesgo bajo/no confirmado** | La mayoría de consultas están parametrizadas; existe una concatenación evitable en informes. |
| A04 Insecure Design | **Alto/medio** | Upload sin límites ni validación; controles de flujo incompletos. |
| A05 Security Misconfiguration | **Medio** | CORS permisivo por defecto, TLS desactivado y errores detallados. |
| A06 Vulnerable and Outdated Components | **No evaluado** | Falta ejecutar auditoría de dependencias y revisar versiones efectivas. |
| A07 Identification and Authentication Failures | **Medio** | Sin rate limiting; credenciales de seed predecibles; tokens de larga duración en cliente. |
| A08 Software and Data Integrity Failures | **Medio/no confirmado** | El seed incluye cuentas conocidas y no se observó una política de integridad de artefactos. |
| A09 Security Logging and Monitoring Failures | **Medio** | Se registran errores, pero no se observan eventos de seguridad ni auditoría de accesos. |
| A10 Server-Side Request Forgery | **No observado** | No se identificaron solicitudes HTTP controladas por el usuario en el alcance revisado. |

## 4. Hallazgos detallados

### H-01. Falta de autorización a nivel de objeto

**Severidad:** Alta  
**OWASP:** A01 Broken Access Control  
**Estado:** Confirmado

**Evidencia:**

- `GET /api/ensayos/muestras/:id/parametros`, `POST /api/ensayos` y `POST /api/ensayos/muestras/:id/completar` comprueban el rol `Evaluador`, pero no verifican que el evaluador esté asignado a la muestra indicada. Véase [backend/src/routes/ensayos.js](backend/src/routes/ensayos.js).
- `GET /api/informes/muestra/:id` y `GET /api/informes/:id/pdf` requieren autenticación, pero no comprueban relación entre el usuario, la muestra y el informe. Véase [backend/src/routes/informes.js](backend/src/routes/informes.js).
- La generación y consulta de datos se basa en el identificador recibido por la URL o el cuerpo.

**Impacto:** un usuario autenticado con un rol válido podría consultar datos personales, registrar ensayos, completar evaluaciones o descargar informes de otra muestra mediante enumeración de IDs.

**Recomendación:** implementar una función centralizada de autorización por objeto, por ejemplo `assertEvaluatorAssigned(id_muestra, req.user.sub)`, y usarla en todas las rutas de ensayos e informes. Para validación, comprobar que el informe pertenece a la muestra esperada. Repetir las reglas en procedimientos almacenados si existen otros clientes de la base de datos.

**Prueba recomendada:** con dos usuarios Evaluador y dos muestras, intentar leer y modificar la muestra asignada al otro usuario; todas las operaciones deben responder `403`.

### H-02. Asignación de evaluadores sin comprobar identidad, rol o estado

**Severidad:** Alta  
**OWASP:** A01 Broken Access Control / A04 Insecure Design  
**Estado:** Confirmado

**Evidencia:** `POST /api/muestras/:id/asignar` valida que `id_evaluador` sea entero, pero no comprueba que el usuario exista, esté activo y tenga el rol `Evaluador`. La ruta delega en `sp_AsignarEvaluador`. Véase [backend/src/routes/muestras.js](backend/src/routes/muestras.js).

**Impacto:** se pueden crear asignaciones inválidas o dirigir información a cuentas inactivas o que no corresponden al flujo de evaluación.

**Recomendación:** validar usuario activo y rol dentro de una transacción; aceptar solo muestras en el estado permitido; impedir asignaciones duplicadas o registrar explícitamente su reemplazo.

### H-03. Carga de archivos sin límites ni validación de contenido

**Severidad:** Alta  
**OWASP:** A04 Insecure Design / A05 Security Misconfiguration  
**Estado:** Confirmado

**Evidencia:** [backend/src/middleware/upload.js](backend/src/middleware/upload.js) usa `multer.memoryStorage()` sin `limits` ni `fileFilter`. [backend/src/routes/informes.js](backend/src/routes/informes.js) guarda el buffer recibido como PDF sin verificar MIME ni firma binaria.

**Impacto:** un usuario autorizado puede provocar consumo excesivo de memoria o almacenamiento al enviar archivos grandes. También puede guardar contenido que no sea PDF y servirlo con `Content-Type: application/pdf`.

**Recomendación:** definir un límite pequeño y explícito de bytes, validar extensión, MIME y magic bytes (`%PDF-`), rechazar archivos corruptos, limitar frecuencia por usuario y establecer cuotas de almacenamiento. Considerar almacenamiento de objetos con controles de tamaño y antivirus.

### H-04. JWT incluido en query string

**Severidad:** Media  
**OWASP:** A02 Cryptographic Failures / A07 Identification and Authentication Failures  
**Estado:** Confirmado

**Evidencia:** [backend/src/middleware/auth.js](backend/src/middleware/auth.js) acepta `token` y `access_token` desde `req.query`. El frontend construye URLs de PDF con el token en [frontend/src/pages/Validacion.jsx](frontend/src/pages/Validacion.jsx). La misma decisión está documentada en [README-ES.md](README-ES.md).

**Impacto:** el token puede quedar en historial, logs de proxies, capturas, herramientas de analítica o cabeceras `Referer`. El token observado es válido hasta ocho horas.

**Recomendación:** retirar el fallback de query string. Descargar el PDF mediante Axios con cabecera `Authorization`, o usar cookie `HttpOnly`/`Secure` con protección CSRF. Si se requieren enlaces, usar tokens firmados de un solo uso y expiración muy corta.

### H-05. Token JWT persistido en `localStorage`

**Severidad:** Media  
**OWASP:** A07 Identification and Authentication Failures  
**Estado:** Confirmado

**Evidencia:** [frontend/src/auth/AuthContext.jsx](frontend/src/auth/AuthContext.jsx) guarda el JWT en `localStorage`, y [frontend/src/lib/api.js](frontend/src/lib/api.js) lo añade a las peticiones.

**Impacto:** cualquier XSS que llegue a ejecutarse en el origen puede leer el token y reutilizarlo fuera del navegador.

**Recomendación:** preferir cookies `HttpOnly`, `Secure` y `SameSite` apropiadas, con protección CSRF. Añadir una CSP estricta y revisar cualquier futuro uso de HTML no escapado.

### H-06. Conexión a SQL Server sin cifrado ni validación de certificado

**Severidad:** Media  
**OWASP:** A02 Cryptographic Failures  
**Estado:** Confirmado en configuración de código

**Evidencia:** [backend/src/lib/db.js](backend/src/lib/db.js) fija `encrypt: false` y `trustServerCertificate: true`. La documentación propone `DB_ENCRYPT=false` y el usuario `sa` en [README-ES.md](README-ES.md).

**Impacto:** si la base de datos está en otro host o segmento no confiable, las credenciales y los datos pueden exponerse o sufrir ataques de intermediario.

**Recomendación:** habilitar TLS, validar una CA confiable, parametrizar la opción de cifrado por entorno y usar una cuenta SQL con privilegios mínimos, no `sa`. Verificar la configuración efectiva del servidor y del driver.

### H-07. Login sin protección contra fuerza bruta

**Severidad:** Media  
**OWASP:** A07 Identification and Authentication Failures  
**Estado:** Confirmado

**Evidencia:** [backend/src/routes/auth.js](backend/src/routes/auth.js) no aplica limitación por IP o cuenta, backoff progresivo, bloqueo temporal ni alertas de intentos fallidos.

**Impacto:** facilita password spraying y fuerza bruta contra correos conocidos.

**Recomendación:** aplicar rate limiting distribuido por IP y cuenta, backoff progresivo, alertas y MFA para roles privilegiados. Mantener mensajes genéricos y revisar una política de contraseñas adecuada.

### H-08. Credenciales iniciales predecibles y publicadas

**Severidad:** Media  
**OWASP:** A07 Identification and Authentication Failures / A08 Software and Data Integrity Failures  
**Estado:** Confirmado

**Evidencia:** [backend/src/seed/seed.js](backend/src/seed/seed.js) crea tres cuentas con `Password!123`, y las credenciales aparecen en [backend/README.md](backend/README.md).

**Impacto:** si el seed se ejecuta en un entorno accesible y las claves no se cambian, las cuentas pueden ser comprometidas inmediatamente.

**Recomendación:** no sembrar contraseñas fijas en producción; generar secretos aleatorios fuera del repositorio, forzar cambio inicial, bloquear el seed en producción y documentar credenciales solo en material de desarrollo no distribuido.

### H-09. CORS, healthcheck y errores revelan configuración o información operativa

**Severidad:** Baja a media según despliegue  
**OWASP:** A05 Security Misconfiguration / A09 Security Logging and Monitoring Failures  
**Estado:** Parcialmente confirmado

**Evidencia:** [backend/src/index.js](backend/src/index.js) usa `'*'` como origen por defecto, expone `/health` sin autenticación y devuelve `err.message` en el healthcheck. En [backend/src/routes/muestras.js](backend/src/routes/muestras.js) se devuelven `code` y detalles cuando no está en producción.

**Impacto:** puede facilitar reconocimiento del sistema y revelar nombres de procedimientos, restricciones o detalles de SQL. La combinación exacta de CORS y `credentials` debe probarse en navegador y en el despliegue real.

**Recomendación:** fallar al arrancar si falta una allowlist CORS explícita; no combinar comodín con credenciales; devolver respuestas genéricas al cliente y registrar el detalle en un sistema protegido. Separar healthchecks internos de endpoints públicos.

## 5. Riesgos OWASP no confirmados

### A03 Injection

Las consultas observadas usan parametrización en la mayoría de los casos. Sin embargo, [backend/src/routes/informes.js](backend/src/routes/informes.js) concatena `id_muestra` en una consulta SQL. El valor se convierte previamente con `parseInt` y se valida como entero, por lo que no se confirmó una explotación directa; aun así, debe reemplazarse por un parámetro para eliminar la excepción y evitar regresiones.

### A06 Vulnerable and Outdated Components

No se evaluaron vulnerabilidades concretas de `npm`: se intentó ejecutar `npm audit --audit-level=high` en `backend` y `frontend`, pero el ejecutable `npm` no está disponible en este entorno. Ejecutar la auditoría en una máquina con Node.js/npm, revisar los lockfiles y establecer actualización periódica. Las versiones declaradas pueden haber cambiado en el entorno instalado.

### A09 Logging and Monitoring

Se observan `console.error`, pero no se identificó auditoría estructurada de login fallido, acceso a informes, asignaciones, cambios de roles, descargas o validaciones. Esto no prueba ausencia total fuera del repositorio, pero sí una brecha visible en la aplicación.

### A10 SSRF

No se identificó una ruta que reciba una URL del usuario y haga solicitudes salientes. Debe confirmarse mediante revisión de la configuración de proxy, generación de PDFs, integraciones y servicios externos en el despliegue.

## 6. Controles positivos observados

- Uso generalizado de consultas SQL parametrizadas.
- Verificación JWT mediante `jwt.verify`.
- Comprobación de roles en la mayoría de las rutas sensibles.
- Hashing de contraseñas con bcrypt.
- Validación de varios IDs y campos mediante `express-validator`.
- Escape EJS en los campos de la plantilla del informe.
- No se observó un endpoint que sirva rutas arbitrarias del sistema de archivos.

## 7. Plan de remediación priorizado

### Inmediato

- Corregir H-01 y H-02 con autorización por objeto y validación de asignaciones.
- Corregir H-03 con límites, validación de firma PDF y cuotas.
- Eliminar tokens de query string y rotar tokens potencialmente expuestos.
- Cambiar las credenciales sembradas y revisar cualquier entorno donde se haya ejecutado el seed.

### Corto plazo

- Activar TLS para SQL Server y retirar `trustServerCertificate: true`.
- Añadir rate limiting, auditoría de autenticación y alertas.
- Endurecer CORS, healthcheck y respuestas de error.
- Sustituir la persistencia en `localStorage` por cookies protegidas, evaluando el impacto CSRF.

### Antes de producción

- Ejecutar `npm audit` y SCA con lockfiles.
- Realizar pruebas DAST y una prueba manual de IDOR/BOLA sobre cada endpoint con identificadores.
- Verificar secretos, permisos mínimos de la cuenta de BD, TLS, proxy inverso y cabeceras de seguridad.
- Añadir pruebas automatizadas de autorización negativa y de límites de carga.

## 8. Conclusión

El sistema cuenta con controles útiles de autenticación, roles, hashing y parametrización, pero el control de acceso no está completo a nivel de registro. La prioridad es impedir que un usuario con credenciales válidas pueda operar sobre objetos ajenos y reducir la exposición de tokens y archivos. Después deben completarse el endurecimiento de infraestructura, la protección del login y la validación operativa mediante pruebas dinámicas.

## 9. Seguimiento de remediación — 2026-10-18

Este seguimiento complementa la evaluación anterior, que usó OWASP Top 10 2021. La referencia actual es [OWASP Top 10:2025](https://top10.owasp.org/2025/), que incluye Software Supply Chain Failures y Mishandling of Exceptional Conditions. Los cambios de código reducen los riesgos listados abajo, pero **no constituyen certificación ni demuestran cumplimiento completo**. No se ejecutaron pruebas dinámicas, auditoría de dependencias ni revisión del entorno desplegado.

### Controles implementados en el repositorio

- **A01 Broken Access Control:** las rutas de evaluación comprueban que la muestra siga asignada al evaluador actual; informes y PDFs aplican controles de rol y propiedad; listados de solicitantes, muestras e informes se limitan a roles operativos pertinentes; la asignación exige usuario activo con rol Evaluador y muestra en estado Recibida.
- **A02 Security Misconfiguration:** se exige allowlist CORS explícita en producción, se desactiva `X-Powered-By`, se fijan cabeceras defensivas, una CSP inicial en el documento frontend, se limitan los cuerpos de petición y se ocultan detalles del healthcheck. La cabecera `frame-ancestors` debe configurarse en el servidor estático/proxy porque no se admite en una meta CSP.
- **A03 Software Supply Chain Failures:** quedan pendientes el escaneo de dependencias, revisión de scripts de instalación, pinning/actualización controlada y protección de CI/CD. No se verificó la cadena de construcción ni artefactos desplegados.
- **A04 Cryptographic Failures:** JWT en cookie `HttpOnly` de una hora, CSRF para operaciones con cookie, y cifrado SQL activado por defecto con validación de certificado. Requiere HTTPS público y secretos/configuración correctos en despliegue.
- **A05 Injection:** se parametrizó el identificador usado al buscar el informe recién creado; el resto del alcance revisado usa mayormente parámetros SQL. Se debe seguir revisando procedimientos almacenados y nuevas consultas.
- **A06 Insecure Design:** límite de 5 MB, tipo/extensión y firma inicial PDF; login con rate limit y errores genéricos; el seed requiere contraseña por entorno y está bloqueado en producción.
- **A07 Authentication Failures:** tokens ya no se guardan en `localStorage` ni se aceptan por query string; login limitado por IP y con cookie protegida; se registran éxitos y fallos genéricos. El limitador es en memoria por proceso, por lo que una instalación con varias instancias requiere almacenamiento compartido.
- **A08 Software or Data Integrity Failures:** la carga verifica una firma PDF básica y limita tamaño. La revisión antivirus, integridad de backups y protección de artefactos todavía dependen del entorno.
- **A09 Security Logging and Alerting Failures:** se agregaron eventos básicos de autenticación y descarga de informes. Falta centralizar, retener y alertar sobre eventos, además de auditar cambios de roles/asignaciones y proteger los registros.
- **A10 Mishandling of Exceptional Conditions:** se normalizan errores de carga y tamaño, el middleware final evita devolver detalles internos y el healthcheck responde sin mensajes SQL. Falta revisar transacciones y recuperación ante fallos en todos los flujos.

### Requisitos abiertos antes de producción

1. Revisar el resultado vigente de `npm audit`: después de actualizaciones compatibles, backend aún reporta **20 advisories** (1 crítica, 13 altas, 6 moderadas) y frontend **4 advisories** (1 alta, 3 moderadas). Las correcciones restantes requieren cambios fuera de los rangos actuales, incluido un cambio mayor de Puppeteer, mssql, Vite y React Router; planificar upgrades con compatibilidad y volver a auditar antes de producción.
2. La instalación informó que los scripts de `bcrypt`, `msnodesqlv8` y `puppeteer` no están aprobados en el gestor de paquetes de este entorno. Revisar esos scripts y permitir solo los que sean necesarios mediante la política de instalación del entorno de CI/desarrollo.
3. Configurar TLS válido en frontend, API y SQL Server; comprobar `CORS_ORIGIN`, `JWT_SECRET` aleatorio, usuario SQL de privilegios mínimos, copias de seguridad y almacenamiento seguro de secretos.
4. Configurar el proxy inverso de confianza, límites de tasa compartidos entre instancias, logs centralizados con alertas, monitorización y retención segura.
5. Hacer pruebas de autorización negativa para cada ID de muestra/informe, pruebas de carga/tamaño de PDF, revisión de estados y una evaluación DAST/penetración en un entorno autorizado.
6. Confirmar con el responsable de la base de datos que los procedimientos almacenados aplican las mismas reglas de asignación/estado y que creación/validación de informes es transaccional.

El alcance de código no puede demostrar configuración operacional, resistencia ante ataques en ejecución ni cobertura exhaustiva del OWASP Top 10. El estado actual **no debe considerarse conforme para producción**, principalmente por las vulnerabilidades de dependencias pendientes y la ausencia de validación dinámica/operacional. Completar los requisitos abiertos y revisar los resultados con el responsable de seguridad.
