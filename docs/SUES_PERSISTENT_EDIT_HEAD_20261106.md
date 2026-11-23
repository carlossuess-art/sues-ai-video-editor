# SUES AI VIDEO EDITOR · Proyecto vivo y edición incremental

Estado: rama de integración, NO DESPLEGADA ni validada con E2E real.

## Resultado deseado

Un Reel tiene **una sola revisión activa**, con toda la estructura editable persistente (capas, fuentes, recursos, efectos, máscaras, subtítulos, audio y sincronización). Se trabaja siempre sobre ella, aunque se cierre y reabra el editor. Cada instrucción edita exclusivamente el objeto indicado, sin modificar los demás. Las revisiones previas existen únicamente como historial interno recuperable: no son proyectos duplicados ni vídeos finales.

Ejemplos:
- «Cambia el B-roll de 00:08 a 00:12»: sustituir solo su referencia de recurso; no regenerar el montaje entero.
- «Añade una máscara en 00:20»: añadir o modificar la operación y mantener el resto.
- «Corrige el subtítulo del segundo 17»: modificar únicamente el texto conservando tipografía, animación, posición, tiempos y resto de capas.
- «Versión TikTok»: variante explícita derivada del proyecto, sin perder el trabajo original de Instagram. No crear variantes automáticamente.

## Implementado en esta rama

1. `src/master-director-project-store.js`: puntero duradero `master-director/current.json` por proyecto, que identifica la revisión activa por SHA-256 y permite recuperar el plan tras un reinicio. Compare-and-swap con `expectedRevision` y bloqueo atómico de directorio `current.lock`; cualquier conflicto evita sobrescribir trabajo posterior. Se conservan borradores anteriores inmutables.
2. `editCurrentOperation` y `editCurrentVisual`: operaciones focalizadas desde la revisión activa. La operación `parametersPatch` modifica solo propiedades indicadas dentro de `parameters`, conservando lo demás.
3. `src/editor-server.js`: API autenticada `GET/POST /api/jobs/:id/master-current`, `POST /master-current-operation-edit` y `POST /master-current-layer-edit`. Respuestas 409 cuando la edición ya no corresponde a la última revisión.
4. `web/app.js`: al abrir proyecto se recupera la revisión activa y se reabre su storyboard técnico; el control de versiones identifica «ACTUAL» frente a «Histórico». Las modificaciones hechas desde los controles del maestro actualizan la revisión activa; un cambio concurrente devuelve conflicto. Restaurar una versión histórica es una decisión explícita del operador.
5. Pruebas escritas en `tests/master-director-project-store.test.js`: reinicio, cambios de texto sin pérdida de otras capas, edición visual, conflicto de pestañas antiguas, restauración y autenticación HTTP.

## Estado de validación

Código revisado mediante comprobación estática de parseo; **las pruebas Node y E2E de navegador aún NO se han ejecutado en esta rama**. No atribuir un PASS de versiones anteriores a estos cambios. Ningún archivo en VPS/producción fue modificado.

## Pendientes antes de considerar cumplido el objetivo de CapCut

- Ejecutar todas las nuevas pruebas y la regresión; test de navegador real: importar plan, revisar, editar 1 subtítulo, cerrar sesión, reabrir, comprobar todos los nodos y recursos, deshacer, visualizar preview, exportar.
- Editor visual completo de capas mixtas, también las nativas: actualmente `native-controls-only` y `editableInWebEditor:false` en el grafo; no afirmar que ya existe paridad CapCut.
- Aplicación de cambios incrementales al render nativo+Remotion, sin perder identidad de operación, y nueva auditoría de la previsualización.
- API/herramienta segura para que el chat pueda recuperar el proyecto y enviar comandos estructurados `expectedRevision`/ID de operación; conexión autenticada y autorización adecuada, nunca acceso directo a archivos privados.
- Crear variantes Instagram/TikTok **solo cuando se soliciten**: un mismo proyecto raíz y una revisión activa por variante, con referencias explícitas a la revisión de origen.
- Registro de recursos y hashes, dependencia de máscaras, validación de tracking y sincronía con fuente derivada.
- Resolver bloqueo residual de revisión/QA y permisos por cada cambio; revisión previa no se traslada automáticamente a una edición distinta.
- Estudiar retención/backup/rollback de `current.lock` para caídas: no borrar un lock encontrado sin diagnóstico.

## Integración

Rama: `feat/persistent-edit-head-20261106`. Basada en `feat/master-director-story-orchestration-20261104` (PR #27); mantener separadas las escrituras para no interferir con Work. Proponer PR hacia esa rama; no mezclar ni desplegar hasta pasar pruebas reales y aprobación específica.
