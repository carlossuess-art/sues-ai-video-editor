# SUES AI VIDEO EDITOR 2.0 — PLAN MAESTRO DE RECONSTRUCCIÓN DEL MOTOR
**Fecha:** 2026-11-07. **Destino:** PR #27, rama `feat/master-director-story-orchestration-20261104`. **Autoridad creativa:** skill SUES AI Film Director v1.5.7, normativa V2 D01–D77, reglas aprobadas. **Estado:** arquitectura propuesta y comienzo de fase de preparación; no se ha sustituido todavía el motor ni probado un Reel real en la nueva pila.

## 0. Objetivo y principio de diseño

Sustituir la cadena de edición que produce MP4s auxiliares no equivalentes al proyecto editable por **un solo estudio y un solo proyecto multipista**, manipulado tanto por el usuario como por el agente. Un Reel de Carlos debe contener clips reales, máscaras temporales, B-roll, capas alpha, objetos, motion graphics 2.5D/3D, títulos semánticos, subtítulos palabra por palabra, música, SFX, gradación y export. El agente observa **el fotograma realmente compuesto** en el mismo motor del estudio, diagnostica y corrige. La calidad artística la determina una rúbrica explícita y la aprobación de Carlos, no los tests de código.

**No confundir:** plan creativo / ejecución de operación / render / QA técnico / QA cinematográfico / aprobación. No convertir lo no soportado en efecto plano sin autorización.

## 1. Componentes propuestos y decisiones

| Capa | Componente | Licencia/fuente | Función | Decisión |
|---|---|---|---|---|
| Dirección | SUES MASTER DIRECTOR + skill Film Director 1.5.7 | propio | interpreta historia, storyboard, contrato, aprueba recursos y QA | **CONSERVAR Y ADAPTAR** |
| Núcleo NLE | **FableCut** `ronak-create/FableCut` | MIT; https://github.com/ronak-create/FableCut | timeline web multipista, composición, API REST/MCP, máscaras/mattes, keyframes, audio, export, frame inspeccionable | **PRIMER CANDIDATO**, no decisión definitiva hasta POC |
| Motion cinematográfico | **HyperFrames** `heygen-com/hyperframes` | Apache-2.0; https://github.com/heygen-com/hyperframes | HTML/CSS/GSAP/Three.js, escenas 2.5D/3D, plantillas, seek frame, render local y composiciones alpha | **PRIMER CANDIDATO**, probar integración como fuente de escena editable y media de caché |
| Motion 3D genuino | Three.js/WebGL (o Blender offline si procede) | revisar dependencia específica | cámara, materiales PBR, luz, sombras, profundidad y objetos reales | **INTEGRAR DENTRO DE COMPOSICIONES**, no editor separado |
| Subtítulos/ASR | WhisperX o equivalente con alineación forzada, análisis semántico Film Director | licencias por verificar | palabras precisas, puntuación, pausas, negaciones, títulos tras sentido | **MÓDULO ESPECIALIZADO** |
| Matting | SAM 2 (seguimiento) + modelo alpha comercialmente compatible, máscara/feather por plano | SAM2 Apache-2.0, pesos y otros modelos requieren auditoría | Carlos delante de B-roll, pelo/manos, continuidad temporal | **PROBAR EN AISLAMIENTO**; NO usar MatAnyone2 NC ni RMBG2 NC sin licencia |
| Recursos narrativos | AutoBroll + Claude Reelsmith (patrones, no integración monolítica) | MIT según fuentes verificadas | selección semántica, captions, ritmo y assets propios | **REUTILIZAR IDEAS/CÓDIGO SELECTIVAMENTE** |
| Inspector/crítico | FableCut `frame` + comparación del render, contact sheets, detector de zonas, Lumen/OpenFilm como patrones | MIT/otros según módulo | ver escena final, localizar oclusión, tamaños, errores y anticipaciones | **CONSTRUIR COMO SERVICIO PROPIO SOBRE MOTOR REAL** |
| Benchmark | OpenChatCut (AGPL), Timeline Studio (MIT), Lumen (MIT) | verificar upstream | alternativas si FableCut falla, paridad de editor/render | **COMPARAR SIN INCORPORAR AGPL POR DEFECTO** |
| Render/sonido | compositor NLE elegido + FFmpeg para codificación/mezcla, HyperFrames para subcomposiciones | verificar | H264 1080×1920, audio sin cortes, alfa temporal, proxies | **CONSERVAR FFmpeg COMO INFRAESTRUCTURA, NO COMO EDITOR PARALELO** |
| UI y backend SUES | servidor, autenticación, almacenamiento, biblioteca, jobs, Drive/GitHub, historial, pruebas | propio | continuidad de proyecto, controles y permisos | **CONSERVAR, ADAPTAR POR ADAPTADORES** |

