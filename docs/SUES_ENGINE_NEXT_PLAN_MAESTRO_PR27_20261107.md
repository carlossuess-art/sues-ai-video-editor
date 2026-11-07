# SUES AI VIDEO EDITOR · Plan maestro de reconstrucción e integración del motor (PR #27)

**Fecha:** 7 de noviembre de 2026  
**Estado:** arquitectura objetivo + primera prueba aislada ejecutada; SIN migración completa ni aprobación creativa.  
**Repositorio:** `carlossuess-art/sues-ai-video-editor`  
**Rama de trabajo:** `feat/master-director-story-orchestration-20261104` (PR 27)  
**Fuente normativa:** SUES AI Film Director 1.5.7, reglas generales y normativa cinematográfica V2 D01–D77.  
**No tocar:** producción, contenido original, licencias, datos de clientes, ramas no relacionadas. No emitir versión D1/D2; una revisión activa con histórico reversible.

## 1. Diagnóstico técnico y editorial: qué se debe sustituir

El fracaso de los montajes anteriores no es un problema de escoger el color naranja ni de añadir una transición. Se comprobó que:

1. El storyboard aprobado no es la misma fuente de verdad que las capas editables del estudio.
2. Un render auxiliar de FFmpeg puede cambiar aunque el timeline del editor no haya cambiado, y viceversa.
3. La IA declaraba verificación de 2.213 fotogramas cuando la mayoría solo se habían **decodificado**; la inspección artística había sido de hojas de contacto y muestras.
4. Los subtítulos se generaron mecánicamente sin validar ubicación bajo barbilla, peso visual, tamaño real en móvil y acumulación semántica.
5. La máscara de fondo era incapaz de cubrir intervalos continuos, y la imagen del niño no alcanzaba el tamaño o significado exigido.
6. El motion graphic era una sucesión de rectángulos y textos, no una composición con materiales, profundidad y transformación significativa.
7. El título se podía activar antes de que el público comprendiera la frase, por usar el instante de aparición de una palabra clave y no la finalización de una idea.
8. El CTA aprobado no existía en el audio original. No se puede sintetizar una voz ni inventar palabras para declarar completo un Reel.
9. Tests de integridad, licencias, QA visual, aceptación creativa y estado del editor se confundían.

**Conclusión:** el motor principal tiene que pasar de «plan → compilar otra cosa → render aplanado aparte» a **«plan aprobado → operaciones versionadas del MISMO timeline → preview compuesto del mismo compositor → agente lo inspecciona y modifica → export de ese timeline»**. Los motores especializados pueden producir activos o composiciones, pero el proyecto real manda.

## 2. Qué hay ya en la PR y qué se conserva

NO eliminar en bloque el repositorio ni los módulos anteriores: es una pérdida de trabajo y evidencia. Eliminar/desactivar **como rutas principales** lo que se demuestre incompatible con el nuevo contrato; conservar temporalmente detrás de adaptadores o en histórico hasta paridad verificada.

**Conservar como autoridad:**
- SUES AI Film Director (director creativo), reglas D01–D77 y storyboard aprobado, sin cambiar su significado para adaptarse al motor.
- SUES MASTER DIRECTOR (cerebro/orquestador): escenas, capas, criterios de éxito, dependencias y supervisor.
- Contrato `sues-master-story/v1`, IDs de plano, `sourceSha256`, `timelineFingerprint`, `sourceTimeMap`, `requirements`, asset IDs, permisos y decisiones de Carlos.
- Biblioteca propia, fuente original, transcripción y borradores ASR con incertidumbre, fuentes Montserrat verificadas, identidad de marca y documentos de checkpoint.
- Servidor con autenticación, políticas de medios con SHA, modo Work/ChatGPT por conectores, reversión y separación de producción/staging.

