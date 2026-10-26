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


## Complemento verificado: B-roll solicitado por Gemini y MP4 real · 21/10/2026

**DESARROLLO AISLADO, NO DESPLEGADO**. Sobre la ingesta privada ya probada, se conectaron `videoEvents` del plan al compositor `selectedMedia` existente; NO se ha creado motor paralelo ni se ha reconstruido CALMA/DOPAMIN/ELEMENTS. `src/cinematic-style.js` valida motivos explícitos, intervalos, duración y límites de plantilla, tres B-rolls máximo, plano completo, inicio/cierre protegidos, sin clips solapados ni reutilización de un mismo recurso. El audio original y los subtítulos se conservan. `src/external-edit-plan.js` expone la operación `broll` a Gemini; los recursos se identifican exclusivamente por SHA-256 de la biblioteca privada, nunca por URLs arbitrarias ni rutas de usuario. Revisión completa antes de crear una nueva versión, con rechazo explícito de recursos ausentes o archivos overlay usados como vídeos.

El contrato mantiene las restricciones CALMA actuales: 2,5–6 segundos por B-roll, al menos tres segundos de presentador entre dos clips y cobertura máxima del 40%. Esto no supone selección semántica autónoma: la correspondencia entre B-roll y frase la determina la instrucción externa que el usuario revisa. Superponer objetos sobre el sujeto, alfa, zoom en B-roll, seguimiento y efectos de voz continúan pendientes.

**EXPORTACIÓN REAL AISLADA: PASS.** Fuente real existente en el editor de 12.979956 s, con audio original; recurso de prueba generado en el contenedor, 4,2 s, ID SHA256 `fa3e5b064fc4909a5e9af38214ecfe524a276b669f3539be61bcbc02222a988a`, insertado del segundo 5 al 8 mediante una operación Gemini JSON autorizada. Exportado MP4 real 1080×1920, 30 fps, duración codificada 12.966667 s, H.264+audio, hash de salida `5b02d01735fec1d0e43e2f8df493d938776c6ae1c86afb9f20f079c375e3c533`, audit.fullDecode PASS, audit.broll=1, voz original presente y subtítulos=4; `sourcePreserved` true. El vídeo de apoyo usado es sintético de QA, NO uno de los comprados y NO la demostración estética F9. No usar QA como ejemplo de acabado cinematográfico.

El backup portable del proyecto se amplió para incluir B-roll seleccionado en el tar con medios y hash; prueba de restauración de fuente y ajustes pasó sin referencia a la cuenta externa. `tests/manual-broll-integration.test.js` añade cuatro casos: límites de estilo, Gemini/compilador, backup/restauración, API HTTP autenticada y creación de versión nueva sin modificar anterior.

Pruebas actualizadas en imagen de QA sin acceso a red: suite 263/264 PASS, 1 fallo de entorno en prueba Git `safe.directory` porque el contenedor carece de Git; `tests/deploy-service.test.js` pasa 2/2 en host VPS, además de `node scripts/check.mjs`. Por tanto, 264 casos se contrastaron con distintos entornos, pero no afirmar 264/264 en un solo contenedor.

**LIMITACIONES Y SIGUIENTE BLOQUE:** realizar miniaturas y revisión visual humana del montaje de prueba; seleccionar y recuperar B-rolls REALES de los 309 ficheros y de fuentes originales ya compradas, no el sintético; preparar la conversión segura de overlays con o sin transparencia; verificar mezcla SFX y voz; después CI/backup completo/merge/despliegue y prueba sobre `https://editor.suesholistics.com`. Los scripts y pruebas de este trabajo no alteraron original, media store o servicios productivos. Coste de servicios externos 0.


## Release de producción verificada · 21/10/2026
El commit `a5430f21b7d44c0e814a621e36d8f30eefd4ab38` fue instalado sobre el editor real el 21/10/2026, sin merge de la rama oficial; la aplicación respondió HTTP 200 por HTTPS y el servicio Whisper quedó activo. Se preservaron 13 SFX y las referencias del catálogo externo. Copia del estado privado: 352 archivos y hash `ebace3c0a00848d488227403a11e705b611e8b226ffd57261ed9290fa43bf92f` en `update-backup-20261021-201257-53492`, contenedor anterior conservado.

