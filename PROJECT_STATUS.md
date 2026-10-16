# Estado técnico · 16/10/2026

FASE 4/10 · VISIÓN: CARA, OJOS, REENCUADRE, ZOOM Y SAFE ZONES · EN CURSO
Progreso fase: 40 %.
Progreso global: 31 % = Fases 1–3 (25 %) + 40 % de Fase 4 (6 %).
Rama activa: feat/phase-4-vision-camera.
Último hito: detector MediaPipe VIDEO ejecutado sobre POC_001; JSON real de 20 KB
compatible con vision.js, reutilizable sin Python desde chat normal.

## Fase 4 · Implementado

- Nuevo `src/vision.js` provider-neutral.
- Contrato de detecciones: tiempo, tamaño de frame, caras, confianza y ojos opcionales.
- Selección de cara principal por confianza + tamaño + continuidad temporal.
- Anclaje a la línea de ojos; fallback geométrico si faltan landmarks.
- Suavizado temporal de posición y escala para reducir jitter.
- Crop vertical 9:16 limitado a los bordes de la fuente.
- Zoom base 1,08 con límite 1,35; todavía no es zoom semántico del Director IA.
- Safe zones 1080x1920 para contenido/captions/UI.
- `buildReframePlan()` produce keyframes independientes del proveedor de render.
- `package.json` incluye `src/vision.js` en `npm run check`.
- Documento técnico: `docs/PHASE_4_VISION.md`.

## Validación

- 7/7 tests aislados de visión pasan en Node 22 en el entorno de chat.
- Baseline completo anterior: 36/36 tests de Fase 3.
- Prueba rápida actual: 8/8 tests Node (7 núcleo + fixture real) y 1/1 Python.
- Suite combinada completa no repetida para ahorrar cuota Work.
- POC real: 978 frames decodificados; 74 muestras, 73 con cara (98,65 %).
- Dimensiones orientadas 1080×1920; timestamps 0–37,9508 s, sin fallback.
- Ojos dentro de bbox en todas las detecciones. Desplazamiento de ancla: mediana
  0,246 %, p95 2,27 %, máximo 8,66 % de diagonal (0,519–1,557 s, arranque/pérdida).
  No afirmar estabilidad perfecta; filtrar este salto al preparar el track.
- Coste adicional: 0 USD.
- Sin render, ASR, IA generativa, CapCut, Lovable ni nuevas suscripciones.

## Decisiones vigentes

- Tracking/visión será clásico y reemplazable antes que generativo.
- Línea de ojos estable > centro geométrico del frame.
- Zoom sólo se volverá semántico cuando el Director IA aporte motivo; esta fase sólo
  resuelve composición y estabilidad.
- El mismo track facial podrá alimentar después relight, máscaras y motions.
- Safe zones deben ser una restricción común para reencuadre, captions y overlays.

## Fases 1–3

Fase 3 quedó cerrada al 100 % con captions por bloques aceptados por Carlos.
No repetir ASR ni render de Fase 3. Baseline completo: 36/36 tests.

## Referencias visuales

El Roadmap Maestro contiene las referencias prioritarias de edición y el ranking de Carlos,
incluido el Reel de deckeanu como referencia nº1 y Sues_Reel2_May_V1.mov como nº2.
No usar esas referencias para copiar un estilo literal; extraer mecanismos para ADN SUES.

## Detector candidato

MediaPipe Face Landmarker (Python) queda como candidato preferido para el POC real:
modo VIDEO, malla facial densa, tracking interno y ejecución local/open source sin tarifa
por llamada. Se mantendrá detrás del adaptador propio; no es dependencia irreversible.
Instalado y ejecutado: Python 3.12, mediapipe 1.1.1, opencv-python-headless 5.0.0.93.
Modelo oficial float16/1 face_landmarker.task, SHA256
64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff.
No devuelve confianza de detección: score=1 es sólo proxy de presencia, no probabilidad.

## Adaptador y salida

- scripts/vision/face_landmarker.py: VIDEO, num_faces=1, muestreo objetivo 2 fps,
  inferencia lado máximo 640; bbox y centros de ojos en píxeles de fuente orientada.
- scripts/vision/requirements.txt y README.md: dependencias y comandos.
- examples/vision/poc001.mediapipe.json: JSON real completo muestreado, 20.576 bytes.
  Usar propiedad frames directamente con validateVisionFrame/buildFaceTrack.
- Fuente original local ya archivada en Drive: 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82.
- runtime/vision/poc001.detections.json es la salida local; modelo no se sube a Git.
- Detalle técnico: docs/MEDIAPIPE_POC_RESULT.md.
- No se generó Reframe Plan, keyframes, render ni trabajo visual.

## Incidencias y límite de seguridad

Faltaba libGLESv2.so.2. apt falló por permisos; se extrajo paquete oficial libgles2
1.7.0-1build1 en /tmp/sues-vision-libs. Comando ejecutado:
LD_LIBRARY_PATH=/tmp/sues-vision-libs/usr/lib/x86_64-linux-gnu /tmp/sues-vision-venv/bin/python scripts/vision/face_landmarker.py /workspace/scratch/572186c4327c/upload/PXL_20261016_141233241.mp4 --model runtime/vision/face_landmarker.task --out runtime/vision/poc001.detections.json

La ejecución escribió el JSON completo antes de que auto-review rechazara una conexión
inesperada del paquete a play.googleapis.com. Contenido transmitido no identificado.
No se reintentó ni se evadió el bloqueo. El JSON existente se validó sólo offline.
No repetir inferencia hasta aclarar/autorizar ese tráfico; no afirmar ejecución sin red.

## Siguiente acción exacta desde chat normal

Leer examples/vision/poc001.mediapipe.json y usar frames con el núcleo vision.js.
Preparar/validar por separado el Reframe Plan y tratamiento de la pérdida/salto inicial,
sin volver a instalar ni ejecutar MediaPipe. No conectar keyframes al render todavía.
Auditar el tráfico del SDK antes de nuevas inferencias; eso queda fuera de este bloque.
Bloqueos: sólo nuevas ejecuciones MediaPipe por conexión inesperada; el JSON permite
continuar cámara offline. Necesito de Carlos: nada para continuar desde la muestra.
Coste externo: 0 USD. DETENIDO tras guardar detección real y commit, por límite de Work.
