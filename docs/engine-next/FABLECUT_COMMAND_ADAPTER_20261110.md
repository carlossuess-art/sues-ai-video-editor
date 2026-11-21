# FableCut · adaptador de órdenes por lotes · 10/11/2026

Estado: desarrollo privado en PR27; no desplegado. Basado en HEAD 4127e43 y FableCut 1.18.0. Reutiliza el contrato sues-master-story/v1 y native project-ops; no sustituye el dispatcher existente ni el ledger de aprobación.

## Uso y límites
- applyCommandBatch(project, {baseRevision,baseFingerprint,commands}, {native,resolveAsset}): máximo 100 órdenes, identificador único, revisión y huella exactas, tiempos alineados a fps, pista y recurso verificados, sin force. Simula sobre copia, valida por operación, devuelve proyecto, patchOps, receipts, assets y snapshot undo. Error con operationId; lote inválido no modifica entrada. No se escribe por sí solo.
- prepareStoryBatch(story,{registry,authorize,project,bindings}): inspección canónica, aprobación externa, vínculo de revisión y dependencias. Solo zoom-native de clip completo y sfx-one-shot con recurso licenciado y duración exacta tienen mapping. Las otras operaciones permanecen en el story con motivo de bloqueo; no hay sustitución ni ejecución parcial.
- dispatchCommandBatch: autorización técnica externa, audit, stageAssets confiable, revisión/fingerprint, una llamada MCP fablecut_patch_project, lectura posterior exacta. Sin integración del ledger HTTP existente ni aprobación creativa real. Fallo de verificación: no reintentar automáticamente.
- undoCommandBatch: snapshot reversible validado por fingerprint; restaura copia con nueva revisión. No ejecuta rollback remoto MCP.
- projectAudioCatalog y enrichCatalog/searchResources: candidatos por nombres, sinónimos, categoría, duración indexada, presencia física y compatibilidad. SHA y ffprobe al resolver. Índices DAEDAL SFX/VFX existentes; intensidad, emoción semántica y derechos no comprobados permanecen desconocidos. Archivos locales de proyecto se buscan en raíz confiable separada, sin seguir enlaces fuera de ella. No exponer rutas de activos privados.

## Catálogo de órdenes
Todas las órdenes requieren id y action; pista explícita en nuevas capas; assetId resuelto en catálogo confiable; expectedSha256 obligatorio en mapping canónico licenciado. Tiempos en segundos alineados con fps. F = exportación nativa real de QA; M = MCP real con readback; P = patch nativo sobre proyecto en pruebas; I = implementada sin prueba dedicada; B = bloqueada. No equivale a aprobación audiovisual.

| Nombre reconocible | Identificador | Parámetros | Motor / estado y evidencia |
|---|---|---|---|
| SFX / posición temporal | add_sfx | assetId,start,duration,track,volume; sourceIn opcional | FableCut F: riser 0.8 s y clon V26 |
| Música | add_music | iguales a SFX | FableCut P: test música + duck |
| B-roll vídeo | add_broll | assetId,start,duration,track; sourceIn,x,y,scale,opacity,fit opcionales | FableCut P: composición simple; detrás sujeto B sin máscara probada |
| Imagen | add_image | assetId,start,duration,track; x,y,scale,opacity,fit | FableCut I |
| SVG | add_svg | iguales a imagen | FableCut I: formato y render individual pendientes |
| Flash, light leak, barrido | add_vfx | assetId,start,duration,track; sourceIn,x,y,scale,opacity,fit,blend | FableCut F: flash dorado Screen; otras variantes requieren recurso exacto y QA |
| Posición, escala, opacidad | set_transform | clipId y al menos un x,y,scale,opacity | FableCut P |
| Zoom in/out, shake, animación | animate | clipId,channel,keys[{t,v,ease?}] | FableCut F para scale; shake/otros canales requieren QA específico |
| Volumen | set_volume | clipId,volume [0,1] | FableCut F y M: clon V26 rev124→125, 0.42 |
| Ducking | duck | clipId,start,duration,amount dB,attack,release | FableCut P: curva nativa; escucha pendiente |
| Fade, transición de entrada/salida | transition | clipId,side,type,duration | FableCut F: fade overlay; P: fade audio; transición entre clips específica y otras variantes sin export individual |
| Título | add_title | start,duration,track,text,font,fontSize,color; x,y | FableCut I; fuente/legibilidad por verificar |
| Mover | move | clipId,start | FableCut P |
| Corte simple | split | clipId,at | FableCut P; preserva origen, rechaza clips complejos/ligados |
| Acortar | trim | clipId,duration | FableCut P; no extensión ni ripple |
| Sustituir | replace | clipId,assetId,sourceIn opcional | FableCut P: mismo tipo y rango; sin clips complejos |
| Eliminar | remove | clipId | FableCut P: solo clip independiente creado por adaptador |
| Deshacer | undoCommandBatch | current,undo snapshot | P: recuperación local, conflicto rechazado |
| Subtítulos palabra a palabra | pendiente | texto, palabras, tiempos, layout | Motor/capas existentes requieren mapping y QA |
| Motion graphics | pendiente | plantilla, capas y parámetros | Remotion/HyperFrames existentes; no mapping de batch |
| Sujeto delante/detrás | pendiente | matte, z-order, geometría, sincronía | FableCut máscara/matte existentes; integración exacta pendiente |
| Ancla semántica en voz | pendiente | speechAnchor y alineación verificable | Master Director + transcripción; no inferencia automática |

## Evidencia
- QA 002: tres segundos editables, 4 clips, 5 órdenes (riser, flash, zoom, volumen, fade), cinco negativos, undo; 4 medios HTTP Range 206. Export nativo en navegador x_a6jbpwto, 62.513 s, 1080x1920 H264 30 fps, 30 frames distintos, 1.000 s de vídeo; AAC 48 kHz estéreo 0.981 s, pico -2.8 dBFS, media -20.4 dBFS, errores JS 0. No escucha/QA artística ni prueba de 1080p de origen: usa proxy preexistente. Diferencia de duración A/V 19 ms. SHA256 82a305aef4419a0c211250742f9a1da1c9b7e0f8aabbe40b6f154c0b1f2367f5.
- QA 003: V26 rev123 169 clips/76 medios → rev124 170/77, originales intactos; MCP real rev125 volumen 0.42, denegación de autorización y CAS obsoleto rechazados. No export de V26 completo.
- 28/28 pruebas dirigidas Node (batch, dispatcher anterior y story), FABLECUT_NATIVE_OPS apunta a project-ops.js real. Evidencias privadas en automation-v1/test-project-002 y test-project-003; no subir medios al repo público.
- Teclado real V18C localizado en proyecto anterior, 8.067 s, SHA validado; candidato local, derechos pendientes.
- QA aislado sin borrar fuentes, sin créditos ni cambios de producción. Disco 94%, 3.0 GB libres. Trabajo paralelo B05 no tocado.

## Próximo
Vincular revisión/decisionId/fingerprint de MasterDirectorProjectStore y ledger existente al dispatcher por lotes; resolver recursos con derechos comprobados y staging seguro; probar plan canónico completo en clon, ampliar mappings sin pérdida, verificar subtítulos/matte/motion y transición entre clips, exportar y comparar V29 mediante reconciliación existente. No publicar.