**Reevaluar y progresivamente sustituir:**
- Render parcial FFmpeg armado por scripts ad hoc como producto que se presenta a Carlos.
- Compiladores/exportadores que eliminan máscaras, motion o captions por limitaciones del schema.
- Importadores que aceptan solo plan viejo `sues-edit-plan/v1` y convierten `sues-master-story/v1` con pérdidas.
- «QA PASADO» basado exclusivamente en decodificación o en pruebas unitarias.
- UI que muestra un MP4 de vista previa en lugar de un proyecto de montaje multicapa editable.
- Duplicidad de timeline bruto/derivado/proxy sin mapa de tiempo verificable.

**Precaución concurrente:** en el worktree aislado de la rama ya se encontraron archivos locales no confirmados en `docs/engine-next/`, `src/engine-next/`, `scripts/engine-next/`, `tests/engine-next/`, preparados por otro proceso o sesión. No sobreescribir, borrar ni incluirlos indiscriminadamente en commits ajenos; reutilizar su `engine-capabilities.js` y `prepare-fablecut-poc.mjs` después de revisión.

## 3. Herramientas y responsabilidades: un editor, no cinco aplicaciones

### 3.1 Núcleo de timeline y render: FableCut, candidato preferido

**Código:** https://github.com/ronak-create/FableCut  
**Autor:** Ronak · **Licencia:** MIT  
**Referencia descargada en VPS aislada:** commit `579b08e`  
**Evidencia real:** 536 tests, 506 PASS/0 FAIL/30 SKIP sin FFmpeg en PATH; 34 tests específicos PASS/0 FAIL/0 SKIP usando FFmpeg aislado; proyecto 158404 preparado e instancia local de FableCut con `GET /api/project` respondiendo 200 y 5 clips/4 media. **No equivale a E2E de composición cinematográfica.**

Qué interesa:
- Proyecto JSON multipista persistente.
- UI y agente modifican el mismo proyecto por operaciones atómicas; `baseRevision`, control de conflictos y undo.
- Compositor compartido por preview/fotograma compuesto y export según código y documentación del autor.
- `setMatte`, `setMask`, `setMaskKeys`, `setParent`, `setShape`, composiciones anidadas, `track` y operaciones temporales.
- Importación y reel 1080×1920, audio, subtítulos, biblioteca, keyframes, motion blur y API/MCP.
- Servicio web local sin dependencias de ejecución de Node externas (no exige framework UI a nivel servidor).

**No adoptar ciegamente:** FableCut está orientado a localhost y no debe exponerse tal cual a internet. SUES necesita proxy autenticado, aislamiento por proyecto, política de subida segura, controles de cookies/origen y desmontaje de servicios. Los datos de proyecto y recursos no deben quedar expuestos al navegador de otro usuario. Quedan sin probar paridad en mascarilla alpha profesional, codecs ProRes alpha y conformidad de voces/captions.

### 3.2 Motion cinematográfico: HyperFrames / Three.js / GSAP

**Código:** https://github.com/heygen-com/hyperframes  
**Organización:** HeyGen · **Licencia del repositorio:** Apache-2.0  
**Commit de exploración:** `a3b8f52` · código local inspeccionado, monorepo Bun.

Responsabilidades:
- Transformaciones 2.5D/3D con geometría, materiales, perspectiva, partículas, iluminación y cámara.
- Animación *seekable*: estado visual reproducible al tiempo `t`, sin depender del reloj de reproducción del navegador.
- Subcomposición con interfaz de parámetros: fuente, texto, color, textura, duración, cámara, claves y asset IDs.
- Producción de un **asset transparente alpha** WebM/ProRes 4444 como puente inicial FableCut, o composición HTML montada como capa editable si FableCut demuestra soporte compatible. El formato temporal no sustituye a código fuente editable.
- Plantillas SUES de calidad para emoción/símbolos/educación: candado de acero y oro, cadenas de corazón anatómico, máscara que se agrieta, espejo que recupera el reflejo, esfera de energía, lista de 5 decisiones con profundidad.
- Nunca declarar «motion 3D» a una tarjeta plana con dos cajas.

