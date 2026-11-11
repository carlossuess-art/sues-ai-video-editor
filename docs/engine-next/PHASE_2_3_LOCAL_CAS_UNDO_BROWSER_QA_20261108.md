# Fase 2.3 · Deshacer una edición con CAS en estudio compartido · 08/11/2026

**Estatus: QA privada real superada, disponible solo en PR #27, NO desplegado.**

## Objetivo
Sobre el editor staging que ya ofrece selección, posición/escala de video e imagen, timing de texto y tamaño de fuente, añadir una reversión segura de la **última edición individual de la misma sesión**. No restaurar un snapshot entero de FableCut ni destruir la edición de otro usuario o del Master Director.

## Implementación
- Nuevo `web/engine-next-undo.js`: define el esquema `sues-engine-next-local-undo/v1`, capta la operación inversa de un solo clip y guarda ID de proyecto FableCut, revisión anterior, nueva revisión guardada y los valores originales. Tipos admitidos: `transform`, `timing` (cuadros exactos a 30 fps) y `title`. Rechaza origen inverificable, clip bloqueado y valores fuera de contrato. `request()` exige que el proyecto activo y su revisión sigan coincidiendo con el resultado de aquella edición. Solo invoca los tres endpoints autenticados existentes: `/api/engine-next/clip-transform`, `/api/engine-next/clip-timing`, `/api/engine-next/title-size`.
- `web/engine-next.html/js`: panel «Deshacer último cambio» y botón que solo se habilita si está disponible el inverse local y coincide la revisión vigente. Tras deshacer, el backend crea una nueva revisión de proyecto. Si FableCut cambió por otra persona o por el Master Director, el motor CAS rechaza la modificación y no sobrescribe los valores ajenos; el panel invalida la reversión.
- `src/editor-server.js`: solo expone `/engine-next-undo.js` como recurso estático (sin nueva ruta de escritura), mantenido íntegro de 1176 líneas y verificado `node --check`.
- `tests/engine-next/studio-undo.test.js`: tres pruebas de inversas, revisión compartida y validación de opciones; actualización `tests/editor-server.test.js` para servir el nuevo módulo.

## Browser QA e2e en VPS, escenario simulado y limitado
Se ejecutó Chromium local en staging SUES real, con sesión autenticada SUES real y FableCut **simulado en loopback** (nunca la instancia persistente). Se verificaron:
1. Inicio del proyecto a revisión 5, gráfico editable pero desactivado, vídeo Carlos bloqueado. Modificación gráfica de x=180 a x=390, guardada como **revisión 6** en backend NLE simulado.
2. El botón de deshacer se activó, envió comando inverso con `expectedRevision:6`, guardó **revisión 7**, restauró x=180.
3. Nueva edición x=410 en revisión 8, seguida de una mutación externa que simuló la edición del Master Director a **revisión 9, x=510**.
4. Intento de deshacer con revisión obsoleta: operación **rechazada por CAS**, se conserva revisión 9 y **x=510** sin pérdidas.
5. El vídeo fuente siguió bloqueado, la capa de prueba siguió desactivada, ningún error de navegador.

Log y fuente exacta de smoke QA conservados privadamente en VPS `/srv/sues-fablecut-next/data/qa/studio-undo-cas-browser-proof-20261108/`, con hashes e informe de limitaciones. **No demuestra por sí solo la integración global con FableCut persistente real; está probado con el servidor SUES y el motor simulado.**

## Verificación
Se ejecutó la batería completa desde la rama sincronizada: **79/79 pruebas dirigidas PASS**, cero errores. Commit de código en GitHub `31b5b820774d379bd1e6c6ef72576cf2b3947254`, antes de redactar esta documentación. Git worktree limpio, editor público `https://editor.suesholistics.com/` HTTP 200, motor privado FableCut `127.0.0.1:7780` HTTP 200, proyecto persistente revisión 53 con seis clips y B02 desactivada. 16 GB de disco libres. No merge, deploy ni cambio a proyecto de usuario.

## Fases/etapas
- Fase 1 sigue 90 % estimado. Existe backup de solo lectura y recuperación aislada previos; falta cerrar gestión de recuperación/seguridad completa.
- Fase 2 sigue 45 % estimado por prudencia; etapa 2.3 progresa en **edición CAS + deshacer inverso de sesión + historial de versiones solo lectura**, pero falta la funcionalidad NLE completa con mismo usuario/agente, Undo/Redo global y pruebas de persistencia sobre copia FableCut real.
- Fases 3/4/5/6/7 conservan últimas estimaciones 80/60/65/40/30.

## Próximo paso
Integrar NLE completo y probar con un **clon real de FableCut** las mismas modificaciones desde SUES y una llamada de agente, con snapshot de recuperación antes, persistencia tras recarga, modificación de posición y timing, undo/redo de sesión y resolución segura de conflicto. El frontend definitivo debe reutilizar FableCut, no montar un segundo editor paralelo. No subir el porcentaje sin evidencia de esa integración.
