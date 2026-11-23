# SUES AI VIDEO EDITOR · Q03 r35 · Croma narrativo de los dos cerebros · 23/11/2026

## Instrucción del usuario y ubicación exacta

La animación de dos cerebros con espejo y fondo verde enviada por Carlos (164226.mp4) **NO va sobre el telescopio ni en 32–35 s**. Debe insertarse justo tras «¿Sabías que tu cerebro puede discutir?», al empezar «consigo mismo», hasta que acabe «y lo curioso». Se recuperaron los tiempos de la narración *del proyecto*, no de supuestos:

- **1,867–2,400 s:** «DISCUTIR».
- **2,400–3,167 s:** «consigo mismo».
- **3,167–4,200 s:** «y lo CURIOSO».
- **4,200–4,500 s:** «es».
- Por tanto, aparición **2,400–4,200 s (54 fotogramas de timeline a 30 fps)**.
- El título inicial `SC01-TITLE` empieza en 0,033333 s y antes duraba 3,866667 s (hasta 3,900). Se recorta en el mismo clip editable a **2,366667 s**, terminando exactamente en **2,400 s**. Se eliminan keyframes fuera de la nueva duración. No se altera ni mueve el inicio de la voz.

## Integración en el editor FableCut existente (solo QA)

Proyecto existente `SUES QA R14 COMPLETO 55s`, copia privada en `/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122/data/project.json`, revisión **32→33**, API `PUT /api/project` con control de revisión y readback de identidad JSON. Backup de la revisión anterior bajo `data/analysis/q03-r32-before-brains-overlay.json`. No crear editor, proyecto ni motor nuevo, no alterar WAC, V29 ni producción.

Fuente: vídeo usuario `164226.mp4`, 1280×720 H264/24fps, duración10,026667 s, 4.704.443 bytes, SHA256 **`e29dee44c2f4083353a5b523ae7f4ee7016338fee5913e4a214d103ba6ff2c77`**. Guardado PRIVADO en Drive del usuario https://drive.google.com/file/d/1Hqbp7bR8iujPIKWA817cAcrCbNOjnpYq/view y copiado al VPS por enlace firmado temporal vía conector (no hacer público Drive). Asset conservado como `data/media/r14-brains-green-original.mp4`; SHA comprobado exacto.

Clip nuevo, reutilizando el motor de croma original FableCut: `SC01-BRAIN-MIRROR-CHROMA`, `V9`, `start:2.4`, `duration:1.8`, `in:0`, `volume:0`, `fit:contain`, `x:0`, `y:-530`, `scale:0.90`, `opacity:1`, `chromaKey:#26C73B`, `chromaTolerance:32`, `chromaSoftness:18`, fundidos en los primeros 0,133333 s y últimos 0,2 s. Al ser protagonista durante 2,4–4,2 s, se ocultan **solo** las composiciones de subtítulo `V5-SC01-CAP02-1` y `V5-SC01-CAP03-0` ajustando opacidad del clip de composición a0; sus contenidos permanecen editables. Subtítulo `es` a 4,2s y todos los demás quedan intactos. Ni audio ni duración global cambiaron.

**Telescopio protegido:** `SC08-TELESCOPE` original permanece exactamente en **32,300–35,100 s** con mismo asset, posición, timing y keyframes. Se eliminó únicamente el retículo decorativo erróneamente añadido al telescopio en una prueba previa (`SC08-OBSERVADOR-FOCUS-RING`). El título de esa escena `EL\nOBSERVADOR` se mantiene sin alteración.

## Validación REAL tras render

- Cache QA comprobada contra máster anterior SHA256 `54eea1b5b5011e65317326f508969221ea78cca5b5c48f237bd2e407cde4db23`. Al añadir un medio nuevo invalidó conservadoramente todas las huellas globales; para evitar rerender innecesario se validó la **lista exacta de los cuatro clips modificados, un clip eliminado y el único medio añadido**. Manifiesto resembrado solo QA con el máster previo verificado; cambiaron únicamente ventanas de fotogramas **0–180 y 900–1080**, con **8/10 reutilizables**.
- Export API real finalizado `xs_42851c3555c6` en **185,7 segundos**, MP4 `/exports/SUES_export_xs_42851c3555c6.mp4`, H264 1080×1920, 1667f/30fps, 55,566667 s y AAC, **102.878.995 bytes**, SHA256 `39e2e9d086daeee03cf567960996562c0db684412d72e3d7a4b615b3e86405f9`.
- Revisados fotogramas renderizados: **2,85 s muestra ambos cerebros sobre Carlos, sin el rectángulo verde y sin tapar su rostro**; 4,27 s no aparece el recurso y el subtítulo «es» es visible. El título inicial se ve antes de 2,4 s.
- Auditoría `framemd5` completa rev32↔rev33: **PASS**, 1667/1667 fotogramas decodifican sin errores; **1307/1307 fuera de las ventanas 0–180 y 900–1080 son píxel a píxel idénticos**. 165 fotogramas cambiaron dentro de esas ventanas. Audio `apsnr` canales ch0/ch1 **166,085 y166,118 dB** frente al máster previo, sin evidencia de alteración de voz/música.
- Preview independiente `/exports/SUES_Q03_CEREBROS_preview_rev33_540x960_15fps.mp4` H264 540×960/15fps,834 frames,55,6s, AAC, 10.225.193 bytes, derivado de máster vigente en **31s** sin reconstrucción de capas. Panel `qa.html` actualizado a fingerprint de proyecto rev33 `11405e399e87e80bed21ddd38b68864b26a31a75dfa016602e994674cd170427`.
- **Test Chromium real PASS**: panel detectó revisión 33 y fingerprint vigente; vídeo 540×960 cargó y reprodujo avanzando el tiempo; enlace HD separado coincidió con `xs_42851c3555c6`. API de preview Range GET206/65536bytes; HTTPS protegido 8443 sin sesión302 al login, TLS válido; editor principal público sigue200. Servicios temporales de browser/proxy parados y servicio QA reiniciado; POST export rev33 tras reinicio devuelve `cached:true` con mismo MP4.

## Procedimiento de continuidad

Scripts aislados versionados en `experiments/export-window-reuse-20261122/integrated/`: `qa-cerebro-mirror-overlay-r35.py`, `qa-brain-reseed-r35.cjs`, `make-brains-preview-r35.sh`, `qa-cerebros-browser-check-r35.cjs`, `verify-brains-r35-parity.py` y `qa.html`. Los scripts requieren video original privado ya en data/media. Registro no contiene credenciales ni firmas temporales de descarga.

**Estado:** cambios puntuales del usuario implementados y validados técnicamente en QA, pero **aceptación visual de Carlos pendiente**, export frío 579,5s sigue sin resolver, validación móvil real de esta revisión pendiente, Q03 EN CURSO y Q04 pendiente. Nunca confundir esta prueba aislada con producción aprobada. Espacio VPS ~96% usado, vigilar la acumulación de renders.
