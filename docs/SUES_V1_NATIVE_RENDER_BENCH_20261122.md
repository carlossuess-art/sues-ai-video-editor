# SUES V1 · Estudio verificado de exportación nativa frente a Chromium · 22/11/2026

**Resultado:** se ha generado un MP4 de prueba con una ruta híbrida, pero **se rechaza para producción** porque no cumple velocidad ni equivalencia visual. Sin modificación de producción, V29, originales, WAC, DNS o servicios ajenos.

## Infraestructura y Reel

- VPS Hostinger srv1841004: 1 vCPU AMD EPYC, 3,8 GiB RAM, sin GPU /dev/dri, 48GB de disco, ~4,5GB libres.
- FableCut R14 en clon: 55,566667 s, 1667 cuadros 1080x1920, 30 fps; 165 clips, 56 composiciones anidadas y múltiples pistas/máscaras/audio.
- Ruta vigente: navegador reconstruye fotograma en Canvas; FFmpeg recibe imagen ya compuesta y codifica. Cambiar solo libx264/WebCodecs no elimina reconstrucción en Chromium.
- Rendimiento anterior documentado: render completo fragmentado ~36,5 minutos; WebCodecs 360 cuadros/12 s en 177,3 s.

## Pruebas reales nuevas

**A · FFmpeg nativo base:** se procesaron 12,000 segundos del vídeo fuente 1080x1920/30 a H.264, x264 veryfast CRF25, una CPU limitada a 75%. Ejecutado correctamente en **28 s**, 360 fotogramas, fichero **6.941.580 bytes** `full-data/exports/sues-native-base-12s.mp4`. La prueba WebCodecs de 12s/177,3s es **6,33x más lenta**, pero NO equivalente: incluye composiciones y ajustes; el MP4 nativo solo prueba la pista original sin efectos y no es reemplazo cinematográfico.

**B · Separar las capas del Canvas:** se renderizaron 15 fotogramas RGBA (0,5s) suprimiendo V1 en el compositor FableCut existente, mediante CDP y decodificación de medios. Extracción PNG 15f: 33,635s de pared (transferencia CDP y PNG). El transporte directo al receptor localhost mediante POST PNG resultó también lento.

**C · Composición híbrida sin PNG:** se transfirieron **15 cuadros RGBA crudos de 8.294.400 bytes/cuadro** a un FFmpeg persistente que superpone dichos cuadros sobre el vídeo base y mezcla AAC desde el audio continuo de QA. MP4 H.264/AAC completado y verificado: 0,500 s, 15 fotogramas, **574.240 bytes**, `full-data/exports/SUES_NATIVE_HYBRID_15F_QA.mp4`. Extracción de capa vía CDP: 43,996 s; proceso receptor/FFmpeg hasta finalizar: **60,341 s**. Esta ruta sigue demasiado lenta.

**D · Fidelidad:** SSIM contra `segment-qa/SUES_R14_55s_SEGMENTED_QA.mp4` en los primeros cuadros alrededor de 0,94 (ejemplo cuadro 15: **0,943178**). Motivo conocido: el vídeo base nativo de este prototipo usa `scale` sin reproducir aún `x=-41`, `y=13` ni keyframes de zoom `scale=1.02→1.07`; además se deben validar modos de fusión y máscaras. **No cumple QA 1:1** y NO puede ponerse como exportador operativo.

## Decisión técnica

1. **Descartar** extracción PNG por fotograma y la primera ruta de streaming RGBA en el VPS de 1 CPU. No confundir vídeo de 15 fotogramas con Reel completo ni elegir por mera codificación H264.
2. **Mantener como base de investigación** FFmpeg nativo para medios, cortes y audio. Continuar únicamente con operaciones de composición nativas equivalentes y verificadas; cualquier operación no soportada bloquea la ruta nueva, no se sustituye silenciosamente.
3. Antes de prometer exportación de 1–3 minutos, repetir benchmark completo en CPU/GPU capaz o explorar la exportación en el hardware del usuario. El equipo actual no ha demostrado potencia suficiente para 1080p con las capas reales.
4. Mantener opción actual publicada y snapshot-lock QA aislada hasta que nueva candidata exporte **1667/1667 cuadros**, proteja la revisión concurrente y pase doble QA A/V, Android y cancelación. Desplegar solo después de verificación y permiso.

## Rutas aisladas verificadas, sin activación

`/opt/sues-secure-headless-qa-20261122/native-fastpath-qa/`: `cdp-overlay-qa.js`, `cdp-overlay-raw-qa.js`, `overlay-receiver-qa.js`, `raw-overlay-receiver-qa.js`, `overlay-qa.json`. Los MP4 están en `full-data/exports`. Servicios de QA detenidos, producción conserva 127.0.0.1:17969. Esta investigación **no equivale a haber solucionado** la exportación completa ni al QA visual artístico.
