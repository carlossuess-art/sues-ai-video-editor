# Google OAuth · 20/10/2026

Continúa la release de correo 6da5a3d (oficial 080fe98); mantiene contraseña,
ojos, enlace de emergencia, trabajos y motor. No añade dependencias ni costes.

## Implementación

«Continuar con Google» comparte la pantalla de contraseña. No carga scripts de
Google ni contacta con el proveedor antes de pulsar. Authorization Code, PKCE
S256, state de un uso ligado a cookie HttpOnly/Secure/SameSite=Lax, nonce y
caducidad de diez minutos. Pendientes y solicitudes concurrentes acotados.
Callback fijo: https://editor.suesholistics.com/api/auth/google/callback .
Solo scopes openid y email; sin acceso a Drive, Gmail ni tokens offline.

Intercambio en servidor con timeout, tamaño de respuesta limitado y redirecciones
rechazadas. Firma RS256 con claves públicas oficiales, RSA >=2048; validación de
issuer, audience/azp, exp/iat, nonce, sub y email_verified=true. Email exacto único:
carlossuess@gmail.com. Sesión SUES firmada de 30 días, Secure/HttpOnly/Strict,
ligada al token local y hash de contraseña; sobreviven reinicios y se invalidan
al cambiar contraseña. No se persisten access tokens ni refresh tokens de Google.
Errores del proveedor y códigos nunca se incluyen en respuestas ni logs.

## Configuración privada pendiente

El VPS no contiene credenciales OAuth. Configuración esperada, exclusivamente en
/state/access/google-oauth.json (host /opt/sues-video-setup/editor/access):
objeto con clientId y clientSecret del cliente web Google Cloud. Archivo regular,
sin symlink, modo 0600, legible por uid1000 del contenedor. No usar variables del
frontend, argumentos de shell, logs ni Git. No copiar credenciales al chat.
Configuración ausente: botón desactivado con explicación y contraseña operativa.
Configuración inválida: arranque falla cerrado; actualizador recupera contenedor.
Google requiere además contraseña SUES configurada, para conservar la revocación
actual de sesiones. Leer configuración al arrancar; instalarla requiere reinicio
controlado de solo editor y comprobaciones posteriores, con backup anterior.

Google Cloud: cliente OAuth de aplicación web; URI autorizada exacta del callback
anterior, origen https://editor.suesholistics.com si el formulario lo solicita.
Consentimiento mínimo de identidad/email. Crear credenciales o conceder permisos
requiere la intervención de Carlos cuando Google lo exija. No publicar ni ampliar
permisos de otros clientes. No se han creado credenciales ni aceptado consentimientos.

## Evidencia y límites

- npm test: 239 PASS; npm run check PASS.
- 28 pruebas Python del actualizador PASS: Docker/systemd/red simulados; no son
  pruebas del despliegue real. Actualizador y launcher sin modificar, checksums:
  update_service.py d65cf1ba69f12c06b290ea58f5d4569e879d0e8acb990b9b00b609cc5076abc4;
  background_update.py 999d22c752757f1be87da636407978b4ec95e89e47973196650df38e8c832372.
- HTTP real local: callback, cookie persistente, contraseña, emergencia; rechaza
  estado/cookie incorrectos, replay, denegación, expiración, identidad no admin,
  email no verificado, firma/algoritmo/kid/issuer/audience/nonce inválidos.
  Google/JWKS son sustitutos locales con firma RSA real: NO validación de Google vivo.
- Chromium145 real escritorio1440x1000 y móvil393x852: formulario de contraseña,
  tres ojos, creación/confirmación, errores, logout, enlace antiguo y persistencia
  tras cerrar navegador y reiniciar servidor. Original y proyecto intactos.
- Prueba OAuth navegador: HTTPS local real con certificado de QA (únicamente ese
  contexto ignora su certificado autofirmado), sustituto de consentimiento Google,
  token/JWKS locales. Redirecciones/cookies reales de la app. Comprueba identidad
  autorizada, rechazo de otra cuenta, retorno a contraseña, persistencia tras
  reinicios, ausencia de overflow y conservación de proyectos. No demuestra un
  login con Google real ni utiliza credenciales de producción.
- Google Cloud en navegador Work: /auth/clients muestra «Site Unavailable / Unable
  to access this site», también tras una recarga. No se observó sesión Google
  autenticada ni se pudo llegar a crear el cliente. No clasificar como CAPTCHA.

Referencia primaria: https://developers.google.com/identity/openid-connect/openid-connect

## Estado remoto inicial acreditado por Desktop Commander

srv1841004 online. Contenedor running, release6da5a3d9145dde6bff7056e318b67d020e99c66f,
contraseña configurada, setup consumido; cuatro trabajos, cola rendering/waiting/
saving=0. Inventario privado de155 archivos registrado en
/opt/sues-video-setup/oauth-before-manifest.json; no se copiaron medios ni secretos
al repositorio. Configuración OAuth ausente. La instalación de código preparado
no equivale a habilitar ni probar Google. Resultado de despliegue se registra
por separado tras comprobar systemd, HTTPS y hashes.
