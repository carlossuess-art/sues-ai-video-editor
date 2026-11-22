# FableCut Q03 · Integración incremental aislada · 22/11/2026

**Estado:** implementado y probado en una copia de desarrollo del **editor FableCut existente**, no desplegado a producción. Esta carpeta NO es un editor nuevo: son dos módulos adicionales y la versión modificada del orquestador original `sues-segmented-export.js`, más pruebas.

## Componentes

- `sues-window-reuse.cjs`: huellas de dependencias por intervalos de fotogramas, conservadoras y con rechazo por defecto de tipos no reconocidos. Cualquier cambio de audio, medios, código, composiciones o parámetros generales fuerza la invalidación correspondiente.
- `sues-window-cache.cjs`: manifiesto atómico del último máster verificado, SHA256 completo, ffprobe de códecs, duración y número exacto de fotogramas; rechaza enlaces simbólicos.
- `sues-segmented-export.js`: reutiliza los intervalos intactos mediante FFmpeg stream-copy; si la copia no se valida vuelve a renderizar la ventana, verifica nuevamente medios/código/fuente antes de publicar, une una sola mezcla de audio y conserva la cancelación.
- `resident-cdp-local.patch`: elimina el permiso comodín `--remote-allow-origins=*` del Chromium residente. CDP y API deben escuchar solo en 127.0.0.1; no es autenticación de CDP.

## Integración y activación

En una **copia aislada** del FableCut original que tenga `sues-export-reuse.cjs` y el servidor segmentado existentes, colocar los tres módulos juntos en la misma carpeta app, sustituyendo SOLO el orquestador de esa copia. Aplicar también el parche de CDP antes de usar el worker. No pegar estos archivos directamente sobre producción ni crear un segundo editor independiente.

Función desactivada por defecto. Entorno QA: `SUES_SEGMENTED_EXPORT=1`, `FABLECUT_ENABLE_AUDIO_ONLY=1`, `SUES_EXPORT_REUSE=1`, `SUES_WINDOW_REUSE=1`, `SUES_RESIDENT_WORKER=1`, `SUES_RESIDENT_BITRATE_MBPS=16`, `SUES_SEGMENT_FRAMES=180`. El orquestador normal y el fast path nativo no desaparecen: solo los trabajos elegibles usan reutilización. Evitar cualquier activación pública mientras falte hardening.

VPS QA: `/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122` (`app/`, `data/`, informes JSON). API probada únicamente en loopback `127.0.0.1:18156` con CDP `127.0.0.1:18157`; no existe enlace externo aprobado. Se reutiliza Chrome instalado y perfil AppArmor preexistente. El perfil es **unconfined**; aunque los procesos Chrome mostraron `NoNewPrivs:1`/`Seccomp:2`, no equivale a una auditoría de aislamiento de producción.

## Evidencia real

- Regresión del editor: **52/52 PASS**; incluye composición, máscaras, audio, export y 8 tests Q03 (5 planner, 2 caché, 1 cancelación).
- El primer intento API no pudo acceder a un manifiesto QA creado como root (0600). Se canceló explícitamente por `POST /api/export/job/cancel`; estado final `cancelled`, sin MP4 final. Se corrigió SOLO el propietario del manifiesto de QA; lectura como `suesnle` confirmó 9/10 ventanas recuperables.
- Segundo intento por **API FableCut real** con proyecto R14 modificado (`SC08-QUESTION`) y **mezcla de audio nativa**: `xs_33a6a5c1aaa3`, `done`, **113,83 s**, vídeo H264 1080×1920, 1667 fotogramas, audio AAC, 55,566667 s, 102.856.671 bytes, SHA256 `474bf01cf4db84d6beb40c21180537f1ba5cc84d9d83c4f0ebbc0ccb9d9b27bc`.
- Auditoría `integrated-frames-parity.json`: **PASS**, 1667/1667 decodificados, 1487 fotogramas fuera de escena idénticos píxel a píxel y 180 diferentes en ventana editada. No se confunde con doble QA artística.
- Audio: `audio-apsnr.log`, PSNR frente al máster 166,203 / 166,271 dB por canal. Es comparación técnica de señal, NO escucha ni comprobación artística.
- Exportación repetida: `cached:true`, `status:done` sin nuevo render. Control de revisión antigua: HTTP409. Descarga HEAD200 y Range206 (0–1023/102856671).
- Sin cambios de producción, V29, WAC, iStudio, DNS ni Caddy. Se preserva el máster original de QA (SHA256 `8a6319be87f0a2668ef153e15465adc5f225ee2285e9305ae22dd4ca61df9e09`).

**Limitaciones:** la primera exportación completa del R14 complejo sigue en **579,5s / 9m39,5s**; 113,83s corresponde exclusivamente a **reexportación incremental** con máster válido precalculado. Seguridad CDP/AppArmor sin certificación productiva, test Pixel real, revisión audiovisual completa en dos pasadas, capacidades de máscaras y regresión con cambios multidimensionales todavía pendientes. La QA está ligada a los medios reales del VPS, no al contenido de este repositorio. Los archivos de prueba no deben incorporarse al build público por accidente.

## Siguiente puerta

Conservar esta implementación en la rama viva, cerrar hardening del worker y preparar un acceso HTTPS autenticado para Pixel por una ruta de **staging independiente**, sin sustituir la vista previa existente ni tocar DNS/producción. Después prueba desde interfaz móvil, cancelación/descarga y doble auditoría SUES AI Film Director v1.7.1; aprobación de Carlos independiente del deploy. Mantener un rollback al orquestador original y los dos flags desactivados.
