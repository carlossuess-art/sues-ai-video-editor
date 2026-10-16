# Face Landmarker · prueba mínima real · 16/10/2026

Python 3.12; mediapipe 1.1.1; OpenCV headless 5.0.0.93. Modelo oficial float16/1,
3.758.596 bytes, SHA256 64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff.

POC_001 original, 38,31 s, orientado 1080×1920: 978 frames decodificados;
74 muestras a objetivo 2 fps (PTS real), 73 con cara, 0 fallback temporal.
JSON real reutilizable: examples/vision/poc001.mediapipe.json (20.576 bytes).
Propiedad frames compatible con src/vision.js; tiempo en segundos de fuente y bbox/ojos
en píxeles orientados. Ojos del sujeto: izquierda 263/362, derecha 33/133.
score=1 documenta presencia; FaceLandmarkerResult no expone confianza probabilística.

Ojos dentro de bbox: 73/73; mediana de desplazamiento entre anclas 0,246 % de diagonal,
p95 2,27 %, máximo 8,66 % entre 0,519 y 1,557 s, con pérdida inicial. No certificar
tracking perfecto: filtrar discontinuidad en el futuro track. Sin revisión visual extra.
Tests rápidos: 8 Node + 1 Python aprobados. Suite completa no repetida para ahorrar cuota.

Arranque: ver scripts/vision/README.md. Faltaba libGLESv2.so.2; extracción local del
paquete oficial Ubuntu libgles2 1.7.0-1build1 con LD_LIBRARY_PATH, sin subir binarios.
Venv actual /tmp/sues-vision-venv; modelo runtime/vision/face_landmarker.task.

IMPORTANTE: el proceso dejó el JSON completo antes de que revisión automática rechazara
una conexión inesperada del SDK a play.googleapis.com, cuyo contenido no se identificó.
No se reintentó ni se evitó el bloqueo. No repetir inferencia hasta aclarar/autorizar ese
tráfico. La validación posterior sólo leyó datos existentes, sin MediaPipe/red.

Siguiente desde chat normal: consumir frames del JSON y preparar el Reframe Plan con
núcleo existente, tratando discontinuidad inicial. No conectar a render en este bloque.
Sin Shotstack, ASR, assets, render ni otras fases. Coste externo 0 USD.
Fase 4: 40 %; global 31 %. Objetivo mínimo de detección reutilizable conseguido;
reejecución del SDK queda pendiente de auditoría de red.
