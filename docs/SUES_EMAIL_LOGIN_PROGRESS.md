# Inicio de sesión por correo · 20/10/2026

La implementación inicial de `feat/editor-email-login-20261020`, recibida en
`550fc179aeb8f93b8427be5e16bb49319e07c3a6`, se ha completado y probado en Work.
La guía vigente es [login, configuración privada y despliegue](SUES_EMAIL_LOGIN_VERIFIED_20261020.md).

No se usa SUES_ADMIN_PASSWORD_HASH en variables de entorno. El hash vive en
`/state/access/admin-password-hash`, junto al token privado persistente existente.
La contraseña se crea y confirma en HTTPS mediante un enlace de un solo uso;
login, creación y confirmación tienen botón de mostrar/ocultar. No se escribe
la contraseña en comandos ni se comunica a Work.

No hay infraestructura de envío de correo verificada para este editor. Recuperación
actual: enlace privado previo o nuevo enlace de configuración generado por root.
La integración local no acredita un despliegue ni una sesión en producción.
