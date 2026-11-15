# SUES AI VIDEO EDITOR · Motion Grammar + selector narrativo v1

**Fecha:** 15/11/2026. **Estado:** implementado en rama aislada; **NO DESPLEGADO**, **NO IMPORTABLE** a FableCut ni a sues-master-story/v1. **Rama existente:** feat/speech-linked-motion-grammar-20261115. La integración no toca Hostinger, Desktop Commander, el proyecto publicado, V29 ni el perfil normal del editor.

## Objetivo del componente

Que el Master Director **proponga** una composición porque los conceptos narrados la justifican y sea capaz de explicar el motivo. No insertar objetos por cuota, coincidencias aisladas o repetición mecánica. El director de la escena puede tomar una decisión cinematográfica, pero la ejecución real sobre un Reel necesita identidad del proyecto, selección explícita de palabras, plan A/V revisado, contrato/recursos comprobados y aceptación creativa. La versión aquí creada **no decide ni ejecuta** una edición automática.

### Arquitectura implementada (independiente del editor vivo)

1. `src/motion-templates/narrative-motion-review.js`: inventario de siete motivos narrativos y sus mecanismos. Verifica transcripción `version:'1.0'`, lenguaje es, IDs de palabra reales/no duplicados y timestamps ordenados/no inciertos; no los inventa. Expone primero un selector con **todas las ocurrencias y contexto**. Exige que se entregue explícitamente `selectedWordIds` para proponer una composición. Cada propuesta incluye texto literal de la frase, rango fuente, IDs/ancla, motivo, escena, capas lógicas, bloqueos y estado verdadero. Si no hay relación fundada, propone **cero motions**. No remapea automáticamente segundos del bruto a la timeline editada.
2. `src/motion-templates/motion-av-review.js`: transforma **exactamente esas mismas propuestas** a tabla de 7 columnas (IDs/tiempo, voz, A-roll/cámara, capas, motion/captions, audio, QA). Declara los campos desconocidos: no simula rostro inspeccionado, material reproducido, sonido oído, pista de cámara, licencia ni importación.
3. `examples/motions/narrative-motion-review.html`: prueba privada sin backend. Abriendo el visor por servidor local desde la raíz del repositorio, carga un JSON, muestra palabras con sus IDs/tiempos/contexto, permite marcar palabras, propone escenas y exporta JSON de revisión y guion A/V en Markdown. **No** se ha integrado todavía en la UI principal de FableCut.
4. `tests/narrative-motion-review.test.js` y `tests/motion-av-review.test.js`: 10 pruebas nuevas de selección obligatoria, abstención semántica, IDs/timestamps, propuestas con evidencia, bloqueo de plantillas no creadas, correspondencia tabla y escape de texto.
5. `examples/motions/narrative-review.demo-transcript.json`: solo **fixture ficticio** para comprobar la interfaz; jamás supone voz real ni demuestra que el clip original tenga audio.

## Estado real del catálogo

- **Prototipos SVG existentes:** TPL_HOOK_DROP_CARD (pregunta/gancho, con las tres correcciones de Carlos) y SUES_CARD_TO_SPACE_DEMO (metáfora de apertura de espacio sobre escena conectada).
- **Especificación sin renderer verificado:** TPL_BLUR_CASCADE_SWOOSH (contraste), TPL_METAPHOR_COUNTER_GLOW (dato con cifra), TPL_BOOLEAN_PUZZLE_MORPH (partes que encajan), TPL_TREND_DIP_AND_RISE_UI (progresión cuantificada), TPL_3D_BULLSEYE_IMPACT (objetivo medible).
- **Dato numérico:** hay bloqueo adicional para verificar cifra y fuente; no convertir un número del discurso en verdad científica por el hecho de estar transcrito.

## Guion de prueba humano y vista técnica

El fixture «¿Y si te escucharas? Haz espacio para escucharte.» se marca como **sintético**. Seleccionar `demo-0004` («escucharas?») y `demo-0006` («espacio») genera estas dos propuestas, sin colocación definitiva ni edit timeline:

| ID/tiempo de la fuente | Voz exacta / ancla | A-roll / cámara | Capas / máscaras | Motion / captions | Audio | Recurso / QA |
|---|---|---|---|---|---|---|
| question-hook · 0,267–1,100 s | «¿Y si te escucharas?» · demo-0004 | PENDIENTE bruto real | BACKGROUND + GRAPHICS; posición por inspeccionar | TPL_HOOK_DROP_CARD. Texto por palabra, redondeo al aparecer, salida por zoom | Sin archivo ni escucha | SVG prototipo; no mapping nativo; revisión creativa pendiente |
| create-space · 3,100–4,300 s | «Haz espacio para escucharte.» · demo-0006 | PENDIENTE bruto real | BACKGROUND + GRAPHICS; sin máscaras acreditadas | SUES_CARD_TO_SPACE_DEMO. Líneas se separan para dar espacio; texto individual | Sin archivo ni escucha | SVG prototipo; rango editado, transcripción real y licencia por verificar |

La salida JSON de este módulo tiene esquema **sues-narrative-motion-review/v1**, expresamente **NO IMPORTABLE**. Propuestas y tabla comparten los mismos IDs/tiempos fuente, pero **NO** son un plan aprobado ni han sido traducidas a un comando de FableCut. No se eliminará el subtítulo convencional por defecto: solo se suprime en una composición a pantalla completa si está demostrada la cobertura de **todos** los tokens, incluyendo negaciones. En otros casos se conservan los subtítulos y se evita duplicar el resaltado durante el solape.

## Evidencia local

Ejecutado `node --test tests/*.test.js` en Node.js 22.16.0, local aislado, **30/30 PASS** (20 de escenas previas y 10 nuevas). Los hashes Git blob del módulo, guion y dos archivos de test coinciden entre copia local y GitHub. Se inspeccionó sintácticamente el módulo JS integrado en HTML con `node --check`, **PASS**. No se completó revisión de render/flujo UI de navegador por bloqueo del Chromium headless local; tampoco hay prueba de accesibilidad móvil. El MP4 previo de dos escenas fue comprobado nuevamente con `ffprobe`: H.264, 540×960, 30 fps, 151 frames, 5.0333 s. NO es máster 1080p nativo ni QA FableCut.

## Puertas de validación siguientes

Integrar esta pantalla **en el selector de palabras existente** de la UI, no duplicarlo. Antes de tal integración, inspeccionar runtime y contrato real, mapa fuente→editado, fuentes y activos de biblioteca y reglas de subtítulos. La fase de un Reel nuevo exigirá transcripción real con IDs y control humano, tabla por capas, selección de recursos, validación del compositor y, cuando haya acceso autorizado, render privado FableCut con supervisor de dos pasadas. No usar Desktop Commander hasta recuperar la cuota. Sin pagos ni generación de nuevos assets por defecto.

**Continuidad del proyecto:** añadir la ruta de este checkpoint y la rama a las instrucciones del proyecto para que cualquier chat retome el trabajo sin reimplementarlo.
