# SUES MASTER DIRECTOR · Contrato de entrega de la skill

Fecha: 2026-11-05. Fuente revisada: rama feat/master-director-story-orchestration-20261104, commit 0c1ded0cc49f0027d81504c705657764586c40d3. Las 20 reglas aprobadas son requisitos de producto, no prueba de implementación. Este documento fija el objetivo de integración; **no afirma que la pantalla actual lo acepte ni que el sistema ya ejecute todo lo descrito**. No modificar la skill para emitir extensiones como si estuvieran operativas: preservar la información y bloquear la ejecución hasta conectar y validar.

## 1. Una entrada común, dos procedencias

ChatGPT + aprobación de Carlos y futuro generador IA alimentan el mismo cerebro, contrato, motores y supervisor. La procedencia nunca acredita por sí misma una aprobación. Emitir un objeto JSON UTF-8 `sues-master-story/v1`; no emitir Markdown dentro del JSON, código ejecutable, URLs como comandos, datos secretos, ni reglas o aprobaciones fingidas. El servidor incorpora de su propio registro las reglas, masters, permisos, capacidades, evidencias, proyecto y decisiones autenticadas. El proveedor IA futuro deberá producir exactamente el mismo contrato y pasar la misma revisión; no hay un segundo cerebro.

**Estado:** `sues-master-story/v1` y su compilador existen; pegarlo en la pantalla de `sues-edit-plan/v1` no funciona. Falta importación maestra, preservación integral y conexión de ambos caminos. La autorización real se registra fuera del JSON y queda vinculada al fingerprint efectivo.

## 2. Forma exacta actualmente inspeccionada

Raíz obligatoria: `schema`, `sourceSha256`, `timeline`, `visual`, `narrative`, `operations`. `resources` es obligatorio si hay referencias y puede ser `[]` sin ellas. IDs: hasta 80 caracteres, comienzan con alfanumérico y admiten alfanuméricos, punto, guion, guion bajo y dos puntos. SHA-256: 64 hexadecimales minúsculos.

- `schema`: literal `sues-master-story/v1`.
- `sourceSha256`: hash real del original editable facilitado por el proyecto.
- `timeline`: `fingerprint` real de la revisión, `timeSpace:"edit-timeline"`, `fps:30`, `duration` en segundos, >0 y ≤3600. Coincidir con el registro.
- `visual`: `mode` `brand-sues` o `reference-exact`; este último exige `referenceId` autorizado para el ámbito real.
- `narrative`: `centralMessage`, `intendedExperience` (ambos al menos cinco caracteres útiles), `scenes`; opcionales `arc`, `motifs`. El arco puede tener exigencias adicionales según política de servidor: no inventar evidencia, fases o marcas de voz. Escenas: `id,start,end,purpose`; pueden incluir `title,phase`; deben cubrir el montaje desde 0 hasta duración, sin huecos ni solapes. Máximo 300. Motivo: `id,setupSceneId,payoffSceneId,meaning`; setup precede payoff y debe haber operaciones en ambas escenas.
- `resources[]`: ID lógico único `id`; `source:"library"` requiere `assetId,expectedSha256`; `source:"generate"` requiere `kind` de `image,video,motion,sfx,music,graphic` y `creationBrief`; opcional `narrativePurpose`. Recurso generado no queda disponible hasta comprobarlo en biblioteca y verificar derechos. Ubicación, URL de vista previa, versión, licencia y hash provienen del inventario verificado, no de afirmaciones del plan.
- `operations[]`: entre 1 y 1500. Cada operación exige `id,sceneId,start,end,track,renderer,effect,reason,parameters,dependsOn,requiredQA`. Opcionales `resourceRef,motifId,speechAnchor`. Los tiempos deben quedar dentro de la escena; motivo de al menos cinco caracteres. Dependencias: IDs únicos existentes, sin ciclos. `speechAnchor`: `{wordId,offsetFrames}`, palabra verificada, desplazamiento entero ±90 fotogramas y ancla dentro del evento con tolerancia del validador.
- Pistas: `camera,subject,broll,graphics,captions,music,sfx,voice,transition`. Motor y efecto deben estar en las capacidades confiables del servidor: no basta con declarar un nombre. En la ruta Remotion examinada, `renderer:"remotion"`; la ruta nativa usa `native`. Pistas broll, music y sfx requieren `resourceRef`.
- QA posibles: `rendered-frame,motion-playback,audio-playback,time-sync,narrative-review`. Requisitos mínimos: broll/graphics = frame, movimiento y narrativa; sfx/music/voice = audio y sincronía; camera = frame y sincronía; subject = frame y movimiento; captions = frame y sincronía; transition = frame y movimiento. Estos requisitos son solicitudes, no evidencias de QA.

