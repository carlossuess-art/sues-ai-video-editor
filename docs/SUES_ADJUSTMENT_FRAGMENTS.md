# Fragmentos del borrador · V1 asistida

Desde Ajustar, seleccionar un elemento y pulsar Ver fragmento de ajuste. El editor prepara 4 segundos alrededor del inicio del elemento; si no hay selección, usa la posición del reproductor. Los ajustes se aplican con el mismo compositor y mezcla que la exportación. La ventana es 540×960 y no sustituye al vídeo completo. Para publicar, Guardar y generar versión, revisar, Validar y elegir 720p o 1080p.

El render no se inicia al mover cada control. Puede necesitar procesar la parte anterior de la línea temporal para conservar sincronía de cortes, recursos y audio; no es reproducción instantánea por capas. El diálogo permite cancelar sin perder el borrador. El reproductor principal mantiene la última versión exportada. Las decisiones y versiones anteriores permanecen intactas.

## API privada

`POST /api/jobs/:id/adjust-preview`: cuerpo `{fingerprint, settings, start, duration}`. Se requiere un padre DONE, fingerprint actual, ajustes válidos, inicio dentro del montaje y duración de 0,5–8 segundos. Los tiempos se alinean a 30 fps y se limitan al final del montaje. Respuesta 202 con key, estado, tiempos, fingerprint de ajustes y `isFinalExport:false`.

`GET /api/jobs/:id/adjust-preview?key=…`: estado RUNNING, READY, FAILED, CANCELLED o INTERRUPTED. `GET/HEAD` con `&media=1` transmite el MP4 y acepta Range. `DELETE` con key cancela el proceso. Todas las rutas exigen la sesión privada existente; no hay credenciales nuevas ni llamadas a un modelo.

El identificador SHA256 liga padre, fingerprint de ajustes y ventana. La caché conserva hasta cuatro ventanas; comprueba bytes y SHA antes de servir. Una solicitud idéntica reutiliza el trabajo activo o completado. Los procesos interrumpidos se pueden solicitar de nuevo. Plazo máximo de proceso: 15 minutos. Render, publicación, pósters o generación activa de proxy impiden iniciar el fragmento. El renderer final rechaza cualquier auditoría de fragmento.

## Verificación

`tests/adjustment-previews.test.js`: audio sintético 440/880 Hz, recorte 4–6 s y fragmento remapeado de 2 s; comprueba predominio de 880 Hz, dimensiones/duración, auth, Range, fingerprint obsoleto, ventana inválida, deduplicación, bloqueo de render, conservación de original/ajustes, recuperación de caché, cancelación y rechazo como exportación final.

Prueba real de móvil/escritorio: modificar el primer caption, generar el fragmento, verificar 540×960/4 s y fotograma «PRUEBA DE AJUSTE», mantener el borrador y la exportación bloqueada. Evidencias privadas en `/opt/sues-video-setup/v1-assisted-preview-qa-20261028`; medios y credenciales excluidos del repositorio. No se ha simulado una aceptación creativa del propietario.
