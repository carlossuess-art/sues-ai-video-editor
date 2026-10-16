# Detector mínimo · MediaPipe Face Landmarker

Python 3.12 probado. No necesita API key, Shotstack, ASR ni GPU.

```sh
python -m venv .venv-vision
.venv-vision/bin/pip install -r scripts/vision/requirements.txt
mkdir -p runtime/vision
python -c "import urllib.request; urllib.request.urlretrieve('https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', 'runtime/vision/face_landmarker.task')"
.venv-vision/bin/python scripts/vision/face_landmarker.py /ruta/POC_001.mp4 --model runtime/vision/face_landmarker.task --out runtime/vision/poc001.detections.json
.venv-vision/bin/python -m unittest discover -s scripts/vision -p 'test_*.py'
node --test tests/vision.test.js
```

Linux necesita `libGLESv2.so.2` (`libgles2` en Debian/Ubuntu). Instalar con el gestor
del sistema si falta, aunque la inferencia sea CPU. En Work el venv está en
`/tmp/sues-vision-venv` y puede caducar. Modelo float16 versión 1, 3.758.596 bytes,
SHA256 `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`.
Modelo/vídeos/resultados grandes permanecen fuera de Git.

Salida `{version, provider, mode, model, dependencies, frames:[...]}`.
`frames` es directamente compatible con `validateVisionFrame` de `src/vision.js`.
Cada frame contiene `time` en segundos de fuente, dimensiones orientadas y `faces`:
bbox en píxeles + `leftEye`/`rightEye`, centros de las esquinas del ojo del sujeto
(263/362 y 33/133). Bbox deriva de la envolvente de 478 landmarks; no es un detector
independiente ni identificación de persona. No se refleja horizontalmente.

La API Python no expone confianza de detección en FaceLandmarkerResult: `score=1`
es sólo presencia de resultado, documentada en `scoreKind`; no probabilidad ni score
de blendshapes. Umbrales internos 0,5; `num_faces=1`, suavizado interno VIDEO.

Se decodifica la fuente completa, muestreando a objetivo 2 fps; PTS de OpenCV en
milisegundos y fallback documentado a índice/fps si no es monótono. Inferencia con
lado máximo 640, coordenadas devueltas sobre el tamaño original orientado. Sin render.
El JSON real pequeño de `examples/vision/` permite seguir desde chat normal sin
instalar Python: leer `frames`, validar y preparar el plan de cámara por separado.

Guía oficial: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/python

## Estado de ejecución / red

La ejecución real terminó de escribir el JSON (74 muestras) antes de que la revisión
automática bloqueara una conexión inesperada del paquete a play.googleapis.com.
No se ha identificado el contenido transmitido. No se reintentó ni se evadió el bloqueo.
NO repetir inferencia hasta aclarar o autorizar esa conexión; consumir el JSON existente
no ejecuta MediaPipe ni usa red. No afirmar que esta versión funciona sin red.

En este Work la instalación de libgles2 en el sistema falló por permisos del caché apt.
Se extrajo el paquete oficial Ubuntu libgles2 1.7.0-1build1 (17,1 KB) en
/tmp/sues-vision-libs; arranque utilizado: LD_LIBRARY_PATH=/tmp/sues-vision-libs/usr/lib/x86_64-linux-gnu
/tmp/sues-vision-venv/bin/python scripts/vision/face_landmarker.py ...
No se guarda biblioteca/modelo en Git. Los temporales pueden desaparecer.
