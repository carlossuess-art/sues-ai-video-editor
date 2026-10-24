# Fase 7 · Director: contexto narrativo + escenas reales, revisión asistida
Fecha: 24/10/2026. No es modelo de visión autónomo ni Editor V1 aprobado.

## Problema
La consulta previa solo comparaba palabras con nombres de activos. La revisión visual de cuatro muestras descubrió branding ajeno en el reloj. Una consulta prudente evitaba falsos positivos, pero no proponía escenas al mencionar «ajetreados» y «crecimiento». Necesitamos capacidad inicial de asociación narrativa sin asumir modelos IA multimodales instalados ni consumir API/créditos.

## Implementación existente extendida
- Nuevo `src/director-narrative-scenes.js`, análisis local y determinista de palabras del ASR con timestamps, anclas por conceptos (sobrecarga, crecimiento, nuevo comienzo) y ventana de contexto, negación anterior de hasta cuatro palabras, desempate reproducible y supresión de reiteraciones narrativas.
- Nuevo inventario **humano de escenas muestreadas**, ligado al hash SHA256 del medio privado y al manifiesto existente. `sceneTags` tipificados: reloj analógico, caminante exterior, cadena en agua, amanecer en montaña. Proceden de cuatro fotogramas realmente observados por clip (0–3 s), **no constituyen una revisión exhaustiva**.
- Cruce con metadatos de la biblioteca V2: derechos verificados, uso comercial permitido, plantilla DOPAMIN compatible, vídeo vertical y duración >=2,5 s, roles narrativos. Lectura local de ficheros verificados y sin seguir symlinks; salida API sólo con información pública (sin rutas ni pruebas privadas). Si no hay evidencia suficiente, mantiene el presentador y no sugiere B-roll.
- No crear `videoEvents` ni exportar automáticamente a partir de estas recomendaciones. Respuesta enriquecida `narrative`, `confidence:tentative-rule-based`, `evidence`, `sourceWordIndexes`, `decision:contextual-review-only`; `approvedToAutoPublish:false`, `needsHumanReview:true`, `visualContentVerified:false`. El editor visualiza razonamiento, segundos y limitación de la revisión parcial.
- Se mantienen consulta lexical/manual, CALMA, duración original, captions/voice y control de selección explícita.

## Prueba con el MISMO vídeo maestro (sin render)
Transcripción privada del original de 68,6491 s / 165 palabras ya existente. Sin retocar sus archivos:
- 9,16–12,54 s; ancla «ajetreados»; contexto «meses muy, muy ajetreados, mi vida ha cambiado bastante»; candidato cadena industrial bajo agua por metáfora de peso/bloqueo. No garantiza idoneidad: **revisión humana** obligatoria.
- 40,98–46,92 s; ancla «crecimiento»; contexto «allá en nuestro crecimiento...»; propone caminante al aire libre como primera alternativa y amanecer sobre el valle como segunda. Verificar transiciones/captions y evitar cambios de plano que reduzcan coherencia; tampoco se aplican solos.
- No propone reloj con marca visible, no añade sonidos inventados ni consume proveedores.

## Salvaguardas y límites
Son etiquetas de escena asignadas tras muestreo de fotogramas, no reconocimiento visual profundo, segmentación de objetos, OCR, rastreo facial ni razonamiento multimodal entrenado. La interpretación narrativa es por reglas explícitas y puede errar: no atribuir emociones a personas reales, no concluir ausencia de logos fuera de los fotogramas revisados y no aprobar derechos/creatividad de forma automática. Todo medio sigue sujeto a revisión completa y validación de Carlos para F9.

Siguiente investigación: automatizar extracción de características de plano y detección de cambios (FFmpeg/OpenCV local si está disponible), segmentar escenas, explorar un modelo de visión local cuando infraestructura/memoria lo permita y validar contexto/cronología en un Reel real. Sin bibliotecas externas nuevas por defecto.

## Validación
`node --check`, `npm run check`, pruebas de contrato/lib/negación/licencia/integridad y suite Docker destino; registrar resultados reales en PROJECT_STATUS y Roadmap antes de afirmar completado. Coste API 0 €.