## 3. Espacios, fotogramas y geometría

Segundos en `edit-timeline`: montaje vigente, no reloj del archivo original. Intervalos de capas [entrada, salida); el grafo convierte `startFrame=round(start*30)`, `endFrame=round(end*30)`; salida exclusiva, duración = diferencia de frames. Indicar tiempos como múltiplos de 1/30 para evitar redondeos. Un cambio de cortes invalida fingerprint, aprobación y anclajes; remapear con mapa verificado antes de proseguir. Los frames de origen de un recurso son independientes de los frames de salida.

Geometría Remotion: `parameters.visual.rect:{x,y,width,height}`, píxeles del lienzo verificado del proyecto, origen superior izquierdo; anchura y altura positivas y rectángulo contenido en el lienzo. `zIndex` entero 0–500 (mayor delante), `opacity` 0–1. Capas simultáneas de la misma escena no comparten zIndex. La geometría nativa puede ser automática: no prometer posición editable exacta por ello.

## 4. Parámetros exactos actualmente compilables para Remotion

El compilador es estricto: rechaza claves extra incluso si el validador narrativo las acepta. La presencia de un efecto en esta tabla no garantiza que todo el flujo de servidor esté conectado ni que el resultado haya pasado QA.

| Pista / efecto | parameters exactos | Condiciones adicionales |
|---|---|---|
| graphics o captions / `text` | `{text,visual}` | texto 1–500 caracteres; fuente verificada `family:weight` y hash. |
| broll o graphics / `image-exact` | `{fit:"fill",visual}` | recurso imagen verificado; ID resuelto igual al SHA y derechos comerciales. |
| broll o graphics / `video-exact` | `{fit:"fill",visual,sourceInFrame,muted:true}` | vídeo verificado; sourceInFrame entero ≥0 y tramo completo dentro de duración del clip. Audio del B-roll no se usa en esta ruta. |
| music o sfx / `audio-clip-exact` | `{gain,sourceInFrame}` | gain 0–2; fuente audio/SFX verificada; entrada entera y segmento dentro del recurso. |

`visual` admite únicamente `rect,zIndex,opacity,keyframes,mask`, además de `typography` para texto. `typography:{family,sizePx,weight,color}`: tamaño >0 ≤500 px, peso 100–1000, color `#RRGGBB` o `#RRGGBBAA`. `keyframes` es una lista obligatoria para Remotion, incluso vacía: máximo 120, `atFrame` entero relativo al comienzo de la operación, creciente, 0 hasta la duración; claves permitidas `atFrame,easing,x,y,opacity,scale,rotation`. Opacidad 0–1, escala >0–10; x/y y rotación finitos. Curvas ejecutables: `linear,ease-in,ease-out,ease-in-out`. El grafo admite `spring`, pero Remotion lo rechaza: no presentarlo como ejecutable. `mask:{proofId,mode:"alpha-keep"}` exige prueba verificada ligada al hash de fuente y a todo el intervalo y recurso de máscara acreditado. Esto no acredita generación ni tracking de máscaras dinámicas.

En el editor antiguo `sues-edit-plan/v1` hay acciones específicas nativas (por ejemplo caption, zoom, broll, sfx y ELEMENTS) con límites propios; no son equivalentes generales a este contrato. Su importador admite solo schema, sourceSha256, timelineFingerprint y operations, hasta 30.000 caracteres y 200 operaciones y puede rechazar parámetros adicionales. Nunca convertir un plan maestro completo a ese formato si se pierden campos.