**Punto de fricción:** HyperFrames usa Bun, Chromium y WebGL/GSAP/Three; integrarlo como proveedor de activos/render aislado es técnicamente más seguro que injertar su monorepo directamente en FableCut. El subrender debe tener duración y fotogramas deterministas y sus parámetros deben permanecer editables en SUES, incluso si el primer bridge genera ProRes alpha.

**Alternativas de referencia:** OpenFilm (HTML con `frame(t)` y `openfilm look`) puede ser alternativa para composición que la IA inspecciona, o editor principal si FableCut no supera paridad; HyperFrames no es un sustituto completo de un NLE multipista.

### 3.3 Orquestación y selección de escenas

**FireRed-OpenStoryline** · https://github.com/FireRedTeam/FireRed-OpenStoryline · Apache-2.0.  
Aprovechar ideas de herramientas MCP atómicas, Style Skills y operaciones de contexto. NO desplegar múltiples agentes que compiten por el mismo timeline. SUES MASTER DIRECTOR conserva autoridad del proyecto y decide a qué herramienta remite el trabajo, cuándo revisa el supervisor y cuándo bloquear.

**AutoBroll / Claude Reelsmith:** estudiar su planificación narrativa, búsqueda de B-roll que cuenta la frase y captions con tiempos verificables. Pueden inspirar adaptadores; no importarlos como editores enteros ni replicar su UI.

**Lumen:** usar como patrón del método de observación: el agente ve el fotograma ya compuesto y registra por qué lo aprueba o corrige, sin confundir el vídeo original con la exportación.

### 3.4 Segmentación de siluetas y composición profunda

El recorte no debe depender de un matte incompleto o de una foto pequeña al lado derecho. Requerimientos del módulo:
- Alpha temporal por cada fotograma del intervalo (30fps), con `sourceTimeMap` y procedencia verificados.
- Calidad en pelo, hombros y manos, con eliminación de rebaba y feather variable según fondo.
- Tracking y reencuadre de objeto narrativo **independiente** del sujeto principal (niño/grupo/espejo).
- Medida de visibilidad: bounding boxes/zonas de saliencia del elemento indispensable, intersección con silueta, escala mínima, contraste y legibilidad del elemento.
- Trazo exacto `z = fondo < B-roll detrás < silueta Carlos < GIF delante < captions/título`, salvo composición motivada.
- Si una matte no cubre 100% de su tiempo, **bloquear esa operación**, no apagar el B-roll silenciosamente.

Candidatos: SAM2 con código/pesos Apache-2.0 para propagación de máscaras (no soluciona por sí solo alpha de pelo), MODNet existente con auditoría de licencia y procedencia exacta; otros matting con verificación de uso comercial antes de integrar. MatAnyone2 y BRIA RMBG2 tienen condiciones no comerciales en determinados pesos: no se integrarán como recurso comercial sin licencia específica.

### 3.5 Voz, transcripción y subtítulos

Reutilizar ASR local Whisper (ya disponible en servidor), con alineación forzada y revisión humana de zonas dudosas cuando corresponda. Dos cronologías: fuente original y timeline editado, ligadas por `sourceTimeMap`.

Subtítulos SUES:
- Montserrat de peso y fichero verificables, no inventar SemiBold inexistente.
- Cada palabra se revela al pronunciarse, acumulando **solo palabras ya oídas** y máximo dos líneas preferentes.
- Posición *justo debajo de barbilla observada*, no constante `y=620` para todas las escenas.
- Palabras importantes mucho mayores, énfasis naranja fuego/neón según normativa y relación con frase; contraste y caja de seguridad reales.
- Nunca cubrir cara, gestos ni objetos narrativos; tipografía/borde/sombra y escala en dispositivo móvil.
- El rótulo protagonista es una capa distinta: **aparece después de que el significado se haya completado**, no al comienzo de la palabra/frase ni por estar en un diccionario de keywords.
- No recortar fonemas, negaciones ni expresividad.

