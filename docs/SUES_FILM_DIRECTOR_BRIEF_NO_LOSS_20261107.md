# Fase 1 · Conservación íntegra del documento de Film Director (PR #27)

**Alcance:** el editor admite conservar el documento creativo original de SUES AI Film Director, aunque sea Markdown y todavía no haya pasado la conversión estricta a `sues-master-story/v1`. No se interpreta como plan ejecutable, no transfiere aprobaciones, no sustituye el contrato JSON maestro, no omite operaciones ni asigna automáticamente recursos.

## Entrada y evidencia

Desde un Reel existente: **Dar instrucciones → Documento original de Film Director (sin ejecutar) → Guardar documento Markdown original**. Acepta `.md`/`.txt` UTF-8 hasta 60 KB. La carga es autenticada, requiere revisión actual, SHA de fuente del catálogo vigente y huella de timeline exactos. El servidor comprueba el SHA original según la procedencia verificada (en Reel derivado VFR→CFR30) y exige que el documento lo mencione; un archivo que no pertenece al Reel se bloquea.

API: `POST /api/jobs/:jobId/master-source-brief` con `{text,expectedRevision,expectedSourceSha256,expectedTimelineFingerprint}`. `GET` lista los documentos intactos de solo lectura e identifica cuáles están obsoletos respecto a fuente y timeline actuales. Se guardan como revisiones inmutables de contenido, con hash SHA-256 y modo 0600; máximo 20 por Reel, sin cambiar la revisión activa. Verificación de integridad al leer y bloqueo si se altera un archivo. La devolución siempre especifica `approved:false`, `canExecute:false`, `SOURCE_BRIEF_NOT_AN_EXECUTABLE_PLAN`.

El documento real de 158404 `SUES_158404_plan_para_pegar_revision_V1.md` tiene 7 escenas, B01–B05 y M01–M03, geometría y música provisionales, cortes sin aplicar y dudas de ASR. Está **NO APROBADO / NO EJECUTAR**. No inventar un B-roll, permiso, capa ni transformación para pasar el contrato. La fase 1 permanece abierta para el contrato JSON sin pérdidas, licencias verificadas y aprobación creativa.

## Criterios comprobables

Pruebas dirigidas `tests/master-director-brief-evidence.test.js`: conservación íntegra del texto y hash, idempotencia, rechazo de original no declarado, rechazo de revisión/huella obsoletas, bloqueo de campos de aprobación falsos, cero cambios en la revisión actual y error ante alteración del fichero inmutable. La función no publica ni renderiza ni incluye una ruta de aprobación del Markdown.
