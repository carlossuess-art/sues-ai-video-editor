# Fase 2.3 · Dispatcher autorizado del Master Director hacia MCP nativo · 08/11/2026

**FableCut ORIGINAL es el único NLE. PUBLICACIÓN APLAZADA a petición de Carlos. Sin merge ni deploy.**

## Qué se ha implementado

`src/engine-next/fablecut-director-dispatcher.js` introduce un controlador de la primera clase de operación permitida: modificar x/y/scale de **una única capa editable** a través de la herramienta MCP ya instalada `fablecut_patch_project`. No construye otra línea de tiempo ni inventa funciones FableCut.

El llamante debe aportar dependencias de confianza: `authorize()`, `readProject()`, `invokeMcp()` y `audit()`. El módulo **no crea autenticación** ni expone un endpoint; la aprobación ha de verificarse por el servicio SUES antes de ponerlo en producción. La petición incluye `actor`, `approvalId`, ID del proyecto, revisión y transformación exacta; campos adicionales como `force` se rechazan. Se exige coincidencia de proyecto/revisión antes de construir la orden. El guard ya existente impide editar capas bloqueadas, pista V1 fuente, pistas bloqueadas y valores peligrosos.

El dispatcher escribe auditoría antes de ejecutar; si auditar falla, no ejecuta. Envía SOLO una operación MCP nativa con `baseRevision`, **no reintenta automáticamente conflictos**; comprueba que MCP confirme la nueva revisión y vuelve a leer FableCut para verificar x/y/scale, clip desactivado y número de clips. Guarda resultado confirmado o fallo en el registro de auditoría. Si el resultado no puede verificarse se niega a afirmar éxito y no reintenta ciegamente.

## Pruebas

`tests/engine-next/fablecut-director-dispatcher.test.js` añade cuatro pruebas: operación autorizada con auditoría, rechazo por aprobación/proyecto/revisión/campo no autorizado, rechazo MCP sin reintento, y rechazo de resultado MCP no verificable.

**E2E real aislado:** copia del FableCut original rev54 y seis clips, en `/srv/sues-fablecut-next/data/qa/dispatcher-native-e2e-20261108/`; se lanzó `mcp-server.js` real vía stdio. El controlador aplicó capa V2 B02 x300→319, revisión 54→55, conservando `disabled` y el bloqueo V1. Otra petición con base 54 se rechazó y una sin aprobación tampoco invocó MCP. Exactamente **una invocación MCP de escritura**, con auditoría `approved-before-dispatch` y `committed-verified`. Producción permaneció rev54, seis clips. Evidencias privadas `evidence/result.json` y `manifest.json` con SHA256; copia de datos del clon eliminada.

**91/91 pruebas dirigidas PASS** en árbol local antes de sincronizar GitHub; repetir tras sincronizar para fijar cifra. No se han probado envíos desde el Master Director autónomo ni aprobación real de SUES; en QA se inyectó el permiso como dependencia de prueba.

## Limitaciones y siguiente paso

- El controller es **una puerta de ejecución real con un tipo de operación** (transformación) y auditoría inyectada. No convierte automáticamente al Master Director en un agente de edición completo.
- Falta conectar `authorize` a identidad/sesión y aprobación reales, permisos por proyecto, registro de auditoría persistente, revocación, flujo de revisión humana y enlace con las acciones del Master Director.
- Falta comprobar más tipos de edición sobre clones reales (texto/timing/máscaras/trim), rollback inverso seguro y supervisión. Para cualquier nuevo plan de edición se debe leer la última skill SUES AI Film Director y pasar su normativa cinematográfica.
- Los backups históricos del editor antiguo siguen sin pin de recuperación y con una carpeta incompleta, aunque FableCut actual tiene una copia de rev54 verificada separadamente. No forzar rotación.
- No tocar DNS/Caddy/publicación hasta la nueva orden del usuario.

Continuidad: Google Doc https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit ; rama GitHub `feat/master-director-story-orchestration-20261104`, PR27.