### 3.6 Sound design y música

Una pista de voz auténtica y protegida, una música subordinada con ducking calculado y una pista de efectos separados. Identidad y licencias de cada recurso verificadas. Intro whoosh+impacto sin cubrir la primera palabra, transiciones de dinámica justificadas por narrativa. Medir picos, loudness y clipping, además de escuchar muestras y transiciones. No declarar el CTA maestro completo sin una grabación de esa frase exacta.

## 4. Arquitectura de información y dominio de edición

Separa:
1. **Creative Intent** (SUES Film Director): lo que debe significar cada operación, no se reduce a lo que pueda renderizarse.
2. **Canonical Edit Project**: único documento versionado editable, IDs estables, fuente de verdad para UI/IA/export; formato FableCut adoptado mediante *adapter*, no obligatorio que el contrato de SUES quede acoplado para siempre a su JSON interno.
3. **Resource & Motion Registry**: vídeo, foto, alpha, música, fuentes, matting y fuentes HyperFrames, con SHA, licencia, formato, permisos, versión y path/URI seguros.
4. **Executor/Compositor**: API que muta el mismo proyecto, devuelve diff/revision, genera fotograma compuesto y render final con misma ruta.
5. **Supervisor**: verificaciones estructurales + visión de frames compuestos + sonido + fidelidad creativa.
6. **User Approval**: validación por Carlos sin pérdida del histórico; aprobación de publicar independiente.

**Contrato de operación canónica sugerido, no importable todavía:**
```json
{
  "operationId": "shot-2-2",
  "sceneId": "scene-02",
  "intent": "El niño intentando encajar se ve claramente detrás de Carlos",
  "sourceStart": 9.5,
  "sourceEnd": 13.5,
  "editStartFrame": 285,
  "editEndFrame": 405,
  "resourceIds": ["b02-child-original", "matte-carlos-158404"],
  "layers": [
    {"role": "original-background", "z": 0},
    {"role": "narrative-broll", "z": 10},
    {"role": "carlos-foreground-alpha", "z": 20},
    {"role": "captions", "z": 40}
  ],
  "geometry": {
    "canvas": [1080, 1920],
    "region": [230, 180, 820, 1480],
    "matteFeatherPx": 100,
    "trackObject": "child-and-group"
  },
  "semanticAnchor": {
    "meaning": "aprender a molestar menos para encajar",
    "revealAfterWordEnd": true
  },
  "qa": [
    "child-visible-all-frames",
    "group-visible",
    "continuous-matte",
    "frame-parity",
    "caption-face-safe"
  ],
  "status": "blocked-until-matte-and-qa"
}
```
Este ejemplo es deliberadamente un **diseño de contrato futuro**, NO una extensión permitida al schema actual `sues-master-story/v1`. Solo será válido tras diseñar versión, migrador y validadores con test reales.

**Tiempo y frames:** el origen bruto del Reel 158404 está identificado por SHA `9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad` y VFR. Generar una única interpretación CFR30 con mapa auditable, rebasar cada operación a frames enteros y derivar previews por el mismo grafo; no recalcular offsets de memoria a cada render. No adulterar el bruto.

## 5. Flujo completo de un Reel dentro del nuevo estudio

