# Primer diagnóstico y plan maestro · 25/10/2026
Corte de auditoría: producción b2ebf6df3725d245e7c3bb5518f574899d1fed0d.
Diagnóstico entregado antes de introducir cambios importantes de esta nueva misión.
El render ya iniciado con autorización previa se deja terminar; no se interrumpe Work.

## Conclusión
El motor audiovisual funciona y exporta. No existe todavía un director multimodal
profesional ni un supervisor creativo autónomo integrados. Las elecciones de la muestra
se apoyan en reglas, anotaciones y corrección del agente Work. La visión de este
proyecto declara method=not-performed con dos muestras sin rostros. Los zooms del
MP4 no prueban tracking facial. No hay segmentación general ni blur selectivo de fondo.

## Recuperación y trazabilidad
Se leen README, PROJECT_STATUS completo, ARCHITECTURE, VIDEO_EDIT_PLAN y Roadmap
Maestro de Drive (modificado 24/10,17:04UTC), además de AGENTS y General Studio.
Se inventarían 46 ramas. main sólo refleja la POC; buscar commits sin ref devolvió
esa historia antigua. Se contrastan ramas y PR, no se interpreta como historia completa.
PR3–7 fusionadas; PR10–16 permanecen borradores. PR15 documenta publicación parcial
de UI/backend: no fusionar ni desplegar esa rama. Producción se verifica directamente.
README contiene avisos antiguos sobre VPS/HTTPS y ARCHITECTURE/VIDEO_EDIT_PLAN
describen Shotstack POC. Deben conservarse como históricos con enlaces al motor actual,
no usarse como especificación ejecutable vigente.
La rama de skill diverge desde cc9e390: dos commits propios, 261 detrás de producción.
Sólo añade SKILL.md y RESEARCH_AND_ASSET_AUDIT.md. No hacer checkout ni sustituir
producción por esa rama. Tras compatibilidad, portar sólo los archivos necesarios.

## A. Estimación explícita
El global oficial histórico sigue 48 %, sin cerrar F6/F7/F9.
Para el objetivo ampliado se calcula una estimación técnica independiente: 42,25/100,
redondeada a aproximadamente 42 %. NO es porcentaje estético, exactitud de IA ni
probabilidad de éxito. Rúbrica: operativo con medio real=1; parcial=.5;
experimental/código sin integración completa=.25; ausente o no acreditado=0.
Peso por impacto sobre autonomía y calidad; ponderaciones editoriales revisables.
No sumar dos veces inferencia/ejecución. Se evita premiar tests sin MP4.
La música es parcial por faltar dirección y valoración auditiva; el tracking no se
acredita en este despliegue aunque exista un adaptador en código.

## B. Matriz de capacidades
| Componente | Estado / factor | Peso | Evidencia | Pendiente |
|---|---:|---:|---|---|
| Director IA | Experimental .25 |15|Reglas, contrato externo, Qwen local rechazado|Dirección multimodal fiable|
| Análisis narrativo |Experimental .25|8|ASR y anclas semánticas limitadas|Historia completa, beats y selección|
| PyTorch / visión |Experimental .25|7|SmolVLM en una imagen; ningún torch en entornos activos inspeccionados|Visión temporal verificable|
| Tracking facial |No acreditado 0|7|Adaptador MediaPipe en repo; visión del master not-performed|Detector/seguimiento operativo y benchmark|
| Zooms y keyframes |Parcial .5|6|Zooms renderizados; external zoom escala1.04–1.22 y2–6s|Curvas generales, retorno exacto y tracking|
| Composición por capas |Parcial .5|8|ASS, overlays, gráficos y B-roll en MP4|Grafo temporal general coordinado|
| Máscaras y fondos |Experimental .25|8|Matte manual revisado, fuente/rango acotados|Sujeto completo automático y blur selectivo|
| B-roll inteligente |Experimental .25|8|54 medios instalados; subset contextual revisado|Catalogación visual amplia y selección|
| Subtítulos cinéticos |Operativo 1|5|Variación de tamaño/color y animación en MP4|Riqueza compositiva y QA continuo|
| Transiciones |Operativo 1|4|Blur/radial/warm visibles en fotogramas|Dirección motivada general|
| Efectos sonoros |Operativo 1|4|Buses procedurales/privados y mezcla comprobados|Escucha y selección narrativa|
| Música y mezcla |Parcial .5|5|Loudness y mezcla real;2 pistas|Arco musical general y escucha móvil|
| Renderizado |Operativo 1|6|1080p real, decode, proxy y versiones|Rendimiento y Android E2E|
| Supervisor visual IA |Experimental .25|6|Auditor técnico y revisión Work|Crítico creativo del MP4 y reparación autónoma|
| Skill audiovisual |Experimental .25|3|Dos archivos leídos, promptV2 equivalente recuperado|Carga versionada y uso operativo|

