## Acceso QA protegido para Pixel · r27 · 22/11/2026

**Ruta habilitada con autenticación ya existente de SUES Studio:** https://studio.suesholistics.com:8443/q03-export-qa/qa.html . Solo expone panel móvil exportación, no toda la interfaz de FableCut. Caddy `handle_path` + `forward_auth` existente, proxy de rutas permitidas, backend loopback18156/CDP18157. Config host `/opt/sues-video-setup/proxy/Caddyfile`, respaldo único `Caddyfile.q03-backup`. Servicio `sues-q03-pixel-qa.service` habilitado/activo. Sin cambios de DNS/producción/V29/WAC/preview.

**E2E real en este servicio endurecido: PASS**, tras confirmar 9 ventanas reutilizables y1 invalidada con máster SHA verificado; exportación completa 131,0s, MP4 H2641080×1920/1667f/55,566667s AAC, SHA256 `da0ce7481cab0e60e40ac593f6a3ba347bf431f3217ba63c10be96251ffd811c`. `pixel-service-frame-parity.json` PASS: 1487 frames externos a la ventana intactos idénticos, 61 de180 dentro cambiados, errores0; audio PSNR166,139/166,185dB. Reinicio de QA, `cached:true` sin rerender y Range206/1024 bytes PASS; memoria tras reinicio333MB. Los scripts E2E se conservan en esta carpeta **solo para QA**, no ejecutarlos sobre producción. Detalles: `docs/SUES_V1_Q03_PIXEL_PRIVATE_HTTPS_20261122.md`.

**Pendiente:** validación física del Pixel, dos pasadas artísticas Film Director1.7.1, Chrome/AppArmor productivo y exportación fría (sigue579,5s). Q03 abierto, Q04 no aprobado.

---

## Q03 r27 · Ventanas por composición (solo QA, opt-in) · 22/11/2026

El proyecto R14 (55,566667s, 1667f, 165 clips, 56 composiciones) reveló un caso muy habitual: cambiar **una sola palabra dentro de un comp de subtítulos** invalidaba las 10 ventanas, porque toda la colección `project.comps` formaba parte de la firma global. Era seguro pero excesivamente conservador.

Se conserva el planificador y el orquestador **existentes** y se añade el opt-in **SUES_COMP_SCOPED_CACHE_QA=1** (por defecto APAGADO; no se ha añadido a `start-private-qa.sh`). En este modo, la firma general conserva medios y código, y cada ventana incorpora los comp completos usados por los clips que aparecen en su intervalo con halo de 6 fotogramas; las composiciones anidadas se siguen recursivamente. Si hay un comp ausente, ciclo o audio dentro de comp, no se permite reutilización. Se versiona el schema `sues-window-reuse/qa-v2-comp` para evitar leer accidentalmente firmas v1; cambios de audio principal, configuración global, medios o código invalidan el contenido necesario.

**Pruebas dirigidas sobre R14:** editar título `comp-SC01-TITLE` pasa de invalidar 10/10 a 1/10 ventanas; editar caption animado que cruza el corte del segundo 6 invalida 2/10; cambio audio invalida 10/10. Los tests extra de fallos cerrados incluyen comp ausente, ciclo recursivo, audio anidado, media/código y schema. Suite completa en staging **90/90 PASS** (`regression-r27-all.log`, ~27,38s); 6 casos nuevos, pruebas QA específicas 6/6 PASS. Código de esta carpeta y test `test/sues-comp-scoped-window-reuse-qa.test.cjs`; rollback local guardado antes de modificar. **No se ha medido nuevo export íntegro ni coste visual real**; una reducción de ventanas planificadas NO es prueba de reducción proporcional de segundos. Falta E2E con edición real dentro de comp y comparación de 1667f + mezcla de audio, hardening CDP, Android físico, doble QA Film Director y primer render frío (último 579,5s), por lo que Q03 sigue EN CURSO.

---
# FableCut Q03 · Integración incremental aislada · 22/11/2026

**Estado:** implementado y probado en una copia de desarrollo del **editor FableCut existente**, no desplegado a producción. Esta carpeta NO es un editor nuevo: son dos módulos adicionales y la versión modificada del orquestador original `sues-segmented-export.js`, más pruebas.

## Componentes

- `sues-window-reuse.cjs`: huellas de dependencias por intervalos de fotogramas, conservadoras y con rechazo por defecto de tipos no reconocidos. Cualquier cambio de audio, medios, código, composiciones o parámetros generales fuerza la invalidación correspondiente.
- `sues-window-cache.cjs`: manifiesto atómico del último máster verificado, SHA256 completo, ffprobe de códecs, duración y número exacto de fotogramas; rechaza enlaces simbólicos.
- `sues-segmented-export.js`: reutiliza los intervalos intactos mediante FFmpeg stream-copy; si la copia no se valida vuelve a renderizar la ventana, verifica nuevamente medios/código/fuente antes de publicar, une una sola mezcla de audio y conserva la cancelación.
- `sues-http-range.cjs` y `http-byte-range-fix.patch`: validan byte ranges únicos, sufijos y HEAD sin leer el archivo entero; rangos imposibles producen HTTP416 y `Content-Range: bytes */size`.\n- `resident-cdp-local.patch`: elimina el permiso comodín `--remote-allow-origins=*` del Chromium residente. CDP y API deben escuchar solo en 127.0.0.1; no es autenticación de CDP.