1. Carlos sube el bruto.
2. El servidor valida hash, orientación, duración, códec, audio, fps variable, metadata y licencias.
3. ASR local produce palabras con `start/end/confidence`, audio preview y dudas.
4. Film Director analiza **discurso y arco completos**, crea 7 fichas o las que correspondan y plan de plano-capa-voz-música con condiciones artísticas.
5. Carlos aprueba storyboard completo (la aprobación está vinculada a hash de revisión).
6. Master Director convierte TODAS las operaciones a la edición canónica; registra por operación `implemented | needs-renderer | needs-resource | blocked`; ninguna desaparece sin aviso.
7. Resolver recursos: buscar catálogo, usar recursos autorizados y generar solo lo consentido. Todos con derechos y hash.
8. Componer escena en el timeline real: pistas vídeo/cámara, B-roll máscara, objetos alpha, texto, motion fuente y voz/audio.
9. Inspector obtiene fotogramas *compuestos reales* antes/durante/después de cada entrada, salida y ancla semántica; además escucha segmentos con voz/música.
10. Supervisor identifica defectos perceptivos y de significado: niño invisible, título prematuro, texto demasiado pequeño, máscara hueca, motion superficial, voz tapada. Emite patch transaccional, no un MP4 paralelo.
11. Repetir render/inspect/patch solo mientras haya cambios con pruebas; una escena degradada queda bloqueada aunque FFmpeg termine sin error.
12. Carlos abre exactamente ese proyecto editable en el estudio, mueve y aprueba detalles, sin perder capas ni fuentes.
13. Export final 1080×1920 o resolución de destino desde el MISMO compositor y revisión.
14. Dos pases de QA independientes sobre vídeo compuesto y audio; evidencia de paridad con preview, hash y manifest de export.
15. Aprobación explícita de Carlos y publicación separada.

## 6. Plan de desarrollo de PR 27 por fases y puertas de salida

### Fase 0 · Preservación y contrato de migración
**Objetivo:** no romper lo que ya funciona.
- Congelar estado de PR27, SHA, entornos staging y fuente 158404.
- Backup reproducible de base/medios/políticas/documentación, sin transferir secretos a GitHub.
- Inventariar rutas UI/server/compilers y todos los tests; clasificar mantener, reemplazar, adaptador, histórico.
- Proteger el trabajo no confirmado de otros procesos en `engine-next/`, no hacer `git clean` ni merge indiscriminado.
- Tabla de correspondencia entre 49 operaciones y módulos actuales.
**Gate:** recuperabilidad demostrada y 49/49 requisitos referenciados, cero pérdida.

### Fase 1 · POC FableCut aislado real
**Objetivo:** probar que existe un editor único real.
- Fuente FableCut fijada a commit, código externo en directorio/vendor aislado sin copiar archivos no revisados.
- POC con fuente Reel 158404 SHA original; audio separado, niño B02, GIF alfa; timeline JSON multipista.
- Levantar local loopback con `FABLECUT_DATA_DIR` privado y sin puerto público.
- API de estado debe mostrar proyecto correcto y cambios en un único revision ID; editar un texto y un clip desde MCP/API y ver exactamente la mutación en el navegador.
- Probar captura del fotograma compuesto real y render export de misma escena.
- Si falla undo, capas, texto, matte, codec o paridad de frames, reexaminar OpenFilm o OpenChatCut en lugar de forzar.
**Gate:** proof visual real en 1080×1920, no basta con test JSON.

**Ejecución de esta sesión:** POC creado en `/tmp/sues-engine-next-fablecut-poc-158404-20261107`; 5 clips, 4 medios, 1080×1920/30fps, 49 operaciones reconocidas y preservadas en ledger **pero todavía no materializadas todas**; dos capas inseguras desactivadas de modo visible; FableCut local responde 200 y devuelve ese proyecto por API en `127.0.0.1:7779`. No expuesto a Carlos ni render aprobado.

### Fase 2 · Integración segura en backend SUES y estudio único
- Crear `EngineAdapter` con `getProject, applyPatch, composeFrame, renderRange, export, inspect, undo`.
- Adaptar FableCut a backend/SUES, utilizar la autenticación y rutas actuales.
- Publicar UI de proyecto en staging detrás de autenticación, proxy y CSP; sin bypass por localhost.
- Conservar políticas de origen, media, cookies, firmas por proyecto, límites de carga y sandbox de contenido HTML.
- Asegurar que UI y agente comparten `projectId+revision`; cambios de un actor generan CAS y undo visibles.
**Gate:** edición ejecutada desde IA aparece en el mismo estudio, y un cambio manual aparece en API + export sin reconstrucción.

