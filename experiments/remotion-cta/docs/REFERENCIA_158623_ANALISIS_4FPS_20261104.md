# Referencia 158623 · dinámica visual y tipografía · 04/11/2026

## CONTRATO TÉCNICO PRIORITARIO · TABLA DE CARLOS ACEPTADA SIN RESERVAS
Carlos confirma que la tabla procede de una IA especializada en análisis audiovisual y ordena considerarla **fuente técnica válida y vinculante para esta referencia**. El motor implementará los valores especificados sin volver a debatir su exactitud por comparación visual. La observación a 4 fps se usa para comprender dinámica y para QA de la futura implementación, nunca para degradar la autoridad de la tabla.

### Valores por segundo · lienzo 1080 × 1920
| Segundo | Texto / familia / peso | Tamaño | Color y efecto | Centro X / Y |
|---|---|---|---|---|
| 00:00 | «una auténtica» · Montserrat/Inter Semibold | 62 px | Blanco #FFFFFF; sombra #000000 60%, blur 8 px | X510 Y960 |
| 00:01 | L1 «una auténtica» Montserrat Semibold; L2 «FORTUNA» Montserrat/Poppins Black/ExtraBold | 62 / 115 px | L1 blanco; L2 cian #26F7FD, glow #00E5FF radio 25 px opacidad 80% | X510, Y940 / 1035 |
| 00:02 | L1 «No se compró» Montserrat Semibold; L2 «una» Montserrat ExtraBold | 65 / 105 px | L1 blanco; L2 #FFD000, sombra suave | X520, Y930 / 1020 |
| 00:03 | «Donó» Montserrat Bold | 68 px | Blanco, sombra paralela negra | X530 Y910 |
| 00:04 | L1 «Donó» Bold; L2 «75 MILLONES» Black; L3 «de dólares» Bold | 68 / 98 / 68 px | L1/L3 blanco; L2 verde #59FF00, glow #32CD32 radio 20 px; destello ambiental verde Screen 40% | X520, Y890 / 975 / 1055 |
| 00:05 | «al equipo» Montserrat; «al» ExtraBold Italic, «equipo» Semibold Italic | 85 px | Relleno #1E1E1E, contorno blanco #FFFFFF 6 px, sombra 3D suave | X500 Y680 |
| 00:06 | L1 «al equipo de», L2 «efectos especiales», L3 «y maquillaje» · Montserrat Bold/ExtraBold, cursiva selectiva | 80 px | #1E1E1E, contorno #FFFFFF 6 px, sombra #000000 al 35% | X540, Y680–890 |

### Reglas condicionales adoptadas
- **Persona en plano medio/corto:** titular anclado al pecho Y890–1060 (46–55% altura), evitando boca/barbilla; compensación X510–520 si sujeto ligeramente a la derecha mirando a izquierda.
- **Escena full motion graphics / pizarra:** texto en Y680–890, espacio de iconos Y1000–1400; claqueta X300 y maquillaje X780 como ejemplo concreto.
- **Texto conector:** Montserrat/Inter/Poppins 600–700; 62–68 px, blanco, sombra negra blur 8, offset Y4, opacidad 60%.
- **Palabra protagonista:** ExtraBold/Black 800–900, 98–115 px y escala 1,5–1,8 veces la base; mayúsculas generalmente, nueva línea independiente.
- **Colores semánticos en preset exacto:** riqueza = #26F7FD + glow #00E5FF radio 25; cantidades = #59FF00 + glow #32CD32 radio 20 + ambiente verde Screen 40%; contraste/negación = #FFD000 sin neón, con sombra.
- **Pizarra:** fondo claro, texto #1E1E1E con contorno blanco 6 px, mezcla de negrita y cursiva.
- **Build-in acumulativo:** conservar L1 cuando entra L2 en la misma oración; máximo 2–3 palabras por línea y ancho objetivo hasta 750 px; construir por voz, no por intervalos fijos.
- **Fidelidad:** reproducir primero el preset de referencia con los valores exactos. Más adelante, si Carlos lo solicita, añadir variaciones cromáticas/posicionales configurables para SUES sin sobrescribir el preset.

## Procedencia y fiabilidad
Referencia entregada por Carlos como `158623.mp4`. SHA256 original `a2c48eab4ad4c4c719b63a03a9b6c250057f460a8764830ad36620780bd29088`, 19.310.976 bytes, duración 7,6263 s. H.264/AAC, vídeo codificado 2424×1080 con orientación de pantalla que se visualiza como 1080×2424. Es captura de un Reel en Instagram, con interfaz, notificación «Comparte un emoji» y control de volumen del dispositivo entre ~3,25 y 5,0 s; estos elementos NO son motion graphics del Reel.

