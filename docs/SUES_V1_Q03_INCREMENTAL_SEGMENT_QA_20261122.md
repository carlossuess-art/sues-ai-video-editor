# SUES V1 · Q03 · Reutilización de segmentos de exportación · QA 22/11/2026

**Estado:** prototipo experimental VERIFICADO en VPS aislado, NO conectado a FableCut público, NO desplegado. Roadmap V1 mantiene Q03 EN CURSO; Q04 aceptación PENDIENTE, Q05 candidata pública anterior sin activar este motor. Rama de trabajo: `feat/speech-linked-motion-grammar-20261115`.

## Fuente y línea base verificadas

R14 real: 55,566667 s, 1667 fotogramas, 1080×1920/30 fps, H.264/AAC. Archivo fuente QA `/opt/sues-secure-headless-qa-20261122/r14-fixed-timing-data/exports/SUES_export_xs_c048d3fb2fb2.mp4`, 102.868.373 bytes, SHA256 `8a6319be87f0a2668ef153e15465adc5f225ee2285e9305ae22dd4ca61df9e09`. Exportación fría con corrección temporal: 579,5 s (9m39,5s). La meta 1–3min para montaje complejo sigue sin cumplirse.

## Pruebas ejecutadas en VPS srv1841004

1. `reuse-all-windows-20261122.json`: 10 segmentos de 180 fotogramas (último 47) extraídos con FFmpeg stream-copy; 1667/1667 hashes de fotogramas decodificados idénticos al MP4 fuente; 59,475 s para la batería de extracción y verificación completa.
2. Planificador de cambios: R14 tiene 165 clips/37 medios. Alterar un texto `SC08-QUESTION` (33,9667 s) invalida únicamente el bloque de frames [900,1080); 9/10 reutilizables. Alterar audio o huella de medios invalida los 10; cambio solo del número de revisión no invalida visuales. Prueba de firmas, NO aprobación artística.
3. E2E de montaje **sin editar imagen**: proyecto con nombre modificado; 10/10 segmentos reutilizados; solo se solicita mezcla de audio; salida completa MP4 H264/AAC 1667f/55,566667s en 7,709 s, 102.859.515 bytes. Comparación `framemd5`: 1667/1667 fotogramas idénticos. Audio de prueba procedente de MP4 AAC decodificado a WAV: no constituye auditoría de fidelidad de voz.
4. E2E de **edición sintética**: cambio de propiedad de texto en una copia del proyecto; el adaptador solicita únicamente ventana [900,1080) y mezcla de audio. El vídeo para esa ventana fue producido **artificialmente con FFmpeg drawbox**, NO por compositor FableCut. Salida completa en 12,462 s, sin error; pico RAM del servicio 428,4 MB. Auditoría `edited-segment-frame-parity-20261122.json`: 1667/1667 decodificados, 1487 fotogramas no afectados idénticos, 180 cambiados, 0 errores de decodificación. Esto acredita selección de ventanas y ensamblado con MP4 sintético; NO acredita tiempo ni acabado de un render real de texto editado.

## Código experimental, NO producción

- `experiments/export-window-reuse-20261122/sues-window-reuse-v1.cjs`: firma conservadora por ventana con halo de 6 fotogramas, propiedades de clips, padres y hashes globales de medios/código.
- `experiments/export-window-reuse-20261122/sues-window-cache-store-qa.cjs`: manifiesto atómico, tamaño/SHA del MP4 y comprobaciones de H264/AAC, fotogramas y duración.
- `experiments/export-window-reuse-20261122/sues-segmented-export-diff-qa.patch`: parche aislado de `sues-segmented-export.js`, tras flags `SUES_WINDOW_REUSE_QA=1` + `SUES_EXPORT_REUSE=1`. No aplicar directamente: rutas absolutas de la QA y base FableCut deben reconciliarse y probarse antes de integración.
- Workspace: `/opt/sues-secure-headless-qa-20261122/native-fastpath-qa/`; candidato `app-bitrate-tune-qa/sues-segmented-export-diff-qa.js`. No modificar originales.

## Bloqueos y siguiente acción

Validar el caso de texto realmente modificado **con el renderizador auténtico de FableCut**, sustituir la ventana [900,1080) por su resultado real, repetir análisis de fotogramas/PTS/voz y dos auditorías visuales siguiendo SUES AI Film Director v1.7.1. Evitar reutilizar caché si se alteran máscaras, comps, shaders, fuentes, padres, medios, código o audio; cubrir todos los casos con tests negativos. La extracción stream-copy debe mantenerse condicionada a compatibilidad de codec/keyframe; bloquear y renderizar de cero si no se demuestra. Endurecer Chrome sandbox (QA usa --no-sandbox local, prohibido público), seguridad del worker/CDP, cancelación, reinicios, limpieza, integración botón móvil y prueba Pixel real. Probar rendimiento de una edición auténtica y, separadamente, reducir render frío de 9m39s hacia 1–3min sin eliminar efectos.

**Producción, V29, WAC, iStudio y DNS sin cambios.** VPS al 94% usado (~3,3 GB libres) al cerrar QA. Arte/UX, Q03, Q04 y V1 pendientes. No declarar versión aceptada ni desplegar hasta validación específica y rollback.
