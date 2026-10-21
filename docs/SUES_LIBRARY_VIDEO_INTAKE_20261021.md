# SUES · Biblioteca audiovisual · Admisión de vídeo y overlays (candidato, 21/10/2026)

## Estado del cambio
Rama de desarrollo aislada `feat/library-video-assets-20261021` derivada de release 73d673b. **No desplegado en producción** y sin alterar los 13 SFX existentes, los 4 motions nativos, proyectos ni trabajos anteriores.

El servidor ya conserva inventario oficial privado en `/opt/sues-video-setup/editor/jobs/library/official-library-v1.json`: 13 SFX con SHA validado, 4 recursos gráficos propios y referencias a 309 archivos de Drive, todavía externos. Documentación maestra: https://docs.google.com/document/d/1EFK4TtTmi3ToWKfl5qGQC7TvEmCL4zIWuR0apdRotAA/edit

## Funcionalidad efectivamente construida en esta rama
- `MediaLibrary.receive` acepta `kind=video` y `kind=overlay` en la API privada ya existente, sin crear APIs paralelas.
- Exige acceso autenticado y cabecera de modificación, derechos `owned/ licensed`, límite 40 MiB, fuente regular con checksum SHA256, almacenamiento privado idempotente.
- Valida el contenido real mediante FFprobe sin invocar URLs externas; solo contenedores MP4/MOV y códecs h264/hevc/mpeg4/prores con una única pista de vídeo y dimensiones/duración/FPS acotados.
- Permite audio acompañante de origen pero **no lo inserta automáticamente en mezcla**; acepta de forma explícita pista de código de tiempo `tmcd` porque medios reales del usuario la incorporan.
- Retiene resolución, duración, fps, canal alfa aparente y presencia de audio; devuelve los bytes solamente en la ruta autenticada existente con soporte de rangos y verificación de hash.
- Añade tipos Vídeo de apoyo y Overlay en el panel de recursos, con previsualización de vídeo, aviso expreso «pendiente de incorporar al montaje».
- El catálogo semántico V2 sigue fail-closed: el vídeo importado NO aparece como aprobado para producción y no se mapea a alias SFX.

## Pruebas realizadas
- `tests/media-video-library.test.js`: 3 casos nuevos (ingesta/deduplicación y seguridad, rechazos, FFmpeg + sesión/rangos).
- `tests/media-library.test.js` y `tests/asset-metadata.test.js`: regresión sobre contratos anteriores.
- Prueba CON MEDIA REAL de Drive: `Shape 08.mp4`, 173536 bytes, SHA256 `dc1b3f104c1a6292fcf7aba6a5c958c931a14e0e3eb1e7e35ab3ef255c9d31fb`, 1920×1080, 24fps, 1.125s, pista `tmcd`: importación/validación/lectura PASS en contenedor temporal sin red. No expone el original ni lo introduce en producción.
- Prueba integral completa ejecutada en contenedor aislado: consultar registro QA antes de declarar su resultado definitivo. Un primer intento con espacio temporal insuficiente falló por limitación artificial de tests, no por regresión de la librería. El entorno se ajustó y se repite con espacio suficiente.

## Lo que esta rama NO implementa
- Selección automática de vídeos por emociones y narración, posicionamiento con seguridad facial, insertar vídeos/overlays en la línea de tiempo, renderizar B-roll desde el catálogo privado, descarga directa de Drive ni publicación automática.
- El código existente ya tiene un camino de compositor de B-roll basado en decisiones `selectedMedia` de `src/local-preview.js`, pero aún falta enlazarlo a recursos seleccionados por el usuario/Director en los settings del proyecto.
- Las 309 piezas de Drive NO han sido transferidas, publicadas, consumidas ni catalogadas como aprobadas. Los 14 alias de sonidos de firma siguen sin asignación.

## Continuidad
1. Completar tests de regresión y revisión de seguridad de la rama.
2. Guardar commit aislado y publicar en Github solo tras verificación.
3. Añadir `brollEvents` al plan validado mediante compilador con reglas existentes de B-roll/seguridad: primero un MP4 real, voz y subtítulos conservados, acotación de 30fps y QA visual de principio a fin.
4. Integrar el primer lote seleccionado desde Drive mediante transferencia autorizada; mantener originales en cuentas de origen y no transferir los 18,4GB enteros.
5. Desplegar solo con backup completo, prueba API real y capacidad de rollback, y actualizar ROADMAP / PROJECT_STATUS.md con evidencias.

Coste externo 0. No se han contratado servicios.
