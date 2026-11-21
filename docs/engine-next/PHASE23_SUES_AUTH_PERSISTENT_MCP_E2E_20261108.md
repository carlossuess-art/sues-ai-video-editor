# Fase 2.3 · SUES autenticado → permiso persistente → MCP nativo FableCut · 08/11/2026

**Estado:** PR #27, no desplegado. FableCut original continúa como NLE único; publicación aplazada por Carlos.

## Implementación final verificada

Se han reutilizado los mecanismos existentes de SUES para iniciar sesión, comprobar origen y exigir la cabecera de petición antes de acceder a operaciones privadas. El flujo de autorización y ejecución está **desactivado por defecto**; solo se activa si se configura explícitamente el directorio privado de aprobaciones `SUES_ENGINE_NEXT_DIRECTOR_APPROVALS_DIR`, el FableCut de bucle local `SUES_ENGINE_NEXT_FABLECUT_URL` y se inyecta un `nativeDirectorInvoker` autorizado dentro del proceso SUES. No se publica MCP ni se abre el puerto privado.

El nuevo `src/engine-next/fablecut-director-approval-ledger.js` ofrece permisos persistentes de un solo uso y vida corta (5 min), atados a actor verificado, proyecto, revisión, clip y geometría; usa archivos de modo 0600, operaciones `wx` para impedir reutilización y sincronización a disco antes del paso siguiente. El servidor autentica al administrador SUES; el cliente no puede declarar la identidad humana por su cuenta. Se conserva un registro de auditoría persistente `dispatch-audit.jsonl`.

El flujo usa los endpoints `POST /api/engine-next/director/approve-transform` (solo crea permiso; **no modifica el proyecto**) y `POST /api/engine-next/director/execute-transform` (consume el permiso e invoca exclusivamente `fablecut_patch_project` de transformación de una capa en revisión CAS). Se rechazaron rutas duplicadas por concurrencia durante el desarrollo y se unificó en **un solo ledger**. Las operaciones siguen pasando por el guard y el dispatcher: bloqueos de pistas/capas, identidad de proyecto, ausencia de `force`, comprobación de respuesta MCP y relectura de cambios.

## Validación automática y end-to-end

- **95/95 pruebas dirigidas PASS** sobre la rama de GitHub sincronizada, incluyendo la ruta HTTP completa y las pruebas de ledger. Código backend `src/editor-server.js` verificado íntegro (1215 líneas) y sin endpoints duplicados.
- **QA end-to-end contra FableCut auténtico**, con SUES HTTP real en una sesión de prueba y FableCut privado **aislado en 127.0.0.1:7782**; MCP real instalado `mcp-server.js` por stdio. El proyecto clonado de 6 clips inició rev54 y terminó rev55 después de **UNA sola** invocación `fablecut_patch_project` sobre B02 x300→327.
- La solicitud sin sesión fue 401, sin cabecera anti-CSRF fue 403, origen ajeno 403; aprobación no tocó el proyecto. Ejecutar una segunda vez el mismo permiso fue 403 y aprobar sobre revisión antigua fue 409. B02 siguió disabled, fuente V1 locked, seis clips conservados.
- Auditoría persistente registra `approved-before-dispatch` y `committed-verified`, comprobados. Prueba de rechazo de modificación de un permiso también PASS en suite HTTP simulada.
- Evidencias privadas con manifest SHA en `/srv/sues-fablecut-next/data/qa/real-sues-director-approval-e2e-20261108/evidence/`: `full-http-mcp-qa.json`, `approval-claim-proof.json`, `manifest.json`, log del servidor.
- Se apagó la instancia QA 7782 y se eliminaron sus datos clonados y sus aprobaciones temporales **después** de guardar evidencia. El FableCut original de producción permaneció en revisión54, seis clips, y el editor público SUES respondió HTTP200.

## Alcance y restricciones

Este E2E comprueba **la autenticación de sesión SUES del servidor de pruebas**, con credenciales de sesión de prueba, y un permiso de operación comprobable en el ledger. **No demuestra todavía** la aprobación creativa de Carlos a una edición real del Master Director ni el flujo autónomo operativo con identidades de usuarios reales/SSO. En producción tanto el ledger como el invocador MCP siguen desactivados si faltan su configuración y validación. No confundir seguridad de sesión con aprobación cinematográfica de un plan.

La rotación de backups históricos del editor anterior sigue bloqueada por un respaldo fijo inexistente y una carpeta incompleta. Existe snapshot privado de proyecto FableCut separado; no se borraron copias antiguas. Publicación de FableCut sigue aplazada; no se tocó DNS/Caddy.

## Siguiente puerta

Integrar la aprobación creativa validada del `MasterDirectorProjectStore` (revisión, `decisionId`, fingerprint del plan, operaciones autorizadas) con el permiso técnico del ledger, evitando que una simple sesión administrativa equivalga a aprobar un plan de vídeo. Después, añadir limitación/revocación explícita de permisos, pruebas de rechazo entre proyectos y una estrategia de recuperación/undo mediante revisión CAS antes de ampliar el catálogo de operaciones MCP. Aplicar la última skill SUES AI Film Director antes de elaborar o modificar un plan cinematográfico.

Docs maestro Drive: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
