# Fase 4 · comparación y validación local · 16/10/2026

Baseline reframe compilado con el módulo real: 73 keyframes; zoom 1,105247–1,145857;
velocidad crop máxima 27,463641 px/s; paso máximo 28,510308 px; variación zoom
0,015450/s. Coincide con el replay documentado. Se detectó un test que imponía
límite por muestra pese a PTS irregulares; ahora verifica el límite contractual
por segundo (4 % diagonal/s). No se relajó el motor ni se ocultó el fallo.

## Presets parametrizados

| Preset | Zoom fijo | Tope configurado | Línea de ojos objetivo | Headroom |
| --- | --- | --- | --- | --- |
| conservative | 1,12 | 1,20 | 0,40 | 0,06 de crop |
| composition (base recomendada) | 1,40 | 1,45 | 0,40 | 0,06 de crop |

Los parámetros no dependen de datos hardcodeados del POC. Smoothing posición 1,2 s,
dead zone 0,006 diagonal y velocidad máxima 0,04 diagonal/s. Zoom fijo por toma:
variación temporal 0, sin respiración. Es composición inicial, no evento semántico.
Director futuro podrá proponer énfasis con motivo; no añadir zoom periódico.

## Resultado sobre POC real

| Métrica | Conservador | Composición |
| --- | --- | --- |
| Keyframes | 73 | 73 |
| Velocidad crop máxima | 0 px/s | 27,816921 px/s |
| Paso crop máximo | 0 px | 23,194684 px |
| Cambio zoom/s | 0 | 0 |
| Mediana línea de ojos | 0,526588 | 0,411396 |
| Error medio absoluto respecto a 0,40 | 0,124513 | 0,014925 |
| Caras cortadas (bbox) | 0/73 | 0/73 |

Crops dentro de fuente en muestras y replay interpolado a 30 fps. Inicio absorbido
por smoothing y límites; ausencia a 1,038111 s se interpola entre detecciones. Al
final se mantiene último crop. No se ha repetido MediaPipe ni ASR.

## Evidencia visual y alcance

Comparativa local original/conservador/composición, vídeo de 38,274 s a 864×552/24fps
con audio original: sin APIs de render ni coste. Decodificado completo sin errores.
Fotogramas 2/10/20/35 s inspeccionados: composición eleva ojos/cara, reduce techo vacío
y conserva cabeza y torso; conservador mantiene más contexto. No se afirma reproducción
auditiva ni visionado humano completo del vídeo: se entrega para comparar percepción.
Es preview de cámara sobre tiempo fuente, sin cortes/captions; no MP4 final V1.
Original intacto. Mapeo al timeline cortado e integración export final quedan para E2E.

Validación técnica/visual de este POC completada; Fase 4 al 100 %. No equivale a
producción general: detector sólo muestreado, una cara, pérdida inicial y SDK pendiente
de aclarar tráfico play.googleapis.com antes de nuevas inferencias. No bloquea fixture.
Tests Fase 4: 50/50 suite completa; syntax OK. Safe zones siguen contrato compartido;
la resolución de overlays contra cara/captions se integrará con plantillas/motions.

## Comandos

```sh
npm test
npm run check
npm run reframe -- examples/vision/poc001.mediapipe.json runtime/vision/composition.json
npm run reframe -- examples/vision/poc001.mediapipe.json runtime/vision/conservative.json --profile conservative
# Sólo reproducir comparación histórica adaptive zoom:
npm run reframe -- examples/vision/poc001.mediapipe.json runtime/vision/legacy.json --profile legacy
python -m venv runtime/preview-venv
runtime/preview-venv/bin/pip install opencv-python-headless==5.0.0.93
runtime/preview-venv/bin/python scripts/vision/preview_reframe.py /ruta/POC_001.mp4 runtime/vision/conservative.json runtime/vision/composition.json --out runtime/vision/comparison.mp4
```

Salida JSON source-time con interpolación lineal y hold en extremos. No conectar
keyframes source-time directamente a un timeline con cortes sin mapearlos primero.

Comparativa Drive: https://drive.google.com/file/d/1CtP7UUYC2BoMg96MtfCQXTrYX9wxlHz1/view?usp=drivesdk

Fotogramas Drive: https://drive.google.com/file/d/1FdeYFyD2pGR5Y3OBxw7PToKaGjMSBYF3/view?usp=drivesdk
