# POC_001 · análisis offline de reencuadre estable

Fecha: 16/10/2026. Fuente: `examples/vision/poc001.mediapipe.json`.
No se reejecutó MediaPipe, no hubo red, render ni coste externo.

## Detección real

- 74 muestras; 73 con cara.
- Una pérdida a 1,038111 s.
- Salto bruto máximo del ancla: 8,66 % de la diagonal entre 0,519056 y 1,557167 s.
- La mayor parte del vídeo es mucho más estable: mediana del salto bruto ~0,23 %.

## Filtro elegido

`src/reframe.js` añade un filtro de cámara desacoplado del detector:

- constante temporal de posición: 1,2 s;
- dead zone: 0,6 % de la diagonal;
- velocidad máxima del ancla: 4 % de diagonal/s;
- constante temporal de escala: 1,5 s;
- variación máxima de escala: 12 %/s.

La dead zone evita que la cámara persiga micromovimientos de cabeza. Los límites de
velocidad y escala absorben pérdidas o cambios bruscos sin convertirlos en saltos de cámara.

## Replay analítico sobre el fixture

Reproduciendo offline los 73 puntos con esos parámetros:

- movimiento máximo del crop: ~27,46 px/s;
- paso máximo del crop: ~1,29 % de la diagonal;
- zoom resultante aproximado: 1,105–1,146;
- cambio máximo de zoom: ~0,0155 por segundo.

Esto es validación numérica del algoritmo sobre el JSON guardado, no revisión visual de vídeo.

## Hallazgo de composición

La fuente ya es 1080×1920 y el sujeto está bajo y hacia la derecha. Con el zoom
conservador actual, el crop llega al borde derecho e inferior en el 100 % de las muestras.
Por tanto, el objetivo ideal de línea de ojos no siempre es geométricamente alcanzable sin
aumentar el zoom. No afirmar todavía que la línea de ojos queda en el valor objetivo.

Decisión: no forzar un zoom mayor a ciegas. En la próxima validación visual comparar:
1. perfil conservador actual (contexto y poca ampliación);
2. perfil de composición con zoom adicional limitado para elevar la línea de ojos.

## Implementación

- `src/reframe.js`: estabilizador, plan estable y resumen técnico.
- `tests/reframe.test.js`: pruebas unitarias y fixture real.
- `scripts/vision/build_reframe.mjs`: compilador offline detecciones → Reframe Plan.
- `npm run reframe -- input.json output.json` preparado en package.json.
- `npm run check` incluye los nuevos módulos.

## Pendiente

La suite Node completa y la generación del JSON final con el propio módulo deben
ejecutarse en un checkout cuando vuelva Work. Después se hará la primera revisión visual.
No conectar a Shotstack todavía hasta decidir el perfil de composición.