HyperFrames README oficial confirma `@hyperframes/core`, `engine`, `producer`, `studio`, `player`, `shader-transitions`, y skill/registry. El catálogo ofrece centenares de bloques; su Studio evoluciona y algunas capacidades Pro son de pago. No equiparar automáticamente HyperFrames con un editor multipista humano de la calidad de FableCut. FableCut usa el mismo compositor en browser para preview/export, pero su export puede depender del navegador, WebCodecs y perfiles; se exige benchmark real antes de adoptarlo.

## 2. Contrato común y modelo de datos

Definir `sues-edit-project/v2` (migración versionada, NO reemplazar contratos v1 sin compatibilidad) con:
- `projectId, revision, sourceSha256, fps, width, height, timebase, sourceTimeMap, scenes, tracks, clips, assets, effects, masks, captions, graphics, audio, qa, approvals`.
- Cada clip conserva `clipId, sourceAssetId, in/out source, in/out timeline, trackId, transform(x,y,w,h,scale,rotation,anchor), zIndex, opacity, colorGrade, keyframes, transitions, rights`.
- `mask` es objeto independiente con `maskId, subjectId, alphaAssetId, sourceTimeRange, timelineTimeRange, featherPx, tracking, interpolation, missingFramePolicy=BLOCK`; cada frame requiere cobertura.
- `graphics`: `graphicId, renderer=hyperframes|svg|threejs|native, sourcePath, sourceSha, version, parameters, timeMap, alpha, audio, editableSource`. Una animación 3D NO se aplana permanentemente en el proyecto: la composición fuente y parámetros quedan accesibles, aunque el preview utilice caché alpha.
- `captions`: palabras verificadas con `start,end,text,confidence,revision`, líneas y acumulación, rectángulos seguros, estilos y semanticAnchors.
- `qa`: evidencias por operación y por fotograma, no booleano global sin pruebas.
- `assets`: derechos, origen, sha, tamaño, resolución, códec, duración, dependencias y disponibilidad.
- Revision CAS y journal de comandos con `actor, reason, before/after, undo`, idempotencia y reejecución reproducible.

**Comandos únicos**: `importAsset, addClip, trim, move, split, replaceMedia, setTransform, setMask, attachMatte, setKeyframe, addCaptionWord, setSemanticTitle, addMotionScene, setAudioGain, addTransition, renderFrame, renderRange, export, undo, redo`. El humano y la IA ejecutan la MISMA API. No permitir que la IA escriba JSON en una copia paralela sin actualizar el estudio.

## 3. Integración FableCut ↔ HyperFrames

