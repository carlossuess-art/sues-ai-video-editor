# QA · Frontend DOPAMIN vertical · 23/10/2026

## Alcance aplicado, rama de desarrollo
- Subir vídeo → plantilla activa CALMA/DOPAMIN → dos elecciones visibles: **Dar instrucciones** (ruta existente con comandos limitados) y **Edición automática · próximamente** (Director autónomo NO disponible). Una sola plantilla seleccionada; no se sobrescribe al elegir el modo.
- Previsualización nativa 9:16, columna del reproductor 46 % del estudio en escritorio y disposición vertical en pantallas estrechas.
- Los estados en el reproductor diferencian **VÍDEO ORIGINAL**, **EDITANDO VÍDEO** (cola/render/publicación, progreso cuando disponible) y **VÍDEO EDITADO**. Previsualizar y exportar se habilitan al terminar.
- Original y montaje usan preload=auto, y el hash SHA256 del original almacenado se calcula al primer acceso de esa instancia, reutilizándose en peticiones Range mientras dev/inode/tamaño/mtimeNs/ctimeNs no cambien. Si se altera el archivo se repite verificación. El recurso continúa privado y autenticado.
- Service Worker cache shell v19 para entregar la nueva interfaz, sin almacenar medios o transcripciones.
- No se cambia arquitectura ni código del Director IA; el modo Dar instrucciones reutiliza la ruta interna compatible anteriormente denominada automática. Los comandos fuera de contrato siguen rechazándose.

## Pruebas realizadas antes de publicación
- node --check web/app.js y node scripts/check.mjs: PASS.
- tests/portrait-workflow.test.js: 2/2 PASS (contrato de interfaz vertical y caché de integridad, incluida alteración del medio).
- tests/studio-workflow.test.js + tests/video-intake.test.js + tests/portrait-workflow.test.js: 11/11 PASS.
- tests/deploy-service.test.js en host VPS con Git: 2/2 PASS.
- suite completa aislada Docker: 284/286 PASS. Los 2 fallos corresponden al binario Git temporal sin permiso de ejecución en Docker; ambos pasan en host VPS.
- git diff --check: PASS.

## Límites
No se ha completado aún una prueba visual interactiva en Chrome/Android ni una reproducción larga medida desde el navegador del usuario. Preload y caché de integridad eliminan una causa probable de los cortes, pero solo la prueba real puede confirmar que ya no existen. No declarar V1, aceptación DOPAMIN ni Director IA terminado por estas correcciones.

## Publicación
Código publicado y desplegado en Hostinger con SHA exacto `a9219413ed2054130a4d18b4d66b2921f39f5e68`; árbol GitHub `4405865780f23042f9ce1fd29aa258d94574999c` coincide con el árbol local probado. `update_service.py --diagnose` y despliegue controlado PASS; backup verificado `/opt/sues-video-setup/update-backup-20261023-064607-109940/editor-state.tar` SHA256 `708a5bc1e40585e5014c8708a9e34cec443ce3d737e074b616a81ec5895e6f99`. HTTPS 200, Whisper activo, rutas privadas autenticadas 200 y sin sesión 401. HTML, app.js, studio.css y sw.js v19 servidos correctamente. Tres rangos HTTP 206 sobre original de 34.175.827 bytes: 0,036 s, 0,003 s, 0,002 s en VPS. Prueba de reproducción visual en Chrome/Android pendiente; no atribuir al navegador una validación solo del servidor. Sin nuevos costes.
