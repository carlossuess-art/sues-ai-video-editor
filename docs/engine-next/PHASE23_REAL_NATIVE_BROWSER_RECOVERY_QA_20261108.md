# SUES AI VIDEO EDITOR · Fase 2.3 · Prueba real de edición, deshacer, agente y recuperación nativa · 08/11/2026

**Estado: ingeniería verificada en copia REAL AISLADA de FableCut, sin merge ni despliegue. La fase 2.3 sigue incompleta.**

## Escenario y aislamiento

Se copió el archivo real `/srv/sues-fablecut-next/data/project.json` (revisión 53, 6 clips) y la estructura de proyectos/media a `/srv/sues-fablecut-next/qa-phase23-native-undo-20261108/data/` (copia privada, luego eliminada). Se levantó un servidor **FableCut auténtico** con el mismo código de producción pero datos aislados en `127.0.0.1:7781`. La UI SUES de la rama PR27 se sirvió a Chromium desde `createEditorServer`, con su propia sesión autenticada, pero conectada exclusivamente al FableCut de QA mediante `SUES_ENGINE_NEXT_FABLECUT_URL`. El original `127.0.0.1:7780` permaneció en revisión **53** durante toda la prueba.

## Resultados confirmados contra FableCut real (no simulado)
1. **Native CAS básico:** desde la API `FableCutClient`, el recurso infantil V2 (desactivado) x=300 se cambió a x=325 en revisión **54** y se deshizo a x=300 en **55**, confirmando persistencia tras GET; intento con revisión obsoleta fue rechazado.
2. **SUES navegador + FableCut REAL:** Chromium inició sesión en la UI SUES, seleccionó el clip infantil, lo movió a x=327 (revisión **56**) y pulsó «Deshacer», que creó **57** y recuperó su valor. Cero errores del navegador.
3. **SUES navegador + agente sobre MISMO FableCut REAL:** prueba con inicialización dinámica de revisión: edición por la UI en rev **60** y deshacer **61**, segunda edición UI **62**, escritura concurrente DIRECTA a FableCut por el controlador `FableCutClient` en rev **63** (x=361). El intento de deshacer desde la UI, basado en una revisión antigua, fue rechazado; rev63/x361 permanecen. Es una edición agente simulada mediante el **controlador real**, no una ejecución autónoma del SUES Master Director.
4. **Título nativo:** desde la UI se modificó el tamaño del título existente en revisión **64** y se revirtió en revisión **65**, recuperando su fuente **84 px**. Cero errores del navegador. Se conservan 6 clips y el estado desactivado de B02.
5. **Retiming nativo con CAS:** se detectó que el título original existente tiene `start=2.28 s`, `duration=0.85 s`, que **no son múltiplos exactos de 1/30 s**. El antiguo deshacer basado en `Math.round(start*30)` habría alterado silenciosamente el tiempo original. El código ahora **rechaza reversión inexacta** y avisa al usuario. Directamente contra el FableCut real aislado se probó retiming `(70,27)` → `(72,30)` → `(70,27)` fotogramas en revisiones **66, 67 y 68**, conservando el estado de los clips y rechazando una revisión antigua. Esta prueba de timing fue de **API real**, no del navegador (la prueba ampliada de Chromium para timing quedó bloqueada).
6. **Recuperación F1**: se obtuvo backup JSON nativo desde `GET /api/projects/backup?id=p_3c0550a1dd`, formato FableCut 1, 12 versiones, proyecto en revisión 68. En **CLON SOLAMENTE**, `POST /api/versions` con `action=restore` y versión 11 volvió al estado de revisión 53 con nuevo contador **69** y guardó el estado previo como v14. Restaurar v14 recuperó el trabajo de la revisión 68 con contador **70** y guardó otra versión de seguridad v15. Es recuperación nativa reversible confirmada y no equivale a backup/DR de producción completado.

## Nueva protección contra pérdida de precisión
Archivos modificados en PR #27:
- `web/engine-next-undo.js`: antes de habilitar deshacer de timing exige `Math.abs(start-Math.round(start*30)/30) ≤ 0.00001` y equivalente para duración; si el origen es fraccionario lanza error verificable.
- `web/engine-next.js`: verifica si la inversa es segura **antes de enviar la edición**. Si no puede deshacer exactamente, permite guardar pero informa claramente que la reversión de esa edición no está disponible. Muestra advertencia para títulos antiguos con tiempos fuera de rejilla de 30 fps. La UI no confunde un guardado correcto con un error de captura de deshacer.
- `tests/engine-next/studio-undo.test.js`: regresión para título real start 2,28 / duration 0,85 (rechaza deshacer con redondeo) y título ajustado 70/27 cuadros (sí permite deshacer).
- **80/80 pruebas dirigidas PASS** tras sincronizar GitHub, incluyendo el nuevo test. Commit de código `a02c38a20a5cb3b382210690b43bb56b3f44fe48`. La prueba del navegador sobre la nueva advertencia fraccionaria aún no ha podido terminarse: no confundir test de módulo con prueba UI.

## Evidencias conservadas y limpieza
Evidencia privada: `/srv/sues-fablecut-next/data/qa/phase23-native-real-edit-cas-20261108/`: logs/fuentes de pruebas Chromium real, `all-80-tests.log`, copia final de proyecto QA en revisión 68, copia del proyecto tras restauración en revisión 70, backup completo nativo formato FableCut, respuestas a dos restores y `manifest.json` con SHA256 y límites de validación.
Se apagó el servicio QA 7781, se comprobó que no quedaban escuchas ni montajes y se eliminó la copia de 140 MB. Producción permaneció HTTP 200, original con 6 clips y B02 desactivado; ~16 GiB libres en disco.

## Fases y prioridades — prudencia
Fase 1 infraestructura: **90 % estimado**. Recuperación nativa confirmada en clon, pero faltan automatización, autorización y ensayo completo de backup/DR de producción.
Fase 2 editor unificado: **45 % estimado**. La etapa **2.3 avanzó considerablemente**: edición real SUES→FableCut, persistencia, deshacer de transformación y título, conflictos con agente y recuperación aislada. Todavía NO se ha demostrado flujo completo de drag/trim multipista, Undo/Redo multinivel y colaboración con Master Director autónomo.
Fases 3–7 conservan 80 %, 60 %, 65 %, 40 %, 30 %.

### Próxima puerta técnica
Revisar el editor FableCut nativo y planificar su **integración completa reutilizada dentro de SUES** bajo autenticación; comprobar arrastre/movimiento/trim en pista, importación/media, edición de clips, deshacer/rehacer sólido, continuidad de revisiones y render. No rehacer otro NLE. Mantener pruebas en clon, backup antes, documentar en GitHub + Google Drive. No desplegar sin pasar QA.