El factor de componente operativo acredita ejecución técnica, no automatización de
su elección. El Director es una capacidad separada con peso mayor.
Revisión posterior de reframe.js, vision.js y CAMERA_PROFILES_VALIDATION.md:
existe interpolación, estabilización y un fixture histórico de 74 muestras/73 caras
de POC_001. Puede reutilizarse con su fuente y binding originales sin repetir
MediaPipe. No acredita detección actual para un vídeo nuevo ni ojos del master.
El compositor de máscaras revisadas sólo admite fuente sin reencuadre y ventanas
revisadas: no levantar sus guards para combinar zoom/oclusión sin transformar y
validar juntos los espacios. Esto reduce trabajo duplicado, no cierra el hito.

## C. Modelos y servicios
VPS: un núcleo,4009200KiB RAM, sin dispositivo /dev/nvidia0 observado. Editor Docker
activo, Whisper systemd active. Servicios WhatsApp y Caddy observados sin modificarlos.
- Whisper base de Systran/faster-whisper-base, revisión ebe41f70..., pesos verificados.
  CPU/int8, faster-whisper 1.2.1, CTranslate2 4.8.3, ONNX Runtime 1.31.0.
  Modelo preentrenado; no entrenamiento ni fine-tuning SUES acreditados.
  Silero VAD ONNX incluido no es director ni máscara de persona.
- Entorno ASR: torch,torchvision,transformers y OpenCV pip no aparecen.
  Runtime Python editor: tampoco aparecen. Host: find_spec torch/cv2/mediapipe false.
  No se extiende esta observación a ubicaciones desconocidas de todo el servidor.
- SmolVLM2-256M Q4:131MB + proyector104MB. llama.cpp CPU, investigación aislada:
  descripción de una muestra del coche; no análisis del vídeo completo.
- Qwen3-0.6B Q8:639MB; Qwen3-1.7B Q8:1.834MB; derivadoQ4:1.107MB.
  Preentrenados oficiales Apache2, cuantización no es ajuste propio.
  1.7B Q4:181,90s primera propuesta y226,61s reparación; errores de IDs/criterio.
  Límite de RAM de ensayo ~2,1GB, no es medición de pico residente exacto.
  No se habilitan como director automático de producción.
- MediaPipe: adaptador scripts/vision/face_landmarker.py existe. No hay .task/.tflite
  bajo /opt/sues-video-setup ni módulos cv2/mediapipe en host inspeccionado.
  La existencia del adaptador no demuestra un servicio operativo.
- Motor: Node22/FFmpeg5.1/ASS; ejecuta instrucciones, no comprende emociones.
- Supervisor: análisis técnico y revisión asistida; no modelo creativo integrado.
No hay coste nuevo de API, compra ni suscripción en esta auditoría.

## D. REA y principios aprovechables
Se reutiliza REA 6.7.0 en /opt/sues-video-setup/rea-research-20261024.
CapCut: tres bootstraps públicos, 584.357 bytes y 211.967 nodos AST; carga/prefetch/borradores,
no IA privada recuperada. Captions: bundle completo agota heap; mapa de 4.679 bytes,
162 nodos AST, sin errores; chunks403 no eludidos. Nombres de módulos no acreditan
su implementación. Ver SUES_REA_FINDINGS_20261024.md.
Documentación oficial adicional, sin atribuirla a análisis REA:
- CapCut: keyframes de posición/escala/rotación/opacidad, easing, máscaras y tracking.
  Aplicación propia: curvas evaluables y pistas de tracking ligadas a fuente.