**Hipótesis de integración, no capacidad demostrada:** HyperFrames produce un gráfico seekable en HTML y una salida con alpha (WebM ProRes/PNG sequence según lo que el renderer soporte de verdad), con código fuente y `graphicId`. FableCut referencia ese recurso como clip en pista visual y guarda enlace al proyecto HTML y parámetros para editarlo. En cada modificación:
1. Director cambia intención o keyframes del motion.
2. `MotionService` actualiza la composición HyperFrames; calcula hash de código+assets+parámetros.
3. `renderRange` produce proxy alpha o frames deterministas; se cachea por hash, no por nombre mutable.
4. `TimelineAdapter` actualiza clip y duración, sin alterar voz ni captions; emite evento al estudio.
5. El compositor FableCut integra capas en el orden correcto. `renderFrame(t)` devuelve la composición final real.
6. Inspector compara `renderFrame(t)` del estudio con frame exportado de `t`, evalúa semántica/legibilidad/oclusiones y bloquea si difieren.
7. El editor permite reabrir el gráfico en su panel de parámetros o código editable; no presentar el MP4/WEBM como única fuente de verdad.

**Prueba de alpha obligatoria:** bordes, premultiplicación, gamma, colores, blur, glow, sombras, semitransparencia y sincronía en al menos 10 tiempos por animación, con capturas del compositor y export. Si FableCut no acepta un alpha codec reproducible, implementar adaptador explícito y documentar límite, no simularlo como resuelto.

**3D**: Three.js dentro de HyperFrames con cámara, escena, luces, sombras y materiales. Animación `seek(t)` determinista, sin usar `requestAnimationFrame` dependiente del reloj real. Permitir carga de GLTF/GLB con procedencia, texturas y licencias. Objetos 2.5D (capas PNG, parallax) no se etiquetan como 3D real. Motion cinematográfico no consiste en poner un objeto 3D arbitrario: cada acción debe transmitir significado.

## 4. Biblioteca de motion SUES

Crear `assets/motion/sues/` con composición fuente y preview para:
- `identity-mask-shatter`: máscara material vidrio/piedra que se agrieta y se desprende al decir «dejar de fingir», sin inventar rostro de Carlos.
- `boundaries-no-guilt`: dos fuerzas/objetos con profundidad, tensión y resolución, sincronizados con «DECIR NO» y «CULPA»; NO dos rectángulos.
- `heart-release`: corazón anatómico estilizado, cadenas con metal, tensión y liberación con sombras/luces; seguridad emocional, no exagerar promesas.
- `mirror-self-recognition`: espejo, reflejo simbólico no sintético de Carlos, cristal y revelación de idea.
- `five-reasons`: lista numerada con círculos metálicos, tipografía cinética y aparición secuencial.
- `energy-frequency`: visualizaciones de onda y ritmo vinculadas a audio sin falsas afirmaciones científicas.
- `runic-symbols`: símbolos rúnicos fieles a material aportado, iluminación y transformaciones.
- `golden-portal`: portal/círculo 3D usado solo si aporta sentido.

Cada plantilla: `README` de propósito narrativo, `composition.html/tsx` según renderer, recursos, tokens SUES, parámetros tipados, duración, beats, trigger semántico, thumbnails de 5 fotogramas, clip alpha de muestra, licencia, tests de `seek`, ejemplos. Identidad blanco/beige/antracita y fuego naranja, neones adicionales intencionados; tapices solo en escenas motion, no detrás de Carlos por defecto.

## 5. Máscaras, B-roll y composición profunda

Pipeline:
1. Inspección del vídeo real, detección de persona y mapa de movimiento.
2. Segmentación/tracking sobre TODOS los fotogramas del intervalo y cálculo de alpha; no se permite reutilizar máscara congelada sin verificación.
3. Definición de región narrativa de B-roll (niño+grupo, espejo, objeto) en el lienzo y regla de visibilidad; la cara de Carlos, manos y gesto son regiones protegidas.
4. Orden de capas: fondo original / B-roll reencuadrado / Carlos segmentado / objeto GIF o motion / subtítulos / títulos, con excepciones justificadas.
5. Feather perceptual (resolución final), spill correction, gradación para integración, tracking temporal, fundidos y bordes.
6. Inspector mide cobertura del niño/grupo, tamaño mínimo, contraste, alfa, flicker, bordes, huecos sin máscara y oclusión; si falla, desplaza/escala B-roll o solicita otro recurso.
7. Verificar inicio, medio, fin y todos los frames de cambios críticos; validación de máscaras completas por muestreo automático más comprobación específica de huecos.

