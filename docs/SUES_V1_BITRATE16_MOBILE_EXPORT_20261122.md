# SUES AI VIDEO EDITOR V1 · Optimización bitrate y descarga móvil · 22/11/2026

**Estado:** implementación y QA privadas verificadas en Hostinger VPS `srv1841004`. **NO desplegado en producción**. No modificados FableCut publicado, SUES iStudio original, V29, originales, WAC ni DNS. La implementación se aplica a la candidata de worker Chromium residente documentada en [SUES_V1_PRIVATE_RESIDENT_WORKER_20261122.md](SUES_V1_PRIVATE_RESIDENT_WORKER_20261122.md).

## Archivos en GitHub

- `patches/fablecut-resident-bitrate-mobile-20261122.patch`: parche diferencial sobre la candidata privada residente, con cambios de `fablecut/app.js`, `server.js`, `sues-segmented-export.js`, `sues-export-background.js`, `sues-resident-chromium.cjs`.
- `src/engine-next/sues-resident-chromium.cjs` actualizado: el worker abre `/?suesResidentWorker=1` para que el navegador de render **no guarde el proyecto ni cambie automáticamente su revisión**, e inyecta tasa de bits mediante CDP privada.
- Copia editable de QA en VPS `/opt/sues-secure-headless-qa-20261122/app-bitrate-tune-qa`; datos del ensayo integral `r14-bitrate-tune-data`; scripts y pruebas `native-fastpath-qa`. No aplicar el parche al FableCut de producción sin reconciliar su base.

## Causa raíz encontrada

La rutina `webCodecsExport()` imponía `Math.max(40_000_000, webCodecsBitrate(w,h,fps))` a **todos los export jobs**. Eso generó R14 H264 ~35,5Mb/s, **248.216.224 bytes** en el MP4 anterior. La calidad máxima móvil ya usaba **16Mb/s**. La candidata permite `SUES_RESIDENT_BITRATE_MBPS=16` **solo** para el worker privado autenticado. El `cacheProfile` incluye la tasa de bits para evitar reutilización cruzada entre versiones. Se amplió la ventana de 90 a **180 frames**, con decodificadores compartidos por padre y liberación posterior. No cambia la composición ni se desactivan efectos, máscaras, B-roll, textos o pistas.

## Exportación completa auténtica R14

| Combinación | Tiempo medido | Tamaño |
| --- | ---: | ---: |
| Segmentador Chromium nuevo por ventana, 90f, previo | 2190s (36min30s) | 87,9MB, distinto perfil de vídeo |
| Worker Chromium residente, 90f, mínimo40Mb/s, previo | 643,8s (10min43,8s) | 248.216.224B |
| **Worker residente, 180f, 16Mb/s** | **538,4s (8min58,4s)** | **102.858.456B** |

Aceleración **4,07×** frente al primer segmentador y **1,20×** frente al worker de 90f. **58,6% menos bytes** frente al primer worker. Mismo VPS, una CPU, `CPUQuota=75%`, sin GPU ni créditos adicionales; pico de memoria ~**2,56GB** (antes ~3,09GB), **0 OOM**. Original R14 completo: **1667/1667 frames, 1080×1920 30fps, duración55,566667s, H264/AAC**. Archivo QA `/opt/sues-secure-headless-qa-20261122/r14-bitrate-tune-data/exports/SUES_export_xs_8148a7845ca7.mp4`, SHA256 **`bfa82bce20840e13f0698df67421d0b7a5b1c910477b7d8d2dba72c8f5100f88`**.

