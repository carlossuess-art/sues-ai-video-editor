# Reel 158404 · B02 · FableCut native 120f: caché de decodificación rápida, paridad con fuente auténtica · 08/11/2026

**Estado del hito: aceleración NATIVA demostrada en CLON AISLADO y verificaciones técnicas de 120/120 PASS. No está desplegada en el FableCut habitual; no equivale a Reel final, QA cinematográfica ni aprobación estética.** El objetivo creativo autorizado por Carlos sigue siendo el storyboard Film Director V2 D01–D77 y el contrato completo `sues-master-story/v1` con 7 escenas/49 operaciones. No se modifica ningún requisito artístico por haber acelerado el motor.

## 1. Causa verificada, no hipótesis

La fuente original auténtica `sues-158404-original.mp4` es MP4 **fragmentado** (`moov` con `mvex`, `moof` múltiples) y contiene H.264 VFR 1080×1920 y AAC. El FableCut original 1.18.0 dispone de un demultiplexor JS `mp4-demux.js` que **rechaza por diseño** MP4 fragmentado, por lo que `ExportFrameSource.open` devuelve `null` para el vídeo bruto. Esto sucede en dos clips simultáneos: V1 fuente y V3 silueta de Carlos. La máscara temporal V4, un MP4 no fragmentado, SÍ usaba `VideoDecoder` rápido. Las dos capas originales caían en el camino lento de `<video>` y `hardSeekVideo` de Chromium para cada fotograma, penalizado por el hecho de que la fuente es VFR.

Un exportador FableCut instrumentado **exclusivamente dentro del navegador de un clon** confirmó en seis fotogramas que 48,718 de 62,829 segundos se invertían en `seekVideosTo` y aparecían 32 llamadas a `hardSeekVideo`. `drawFrame` acumuló ~1,458 segundos; la codificación del audio ~0,154 segundos. No se cambió FableCut productivo durante las mediciones.

## 2. Solución ensayada sin pérdida: contenedor faststart solo para decodificación

Se creó una copia privada mediante `ffmpeg -i original.mp4 -map 0 -c copy -movflags +faststart cache.mp4`. NO hay transcodificación, ni cambios de contenidos, voz, codecs, proyecto, origen, duración de las operaciones ni recortes. El original sigue teniendo el SHA256 **`9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad`**. Cache QA SHA256 **`f5957de68954c212e3e88efb35ae008c2aee76ccb0f6f2234c09c45f9e96e91a`**; la diferencia del SHA del *archivo* es esperable, porque se ha reorganizado el contenedor MP4.

- Validación independiente **paquete a paquete**: H.264 **2.206 paquetes** y AAC **3.457 paquetes** con PTS, DTS, tamaño, orden y flags idénticos a la fuente; hashes de flujos H.264 y AAC codificados también idénticos. El remux tardó ~0,48 segundos en el VPS.
- `FableCutMp4.parseMovie` pasó a reconocer **2.206 muestras**. `VideoDecoder.isConfigSupported` confirmó H.264 `avc1.640028` y resolución original. El codec del matte temporal sigue intacto.
- **Solo para QA:** wrapper en `ExportFrameSource.open` del navegador clonado mapea `/media/sues-158404-original.mp4` a `/media/sues-158404-original-faststart.mp4` para el DECODIFICADOR de fotogramas, no para el proyecto ni su audio, permisos, inventario, fingerprint, reproducción habitual o guardado. No hay cambio productivo. La regla central se ha convertido en el módulo puro y seguro `src/engine-next/native-faststart-decoder-binding.js`, que no activa producción.
- El experimento de tolerancia temporal global +0,0005 s NO fue adoptado: mejora unas posiciones VFR y perjudica otras. Se usa el reloj real del original y se verifica la salida.