### Fase 3 · HyperFrames / motion 3D como composición fuente
- Fijar versión Apache-2.0 y ejecutar herramienta aislada con límites CPU, RAM, GPU y duración.
- Crear tres escenas piloto de verdadera complejidad cinematográfica (objeto material + transformación causal + cámara) y representar todos sus parámetros.
- Primera integración por `renderTransparentAsset(manifest)` + archivo alpha verificable, **manteniendo el código fuente y el manifest editable**; no declarar un MOV aplanado como motion editable en profundidad.
- Probar segunda integración nativa de subcomposición live si FableCut puede mostrarla con preview/export paritario.
- Banco de plantillas SUES con preview de calidad aprobado por Carlos; visualmente un corazón con cadenas, espejo con grieta, candado abierto y listas 3D.
**Gate:** títulos/materiales/iluminación/objetos se ven por el MISMO compositor; movimiento realmente determinista al buscar frames arbitrarios, alpha no aparece negra, export conserva efectos.

### Fase 4 · Matting temporal y máscaras espaciales
- Elegir inferencia licita para uso comercial; auditar modelos/pesos.
- Procesar matte 100% del intervalo con seguimiento de torso/cabeza/manos, frame/time map, feather y oclusión.
- Para B02, posicionamiento semántico de niño+grupo, con test de no oclusión real en todos los frames del tramo; para B05, espejo perceptible de 40–60% de área detrás de Carlos y fusión natural.
- Matte frame no disponible o hueco: **bloqueo de escena**, nunca apagar B-roll y declararlo «completo».
**Gate:** clip behind-subject visual continuo, escala, silueta y posibilidad de reposicionarlo desde estudio.

### Fase 5 · Motor editorial de subtítulos y títulos
- Definir proyecto de captions como secuencia de spans por palabra, reglas de jerarquía, fuentes, colores y safe zones.
- Sincronización exacta con voz y pausas; activar título **después** de cerrar la idea semántica.
- Detector de rostro y barbilla por plano; captions se ubican debajo adaptativamente o en banda segura si cámara no visible.
- Superposición de textos motion/título/subtítulo debe evitar duplicaciones no justificadas.
- Probar reel 158404 (168 palabras draft revisables), además de frases negativas y ejemplos adversariales: «cada vez estás más cansado» (CANSANCIO al final), «no es miedo al amor, es miedo a perderlo».
**Gate:** revisión de palabras y sentido sin títulos anticipados; fotogramas visibles en móvil real.

### Fase 6 · Música, SFX, pausas y CTA
- Voz original como pista protegida y separada,音 exacto de audio fuente. Evitar duplicar stems.
- Música sin tapar voz, mezcla y LUFS, intro impacto, sonido motivado por escena y transiciones.
- CTA maestro en audio solo si existe grabación exacta autorizada. No reutilizar un CTA cuyo audio pronuncia otro guion.
**Gate:** prueba auditiva completa, phoneme-safe, sincronía con captions y control de derechos.

### Fase 7 · Supervisor audiovisual auto-correctivo
Dos verificadores independientes:
- **Técnico:** tiempo, codec, capas, SHA, alpha, fps, fuente, efecto soportado, render/audio, errores.
- **Cinematográfico:** fotogramas compuestos significativos, continuidad, legibilidad, significado, escala, oclusión, tamaño protagonista, calidad 3D y título semántico.

