# Edición móvil en vivo y PWA · 29/10/2026

Estado de trabajo: validación aislada terminada; pendiente despliegue público. Producción conserva el bloque táctil 697837b y la documentación b2f3244. Rama de desarrollo feat/live-mobile-preview-20261029 en /opt/sues-video-setup/touch-editor-work-20261028.

Carlos detectó que el marco azul cambiaba pero el subtítulo del MP4 ya quemado no. Se separa una base limpia del proyecto (540×960, voz original), los subtítulos y gráficos compilados con el ASS real y libass WASM local, y la composición interactiva de recursos/máscara. El render final sigue siendo el pipeline FFmpeg existente. No es un segundo plan ni un render final del navegador.

Cache del servidor: máximo dos bases en total, identificadas por proyecto/encuadre, recursos originales por ID; no descarga masiva ni modificación de fuentes. Preparación primera base observada 86–88 s con CPU limitada. Cambiar texto/color/transformación reutiliza esa base. ASS original, tipografías instaladas, marco ligado a píxeles. Durante gesto se transforma el texto real y al llegar raster nuevo se elimina la transformación temporal para evitar doble escala. Volúmenes son audición interactiva; mezcla final se verifica en fragmento. Transiciones, fundido final, capas subjectLayers heredadas, ambientOverlays importados y filtros de voz avisan que necesitan Ver fragmento.

Interfaz móvil: vista superior conservada, botones legibles, chips por palabra, tamaño global, color y tamaño de palabra; parámetros de máscara y ajustes secundarios plegados. Alternancia Línea de tiempo / Propiedades. Aplicar cambios crea versión; anteriores y original intactos. La división de la pista principal de una edición ya generada sigue pendiente.

PWA: manifiesto con PNG192/512 y maskable, apple-touch-icon180, botón Instalar app y ayuda iOS; standalone y áreas seguras. Se corrigió manifest-src en CSP. Service worker sólo guarda shell y código estático local. Nunca API, vídeos, fuentes privadas, credenciales ni recursos de proyectos. Requiere conexión para editar/Drive.

Evidencia privada en /opt/sues-video-setup/live-mobile-qa-20261029; no subir material ni live-context.json a Git. browser-live.mjs prueba pellizco con CDP y píxeles libass; browser-controls.mjs amplía a color/tamaño/máscara/reproducción. browser-pwa.mjs comprueba manifiesto real con CDP en contexto persistente, installabilityErrors vacío, shell offline y ausencia de API en cache. Instalación física en el móvil no ejecutada. Suite motor inicial:414/414 más2/2 despliegue Git en host. Repetir checks afectados tras correcciones nuevas.

Resultados: browser-controls PASS: píxeles de texto aumentan de ancho130 a199 tras pellizco1,5; cambio cian y palabra1,45 alteran raster; máscara1200/600/40 modifica píxeles con cada control; Play y selección funcionan sin erroresJS ni overflow. Se separaron en filas los elementos solapados para poder tocarlos. Fragmento real48,3–52,3 generado y reproducible desde el botón. Las11 pruebas afectadas pasan tras las correcciones. PWA CDP PASS sin errores de instalabilidad.

Siguiente acción: publicar commit y comparar hashes antes de desplegar, backup incremental de archivos modificados y smoke público. No Gemini, proveedores nuevos ni gastos externos.