## Integración y activación

En una **copia aislada** del FableCut original que tenga `sues-export-reuse.cjs` y el servidor segmentado existentes, colocar los tres módulos juntos en la misma carpeta app, sustituyendo SOLO el orquestador de esa copia. Aplicar también el parche de CDP antes de usar el worker. No pegar estos archivos directamente sobre producción ni crear un segundo editor independiente.

Función desactivada por defecto. Entorno QA: `SUES_SEGMENTED_EXPORT=1`, `FABLECUT_ENABLE_AUDIO_ONLY=1`, `SUES_EXPORT_REUSE=1`, `SUES_WINDOW_REUSE=1`, `SUES_RESIDENT_WORKER=1`, `SUES_RESIDENT_BITRATE_MBPS=16`, `SUES_SEGMENT_FRAMES=180`. El orquestador normal y el fast path nativo no desaparecen: solo los trabajos elegibles usan reutilización. Evitar cualquier activación pública mientras falte hardening.

VPS QA: `/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122` (`app/`, `data/`, informes JSON). API probada únicamente en loopback `127.0.0.1:18156` con CDP `127.0.0.1:18157`; no existe enlace externo aprobado. Se reutiliza Chrome instalado y perfil AppArmor preexistente. El perfil es **unconfined**; aunque los procesos Chrome mostraron `NoNewPrivs:1`/`Seccomp:2`, no equivale a una auditoría de aislamiento de producción.

## Evidencia real

- Regresión del editor: **77/77 PASS**; incluye composición, máscaras, audio, export y 10 tests Q03 (5 planner, 2 caché, 1 cancelación, 2 HTTP Range).
- El primer intento API no pudo acceder a un manifiesto QA creado como root (0600). Se canceló explícitamente por `POST /api/export/job/cancel`; estado final `cancelled`, sin MP4 final. Se corrigió SOLO el propietario del manifiesto de QA; lectura como `suesnle` confirmó 9/10 ventanas recuperables.
- Segundo intento por **API FableCut real** con proyecto R14 modificado (`SC08-QUESTION`) y **mezcla de audio nativa**: `xs_33a6a5c1aaa3`, `done`, **113,83 s**, vídeo H264 1080×1920, 1667 fotogramas, audio AAC, 55,566667 s, 102.856.671 bytes, SHA256 `474bf01cf4db84d6beb40c21180537f1ba5cc84d9d83c4f0ebbc0ccb9d9b27bc`.
- Auditoría `integrated-frames-parity.json`: **PASS**, 1667/1667 decodificados, 1487 fotogramas fuera de escena idénticos píxel a píxel y 180 diferentes en ventana editada. No se confunde con doble QA artística.
- Audio: `audio-apsnr.log`, PSNR frente al máster 166,203 / 166,271 dB por canal. Es comparación técnica de señal, NO escucha ni comprobación artística.
- Correción HTTP Range probada en staging: GET `bytes=0-1023` devuelve 206/1024 bytes; `bytes=-10` devuelve 206/10 bytes; rango imposible devuelve **416/0 bytes**; HEAD devuelve 200 y longitud exacta.\n- Exportación repetida: `cached:true`, `status:done` sin nuevo render. Control de revisión antigua: HTTP409. Descarga HEAD200 y Range206 (0–1023/102856671).
- Sin cambios de producción, V29, WAC, iStudio, DNS ni Caddy. Se preserva el máster original de QA (SHA256 `8a6319be87f0a2668ef153e15465adc5f225ee2285e9305ae22dd4ca61df9e09`).

**Limitaciones:** la primera exportación completa del R14 complejo sigue en **579,5s / 9m39,5s**; 113,83s corresponde exclusivamente a **reexportación incremental** con máster válido precalculado. Seguridad CDP/AppArmor sin certificación productiva, test Pixel real, revisión audiovisual completa en dos pasadas, capacidades de máscaras y regresión con cambios multidimensionales todavía pendientes. La QA está ligada a los medios reales del VPS, no al contenido de este repositorio. Los archivos de prueba no deben incorporarse al build público por accidente.

## Siguiente puerta

Conservar esta implementación en la rama viva, cerrar hardening del worker y preparar un acceso HTTPS autenticado para Pixel por una ruta de **staging independiente**, sin sustituir la vista previa existente ni tocar DNS/producción. Después prueba desde interfaz móvil, cancelación/descarga y doble auditoría SUES AI Film Director v1.7.1; aprobación de Carlos independiente del deploy. Mantener un rollback al orquestador original y los dos flags desactivados.
