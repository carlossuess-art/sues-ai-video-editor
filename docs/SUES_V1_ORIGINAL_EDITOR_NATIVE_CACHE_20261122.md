## Aclaración de identidad del editor original (22/11/2026)

**Nombre correcto indicado por Carlos: SUES iStudio** (no «Sway Studio»). El nombre literal `SUES iStudio` no aparece aún en los archivos/repo consultados; debe verificarse si corresponde exactamente al antiguo editor publicado en `editor.suesholistics.com`. Routing del Caddy VPS verificado: `editor.suesholistics.com` → `127.0.0.1:3010` (editor anterior); `studio.suesholistics.com` → `127.0.0.1:7780` (FableCut protegido por puerta de acceso). No confundir nombres de producto con dominio ni ejecutar cambios de routing sin permiso. El motor histórico FFmpeg está en este mismo repo, `src/local-pipeline.js`, `src/render-worker.js`, `scripts/templates/render_local_preview.py`.

# SUES V1 · Motor nativo conservador y exportación reutilizable · 22/11/2026

**Estado: implementación experimental aislada y pruebas técnicas reales superadas en subset sencillo; NO DESPLEGADA y NO APROBADA para R14 completo.** No se ha instalado otro producto ni consumido créditos externos. El editor publicado y V29/originales/WAC/DNS permanecen sin cambios.

## Qué se encontró en el editor anterior

- El sistema anterior alojado en `editor.suesholistics.com` utilizaba una cadena local propia con **FFmpeg**: `src/local-pipeline.js`, `src/render-worker.js` y `scripts/templates/render_local_preview.py`.
- En `docs/SUES_PLAYER_PREVIEW_EXPORT.md` se especifica que el botón **Exportar** solo descarga el MP4 existente de una previsualización vigente; repetir una descarga no debe volver a renderizar. Es una de las diferencias respecto al actual FableCut.
- El repo también conserva `src/provider.js`, un adaptador antiguo a **Shotstack Stage**, servicio cloud que podría consumir créditos; **no se usó** ni se contrató. No se ha encontrado un proyecto o repositorio con el nombre literal **Sway Studio**; no atribuirle ese adaptador por suposición.
- Registros reales de `/opt/sues-video-setup/editor/jobs/*/job.json` y `ffprobe`: los reels antiguos de **73,766667 segundos** tardaron aproximadamente **9,7, 9,8, 10,5 y 11,8 minutos** en trabajos completos; otros de **70,9 segundos**, 16,2 y 34,1 minutos. Por tanto el primer render del editor anterior no era inmediato. La descarga del MP4 previamente generado sí era mucho más rápida.

## Componentes nuevos versionados

- `src/engine-next/sues-export-reuse.cjs`: caché opcional `SUES_EXPORT_REUSE=1`, clave SHA256 de la **instantánea original de proyecto**, bytes de todos los medios locales y archivos del motor FableCut, perfil y segmentación. Valida archivo, SHA, tamaño, fps, número de cuadros, H264 y AAC antes de devolver una exportación anterior. Entrada persistida en `exports/.sues-export-reuse-v1.json`; inválida si cualquier contenido cambia. No se comparten resultados entre revisiones diferentes. Soporta `snapshotRaw` cuando el proyecto vivo cambia durante exportación.
- `src/engine-next/sues-native-ffmpeg.cjs`: preflight `evaluate(project,{dataDir})` y grafo FFmpeg `command(plan,out)`. Acepta únicamente un subconjunto demostrado: fuente CFR H264/yuv420p **30fps** a tamaño del proyecto, cortes frame-exactos del A-roll V1, clips sin efectos ni keyframes, sin capas/comps/máscaras, y a lo sumo audio A1 plano con volumen unidad `volume=1, gain=0 dB`. Comprueba la fuente real con `ffprobe` y rechaza propiedades desconocidas, volumen del vídeo no silenciado y ganancias/fades no soportadas. Una composición compleja pasa al motor de respaldo sin perder efectos.
- `patches/fablecut-sues-native-export-reuse-20261122.patch`: diff aplicable al `sues-segmented-export.js` de la candidata V8 aislada, con dispatcher `executeNative`, progreso, cancelación SIGTERM, validación final H264/AAC, publicación atómica, caché y restitución de revisión. Requiere instalar los dos módulos anteriores en esa misma instancia.
- `tests/engine-next/export-reuse.test.cjs`: test Node PASS de invalidación por edición, medio, motor, perfil, FPS, alteración del MP4 y desactivación por defecto.
- `tests/engine-next/native-ffmpeg.test.cjs`: test Node PASS de salida real H264/AAC de 30 fotogramas y bloqueo seguro de efectos, comps, escala, propiedades desconocidas y gain 1 dB.

