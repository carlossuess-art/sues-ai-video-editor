# Fase 4 · Visión / cámara inteligente

Objetivo: convertir detecciones de cara/ojos en un plan de reencuadre vertical estable,
con zoom anclado al rostro y safe zones, sin acoplar el motor a un proveedor concreto.

## Implementado en este bloque

- `src/vision.js`: contrato de frames con bounding boxes, score y ojos opcionales.
- Selección de cara principal con continuidad temporal, confianza y tamaño.
- Anclaje real a ojos; fallback geométrico cuando el detector no entrega ojos.
- Suavizado temporal independiente de posición y escala para evitar jitter.
- Cálculo de crop 9:16 dentro de los límites de la fuente.
- Zoom base limitado y dependiente del tamaño aparente de la cara.
- Safe zones 1080x1920 para contenido, captions y UI lateral/inferior.
- `buildReframePlan()`: salida determinista provider-neutral con keyframes.

## Principios

1. El motor no decide zoom por intervalo fijo.
2. La línea de ojos es la referencia de composición, no el centro del frame.
3. El detector será reemplazable: MediaPipe/OpenCV u otro backend debe normalizarse
   al contrato de `vision.js`.
4. Nada generativo en esta fase.
5. El reencuadre debe respetar safe zones antes de captions/motions.
6. Relight futuro podrá reutilizar el mismo track facial, pero no forma parte de este bloque.

## Validación

Los 7 tests aislados de `tests/vision.test.js` pasan en Node 22:
contrato, continuidad de cara, ojos/fallback, smoothing, límites de crop,
safe zones y emisión del plan.

La suite completa del repositorio no se ha repetido todavía en un checkout completo.
El último baseline completo de Fase 3 sigue siendo 36/36.

## Siguiente paso

Integrar un detector real de cara/ojos sobre un vídeo de prueba, normalizar sus resultados
al contrato actual y generar un `Reframe Plan` real. Después, conectar esos keyframes
al adaptador de render y validar visualmente que la cara no salta y que la línea de ojos
permanece estable.


## Detector candidato para POC real

Candidato preferido: **MediaPipe Face Landmarker (Python)** detrás de un adaptador propio.

Motivos:
- modo VIDEO para frames decodificados;
- salida de malla facial densa (478 landmarks), suficiente para ojos, bbox y futuras máscaras;
- tracking interno en modo vídeo para reducir inferencias repetidas;
- paquete local `mediapipe`; no requiere API de pago por vídeo;
- OpenCV puede suministrar los frames y timestamps.

Documentación oficial:
https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/python

Estado: decisión de POC, todavía NO integrado ni validado sobre el vídeo real. El siguiente
bloque necesita checkout completo, instalar/validar MediaPipe + OpenCV + modelo, ejecutar
sobre vídeo y comparar el track resultante con el contrato JavaScript actual.