## 5. Detalle requerido para capacidades pendientes

Para sombras, glow, materiales, desenfoque localizado, trazos, texturas, jerarquía avanzada, seguimiento, máscaras dinámicas, recortes, trayectorias, velocidades, interpolación arbitraria, fundidos o mezcla/ducking por curvas, el compilador anterior **no ofrece un modelo ejecutable completo**. Debe desarrollarse una extensión versionada y un importador sin pérdida antes de prometer un formato definitivo para esos detalles. Mientras tanto conservar la instrucción original íntegra como documento asociado, marcar cada operación afectada como no soportada e impedir la ejecución completa; no añadir claves al `visual` estricto simulando compatibilidad. Nunca sustituir el acabado o eliminar el efecto silenciosamente.

La especificación a desarrollar deberá concretar, por tipo, unidades, valores, espacio de coordenadas, límites, recursos, compositing y curva exacta, y definir cómo cada motor los interpreta. Música, voz, SFX y anclas de palabra deberán incluir fuente, cortes de origen, volumen y sincronía verificados; la escucha real y la preservación de fonemas siguen pendientes. Cortes de silencio >0,7 s solo con evidencia, sin dañar palabras o intención, y protegiendo inicio/cierre; recalcular tiempos después. No inferir licencias ni inventar URLs.

## 6. Validación y tratamiento sin pérdida

1. Guardar el JSON original íntegro y una huella; comprobar tamaño, JSON, versión, IDs, límites, tiempos, referencias, ciclos y cobertura narrativa.
2. Contrastar original, fingerprint temporal, recursos y derechos con registros confiables del servidor. Los enlaces sirven para revisión, no autorizan lectura arbitraria ni acreditan licencia.
3. Compilar a `sues-master-director/v1`, adjuntar reglas resueltas por servidor y producir fingerprint de aprobación. Después formar `sues-layer-graph/v1` y compilar para motores solo donde exista equivalencia exacta. La función actual copia solo campos concretos: **no preserva por sí sola todos los metadatos ni extensiones**.
4. Mantener un manifiesto bidireccional por operación, recurso y dependencia: original, normalizado, motor, parámetros, transformaciones y estado. Toda clave no representada debe conservarse y producir bloqueo explícito; ninguna operación puede desaparecer.
5. Revisar el plan y recursos en interfaz; aprobación/autonomía autenticada vinculada al fingerprint, nunca al texto enviado. Cualquier cambio sustancial invalida aprobación y QA. Si hay recurso ausente, derechos sin verificar, capacidad faltante o máscara sin evidencia, informar y bloquear el tramo/plan afectado. Ofrecer versión parcial solo si Carlos la elige expresamente y etiquetarla provisional; no publicar como completa.
6. Persistir original y versiones editables, fuente, grafo, audios, máscaras y conexiones; no confundir MP4 aplanado con capas editables. Un supervisor independiente debe contrastar evidencias reales de imagen, movimiento, audio, sincronía y narrativa en dos pasadas limpias antes del cierre técnico. Aceptación creativa y publicación son decisiones separadas.

**Estado de implementación:** revisión narrativa y gate existen; revisión autenticada, versiones y tramos nativos y preview Remotion existen parcialmente. Grafo de capas estructurado existe pero declara `editableInWebEditor:false`. El handoff mixto se ha diseñado y probado como POC, pero su worker automático no está conectado. Falta importación maestra fiel, persistencia integral de extensiones, integración mixta efectiva, máscaras dinámicas reales, edición integral y supervisor audiovisual independiente conectado. No hay garantía actual de importación sin pérdida de un plan completo.

## 7. Ejemplo completo mínimo del contrato existente

Ejemplo ilustrativo con hashes ficticios: no son recursos ni aprobación reales. El servidor debe aportar fuente, masters, capacidades, fuente tipográfica y política narrativa verificadas; puede bloquearlo hasta completar evidencias.

