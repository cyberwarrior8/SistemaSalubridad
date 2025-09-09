## 🎯 Resumen

Describe brevemente el objetivo del cambio y el problema que soluciona.

Closes: #<número-de-issue>

---

## ✅ Tipo de cambio
- [ ] Fix (corrección de bug)
- [ ] Feature (nueva funcionalidad)
- [ ] Refactor/Chore (código interno, sin cambio funcional)
- [ ] Docs (documentación)

---

## 📋 Requisitos antes de enviar
- [ ] El PR apunta a la rama correcta (main) y tiene un título claro.
- [ ] Está vinculado a un issue o incluye contexto suficiente.
- [ ] No expone credenciales ni datos sensibles (revisar .env, history y archivos subidos).
- [ ] Actualicé/añadí documentación si aplica.
- [ ] Probé los cambios en entorno local siguiendo la sección "Cómo probar".

### Backend
- [ ] Dependencias instaladas: `npm install` en `backend/`.
- [ ] Archivo `.env` configurado (copiar desde `.env.example`).
- [ ] Base de datos creada/actualizada (ejecutar `SistemaSalubridad-BD.sql` y últimas actualizaciones si aplica).
- [ ] Seed ejecutado si es necesario para la prueba: `npm run seed`.

### Frontend
- [ ] Dependencias instaladas: `npm install` en `frontend/`.
- [ ] La app compila sin errores (`npm run dev` o `npm run build`).

---

## 🔍 Cómo probar (local)

1) Backend
   - Ruta: `backend/`
   - Instalar deps y preparar entorno
     - Instalar dependencias
     - Copiar `.env.example` a `.env` y ajustar variables
     - (Opcional) Sembrar datos: `npm run seed`
   - Ejecutar: `npm run dev` (API por defecto en http://localhost:4000)

   Usuarios sembrados (password: `Password!123`):
   - registrador@example.com (Registro de Datos)
   - evaluador@example.com (Evaluador)
   - validador@example.com (Validacion)

2) Frontend
   - Ruta: `frontend/`
   - Instalar dependencias y ejecutar: `npm run dev`
   - Abrir la URL indicada por Vite y autenticarse con un usuario de prueba

3) Validación específica del cambio
   - Pasos manuales, endpoints o pantallas afectadas:
     - ...
   - Resultado esperado:
     - ...

---

## 🧪 Evidencia
- Capturas de pantalla o GIFs (si aplica)
- Logs o respuestas de API relevantes (anonimizadas)

---

## ⚠️ Consideraciones
- Impacto en seguridad/roles/permisos:
- Migraciones o cambios en BD requeridos:
- Compatibilidad hacia atrás (breaking changes):

---

## 📚 Notas
Información adicional útil para reviewers o despliegue.
