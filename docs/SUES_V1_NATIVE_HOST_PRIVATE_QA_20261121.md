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

## Pendientes

1. Flujo integrado autenticado editor→Master Director→ledger→MCP→readback→undo sobre clon real, incluyendo rechazo de edición del proyecto equivocado.
2. Asociaciones aisladas de varios proyectos nuevos y staging de activos verificados. La configuración actual se limita deliberadamente a UN clon privado.
3. QA completa con render y voz, pruebas de navegador, regresión y rollback del contenedor antes de promover al servicio público.
4. La mejora ASR está en código pero necesita actualización del servicio Whisper instalado y validaciones de varias voces. Ver `SUES_V1_TIMING_AUDIO_AUDIT_20261121.md`.

**Roadmap:** Q03 en curso, Q04 aceptación funcional tras instalación, Q05 autorización de despliegue ya concedida, ejecución pendiente. No retocar el Reel 158404 como entrega.