Primer intento fallido por modificación concurrente de `jobs/uploads/asr/worker.json` (heartbeat Whisper) durante el tar; rollback correcto, solucionado pausando Whisper inactivo durante copia; servicio reactivado al final. No hubo pérdida de proyectos. Tras despliegue, comprobada concordancia commit real/objetivo y HTTPS 200.

Una solicitud posterior para integrar el overlay comprado `Shape 08.mp4` con la API privada fue bloqueada por controles de herramienta. No se creó ese recurso nuevo. Es necesario una importación autorizada a través del panel del usuario o un flujo Work, antes de prueba de material comprado en producción.

## Drive bajo demanda · 26/10/2026

Se amplía el motor existente con `audited-drive-v1.json` privado, mantenido a partir del inventario Drive existente (no se incluye en Git). Búsqueda por descripción visible y usos editoriales en español; no se infiere contenido del nombre. Los candidatos remotos entran en las propuestas locales del Director con revisión por muestras y `needsMaterialization`. Ninguna operación llama a Gemini.

`POST /api/library/materialize` exige sesión, protección de origen/CSRF, ID presente en catálogo, derechos declarados, cuatro muestras, decodificación previa correcta, tamaño y SHA256. Descarga desde el endpoint fijo de Drive, sin URLs arbitrarias, cookies ni redirecciones; los archivos que necesiten autenticación o confirmación fallan de forma explícita. No es una conexión OAuth para todos los archivos privados.

Caché de descarga limitada a 128 MiB, máximo 40 MiB por recurso, bloqueo de concurrencia y expulsión por antigüedad. La importación usa MediaLibrary existente (512 recursos/2 GiB). Los medios seleccionados instalados conservan sus bytes: expulsar caché nunca elimina assets ni rompe proyectos. Los originales permanecen en Drive. Si el proceso muere durante descarga, el bloqueo residual requiere comprobar que no hay proceso antes de retirarlo; no se elimina un lock activo a ciegas.

Se aplican `selectionExcluded`, grupos SHA256 y exclusión de QA en búsqueda, propuestas y listado seleccionable. No hay borrados físicos en Drive; las equivalencias exactas conservan un ID canónico y las variantes visuales excluidas no se borran por similitud. Las versiones antiguas siguen pudiendo resolver sus medios para recuperarse.

Prueba real aislada sobre un vídeo de Carlos de 13,4102 s: búsqueda «carretera senda recta flanqueada árboles» → BR-0199 → 3.596.747 bytes de Drive con SHA256 6a82f1910368a5dbbf00d2a13648e9c91b231f38af88cadd3fdcfcad0fcf0945 → MediaLibrary → plan B-roll 5–8 s/sourceIn 1 → MP4 completo, decode PASS y voz original. Fotograma 6,5 s inspeccionado: carretera y árboles al atardecer/amanecer, captions legibles; mantiene bandas por el encuadre del recurso. Prueba técnica explícita, no decisión narrativa autónoma ni aprobación creativa global. Primera descarga comprobada; las repeticiones usan caché. Evidencia privada: resource-audit-drive-20261026/operational-qa/E2E_RESULT.json.

Validación: 355/356 tests PASS en contenedor con FFmpeg; el único fallo es Git ausente y su prueba pasó en host. 13/13 pruebas focalizadas/Git host PASS, sintaxis/diff comprobados. No confundir estas pruebas con aceptación V1. Despliegue debe verificarse por separado antes de afirmar disponible en producción.

Pendientes: revisión continua/audio y fragmentos de clips, efectos/stock/marca/Adobe, clasificación CapCut, accesos directos, autorización de archivos Drive privados, QA de interfaz y decisión narrativa de nivel DOPAMIN. No se autoriza envío a Gemini.
