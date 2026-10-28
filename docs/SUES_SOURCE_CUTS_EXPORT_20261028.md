# SUES Editor · Recorte del bruto y calidades de descarga · 28/10/2026

## Estado

**Rama aislada:** `feat/manual-adjust-studio-20261028` (local en `srv1841004`).
**Proyecto:** `/opt/sues-video-setup/manual-adjust-work-20261028`.
**Producción:** contenedor `sues-video-editor` sigue montando `/opt/sues-video-setup/release-update.78zyka2k` y **no recibió este código**.

## Funciones implementadas

1. Al subir o recuperar un bruto con transcripción disponible, abre «2 · Recortar el bruto» **antes** del Director IA.
2. GET autenticado `/api/uploads/{sha}/cut-suggestions` entrega propuestas deterministas basadas en transcripción y timestamps reales; la UI no elimina nada automáticamente.
3. «Eliminar silencios · dejar 0,5 s» selecciona las pausas con huecos >0,65 s, conservando aproximadamente 0,5 s (30fps) entre palabras; los cortes de menos de 0,12 s se descartan.
4. Posibles muletillas y repeticiones textuales cercanas se presentan separadamente. **No** hay aún detección semántica avanzada por modelo IA ni análisis VAD de respiraciones: cualquier propuesta que quite voz exige revisión humana.
5. Usuario puede seleccionar/desmarcar candidatos individualmente, marcar inicio y final manualmente con controles y saltar los tramos en la vista previa del original.
6. Al continuar, pasa `sourceCuts` (rangos sobre el **bruto original**) al contrato de edición; se almacenan en settings y fingerprint para que sean reversibles. `keptSegments` + `buildTimeMap` + `mapWordsToTimeline` y render FFmpeg reconstruyen tanto vídeo como audio/subtítulos. La fuente original no cambia.
7. Selector de descarga: **1080p** usa el MP4 final `/api/jobs/{id}/media`; **720p ligero** usa el MP4 del sistema existente de previsualización `/api/jobs/{id}/preview`. Ambos se sirven autenticados y con soporte HTTP Range. No genera nuevamente el montaje ni usa IA.
8. `src/editor-server.js` incluye archivos JS/CSS nuevos en allowlist; `web/sw.js` versión v27 cachea las nuevas hojas y scripts públicos del shell, nunca API/media.

## Infraestructura de reproducción realmente desplegada

- `https://editor.suesholistics.com/ish/*` pasa al servicio byte-range permanente en `127.0.0.1:3057`.
- Unidad habilitada: `sues-ish-byte-range.service`, servicio de Python de solo lectura `www-data`, código `/usr/local/lib/sues-range-file-server.py`.
- Validado públicamente: `Range: bytes=1024-2047` => `206 Partial Content`, descarga exacta de 1024 bytes.
- Caddy: `/opt/sues-video-setup/proxy/Caddyfile` con backup `Caddyfile.before-permanent-range-20261028`.
- El viejo proceso de `SimpleHTTP` en 3055 sigue presente para compatibilidad histórica pero ya no sirve `/ish`.

## Tests realizados

- 12/12 pruebas de source cuts / manual caption visibility (Node).
- 13/13 pruebas de API estática, fuente y flujo con sesión autenticada (Node).
- QA browser móvil 393×852 y escritorio 1360×900: propuestas, selector por elemento, continuar con un corte, selector 720/1080; cero errores de JS y sin overflow.
- Prueba end-to-end FFmpeg en contenedor sin red: cortar 2 segundos de un clip sintético de 8 segundos crea MP4 de ~6s, conserva stream original de audio/vídeo y hash del bruto original. **1/1 PASS**.
- Smoke con transcripción del reel real de 70,89 s: se generan propuestas de silencios, `prepareProject` con dos de ellos crea timeMap de tres tramos y reduce duración sin cambiar SHA del source.

## Riesgos y tareas P0 antes de desplegar V1

- Repetir QA completo en navegador autenticado, archivo subido real, transcripción Whisper, pantalla de recortes y render de nueva versión.
- Verificar que al aplicar cortes antes del plan Gemini se recalculan encuadres, efectos y tiempos de recursos sincronizados; aquellos que apunten al material fuente no deben perder sincronía.
- No volver a aplicar planes para el bruto sin remapear operaciones si hay cortes posteriores.
- Comprobar que los cortes propuestos no truncan sílabas y que el render no deja saltos de audio; los timestamps Whisper pueden ser imprecisos. El usuario debe poder escuchar cada límite.
- La selección de la «calidad 720p» usa la misma compresión de la vista ligera (CRF 28); si se quiere exportación 720p de alta calidad como producto diferenciado, añadir codificación por demanda a bitrate superior, caché y pruebas.
- Proteger abandono/navegación durante la revisión de recortes y corregir la posible persistencia accidental de un análisis anterior.
- No hacer merge ni desplegar producción hasta validar y preservar ramas del editor y pendientes de Work.

## Pendiente P1

- Frases no deseadas detectadas semánticamente mediante IA, con motivos y puntuación de confianza (sin corte automático).
- Cortes por VAD real: contrasta voz y respiraciones con timestamps, sin asumir que cualquier hueco en ASR es silencio.
- Arrastrar límites de corte en pantalla con reproducción en bucle del punto de entrada y salida, en vez de los campos numéricos de V1.
- Exportación 720p de alta calidad opcional independiente del proxy ligero, si el usuario la demanda.
