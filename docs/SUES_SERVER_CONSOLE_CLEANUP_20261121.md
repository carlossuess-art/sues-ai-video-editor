# SUES Server Console · Limpieza inteligente segura · 21/11/2026

## Entorno REUTILIZADO

Se amplió el servicio privado existente `/opt/sues-vps-mcp`, sin crear otra aplicación, sin DNS ni cambios en WAC. `sues-vps-mcp.service` sigue en 127.0.0.1:3917, con el OAuth previo `vps.manage` y acceso a `/mcp` protegido. No se ha modificado la web de Sites `sues-console-bridge.suesholistics.chatgpt.site`; el botón gráfico solicitado sigue **pendiente de conexión a la interfaz original** por falta de acción de edición Sites en esta sesión. No habilitar endpoints públicos de borrado sin sesión.

## Funciones desplegadas

- `cleanup_scan` (sin borrado): inventario de archivos temporales antiguos, tamaño estimado, ruta, motivo, clasificación `recomendado` / `revisar` / `conservar`, espacio libre, y un informe para copiar y pegar.
- `cleanup_prepare`: recibe `scan_id` más una lista explícita de ID de elementos; solo admite `recomendado`; revalida ruta y atributos. Devuelve ticket aleatorio de 48 caracteres hex, aprobación única de diez minutos y frase exacta `BORRAR SOLO ESTOS TEMPORALES`. **No elimina archivos**.
- `cleanup_execute`: requiere ID de aprobación, token y frase; comprueba otra vez las rutas y metadatos, vuelve a descartar lo que haya cambiado y registra el resultado en `/var/lib/sues-vps-mcp/cleanup/audit.jsonl` (0600). Uso único. Eliminación irreversible y acotada a lista blanca.
- `cleanup-cli.mjs` en el mismo servidor, con subcomandos `scan`, `prepare <scanId> <itemIds...>`, `execute` (este último lee el objeto con token de stdin, nunca de argumentos). Informe completo en `/var/lib/sues-vps-mcp/cleanup/report-<uuid>.txt` (0600). Útil mientras el botón de Sites esté pendiente.

## Lista blanca y salvaguardas

Borrado automatizable **solo** de: `exports/*.part.mp4` antiguos (mín. 2 días); `/var/cache/apt/archives/*.deb` antiguos; perfiles `/tmp/fablecut-export-*` antiguos; `chrome.zip` con binario ya instalado; `node_modules` del PoC Remotion con package-lock intacto; subdirectorios `automation-v1/test-project-*/render-work-*` antiguos y sin comprobante `segment-proof.json` / `render-proof.json`, siempre que no se detecten renders activos. Todas las rutas fijas verificadas contra traversal y symlinks; cambios en inode, mtime o tamaño invalidan la aprobación; token expira. Las carpetas `/qa/reel-*` solo se **revisan** y `update-backup-*` se marcan **conservar**. Nunca se admite borrado de proyectos activos, originales, exportaciones finales, WAC, bases de datos, backups ni bibliotecas por ruta proporcionada por el usuario.

La cifra recuperable es estimada: `du` puede incluir archivos enlazados físicamente varias veces.

## Pruebas efectuadas

- Dos suites sintéticas independientes: 2/2 PASS; comprueban que se excluyen symlinks, archivos recientes y backups, que la vista previa no borra, que los tokens incorrectos fallan, que el segundo uso falla y que la mutación del fichero invalida la operación.
- Servidor candidato HTTP200 en metadatos OAuth, HTTP401 sin token o con token inválido.
- Despliegue en `sues-vps-mcp.service` con respaldo previo `/opt/sues-vps-mcp/cleanup-candidate-20261121/before/server.mjs` y automatismo de rollback si falla el health check. Postdeploy: servicio active, OAuth metadata HTTP200, /mcp HTTP401 sin sesión, CLI scan PASS, editor.suesholistics.com HTTP200.
- Escaneo real posterior: 1 candidato `recomendado` (~6 MB), 35 `revisar`, 4 `conservar`; 8,0 GB libres (84 % usado). **Ninguna limpieza ejecutada** desde la herramienta nueva sin autorización.

## Versionado y continuidad

Fuente de backend: `ops/sues-console/cleanup.mjs`; CLI `ops/sues-console/cleanup-cli.mjs`; pruebas `ops/sues-console/cleanup.test.mjs`; parche de registro MCP `ops/sues-console/server-cleanup-tools.patch`, en PR #27. La instancia desplegada procede de `/opt/sues-vps-mcp/cleanup-candidate-20261121`. No copiar ni publicar `oauth.json` o `access.sha256`.

**Próximo paso opcional:** conectar la web original de Sites a estas operaciones, mostrar selección, botón `Analizar`, diálogo `Preparar limpieza`, segundo diálogo de confirmación y `Vaciar seleccionados`. Nunca ofrecer `Vaciar todo` que incluya elementos `revisar` o `conservar`.

Nota: Esta mejora de consola **no equivale a completar** el estrés de exportación real de 73 s de SUES AI VIDEO EDITOR. El render corto de FableCut había pasado, pendiente su validación larga.
