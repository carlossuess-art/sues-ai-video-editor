## Q03 r24 · Descarga HTTP corregida y regresión ampliada · 22/11/2026

**Hallazgo adicional de QA:** el `serveFile` del FableCut original respondía HTTP206 incluso a `Range: bytes=999999999-999999999`, devolviendo un byte recortado del final; los rangos sufijo `bytes=-10` tampoco se interpretaban según el protocolo. Esto podía causar comportamientos incorrectos en búsquedas y reanudación de vídeos. Se corrigió ÚNICAMENTE en la copia de staging: `sues-http-range.cjs` (parser conservador de rango único) + `http-byte-range-fix.patch` (respuesta416 con `Content-Range: bytes */size` para inválidos; 206 para directos/sufijos y HEAD sin lectura del cuerpo). Los dos ficheros y tests están en `experiments/export-window-reuse-20261122/integrated/`.

**Validación HTTP REAL del MP4 completo de 102.856.671 bytes:** GET `Range: bytes=0-1023` → **206 / 1024 bytes**; GET `bytes=-10` → **206 / 10 bytes**; GET `bytes=999999999-999999999` → **416 / 0 bytes**, `Content-Range: bytes */102856671`; HEAD simple → **200**, Content-Length correcto. Servicio local de prueba detenido y sin tocar Caddy/443/DNS.

**Regresión después de la corrección:** **77/77 tests PASS**, 0 fallidos (pruebas previas, tests de HTTP Range y `test/rest-api.test.js` incluidos), `q03-integrated-stage-20261122/regression-final.log`. Todos los 1667 fotogramas y el PSNR real descritos en r23 continúan válidos; el parche solo afecta al servicio de archivos y no transforma el MP4 ni altera el render. Código en rama existente, staging preparado con `start-private-qa.sh` (solo loopback, sin servicio persistente).

**Puertas todavía no cerradas:** el usuario todavía no tiene un enlace para abrir la interfaz desde su Pixel: se necesita ruta HTTPS autenticada propia. Los actuales dominios/puertos Caddy son compartidos con producción y preview V1.1, por lo que NO se ha cambiado ese reverse proxy ni DNS sin autorización específica. Falta prueba móvil, doble QA audiovisual artística y primer export frío razonable; Q03 EN CURSO y Q04 PENDIENTE.

---

## Q03 · Integración FableCut y prueba de API con mezcla nativa · 22/11/2026 · r23

**Ejecutado en copia AISLADA y bajo flags, NO producción:** `/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122/` es una copia completa del FableCut existente, no una aplicación nueva. En su `app/sues-segmented-export.js` se conectaron los módulos `sues-window-reuse.cjs` y `sues-window-cache.cjs`. Flags de exclusión: `SUES_WINDOW_REUSE=1` Y `SUES_EXPORT_REUSE=1` y `SUES_SEGMENTED_EXPORT=1`, `FABLECUT_ENABLE_AUDIO_ONLY=1`, worker residente. El sistema por defecto mantiene la ruta anterior. Se añadió control de tipos de clip, symlink, fuente/código mutable tras render, SHA256 de máster, FFprobe, cancelación; `--remote-allow-origins=*` retirado de la copia de Chromium. Código y tests: `experiments/export-window-reuse-20261122/integrated/`, README de reproducción incluido.

**Regresiones:** `regression-pass.log` **52/52 PASS** en VPS (5 planner/2 cache/1 cancelación + 44 tests originales sobre composición, export, audio, máscara). Primer E2E API encontró un manifiesto QA con propietario root y modo0600: se canceló con endpoint y quedó `cancelled`, `src:null`; se corrigió solo el propietario del manifiesto de pruebas (no motor ni producción). Nuevo E2E reprodujo 9/10 ventanas presembradas manualmente con máster R14 validado (NO implica primer render frío).