```json
{
  "schema": "sues-master-story/v1",
  "sourceSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "timeline": {"fingerprint":"timeline-001","timeSpace":"edit-timeline","fps":30,"duration":2},
  "visual": {"mode":"brand-sues"},
  "narrative": {
    "centralMessage":"Escuchar antes de reaccionar",
    "intendedExperience":"Crear un momento de reflexión",
    "scenes":[{"id":"scene-1","start":0,"end":2,"purpose":"Presentar la idea principal"}],
    "motifs":[]
  },
  "resources": [],
  "operations":[{
    "id":"title-1","sceneId":"scene-1","start":0,"end":2,
    "track":"graphics","renderer":"remotion","effect":"text",
    "reason":"Subrayar la idea principal",
    "parameters":{"text":"ESCUCHA","visual":{
      "rect":{"x":120,"y":600,"width":840,"height":220},
      "zIndex":10,"opacity":1,
      "typography":{"family":"Inter","sizePx":90,"weight":700,"color":"#FFFFFF"},
      "keyframes":[{"atFrame":0,"opacity":0,"easing":"ease-out"},{"atFrame":10,"opacity":1,"easing":"linear"}]
    }},
    "dependsOn":[],
    "requiredQA":["rendered-frame","motion-playback","narrative-review"]
  }]
}
```

Lienzo supuesto 1080×1920; no introducirlo como hecho si el proyecto no lo acredita. El ejemplo describe 60 frames de salida [0,60), no contiene música ni B-roll. Es mínimo, no demuestra la cobertura de las 20 reglas ni representa la futura extensión completa.

## 8. Correspondencia con las reglas aprobadas

| Regla | Traducción y situación |
|---|---|
| 01 | Evidencia de vídeo, voz y discurso: requiere análisis real; narrativa por sí sola no lo demuestra. |
| 02 | Escenas, arco y motivos: existentes; coherencia audiovisual global necesita supervisión real. |
| 03 | `reason` obligatorio; calidad semántica no garantizada. |
| 04 | Grafo y zIndex existentes; oclusión y máscaras dinámicas completas pendientes. |
| 05 | Masters y autoridad desde registro confiable; verificar identidad y derechos. |
| 06 | `visual.mode` y autorización de referencia; sin alterar masters globales. |
| 07 | Recursos biblioteca/generación y solicitudes existentes; búsqueda y comparación real aún por conectar. |
| 08 | IDs/hash en contrato; ubicación, licencias y enlaces desde inventario confiable; interfaz completa pendiente. |
| 09 | Tiempos y geometría parcial; acabados, sincronía y preservación integral pendientes. |
| 10 | Anclas verificadas existentes; cortes seguros y remapeo integral pendientes. |
| 11 | Texto/imagen/vídeo básicos; gráficos artísticos y materiales requieren desarrollo. |
| 12 | Visibilidad nativa parcial; equivalencia semántica y negaciones requieren control. |
| 13 | Audio exacto básico; mezcla, viaje sonoro y escucha independientes pendientes. |
| 14 | Perfiles y ELEMENTS parciales; densidad adecuada no se garantiza por nombre. |
| 15 | Gate bloquea incompatibilidades; catálogo claro y opciones sin pérdida pendientes. |
| 16 | Versiones y grafo parciales; editabilidad total y reversible pendiente. |
| 17 | Contrato de evidencias QA existente; supervisor independiente audiovisual conectado pendiente. |
| 18 | Invalidación y bloqueos parciales; reparación y entrega provisional explícita pendientes. |
| 19 | Protección y rollback antes de producción; pruebas y renders aplazados por Carlos. |
| 20 | Revisión/autonomía parciales; dos entradas por un mismo flujo, segunda entrada aún pendiente. |

Fuentes: `src/external-edit-plan.js`, `master-director-story.js`, `master-director-orchestration.js`, `master-director-gate.js`, `master-director-layer-graph.js`, `master-director-remotion-compiler.js`, `master-director-workflow.js` y reglas aprobadas. No se ejecutaron pruebas ni renders en esta fase.
