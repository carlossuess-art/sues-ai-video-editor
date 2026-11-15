# SUES · Motion Graphics narrativos · Estado del primer componente

## Fecha y aislamiento
15/11/2026. Rama: `feat/speech-linked-motion-grammar-20261115`. Código privado de preparación: **no desplegado en FableCut ni importable automáticamente**. Se preservan producción, Reels, bibliotecas, originales, B05 y aprobaciones.

## Fuente y alcance
Informe de Gemini de 25 páginas y vídeo de referencia de 17,884 s, 720×1280, 29,97 fps, sin audio. Las curvas/posiciones de Gemini son hipótesis de reconstrucción. Este primer prototipo **no copia el vídeo**: prueba su gramática con identidad SUES en una secuencia aislada de 51 fotogramas a 30 fps.

## Primer componente entregado
- `src/motion-templates/hook-drop-card-engine.js` — tarjeta desplegable, esfera con caída+rebote, cambio de radio, texto en máscara y desenfoque progresivo, permanencia, salida conjunta por cámara. Todo depende del fotograma entero, no de timers ni estados ocultos. Exporta evaluación geométrica y SVG vectorial por fotograma.
- `tests/hook-drop-card-engine.test.js` — seis pruebas dirigidas: determinismo, apertura, física estilizada, permanencia, zoom de salida, parametrización, escape de texto, preservación de captions y estado no nativo.
- `examples/motions/hook-drop-card.preview.html` — controles de reproducción/pausa, scrub por fotograma, texto y color editable. Servir la raíz del repositorio con un servidor HTTP local para que funcionen los imports ES Modules.

| Intervalo frames, 30 fps | Coreografía propuesta |
|---|---|
| [0,6] | tarjeta se despliega |
| [6,14] | esfera desciende |
| [8,21] | palabras se revelan |
| [14,23] | impacto, rebote y redondeo de esquinas |
| [23,34] | permanencia legible |
| [34,50] | zoom y subida de todo el grupo |

**Subtítulos:** no se reimplementan. La salida indica `delegate-to-existing-editor`, para respetar la regla de ocultación en el editor cuando hay motion protagonista. No hay ASR ni sincronía de voz en la muestra, porque el MP4 original no contiene audio.

## QA y siguientes pasos
El código de esta plantilla se reprodujo en un entorno local aislado con Node 22.16.0. **6/6 pruebas dirigidas PASS** (`node --test tests/hook-drop-card-engine.test.js`), cubriendo determinismo, trayectorias, rebote, tiempos, escape de texto y separación de captions. Se generaron 51 imágenes PNG desde SVG vectoriales y un MP4 de previsualización de **1,70 s / 540×960 px / 30 fps**, con codec H.264, validado mediante ffprobe. SHA-256 del MP4 de prueba: `d6c730d0d6a64279bf8197bc513e04edbaa93f09d7894a493dac74c148e3a5c7`. **El render no es nativo FableCut ni 1080×1920.** No se ha acreditado Montserrat en el entorno de pruebas (fallback Noto Sans). QA visual inicial: encadenamiento de apertura, caída, deformación y salida reconocible; calidad final de tipografía, sonido, colisiones con texto real y QA en móvil aún pendientes. La evaluación visual es preliminar y no equivale a las dos revisiones completas requeridas para un Reel. No se han vuelto a ejecutar las regresiones generales del repositorio en este cambio. No equivale a implantación en servidor, ni a aprobación creativa, ni a soporte nativo del contrato maestro.

Prioridad siguiente: conectar el plan de narración existente al compositor aislado con word IDs reales, implementar después contador con objeto y barras con tendencia, y ampliar la biblioteca sin duplicar presets. Antes de un Reel real: selector interactivo de palabras reales, guion A/V por capas y revisión de Carlos, permisos y recursos, mapeo autorizado al comando nativo, render privado y dos revisiones audiovisuales. **No modificar producción.**

Para preservar continuidad entre chats, añadir el repositorio y esta rama a las instrucciones de proyecto.
