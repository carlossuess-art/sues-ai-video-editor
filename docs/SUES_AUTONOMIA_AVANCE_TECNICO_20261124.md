# SUES AI VIDEO EDITOR · AVANCE TÉCNICO PRODUCCIÓN AUTÓNOMA · 24/11/2026

**Estado a la última prueba:** skills privadas actualizadas y dos módulos auxiliares de Master Director incorporados a la rama `feat/speech-linked-motion-grammar-20261115`. **No desplegados en FableCut móvil, no ejecutan lotes y NO implican producción autónoma completa**. La fuente normativa sigue siendo `docs/SUES_PROTOCOLO_MAESTRO_PRODUCCION_AUTONOMA_20261124.md`.

## 1. Skills personales ACTUALIZADAS y lectura posterior comprobada
- Plugin original SUES AI Film Director `plugins_6ae06835c8c881918d5bbe8294e16dfb`: versión **1.7.4**; añadido `skills/sues-produccion-autonoma/SKILL.md` (5.044 caracteres). Conservada intacta la skill central `sues-ai-film-director` y sus referencias D01–D77, audio, QA, etc. Se aclara autonomía para operaciones rutinarias, siempre con plan A/V por capas, sin inventar aprobación y sin publicar.
- Plugin original SUES Continuidad `plugins_6aeafb8589948191af0ea351eecfeedf`: versión **1.0.2**; añadido `skills/sues-video-continuidad-autonoma/SKILL.md`. Recuperación obligatoria de protocolo, proyecto, revisión y evidencias entre chats. Conservada skill original.
- Plugin original HyperFrames `plugins_6af4f06ec75481919461bc205921eb80`: versión **1.0.1**; añadido `skills/sues-hyperframes-preproduccion-cinematografica/SKILL.md`. Diferencia Drive/VPS/project.media/QA y exigen máscaras/3D verificables. Conservadas las cinco skills originales.
- Publicaciones privadas, todas con `plugin_url` y nueva `current_release_id` devueltos por Plugin Creator. Se realizó **readback de cada release**: versiones correctas, skill nueva presente y skill original preservada. **No se ha probado aún la activación conjunta automática en chat nuevo**. Este hecho debe probarse en proyecto ChatGPT al cerrar la integración; sin una instrucción de activación de proyecto no se puede garantizar que se invoquen todas las skills complementarias.

## 2. Código en rama de desarrollo, NO integrado a la ruta de ejecución
- `src/engine-next/fablecut-autonomous-batch-plan.js`: función pura `planAutonomousBatches` que valida IDs/dependencias, coverage 1:1, orden topológico y divide un plan de 1–1500 operaciones en lotes de `<=100` sin salirse del contrato. Añade `bindBatchForCAS` (lee revisión y huella actual, **NO autoriza**) y `verifyBatchReadback` (exige cobertura exacta de recibos y persistencia). Resultado explícito `PLAN_ONLY_NOT_AUTHORIZED`. No modifica el servicio móvil, no persiste ledger, no ejecuta comandos ni permite saltar consentimiento.
- `src/master-director-autonomous-preflight.js`: función pura `reviewAutonomousPreproduction` que exige historia que pase por inspector existente, proyecto/revisión/sha vigentes, Film Director cargado con referencias, análisis A/V auténtico, mapeo humano-técnico 1:1, palabras seleccionadas, medios efectivamente registrados/decodificados en FableCut, prueba visual real de máscaras con Carlos visible, dos comprobaciones previas y operaciones admitidas. Resultado `PREPRODUCTION_READY_NOT_APPROVED` como máximo, `canExecute:false`; nunca autoaprueba ni renderiza.
- Pruebas nuevas `tests/fablecut-autonomous-batch-plan.test.js` y `tests/master-director-autonomous-preflight.test.js`: **12/12 PASS** ejecutadas en copia aislada del código `/opt/sues-video-setup/q02-native-annex-20261119.j3YNOa`, Node 22.23.3.
- Regresión compatible con `tests/master-director-story.test.js`: **27/27 PASS** (10 nuevas + 15 existentes), salida `/tmp/sues-autonomy-valid-subset-20261124.log`. Una ejecución ampliada con `tests/fablecut-native-supervisor.test.js` dio **25/26 (prueba previa a los dos casos nuevos; la regresión dirigida vigente es 27/27)** porque ese archivo existente en la copia aislada importa `/opt/sues-video-setup/src/engine-next/fablecut-native-supervisor.js`, ruta ausente en ese stage: **problema de fixture/ruta del entorno de ensayo, NO fallo de los nuevos casos**. No marcar toda la suite como PASS.
- No se ha realizado aún test de integración de 400/1000 operaciones contra un proyecto FableCut real con autorización delegada duradera, recibos CAS por lote y recuperación tras crash. Simular 1000 operaciones en planificador NO demuestra ejecución 1000.

