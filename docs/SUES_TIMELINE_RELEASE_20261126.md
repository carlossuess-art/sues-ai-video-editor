# SUES FableCut V1.1 · Despliegue de timeline móvil del 26/11/2026

Editor habitual [SUES FableCut](https://studio.suesholistics.com:8443/). El primer despliegue utilizó el commit [52c6970387cd](https://github.com/carlossuess-art/sues-ai-video-editor/commit/52c6970387cd05652fe2863e5022c05d88fcb235) y los parches iniciales de paleta y tamaño. El servidor devuelve los hashes esperados de `app.js`, `sues-mobile.css` y `sues-mobile-text.js`. La URL exterior conserva la redirección a `/login` y el servicio V1.1 sigue activo.

| Bloque | Avance y evidencia |
| --- | --- |
| TL-01 | Paleta, siglas y fotogramas reales en el editor activo. En las filas de familia única, el primer toque activa el filtro y muestra el nombre. El segundo recupera la selección libre. Se verificó que el cabezal mantiene su tiempo y que otro tipo de clip queda protegido frente a esa selección. El canvas utiliza el color familiar y comprueba píxeles visibles para seleccionar. La prueba incluye una forma elíptica con esquina transparente. Quedan la agrupación T/ST y MG, las filas mixtas y la comprobación ampliada de toda la paleta. |
| TX-01 | Control rápido de tamaño con rango nativo 12–250. Ocho tiradores de texto con escala proporcional en esquinas y un eje en cada tirador central. Chromium con toques emulados verificó X, Y y esquina, conservación de fontSize y tiempo, deshacer/rehacer, persistencia y edición MCP con revisión. Queda la aceptación de edición palabra por palabra y de los casos creativos del Director. |
| MR-01 | Los mattes técnicos siguen excluidos de la selección de canvas por el compositor nativo. Quedan el feather direccional y el menú delante/detrás con matte de sujeto en material real. |
| AU-01 | Menú Audio unificado y grabación VS desde el cabezal. La grabación independiente conserva la fuente y genera forma de onda. La prueba de navegador utilizó micrófono simulado y produjo AAC en el MP4. Quedan las tres filas de música y la prueba con micrófono y sonido reales. |
| FX-01 | Los marcadores nativos tienen estilo dorado. Quedan la interacción final entre clips y la selección auditada de los recursos reales de luz. |
| CE/IL-01 | Referencias y parámetros originales en el checkpoint de iluminación. Aplicados los 18 LUT reales a un fotograma autorizado de Q03 fuera del editor, con [comparativa y métricas](SUES_LUT_QA_20261126.md). Quedan el catálogo activo y los ajustes independientes. |
| QA-01 | MP4 de prueba descargado desde la API nativa de exportación en aislamiento, H.264, 540 × 960, 15 fotogramas, 1,000 s. Decodificación íntegra. La prueba utiliza Chromium con sandbox y usuario sin privilegios. Quedan Pixel físico, sesión autenticada exterior, clip real con audio y doble auditoría perceptual. |

## Versiones, pruebas y recuperación

- Comparación de regresiones FableCut. Base de producción, 372/386. Primera copia candidata, 373/387. Las mismas 14 pruebas fallan por nombre en ambas ejecuciones. Release-check falla en ambas por la divergencia preexistente del manifiesto con dos herramientas de Director. La prueba dirigida final con canvas, persistencia, MCP y exportación pasó por separado.
- Copia recuperable en el VPS en `/opt/sues-video-setup/timeline-live-20261126.Ttd3aS`. Incluye los seis archivos previos, configuración de unidad, checksums, script de reversión y evidencia MP4. Restauración del conjunto anterior probada en copia de archivos y validada con SHA-256. La comprobación crítica de publicación tenía reversión automática.
- Publicación de archivos del editor sobre el servicio habitual sin reiniciarlo. Los proyectos activos, los originales y el sistema de autenticación conservaron sus datos y configuración. El proyecto de prueba vive en un estado aislado.
- Herramientas de prueba existentes, Chromium, Node, FFmpeg, FFprobe y Python. Coste externo 0 €.


## Segundo despliegue · fotogramas en la línea de tiempo

El segundo despliegue publicó el commit [a0b186817448](https://github.com/carlossuess-art/sues-ai-video-editor/commit/a0b1868174481301065cc22755524677d873bd33). La familia V utiliza `/api/frame` de FableCut, con la caché del servidor y hasta 96 miniaturas en memoria del navegador. La extracción de imágenes se limita a sectores visibles y una petición nueva cada vez. La prueba con un bruto de dos segundos validó un fotograma a zoom normal en un clip de un segundo, y cuatro fotogramas a zoom ampliado. Se comprobó la entrada de corte a 0,20 s y se obtuvieron 0,200000 s, 0,466667 s, 0,733333 s y 1,000000 s desde el medio. La regresión de Chromium y la descarga MP4 pasaron en la misma prueba. La reversión al despliegue anterior se comprobó en una copia. Backup, huellas y log en `/opt/sues-video-setup/timeline-filmstrip-live-20261126.YXO4qS`.


## Tercer despliegue · Audio y voz superpuesta

El enlace habitual sirve el commit [4f5c5e80cde8](https://github.com/carlossuess-art/sues-ai-video-editor/commit/4f5c5e80cde8c845246f09689bfda8ba6ccd7eb5). En Añadir → Audio se graba una voz superpuesta, se accede a la música importada y a los efectos sonoros, y se abre la mezcla nativa. El editor inicia la grabación cuando el reloj nativo empieza a avanzar, y pausa el micrófono si se interrumpe la reproducción por carga. Guarda la toma como un clip VS en una pista de audio disponible. La prueba aislada utilizó el micrófono simulado de Chromium, comprobó inicio a 0,20 s, duración 0,30 s, forma de onda, persistencia y fuente conservada. La exportación entregó H.264 a 540 × 960 con 15 fotogramas en 1,000 s y AAC de 0,981 s. El MP4 se descargó y decodificó completo. Backup y prueba de reversión en `/opt/sues-video-setup/timeline-audio-live-20261126.oL63iO`. Los hashes de JavaScript servido y la ruta externa protegida se verificaron tras el despliegue.

El punto de reanudación funcional es TL-01, agrupación de texto y composiciones. MR-01 requiere los nuevos controles de feather y el menú de profundidad. Continúan abiertas las tres filas de M, las transiciones entre clips y la biblioteca de luz, y la integración editable de CE/IL. El cierre QA requiere Pixel físico, el recorrido autenticado y auditoría audiovisual completa con material real. La suite general y release-check mantienen las incidencias documentadas al inicio de esta página.


## Cuarto despliegue · texto y capas de Motion Graphics

La aplicación habitual sirve los recursos de `715152efda2af7763a7207ddfb44378b9810c976`. Los bloques T y ST muestran su propio texto. Un toque corto sobre un bloque editable abre el inspector de texto nativo. La marca nativa de subtítulo (`caption: true`) clasifica la capa como ST aunque el nombre no lleve prefijo. Las composiciones MG tienen un botón para abrir sus capas nativas. El filtro de familia se limpia al entrar para que las capas internas puedan seleccionarse. Arrastrar la composición principal sigue usando su comportamiento nativo y conserva los tiempos internos.

La prueba con toques emulados comprobó edición de un bloque, texto vecino y tiempos conservados, guardado tras recarga, apertura y selección de capa de MG, edición MCP y descarga H.264. La regresión de fotogramas y voz superpuesta pasó por separado con vídeo y AAC. Suite 373/387. Los 14 fallos y la discrepancia del manifiesto ya se habían registrado. La primera comprobación del servidor apuntó a otro servicio y activó la reversión. Se identificó la instancia V1.1 por PID y el segundo despliegue verificó los cuatro recursos byte a byte y el acceso externo protegido. Backup, reversión comprobada y registros en `/opt/sues-video-setup/timeline-text-live-20261126.hY8pdy`.

Siguen abiertos los bloques independientes generados por palabra para subtítulos agrupados, las filas generales T/ST con subfilas por solape, la expansión de MG en la línea principal y la prueba en un Pixel físico. También siguen abiertos máscaras, filas de música, transiciones, color e iluminación.


## Quinto despliegue · subtítulos por palabra

`0cdace0c2ebe7614efc332b8b18316f1840aef55` sirve en el editor habitual. El botón **Subtítulos por palabra**, en Transcripción, usa el generador compartido con `fablecut_captions {words:1}`: un clip por palabra, conservando el inicio. Duración mínima nativa 0,05 s, que permite solapes reales para palabras muy breves. Los subtítulos generados conservan el comportamiento de reemplazo y deshacer del control original. La interfaz reconoce la etiqueta nativa `props.caption` y mantiene la compatibilidad con clips existentes.

Prueba de navegador y API 4/4: tres palabras independientes, dos con inicio en un mismo fotograma a 15 fps, tiempos conservados al guardar, recargar y editar por MCP, y creación equivalente por el comando nativo. Suite 374/388, mismos 14 fallos que producción base (372/386); release-check mantiene la divergencia de manifiesto previa. Backup y reversión comprobada en `/opt/sues-video-setup/timeline-words-live-20261126.1byqai`. Recursos verificados en V1.1 y acceso exterior protegido. Restan agrupación, solapes plegables e inspección audiovisual con grabación y móvil reales.


## Sexto despliegue · subfilas de texto por solape

`229d9e7ec4fa6f024b00baaea9403d8a54c5a55d` sirve en el editor habitual. Si se selecciona un bloque de texto de una fila homogénea T o ST y su intervalo se cruza con otros, la fila presenta las subfilas estrictamente necesarias y deja visibles los textos de la intersección. Se pliega al salir del grupo. El ajuste es visual: conserva tiempos, pistas nativas, posiciones en canvas y capacidad de edición por MCP. Las pistas mixtas y la edición de escritorio mantienen su disposición. Cada grupo opera dentro de su pista nativa. Sigue pendiente una fila general que agrupe varios tracks de la misma familia.

Pruebas dirigidas 4/4, entre ellas dos palabras solapadas, alineación entre encabezado y línea de tiempo, plegado al seleccionar un texto sin solape y persistencia. Suite 374/388 con los mismos 14 fallos de base. Backup y reversión comprobados en `/opt/sues-video-setup/timeline-overlap-live-20261126.eiRmb7`. Recursos de V1.1 verificados y enlace exterior protegido.