Pruebas técnicas: FFmpeg decodifica los 1667 cuadros y la pista AAC completa sin errores; PTS exactos en incrementos1/30s sin saltos; `moov` precede a `mdat` (faststart), HTTP HEAD **200**, HTTP Range **206**. Audio PSNR vs archivo40Mb/s: canales **166,131 /166,113dB**, pero las huellas PCM difieren (AAC). Similitud de vídeo SSIM global **0,984447**, no identidad. La auditoría cuadro a cuadro reveló mínimo **0,779318** (fotograma632, ~21,03s), otro menor de0,90 en el fotograma6, 14 cuadros bajo0,95. **No declarar paridad artística completa** ni ocultar este hallazgo: revisar fotogramas0,17–0,33s, 21,03s,26,4s, corredor3D, sincronía rostro/voz y máscaras. SSIM y decodificación correcta no sustituyen dos pasadas audiovisuales reales.

Evidencia en VPS:
- `native-fastpath-qa/r14-full-bitrate16-chunk180-progress-qa.json` con `verified:true`,538,4s.
- `native-fastpath-qa/r14-bitrate16-vs40-full-av-audit.json` (decodificación A/V y SSIM global).
- `native-fastpath-qa/r14-bitrate16-vs40-ssim-perframe.json` (1667 cuadros, peor cuadro632).

## Revisión inmutable, caché y descarga

El Chromium residente ahora tiene modo solo lectura explícito `?suesResidentWorker=1`; `scheduleSave()` y `saveNow()` no escriben desde ese navegador. El servidor rechaza `expectedRevision` diferente con HTTP **409** antes de crear exportación, y la clave de caché contiene bytes del proyecto, medios, motor, tasa de bits y número de cuadros por segmento.

QA de 45f,3×15f, audio continuo: primer export **13,734s**, segundo **0,105s** mediante caché automática **sin edición ni recarga manual**, SHA proyecto intacto; archivo H264/AAC exactamente igual. HTTP HEAD200 y Range206. Evidencia `native-fastpath-qa/r14-bitrate16-readonly-cache-fixture-qa.json`. Estos resultados de caché se han medido con el fixture45f; el MP4 integral de1667f no se volvió a renderizar con las correcciones de solo lectura para demostrar caché automática específica de ese archivo.

**Aplicación móvil**: ya existía `sues-export-background.js` que reclamaba el botón `#suesDownloadGo`. Se corrigió **ese controlador**, no se añadió otro. Si se solicita calidad máxima MP4/H264 a resolución nativa, y el servidor ofrece el worker residente a16Mb/s, la petición va a `segmented:true` y `expectedRevision` actual; mantiene progreso, cancelación y recuperación tras cerrar la pestaña. Otras calidades continúan usando la ruta anterior.

**Prueba real en Chromium con viewport móvil 843×376**: seleccionar “best” y pulsar “Descargar vídeo” produjo el MP4 del worker `/exports/SUES_export_xs_e240325cee4b.mp4`, con SHA256 igual al fixture de referencia, HEAD200 y Range206. Evidencia `native-fastpath-qa/mobile-ui-resident-flow-qa-v2.json`. **No se ha probado directamente en el Pixel/Android**, ni la instalación PWA ni redes móviles; esos puntos necesitan verificación del usuario.

## Precauciones antes de producción

- No activar Chrome `--no-sandbox` en producción. QA aislada lo necesitó; endurecer sandbox, acceso CDP solo loopback y gestión de perfiles/puertos.
- Hacer QA visual/artística de las diferencias puntuales (especialmente cuadro632) y doble auditoría con la skill SUES AI Film Director V1.7.1. Las diferencias podrían ser temporales, no solo compresión.
- Probar teléfono Android real, permisos de descarga, cancelación/reanudación y persistencia tras reinicios. Probar presión de memoria con proyectos distintos, y limpieza de temporales. VPS disco ~93% usado; mantener al menos reserva.
- La tasa16Mb/s supone un equilibrio propuesto, no autorización del usuario para degradar la entrega máster. Seguir conservando la ruta máster de40Mb/s hasta aprobación artística.
- **NO desplegar** sin las validaciones anteriores y autorización específica de Carlos.

Resultado: **mejora técnica real y comprobada, pero V1 pendiente de QA artística y prueba física Android**.
