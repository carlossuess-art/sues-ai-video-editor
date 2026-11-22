## VALIDACIÓN POSTERIOR: TEXTO EDITADO CON EL COMPOSITOR REAL FABLECUT · 22/11/2026

**Resultado de QA integral aislada:** sobre la misma copia R14 (165 clips/37 medios), se cambió el texto del clip `SC08-QUESTION` en ~33,9667 s, sin alterar el máster ni producción. Se arrancó FableCut real y el worker Chromium WebCodecs privado, sólo por loopback, con un directorio HOME/XDG aislado para el usuario `suesnle`. El browser aislado continuó usando `--no-sandbox` y NO puede exponerse al exterior. No se instaló un navegador nuevo; se reutilizó el ejecutable existente mediante hardlinks sin modificar permisos de producción.

**Render real de ventana modificada:** frames 900–1079 (180/180, 6s), H.264,1080×1920, **100,229 s**, 11.827.205 bytes, SHA256 `232a40d4bf56b0577d938c3ac6044116a3015f3e30c2bc8c7fbc51edc93546c8`. QA file `/opt/sues-secure-headless-qa-20261122/native-fastpath-qa/window-e2e-run/exports/SUES QA R14 COMPLETO 55s - test name change only.mp4`. El primer readback FFprobe falló porque la URL codificaba espacios `%20`; se corrigió el path del verificador sin repetir el render y ffprobe dio **PASS**.

**Ensamblado incremental con un segmento REAL:** 9 de 10 ventanas desde MP4 máster verificado + 1 ventana auténtica recién renderizada de FableCut. El adaptador solicitó exactamente una orden `export` para frames [900,1080) y una mezcla de audio; ensambló el MP4 completo en **9,186 s** sin errores. Tiempo técnico secuencial de ventana+ensamblado **109,415 s ≈ 1m49,4s**, no incluye pruebas de auditoría ni extrapola a cualquier edición. Report `window-real-edited-e2e-result-20261122.json`, salida `SUES_export_xs_b59b401bc353.mp4` en QA.

**Auditoría definitiva de vídeo:** `real-edited-full-parity-20261122.json` = **PASS**, 1667/1667 fotogramas decodificados, 1487 fotogramas de ventanas intactas píxel a píxel IDÉNTICOS al máster, 180 fotogramas en la ventana editada diferentes, 0 errores de decodificación. Revisión de audio artística/PCM no acreditada: el test de ensamblado usa WAV recodificado desde AAC previo, no el mezclador final del montaje nuevo. Se ha detenido el servicio Chrome QA tras render, sin tocar producción.

**Alcance:** queda demostrada la exportación incremental en QA para un cambio de texto real sobre R14. **NO** está demostrado un export frío en 1–3 minutos (último frío completo 9m39,5s). NO significa que el nuevo motor esté activado en la app pública, ni aprobado en Pixel real, ni doble QA artística. Faltan seguridad del sandbox/CDP, pruebas de cancelación/reanudación, integración real del botón y flujo de proyectos, evaluación de máscaras/compounds, regresiones negativas, memoria/disco (VPS llegó al95% durante prueba), staging privado autorizado y rollback antes de producción. Q03 continúa EN CURSO; Q04 PENDIENTE, Q05 solo despliegue de candidata anterior. No modificar V29/WAC/iStudio/DNS/producción.

---

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
