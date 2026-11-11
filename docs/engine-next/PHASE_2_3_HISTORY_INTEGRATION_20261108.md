# SUES AI VIDEO EDITOR · Fase 2.3 · Integración de historial autenticado · 08/11/2026

**ESTADO: IMPLEMENTADO EN PR #27, 76/76 PRUEBAS DIRIGIDAS PASS, NO DESPLEGADO.**

## Qué se ha hecho

Reutilizar API de historial ya existente del FableCut local (GET /api/versions) sin exponer directamente su puerto ni permitir acciones destructivas. En SUES, se añadió:

- `src/engine-next/native-history-summary.js`: auditoría de identidad `p_...`, coincidencia con el proyecto activo, orden de versiones, revision actual y validación de metadatos; devuelve máximo ocho versiones y número total. `readOnly=true`, `canRestore=false`, sin operaciones de restauración.
- `src/editor-server.js`: endpoint `GET /api/engine-next/history`, detrás de sesión SUES, protección existente de origen y sin ruta de escritura. Hace `GET /api/project`, `GET /api/versions`, `GET /api/project`; devuelve 409 si proyecto o revisión cambian a mitad de lectura. No pasa directamente las respuestas de upstream ni expone su API.
- `web/engine-next.html/css/js`: panel visible de historial en estudio de pruebas, botón de actualización, revisión activa, ocho versiones recientes y mensaje explícito de consulta sin restauración. No muestra historial de otra revisión cargada por el navegador ni introduce HTML externo: texto mediante `textContent`.
- `tests/engine-next/native-history-summary.test.js` y cambios `tests/engine-next/studio-media-http.test.js`: rechazan historiales falsos/duplicados/no ordenados, una sesión no autenticada recibe 401, GET autenticado 200, y POST a la ruta no existe (404). El GET requiere que la versión apunte al mismo proyecto. El test con FableCut falso no toca el servidor persistente.

## Validaciones observadas
- VPS GitHub rama `feat/master-director-story-orchestration-20261104`, último commit de esta tanda `6472d6a5c53c39431863b4e7feb8276cb4a21a7d`.
- Código remoto sincronizado con GitHub y limpio después de conservar stash de seguridad previo a sincronización.
- **76 pruebas dirigidas PASS / 0 fallos**, incluyendo servidor y motor.
- El servidor `src/editor-server.js` conserva **1176 líneas**: se verificó su integridad para evitar repetición del problema de truncamiento del conector.
- La API original de versiones de FableCut local tiene proyecto activo `p_3c0550a1dd`, con snapshots ordenados (en lectura actual v11, revisión 53, y precedentes). GET únicamente; ninguna restauración iniciada.
- Editor público `https://editor.suesholistics.com/` HTTP 200. FableCut persistente en 127.0.0.1:7780 HTTP 200, seis clips, revisión 53, B02 desactivado. VPS 48GB, aproximadamente 16GB libres.
- **No se ha activado el frontend nuevo en producción; no se han borrado recursos ni gastado créditos.**

## Por qué aporta a la etapa 2.3
Permite tener visibilidad del proyecto y su historial dentro del estudio SUES, pasando por el mismo esquema de autenticación y comprobando revisiones entre llamadas. Esto prepara recuperación, revisión del trabajo compartido y control contra carreras entre humano y Master Director. Sin embargo, **no demuestra aún un editor completo**.

## Próxima etapa
Prioridad fase 2.3: integrar de forma segura el frontend multipista completo de FableCut con SUES. En particular validar operaciones *humanas y de la IA* sobre la misma autoridad NLE (selección, guardado, arrastre/recolocación, undo/redo, nuevas pistas/medios, persistencia tras refrescar, conflicto CAS), en pruebas aisladas. Verificar backups y recuperación de fase 1 antes de habilitar escrituras más amplias. No fusionar ni desplegar sin QA.

## Fuente de continuidad
Google Doc: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
Documento de fases: `docs/engine-next/FASES_ETAPAS_PROGRESO_20261108.md`
Checkpoint de GitHub: `docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md`