No integrar MatAnyone2, RMBG2 NC ni pesos dudosos en un producto comercial. SAM2 Apache-2.0 es candidato a seguimiento, no garantía de pelo/matting perfecto.

## 6. Subtítulos y títulos semánticos

- ASR y forced alignment con texto y audio reales; confianza por palabra, corrección humana de dudas; conservar negaciones.
- Captions se construyen **palabra a palabra**, acumulando solo lo YA pronunciado; máximo 2 líneas normalmente, 3 únicamente si norma permite y justifica; ubicación bajo barbilla real, que puede moverse por plano; Montserrat exacta, peso, tamaño y palabras de énfasis grandes; safe zones verificadas sobre render.
- Títulos protagonistas no se programan al comienzo de una frase si revelan su conclusión. `semanticAnchor` incluye `claimStart, revealAfterWordEnd, semanticContext, showEnd`. Ejemplo «Durante el día cada vez estás más cansado»: **CANSANCIO** aparece cuando ya se ha dicho «cansado», no al comenzar «Durante».
- Diferenciar caption literal, titular y texto de motion. No duplicar contenido si ocupa la misma zona o distrae. Audio sincronizado y sin inventar voz de CTA.
- Control de fonemas y pausas: cortar solo donde la norma de voz permita y recalcular fuente/timeline.

## 7. Agente crítico y bucle de autoevaluación

**El agente no aprueba su propia salida por superar un test.** Flujo:
1. Director propone storyboard con motivo narrativo, geometría y tiempo.
2. `CapabilityResolver` confirma que cada efecto existe en el motor o marca `BLOCKED`; no sustituye sin permiso.
3. `Executor` realiza comandos reales en el timeline.
4. `VisualObserver` solicita frames compuestos del mismo compositor, no capturas del bruto; selecciona momentos semánticos, entradas/salidas, keyframes y zonas de riesgo.
5. `AudioObserver` comprueba voz, pausas, cortes, música, ducking y SFX.
6. `FilmCritic` revisa legibilidad, tamaño percibido, profundidad, coherencia, ritmo, estilo, oclusiones, subtítulos y emoción, con evidencias (frames + operaciones + criterios).
7. `RepairPlanner` formula correcciones mínimas atómicas; re-render de intervalo afectado y reobservación. Presupuesto máximo de iteraciones por defecto 3–5, sin bucle infinito, y se marca `BLOCKED` si no puede cumplir.
8. Supervisor técnico verifica continuidad, hash, codec, duración, ausencia de frames perdidos y paridad preview/export.
9. Carlos recibe **una sola vista previa** y lista de pendientes; su aprobación es la única aprobación estética final.

Definir rúbrica de 0–5 por categoría (narrativa, tipografía, composición, recursos, motion, máscara, sonido, sincronía, identidad). Ninguna categoría crítica por debajo de 4/5 para pasar a revisión, pero una nota automática no sustituye criterio humano. El sistema debe poder señalar «este gráfico es pobre» aunque sea técnicamente válido.

## 8. Plan de ejecución en PR #27 (sin reescritura a ciegas)

**Fase 0 · Congelación y seguridad**
- Registrar HEAD de PR27, estado de VPS, tests y SHA de bruto 158404; snapshot de BD, biblioteca y proyectos, sin incluir secretos en git.
- Conservar producción, staging y ramas; crear worktree aislado desde PR27 para integración, sin pisar trabajo simultáneo de Work.
- Leer `AGENTS.md`, `SKILL_CONTRACT_HANDOFF.md`, `docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md` y skill V2.
- No copiar repositorios completos dentro de `src/` sin auditoría: licencias, archivos generados, modelos, CDN, scripts postinstall y exposición de puertos.