La futura integración debe validar el manifest y **los bytes reales** en el lado del servidor, implementar una caché por contenido cuyo ciclo de vida sea seguro, conservar el bruto original inmutable, y usar solo el decodificador rápido para las capas de vídeo compatibles. Los archivos aquí creados son pruebas, no un instalador automático del editor productivo.

## 3. Benchmark: datos reales y límites de la comparación

| Prueba / entorno aislado | Fotogramas | Duración export | Espera vídeo | Resultado |
| --- | ---: | ---: | ---: | --- |
| FableCut sin cache, clon B02 Wide+fades | 6 / 0,2 s | **62,829 s** | **48,718 s** | Nativo DONE, 32 hard seeks |
| Misma B02 con cache WebCodecs (sin tolerancia artificial) | 6 / 0,2 s | **18,727 s** | **3,330 s** | Nativo DONE, sin hard seeks |
| B02 base gold-OFF sin caché (trabajo `x_g4pkj6pl`) | 120 / 4 s | **847,790 s** (job servidor) | No instrumentada | DONE, imágenes/audio independientes OK |
| B02 Wide+fades con caché WebCodecs (trabajo `x_cahpxww1`) | 120 / 4 s | **133,145 s** (job servidor); 133,856 s (harness) | **11,972 s** sumados | DONE, imágenes/audio independientes OK |

**Comparación operacional:** 6f ~3,36× más rápido. En 120f ~**6,37× más rápido**, en el mismo VPS de **1 vCPU**, 3,8 GiB RAM. **Advertencia:** las dos pruebas de 120f comparten fuente, tamaño, frame rate y pistas estructurales, pero no geometría de niños ni transiciones; no es un estudio controlado con un único montaje. No proyectar linealmente tiempos a Reel 74s ni prometer render inmediato.

## 4. Evidencia del nuevo export nativo completo (B02 Wide+fades)

- MP4 PRIVADO `.../perf-20261108/B02-Wide-120f-faststart-FABLECUT-NATIVE-QA.mp4`, **SHA256 `f281c1ad7f6993c0c4212d4914d5c6b72897d050b8416042eb517889e0030e83`**, 5.069.407 bytes. Trabajo FableCut `x_cahpxww1`, status `done` al 100 % con reporte nativo de calidad conforme.
- `ffprobe`: 120 fotogramas H.264 distintos a 30fps 1080×1920, cero duplicados adyacentes (verificación framemd5), 4,000 segundos, audio AAC estéreo 48kHz/4,000s.
- **Audio decodificado byte a byte IGUAL** al B02 base anterior: SHA256 de PCM `a5b16811bb90ead9962d7b325a0135c162f7c300fe3b19aff721dc6e7c93cc49`. No hay doblajes, síntesis, ni generación nueva.
- `B02-120f-fast-cache-integrity.json` registra evidencia real de correspondencia fuente-cache. Proyectos guardados editables en la carpeta QA privada, con V1 y A1 bloqueados, V2 niños abierto `(x=180,y=-250,scale=.73)`, fades IN y OUT 9f, V3 Carlos con matte temporal V4, gold V5 desactivado. Ningún clip del proyecto original fue sustituido o borrado.

## 5. Error detectado y corregido en **la auditoría**, no en el bruto

La auditoría inicial que comparaba una imagen del visor antiguo en t=10 con el MP4 rápido dio SSIM 0,858 y bloqueó el visto bueno técnico. La imagen estática se obtuvo con `setTime`, `seekMediaWhilePaused`, `drawFrame`, **sin esperar por el fotograma realmente decodificado en todas las capas**: el visor puede estar desfasado durante saltos temporales. Comparando con la fuente real en ese instante, el nuevo export coincide con el fotograma auténtico (SSIM ~0,969 en ROI), no con esa captura desactualizada. Se conserva la auditoría inicial fallida, no se reescribe retroactivamente.

