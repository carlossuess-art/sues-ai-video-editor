# SUES Editor · FableCut nativo, compatibilidad IA y seguridad de copias · 08/11/2026

## Prioridad decidida por Carlos

**Aplazar la publicación hasta otra sesión y continuar con la implementación de SUES Editor sobre el FableCut nativo.** No crear un segundo frontend NLE, no intentar de nuevo la publicación ni el cambio de Caddy bloqueado anteriormente. SUES Editor es el producto; FableCut es la interfaz/motor únicos; el SUES MASTER DIRECTOR será el cerebro que use sus comandos, reglas y herramientas propias. Colores y marca después.

## Integración con IA: prueba real de MCP del FableCut instalado

- FableCut 1.18.0 está instalado en `/srv/sues-fablecut-next/app/`; servicio privado en `127.0.0.1:7780`.
- Se ejecutó **el MCP original instalado** `/srv/sues-fablecut-next/app/mcp-server.js` por stdio, solamente con operaciones de lectura; entorno explícito `HOST=127.0.0.1 FABLECUT_PORT=7780 FABLECUT_DATA_DIR=/srv/sues-fablecut-next/data`.
- JSON-RPC `initialize`: handshake correcto, protocolo **2025-11-25**, `serverInfo.name=fablecut`, `serverInfo.version=1.18.0`.
- `tools/list`: **24 herramientas** nativas; entre ellas `fablecut_status`, `fablecut_docs`, `fablecut_get_project`, `fablecut_patch_project`, `fablecut_set_project`, `fablecut_import_media`, `fablecut_export`, etc. Esto demuestra soporte MCP real, **NO que el Master Director autónomo ya esté conectado o autorizado para editar**.
- `tools/call(fablecut_get_project, compact=true)`: lectura correcta del proyecto original, 1080x1920 a 30 fps, **revisión 54 y seis clips**, sin modificarlo. La comprobación REST posterior confirmó revisión 54 intacta.
- Evidencia de auditoría local privada: `/tmp/sues-native-mcp-readonly-audit-20261108.jsonl`. No replicar contenido privado del proyecto a la documentación pública.

## Copias de seguridad: bloqueo real detectado y guardrail implementado

- Se revisó `/opt/sues-video-setup/backup_rotation.py` sin modificarlo ni forzar ningún borrado.
- Hay **cuatro carpetas** `update-backup-*`, de las que la penúltima cronológicamente, `update-backup-20261029-182123-365569`, carece de `editor-state.tar` y `editor-state.manifest.json` (solo tiene metadatos). La carpeta más reciente `update-backup-20261029-182329-365998` contiene sus archivos.
- También falta el archivo fijo previsto por el servicio, `/opt/sues-video-setup/gemini-live-20261026/rollback/editor-before.tar`. El servicio `sues-backup-rotation.service` había fallado con `latest backup incomplete`.
- Se añadieron en PR27 `src/engine-next/backup-rotation-readiness.js` y `tests/engine-next/backup-rotation-readiness.test.js`. Detecta las dos condiciones, informa de modo **solo lectura**, `filesDeleted=0` y `eligibleToConsiderRotation=false`. 2 pruebas específicas PASS.
- **No activar rotación destructiva** ni inventar una copia fija «válida». Para resolver se requiere crear/verificar respaldo fijo de restauración, clasificar la carpeta incompleta sin suprimir copias válidas, validar SHA y restauración aislada, y solo después considerar retención/limpieza.
- El snapshot privado previo para el proyecto FableCut original revisión 54 y sus seis medios sí está verificado en `/srv/sues-fablecut-next/data/qa/studio-publication-preflight-20261108/`, ~139MB. **No confundirlo con la copia fija que falta del editor anterior**: son dos sistemas distintos.

## Resultados y conservación de trabajo

- Antes de aislar los cambios de frontend antiguo, la suite del árbol de trabajo tenía **87/87** pruebas PASS, incluyendo experimentos locales no confirmados en GitHub.
- Se preservaron dichos experimentos sin perder trabajo en `git stash` con descripción `preserve unmerged native-static staging experiments before FableCut-native focus 20261108`. No reintroducir la antigua UI NLE como prioridad: valorar el stash según compatibilidad con FableCut nativo.
- Tras sincronizar exclusivamente la rama PR27 de GitHub, la suite **confirmada del código versionado es 85/85 PASS**, worktree limpio, HEAD de código de respaldo `8e06867` antes de actualizar esta documentación. Esta es la cifra válida para continuación.
- Producción `https://editor.suesholistics.com/` y FableCut privado `127.0.0.1:7780` HTTP200; proyecto original en revisión 54 y seis clips. Publicación de FableCut sigue **pendiente/aplazada expresamente**; no se alteró Caddy, DNS, cuentas ni puerto.

## Próximas etapas sin depender de publicar

1. Mantener FableCut nativo como interfaz definitiva y validar un **adaptador de acciones MCP controlado por contrato** para Master Director, con allowlist para lectura y confirmación/CAS explícitos para cambios. Reutilizar los 24 comandos disponibles; no exponer un MCP sin auth/aislamiento.
2. Crear/validar un plan de backups del proyecto y recuperación independiente y seguro para FableCut y para el editor anterior, con pruebas de integridad, sin borrar las copias históricas.
3. Probar cambios de agente sobre copia real de FableCut y comprobar previsualización/exportación, rollback y permisos. Ya existen pruebas anteriores de CAS UI↔FableCut en `docs/engine-next/PHASE23_REAL_NATIVE_BROWSER_RECOVERY_QA_20261108.md`.
4. Solo cuando Carlos vuelva al tema de publicación: revisar DNS `studio.suesholistics.com`, auth previa a TODA la aplicación y su API, TLS, backups, proxy Host/Origin, Range y pruebas de acceso externo; las acciones de publicación anteriores quedaron bloqueadas por controles de seguridad y **no deben eludirse**.

Google Doc maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
