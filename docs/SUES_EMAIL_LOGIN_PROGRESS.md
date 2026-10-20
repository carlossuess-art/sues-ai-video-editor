# Inicio de sesión por correo · avance 20/10/2026

Rama de trabajo: `feat/editor-email-login-20261020`, derivada de `d2e789c04d935b44a49a69392e830d7d8134ed28`.
Administrador previsto: `carlossuess@gmail.com`.

## Incorporado
- Módulo aislado de hash scrypt con sal aleatoria; no se guardan contraseñas en Git.
- Comparación de hash resistente a diferencias de tiempo y límite de cinco intentos fallidos en quince minutos.
- Ruta opcional `POST /api/login`; sólo se activa con `SUES_ADMIN_PASSWORD_HASH` en el entorno privado.
- Formulario HTML con autocomplete, mensaje de error y ocultación del editor sin sesión.
- Login y enlace privado previo conviven de momento para evitar pérdida de acceso.
- Tests unitarios del módulo creados, **no ejecutados en checkout completo**.

## Pendiente antes de integrar o desplegar
1. Ejecutar `npm test`, `npm run check` y pruebas en Chromium con la rama completa.
2. Probar: contraseña válida/incorrecta, intentos excesivos, cookie Secure/HttpOnly, persistencia/reinicio, token antiguo y proyectos intactos.
3. Implementar provisión inicial segura de contraseña directamente en VPS, sin exponerla en argumentos, logs, chats o historial de shell.
4. Evaluar recuperación por correo con un proveedor ya configurado; **no se ha implementado todavía**. La pregunta sobre primera mascota no sirve como única prueba de identidad.
5. Configurar hash privado mediante canal seguro, revisar backend de sesión, preparar respaldo/rollback y luego release y despliegue controlados.
6. No establecer contraseñas por mensajes ni publicar claves.

## Verificación ejecutada
Lectura posterior desde el conector GitHub de los cinco archivos principales confirmando contenido, ruta y elementos esperados.
`git ls-remote` en contenedor devolvió «Could not resolve host github.com», por lo que no se certifica prueba Node/Chromium.

**Estado:** código en rama aislada. Sin merge, sin cambios en Hostinger, V1 pendiente.