**Fase 1 · Comparativa funcional**
- A: FableCut local aislado; pruebas unitarias previas 506 PASS/30 SKIP y 34/34 targeted FFmpeg PASS **no son prueba audiovisual del Reel**.
- B: HyperFrames local aislado; probar render `seek` de Three.js con 30 fps y alpha; verificar dependencias Node22+, Chromium, FFmpeg, codecs y recursos VPS.
- C: OpenChatCut/Timeline Studio como fallback, sin integrar AGPL a producto cerrado.
- Entregar tabla medible: capacidad, UI, export, render, memoria/CPU/GPU, latencia, seguridad, coste, licencia, bugs, facilidad de extensión, calidad visual real.
- **Gate**: escoger base por POC, no por estrellas ni demo.

**Fase 2 · Esqueleto de proyecto unificado**
- Crear adaptador `SuesTimelinePort` y `FableCutAdapter`; evitar acoplar Master Director al formato interno de FableCut.
- Implementar importación fuente, tracks, clips, edición y persistencia con CAS, undo, asset registry, validación de derechos.
- Reutilizar la autenticación y hosting existentes de SUES; no exponer servidor FableCut sin proxy/auth y aislamiento de filesystem.
- Mostrar timeline en el estudio existente con reproducción real; migración por feature flag reversible.

**Fase 3 · HyperFrames Motion Engine**
- Integrar `MotionService`, contrato de subcomposición, source editable, caché alpha, catálogo, visualizer de fotogramas y export.
- Producir primero una escena 3D compleja con materiales y acción narrativa: `boundaries-no-guilt`.
- Verificar reproducción y edición en estudio, sin que sea solo un MP4 pegado.

**Fase 4 · Matting, capas y captions**
- Modelos auditados, alpha con cobertura temporal, seguimiento de silueta, composición de B-roll lateral de gran tamaño.
- Alineación por palabra, estilos de Montserrat, jerarquía, títulos semánticos, safe zones de rostro.
- Prueba de 8–12 segundos del Reel 158404: niño y grupo detrás de Carlos, GIF delante, subtítulos y un motion con significado.

**Fase 5 · Inspector y supervisor**
- `renderFrame(t)` como herramienta del agente, misma ruta que preview/export.
- Evaluación de todos los cambios significativos, contacto y escenas críticas, comparación de píxeles y crítica artística.
- Reparaciones atómicas y prueba de regresión de lo que ya funcionaba.

**Fase 6 · Reel 158404 completo**
- Importar el proyecto aprobado sin degradar operaciones ni inventar recursos; convertir `sues-master-story/v1` a contrato v2 con manifiesto de cobertura bidireccional.
- Renderizar por escenas, corregir por QA, export 1080×1920 30fps con audio intacto; verificar CTA grabado (no inventar voz).
- Abrir desde el estudio único y demostrar que mover un B-roll, cambiar tamaño de captions o editar motion altera el proyecto y el export, no solo la vista previa.
- Carlos valida visualmente; no publicar sin aprobación.

**Fase 7 · Limpieza controlada y despliegue**
- Identificar código legacy redundante por import graph y tests. Eliminar SOLO tras comprobar paridad, sin borrar fuentes/ediciones previas.
- Desactivar rutas de render auxiliar, mantener FFmpeg para códec y procesamiento; retirar rutas duplicadas, feature flags vencidas y formatos abandonados mediante migraciones.
- Documentar rollback, recursos, dependencias, licencias, métricas, backups y QA. Desplegar a producción únicamente después de pruebas y aprobación.

## 9. Tests de aceptación NO negociables

