# SUES AI VIDEO EDITOR — Plan integral de reconstrucción del motor
**Fecha:** 2026-11-07. **Rama:** PR 27, `feat/master-director-story-orchestration-20261104`. **Estado:** plan y primera integración reversible; NO significa aplicación desplegada, 3D implementado ni Reel terminado.

## Diagnóstico verificable
El Reel 158404 demostró que las pruebas técnicas de decodificación no son una evaluación artística. Se podían decodificar 2.213 fotogramas sin fallo mientras los títulos anticipaban frases, los subtítulos incumplían la tipografía y ubicación, el niño era diminuto o quedaba oculto, el reflejo aparecía como una pegatina y el motion graphic era una composición plana sin significado. El plan aprobado, el proyecto del estudio y los MP4 auxiliares divergen: ese es el defecto arquitectónico fundamental. No conviene volver a generar versiones enteras sin un compositor único y un supervisor visual que vea las mismas imágenes que Carlos.

## Arquitectura decidida para el POC (no decisión de producción)
**Un solo estudio, un solo proyecto multipista, un solo compositor, múltiples subsistemas expertos.**

- **SUES Studio:** web accesible a Carlos, proyecto persistente, player, timeline, ediciones, revisiones, aprobaciones.
- **FableCut** (candidato al núcleo NLE, MIT): editar clips, máscaras, textos, audio y keyframes mediante el mismo proyecto al que accede el usuario; ofrece comando MCP/REST de operaciones transaccionales y obtención de frame compuesto. Código fijado `579b08ec1a789baec5cbf06d7430373460508d09`. Probados en entorno aislado 506 tests (30 skips por FFmpeg sin PATH) y después 34 tests seleccionados adicionales con FFmpeg, todos superados. Además el servidor aislado respondió HTTP 200. Sus tests no acreditan calidad del Reel.
- **HyperFrames** (motor de motion fuente, Apache-2): código fijado `a3b8f521d9114286fa410a49bfd07ccf7d541689`. HTML/CSS/Three.js/GSAP/animaciones seekable, materiales, luces, partículas y export alpha con WebM/MOV. Se inspeccionó fuente; **todavía no hemos ejecutado un motion del Reel**. La salida alpha se vincula al timeline de FableCut **junto al proyecto HyperFrames editable**. Es falso afirmar que el objeto 3D queda nativamente editable dentro de FableCut sin diseñar esa integración.
- **SUES MASTER DIRECTOR + Film Director 1.5.7:** sigue siendo el cerebro que comprende el discurso, diseña el storyboard, propone operaciones y exige aprobación. Se aplica normativa cinematográfica V2 D01–D77, incluidos los neones narrativos.
- **Whisper/forced alignment + módulo semántico:** marcas exactas de palabras, negaciones, títulos que aparecen una vez entendido el sentido; subtítulos acumulados palabra a palabra, Montserrat real, máximo dos líneas y posición dependiente de la barbilla.
- **SAM 2 y refinador alpha con licencia comercial compatible:** seguimiento de Carlos, niño y espejo, zonas de visibilidad, feather, matting temporal continuo; no introducir pesos `NC` bajo apariencia de licencia libre.
- **Supervisor audiovisual independiente:** ve fotogramas ya compuestos, escucha audio y compara cada plano con la intención. Clasifica `auto editado / auto corregido / corregido por Carlos / bloqueado`. Un comprobador de hashes no es una inspección cinematográfica.

FireRed-OpenStoryline, AutoBroll, Claude Reelsmith, OpenFilm y Lumen se estudian como referencias de módulos de inteligencia narrativa/QA, **no como otros cinco editores compitiendo por la misma línea de tiempo**.

## El contrato crítico SUES ↔ FableCut ↔ HyperFrames
Cada operación del plan aprobado debe tener:
`operationId`, `sceneId`, `sourceTimeMap`, `start`, `end`, `track`, `assetSha`, `rightsProof`, `layerId`, `effectParams`, `qualityGate`, `approval`.

