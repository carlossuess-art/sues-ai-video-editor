# SUES AI Film Director · Fase 1 — transiciones verificables y subtítulos progresivos en staging

**Alcance real:** proyecto Reel 158404; fuente original VFR preservada, CFR30 aceptado por Carlos; PR #27 y staging únicamente. Se aplica skill SUES AI Film Director 1.5.7 / normativa V2 D01–D77. No hay ninguna aprobación creativa del storyboard ni rendición final. Nada se publica ni despliega.

## B-roll: entrada y salida como operaciones conservadas

El editor ya dispone en Remotion de vídeo `video-exact` con fotogramas y keyframes de opacidad, sobre la fuente original de voz y cámara. Se ha creado una comprobación **opcional y estricta** de fundido de opacidad `inspectBrollFadeLink()` para el cruce de instrucciones a operaciones existentes: requiere selección explícita `kind:'opacity-fade'`, `edge:'in'|'out'`, `durationFrames` entero y comprobable, mismo `video-exact` B01...B05, misma escena, idéntico intervalo de fotogramas, visual completo de 1080x1920, opacidad 1, cuatro marcas obligatorias 0→1 al comienzo y 1→0 al final, sin interpolación sospechosa. Se rechazan fondo estático, B-roll de otro ID, vídeo incompleto, material sin licencia, curvas no soportadas y transiciones sin especificar. **No se elige un fundido por defecto**, ni se dice que todas las transiciones sean ya ejecutables. La capacidad solo sirve si el director escoge explícitamente este recurso y la biblioteca verifica el clip, los permisos y la calidad visual.

El inventario de capacidades del Reel 158404 registra 10 transiciones de entrada/salida de B-roll como `CONDITIONAL_VIDEO_OPACITY_FADE_CAPABILITY`, *pendientes* de elección de estilo, duración, licencias y QA. Otros tipos de transición no están acreditados por este adaptador y continúan bloqueados. El compilador estricto Remotion se ha probado con clips de prueba y un registro de derechos sintético que, al retirarse, vuelve a bloquear la compilación.

## Voz y subtítulos

Nuevo módulo `master-director-brief-caption-draft.js`: utiliza exclusivamente la transcripción ASR ya cargada y vinculada al Reel, con tiempos propios (sin corregir ni inventar palabras), construye textos acumulativos palabra a palabra y segmentos de lectura provisionales, con límites por escena y pertenencia a plano cuando es segura. Conserva todas las palabras, marca baja confianza ASR, palabras que atraviesan bordes de escena/plano y marcas de tiempo colisionadas. No recorta fonemas, no modifica audio/vídeo, no afirma que los saltos de línea, tipografía, color y caja bajo la barbilla sean finales. Sigue `approved:false` y `canExecute:false`.

Nueva ruta autenticada `GET /api/jobs/:id/master-brief-caption-draft?briefRevision=<SHA>`, con comprobación de vídeo y fingerprint, botón **«Revisar borrador de subtítulos palabra a palabra»** y contenido incorporado al anexo único JSON no ejecutable para Work.

**Resultado de fuente real del Reel 158404:** 168 palabras ASR, 168 señales progresivas propuestas, 34 grupos de texto provisionales, 50 incidencias por revisar. No confundir estas incidencias con 50 errores confirmados: son advertencias automáticas para inspección humana, incluidas las frases ASR dudosas ya identificadas. 7 escenas y 21 planos siguen sin aprobación creativa; B01–B05, M01–M03 continúan sin recursos acreditados.

## QA y fase siguiente

Pruebas aisladas: `master-director-broll-fades.test.js` cubre la integración real del compilador de keyframes y rechazos de ID/intervalo/curvas/licencia; `master-director-brief-caption-draft.test.js` cubre conservación exacta y ruta HTTP autenticada. Se comprobaron ambas rutas sobre el único Reel real, y la UI de escritorio 1360×900/móvil 393×852 confirmó 0 errores. Son comprobaciones de estructura, **no** auditoría de render/audición de los efectos. La fase 1 queda abierta hasta recursos y derechos, subtítulos/ASR revisados, equivalencia completa por operación, storyboard aprobado y QA visual en dos pasadas.
