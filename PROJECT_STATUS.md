# Estado técnico vigente · 17/10/2026

FASE 5/10 · BRAND KIT + TEMPLATE ENGINE
Progreso fase: 80 % (estimación técnica; estética provisional).
Progreso global: 48 % = F1–F4 (40 %) + 80 % del peso F5 (8 %).
Rama oficial: feat/phase-4-vision-camera.
Base de este bloque: c22fe9f57968f8dc6e54e10902854aa5bb8c073a.
Último hito: render semántico de cámara + tres motions dinámicos, preview real
con dos acercamientos y cita. Selección de eventos manual, no Director automático.
Suite: 101/101, npm run check, smoke de zoom anclado y tres motions con FFmpeg OK.
Coste externo nuevo: 0 USD. Sin ASR/MediaPipe/Shotstack/generación/Lovable/compras.
Necesito de Carlos: nada para seguir código; aceptación estética pendiente.

## Preview y evidencias

- 37,30 s, H.264 1080×1920/30fps + AAC; plan37,31 s (-0,01 s).
- Base composition 1,40×; dos zooms relativos 1,08× y 1,06× con rampas suaves.
  Máximo combinado 1,512×, cap absoluto1,60×. Sin zoom fuera de los eventos.
- Ojos reconstruidos de visión guardada y estabilizada; zoom alrededor de su
  posición en el encuadre. No inferencia nueva ni zoom al centro de la imagen.
- 16 captions y cierre3 s del kit compartido (Open Sans400/700 y paleta SUES).
- Cita literal «detenerte y sentir.» 14,1–17 s, colocada por encima de la cabeza.
- Replay geométrico: 1120 instantes planificados, bbox existente más cercana;
  762 checks cara/captions y 90 cara/outro, sin solapamiento. No detección30fps.
- Smoke de vídeo: ancla estable <1px en imagen270×480; marcador periférico
  sigue el 8 % esperado y vuelve después al punto original. Tres motions revisados.
- Audio AAC payload SHA256 idéntico a V2, sin cambios de voz por motions/zoom.
- Originales intactos, decodificación íntegra OK. QA comparado4/7/10/15,3/18/35 s.
- Sin escucha completa, aprobación estética, V1 o E2E de app.

## Implementación y contratos

src/semantic-render.js conecta Director Plan, plantilla, catálogo y visión.
Exige timeSpace explícito edit-timeline, reason/rule, semántica del trigger,
bindings y tipos implementados. Rechaza overlaps/gaps de zoom inválidos,
bookends, B-roll que oculte el zoom, cap combinado y cara que saldría del crop.
Rampa coseno ≥0,6 s, al menos1 s entre zooms. Sin eventos periódicos.
Anclas por spans con extremos fuente independientes al cortar: no interpolar el
hueco eliminado. Regresión añadida para ambos lados del salto.

FFmpeg perspective source/frame/cubic sobre el vídeo CFR ya concatenado usa
on/30 y preserva el ancla ocular. Captions/motions se componen después y mantienen
tamaño estable. Pipeline anterior sin director sigue funcionando.

Renderers ASS implementados: QUOTE_CARD_01 (nuevo asset), NUMBER_BADGE_GOLD_01,
DIVIDER_LINE_01. Quote-card resuelto en aliases/registro. Catálogo contiene8 assets,
pero sólo estos3 tienen renderer en este bloque. BLURRED/COMPARE/check/cross/strike
no se dan por renderizados. Los eventos no implementados fallan antes de exportar.
Posiciones seguras superior/lower-third, evitando cara y otros motions; captions
/outro reservados. Se respetan tiempos relativos de capas al escalar el evento.

Selección del preview en examples/director/calma-render-real.json: manual desde
transcript ya aceptado. No se añade un número/divisor sin motivo narrativo;
ambos están probados en fixture independiente. Director automático sigue pendiente.
No nuevas dependencias ni cambios del lock.

## Comandos

