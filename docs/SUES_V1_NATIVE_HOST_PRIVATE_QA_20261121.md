# SUES V1 · Host nativo FableCut · QA aislada · 21/11/2026

**Estado: código de desarrollo, NO DESPLEGADO.** La V1 pública no ha cambiado.

## Implementación

- `scripts/app/start.mjs` permite configuración administrativa opt-in mediante `SUES_NATIVE_HOST_CONFIG`. Sin ella, el bridge nativo sigue desactivado.
- `fablecut-trusted-host.js` exige archivo 0600, puerto QA loopback, proyecto único vinculado por registro privado a jobId verificado, pistas existentes, integridad de revisión y directorio `private-qa`. Rechaza rutas de producción, otro proyecto, revisión desactualizada y binding revocado.
- MCP real `fablecut_patch_project` se ejecuta con datos y puerto de clon fijos y sin autoinicio. El backend conserva su ledger de autorización de uso único y readback. Recursos nuevos quedan bloqueados: faltan staging seguro/hashes/derechos.

## Evidencia

- 5/5 pruebas nuevas de host privado PASS; 9/9 combinación con pruebas de aprobación/bindings del backend PASS.
- Copia QA aislada del proyecto V8, SHA de fuente conservado. Servicio temporal 127.0.0.1:17977. Comprobación real del MCP: revisión errónea 999 rechazada, parche autorizado **solo para QA técnica** revisión 29→30, clip `af_text_qué_face` x:0→1, 14 clips intactos, lectura del JSON confirmada. Unidad detenida; original, V29 y producción sin tocar. Esta comprobación directa **NO** constituye flujo completo con aprobación humana.
- El límite de archivos de la consola produjo `EFBIG` en el primer intento. La repetición aislada con `LimitFSIZE=256M` funcionó sin cambiar límites globales.

## E2E adicional: ciclo auténtico de permisos y MCP sobre clon · PASS

Un ensayo posterior ejecutó `createEditorServer` con `SUES_NATIVE_HOST_CONFIG` real, sesión autenticada, `MasterDirectorProjectStore`, binding administrativo a jobId de fixture, borrador, revisión, decisión, aprobación por ledger de uso único, ejecución por MCP real y readback. Revisión FableCut 31→32, cambio de x=1 a x=2, 15 clips preservados. La petición de aprobación sin sesión devolvió 401 y el intento de reutilizar la autorización fue rechazado. Prueba `qa/v1-20261121/native-e2e.mjs` en VPS, unidad systemd transitoria y límite de tamaño controlado; exit 0. Registro de binding revocado después de verificar, unidad de QA detenida, servicio público original HTTP 200 inalterado.

**ALCANCE:** fixture sintético y proyecto FableCut copiado. Se añadió en el CLON un clip centinela para igualar 24 s de duración del fixture; no es prueba de adaptación a un Reel auténtico ni flujo multiproyecto, ni realiza render audiovisual final. El bloqueo del onboarding y asociación segura de CADA proyecto nuevo y del staging de recursos permanece. No marcar V1 desplegada ni aprobada.

## Pendientes

1. Flujo integrado autenticado editor→Master Director→ledger→MCP→readback→undo sobre clon real, incluyendo rechazo de edición del proyecto equivocado.
2. Asociaciones aisladas de varios proyectos nuevos y staging de activos verificados. La configuración actual se limita deliberadamente a UN clon privado.
3. QA completa con render y voz, pruebas de navegador, regresión y rollback del contenedor antes de promover al servicio público.
4. La mejora ASR está en código pero necesita actualización del servicio Whisper instalado y validaciones de varias voces. Ver `SUES_V1_TIMING_AUDIO_AUDIT_20261121.md`.

**Roadmap:** Q03 en curso, Q04 aceptación funcional tras instalación, Q05 autorización de despliegue ya concedida, ejecución pendiente. No retocar el Reel 158404 como entrega.
