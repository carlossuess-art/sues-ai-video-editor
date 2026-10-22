# Fase 6 · Capacidad de biblioteca con cuota · 22/10/2026

**Estado: solo desarrollo local en rama** `feat/library-ambient-overlays-mastering-20261021`. La versión del VPS en producción continúa en el release `56b686ff3bc284431528f2612219115632d4670a` y conserva el límite antiguo de 24.

## Cambio incremental
- `MediaLibrary` ahora admite **hasta 128 archivos privados** (antes 24) y **2 GiB agregados** para los medios importados. Son límites máximos; las opciones `maxAssets` y `maxLibraryBytes` permiten restringirlos para pruebas. No son tamaños de biblioteca aprobados para cualquier VPS.
- Se preservan máximo 40 MiB por archivo, validaciones FFprobe, SHA256, derechos declarados, permisos privados, prevención de symlinks, serialización de ingestión, duplicados y reserva mínima de espacio libre.
- Después de recibir, validar y calcular el SHA256 se verifica cantidad total y cuota de bytes antes de crear el archivo permanente. Los archivos temporales se retiran al rechazar. Recursos duplicados existentes no consumen una segunda cuota.
- Nuevo endpoint privado protegido por sesión `GET /api/library/capacity` devuelve installed/maxAssets/remainingSlots/usedBytes/maxBytes/remainingBytes. No permite descargas ni modifica el catálogo.
- Los **309 recursos indexados en Drive no se descargaron**. La referencia DOPAMIN de @diego.nxt permanece solo referencia, nunca B-roll autorizado del render.

## Pruebas reproducibles
`node --test tests/media-library-quota.test.js tests/media-library.test.js tests/private-library-search.test.js tests/private-library-http.test.js`: **8/8 PASS**.
`node scripts/check.mjs`: PASS. `git diff --check`: PASS.
Suite general host de versión previa: 267 PASS / 8 FFmpeg ENOENT / 1 SKIP de 276. Las 8 rutas dependientes de FFmpeg se repitieron en Docker aislado: grupos 19/19 PASS. No afirmar que la suite global pasa entera en un único host.

## Pendientes
Publicar los commits locales por método GitHub autorizado (sin sortear controles); volver a ejecutar regresión completa bajo entorno con FFmpeg; backup integral + comparativa de árbol antes de despliegue, gestionar Whisper y cola durante el release; comprobar HTTP 200 y rutas con y sin sesión. Integrar el buscador en el Director IA sin aprobación automática y validar visualmente DOPAMIN con un Reel propio.
