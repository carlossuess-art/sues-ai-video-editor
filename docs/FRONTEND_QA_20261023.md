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
Pendiente de completar commit GitHub, --diagnose, backup y despliegue seguro. Rellenar solo con SHA verificado después de las operaciones. Sin nuevos costes.