- Fusion: Merge, efectos, máscaras y spline/keyframes, tracking/rotoscopia.
  Aplicación: grafo con dependencias, orden de transformaciones, alpha y matte en caché.
- Magic Mask se documenta como función Studio; no es modelo libre que podamos extraer.
- Fairlight: separación de edición de diálogo, diseño sonoro y mezcla.
  Aplicación: spotting list, buses y mediciones; voz prioritaria y música motivada.
- Captions: estilo controla captions, motions, B-roll, audio y ritmo; ajuste posterior.
  Aplicación: estilo como política coordinada, no cuota periódica de efectos.
No hay análisis REA de binarios Resolve instalado ni recuperación de código privado.
Fuentes oficiales:
https://www.capcut.com/resource/how-to-use-capcut
https://www.capcut.com/resource/how-to-add-keyframes-in-capcut
https://www.blackmagicdesign.com/products/davinciresolve/fusion
https://www.blackmagicdesign.com/products/davinciresolve/training
https://www.blackmagicdesign.com/products/davinciresolve
https://captions.ai/help/guides/advanced/ai-edit-styles

## E. Recursos
Recuento directo de JSON operativos y archivos privados:54 medios,210744800bytes.
| Grupo | Disponible / origen | Compatibilidad y límites |
|---|---|---|
| Vídeos |23 en VPS assets|No todos son B-roll: hay fondos/gráficos; necesita anotación semántica y revisión|
| Overlays |16 en VPS|FFmpeg limitado a intensidades/rangos y composición actuales; no máscaras automáticas|
| SFX |13 WAV privados + recetas propias|Uso temporal operativo; procedencia declarada; no licencia por nombre|
| Música |2 pistas operativas|Ambiental propio y The Hex con procedencia; arco narrativo no general|
| Motions |4 operaciones nativas catalogadas, otros renderers internos|No confundir entradas con cobertura universal|
| Históricos |309 fichas en purchased-source-index-309-v1.json|36 instaladas, 273 pendientes; variantes no deduplicadas por nombre|
| Creator Club |Inventario recuperado:69 MOGRT,75 TTF/OTF,1 prfpset,3 packs CapCut|MOGRT/Adobe/CapCut no ejecutables directamente; conversión/receta propia|
| Fuentes de SUES |Montserrat y auxiliares en repo, licencias locales|Mantener familias/estilos reales; no importar75archivos a ciegas|
| Voz |cinematic-echo y vintage-tv en motor/contrato|No son modelos; valorar inteligibilidad y límites por frase|
| Referencias |VID_20261022_101557_201.mp4 localizado,55,91 s|Sólo referencia, no metraje/licencia de inserción|
Ubicaciones canónicas existentes de Drive: SUES AI VIDEO EDITOR/99_LIBRARY FINAL
y07_VÍDEOS DE APOYO,08_CATÁLOGO. La final contiene índice, no todos los medios.
Fuentes históricas reubicadas:VIDEO STOCK yEFFECTS en cuenta terapias; Light Leaks
en suessanch.ce. Light Leaks contiene Blue light Leak.mov1437361bytes.
La búsqueda por deckeanu no localiza aún una carpeta exacta verificable;
se recuperan dossier, referencias y análisis existentes sin inventar esa ubicación.
Compra Creator Club acreditada en investigación previa, no nueva sesión Hotmart hoy.
No redescargar packs completos. Los derechos de render privado/obra terminada no
equivalen a redistribución de archivos brutos; licencias específicas siguen por archivo.
El inventario completo previo está en SUES_BANCO_RECURSOS_INVENTARIO_Y_PLAN.md;
sus estados del20/10 se sustituyen con el recuento actual del25/10, no se repiten.