**Activación en QA:** `SUES_SEGMENTED_EXPORT=1`, `FABLECUT_ENABLE_AUDIO_ONLY=1`, `SUES_EXPORT_REUSE=1`, `SUES_NATIVE_FFMPEG=1`. Los nuevos interruptores por defecto están apagados. No modificar el servicio productivo con estas variables sin superar QA de Reel completo y autorización.

## Pruebas E2E verificadas en VPS

- QA WebCodecs + cache, 15 cuadros: primera exportación **36,25 s** y segunda petición al mismo fichero **0,086 s**. Cambiar proyecto invalida caché. `native-fastpath-qa/export-reuse-e2e-qa.json`.
- QA nativa API con A-roll y voz R14 (únicamente base de 12s, sin máscaras): 360 fotogramas H264/AAC 1080×1920, **29,675 s** primera exportación, **0,291 s** repetición, HEAD 200, GET Range 206. MP4 exacto byte por byte respecto al ejecutado directamente por CLI, SHA256 `f3aea09d7a28faac3ea4dfe39ab135ad2cfbe57663f4fc142cd9bafcd0017c67`. `native-fastpath-qa/native-api-e2e-qa.json`.
- QA de edición concurrente con snapshot después de corregir `gain=0`: exportación **31,67 s**, MP4 del proyecto original con mismo SHA, edición simultánea preservada, revisión modificada no reutiliza caché, al restaurar el proyecto exactamente se obtiene MP4 en **0,541 s**. `native-fastpath-qa/native-snapshot-e2e-final-qa.json`. Variación sin límite de CPU secundario anterior ~44,8s no es referencia única de rendimiento.
- Cancelar una exportación nativa mata el proceso y no publica MP4 incompleto; se corrigió el mensaje de error de cancelación. La siguiente exportación funcionó **30,58 s** y se recuperó por caché, `native-fastpath-qa/native-after-cancel-qa.json`.
- **Persistencia entre reinicios demostrada:** terminado el proceso original, servicio nuevo con mismo proyecto/medios/versión recuperó MP4 validado en **0,506 s**, HTTP HEAD 200. `native-fastpath-qa/native-restart-qa.json`.
- R14 original completo: **RECHAZADO por preflight** a causa de efectos y gain/keyframes; debe renderizarse por fallback no optimizado. La exportación completa segmentada que sí preservó los 1667 cuadros tardó **36,5 minutos**. Se mantiene el informe anterior [SUES_V1_NATIVE_RENDER_BENCH_20261122.md](SUES_V1_NATIVE_RENDER_BENCH_20261122.md); el híbrido RGBA 15 cuadros/60s y SSIM~0,94 es rechazado.

## Qué está hecho y qué NO

**Hecho:** volver a utilizar MP4 de la misma revisión, ruta nativa FFmpeg autenticada mediante endpoint del editor para clips sencillos, progreso, descarga, invalidación por edición y fuente, cancelación, preservación de instantánea, QA de reinicio. Todo en `/opt/sues-secure-headless-qa-20261122/app-export-reuse-qa` y sus datos aislados.

**No hecho:** aplicar patch al árbol productivo; integración de todas las capas R14 en FFmpeg/HyperFrames, render completo 1667/1667 más rápido, QA visual + auditiva de dos pasadas, prueba descarga Android real, benchmark con hardware de GPU; aprobación artística de Carlos. **No afirmar V1 exportación resuelta.**

## Siguiente paso técnico exacto

1. Portar de forma **equivalente**, empezando por los tipos reales del R14: A-roll con keyframes de escala/traslación, múltiples audios y ganancia, máscaras sujetas a matte, B-roll y comp de textos/palabras; preprocesar movimientos y figuras complejas como recursos reutilizables cuando el motor existente ya admita entregarlos. Expandir `Native.evaluate` por funciones demostradas, jamás eliminar o degradar operaciones desconocidas.
2. Montar worker de composición sobre FFmpeg con caché por segmento/revisión/media y pruebas de paridad **en los intervalos donde se añada soporte**. Medir costo de render, no solo descarga; no aceptar pruebas sintéticas como calidad del Reel.
3. Exportar R14 completo 55,5667s/1667f, comprobar SHA de originales, imagen, sonido, sincronización, máscaras y captions con dos pasadas, y descargar desde Android antes de desplegar. Si el VPS de 1vCPU no puede, medir un equipo más potente o hardware cliente antes de contratar servicios.

**Todo comprobado el 22/11/2026 en el VPS `srv1841004`. Sin gastos externos, ni nuevos editores o producción modificada.**