La auditoría visual no consiste en un count `2213/2213` por FFmpeg. Capturar/interpretar imágenes compuestas en anclas, cambios de estado y spans de riesgo; medir todos los frames automáticamente donde sea posible (visibilidad, alfa, caras y geometría), con revisión semántica representativa y tests de regressión. Comparación per-pixel render/preview tolerancias de color y motion blur definidas. Solo aprobar cuando ambas pasan y Carlos confirma arte.

### Fase 8 · Migración definitiva y limpieza del código
Solo después de Gates 1–7:
- Conmutar editor principal de staging.
- Migrar las escenas/49 operaciones completas desde plan a timeline (las no soportadas siguen como bloqueos explícitos).
- Confirmar guardar, cerrar, reabrir, editar, export y revertir con Reel 158404.
- Retirar dependencias/código del editor viejo que hayan quedado sin uso demostrado, con tests de regresión; archivarlas antes.
- Repetir pruebas en móvil/desktop, voz, licencias, latencia y acceso seguro.
- PR27 queda revisable, sin merge automático ni despliegue productivo hasta autorización de Carlos.

## 7. Matriz mínima de aceptación del Reel 158404

| Escena | Prueba creativa innegociable | Verificación |
|---|---|---|
| Hook 0–7,73 | Golpe de entrada correcto, «PERDERTE A TI MISMO» después de idea, B01 completo entra y sale, aplausos solo al sentido | revisar 0,0/1,4/2,3/3,2/5,6/6,68/7,73 y transiciones |
| Encajar 7,73–16,83 | Niño y grupo visibles **detrás de Carlos**, gran tamaño, feather/tracking continuo, «NO MOLESTAR» contextual | matte 100% intervalo B02, detección zona niño/grupo y primeros/últimos frames |
| Conflicto 16,83–26,67 | M01 no dos cajas estáticas; GIF STOP grande delante del pecho sin tapar cara/voz; sonido y sentido | revisar material, trayectorias, ocultamientos y voz «poner límites» |
| Amor/miedo 26,67–43,33 | B04 exclusión narrativa, M02 objeto/comparación sustancial, título se revela tras idea | voz/títulos, assets, transiciones, jerarquía visual |
| Reconocerte 43,33–55,83 | B05 espejo integrado detrás de Carlos, M03 transformación 3D/2.5D real, no dos palabras planas | matte continuo, iluminación, profundidad, coherencia narrativa |
| Decisión 55,83–65,17 | fuerza visual de «DEJAR DE TRAICIONARTE» sin adelantar idea | semántica, frame compuesto, cara visible |
| CTA 65,17–fin | audio auténtico, CTA exacto aprobado, logo y SÍGUEME posterior al habla | waveform/palabras verificadas; bloqueado si falta locución |

**Criterio de publicación:** no aceptamos «pasa tests» como sustituto de «parece un vídeo que Carlos publicaría». Carlos aprueba arte después de que las comprobaciones de sistema estén limpias.

## 8. Riesgos, mitigaciones, coste y decisión

**Riesgo seguridad:** servidor FableCut local, API y media no endurecidas para SaaS multiusuario. Solución: jamás abrir directamente `7779` al exterior, wrapper autenticado, proyecto por workspace, validar origen y rutas, secretos no trasladados.

**Riesgo dependencia:** FableCut u OpenFilm pueden cambiar. Solución: pins a commit/versión, manifiesto, pruebas de actualización, fork interno únicamente si la migración lo exige y se respetan licencias.

**Riesgo motion/render:** WebGL/Three/Chrome sin GPU real pueden ser lentos o variar; guardar la fuente y render cache validado. Medir CPU/RAM y sample frame parity; fallback de ProRes alpha pero no olvidar que es asset, no código de composición original.

**Riesgo licencias:** MIT/Apache aptos con notices; material y modelos no heredan licencia de repositorio; evitar integrar matting NC, AGPL en SaaS sin evaluación, música/stock sin permisos.