npm run reframe -- examples/vision/poc001.mediapipe.json runtime/calma/camera.json
npm run preview:prepare -- examples/preview/calma-semantic.input.json runtime/calma/semantic-preview
Copiar fuentes/OFL a runtime/calma/semantic-preview/fonts.
npm run preview:render -- --source runtime/poc/original.mp4 --bundle runtime/calma/semantic-preview --out runtime/calma/semantic-new.mp4
npm run semantic:smoke -- runtime/semantic-smoke-new runtime/calma/preview/fonts
npm test; npm run check.

Guía: docs/SUES_CALMA_SEMANTIC_RENDER.md. Para recuperar original/transcript y
fuentes: docs/SUES_CALMA_LOCAL_PREVIEW.md. Renderer local al worker Work, no al PC.
El smoke exige un directorio nuevo. Código/ejemplos de B-roll del bloque anterior
se conservan; compositor verificado y referencias excluidas como material propio.

## IDs / entregables

Repo: https://github.com/carlossuess-art/sues-ai-video-editor (1422196475).
Maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
Original: 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82. Transcript: 11cNi2n-Qkim0_pKMkz2WMle3xDWH1nEa.
Nuevo vídeo: https://drive.google.com/file/d/171YWJoZgqAA9LfJblGoA5UiR2wK1TnHH/view?usp=drivesdk
Comparación QA: https://drive.google.com/file/d/1NBVQyOz2srKrwFpYCADt9w0OZuKedbrI/view?usp=drivesdk
Motions QA: https://drive.google.com/file/d/1XjqG7eSkPjpBjcpOFhAT55jL9Y_PH6ft/view?usp=drivesdk
Auditoría: https://drive.google.com/file/d/1d4BtmOaHzx_l1J1XvMR_poNamNO9ziBb/view?usp=drivesdk
Vídeo en chat: libfile_3c54d4b9d7a081918c3af48031b20268.
Fuentes/OFL: https://drive.google.com/file/d/1el7DYji13Pj9aBOPIS5oz4KUQ8a8blj-/view?usp=drivesdk
Ejemplos compactos: examples/preview/calma-semantic.render-audit.json y calma-semantic.synthetic-result.json.
Inventario referencias: examples/references/calma-20261016.inventory.json y .temporal.json.
Medios/fuentes pesados fuera de Git. Archivos anteriores se conservan en Drive.

## Límites que siguen vigentes

Fase4 cerrada para un POC, una cara, detecciones ~2fps. Composition base1,40×,
conservative1,12×; eye-line .40 y headroom .06. El cap del perfil es para el
encuadre inicial; la capa semántica adicional tiene cap combinado1,60×.
MediaPipe1.1.1 no reejecutado: tráfico inesperado a play.googleapis.com fue
rechazado por auto-review; no se evita ese bloqueo. ASR histórico0,0039 USD,
no repetido. No nuevos modelos/servicios. Seguridad/hosting de producción pendientes.

Corte técnico [12,13) heredado del POC omite3 palabras; no es selección semántica
final. No material propio B-roll seleccionado, soundtrack/SFX, relight ni logo final.
Color natural = identidad de fuente. F6–F10 siguen foundations integradas, no
fases cerradas. No UI/backend persistente ni E2E aprobado.

## Siguiente acción exacta

Leer maestro + este estado + informe semántico. Conectar selección automática
Director desde transcript usando los contratos y renderer ya validados; mantener
los límites de plantilla. Después ampliar bindings de motions con medios y audio,
y validar recursos propios de naturaleza/retiros cuando estén disponibles.
No pedir nuevos Reels ni repetir ASR/MediaPipe por defecto. Cerrar estética antes
de cerrar F5. Bloqueos de este bloque: ninguno. Necesito de Carlos: nada ahora.

Históricos: docs/archive/PROJECT_STATUS_BEFORE_SEMANTIC_CALMA_20261017.md y
PROJECT_STATUS_BEFORE_LOCAL_CALMA_20261016.md. Evidencias anteriores siguen en
SUES_CALMA_LOCAL_PREVIEW.md y CAMERA_PROFILES_VALIDATION.md.
