SUES AI VIDEO EDITOR · Reparación DOPAMIN y comparación verificable
Estado operativo · 23/10/2026 UTC
Fases 6/7/9 abiertas. Progreso global oficial: 48 %, sin incremento inferido. Fase 9 y aprobación creativa V1 exclusivamente pendientes de Carlos.

Original único
SUES_REEL_TEST_MASTER_ORIGINAL_20260924.mp4, 68,6491 s; reutilizado como 152939.mp4. No resubido ni modificado.
SHA256: 8d775bfab3d48b928adf86c730293b147bd77cc4ab6498bb4efe3760ca622005
https://drive.google.com/file/d/14zGH3VMSrR9NvAeaOZVyetmRt7G5uQbT/view

Causa de la edición que solo mostraba subtítulos
El trabajo cb62a001-14e7-48d5-ab66-fbf3f6fd8bb1 tenía configuración activada, pero no recursos/eventos ejecutables. El análisis Whisper no aportaba detección facial y la cámara full-frame-fit descartaba decisiones visuales. La receta léxica no encontraba candidatos en este discurso. No había pista de música asignada y los SFX dependían de movimientos/transiciones ausentes. Las advertencias permitían igualmente renderizar y presentar DONE.

Correcciones publicadas
Se valida el plan compilado antes de ejecutar instrucciones: música, zooms, gráficos y SFX pedidos deben existir o se bloquea la ejecución. La UI identifica las versiones sin zooms/gráficos. Se expone el panel de planes por escenas dentro de Dar instrucciones; no se confunde con el futuro Director IA. Los ajustes conservan recursos y eventos al editar. Se añade encuadre manual explícito ligado al SHA original y zooms narrativos acotados, reutilizando el compositor existente. No equivale a detección ocular, seguimiento ni rotoscopia.
Se reutilizan tarjetas, B-roll, overlays, transiciones y recursos sonoros existentes. Los subtítulos ganan contraste al coincidir con B-roll. Se mantiene la voz y tiempos originales.
El render monolítico agotaba 1 GiB; se separan composición de vídeo y mezcla de audio, con verificación estricta completa del MP4 y limpieza de temporales. El despliegue conserva el límite revisado de 1,25 GiB y los respaldos.
Se corrigen errores transitorios de lectura GET del frontend, sin reintentar operaciones de escritura.

Comparación de versiones
Trabajo inicial: 88 captions y ningún zoom, motion, transición o SFX; sin música asignada.
Iteración 01: fallo real por OOM cerca del segundo 34; descartada.
Iteración 02: MP4 completo, 68,6491 s, H264/AAC, 1080×1920, 30 fps, 27.364.381 bytes. SHA256 281963f8d3dc50cc896b22fad040214e80945a4a1d347d292ad006a89290d459. Decodificación completa sin errores. Pico de memoria 957.292.544 bytes bajo 1 GiB. Mezcla medida -33,3 LUFS/-13,2 dBTP: demasiado baja, NO candidata final.
MP4 de comparación: https://drive.google.com/file/d/18DNjU2WEL5hGewtBD0RKXF2i9P2gkkZL/view
Iteración 03: generada mediante la web, Dar instrucciones → revisión de 35 operaciones → ejecución → reproducción iniciada y exportación MP4 verificada. Trabajo 95dd39c1-ea53-4c88-88f1-62b80fa3698d, independiente del original. 27.391.990 bytes, SHA256 901c26f10b24002698f5cc05f35a2e39abc2f4ed3fcd707b6dd28baa486314d9. Decodificación completa válida y descarga idéntica al servidor. Contiene cuatro acercamientos narrativos, dos tarjetas, dos B-roll, un overlay, tres transiciones, siete SFX y 88 captions; los recuentos no certifican calidad creativa. Conserva mezcla anterior, por lo que NO es final.
https://editor.suesholistics.com/?project=95dd39c1-ea53-4c88-88f1-62b80fa3698d
Iteración 04: iniciada con la edición anterior y una sola instrucción adicional de nivelación de voz antes de mezclar. Trabajo cca3b1cf-2447-4cb8-a4af-df70c7cc51a9. En render al escribir este registro; NO se declara validada.

Audio y recursos
Se usa ambiente propio de Drive, conservando su archivo original. Derivado de 70 segundos con crossfade y normalización, procedencia registrada en el VPS. Asset 69a50f1c603db7174edf80ff15b5bf79ca91a42b259cbec722b04cc23d66241f, gain 0,16 y ducking.
La corrección de voz mide en dos pases el audio original y lo nivela a objetivo -16 LUFS/-3 dBTP antes de música y efectos, sin separar voz/ambiente ni alterar sincronía. Ajusta ducking para el nivel normalizado. La medición del MP4 final y la escucha siguen siendo obligatorias.

Pruebas y despliegue
Commit de código/VPS: 1cf07c3e2ffd320fbbebf1d117c25c248299dca3, rama feat/library-ambient-overlays-mastering-20261021. Sin merge a main.
Node: 294 pruebas pasan en contenedor; la única que requiere Git no dispone de binario allí y pasa separadamente en el host (1/1). Python despliegue: 29/29. Incluye CALMA, validación de instrucciones, protección del encuadre, MP4 con música y SFX medidos y normalización real de una fuente muy baja bajo límite de memoria.
Diagnóstico y despliegue reversible correctos. Versión real verificada; Whisper activo; límite 1.342.177.280 bytes.
Respaldo: /opt/sues-video-setup/update-backup-20261023-231111-119180
SHA256 de copia privada: d5ff048f3af7eb8133a3274f1db5353cb12475c708131ebbf7da0bcf8f37c5f2
Evidencias y versiones conservadas en /opt/sues-video-setup/dopamin-qa-20261024.

Bloqueo de revisión final
Work dejó de disponer del entorno principal: navegador y archivos locales desconectados. El VPS y GitHub siguen accesibles. Drive rechaza subir las descargas de iteraciones 03/04 porque “no primary turn environment is available”. No se declara escucha final ni comparación creativa con Keanu aprobadas. La versión 02 ya está en la carpeta de pruebas; las versiones posteriores permanecen privadas en el editor/VPS.
Siguiente acción: terminar y medir iteración 04, recuperar el navegador de Work, reproducirla completa con escucha, exportar a Drive y someterla a Carlos.