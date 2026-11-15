# SUES · Motion Graphics narrativos · Tarjeta por palabras · v3

## Alcance

15/11/2026. Rama aislada feat/speech-linked-motion-grammar-20261115 del proyecto existente carlossuess-art/sues-ai-video-editor. No desplegado en FableCut, no modificado en producción y no importable aún como sues-master-story/v1. No hay acceso necesario a Hostinger ni uso de Desktop Commander.

La referencia de ingeniería inversa es el vídeo de 17,884 s, 720×1280 y 29,97 fps, sin voz. Los datos matemáticos de Gemini son estimados, no parámetros originales. El prototipo usa identidad SUES y no reproduce la paleta ajena.

## Correcciones pedidas por Carlos

1. El rectángulo aparece con cantos rectos y empieza a redondearse cuando entra la primera palabra (F8), hasta radio 62 px en F19.
2. Las palabras entran separadas: «¿Y» F8, «SI» F14, «TE» F20 y «ESCUCHARAS?» F26; cada una cuenta con su entrada independiente.
3. El grupo completo se amplía a 4,5×, se traslada Y −1950 px y termina totalmente fuera de encuadre para permitir el enlace con la siguiente escena.
4. Eliminar la esfera amarilla y la onda decorativa: ninguna explica el texto por sí misma.

## Guion A/V por capas · demostración sin audio

| ID/tiempo/frames | Voz y anclas | Cámara/A-roll | Capas y máscaras | Motion y subtítulos | SFX/música | QA y estado |
|---|---|---|---|---|---|---|
| M01 · 0–0,267 s · [0,8) | Sin voz disponible | Cámara estática, Carlos no aparece | Fondo antracita z0, tarjeta z10 x130, ancho820, altura 8→538, radio 0 | Apertura vertical desde línea recta | Sin audio | Geometría verificada localmente; PREPARADO |
| M02 · 0,267–1,067 s · [8,32) | Texto de demostración, NO ASR; 4 palabras F8/F14/F20/F26 | Cámara 1× | Tarjeta con radio 0→62 px F8–F19 y clip interno | Cada palabra en capa/tspan independiente, opacidad 0→1, blur 16→0; captions reales delegados al editor | Sin audio | Orden y esquinas verificados; PREPARADO |
| M03 · 1,067–1,700 s · [32,51) | Lectura de composición | Cámara 1× | Fondo/tarjeta/4 palabras fijas | Permanencia para leer, sin ornamentos | Sin audio | Permanencia comprobada; PREPARADO |
| M04 · 1,700–2,333 s · [51,70) | Transición a siguiente idea (no aportada) | Zoom 1→4,5 y Y 0→−1950, ease-in-out | Tarjeta y texto salen juntos por arriba, fondo conserva continuidad | El siguiente plano lo debe aportar la composición adyacente, no se inventa un título | Sin audio | Último frame sin tarjeta; PREPARADO |

## Código y pruebas

Motor: src/motion-templates/hook-drop-card-engine.js.
Pruebas: tests/hook-drop-card-engine.test.js.
Visor: examples/motions/hook-drop-card.preview.html.

70 fotogramas a 30 fps, salida vectorial SVG determinista y texto parametrizable. Parámetros opcionales wordStartFrames y wordIds permiten recibir anclas reales, pero la muestra tiene únicamente tiempos de demostración. Estado de subtítulos: delegate-to-existing-editor; el motor no sustituye esa lógica.

7 de 7 pruebas locales dirigidas PASS con Node 22.16.0. Convertidos 70/70 SVG a PNG y generado MP4 aislado 540×960, H.264, 30 fps y 2,333 s, validado con ffprobe. SHA-256 del MP4: fe51faddee1a1fb57722b56f66db630bebfc2f477863ad805163eef6e11c3422. 13 fotogramas clave inspeccionados visualmente. Este MP4 es una previsualización local y NO un render nativo ni un máster. La fuente Montserrat real no está verificada en el prototipo; pendiente calidad final, audio, safe zones con A-roll real y dos auditorías completas.

## Siguiente fase

Vincular la composición con una transcripción real con word IDs, selector de palabras clave, tiempos de edición y siguiente escena; no usar ASR del vídeo de referencia porque carece de pista de voz. Integrar solo tras comprobar las capacidades exactas del editor y aprobación creativa del guion A/V por Carlos. Preservar originales, biblioteca, FableCut, versiones publicadas y perfiles existentes.

Para continuidad entre chats, registrar la rama y el repositorio en las instrucciones del proyecto.
