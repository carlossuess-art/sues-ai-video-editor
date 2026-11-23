# SUES AI VIDEO EDITOR · Cuello de botella de exportación R14

**Fecha:** 22/11/2026 (Europe/Madrid). **Estado:** INVESTIGACIÓN Y CORRECCIÓN AISLADA, **NO RESUELTO**, **NO PUBLICADO**.

**Prioridad operativa:** conseguir una exportación y descarga completas, fiables y suficientemente rápidas desde la interfaz de FableCut Studio. No cerrar Q03/Q04/Q05 ni anunciar la V1 terminada por superar pruebas cortas.

## Proyecto y fuente verificados

- Reutilizar el repositorio `carlossuess-art/sues-ai-video-editor`, PR #27, y FableCut existente. No crear un segundo editor ni alterar WAC, V29, proyectos publicados u originales.
- Proyecto de referencia actual **SUES · CONCIENCIA · PRUEBA R14**: 55,5667 s, 165 clips, 37 medios, 1080 × 1920, 30 fps. Original privado en `/var/lib/sues-v11-preview`, usado solo para lectura.
- VPS `srv1841004`: 1 vCPU, aproximadamente 4 GB RAM; el 22/11 quedaban unos 6,1–6,2 GB de disco.
- Entorno QA nuevo y acotado: `/opt/sues-video-setup/export-perf-20261122`. Las fuentes multimedia se leen mediante enlaces internos; la exportación se guarda en carpeta privada distinta.

## Resultados reproducidos

| Ensayo | Contenido | Resultado |
| --- | --- | --- |
| Fast/JPEG→FFmpeg normal | 2 s, 60 frames, salida 720 × 1280 | 46,211 s en primera ejecución, 37,042 s repetida; MP4 válido |
| Caché conservadora de composición de textos estáticos | Mismo clip, mismo perfil | 36,104 s; vídeo decodificado **PSNR infinito**, fotogramas idénticos al control; ganancia modesta |
| WebCodecs→H.264 Annex B→remux FFmpeg | 2 s, 60 frames, salida **1080 × 1920** | 26,830 s, MP4 AAC válido |
| **Botón real Descarga → Normal** con selección WebCodecs si compatible | Mismo clip 1080 × 1920 | 26,703 s de render, enlace `/exports/` HTTP 200, 1.606.149 bytes |
| Integridad audiovisual WebCodecs | Archivo de 2 s | 60/60 frames H.264, AAC 48 kHz estéreo, audio no silencioso (-15,6 dB media); ffmpeg decodificación completa PASS |
| Cancelación real de UI ante promesa de medios bloqueada intencionalmente | Progreso 10 %, exportación WebCodecs | PASS tras corregir espera abortable y reactivar botón. Estado exportando/renderizando falso, overlay oculto, botón de cancelación habilitado. Es una prueba con bloqueo inyectado, no una exportación completa. |

**Importante:** 26–27 segundos para 2 segundos de material aún es demasiado lento. No proyectar sin medir el coste del vídeo completo ni afirmar que el problema del 11 % está solucionado.

## Código y aislamiento

- Copia previa sin cambios: `/opt/sues-video-setup/export-perf-20261122/app-before-staticcomp.js`.
- Parches reproducibles dentro del directorio QA: `patch-static-comps.py`, `patch-webcodecs-ui.py`, `patch-webcodecs-cancel.py`, `patch-webcodecs-cancel-button.py`.
- Modifican **solo** `/opt/sues-video-setup/v1_1-mobile-20261121/stage/app.js`. `node --check` PASS.
- Se conserva `/srv/sues-fablecut-next/app/app.js` y `/srv/sues-fablecut-next/preview-v11/app/app.js` sin estos parches. No se ha publicado ni integrado en la rama de PR #27.
- El MCP Hostinger aplica un límite duro `ulimit -Hf 1024` por archivo al ejecutar directamente comandos: una escritura de `app.js` de más de 1 MiB causó truncamiento transitorio; se restauró inmediatamente la copia íntegra y el SHA de desarrollo, con `node --check` correcto. Los parches posteriores se aplicaron mediante unidades `systemd-run --wait` que no heredaron ese límite. Antes de cualquier nuevo parche verificar hash/tamaño y sintaxis.
- El compositor actual dibuja por frame en navegador. La prueba profilada de 2 s consume aproximadamente 14–15 segundos solo en `drawFrame`, 5 segundos en seeking/decodificación y más tiempo en encoder/audio/upload. El uso de WebCodecs evita JPEG por fotograma y la recodificación H.264 de FFmpeg, pero no evita el trabajo del compositor.

## Prueba de 55,5667 s lanzada (no confundir con PASS)

Desde el 22/11, alrededor de las 09:50 UTC, hay una prueba completa **en curso** en una instancia privada, fuera de producción.

- FableCut QA: `sues-export-fullserver-20261122.service`, puerto loopback **17906**, CPUQuota 20 %, MemoryMax 700 MB.
- Navegador Chromium QA: `sues-export-fullchrome-20261122.service`, CDP loopback **17901**, CPUQuota 50 %, MemoryMax 1.700 MB, Nice 10.
- Script de prueba: `sues-full-export-qa-20261122.service`, fuente `/opt/sues-video-setup/export-perf-20261122/full/qa-full-export.cjs`, resultados `qa-full-export.json` si termina, progreso por `journalctl -u sues-full-export-qa-20261122`.
- El arranque verificó proyecto real clonado de **165 clips** y primera fase de mezcla de audio; aún **no** existe resultado íntegro acreditado. Un navegador Chrome adicional sin exportación se cerró después de comprobar su estado para ahorrar RAM.
- Los servicios temporales tienen `RuntimeMaxSec=7200`; revisar su estado y logs antes de repetir, no solapar trabajos.

## Siguiente acción prioritaria

1. Consultar resultados de `sues-full-export-qa-20261122` y, si hay MP4 completo, verificar ffprobe, número de frames, duración, AAC, audio audible, decodificación íntegra y descarga por navegador real. Registrar segundos totales y identificar cualquier tramo estancado; **no marcar éxito antes de comprobar todo**.
2. Si sigue siendo lento, no continuar subiendo watchdogs; optimizar/componer por segmentos reutilizables, buscar más rutas nativas y evitar repintar capas inmutables. Registrar tiempos por etapa y probar con el mismo material.
3. Acreditar la **ruta WebCodecs de Descarga → Normal** en proyecto completo, móvil real y con una política de fallback, sin degradar los perfiles restantes; asegurar cancelación y limpieza de sesiones.
4. Una vez superada la prueba completa y revisados los aspectos audiovisuales, integrar con PR #27, desplegar con rollback y realizar la doble revisión audiovisual, pruebas móviles y aceptación de Carlos. Solo entonces actualizar Roadmap y Estado General como finalizados.

**Regla:** código preparado, prueba corta correcta, salida MP4 privada, despliegue público y aceptación de V1 son estados distintos.