# Estado técnico vigente · 17/10/2026

FASE 5/10 · BRAND KIT + TEMPLATE ENGINE
Progreso fase: 80 % (estimación técnica; estética provisional).
Progreso global: 48 % = F1–F4 (40 %) + 80 % del peso F5 (8 %).
Rama oficial: feat/phase-4-vision-camera.
Base de este bloque: 27c5962f1a2ba5dd1b266bbc88b3725ab61ad03d.
Último hito: Director automático por reglas léxicas + pipeline de un comando +
estudio web local con trabajos persistentes. Render automático real conserva75/75 palabras.
Suite: 114/114 y npm run check (src/scripts/web); Python compile OK.
Smoke API→plan→ajustes→worker FFmpeg→MP4→Range real OK. Audio sintético OK.
Sin aceptación E2E humana ni cierre estético.
Coste externo nuevo: 0 USD. Sin ASR/MediaPipe/Shotstack/generación/Lovable/compras.
Necesito de Carlos: nada para seguir código; aceptación estética pendiente.

## Bloque automático + app local

- F5 permanece80 % y global48 %: estética provisional sin aceptación nueva.
- F7/F8 avanzan en paralelo, sin declararlas cerradas ni sumar pesos por foundations.
- src/automatic-director.js: selección determinista por lexicón español, no LLM.
  Índices de palabras, tiempos originales y reglas como evidencia; citas literales.
- src/local-pipeline.js: guarda bundle, fingerprint de motor/datos/fuentes y ajustes.
  Efectos no seguros se descartan con motivo. No ocultar fallos de la base.
- Nuevo montaje sin corte mecánico12–13s: duración38,30s;75/75 palabras,16captions,
  dos zooms1,07× (intensidad75 %) y cita exacta «detenerte y sentir.». Original intacto.
- src/editor-jobs.js + editor-server.js + web/: app loopback con sesión protegida,
  catálogo de perfiles preparados, trabajos, captions editables, zoom, motions,
  exportación, cancelación, reproductor y descarga con Range.
- Trabajos atómicos, lock servidor/worker, idempotencia, reinicio→FAILED y reintentos
  nuevos sin sobrescritura. No credenciales de proveedor, rutas ni comandos por HTTP.
- Sigue cloud-first: app local es harness del worker Work, no despliegue público ni
  obligación de render en PC. Subida nueva/ASR/visión integral no están implementados.
- QA visual de navegador pendiente: no navegador local instalado; cloud browser no
  alcanza loopback. Pruebas API cubren el lifecycle; no afirmar QA visual de UI.
- Integración real: job0c39a89e-48ae-461e-b886-36d73ce58c9f DONE; un render pese
  a POST duplicado. Ajustes75 % de intensidad y caption literal guardado como manual.
  Descarga MP4 por Range devuelve206 y1024bytes válidos; decodificación íntegra.
- Vídeo final38,30s,18.602.463bytes, SHA256
  a5e14849b73272fbf7f194c7d2851559d3b741b4ad3f5a5a0dc9586d61efed6a.
- Replay1150instantes,809checks cara/caption,90cara/outro, máximo1,498×.
  Son proyecciones de detecciones existentes (~2fps), no nueva inferencia30fps.
- Fingerprint ahora incorpora bytes de original/música además de motor/datos/fuentes.
  Tras ese endurecimiento se verificó manifest idéntico y filtro/ASS byte idénticos
  al render real. Evidencia examples/preview/calma-automatic-real.audit.json.
- Música opcional propia/licenciada declarada por operador: gain<=0,18, sourceIn,
  fades, duck sólo sobre música por voz y limitador0,95. Sin loop implícito.
  Hash/probe de audio y antes/después. Preview real sin música; carpetas04_AUDIO,
  02_ASSETS y03_MOTION GRAPHICS vacías al revisar el17/10. Referencias no se reutilizan.
- Smoke tonos440/880Hz: voz0,24975; música fuera de voz0,01497 y bajo voz0,00315
  (ratio0,2104); fadefinal0,00109. No escucha/elección musical de Carlos ni SFX nuevos.
- UI añadida de consulta de Plantillas, Brand Kit real y catálogo8/3renderers;
  sólo CALMA operativa. Manifest/icono provisional/SW de shell, sin cachear API,
  vídeos, transcripts ni tokens. Instalación PWA y revisión visual pendientes.
- Guía ejecutable: docs/SUES_LOCAL_EDITOR.md. Config: examples/projects/calma-local.example.json.
- Comandos: npm run automatic:preview -- CONFIG NUEVO_DIR --render;
  npm run editor -- CONFIG runtime/editor-jobs 4173. No coste externo nuevo.

## Preview anterior y evidencias

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

## Entrega automática vigente

Vídeo: https://drive.google.com/file/d/1--Al_j2ZuMZlVMDe9JTw7a4dYGsAiz1B/view?usp=drivesdk
Chat: libfile_3c26d9eeb0548191aacbe82aca5e9427.
Auditoría compacta: examples/preview/calma-automatic-real.audit.json.
Plan automático exacto: examples/director/calma-automatic-real.json.
Audio smoke: examples/preview/calma-audio.synthetic-result.json.
QA interna6frames: runtime/delivery/CALMA_AUTOMATICO_FINAL_QA.jpg. Captions/cita/outro
vistos sin tapar rostro en muestras3/12,5/16/18/25,5/36s. No escucha completa.

## IDs / entregables anteriores

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

El preview semántico anterior conservaba el corte técnico [12,13); el nuevo
pipeline automático lo retira y conserva todas las palabras. No material propio B-roll seleccionado, soundtrack/SFX, relight ni logo final.
Color natural = identidad de fuente. F6–F10 siguen foundations integradas, no
fases cerradas. Hay UI/backend local persistente; no despliegue público ni E2E humano aprobado.

## Siguiente acción exacta

Leer maestro + este estado + docs/SUES_LOCAL_EDITOR.md. Código actual en rama oficial,
checkpoint anteriorad281377f7dc2d7dc404d2132925b2b70824665e; este bloque añade audio,
vistas de consulta/PWA shell y evidencias reales. No crear proyecto nuevo.

Antes de cerrarF5/F9 hace falta aceptación estética de Carlos (no solicitada mientras
duerme). Para producto cloud: implementar cola/worker desplegado y almacenamiento
privado duradero, HTTPS/autenticación/aislamiento, ingesta y análisis de vídeos nuevos.
Respetar bloqueo MediaPipe1.1.1; no repetir tráfico rechazado ni llamadas pagadas ASR
por defecto. Director léxico no sustituye el Director IA semántico completo.

Se puede seguir sin coste con implementación de interfaz de proveedor/workers,
pruebas de contrato y optimización editorial offline. No lanzar servicios o compras
nuevos sin autorización concreta. B-roll y música propios: carpetas vacías, no pedir
más Reels ni tratar referencias como recursos propios. Necesito de Carlos: nada ahora.

Histórico anterior: docs/archive/PROJECT_STATUS_BEFORE_AUTOMATIC_EDITOR_20261017.md.