1. **Mismo proyecto:** cambiar desde IA y desde UI actualiza misma revisión, con undo/redo; guardar y reabrir mantiene todo.
2. **Paridad:** 30 frames escogidos del estudio y del MP4 exportado son visualmente equivalentes dentro de tolerancia documentada; probar también un frame de cada transición/máscara.
3. **Niño:** niño y grupo completos y reconocibles detrás de Carlos durante TODO el plano, sin ser ocultados por Carlos; alpha continua sin huecos.
4. **GIF:** se ve delante del torso, escala narrativa, alpha sin fondo y sin tapar subtítulos/rostro.
5. **Captions:** una palabra nueva por cue, acumulación, fuente correcta, 2 líneas, palabra clave de mayor tamaño, ningún texto anticipado ni cortado.
6. **Semántica:** título «CANSANCIO» solo al pronunciar «cansado» en ejemplo; títulos del Reel solo al terminar la idea relevante.
7. **3D:** movimiento tridimensional verificable, luz/sombra/material y acción que cuenta algo; no aprobar dos rectángulos con palabras.
8. **Sonido:** voz inteligible, música continua bajo voz, SFX con motivo, ausencia de fonemas cortados.
9. **Reversibilidad:** cada clip, motion, máscara, caption, música y texto sigue editable; nada queda solo en MP4 aplanado.
10. **Seguridad:** sin secretos en repositorio, permisos por usuario/proyecto, rutas sandbox y derechos de activos comprobados.
11. **Calidad cinematográfica:** Carlos puede rechazar aunque pasen tests; el sistema registra correcciones y las usa en próximas escenas.

## 10. Riesgos, contingencias y límites

- **Integración técnica:** FableCut y HyperFrames NO prometen integración plug-and-play; adaptador y codec alpha son trabajo real.
- **GPU/CPU:** WebGL headless en VPS puede no ofrecer aceleración; benchmark CPU/EGL/GPU y fallback sin bajar calidad.
- **Licencias:** Apache2/MIT no cubren automáticamente terceros, modelos, música, fuentes, B-roll ni plataformas. No introducir AGPL/NC en SaaS sin decisión informada.
- **Dependencias:** no ejecutar `npm install` o scripts externos en servidor de producción sin revisión; usar sandbox y versiones fijadas.
- **Costes:** priorizar open source local y no comprar Pro ni llamar APIs de pago sin consentimiento.
- **Escalabilidad:** proxies, caché por hash, render parcial, cola, límites por job, cancelación, control de memoria, cleanup y retención.
- **Audio y CTA:** la voz real es fuente de verdad; si el CTA maestro no está grabado, solicitar audio y dejar operación bloqueada.
- **Modelos de IA:** su evaluación estética no es infalible; por eso el agente entrega evidencia visual y Carlos decide.
- **No comenzar de cero por orgullo técnico:** si el backend, autenticación y biblioteca actual funcionan, mantenerlos. Reescribir solo las capas que fallen el POC.

## 11. Matriz de decisión de motores

Ponderaciones propuestas:
- Calidad de composición real, máscaras, motion, captions y audio: **30%**
- Identidad preview/export y editabilidad: **25%**
- Facilidad de control por agente y capacidad de autoinspección: **20%**
- Licencia y coste comercial: **10%**
- Estabilidad/rendimiento VPS y mantenimiento: **10%**
- Migración sin pérdida de assets/historial: **5%**

La decisión requiere evidencias, no puntuaciones inventadas. Si FableCut falla paridad o no se puede integrar motion alpha, evaluar OpenChatCut/Timeline Studio o un compositor HyperFrames central con timeline propio; NO construir un híbrido quebrado.

## 12. Primer entregable obligatorio

**POC_SU​​ES_158404_SCENE_02**: abrir en el estudio un fragmento real con niño/grupo detrás de Carlos, captions grandes, título semántico, GIF delante y una subcomposición 3D `DECIR NO / CULPA`. Se puede usar dos escenas contiguas para no inventar que todo coincide en el mismo segundo del guion. Debe existir:
- proyecto editable versionado;
- preview reproducible en el estudio;
- captura de fotogramas compuestos que el agente puede inspeccionar;
- export 1080x1920 con audio;
- evidencia de paridad y checklist de QA;
- fuente y licencia de cada recurso;
- tabla automática/manual/bloqueado;
- commit en PR27, sin desplegar a producción.

**Estado de esta entrega:** plan creado y fuentes revisadas; integración todavía no ejecutada. Se autoriza continuar por fases en staging con aislamiento, sin compras ni publicación.
