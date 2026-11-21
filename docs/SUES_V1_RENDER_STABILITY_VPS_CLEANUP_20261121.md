# SUES V1 · Render estable, reproducción ligera y limpieza VPS · 21/11/2026

## Solicitud prioritaria y entorno

Carlos informa que el render se interrumpe y que la reproducción resulta difícil; autoriza limpiar a fondo el VPS sin borrar material válido. Se intervino en FableCut Studio ya existente, `/srv/sues-fablecut-next/app`, y temporales/duplicados verificados; no se creó un motor nuevo ni se tocaron vídeos publicados.

VPS: 48 GB, 3,8 GiB RAM, 2 GiB swap. Al comenzar: **4,2 GB disponibles (92 % ocupado)**. Tras limpieza: **8,0 GB (84 % ocupado)**. Mantener WAC, producción del editor, V29, proyectos originales y biblioteca.

## Problemas comprobados y mitigaciones instaladas

FableCut `export-jobs.js` tenía watchdog `STALL_MS=120000`: un job en `running` sin actualización por dos minutos podía quedar `failed` y cerrar Chrome. `app.js` informaba del progreso durante el bucle de fotogramas, pero **no** durante mezclas largas, vaciado de cola de frames ni codificación final. Este comportamiento era una explicación plausible del estancamiento al 97 %, no una demostración de que todos los errores históricos proviniesen de ahí.

**Desplegado en Studio** (no solo en QA): `app.js` con heartbeat de progreso cada 15 segundos durante exportación, incluido audio/ffmpeg; cancelación del heartbeat en finally; máximo 1 worker JPEG en headless/baja RAM, máximo 2 en el resto. `export-jobs.js` incrementa el plazo de arranque de Chrome a 180 s y el watchdog de bloqueo real a 600 s. Los timeouts no se deshabilitan.

SHA256 producción tras publicación:
- `app.js`: `2a3f032995831a7fd8f9e61a355a4f84eaa7c46bee2c0f68fd4ec5da0f409df6`
- `export-jobs.js`: `2644fac65f829d35429b6c861325537f15666f60e746f2a3c9727778cd5070a5`
- Respaldo íntegro de ambos en `/opt/sues-video-setup/v1-render-fix-20261121/before`; parche y scripts QA/deploy en el mismo directorio.

Primer intento de deploy se **revirtió** por una comprobación demasiado estricta que asumía activo el proyecto viejo, mientras Carlos había abierto la revisión nueva. La siguiente instalación respetó el activo real, PASS, ambas carpetas de proyecto siguen accesibles. Confirmado `sues-fablecut-next` y `sues-video-editor` en marcha, HTTP200.

## Reproducción y prueba de render

- Preview aligerado del Reel 158404, H.264/AAC 720×1280, 30fps, 73,749s, 15.826.975 bytes, frente al máster 91.532.285 bytes. Descarga verificada con sesión y HTTP206 Range: `https://studio.suesholistics.com/exports/SUES_158404_V1_PRIMERA_PRUEBA_PREVIEW_720P.mp4`.
- Dos proxies 540p disponibles mediante API de FableCut: original del Reel y balanza narrativa. El editor previsualiza proxies, pero sigue exportando los originales.
- Prueba nativa en un FableCut aislado con Chrome headless usuario `suesnle` (flags de navegador QA exclusivamente): **45 frames, 1,5 s**, export `done`/100 %, MP4 H.264 1080×1920 30fps AAC, ffprobe y decodificación de vídeo/audio completas PASS. Memoria pico 1.146 GB. Evidencia `/opt/sues-video-setup/v1-render-fix-20261121/canary-real-export-proof.json`. Se eliminó el entorno QA transitorio tras validar.
- Regresión `test/export-jobs.test.js`: **4/4 PASS**. `test/proxy.test.js` heredada **NO PASS** en el chequeo de PSNR (26,54 dB frente al umbral de 35); los proxies reales reportaron `ready`, pero queda ese test por investigar.
- No afirmar que el render de un montaje complejo nuevo de 73 s o la experiencia móvil estén aprobados: todavía falta ese estrés real y revisión humana. No confundir este canario con aceptación artística o finalización completa de V1.

## Limpieza VPS verificada

- Dos `editor-state.tar` de 3.042.713.600 bytes, confirmados **idénticos por `cmp`**, consolidados mediante hardlink con las dos rutas y manifiestos conservados: aproximadamente **3 GB** físicos ahorrados.
- Borrados **24 `render-work-*` sin comprobantes**, tras descartar trabajos activos; informe de diagnóstico en `/opt/sues-video-setup/v1-render-fix-20261121/cleanup-audit/removed-render-workspaces.json`.
- Retirados `node_modules` regenerables del PoC Remotion (382 MB), con `package-lock` y código intactos, y el ZIP duplicado de Chrome (185 MB) tras validar binario funcional.
- Deduplicadas con hardlinks 21 rutas de copias QA del bruto 158404 con SHA256 igual; **original y rutas permanecen**. Manifiesto `/opt/sues-video-setup/v1-render-fix-20261121/qa-158404-original-dedupe.json`.
- Detenidos y retirados seis contenedores QA activos antiguos y 34 contenedores históricos parados, manteniendo versión actual y contenedores esenciales de rollback del editor. Sin tocar contenedores WAC.
- NO se eliminaron originales, renders verificados, proyectos, backups ni bibliotecas; no se ejecutó `docker system prune -a` indiscriminado.

## Sistema preventivo posterior

La limpieza repetible queda implementada en SUES Console. Ver `docs/SUES_SERVER_CONSOLE_CLEANUP_20261121.md`. Permite escanear, clasificar, seleccionar y borrar solo recomendados tras doble confirmación. No elimina automáticamente categorías `revisar` o `conservar`. El botón web de Sites sigue pendiente.

Siguiente: estrés render de montaje completo con nueva versión, observación móvil, confirmar proxy/frame audit y mantener disco bajo control. No modificar por defecto WAC ni V29.
