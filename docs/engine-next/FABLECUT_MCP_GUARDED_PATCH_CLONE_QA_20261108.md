# SUES MASTER DIRECTOR → FableCut nativo MCP · primera orden controlada · 08/11/2026

**Publicación APLAZADA por decisión de Carlos; seguir desarrollando integración IA.**

### Resultado ejecutado, no solo diseñado

- FableCut instalado 1.18.0, MCP stdio JSON-RPC protocolo 2025-11-25, **24 herramientas**. Lectura inicial `fablecut_get_project` correcta con proyecto original rev54, 6 clips.
- Nuevo módulo de preparación `src/engine-next/fablecut-director-mcp-guard.js`: genera únicamente una llamada `fablecut_patch_project` con una operación `updateClip` y `baseRevision` obligatorio. Exige ID exacto del proyecto activo, revisión actual, clip existente de video/imagen, pista válida, fuente V1 no editable, sin clips/tracks bloqueados, x/y/scale finitos y acotados. Prohíbe `force` y no habilita dispatch automático. Conserva metadatos del estado `disabled` para auditoría, además de propuesta inversa condicionada a la siguiente revisión.
- Tests `tests/engine-next/fablecut-director-mcp-guard.test.js` 2 PASS, uno positivo y otro que rechaza proyecto/revisión incorrectos, clip fuente bloqueado, pista bloqueada y geometría fuera de rango.
- **Prueba REAL MCP en copia aislada** de `/srv/sues-fablecut-next/data/project.json` con el mismo archivo FableCut instalado: `fablecut_patch_project` con `baseRevision:54` movió la capa infantil V2 **x300→311, rev54→55**; segundo intento idéntico basado en rev54 produjo **CONFLICT** y no sobrescribió el primer cambio. Se conservaron 6 clips, el estado `disabled:true` del B-roll infantil y `locked:true` del vídeo original. Producción permaneció rev54.
- Evidencia privada `/srv/sues-fablecut-next/data/qa/fablecut-director-mcp-guard-proof-20261108/evidence/`: `mcp-guard-report.json`, `mcp-inverse-intent.json`, `manifest.json` con hashes. Se eliminó la copia de datos aislada después de guardar pruebas.
- Suite completa desde árbol con nuevos módulos: **87/87 PASS**. Se requiere repetir desde rama sincronizada para confirmar final.
- No se ha conectado todavía SUES MASTER DIRECTOR autónomo a un dispatcher autenticado; se ha verificado una operación segura manualmente autorizada bajo un contrato. No hay publicación ni despliegue.

### Siguiente etapa

1. Añadir controlador autenticado que lea ID/revisión actuales, aplique exclusivamente comandos incluidos en un plan validado, registre autor/razón/diff y vuelva a comprobar revisión y estado de capa; no exponer MCP local a Internet.
2. Desarrollar otros contratos limitados para timing/máscaras/textos con validación de normas SUES AI Film Director antes de cualquier plan.
3. Comprobar rollback, seguridad, proyectos y múltiples operaciones en copias aisladas y corregir la política de backups históricos previa a habilitar nuevas escrituras.
4. Cuando Carlos pida expresamente retomar publicación, volver al runbook DNS/TLS/auth separado.