Para gráficos HyperFrames además `sourceProjectId`, `sourceGitSha`, `renderedAssetSha`, `alphaMode`, `fontHashes`, `engineVersion` y `renderFingerprint`. La edición desde SUES debe reabrir el proyecto HTML fuente, modificarlo, volver a renderizar solo esa pieza y actualizar el mediaId en **la misma** revisión transaccional de FableCut; todo ello debe validarse. Avanzar hacia un compositor HTML embebido en vivo es una opción posterior si reduce latencia y no rompe los controles de seguridad.

Ninguna función no ejecutable se sustituirá silenciosamente por un rectángulo o un simple texto: conserva `blocked-with-reason` y el plan aprobado.

## Fases y gates duros

### F0. Congelar y respaldar
Verificar fuente Reel 158404 SHA `9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad`, reglas, archivos, licencias, tipografías, assets y estado de PR27. Conservar pruebas fallidas como benchmarks regresivos. Feature flag exclusivo para POC. Sin modificaciones de producción.

### F1. Motor NLE verdaderamente editable
Cargar Reel 158404 en proyecto nativo FableCut 1080×1920 con voz original, tracks, títulos, overlays y assets. El usuario y el agente comparten cambios sobre `project.json` con revision/CAS y undo. Preview, solicitud de frame y export salen del compositor de la misma versión. **Gate:** edición externa visible de inmediato, guardar/cerrar/abrir y exportar con paridad por frame. Si falla, no migrar.

### F2. Subtítulos y títulos
ASR preliminar no equivale a voz revisada. Alinar palabras de forma robusta, verificar negaciones y fonemas; `caption`, `title`, `motionText` son entidades distintas. Montserrat exacta, tamaño grande, posición bajo la barbilla, máximo dos líneas, una palabra nueva por cue, palabra clave muy superior, blanco/beige/antracita/naranja, contraste dinámico. Añadir `understoodAt`, tiempo **después** de la idea completa. **Gate:** 168 palabras del Reel conservadas y 0 títulos anticipatorios con análisis de la frase, no solo búsqueda de keywords.

### F3. B-roll, matte y tracking continuo
Extraer y seguir silueta de Carlos en la temporalidad correcta, incluyendo huecos antiguos 12,26–12,88. Componer B02 detrás de Carlos asegurando que niño y grupo se ven realmente; reencuadrar escala/posición si Carlos los tapa. B05 espejo grande, no rectángulo flotando. GIF delante del torso con sombras/layers, sin tapar cara o captions. Fullscreen B-roll siempre con transición de entrada/salida. **Gate:** cobertura de matte durante todos los frames, calidad alpha, visibilidad semántica y ausencia de saltos.

### F4. Motions 3D HyperFrames
Crear biblioteca SUES (máximo valor antes que cantidad): cadenas/puertas/corazón anatómico, espejo que se rompe/transforma, piezas de culpa/límites, geometría de energía, listas/lower thirds, perspectivas 3D, partículas, luces, cámaras y tipografía cinética. Fuente editable versionada y render 1080×1920; alpha si overlay. Pedir motion audiovisual de cinco segundos con gráfico que cuente una historia: M01 «DECIR NO→CULPA», M02 «AMOR↔MIEDO A PERDERLO» y M03 «RECONOCERTE». **Gate:** 1 motion genuinamente cinematográfico, render con perspectiva/materiales/luz, sin cajas planas, sincronía semántica, coherencia con voz, igual en preview/export; aceptación de Carlos.

### F5. Supervisor IA con bucle de corrección
Examinar primeros/últimos frames, interrupciones, in/out, fotograma en que el niño aparece, cambios de máscara, palabra clave y cada SFX; sampling adaptativo con expansión cuando aparezca error. Un crítico independiente comprueba relación narrativa, legibilidad, voz, solapamientos, jerarquía y ritmo. El editor aplica parches en el MISMO proyecto y vuelve a inspeccionar hasta pasar gates o declarar bloqueo. **Gate:** el sistema encuentra y corrige deliberadamente tres fallos introducidos (niño oculto, caption pequeño, título adelantado), sin revisión manual dirigida a cada píxel.

