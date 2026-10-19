# Reproductor persistente, previsualización y exportación · 19/10/2026

Esta decisión de Carlos sustituye al recorrido de paneles separados de PR5:
el vídeo debe permanecer visible, con herramientas debajo en móvil y ayuda del
siguiente paso. Antes de exportar tiene que poder reproducir el montaje completo.

## Problemas encontrados

El original no tenía una ruta de reproducción y el único reproductor estaba
oculto hasta DONE. La subida podía reutilizar la selección anterior del material
cuando el nuevo vídeo no tenía análisis, aunque los bindings del motor impedían
heredar una transcripción en el backend. La interfaz hacía confuso ese límite.
Previsualizar y exportar compartían una única acción visible.

La web publicada se abrió en el navegador remoto y mostró el recorrido de PR5,
pero pidió sesión. Carlos no podía completar el acceso en ese navegador. No se
inspeccionaron sus trabajos privados ni se afirmó reproducir su exportación VPS.
Se usó una copia local del mismo repositorio con vídeo sintético autorizado para
pruebas, etiquetas editoriales explícitas y sin ASR o modelos nuevos.

## Comportamiento actual

- El original se puede reproducir al seleccionar un archivo, antes de subirlo.
- La subida confirmada muestra nombre, tamaño y estado. El original guardado
  sigue siendo reproducible al recargar, mediante acceso privado con Range. Se recuerda la última subida
  para evitar reabrir automáticamente otro montaje cuando falta su análisis.
- Un vídeo sin análisis muestra su propio original y desactiva la edición;
  limpia la transcripción anterior y deselecciona el otro material preparado.
- El reproductor permanece presente al cambiar Vídeo, Estilo, Texto, Sonido
  o Imágenes. En móvil, el área de herramientas tiene su propio desplazamiento.
- Original y Montaje son vistas diferenciadas. La barra nativa permite play,
  pausa, búsqueda y pantalla completa.
- Previsualizar genera el montaje completo con el renderer existente y lo
  muestra al terminar. Se comunica el progreso; no es una simulación instantánea.
- Exportar MP4 se habilita sólo cuando existe una previsualización vigente.
  Descarga exactamente ese archivo; no vuelve a renderizar una versión sin cambios.
- Editar deshabilita Exportar y marca la previsualización anterior como pendiente
  de actualizar. La nueva previsualización crea otra versión y conserva la previa.
- Guardar, duplicar, imágenes y copias conservan las entradas modificadas al crear
  la nueva versión. No cambia el contrato de estados persistidos del servidor.

No se exige reproducir cada segundo para habilitar Exportar; la decisión es del
usuario. La existencia técnica de una vista previa no registra aprobación humana.
Al cambiar estilo o agrupación se prepara el nuevo plan antes de elegir
ELEMENTS; los textos previos se conservan en una versión recuperable con Deshacer.
La preparación usa los análisis existentes y no renderiza ni cobra inferencias.

Los vídeos cuyo códec no reproduce el navegador muestran una explicación; cuando
tienen análisis, el montaje H264 puede seguir generándose con el motor existente.

## Seguridad y verificación

Los originales se sirven sólo bajo la API autenticada existente. Hashes, archivos
regulares, tamaño, límites, Host/Origin y rutas registradas se mantienen. Una fuente
que cambió desde preparar el trabajo se rechaza. No hay rutas libres del filesystem,
URLs externas ni nuevos servicios. El CSP permite blob para archivos elegidos
localmente, además de medios del mismo origen. Los blobs se liberan al sustituirlos.

211 tests Node y comprobación de sintaxis; dos pruebas nuevas cubren originales,
autenticación, Range/HEAD/416, binding/tampering, nombre y vídeo nuevo sin análisis.
Las diez simulaciones de despliegue existentes siguen pasando.

Prueba de desarrollo con Chromium145 en 1440×1000 y393×852: seleccionar/reproducir,
subir/reproducir, recargar/reproducir, fuente desconocida sin texto ajeno, herramientas
con vídeo presente, montaje reproducible, bloqueo de exportación antes de la vista
previa y tras editar, descarga SHA idéntica y sin nuevo intento de render. Tres
renders finales de24s, decodificación y fuente intacta; actualización de vista previa
en otra versión conservando la anterior. Sin erroresJS ni desbordamiento horizontal.
El vídeo y las etiquetas son de QA, no prueba de un nuevo análisis de voz.

La primera revisión visual encontró un contenedor que dejaba crecer el vídeo más
que la ventana; se corrigieron las restricciones de flex/grid y se añadieron
comprobaciones de posición del reproductor y herramientas. Los intentos de prueba
que cerraron antes del render no se presentan como exportaciones correctas.

Evidencia: `examples/preview/player-workflow.real-result.json`.
Prueba opcional: `scripts/app/smoke_player_workflow.mjs PROJECT SOURCE NEW_OUTPUT`
con SUES_PLAYWRIGHT_MODULE y SUES_CHROMIUM_PATH. No son dependencias de producción.
Las pruebas locales no demuestran la instalación ni la exportación en el VPS.


Pruebas adicionales en ambos tamaños verifican cambio de fuente con transcripción
previa, recarga sin volver al texto ajeno, y nueva subida conocida lista. También
cambiar estilo con un texto sin guardar, deshacer recuperando ese texto y configurar
LIST después del estilo sin que se borre al guardar. Script reproducible:
`scripts/app/smoke_player_grouping.mjs PROJECT NEW_OUTPUT`, con el mismo navegador.

Demostración de interfaz de10,8s: reproducción del montaje y del original y cambio
de herramientas sobre el vídeo sintético, sin nueva recodificación del montaje.
Se conserva como SUES_EDITOR_PREVISUALIZACION_DEMO.mp4, no es un Reel del usuario
ni una muestra de aceptación estética. La grabación de pantalla no incluye sonido.