También se detectó y corrigió un fallo del primer auditor de vídeo VFR: FFmpeg al generar `rawvideo` de una fuente VFR puede producir CFR implícito y **duplicar/descartar fotogramas**. El primer v1 reportó falsos negativos (SSIM muy bajo); corregimos a `-vsync 0` y **mantuvimos los índices auténticos de PTS**. Resultado corregido de la zona descubierta **x=10,y=60,w=230,h=300** (parte original del fondo) para los **120 de 120 fotogramas**: **SSIM mínimo `0.965467`, mediana `0.972625`, media `0.972378`, cero inferiores a 0,95**. Esto certifica el timing del fondo, no los bordes de la máscara o toda la composición. Evidencia `B02-authentic-source-120-frame-region-proof-v2.json`, corroborada por el script reutilizable `audit-fablecut-source-roi-vfr.py` ejecutado de nuevo sobre archivos reales: `B02-authentic-source-120-frame-region-proof-v3.json` (**PASS, 120 cuadros, mínimo 0,965467, ninguno por debajo de 0,95**).

Para verificar **el visor con las mismas fuentes que el exportador**, se capturaron tres canvas a resolución nativa 1080×1920 en un clon con `exportDecodeBegin`, `seekVideosTo`, `drawFrame`, WebCodecs rápido en V1/V3/V4, y `canvas.toDataURL` a t=10, 11,5 y 13s. El programa correcto y el MP4 real dan RGB SSIM **`0.967534 / 0.977721 / 0.965979`**, todos superiores al umbral 0,95. Auditoría nativa final `.../perf-20261108/B02-Wide-120f-frame-accurate-program-audit.json`: `technicalChecksPassed=true`, **120/120 frames distintos**. A diferencia de la captura de scrubbing antiguo, este método sí espera los tres fotogramas presentables antes de capturar.

## 6. Implementación actual y siguiente hito real

**Código preparado y ensayado (124/124 pruebas Node y 13/13 Python), NO activado en FableCut habitual:**

- `scripts/engine-next/build-native-faststart-cache.py`: herramienta create-only que exige SHA de origen, verifica cada paquete fuente/cache y sus bitstreams, construye un cache faststart sin transcoding y un manifiesto con `productionActivation:false`; falla si el origen cambia o la ruta es insegura.
- `src/engine-next/native-faststart-decoder-binding.js`: vinculación inmutable y de solo decodificación basada en un manifiesto que debe revalidarse realmente en servidor; por diseño preserva la URL del proyecto, audio y voz.
- `scripts/engine-next/audit-fablecut-source-roi-vfr.py`: auditor de tiempos reales VFR y SSIM de la zona original, obliga a `-vsync 0`, exige hashes fuente/export y devuelve un informe de 120 frames, sin dar aprobación artística.
- Pruebas automáticas en `tests/engine-next/test_native_faststart_cache.py`, `native-faststart-decoder-binding.test.js`, `test_fablecut_source_roi_vfr.py`.

**Siguientes pasos necesarios:** probar integración estable en una COPIA del NLE real, implementar y testear ciclo de cache y verificaciones de integridad en la ruta de exportación sin cambiar las rutas de media de la línea de tiempo; medir con el mismo proyecto idéntico y dos pasadas comparativas. Corregir scrubbing desfasado del visor habitual; auditar matte en movimiento/halos y dinámica completa, título protagonista arriba, subtítulos progresivos bajo barbilla después de validar la voz real (11 tokens ASR dudosos), sonido/SFX/licencias y las **49 operaciones** restantes. No se ha renderizado Reel completo ni realizado doble QA cinematográfica o aprobación de Carlos. No publicar Studio ni tocar Caddy.

**Privacidad/rollback:** MP4, fotos, voz, capturas de niños y todos los informes con fotogramas permanecen solo en el VPS privado. No subir al GitHub público los medios privados ni publicar archivos sin autenticación. Clones locales temporales apagados. FableCut original 127.0.0.1:7780 revision54/seis clips, editor anterior `https://editor.suesholistics.com` HTTP200.