### F6. Reel 158404 completo
Todo el plan de 7 escenas y 49 operaciones mantiene identidad y QA. Audio real, 30fps, 1080×1920, música continua con ducking e impacto inicial, B-roll completos y máscaras, GIF, 3 motions verdaderos, subtítulos aprobados, títulos posteriores a comprensión. El CTA exacto aprobado no está grabado en la voz original: no fingir que se oye. **Gate:** Carlos puede ver el render dentro del estudio, modificar cualquier capa y exportar un resultado idéntico a la vista previa, tras dos revisiones audiovisuales y su aprobación estética.

### F7. Migración y limpieza
Solo cuando F0–F6 estén superadas, retirar rutas de MP4 auxiliar, código redundante y renderers incompatibles; conservar fuente, licencias, pruebas y backup. Desplegar por feature flag con rollback; revisar CPU, RAM, seguridad, almacenamiento, rendimiento preview/export, errores y costes.

## Decisiones de arquitectura y licencias
- FableCut MIT, HyperFrames Apache-2, FireRed Apache-2 permiten estudiar/comercializar bajo sus condiciones, pero sus recursos/módulos externos requieren revisión.
- SAM 2 Apache-2 como candidato de tracking; MatAnyone2 tiene restricciones no comerciales, BRIA RMBG2 pesos NC, GPL de RVM implicaría obligaciones adicionales. No integrar pesos ni vender usos hasta comprobar licencias.
- Remotion puede seguir como herramienta secundaria; sus licencias para automatores pueden ser distintas de una aplicación pequeña elegible, no asumir pago ni gratuidad universal.
- REA (rea.tools) es soporte opcional de ingeniería inversa/MCP, no un editor; como ya existe fuente abierta para FableCut/HyperFrames, priorizar la inspección de código. No afirmar que REA esté conectado al chat.
- VPS al revisar: 3,8 GiB de RAM, 4,2 GiB libres (92% usado), sin swap. No instalar todo HyperFrames + Chromium + SAM2 + modelos 3D simultáneamente en esa máquina. Contenedores y runners aislados, modelos bajo demanda, cuotas CPU/RAM, trabajo comercial primero sin gastos.
- FableCut localhost por defecto no debe exponerse al público sin backend SUES autenticado, sandbox, acceso por rutas permitidas y auditoría de uploads/URLs.

## Entrega ejecutada hoy, con evidencia
1. Reutilizada rama PR27 y código original (no se ha borrado el sistema).
2. Descargados repositorios FableCut/HyperFrames/FireRed en entornos aislados, con SHA fijo. FableCut ejecutó 506 pruebas generales y 34 específicas sin fallos; boot HTTP 200 localhost.
3. Añadidos a PR27 `src/engine-next/engine-capabilities.js`, sus tests, `docs/engine-next/REEL_158404_ENGINE_GAP_LEDGER.json` y `scripts/engine-next/prepare-fablecut-poc.mjs`.
4. Las 49 operaciones del Reel se clasificaron sin desapariciones: 24 requieren adaptador NLE; 2 matte temporal; 3 fuente HyperFrames; 1 alpha/GIF; 11 títulos semánticos; 8 mezcla/rights. Estos números indican **trabajo pendiente**, no finalización.
5. Prototipo real compatible `FableCutProjectOps.checkProject()`, hecho en scratch local sobre fuente SHA y voz originales 1080×1920, cinco clips. B02 y GIF quedan deshabilitados hasta probar matte y alpha; no se presenta como Reel 158404 editado.
6. No está integrado aún FableCut como motor productivo ni se ha renderizado 3D HyperFrames. No se ha solicitado licencia/pago ni cambiado el sitio público.

## Criterio de éxito que prevalece sobre cualquier test
El sistema falla si el vídeo está simplemente decodificable, pero el niño es invisible, el título adelanta la idea, el subtítulo es diminuto o un motion no cuenta nada. **Solo existe éxito cuando Carlos puede abrir el proyecto vivo dentro de SUES, verlo exactamente igual que la IA, corregirlo y obtener una exportación cinematográfica que apruebe.**