**Riesgo coste:** Herramientas abiertas ejecutables no garantizan coste cero (VPS, GPU, almacenamiento, API opcional, generación de imágenes/vídeo, Remotion según plan y finalidad). Se priorizan proveedores locales/OSS, no gastar créditos o contratar nada sin autorización.

**Riesgo de calidad:** construir la pipeline y volver a caer en rectángulos sin dirección. Solución: biblioteca de motion de referencia con aceptación humana previa; gates estéticos de tamaño, movimiento, profundidad, luz y causalidad, no puntuar solo «elemento presente».

**Riesgo de sobreingeniería:** instalar FableCut, OpenChatCut, Timeline Studio, OpenFilm y HyperFrames completos empeoraría la dispersión. Se investigan como benchmarks; FableCut es **primer motor a demostrar**, HyperFrames proveedor de motion, FireRed inspiración de skill/semántica, OpenFilm benchmark alternativo.

**Decisión recomendada hoy:** realizar vertical slice de FableCut con Reel 158404 y bridge HyperFrames alfa/source-parameter, probar 100% de composiciones sin perder editabilidad, después elegir editor oficial. Si las pruebas fracasan, comparar OpenFilm/OpenChatCut antes de continuar una reescritura nativa. El plan conserva trabajo y evita gastos o cambios irreversibles.

## 9. Estado de ejecución y evidencias (NO inflar)

**Hecho:**
- Código de FableCut, HyperFrames y FireRed descargado e inspeccionado fuera de producción, con referencias de commit.
- FableCut suite 506/536 PASS con 30 skips y 34/34 tests focales PASS con FFmpeg.
- Rama PR27 inspeccionada; detectado trabajo local no confirmado en `engine-next/`, preservado.
- POC con fuente real Reel 158404, su audio separado, foto narrativa B02 y GIF alpha creado por script existente del worktree, en directorio aislado.
- POC FableCut corriendo únicamente en `127.0.0.1:7779`, `GET /api/project` muestra **5 clips, 4 media, 1080x1920 a 30fps y revisión 1**. 2 clips no seguros se mantienen disabled con observaciones explícitas, y las **49 operaciones están inventariadas, NO incorporadas** todavía como elementos completos.
- Normativa SUES Film Director leída y vinculada.
- Plan completo versionado en PR27 sin sobrescribir código paralelo ni producción.

**No hecho:**
- No hay render cinematográfico final del Reel desde FableCut.
- No hay bridge HyperFrames integrado de forma operativa ni un motion gráfico 3D aprobado por Carlos.
- No se han probado mattes completos, posición bajo barbilla frame a frame ni export/preview parity de Reel 158404.
- No existe capa de seguridad cloud multiusuario para FableCut.
- No se han retirado módulos antiguos ni mergeado PR27.
- No se ha sustituido ya el editor de producción: cualquier afirmación así sería incorrecta.

## 10. Condición de parada del rediseño

No se da el proyecto por terminado por número de commits, porcentaje ficticio, suite verde o días de trabajo. Solo si:
1. Todas las 49 operaciones llegan al mismo timeline editable o quedan marcadas BLOQUEADAS sin pérdida.
2. FableCut/herramienta elegida permite inspeccionar lo mismo que exporta.
3. Mask/alpha/3D/fonts/captions/voice cumplen visual y temporalmente en 1080×1920.
4. Se puede cambiar cada elemento en el estudio, guardar, reabrir y seguir editando.
5. Supervisor técnico y artístico pasa pruebas reales y entrega evidencia; Carlos aprueba la estética.
6. Hay rollback y la producción anterior sigue operativa hasta decisión de despliegue.

**Siguiente unidad de trabajo:** no otro MP4 parcial de 73 segundos. Hacer POC end-to-end sobre **la escena del niño y el grupo con máscara real + título semántico + subtítulos**, y una composición HyperFrames 3D de **DECIR NO / CULPA**. Deben compartir timeline, tiempo y export, y demostrar la diferencia visual.