**E2E FableCut REAL, API real, audio realmente mezclado:** export job `xs_33a6a5c1aaa3` `status=done` en **113,83 s** (≈1m53,8s); H2641080×1920, 1667 frames/55,566667 s, AAC con2606 frames, tamaño102856671, SHA256 `474bf01cf4db84d6beb40c21180537f1ba5cc84d9d83c4f0ebbc0ccb9d9b27bc`. `integrated-api-result.json` PASS. `integrated-frames-parity.json` PASS: 1667/1667f, 1487f sin alterar píxel a píxel idénticos al máster, 180f editados distintos, errores0. `audio-apsnr.log`: **166,203/166,271 dB** por canal frente al máster. Comparación técnica ≠ revisión artística de voz. Repetición inmediata devolvió `cached:true,status:done` y mismo archivo, sin trabajo nuevo. `HEAD /exports`: HTTP200 y Range HEAD206, 0–1023/102856671. Solicitud con revisión anterior devolvió HTTP409. Cancelación in-flight verificada sin MP4 final. La prueba física Android no ejecutada.

**Seguridad:** servidor stage y CDP en loopback `127.0.0.1:18156/18157`. Chrome no usa `--no-sandbox`, procesos verificaron `NoNewPrivs:1` y `Seccomp:2`, pero perfil AppArmor `unconfined` NO demuestra confinamiento productivo. No se creó enlace público; no se tocó Caddy, DNS, aplicaciones ni producción. El servidor stage con límite de vida no queda publicado; se conservan artefactos de QA en disco. El acceso HTTPS autenticado para Pixel exige ruta aislada validada que no altere el preview V1.1 ni producción.

**Pendientes verdaderos:** (1) primer render frío completo 579,5 s > objetivo1–3min; (2) ensayo de máscara/capas y cancelación/reinicio bajo carga; (3) hardening CDP/AppArmor y autorización de puerta HTTPS exclusiva para pruebas Pixel; (4) doble auditoría audiovisual SUES AI Film Director1.7.1, validación directa de Carlos en Pixel y Q04; (5) rollback documentado antes de cualquier activación. Q03 EN CURSO, Q04 PENDIENTE; V29/WAC/iStudio/DNS/443 inalterados.

---

## SEGURIDAD QA · Chromium sin --no-sandbox, AppArmor existente · 22/11/2026

**Problema identificado** en VPS Ubuntu24.04: el Chrome del usuario técnico `suesnle` (sin HOME propio) falla sin bypass: `No usable sandbox`, exit 134. Kernel `kernel.unprivileged_userns_clone=1`, `kernel.apparmor_restrict_unprivileged_userns=1`. **No se modificaron sysctl, AppArmor global, perfiles del sistema ni permisos compartidos.**

**Solución exploratoria en QA aislada:** existía el perfil `sues-qa-chrome-20261122` ya cargado en AppArmor, reportado `(unconfined)`. Se ha reutilizado vía `aa-exec -p sues-qa-chrome-20261122` como lanzador del Chromium existente; HOME/XDG privados, ejecutable aislado mediante hardlink sin nueva instalación, puerto CDP 18148 o 18147 *solo loopback*. El navegador **sin el argumento `--no-sandbox`** contestó `/json/version` (Chrome/151.0.7922.34, CDP1.3) con servidor de smoke local. **Prueba FableCut real** bajo la misma ruta, exportación privada de ventana frames900–914, 15/15 fotogramas H264 1080×1920, duración0,5s, **26,553s**, `sandbox-fablecut-window15-20261122.json` **PASS**. Registro de ejecución `sues-q03-sandbox-render15-20261122.service` terminó exit0; servidor privado apagado tras uso y perfiles temporales limpiados.

**LÍMITE DE SEGURIDAD:** el perfil AppArmor reporta `unconfined`, de modo que el éxito funcional sin `--no-sandbox` NO equivale a certificación de aislamiento completo, a una política AppArmor confinante, a separación de red, ni a autorización de servidor público. Para producción: analizar confinamiento real (Chrome namespace/seccomp/NoNewPrivs, AppArmor restrictivo, CDP autenticado en loopback, Chrome runtime no compartido, hardening de puertos/capabilities), y hacer E2E completo de 180f + reinicio/cancelación/recuperación con ese régimen antes de plantear despliegue. No relajar `kernel.apparmor_restrict_unprivileged_userns`, no activar Chrome `--no-sandbox` públicamente. Sin cambios en producción, WAC, V29, iStudio, DNS.

---

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