## F. Vídeos reales y calidad
Master0954702a:68,634 s,1080p, fuente y versión intactas.
QA fad9491e:68,634 s,32479894bytes,−15,57LUFS/−1,91dBTP, decodePASS,
sin negros/congelaciones detectados; reproducción hasta ended=true y sesión conservada.
Corrección posterior9148a6fe:MP4 terminado32455286bytes,68,634 s,H2641080×1920/30.
SHA256 9a9105f33a3f4a7d60770adb7423595737389deb73efc3ff0ff9f8f1a1a4eff7.
DecodePASS,−15,57LUFS/−1,91dBTP, sin negros/congelaciones bajo umbrales.
RUNAS/EGO: header cálido1026/1286→0; rótulos conservados, fotogramas inspeccionados.
AudioPCM SHA256 50768dcc40fbb5a8dc330354e8e4679cab5c310f17d266e6f0afb72a7ccfbcff
idéntico a QA anterior. Reproducción web de esta última versión hasta ended=true, con búfer completo y sesión recuperada.
Aún composición más fija que referencia, sin montaje narrativo a60s.
La toma del coche es QA técnica; no aceptación creativa final ni edición profesional
general. No hay escucha humana ni aprobación de Carlos.
Despliegue anterior autorizado:b2ebf6d,backupverificado,Whisperactive.
El render duró aproximadamente14 min con proxy; CPU y memoria limitadas por estabilidad.

## G. Plan maestro priorizado
No comprar, reinstalar REA ni desplegar capacidades nuevas sin validación.

### Fase 0 · Integración segura del conocimiento
Objetivo: una política audiovisual operativa dentro del director existente.
Reutilizar external-edit-plan, model-director, automatic-director y el prompt V2.
Archivos: skills/sues-ai-film-director, src/film-director-skill.js y src/model-director.js.
Cargar la política y su SHA256 en cada petición; ligar la revisión a esa huella.
Conservar sues-edit-plan/v1 y sus segundos del original. El evento en milisegundos
de la skill original es una intención conceptual, no una operación ejecutable.
Dependencias: comparación de ramas y catálogo vigente. Riesgos: contratos
incompatibles, conocimiento obsoleto y ejemplos confundidos con detecciones.
Coste externo: 0; no requiere inferencia para comprobar la integración.
Aceptación: petición de un proyecto real con política y huella; rechazo al cambiar
la política; tests y traza. No habilitar dirección autónoma por completar este paso.

### Fase 1 · Diez segundos complejos verificables
Objetivo audiovisual: cámara precisa, separación sujeto/fondo y oclusión coherente.
Reutilizar reframe, vision, reviewed-framing, subject-layers, depth-text,
local-preview, semantic-render, external-edit-plan, custom-sfx y audio-mix.
Desarrollar trayectorias de cámara con curvas y retorno exacto, pista temporal
fiable de ojos, matte temporal de sujeto y desenfoque selectivo.
Dependencias: fuente autorizada con voz, transcripción, geometría y matte válidos;
catálogo privado real. El framing fijo no sustituye una pista de seguimiento.
Riesgos: deriva facial, halos, recorte de ojos, tiempos desplazados y memoria.
Coste: medir CPU en una prueba corta; no estimar euros sin tarifa de infraestructura.
No instalar modelos o contratar infraestructura sin resolver necesidad y autorización.
Aceptación por evento: flash/zoom medio al inicio; retorno a 2 s; acercamiento a ojos
desde 2,2 s; palabra real en naranja y B-roll contextual; fondo desenfocado a 6 s;
gráfico detrás a 6,4 s; música y efectos con voz inteligible.
Medir los cues propios contra el fotograma, revisar trayectorias y bordes durante
todo el intervalo y realizar escucha del clip. Si falta tracking o matte, marcar
NOT_IMPLEMENTED y mantener la fase abierta. Un recorte de otra edición no la cierra.