Se extrajeron y observaron **30 fotogramas a 4 fps**, espaciados 250 ms, de 0 a 7,25 s. La muestra no es el proyecto editable original y NO permite identificar con certeza nombres de fuentes, capas, efectos, curvas de easing, radios de glow ni RGB exactos. Los tiempos de inicio se estiman con incertidumbre de al menos ±0,125 s. **Prioridad documental actualizada por Carlos:** la tabla técnica de fuentes, tamaños, colores, ubicaciones y efectos obtenida mediante IA especializada en análisis audiovisual se **adopta íntegramente como especificación técnica aceptada para reproducir esta referencia**. No hay que volver a verificar o poner en duda estos valores antes de implementarlos. La extracción a 4 fps es evidencia visual complementaria para estudiar la dinámica, no una razón para desautorizar la tabla.

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

Los 30 fotogramas aportan evidencia complementaria de la dinámica. La tabla de Carlos determina los parámetros de programación aceptados. Las pruebas posteriores a 30 fps verificarán que nuestra implementación reproduce el comportamiento deseado, sin revalidar la tabla de origen.

## Gramática visual que se debe conservar
1. **Voz → significado → objeto → movimiento.** Director IA selecciona el evento visual por palabra/idea y timestamp; no añade pop/flash/zoom automáticamente cada N segundos.
2. **Dos jerarquías como mínimo:** frases conectoras claras de peso ~600–700 y tamaño de diseño 62–68 px, palabra protagonista ~800–900 y 98–115 px, con escala relativa de ~1,5–1,8; cifras/conceptos pueden adoptar acabado propio.
3. **Acumulación por oración:** el conector no desaparece al aparecer el protagonista («una auténtica» + «FORTUNA»; «Donó» + «75 MILLONES» + «de dólares»). Al cambiar la oración se reemplaza el bloque completo; evitar duplicar la capa normal de captions.
4. **Tipografía dependiente de escena:** sobre persona, texto claro, alta legibilidad, sombra; sobre pizarra blanca, tipografía negra/oscura, mezcla de negrita y cursiva. En el modo pizarra definido por Carlos, aplicar contorno blanco de 6 px y sombra suave al texto carbón #1E1E1E. Es una regla válida de esta plantilla, no una regla forzosa de todos los modos.
5. **Color con función semántica y sistema de tema:** cian/turquesa para «FORTUNA», amarillo-lima para «75 MILLONES», amarillo para «una isla». Para reproducir la referencia, utilizar los HEX validados #26F7FD, #59FF00 y #FFD000 y sus efectos especificados. Las versiones con otra identidad de marca serán variantes configurables posteriores y no deben sustituir ni alterar la réplica de referencia.
6. **Composición adaptativa:** persona a la derecha → texto en área izquierda/pecho, siempre evitando rostro y UI del destino. Escena 100% gráfica → titular en tercio medio-superior, objetos explicativos debajo. Las coordenadas X510–520 y Y680/Y960–1060 aportadas son las anclas exactas de la referencia normalizada a 1080×1920; el motor debe conservarlas en esta plantilla y utilizar adaptación condicionada por el plano para otros vídeos.
7. **Capas narrativas:** billetes y fotograma de isla aparecen detrás/encima según oclusión y composición; pizarra clara entra como escena independiente. No asumir que un B-roll cubre toda la pantalla ni que siempre debe salir una figura recortada.
8. **Entradas/salidas con intención:** palabra → palabra clave; B-roll con transición contextual; texto mecanografiado en 5–7 s y iconos tras aparecer sus conceptos. Las curvas/easing y duraciones exactas requieren inspección de frames a 30 fps, no pueden copiarse de 4 fps.
9. **Límites QA:** bloquear texto fuera de safe zones, no tapar ojos/boca, mantener tamaño legible, no más de 2–3 líneas salvo diseño justificado, respetar ancho medido en fuente real. No usar `max-width:750px` de forma invariable si provoca saltos incómodos.
10. **Comparativa V2B:** ya usa Montserrat Bold/ExtraBold y Playfair Italic, fondos de cuadrícula, captions ~54–70 px. No alcanza la referencia por escasez de capas explicativas, cambios de lenguaje visual, acción subordinada a discurso, tipografía protagonista y transiciones naturales. Reproducir en el preset de referencia **tanto la estructura como los colores y efectos técnicos** definidos por Carlos; después podrán crearse otras variantes temáticas.

## Próxima implementación (todavía NO realizada)
En el Director IA incorporar un evento de composición semántico `visual-beat` con `speechCue`, `layoutMode: speaker | fullGraphic`, `headlineLines`, `emphasisToken`, `backgroundLayer`, `objectLayers`, `maskedSubject`, `entrance`, `hold`, `exit`, `safeZone`, `paletteRole`. Remotion debe evaluar la escena en cualquier fotograma, sin intervalos fijos de efectos. Mantener la fuente y licencia de cada recurso. Crear primero una plantilla demostrada para esta gramática y validar con vídeo real, antes de declarar nivel DOPAMIN.

Estado: **solo análisis y documentación, sin cambios de código, merge, exportación, publicación o consumo de API**.
