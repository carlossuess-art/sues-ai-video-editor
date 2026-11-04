# Referencia 158623 · dinámica visual y tipografía · 04/11/2026

## Procedencia y fiabilidad
Referencia entregada por Carlos como `158623.mp4`. SHA256 original `a2c48eab4ad4c4c719b63a03a9b6c250057f460a8764830ad36620780bd29088`, 19.310.976 bytes, duración 7,6263 s. H.264/AAC, vídeo codificado 2424×1080 con orientación de pantalla que se visualiza como 1080×2424. Es captura de un Reel en Instagram, con interfaz, notificación «Comparte un emoji» y control de volumen del dispositivo entre ~3,25 y 5,0 s; estos elementos NO son motion graphics del Reel.

Se extrajeron y observaron **30 fotogramas a 4 fps**, espaciados 250 ms, de 0 a 7,25 s. La muestra no es el proyecto editable original y NO permite identificar con certeza nombres de fuentes, capas, efectos, curvas de easing, radios de glow ni RGB exactos. Los tiempos de inicio se estiman con incertidumbre de al menos ±0,125 s. Los datos facilitados por Carlos sobre tamaños (62–68 px base, 98–115 px protagonista), colores (#26F7FD, #59FF00, #FFD000), sombras y coordenadas 1080×1920 sirven como **objetivos de diseño**, no como metadatos extraídos directamente.

## Secuencia visual observada en las 30 muestras
| t (s aprox.) | Texto/imagen | Movimiento/narrativa |
|---|---|---|
| 0,00 | «Tras ganar», sujeto y fondo tipo código digital | Prepara relato, presencia del presentador |
| 0,25–0,75 | «una auténtica» en blanco; fondo pasa a interior neutro | Frase conectora centrada delante del sujeto |
| 1,00–1,75 | Lluvia de billetes detrás del sujeto, ambiente verde; desde ~1,25 aparece «FORTUNA» grande turquesa/cian | Visualiza concepto, mantiene «una auténtica» por encima hasta cerrar la frase |
| 2,00–3,00 | «No se compró» en blanco; «una isla» amarillo; isla/fotografía insertada en la parte alta | Cambio de objeto cuando se nombra isla; no ilustración arbitraria |
| 3,25–5,00 | «Donó» blanco, «75 MILLONES» amarillo-lima brillante y «de dólares» blanco; tratamiento verde en el entorno | Construcción de una frase en 3 jerarquías, efecto de color ambiental; control de volumen visible pertenece al móvil, no al Reel |
| 5,25–6,75 | Corte a pizarra clara gris-blanca con cuadrícula y elementos negros; texto negro se construye («al equipo de / efectos especiales / y maquillaje») | Cambio de lenguaje visual; entrada progresiva de palabras/letras, acumulación de líneas |
| 6,25–7,25 | Claqueta y utensilios de maquillaje en línea negra, colocados debajo del titular | Los objetos ilustran palabras concretas y aparecen después de que el texto introduce el concepto |

Los 30 fotogramas permiten comprobar estados visuales separados 250 ms, **no** medir keyframes intermedios ni la sincronización auditiva exacta; para validar las entradas de 100–200 ms se requiere también reproducción a 30 fps y muestreo denso local.

## Gramática visual que se debe conservar
1. **Voz → significado → objeto → movimiento.** Director IA selecciona el evento visual por palabra/idea y timestamp; no añade pop/flash/zoom automáticamente cada N segundos.
2. **Dos jerarquías como mínimo:** frases conectoras claras de peso ~600–700 y tamaño de diseño 62–68 px, palabra protagonista ~800–900 y 98–115 px, con escala relativa de ~1,5–1,8; cifras/conceptos pueden adoptar acabado propio.
3. **Acumulación por oración:** el conector no desaparece al aparecer el protagonista («una auténtica» + «FORTUNA»; «Donó» + «75 MILLONES» + «de dólares»). Al cambiar la oración se reemplaza el bloque completo; evitar duplicar la capa normal de captions.
4. **Tipografía dependiente de escena:** sobre persona, texto claro, alta legibilidad, sombra; sobre pizarra blanca, tipografía negra/oscura, mezcla de negrita y cursiva. La muestra no acredita contorno blanco de 6 px sobre texto oscuro; no imponerlo como universal.
5. **Color con función semántica y sistema de tema:** cian/turquesa para «FORTUNA», amarillo-lima para «75 MILLONES», amarillo para «una isla». No codificar esos valores neón como identidad global de SUES: adaptar al Brand Kit antracita/cobre/dorado mediante roles (`accent-positive`, `accent-quantity`, `accent-contrast`). La captura comprimida no demuestra HEX precisos.
6. **Composición adaptativa:** persona a la derecha → texto en área izquierda/pecho, siempre evitando rostro y UI del destino. Escena 100% gráfica → titular en tercio medio-superior, objetos explicativos debajo. Los puntos X510, Y680/Y960 son valores de referencia en un lienzo teórico 1080×1920, NO anclas rígidas para todas las caras, planos y plataformas.
7. **Capas narrativas:** billetes y fotograma de isla aparecen detrás/encima según oclusión y composición; pizarra clara entra como escena independiente. No asumir que un B-roll cubre toda la pantalla ni que siempre debe salir una figura recortada.
8. **Entradas/salidas con intención:** palabra → palabra clave; B-roll con transición contextual; texto mecanografiado en 5–7 s y iconos tras aparecer sus conceptos. Las curvas/easing y duraciones exactas requieren inspección de frames a 30 fps, no pueden copiarse de 4 fps.
9. **Límites QA:** bloquear texto fuera de safe zones, no tapar ojos/boca, mantener tamaño legible, no más de 2–3 líneas salvo diseño justificado, respetar ancho medido en fuente real. No usar `max-width:750px` de forma invariable si provoca saltos incómodos.
10. **Comparativa V2B:** ya usa Montserrat Bold/ExtraBold y Playfair Italic, fondos de cuadrícula, captions ~54–70 px. No alcanza la referencia por escasez de capas explicativas, cambios de lenguaje visual, acción subordinada a discurso, tipografía protagonista y transiciones naturales. Evitar copiar neones literalmente; reproducir **estructura**, no el esquema cromático ajeno.

## Próxima implementación (todavía NO realizada)
En el Director IA incorporar un evento de composición semántico `visual-beat` con `speechCue`, `layoutMode: speaker | fullGraphic`, `headlineLines`, `emphasisToken`, `backgroundLayer`, `objectLayers`, `maskedSubject`, `entrance`, `hold`, `exit`, `safeZone`, `paletteRole`. Remotion debe evaluar la escena en cualquier fotograma, sin intervalos fijos de efectos. Mantener la fuente y licencia de cada recurso. Crear primero una plantilla demostrada para esta gramática y validar con vídeo real, antes de declarar nivel DOPAMIN.

Estado: **solo análisis y documentación, sin cambios de código, merge, exportación, publicación o consumo de API**.