### Fase 2 · Narrativa y biblioteca útil
Objetivo: elegir por intención y contexto visual, evitando coincidencias léxicas.
Reutilizar director-narrative-scenes, director-library-cues, scene-temporal-qa,
private-library-search y asset-metadata.
Completar anotaciones temporales del banco instalado antes de descargar más.
Distinguir observación, interpretación e hipótesis emocional. Rechazar recursos
irrelevantes o no verificados; comprobar licencia cuando se incorpore cada archivo.
Dependencias: capacidades demostradas en la fase 1 y catálogo real.
Riesgos: alucinación, voz alterada, saturación y coste de inferencia.
Coste externo previsto: 0 hasta autorización específica; no repetir modelos fallidos
sin un cambio justificado.
Aceptación: otro vídeo, decisiones con evidencia temporal, recursos reales y
rechazo demostrado de un candidato irrelevante. Final: no corregir IDs ni seleccionar
manualmente cada énfasis/B-roll para que el flujo funcione.

### Fase 3 · Reel de aproximadamente 60 segundos
Objetivo: arco narrativo y montaje completo con voz comprensible.
Reutilizar time-map, transcript, captions, render-worker, versiones, proxies y cola.
Desarrollar cortes/retiming generales enlazados a todas las capas y una traza
fuente/salida. Añadir el campo al JSON no equivale a ejecutar el montaje.
Dependencias: fases 1 y 2 verificadas. Riesgos: palabras cortadas, capas desplazadas,
audio perdido y discurso sin contexto.
Coste: medir un render, reutilizar caché y evitar repetir sin un cambio concreto.
Aceptación: otro bruto → DOPAMIN → editar → MP4 cercano a 60 s; comprobar captions,
recursos y sonidos dentro del archivo, reproducción móvil/escritorio, sesión,
reapertura y exportación idéntica. Final: QA por capa y valoración creativa.

### Fase 4 · Supervisor y mejora autónoma
Objetivo: detectar y reparar fallos del archivo final, no sólo del plan.
Reutilizar auditor técnico, editor-review, editor-acceptance y versiones.
Separar evaluación técnica, visual, narrativa y auditiva. Comparar el plan con
imagen y sonido; corregir en otra versión. Limitar a dos reintentos, con topes de
tokens/CPU/tiempo y criterio de parada. Conservar la mejor versión.
Dependencias: director fiable, métricas válidas y operaciones ejecutables.
Riesgos: autoaprobación, mejoras locales que dañan otros planos y coste creciente.
Coste: fijar presupuesto antes de inferencia; sin API hasta autorización.
Aceptación: fallo controlado → crítico lo detecta → reparación real → nuevo MP4
→ comparación medible; abstenerse cuando no pueda confirmar.
Final: ciclo reproducible con fuentes distintas y aceptación humana separada.

## H. Bloqueos reales
Seguimiento de ojos y matte automáticos no operativos en el entorno auditado;
cámara/retiming generales incompletos; director y crítico creativos no fiables;
anotación del banco, licencias específicas y variedad musical pendientes; CPU limitada.
REA, acceso al VPS, exportación 1080p, versiones y catálogo privado sí están operativos.
PyTorch por sí solo no resuelve el objetivo: hacen falta datos, decisiones,
compilación, evaluación y pruebas del archivo final.

## I. Avance seguro posterior al primer diagnóstico
Se porta y adapta sólo el conocimiento de la skill, sin fusionar la rama antigua.
El nuevo cargador lee la política operativa de SKILL.md, calcula SHA256 e incorpora
política, contrato, capacidades y límites al puente model-director existente.
Una petición del proyecto real con 88 captions acredita policyInActualPrompt=true,
1.256 caracteres de política y huella
c034b5db38341c3934df25b83099f99d3f5a0b1be0c2e552a59034e28beb0648.
Input SHA256 728fa58d1b53bae6481ea4a25c78d4fd941376a2fc2e946b8cdaa57e205ccb0d.
Mantiene segundos del original, alcance sólo énfasis y aprobación autónoma false.
Diez pruebas focales PASS; formato de skill válido. La revisión independiente,
sólo de lectura, distingue flash condicionado, énfasis/B-roll posibles y tracking,
blur selectivo y oclusión de sujeto nuevo no implementados. No se pide instalar
modelos ni se presenta una caja fija como seguimiento.
Código en rama de integración, NO desplegado. No nueva inferencia ni render
atribuido a la skill; la revisión de rótulos corresponde al trabajo anterior.
Fase de diez segundos complejos y editor autónomo siguen abiertas.
