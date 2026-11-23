# SUES · Reel Q03 · Ajuste final corazón + identidad sonora · 23/11/2026

**Estado:** EDICIÓN EJECUTADA Y EXPORTACIÓN TÉCNICA VERIFICADA en QA aislada; **pendientes** audición integral, dos pasadas artísticas y aprobación expresa de Carlos. No publicado. **No confundir con editor V1 terminado**.

## Fuente y revisión
- Proyecto existente `SUES QA R14 COMPLETO 55s`, ID `p_fa692c8119`, 1080 × 1920, 30 fps, 55,566667 s. Stage VPS srv1841004: `/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122`.
- Edición Q03 **r42**: lectura CAS tras cada guardado, r39→r40 (audio/corazón)→r41 (tamaño/posición corazón), autosaves hasta revisión técnica **45** sin cambios semánticos contrastados contra backup previo. 132 clips; originales, 56 composiciones, voz, zoom y tracks ajenos intactos.
- Backups en `data/analysis/q03-rev39-before-final-tuning-r41.json` y `q03-rev40-before-heart-safe-r42.json`; informes `q03-final-tuning-r41-report.json` y `q03-heart-safe-r42-report.json`. No borrar.

## Cambios creativos exactos
- `SC12-HEART-360-ALPHA`: **53,166667–54,200 s**, escala 0,65; posición x=-375, y=-360; opacity y escala con entrada/salida animadas. Corazón termina **0,20 s antes** del CTA visual a 54,40 s. Fotograma 53,80 s comprobado sobre render nuevo: corazón completo a la izquierda, sin tapar cara; la muestra antigua del r38 sí interfería. Mantener la fuente alpha original.
- `MUSIC-01` Soul Brass `Midnight at the Plaza`: **0–12,40 s**, ganancia del clip 0,29, inicio inmediato, salida progresiva 1,25 s. `MUSIC-02` tensión desde 11,15 hasta 35,20 s (transición solapada); pista de tensión sigue **provisional**.
- `V12-CELESTIAL` agua instrumental de Carlos para conciencia: 34,5333–44,100 s, volumen 0,26 frente a 0,175 previo (aprox. +3,44 dB antes de nivel global), fade-out 1,8 s; el recurso QA disponible es de 9,7 s. Reggae-funk `MUSIC-03` permanece en revelación/promesa/CTA y voz/SFX restantes intactos.

## Evidencias de exportación
- Tras detectar el límite QA `TasksMax=200` (cgroup `pids.events max=23`, FFmpeg `EAGAIN`), se elevó **solo temporalmente en QA** a `TasksMax=400` mediante `systemctl set-property --runtime sues-q03-pixel-qa.service TasksMax=400`. No cambiar ni elevar producción. Revisar carga/limitación al retomar.
- El exportador frío invalidó la caché de vídeo global por cambios de audio; se optó por montaje verificable: prefijo **1560 fotogramas/52 s** copiado por bitstream del máster visual anterior y nueva ventana FableCut **107 fotogramas** (`x_51n2pcf8`, 52,000–55,5667 s). Solo la zona con el corazón se vuelve a codificar.
- La cola nueva tenía B-frames; el primer concat dio 1667 frames pero duración incorrecta 55,50 s. Corregido recodificando **solo los 107 frames finales** H.264 de alta calidad sin B-frames y remultiplexando el vídeo. Verificación FFprobe final: **1667 frames**, **1080×1920**, **30/1 fps**, **55,566667 s**, sin pérdida de frames ni desfase declarado.
- Audio mixto nativo FableCut `x_kexzurc5` DONE: `SUES_fullmix_x_kexzurc5.wav`, **55,566688 s**, estéreo **48 kHz**, 10668848 bytes. Mux de vídeo copiado y audio AAC 192 kbps con ajuste global 0,90 para mantener margen; pico medido del MP4 **-0,9 dBFS**, sin saturación cuantizada.
- **HD:** `data/exports/SUES_Q03_AJUSTE_FINAL_r42_HD.mp4`, **107905215 bytes**, SHA256 `90ff051dce41e439faedc51d8126362bebc819a4b896da8a5c9375c9dc22e144`.
- **Preview:** `data/exports/SUES_Q03_AJUSTE_FINAL_r42_540x960_15fps.mp4`, **10109012 bytes**, SHA256 `48d01a2608077111e9384b7ac869a54bf888347c95f03763b838a57ca66064ad`, 540×960/15 fps/834 frames.
- Validaciones: metadata FFprobe HD y preview, audio `volumedetect`, rango parcial HTTP local **206/16384 bytes** y ruta HTTPS externa protegida **302 a /login sin sesión**. El panel `app/qa.html` queda vinculado a las nuevas dos salidas y fingerprint `b5493e07ee7485c2b3d484303a96347ba2feadea4593b5174328fa3f0a07724a`. El endpoint y el acceso son privados.
- El MCP de la consola impuso límite de tamaño de archivo en comandos interactivos; el ensamblado/preview se ejecutó en **servicios transitorios aislados** con usuario `suesnle` y `LimitFSIZE=infinity`, comprobando sus exit codes. No gastar créditos externos ni copiar medios privados a GitHub.
- Interfaz QA y controles manuales `experiments/export-window-reuse-20261122/integrated/qa.html`, `qa-tune.js` sincronizados en la rama de este checkpoint. La edición visual sigue viviendo en el stage privado del servidor; **no es un despliegue de producción**.

## Enlaces y siguiente paso
- Panel: https://studio.suesholistics.com:8443/q03-export-qa/qa.html?r42
- Preview: https://studio.suesholistics.com:8443/q03-export-qa/exports/SUES_Q03_AJUSTE_FINAL_r42_540x960_15fps.mp4
- HD: https://studio.suesholistics.com:8443/q03-export-qa/exports/SUES_Q03_AJUSTE_FINAL_r42_HD.mp4
- Google Drive: `00_SUES · REGISTRO PRIVADO DE CONTINUIDAD Y ACCESOS · APPS` y `SUES AI VIDEO EDITOR · ROADMAP MAESTRO Y ESTADO` actualizados y verificados.
- **Pendiente Carlos:** visualizar/escuchar el MP4 completo (móvil y auriculares), ajustar si observa una interferencia, realizar dos revisiones artísticas independientes y aprobar el resultado. No publicar ni cambiar V29/WAC/DNS/producción sin permiso; verificar términos de licencia de Suno Free para eventual publicación.