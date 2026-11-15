# SUES · Composición narrativa de 2 escenas · implementación aislada

**Fecha:** 15/11/2026. **Rama:** feat/speech-linked-motion-grammar-20261115.
**Motivación:** mantener la corrección de Carlos (cantos rectos → redondos al entrar palabras; palabras independientes; zoom de salida completo) y conectar el final con otra idea sin cortes vacíos ni elementos decorativos.

## Guion A/V por capas (DEMOSTRACIÓN, sin narración real)

| ID y tiempo [s) · frames | Voz / anclas | Cámara / A-roll | Capas y máscaras | Motion, texto y captions | Audio | QA y estado |
|---|---|---|---|---|---|---|
| MOT01 · [0,0.267) · F0–F7 | **No existe voz**, solo texto demo | Cámara 1×; Carlos no aparece | Tapiz técnico antracita z0; tarjeta centrada z10 | Rectángulo abre desde línea fina con cantos rectos, texto aún invisible | Ninguno | Render de prueba PREPARADO |
| MOT02 · [0.267,1.067) · F8–F31 | «¿Y», «SI», «TE», «ESCUCHARAS?» son **texto demo**, no transcripción | Cámara 1× | Misma tarjeta con clip interior | Las cuatro palabras entran independientemente en F8/F14/F20/F26, radio de esquina arranca con F8 y llega a 62 px en F19 | Ninguno | Orden y radio probados |
| MOT03 · [1.067,1.7) · F32–F50 | Lectura sin voz | Cámara 1× | Tarjeta y cuatro palabras | Permanencia legible; subtítulos reales delegados | Ninguno | Estado PREPARADO |
| MOT04 · [1.7,2.333) · F51–F69 | Puente sin anclas de voz | Cámara saliente 1→4,5×, desplazamiento Y 0→−1950 | El grupo tarjeta+texto se traslada y amplía fuera del encuadre; mismo fondo | Dos líneas de nueva escena comienzan a separarse desde F59, bajo la salida | Ninguno | Continuidad inspeccionada |
| MOT05 · [1.967,3.033) · F59–F90 | Metáfora de «hacer espacio», **NO narrado** | Fondo/cámara fija para nueva escena | Dos líneas verticales z20, X=540±20 al principio → X=114/966; Y=1540→895 | Las líneas se apartan y dejan centro libre para texto protagonista | Ninguno | Geometría/seguimiento local |
| MOT06 · [3.1,4.233) · F93–F126 | «HAZ ESPACIO / PARA ESCUCHARTE», **texto sustituible de demostración** | Cámara fija; sin A-roll | Texto en 4 capas independientes con posiciones explícitas | Palabras HAZ F93, ESPACIO F101, PARA F109, ESCUCHARTE F117; revelado con opacidad y blur; no aparecen subtítulos convencionales adicionales | Ninguno | 4 palabras comprobadas |
| MOT07 · [4.233,5.033) · F127–F150 | Lectura, sin audio | Cámara fija | Líneas separadas y texto permanente | Pantalla final legible, preparada para transición posterior todavía no definida | Ninguno | QA del proxy; sin aprobación |

**Todos los intervalos se refieren a 30 fps y al prototipo DEMO**, no a un bruto real ni al vídeo original de referencia. Las escenas MOT04 y MOT05 se solapan intencionadamente.

## Recursos, composición y código

- Reutiliza exactamente src/motion-templates/hook-drop-card-engine.js (v3) sin reescribirlo.
- src/motion-templates/sequence-card-to-space.js añade una segunda escena sobre el mismo lienzo SVG, con animación determinista por fotograma y una metáfora visual con significado.
- tests/sequence-card-to-space.test.js cubre 6 casos de composición/continuidad, además de los 11 tests previamente existentes.
- examples/motions/card-to-space.preview.html permite reproducir, detener, avanzar fotograma a fotograma y editar los cuatro fragmentos de texto en el navegador.
- La segunda composición usa la paleta SUES blanco/dorado/antracita y fuente Montserrat declarada; la fuente real requiere verificación en el renderer final.
- La segunda escena **no representa una respiración real ni una waveform de voz**. No hay aserciones sobre beneficios terapéuticos.
- Los SVG son vectoriales, no se ha comprado ni generado ninguna imagen con créditos. Sin assets comerciales, no hay nuevos derechos por resolver en este prototipo.

## Evidencia y límites

Pruebas dirigidas localmente: **17/17 PASS**, Node 22.16.0. 151/151 fotogramas SVG convertidos a PNG. Vídeo H.264 aislado y comprobado: 540×960 píxeles, 30 fps, 151 fotogramas, duración 5,0333 segundos, SHA-256 **4f92022f15b5b3f776602cc1a4e08c4e7a5e4498ace0ea7c502cda8e177cc82b**. Hoja de 23 fotogramas clave revisada visualmente y disponible en la conversación. Los activos binarios NO se suben a GitHub.

No es un render FableCut, no equivale a prueba de previsualización navegador real del editor y no dispone de transcripción, word IDs reales para la segunda escena, mapa fuente↔edición, huella de timeline, máster 1080×1920, mezcla, QA de voz/sonido ni dos revisiones independientes. La validación artística de Carlos está pendiente; no hay aprobación ni autorización de despliegue.

## Siguiente bloque técnico

1. Conservar el mismo proyecto editor. Verificar versión y capacidades reales antes de integrar este mecanismo, sin deducir soporte por el catálogo abstracto de motions.
2. Reutilizar la selección interactiva y anclas existentes de transcripción para parametrizar los dos bloques y sus duraciones reales, con revisión del plan A/V completo. No deducir una selección por semántica de una palabra.
3. Comprobar FableCut privado y supervisor en clon al disponer de conexión autorizada. No tocar versiones publicadas, original, B05 paralelo, WhatsApp, Hostinger ni DNS.
4. Crear nuevas escenas solo cuando la narración real las justifique; la salida de la nueva escena se decidirá por narrativa y continuidad, no por una duración arbitraria.
5. Si alguna capacidad no existe en el contrato vigente, registrar operación bloqueada en anexo técnico completo, nunca convertir el SVG sin editabilidad de manera silenciosa.

Para continuidad: añadir el repositorio y la rama a las instrucciones del proyecto de ChatGPT.
