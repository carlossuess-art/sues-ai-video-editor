## Q03 r27 · HTTPS privado para Pixel + render bajo servicio persistente · 22/11/2026

**URL ACTIVA (autenticación SUES Studio):** https://studio.suesholistics.com:8443/q03-export-qa/qa.html . La fuente Caddy host `/opt/sues-video-setup/proxy/Caddyfile` incorpora únicamente la ruta `handle_path /q03-export-qa/*`, `forward_auth` existente en 7781 y upstream QA loopback18156; no DNS ni modificación de los demás vhosts. Backup único host `/opt/sues-video-setup/proxy/Caddyfile.q03-backup`, recarga Caddy verificada. Sin sesión, HTML/API/MP4 → HTTP302 al login, HTTPS certificado válido sin `-k`; preview8443 raíz→302, studio login443→200, editor443→200.

**Hito adicional de prueba REAL sobre el servicio habilitado `sues-q03-pixel-qa.service`** (User=suesnle, CPU75%, MemoryMax3GB, NoNewPrivileges, PrivateTmp, ProtectHome y ProtectSystem; Chrome sin `--no-sandbox`): se corrigió el manifiesto de QA tras cambio únicamente del código de Range, verificando máster SHA256 `474bf01cf4db84d6beb40c21180537f1ba5cc84d9d83c4f0ebbc0ccb9d9b27bc` y 9 de10 ventanas reutilizables, índice5 invalida. El primer intento erróneo de render frío se canceló a30,6% (sin MP4 final). Segundo intento vía API real bajo servicio endurecido **PASS: 131,0s (2m11s)**, video H264 1080×1920/30fps 1667f/55,566667s, audio AAC, 102.855.365 bytes, SHA256 `da0ce7481cab0e60e40ac593f6a3ba347bf431f3217ba63c10be96251ffd811c`. Informe `q03-integrated-stage-20261122/pixel-service-e2e.json`.

Auditoría independiente `pixel-service-frame-parity.json`: **PASS**, 1667/1667 decodificados sin errores; fuera de ventana editada 1487 fotogramas idénticos píxel a píxel; dentro de 180f solo **61 cambiaron** realmente por el texto (el resto coincide, normal porque el texto no está visible durante toda la ventana). Audio `pixel-service-audio-psnr.log`: PSNR **166,139/166,185 dB** por canal respecto al MP4 anterior, integridad técnica sin escucha artística. Después se reinició el servicio para liberar Chromium; desde servidor reiniciado, POST /api/export/request → **status:done,cached:true** del MP4 nuevo sin render, GET Range0–1023→206/1024 bytes. Servicio queda `enabled,active`, listener 127.0.0.1:18156 solamente, memoria tras reinicio ~333MB, Caddy auth302 confirmado.

Panel móvil `qa.html` incluye persistencia de ID de trabajo en `sessionStorage` para retomar progreso tras recarga de la misma pestaña y consulta al volver de segundo plano. **NO se ha iniciado sesión desde el Pixel físico**: esa prueba y la revisión artística de dos pasadas SUES Film Director1.7.1 siguen PENDIENTES. Es panel QA de exportación, no editor visual completo. Tampoco hay mejora del render frío complejo (579,5s), por lo que **Q03 sigue EN CURSO, Q04 no aprobada, producción/V29/WAC/iStudio/DNS intactos**.

---

# SUES AI VIDEO EDITOR · Q03 · Acceso HTTPS privado para Pixel · 22/11/2026

**Autorización:** Carlos aceptó explícitamente añadir una ruta HTTPS privada con autenticación, manteniendo las rutas de producción y la vista previa. Solo acceso QA del **editor FableCut existente**, no un editor/motor duplicado.

## Enlace y alcance

**Panel de exportación QA**: https://studio.suesholistics.com:8443/q03-export-qa/qa.html

El panel móvil permite: consultar nombre/revisión del montaje R14 de copia, cambiar ÚNICAMENTE el texto `SC08-QUESTION` en dicha copia, solicitar exportación incremental real, ver progreso, cancelar, reproducir MP4, descargar y probar HTTP Range parcial. **NO es todavía una réplica completa de la interfaz de edición; no se ha hecho la prueba física en Pixel ni la aceptación creativa**. Acceder primero a `https://studio.suesholistics.com/login` con la sesión vigente; después volver a abrir el enlace QA si el login redirige a la portada.

## Arquitectura comprobada