## 3. Proyecto rechazado: inalterado
- `p_ac513f2e6a`, revisión base **396**, 177 clips (A-roll y selección de 150 palabras), 10 medios; no se han enviado parches al endpoint móvil ni iniciado reexportación del Reel durante este avance.
- Servicio `sues-fablecut-v11-preview.service` activo, solo lectura para comprobar revisión 396. El error móvil `presented frame timeout` sigue sin acreditarse corregido. Sin cambios de producción, WAC, DNS, Reels publicados o Q03.

## 4. Siguientes tareas exactas
1. Enlazar la función de preproducción al flujo real **host-side** de Master Director (con evidencias leídas del servidor, no del JSON del cliente) y cubrir tests de ruta/servicio; no desplegar antes de asegurar cero falsos PASS.
2. Enlazar el planificador al **ledger existente** de autorización delegada por proyecto, story sha, período/alcance, caducidad y gasto cero, con CAS/readback por lote; mantener `maxCommands=100`. Añadir replay/crash-resume/idempotencia/persistencia y prueba de >400 ops en copia privada QA, sin tocar baseline 396.
3. Reconciliar el límite de 60.000 bytes del story store con el plan completo, sin truncar ni convertir a operaciones aisladas. Validador de recursos debe exigir alta y decodificación reales en project.media y pruebas de pelo/manos/cara.
4. Reproducir y arreglar `presented frame timeout` de exportación del móvil sobre QA aislada; comprobar preview Pixel, imagen A-roll, audio y máscaras. Render nativo y doble auditoría artística posteriores.
5. Actualizar instrucciones de **ChatGPT Project SUES AI EDITOR** con la activación mínima de Film Director + Producción Autónoma + Continuidad + HyperFrames. No se ha modificado automáticamente la configuración de ese Project; hacerlo una vez en la interfaz o por acción autorizada.
6. Tras pruebas, integrar y desplegar mediante proceso reversible con checkpoint y validación de Carlos. **No publicar** ningún Reel por automatismo.

## 5. Enlaces de plugins actualizados
- Film Director: https://chatgpt.com/plugins/plugins_6ae06835c8c881918d5bbe8294e16dfb
- Continuidad: https://chatgpt.com/plugins/plugins_6aeafb8589948191af0ea351eecfeedf
- HyperFrames: https://chatgpt.com/plugins/plugins_6af4f06ec75481919461bc205921eb80

## 6. Endurecimiento del validador (mismo 24/11/2026)
Se añadió comparación efectiva de `fablecutMediaId` contra `project.media`; no basta declarar `registeredInProject:true`. Se añadió cobertura obligatoria con evidencia de máscara en entrada, punto medio y salida del intervalo, rechazando tres capturas repetidas del mismo instante. Dos tests adicionales (12/12 nuevos), regresión conjunta 27/27 PASS en VPS aislado. Esto sigue sin ser un route handler desplegado ni auditoría artística del Reel.
