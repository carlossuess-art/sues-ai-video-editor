# SUES V1 · Continuidad exportación y descarga · 22/11/2026

**Estado:** QA aislada, **NO desplegado**. Repositorio principal `carlossuess-art/sues-ai-video-editor`, rama `feat/speech-linked-motion-grammar-20261115`. Entorno de trabajo del VPS `srv1841004`: `/opt/sues-secure-headless-qa-20261122`.

## Resultado confirmado

- Proyecto de prueba R14 completo: 165 clips, 55,566667 s, 1667 frames, 30 fps, 1080 × 1920.
- El ensamblado `segment-qa/SUES_R14_55s_SEGMENTED_QA.mp4` **existe y es válido técnicamente**: H.264/AAC 48 kHz, 87 857 351 bytes; SHA-256 `aca670c0390f2b4f9fabb9fcefd947da6391ae92f3eeb76f4330a27807dec453`. El auditor comprobó frames, límites sin duplicados, muestra PCM y HTTP HEAD 200. El A/V visual y auditivo humano sigue pendiente.
- Mezcla continua de audio: `SUES_R14_55s_FULL_AUDIO_QA.mp4`, 1667 frames y 2 667 200 muestras PCM (recortadas a 55,566667s); generación 45,2 s; SHA-256 `7918f25e436d91ec97fcabe04906db3ec420fcdd3504d98092d9f328a913a1a3`.
- Render segmentado completo entre 12:29:37 y 13:06:08 UTC (aprox. **36,5 minutos**): corrige el bloqueo OOM de monolitos previos pero **NO alcanza rendimiento aceptable** para V1.
- Variante WebCodecs: 360 frames/12s exportados en 177,3 s, sin OOM, memoria pico ~2,73 GB; no confundir con render íntegro de 55s. Exportación servidor 1 vCPU AMD EPYC virtualizado, 3,8 GiB RAM, sin GPU `/dev/dri`, disco al 91%; cambiar solo el muxer no arregla el cuello de composición.

## Regresión de aislamiento de revisión y corrección

- QA antes de corregir, `snapshot-e2e-v4-qa.json`: al solicitar exportación y editar después `clips[0].props.x` de -41 a 400, los frames exportados diferían del baseline: SSIM **0,487729**, FAIL. Los cambios posteriores quedaban en el documento vivo, pero la exportación no conservaba la revisión inicial.
- Causa identificada en `app.js`, `syncFromServer()`: había comprobación de `runtime.exportSnapshotLock` **antes** del `await fetch('/api/project')`, pero no después del `await res.json()`. Una respuesta de sincronización iniciada antes del bloqueo podía sobrescribir la instantánea de exportación.
- Parche mínimo en copia `app-snapshot-lock-qa/app.js`: repetir comprobación de `state.gesture || state.exporting || runtime.exportSnapshotLock` inmediatamente después de obtener `data`; ante bloqueo, `runtime.pendingSync = true; return false`.
- **Prueba posterior superada** `snapshot-e2e-v5-qa.json`: baseline a -41, exportación solicitada antes de editar, modificación concurrente a x=400, exportación H.264/AAC 15 frames y comparación con baseline **SSIM 1,000000**. La modificación posterior continúa guardada. Prueba sintética de 0,5 s en entorno aislado; no equivale a QA de un Reel real completo.
- La copia corregida es `/opt/sues-secure-headless-qa-20261122/app-snapshot-lock-qa/app.js` (SHA `46b4305a11f09632ad898bcf3e68d28672e85b58edcf9a42be545b6479e7c85c`). El parche reproducible se guarda en `patches/fablecut-export-snapshot-lock-20261122.patch`.

## Pendiente, por prioridad

1. Integrar corrección de instantánea con la variante WebCodecs en **una sola candidata QA** y volver a pasar la regresión de edición durante exportación y cancelación.
2. Investigar y optimizar composición/decodificación de los 165 clips; exigir render completo de 55,57 s a un tiempo operativo aceptable sin perder máscaras, palabras, B-roll, audio o sincronía. No afirmar que el rendimiento está arreglado.
3. Superar QA visual y auditiva real y descarga móvil desde la aplicación. El HTTP HEAD 200 demuestra disponibilidad del archivo de QA, no la UX de descarga Android.
4. Solo entonces, despliegue separado y verificable con autorización, sin tocar originales, V29, WAC, DNS o servicios ajenos. Mantener el editor publicado intacto durante las pruebas.

**Pruebas/archivos privados en VPS:** `segment-qa/verification.json`, `audit.json`, `full-audio-qa.json`, `webcodecs12s-qa.json`, `snapshot-e2e-v4-qa.json`, `snapshot-e2e-v5-qa.json`; scripts de QA en la raíz del entorno. Los MP4 no se suben al repositorio.

## 22/11 · QA de compatibilidad WebCodecs + instantánea (continuación)

Se detectó que la candidata previa de WebCodecs reutilizaba una versión más antigua de `app.js` sin activar `runtime.exportSnapshotLock`, y un orquestador `sues-segmented-export.js` fijaba `profile:'delivery'` aunque el servidor solicitara `encoderProfile:'webcodecs'`. Por tanto no era válido afirmar que las pruebas anteriores de concurrencia ejecutaban el flujo WebCodecs.

En un nuevo entorno **solo QA** (`/opt/sues-secure-headless-qa-20261122/app-snapshot-webcodecs-v8-qa`) se corrigieron todos estos puntos:

- `syncFromServer()`: guard `runtime.exportSnapshotLock` antes y después del fetch asíncrono.
- `runExportJob(ticket)`: activar lock antes de `applyProject(ticket.snapshot)`; liberar al finalizar.
- `runAudioOnlyJob`: liberar el lock en `finally`.
- `sues-segmented-export.js`: aceptar `encoderProfile` y pasarlo a cada trabajo secundario, en lugar de hardcodear `delivery`.
- `server.js` **solo QA**: configurar explícitamente `encoderProfile:'webcodecs'`.

**Prueba aislada real `snapshot-e2e-v8-qa.json` PASS**: 15 frames/0,5s H264/AAC, request de exportación antes de modificar el proyecto vivo de x=-41 a x=400, comparación con baseline del mismo perfil `webcodecs`, SSIM **1,000000**, edición concurrente conservada; tiempo para la segunda exportación **55,5 s**, baseline 52 s aproximadamente. Endpoint padre informó `profile:'webcodecs'`. También había pasado la regresión de 15 frames con perfil delivery y protección completa `snapshot-e2e-v7b-qa.json` (SSIM1,000, 63,8s). La primera candidata incompleta con guard tras fetch pero sin lifecycle lock `snapshot-e2e-v6-qa.json` **falló** SSIM 0,487729.

**Límites:** el coste de creación de proceso y fotogramas es muy alto; la prueba 15-frame solo valida fidelidad instantánea, no rendimiento ni QA del Reel auténtico completo con esta candidata. No se han cambiado servicios de producción. La variante WebCodecs completa 55,57s aún no se ha acreditado. Antes de desplegar: rendimiento aceptable, QA A/V doble y descarga en dispositivo real. Respetar los originales y V29.

Artefactos reproducibles de test en VPS: `prepare-snapshot-v7-qa.py`, `prepare-snapshot-v8-qa.py`, `snapshot-e2e-v7b-qa.py`, `snapshot-e2e-v8-qa.py` y `segment-qa/*qa.json`. La candidata V8 no está copiada ni activada en el servicio publicado.
