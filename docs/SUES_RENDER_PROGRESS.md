# Progreso real y comprobación previa

FFmpeg escribe ffmpeg-progress.txt en el directorio privado de cada intento. El
coordinador lee como máximo64KiB finales, interpreta out_time_us/out_time, frame,
speed y progress, y expone únicamente valores saneados al cliente.

El porcentaje es tiempo de salida procesado/duración, limitado0..99 mientras
RENDERING. progress=end lleva a etapaverifying, no aDONE: quedan decodificación,
hashes y archivo privado. Guardando/reintentar guardado mantienen99; sóloDONE da100.
Cola0, fallo/cancelación sin porcentaje de éxito. Reporte aún ausente→0/preparación;
no se inventa avance ni estimación de tiempo restante.

La UI tiene progress accesible, texto de render/comprobación/guardado, botón de
reintento del guardado y conteos de procesamiento/cola/guardado. Esto ha sido probado
por API y por datos reales de FFmpeg; el navegador cloud no alcanza loopback, por
lo que la revisión visual y la instalaciónPWA siguen pendientes.

GET/api/health requiere la misma sesión/Origin/Host que el resto de API y devuelve
sólo modo local, estado del coordinador, contadores y tipo de storage. No sondea
FFmpeg ni la fuente en cada petición; no confundir disponibilidadAPI con readiness
completa del entorno. No expone paths, tokens, vídeos ni configuración cargada.

Diagnóstico explícito sin costes o render:

```
npm run editor:doctor -- CONFIG
```

Verifica Node22+, Python, FFmpeg/ffprobe, fuente/hash y metadatos con rotación/audio,
plan/captions, familiaOpenSans400/700 con licencia y filtros necesarios. Sólo lee
archivos/ejecutables locales; no repiteASR/visión ni llama proveedores. Sale0si está
listo para preview local y1si falta algo. No imprime config, transcript completo,
credenciales ni paths de archivos en errores de comandos.

Validado17/10 con proyecto realCarlos: duración38,31,16captions,0palabras omitidas,
1080×1920 tras rotación, audio y fuentes correctos. Registro sin paths en
examples/preview/editor-doctor.real-result.json.

Cuatro pruebas nuevas de progreso: avance por tiempo, fin de codificación sin falso
100, valores malformados/extremos, lectura acotada/symlinks/ausencia y etapas de
coordinador. Suite129 tests. Health auth y contadores cubiertos por tests existentes.

Smoke real: dos exportaciones sintéticas12s,360frames, reporte11,989333s; observados
queued/rendering/verifying/complete. Archivo/auditoría/Range y recuperación tras
retirar los temporales y reiniciar pasan sin otros renders. SHA de MP4 idéntico al
fixture anterior: añadir reporte/nostats no cambia contenido de codificación. Ver
examples/preview/render-progress.synthetic-result.json.

El cambio del script Python modifica el fingerprint del motor. Trabajos preparados
con motor anterior que aún no se han renderizado requieren versión nueva; no se
reconstruyen o exportan silenciosamente. LosDONE existentes y guardados válidos
siguen accesibles por sus referencias, con el vídeo de Carlos conservado.