- Conservar Caddy existente y host `studio.suesholistics.com:8443`. Se añadió **solo** `handle_path /q03-export-qa/*` a ese servidor, con `forward_auth 127.0.0.1:7781 { uri /verify }` ya empleado por el estudio.
- Proxy autorizado restringido a `/qa.html`, `/api/project`, `/api/export/request`, `/api/export/job`, `/api/export/job/cancel` y `/exports/*`; resto devuelve404. La autenticación precede al proxy. El panel aplica prefijo `/q03-export-qa` a todas las peticiones. Cabeceras heredadas: noindex/no-store/same-origin.
- Backend `127.0.0.1:18156`; Chromium CDP solo `127.0.0.1:18157` cuando renderiza. No hay listeners en 0.0.0.0 para esos puertos. Sin DNS nuevo ni otra cuenta/clave.
- Servicio persistente **`sues-q03-pixel-qa.service`**, habilitado y activo, usuario limitado `suesnle`, CPUQuota75%, MemoryMax3GB, NoNewPrivileges, PrivateTmp, ProtectSystem=full y ProtectHome=yes. Solo monta copia QA `/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122`; mantiene flags de reutilización controlados y Chrome existente bajo AppArmor QA.
- Caddy fuente real del bind mount: `/opt/sues-video-setup/proxy/Caddyfile` (montado RO en contenedor Caddy en `/etc/caddy/sues-video.Caddyfile`). Se editó **en el host, en el mismo inodo**, no desde el contenedor RO; se validó con `caddy validate` y aplicó `caddy reload`, sin reiniciar Caddy ni modificar otros vhosts. Única copia de rollback host: `/opt/sues-video-setup/proxy/Caddyfile.q03-backup`. SHA256 base `b532f06efde022491c5a32cb6302d52c6b14536991a62651568e2f5e8af4017c`; nuevo `c0d866d653e699d29767643ea6ab68b1d0a7793935fb71ea8f06d56bdfdf22d6`.
- Código/módulos versionados en `experiments/export-window-reuse-20261122/integrated/`: `qa.html`, `caddy-private-route.snippet`, `sues-q03-pixel-qa.service`, orquestador incremental, cache, tests y launcher.

## Validación de accesos

- HTTPS `studio.suesholistics.com:8443` válido con CA local y SNI correcto sin `-k`.
- QA sin sesión `/q03-export-qa/qa.html` → HTTP302 al login; `/q03-export-qa/api/project` → HTTP302; ruta `/q03-export-qa/exports/...mp4` → HTTP302. Acceso al QA no anónimo.
- Redirección `/q03-export-qa/` → HTTP302 al panel de QA.
- El estudio protegido ya existente en 8443 conservó HTTP302 sin sesión, `studio.suesholistics.com/login` (443) HTTP200, `editor.suesholistics.com` (443) HTTP200. Config adaptada confirmó una ruta Q03 con rewrite de prefijo, forward_auth a7781, upstream FableCut18156 y fallback404.
- Servidor local devolvió HTTP200 para `/qa.html` con JavaScript compilado en `vm.Script`, interfaz responsive sin recursos remotos. Los endpoints de exportación/descarga habían superado 77/77 regresiones, audio y video integral R14.
- **Todavía no se ha autenticado desde el Pixel físico en esta sesión.** El control de login fue verificado únicamente con solicitudes anónimas y el mismo proveedor de sesión preexistente.

## Ensayo bajo servicio endurecido

Primer E2E con servicio permanente detectó una invalidación conservadora total de 10 ventanas porque el código HTTP Range cambió la huella del renderer desde la creación del máster. Se canceló correctamente el trabajo `xs_c1497eeae8af` a 30,6%, sin MP4 final. Es correcto fallar en seguro y no atribuir el tiempo a reexportación incremental. Se verificó SHA256 de salida base `474bf01cf4db84d6beb40c21180537f1ba5cc84d9d83c4f0ebbc0ccb9d9b27bc` y se volvió a sembrar **solo en QA** el manifiesto de ventanas para ese máster de confianza tras el cambio HTTP-only: 9/10 reusables, ventana índice5 invalidada. Segundo E2E de servicio en ejecución pendiente de resultado al redactar este checkpoint; no inventar resultado.

## Seguridad y límites pendientes

El perfil AppArmor QA continúa siendo `unconfined`: Chrome sin `--no-sandbox` y con seccomp/NoNewPrivileges observados no equivalen a auditoría completa de aislamiento productivo. QA está detrás de sesión preexistente, rutas permitidas y proxy loopback, pero **NO desplegar este motor en producción todavía**. Quedan el ensayo físico Pixel, QA artística en dos pasadas según SUES AI Film Director v1.7.1, máscaras/cancelación real desde móvil, cold-render complejo 579,5s (meta1–3min NO lograda) y Q04 aprobación.

## Reversión

Antes de revertir, comprobar si hubo ediciones posteriores a Caddy; no sobrescribir cambios ajenos. Si no los hubo, parar/deshabilitar exclusivamente `sues-q03-pixel-qa.service`, restaurar **contenido en el inodo original** desde `/opt/sues-video-setup/proxy/Caddyfile.q03-backup` a `/opt/sues-video-setup/proxy/Caddyfile` (no hacer `mv` de bind mounts), validar y recargar Caddy usando `nsenter -t $(pgrep -xo caddy) -m -- /usr/bin/caddy reload --config /etc/caddy/sues-video.Caddyfile --adapter caddyfile`. No borrar el código QA, masters ni WAC. Reprobar 443 y preview8443.

**Estado: Q03 EN CURSO, Q04 PENDIENTE, producción/V29/WAC/iStudio y DNS sin cambios.**
