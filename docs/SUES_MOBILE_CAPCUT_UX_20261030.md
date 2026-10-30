# 30/10/2026 · SUES manual mobile UX · navegación en pantalla única

Proyecto existente SUES AI VIDEO EDITOR. Rama feat/mobile-capcut-navigation-20261030. Base REAL de producción inspeccionada: cb7ec1a75451932778fc7295e09824fb6a615ccc; cambios posteriores de esa release preservados al integrar el commit (merge 3528e87). No tocar ramas HeyGen ni Gemini.

## Implementado en rama
- Editor móvil con vídeo arriba y timeline manual inmediatamente debajo, incluso al seleccionar subtítulo, B-roll o un tramo principal. Menú de 8 categorías distribuido en 4x2 sin scroll vertical; elemento seleccionado abre opciones contextuales inferiores con botón Volver.
- Inspector paginado por campos/submenús (Anterior/Siguiente), sin formularios verticales debajo del timeline; propiedades aplicadas sobre el borrador existente.
- Play circular superpuesto; tocar una zona libre del vídeo alterna reproducir/pausar, pero los gestos de capa no lo activan. El Play reutiliza el controlador de audio de la vista en vivo; corrección de carrera asíncrona al tocar rápidamente.
- Scrub horizontal con playhead central y sincronización de reproducción. Interacción deliberada fuera de bloques pausa para permitir buscar el momento.
- Bloques B-roll con mover y tiradores temporales, límites del recurso conservados. Fix de error de redondeo decimal en duración mínima 2,5 s; cambios siguen siendo no destructivos/deshacibles.
- Gestos originales de arrastrar/pellizcar subtítulos y máscaras conservados. No acercamiento automático a 1,5x al seleccionar. Ocultada la segunda barra redundante de reproducción. Avisos informativos del preview se ocultan tras 6,5 s; los errores permanecen.
- Uso de VisualViewport para ajustar área editable ante teclado en móvil, bajo límites razonables.
- Se conservan borrador local, deshacer, corte del montaje sin aplanar capas, backups de proyecto, recuperaciones y motor audiovisual. Estos cambios no modifican contratos de backend ni exportación.

## Evidencia QA aislada (sin cambios en producción)
- /opt/sues-video-setup/manual-ux-review-20261029/candidate-check.json y capturas candidate-{393,412}-{initial,caption}.png
- 393x852, 412x915: vídeo/timeline/herramientas dentro del viewport y sin scroll vertical, selección y vuelta.
- candidate-repeat-final.log: 10/10 rondas en cada tamaño, 20 secuencias de navegación; sin errores JS ni mutación de settings del proyecto.
- candidate-gestures-final.log: 10/10 reproducción/pausa, scrub, drag de subtítulo y deshacer.
- candidate-broll-final.log: 10/10 B-roll desplazado y deshecho.
- candidate-broll-trim-final.log: 10/10 recorte alternando extremos y deshecho.
- candidate-stress-final.log y candidate-stress-result.json: 10/10 pellizco, color, play; avance temporal en todas las rondas; 0 errores JS, viewport sin desbordamiento, proyecto servidor intacto. 49 long tasks, máximo 268 ms en emulación; 3 ERR_ABORTED al cambiar fuentes/previews, no equivalentes a congelación del teléfono.
- candidate-keyboard.log: prueba de área visible reducida a 550 px en Chromium, no equivale a abrir el teclado nativo en el teléfono.
- 14/14 tests seleccionados de render/timeline en FFmpeg disponibles usando contenedor aislado; suite integral separada pendiente de resultado.
- REVISIÓN VISUAL: imágenes privadas inspeccionadas; barra redundante y zoom automático eliminados tras detectar ambos en captura.

## Límites no resueltos
- No existe un manipulador visual libre para mover/redimensionar cualquier imagen o gráfico como sí sucede con los subtítulos; soporte de imagen requiere nuevos campos y renderer para no engañar a usuario. Ningún control de ese tipo se muestra como funcional.
- La preview interactiva mantiene limitaciones anteriores para algunas transiciones/fundidos; usar 'Ver fragmento' y render final. Este bloque reduce bloqueos de navegación, pero no acredita ausencia de tirones en un móvil físico.
- Teclado nativo Android/iOS, sesiones continuadas en hardware y exportación real tras editar desde esta nueva UI todavía necesitan verificación específica. No elevar aceptación V1 ni el porcentaje global por este cambio.
- A la fecha de redacción, producción usa contenedor sues-video-editor con montaje /app de /opt/sues-video-setup/release-update.mvl0mllf (cb7ec1a). No confundir con directorios release-update anteriores.

## Publicación segura
- Antes de deploy: confirmar 0 trabajos activos, ausencia de renders/analizadores intensivos, backup de archivos y manifiesto SHA; publicar solo archivos web probados por reemplazo atómico o release versionada y verificar públicamente por URL/hashes. Mantener reversión inmediata; no reiniciar otros servicios.
- Actualizar PROJECT_STATUS y Roadmap con resultado real final; GitHub rama independiente. No fusionar HeyGen.


## 30/10/2026 · Resultado final · HOTPATCH EN PRODUCCIÓN, REVERSIBLE
La release activa verificada es /opt/sues-video-setup/release-update.mvl0mllf (commit base cb7ec1a). Docker monta este directorio como /app en modo read-only; tres archivos estáticos reemplazados ATÓMICAMENTE en el host, sin reiniciar contenedor ni servicios. Antes se verificaron cero jobs activos y ausencia de renders. Copia íntegra predespliegue + SHA256SUMS comprobada en /opt/sues-video-setup/manual-ux-review-20261029/rollback-mobile-20261030. Producción: manual-adjust.js SHA256 436a652719145b1f178976ab8c2a360968692a87d8f14a9568bbca7256015ba5; manual-adjust.css a26ff14048e596e6c45892a3e051a42028a6fc1dc3dae6bddab2c64144b12dc4; live-preview.js 4040614c48073fbdf1969d5f61586157dc12d01d1502779581e4bcd39b7ec7bb. HTTPS 200, contenedor siguió activo; directorio release muestra tres archivos modificados respecto a Git base por hotpatch. No inferir que Git main fue fusionado.

Navegador Chromium real, contra URL pública y SIN interceptar archivos: 393×852 y 412×915, 10 rondas por tamaño sin scroll vertical, vídeo+timeline simultáneos y sin errores JS; 10 rondas play/pausa, scrub, mover subtítulo y deshacer; 10 rondas mover B-roll y deshacer; 10 rondas recorte B-roll por los dos tiradores y deshacer. Estado del proyecto del servidor idéntico antes/después. Pruebas aisladas adicionales 10/10 pellizco, color y reproducción; 14/14 tests FFmpeg de montaje/timeline. Suite general 407/425 PASS en contenedor read-only sin cuota de /tmp; los 18 FAIL se concentraron en pruebas de upload/recuperación y permisos de ejecución por aislamiento. No comparar con una suite full en entorno normal ni afirmar 100%.

LIMITACIONES: Falta gesto libre de mover/pellizcar imágenes y otros gráficos; teclado físico Android/iOS, exportación real causada desde esta nueva vista y rendimiento en móvil real no verificados. No afirmar UX íntegramente terminada ni V1 aceptada. No tocar HeyGen/Gemini. Próximo bloque: completar operaciones de imágenes/gráficos con contrato render comprobado, después prueba Android física + export final comparada.
