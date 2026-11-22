## Q03 · r29 · Diagnóstico frío en dispositivo real preparado y probado en Chromium QA · 22/11/2026

**Estado y alcance:** se continúa el MISMO SUES AI VIDEO EDITOR/FableCut, sin proyectos nuevos ni cambios en producción. Se detectó primero que el checkpoint GitHub ya tenía un hito paralelo posterior a r28: acceso HTTPS autenticado `https://studio.suesholistics.com:8443/q03-export-qa/qa.html`, servicio privado `sues-q03-pixel-qa.service` activo y exportación incremental E2E 131s, con paridad. No duplicar ni deshacerlo. El primer render frío sigue siendo **579,5s** sobre R14 completo, sin mejora acreditada.

**Nuevo diagnóstico r29, en QA solamente:** se creó `app/qa-cold-benchmark.html`, enlazado desde el panel existente `app/qa.html` (nueva sección 4). Ruta autenticada `https://studio.suesholistics.com:8443/q03-export-qa/qa-cold-benchmark.html`. No se tocó Caddy/DNS/prod ni se abrió puerto: la ruta hereda `forward_auth` existente. Carga el FableCut ya existente en un iframe de mismo origen, y SOLO tras clic directo ejecuta 36 fotogramas REALES de R14 (12 en inicio, 12 con máscara, 12 con motion) a 1080×1920, midiendo `seekVideosTo`, `prepareFrameAssets`, `drawFrame` y construcción VideoFrame. Restaura tiempo y estado previo de página, no guarda el proyecto, no exporta MP4, no sube métricas al servidor. También consulta `VideoEncoder.isConfigSupported` con `hardwareAcceleration=prefer-hardware|prefer-software`: **solo son pistas de compatibilidad, NO certificación de GPU**. El informe permanece local; botón de copia para compartir manualmente con Carlos. Protección HTTPS: petición anónima `302 /login`; GET loopback de QA panel y benchmark `200`.

**Prueba automatizada COMPLETA del nuevo botón en Chrome QA aislado:** `r29-mobile-benchmark-headless-check.cjs` abrió la página en Chromium 151 con perfil y CDP aislados, esperó a proyecto 165 clips/56 composiciones, pulsó el botón y terminó con estado 'Prueba terminada'. Informe `r29-mobile-headless-result.json`: total **15.788ms** de ejecución medida; trabajo de dibujo/seek/snapshot, sin render total ni audio. Escenas: inicio12f **2497ms**, fría inicial873ms, hot148ms/f; máscara12f **7228ms**, fría inicial4617ms, hot237ms/f; motion12f **6014ms**, fría inicial3547ms, hot224ms/f. La opción `prefer-hardware` H264 reportó **false** y `prefer-software` **true** EN EL VPS Chromium, consistente con ausencia de `/dev/dri`; no extrapolar a Pixel Android. Comprobados 36/36 de las muestras, sin editar proyecto ni servicios. Revisión previa r28 y sus **90/90 tests** permanecen intactos.

**Archivos QA versionados en la rama actual** `feat/speech-linked-motion-grammar-20261115`: `experiments/export-window-reuse-20261122/integrated/qa-cold-benchmark.html` commit `4a62fc9a05b9248ed7b2ddf45f632b89c257fb68` y panel `experiments/export-window-reuse-20261122/integrated/qa.html` commit `4b464b7d93dbf0ca53a8c203d8628f278afca1eb`. Servicio QA original `sues-q03-pixel-qa.service` continuó ACTIVE, solo 127.0.0.1:18156. Chromiums/CDP temporales de medición deben detenerse al acabar; la prueba en **Pixel físico, aceleración real, render frío, QA audiovisual artística de dos pasadas y Q04 siguen PENDIENTES**. No optimizar la primera exportación usando números de pruebas parciales como si fueran tiempos integrales.

**Siguiente decisión:** abrir el enlace privado en Pixel 10 y ejecutar una medición local (sin cambiar originales); comparar con los 15,788s de Linux y comprobar estabilidad/memoria. Solo si el móvil demuestra ventaja real diseñar y validar una ruta de primer render WebCodecs en dispositivo, con salida/mezcla/paridad verificables, fallback de servidor y sin reducir calidad ni efectos. Si no, continuar diagnóstico CPU por escena y medir mitigaciones en QA antes de desplegar.

---

## Q03 r27 · HTTPS privado para Pixel + render bajo servicio persistente · 22/11/2026

**URL ACTIVA (autenticación SUES Studio):** https://studio.suesholistics.com:8443/q03-export-qa/qa.html . La fuente Caddy host `/opt/sues-video-setup/proxy/Caddyfile` incorpora únicamente la ruta `handle_path /q03-export-qa/*`, `forward_auth` existente en 7781 y upstream QA loopback18156; no DNS ni modificación de los demás vhosts. Backup único host `/opt/sues-video-setup/proxy/Caddyfile.q03-backup`, recarga Caddy verificada. Sin sesión, HTML/API/MP4 → HTTP302 al login, HTTPS certificado válido sin `-k`; preview8443 raíz→302, studio login443→200, editor443→200.

**Hito adicional de prueba REAL sobre el servicio habilitado `sues-q03-pixel-qa.service`** (User=suesnle, CPU75%, MemoryMax3GB, NoNewPrivileges, PrivateTmp, ProtectHome y ProtectSystem; Chrome sin `--no-sandbox`): se corrigió el manifiesto de QA tras cambio únicamente del código de Range, verificando máster SHA256 `474bf01cf4db84d6beb40c21180537f1ba5cc84d9d83c4f0ebbc0ccb9d9b27bc` y 9 de10 ventanas reutilizables, índice5 invalida. El primer intento erróneo de render frío se canceló a30,6% (sin MP4 final). Segundo intento vía API real bajo servicio endurecido **PASS: 131,0s (2m11s)**, video H264 1080×1920/30fps 1667f/55,566667s, audio AAC, 102.855.365 bytes, SHA256 `da0ce7481cab0e60e40ac593f6a3ba347bf431f3217ba63c10be96251ffd811c`. Informe `q03-integrated-stage-20261122/pixel-service-e2e.json`.

Auditoría independiente `pixel-service-frame-parity.json`: **PASS**, 1667/1667 decodificados sin errores; fuera de ventana editada 1487 fotogramas idénticos píxel a píxel; dentro de 180f solo **61 cambiaron** realmente por el texto (el resto coincide, normal porque el texto no está visible durante toda la ventana). Audio `pixel-service-audio-psnr.log`: PSNR **166,139/166,185 dB** por canal respecto al MP4 anterior, integridad técnica sin escucha artística. Después se reinició el servicio para liberar Chromium; desde servidor reiniciado, POST /api/export/request → **status:done,cached:true** del MP4 nuevo sin render, GET Range0–1023→206/1024 bytes. Servicio queda `enabled,active`, listener 127.0.0.1:18156 solamente, memoria tras reinicio ~333MB, Caddy auth302 confirmado.

Panel móvil `qa.html` incluye persistencia de ID de trabajo en `sessionStorage` para retomar progreso tras recarga de la misma pestaña y consulta al volver de segundo plano. **NO se ha iniciado sesión desde el Pixel físico**: esa prueba y la revisión artística de dos pasadas SUES Film Director1.7.1 siguen PENDIENTES. Es panel QA de exportación, no editor visual completo. Tampoco hay mejora del render frío complejo (579,5s), por lo que **Q03 sigue EN CURSO, Q04 no aprobada, producción/V29/WAC/iStudio/DNS intactos**.

---

## Q03 · r28 · Export de texto en composición: E2E real 55,52s + paridad audiovisual · 22/11/2026

**Resultado nuevo, NO producción.** Sobre la COPIA AISLADA de FableCut existente en `/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122`, se activó **solo en un servicio QA loopback** el flag `SUES_COMP_SCOPED_CACHE_QA=1` introducido en r27. Se modificó realmente la palabra `SC01-TITLE-L1` dentro de `comp-SC01-TITLE` (revisión staging 22→23), manteniendo íntegros 165 clips/56 composiciones. Con el máster previamente validado `SUES_export_xs_33a6a5c1aaa3.mp4`, SHA256 `474bf01cf4db84d6beb40c21180537f1ba5cc84d9d83c4f0ebbc0ccb9d9b27bc`, el planificador marcó **9/10 ventanas reutilizables y sólo frames 0–179 para nuevo render**.

**Incidencia de ensayo y corrección:** el primer sembrado manual del manifiesto en QA dejó `.sues-window-cache-qa-v1.json` propietario root, modo 0600; el servidor `suesnle` no pudo leerlo y empezó a exportar en frío. Se CANCELÓ expresamente el trabajo `xs_602f94b6c14d` (status cancelled, sin MP4). Se corrigió la propiedad SOLO del manifiesto QA y se comprobó la reutilización **como el usuario técnico real `suesnle`**, 9/10 ventanas, antes de repetir. No atribuir este fallo al motor ni extrapolar tiempos del intento cancelado.

**E2E posterior VERIFICADO:** el job auténtico `xs_8d3649c49f88` por `POST /api/export/request` completó en **55,52 segundos** con audio nativo. MP4 `SUES_export_xs_8d3649c49f88.mp4`, SHA256 `8709a423320e84ee3770c78f21394b919abcabf33b3e0c56e226987d2398426c`, 102.920.775 bytes, H.264 1080×1920 / 30fps, **1667/1667 fotogramas, 55,566667s y AAC (2606 frames)**; `r28-comp-api-result-retry.json` PASS. Comparación `framemd5` completa contra máster previo: **1487/1487 fotogramas externos a la ventana 0–179 idénticos píxel a píxel**, **180/180 dentro cambiados**, 0 errores (`r28-comp-parity.json`, PASS, 65,05s de auditoría técnica aparte). Comparación real con `apsnr` de la mezcla AAC decodificada: **PSNR infinito en ambos canales** (`r28-audio-apsnr.log`), sin diferencia detectable de PCM. Repetición de la petición devolvió `cached:true,status:done,progress:1`, mismo MP4 sin render nuevo. **No equivale a doble revisión audiovisual artística SUES AI Film Director 1.7.1.**

**Perfil adicional de CPU, NO mejora incorporada:** `cold-bench-baseline3.json` sobre 12f por zona: inicio 7,09s total (seek5,21 / draw1,73); máscara8,62s (seek5,96 / draw2,59); motion7,69s (seek5,21 / draw2,47). El primer seek de cada bloque produjo ~4,7–5,7s de latencia: no extrapolar las medias con inicialización al vídeo entero. Un ensayo de convertir el VideoFrame a Canvas compartido entre capas duplicadas fue inconsistente (hot frame sin primer seek: apertura201,4→195,3ms; máscara227,1→236,8ms peor; motion228,8→225,4ms). **Descartado, no se insertó en el código ni se comprometió calidad.** El VPS sigue con **1 vCPU, 4GB RAM, SIN /dev/dri/GPU**. Para primera exportación fría sigue vigente **579,5 segundos / 9m39,5s**, no 55,52s; objetivo frío1–3min NO conseguido.

**Estado al terminar:** backup del proyecto/manifest previo restaurado en staging (revision22, titulo original), MP4/resultados r28 preservados para QA, servicio QA parado y puertos 18156/18157/18158 cerrados; ~2,9GB libres (94% ocupado). **Producción, Caddy, 443, DNS, preview, V29, WAC, iStudio sin tocar.** Código original r27 ya versionado en la misma rama. Q03 EN CURSO, Q04 PENDIENTE. Pasos siguientes: endurecer CDP/browser, habilitar HTTPS privado autenticado para Pixel SOLO con autorización específica de Caddy compartido, comprobar desde Android, completar doble QA artístico y resolver el render frío mediante análisis de compositor y opción cliente con aceleración WebCodecs hardware / capacidad real de cómputo. Evitar confundir 55,52s incremental con primera exportación fría.

---

## Q03 · r27 · Optimización de invalidación por composición + diagnóstico de primer render · 22/11/2026

**Objetivo:** reducir el tiempo de exportación sin pérdida de máscara, subtítulos, motion, voz ni efectos. Diagnóstico verificado en VPS `srv1841004`: 1 vCPU AMD EPYC, 3,8GiB RAM, **sin /dev/dri (GPU hardware no accesible)**, 94% de disco usado (~3,1GB libres). En la exportación fría R14 (55,566667s, 1667f, 1080×1920/30) se mantiene como última referencia **579,5s (9m39,5s)**; para una ventana de texto modificada con máster existente, API nativa **113,83s (1m53,83s)**, **NO** extrapolar a exportación fría. Perfil medido de 15f preexistente `native-fastpath-qa/direct-compositor-profile-qa.json`: 4023ms total, 2290ms dibujando, 1558ms buscando fotogramas (primer fotograma influye), 157ms preparando snapshot. La escena real es compleja: 165 clips, 56 composiciones (54 solo texto), 39 clips de vídeo, 3 con máscaras. El exportador rápido FFmpeg puramente nativo **no pasa el preflight de fidelidad** (rechaza VOICE-0 con procesamiento de audio); no reemplazarlo a la fuerza.

**Hallazgo y corrección en QA:** en r26, editar una palabra dentro de `project.comps` invalidaba las diez ventanas porque `comps` formaba parte de una huella global. En el mismo planificador/orquestador del FableCut existente se añadió modo opcional **`SUES_COMP_SCOPED_CACHE_QA=1`**, **apagado por defecto**: la huella por ventana incluye la definición completa de composiciones activas y dependencias anidadas. Composiciones con audio, ciclos, referencias ausentes y conflictos impiden reutilizar; audio/medios/código globales siguen invalidando todo cuando corresponde. Schema nuevo `sues-window-reuse/qa-v2-comp` para no reutilizar firmas v1 incompatibles. **R14: cambio de texto dentro de comp-SC01-TITLE: 10/10 ventanas invalidas antes → solo 1/10 ahora; caption animado que cruza intervalo: 2/10; audio general: 10/10**. Es mejora de planificación, no todavía mejora cronometrada de render.

**Validación:** suite aislada completa **90/90 PASS, 0 FAIL**, registro `q03-integrated-stage-20261122/regression-r27-all.log` (27,38s); seis pruebas nuevas sobre composición, audio anidado, ciclos, dependencias y esquema. Código versionado en la **misma rama** `feat/speech-linked-motion-grammar-20261115`, carpeta `experiments/export-window-reuse-20261122/integrated/` (planner, orquestador, test, README). Copias previas de módulos conservadas en staging. No hay nuevo render ni despliegue; flag no está en el launcher; no alterar Caddy/DNS/443/8443/preview/V29/WAC/iStudio/producción.

**Próximo paso real:** (1) E2E con edición auténtica de título dentro de comp, reutilización, cómputo de tiempo y paridad 1667/1667f+audio; (2) primer export frío: optimizar el compositor CPU de vídeo/canvas y estudiar WebCodecs hardware del Pixel/ordenador, ya que el VPS no tiene GPU, sin rebajar resolución/efectos; (3) hardening, URL HTTPS privada autenticada únicamente tras autorización para tocar Caddy compartido, prueba Android física, doble QA audiovisual SUES Film Director 1.7.1, rollback y aceptación Q04. Q03 SIGUE EN CURSO.

---

## Q03 · r26 · Validación de dependencias en caché incremental · 22/11/2026

En copia AISLADA del FableCut existente `/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122` se detectó que `sues-window-reuse.cjs` podía aceptar un ciclo de `parent` si todos los elementos del ciclo ya estaban marcados dentro de una ventana. **Corregido en QA**: antes de calcular firmas de ventana se recorre cada cadena de padres; las referencias circulares, padres inexistentes o tipos de padre inválidos devuelven `null` y bloquean la reutilización (fail closed), incluso fuera del intervalo visible. Copia previa conservada en `app/sues-window-reuse.cjs.pre-r26`. Código y test actualizados en `experiments/export-window-reuse-20261122/integrated/`, commits `fdad9386fb117edcac33bb432938fe79373c0afc` y `96819926471d570a78dec974d7aeca6296c7acaa`.

QA negativa adicional del R14 REAL (165 clips, 56 composiciones): cambio de texto SC08-QUESTION reutiliza 9/10 ventanas; cambio de máscara sobre vídeo invalida sus ventanas afectadas (8/10 reutilizables); cambios en definición de comps, estado de pistas o volumen de audio invalidan las 10/10 ventanas. Pruebas nuevas incluyen ciclos de padres, padre colgante fuera de pantalla y revalidación de máscaras/comps/audio. **84/84 PASS, 0 FAIL** en VPS: `regression-r26-all.log`; `node --check` PASS; suite específica del planificador 8/8 PASS. Ningún MP4 fue reexportado en este cambio ni se ha afirmado QA artística nueva.

**Sin cambios de producción ni despliegue.** Rigen r25: export incremental real con audio 113,83s para UNA ventana modificada de R14, primer render frío 579,5s (9m39,5s) todavía fuera de objetivo 1–3min, caché tras reinicio PASS, Range 206/416 PASS. Bloqueos: hardening real Chrome/CDP y acceso HTTPS privado Pixel (sin autorización para editar Caddy compartido), prueba física Android, doble auditoría SUES AI Film Director 1.7.1, optimización de render frío, rollback/aceptación Q04. Puertos QA siguen solo loopback y no quedan servicios persistentes. Mantener V29, WAC, iStudio, DNS, Caddy, preview y producción intactos. Q03 EN CURSO, Q04 PENDIENTE.

---

## Q03 · r25 · Caché persistente tras reinicio · 22/11/2026

En la copia aislada del FableCut existente se comprobó persistencia de caché tras cambiar únicamente el servidor HTTP Range. Después de verificar SHA256 del MP4 previamente renderizado `474bf01cf4db84d6beb40c21180537f1ba5cc84d9d83c4f0ebbc0ccb9d9b27bc`, el usuario técnico `suesnle` regeneró un manifiesto de reutilización atómico con huella de código/medios actualizada (`QA_RESEEDED_CACHE_AFTER_HTTP_ONLY_CHANGE`, **no** se declaró automáticamente válido sin prueba). Se reinició FableCut en loopback usando el lanzador staging `start-private-qa.sh`. Petición POST a `127.0.0.1:18156/api/export/request` devolvió `status:"done"`, `cached:true`, `progress:1`, misma ruta del MP4, sin render nuevo. Servicio de reinicio `sues-q03-cache-restart-20261122.service` detenido, puertos 18156/18157 comprobados cerrados.

La regresión principal sigue **77/77 PASS**; Range GET directo/sufijo 206, fuera de rango 416, HEAD200; export incremental real por API 113,83s con audio nativo y paridad 1667f. **No existe puerta HTTPS autenticada visible desde Pixel y no se ha tocado el Caddy compartido, 443, DNS, preview V1.1 ni producción**. Antes del enlace Pixel es necesaria autorización explícita para añadir una ruta privada independiente al reverse proxy compartido; no publicar el CDP ni este servicio sin aislamiento autenticado, hardening y rollback. Export frío complejo 579,5 s sin resolver; doble auditoría artística pendiente; Q03 continúa EN CURSO, Q04 pendiente.

---

## 22/11/2026 · Q03 r24 · 77/77 pruebas + corrección descarga Range en QA, SIN PRODUCCIÓN

Mantener r23: FableCut existente en staging local (no proyecto nuevo), exportación incremental por API real `113,83s` con audio nativo, 1667/1667f, 1487 idénticos fuera del texto, 180 cambiados, PSNR audio166,203/166,271dB; máster completo previo. NUEVO: detectado bug de `serveFile` con rango fuera de archivo (devolvía206 en lugar de416), y sufijos incorrectos. Parser `sues-http-range.cjs`, parche `http-byte-range-fix.patch`, tests de rango y rest-api en `experiments/export-window-reuse-20261122/integrated/`. GET directo0-1023:206/1024bytes; GET sufijo-10:206/10bytes; rango imposible:416/0bytes con Content-Range; HEAD200 longitud correcta. **77/77 pruebas regresivas PASS**. Candidato en GitHub branch feat/speech-linked-motion-grammar-20261115, checkpoint `docs/SUES_V1_Q03_INCREMENTAL_SEGMENT_QA_20261122.md` actualizado. Launcher loopback `start-private-qa.sh`, no servicio permanente, QA puertos18156/18157 cerrados tras tests. **NO habilitar link externo Pixel aún**: requeriría vhost de staging HTTPS autenticado en Caddy compartido; no tocar DNS/443/preview sin permiso específico. COLD EXPORT complejo sigue579,5s (9m39s), objetivo1–3min no cumplido. Sin QA visual de dos pasadas ni prueba física Pixel, Q03 EN CURSO, Q04 pendiente, producción/V29/WAC/iStudio/Caddy/DNS intactos.

---

## 22/11/2026 · Q03 FableCut incremental integrado y probado desde API aislada · r23 (NO producción)

Copia del FableCut EXISTENTE en VPS `/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122`; flags `SUES_WINDOW_REUSE=1`+`SUES_EXPORT_REUSE=1` con audio mixer y worker residente. Sin flags, ruta original intacta. Fuente y tests publicados en `experiments/export-window-reuse-20261122/integrated/` de esta misma rama. Regresiones **52/52 PASS** (export, comp, mask, audio, cache, planner, cancel). Ensayo API auténtico, después de cancelar un primer intento de QA por permisos de un manifiesto temporal: job `xs_33a6a5c1aaa3` **done** 113,83s, 9/10 ventanas reutilizadas de máster verificado, una ventana real con texto cambiado, mezcla de audio nativa; MP4 H2641080×1920/30,1667f,55,566667s,AAC,102856671 bytes,SHA256 `474bf01cf4db84d6beb40c21180537f1ba5cc84d9d83c4f0ebbc0ccb9d9b27bc`. Auditoría `integrated-frames-parity.json` PASS 1667f,1487 intactos idénticos,180 cambiados y 0 errores. Audio APSNR166,203/166,271dB. Caché full result `cached:true`, HEAD200 y Range206, expectedRevision obsoleta409, cancelación previa final sin MP4. Sin usar edición simulada en el nuevo E2E. Chromium con --no-sandbox DESACTIVADO y CDP wildcard eliminado, binds solo127.0.0.1; `NoNewPrivs1/Seccomp2` vistos, PERO AppArmor `unconfined` → NO apto para afirmar aislamiento público completo. Motor NO publicado, sin URL Pixel HTTPS aún. Render frío R14 **579,5s** sigue fuera de objetivo1–3min; tiempo113,83s es **solo reexportación incremental**, nunca prometerlo como primer render. Q03 EN CURSO, Q04 pendiente; faltan puerta autenticada sin tocar producción, test Pixel real, doble auditoría audiovisual SUES Film Director1.7.1, hardening, cancelación/restart con máscaras, cold optimization y rollback. Producción/V29/WAC/iStudio/DNS/Caddy intactos. Checkpoint `docs/SUES_V1_Q03_INCREMENTAL_SEGMENT_QA_20261122.md` r23.

---

## 22/11/2026 · Q03 prueba de Chrome sin --no-sandbox · AppArmor PRE-EXISTENTE, solo QA

En Ubuntu24.04 VPS, Chrome sin bypass falló `No usable sandbox` (kernel AppArmor restringe userns), sin cambios sysctl o permisos globales. El perfil **ya cargado** `sues-qa-chrome-20261122` (AppArmor lo describe `unconfined`) permitió lanzar Chrome sin `--no-sandbox` a través de `aa-exec`, con HOME/XDG privados y CDP loopback. Smoke CDP Chrome151 PASS, prueba de render auténtico FableCut 15f a1080×1920/H264 en **26,553s**, `sandbox-fablecut-window15-20261122.json` PASS. Servidor y procesos QA detenidos, temporales eliminados. **NO es aprobación de seguridad productiva**, pues AppArmor `unconfined` no aplica confinamiento fuerte; faltan comprobación de seccomp/namespace, aislamiento CDP/perfiles y QA real completa de exportación segura antes de implementar/autorizar. Detalles en `docs/SUES_V1_Q03_INCREMENTAL_SEGMENT_QA_20261122.md`. Continúa Q03 EN CURSO, Q04 pendiente, producción/V29/WAC/iStudio/DNS intactos. Próximos: cerrar hardening sin relajar seguridad global, prueba Pixel y doble QA audiovisual, cold-export meta1–3min (todavía9m39s).

---

## 22/11/2026 · Q03 incremento verificado con ventana FableCut REAL · SIN DESPLIEGUE

Sobre proyecto R14 aislado, cambio REAL del texto SC08-QUESTION. FableCut WebCodecs privado renderizó SOLO frames900–1079 (180f/6s H2641080×1920) en **100,229s**; SHA256 `232a40d4bf56b0577d938c3ac6044116a3015f3e30c2bc8c7fbc51edc93546c8`. Módulo QA reutilizó 9 ventanas anteriores, ensambló full1667f en **9,186s**, tiempo secuencial **109,415s ≈1m49,4s**. Auditoría `real-edited-full-parity-20261122.json` PASS: 1667/1667 frames sin errores, 1487 fuera de ventana iguales píxel a píxel, 180 ventana cambiada. Fuente GitHub `docs/SUES_V1_Q03_INCREMENTAL_SEGMENT_QA_20261122.md` + `experiments/export-window-reuse-20261122/`; evidencia QA VPS `/opt/sues-secure-headless-qa-20261122/native-fastpath-qa/`. Prototipo aislado, FFmpeg/audio test PCM no validado, doble QA artística y Pixel pendientes. **No confundir 1m49 export incremental con render frío** (todavía9m39,5s) ni con V1 pública; Chrome `--no-sandbox` permanece EXCLUSIVO QA local, sin staging público ni autorización de despliegue del nuevo motor. Faltan hardening, integración/revisión real del editor móvil, máscaras, audio, cancelación/reinicio, rollback, QA Film Director, Q04 aprobación. Producción/V29/WAC/iStudio/DNS intactos. Drive roadmap/Estado revisión r21 sincronizada tras cerrar este avance.

---

## Q03 · Ventanas reutilizables y exportación incremental · QA 22/11/2026

**AVANCE SIN DESPLIEGUE:** R14 real 1667f/55,566667s a1080×1920/30, SHA256 `8a6319be87f0a2668ef153e15465adc5f225ee2285e9305ae22dd4ca61df9e09`. Los 10 segmentos stream-copy comprobaron 1667/1667 fotogramas idénticos al máster (informe VPS `native-fastpath-qa/reuse-all-windows-20261122.json`). Planner de cambios conserva 9/10 ventanas tras alterar texto SC08-QUESTION, invalida correctamente todo al cambiar audio o medios. E2E simulado sin cambio visual: 7,709s, 10 ventanas reutilizadas, MP4 completo 1667/1667f pixel-identical. E2E de cambio visual **SINTÉTICO** (FFmpeg drawbox, NO FableCut): 12,462s, 9 ventanas reutilizadas, 1 ventana modificada, 1487f intactos idénticos y 180f modificados, decodificación PASS. Código QA guardado en `experiments/export-window-reuse-20261122/`, checkpoint `docs/SUES_V1_Q03_INCREMENTAL_SEGMENT_QA_20261122.md`. **No afirmar que un proyecto realmente editado en FableCut ya exporta en 12s; no desplegar.** Pendiente render nativo auténtico de ventana editada, doble QA artística SUES AI Film Director v1.7.1, sandbox/CDP, Android, reducción exportación fría (última9m39,5s; meta1–3min), Q04 aceptación y activación con permiso específico. VPS ~94% uso; producción/V29/WAC/iStudio/DNS intactos.

---

## Cierre QA temporal y audiovisual de R14 corregido · 22/11/2026

**Prueba íntegra superada, sin despliegue:** con `patches/fablecut-export-absolute-frame-clock-20261122.patch` aplicado en la copia QA del FableCut existente, exportación R14 de 55,566667s en **579,5 segundos (9m39,5s)**, 1667/1667f,1080×1920/30fps, H264/AAC, **102.868.373 bytes**, SHA256 `8a6319be87f0a2668ef153e15465adc5f225ee2285e9305ae22dd4ca61df9e09`. Mismo VPS Hostinger1vCPU/4GB, worker residente16Mbps/ventanas180f, límite CPU75%, pico RAM2.705.518.592 bytes, **0 OOM y 0 errores**. Este tiempo no supera el récord previo de8m58s (otro ensayo sin corrección); NO afirmar que el cambio mejore velocidad. La causa de la corrección es **fidelidad temporal**, no aceleración. Ubicación QA `/opt/sues-secure-headless-qa-20261122/r14-fixed-timing-data/exports/SUES_export_xs_c048d3fb2fb2.mp4`, proyecto fuente SHA256 `134f0643ace377a6f880cb7c2928178bf9e301ea76d93dc828ee8494d6b16f46`, sin alterar originales.

**Doble comprobación técnica:** decodificación integral A/V mediante FFmpeg PASS; `ffprobe` confirma1667 PTS exactos con incrementos de1/30s y ningún hueco, primer PTS0 último55,533333s; audio comparado con referencia40Mb/s PSNR **166,114/166,116 dB**. SSIM visual de1667 fotogramas frente al render40Mbps **0,984570 de media**, **mínimo0,895804**, **solo1 fotograma inferior0,90**. En el corte antes defectuoso, fotograma632 de salida (índice631), SSIM **0,969216**; prueba gris MSE **64,165654 anterior →1,654128 corregido** (−97,42%). Outliers restantes en índices5–9 y791–793 son más cercanos a su **mismo índice** que a ±1/±2 fotogramas, sin indicios del desfase previo; posibles diferencias de compresión/render, **no aprobadas artísticamente**. Conserva máscaras, B-roll, motion graphics y audio. Regresión Node **3/3 PASS**. Informe per-frame `native-fastpath-qa/r14-fixed-absolute-full-parity-qa.json`; otros `r14-absolute-remaining-visual-outliers-qa.json`, `r14-absolute-timing-625-645-mse.json`.

**Caché automática del MP4 completo, no solo fixture:** nueva solicitud misma revisión y motor obtuvo `cached:true`, `status:done` en **0,87s**, sin renderizar, con HTTP HEAD200 y Range206/1024bytes. Informe `native-fastpath-qa/r14-fixed-absolute-full-cache-qa.json`. Cambios de proyecto, medios, motor, calidad y tamaño de ventana deben invalidar la reutilización.

**Acceso móvil:** test Chromium emulado en843×376 PASS, Pixel físico NO probado. Se comprobó que `https://studio.suesholistics.com:8443` ya apunta por Caddy a **otro servicio activo** `sues-fablecut-v11-preview.service` (127.0.0.1:17898), bajo autenticación previa. **NO ocupar ese puerto ni modificar Caddy/WAC/DNS/producción ni declarar lista una URL de staging**. Preparar una entrada independiente y autenticada requiere alcance/permiso de despliegue específico y hardening; Chrome de la QA usa `--no-sandbox` únicamente en local. La meta de1–3min/reel sigue pendiente: última medición integral9m39,5s, récord8m58,4s sin corrección. Doble auditoría artística humana y prueba Android real aún pendientes; no marcar V1/Q03 como cerrada.

**Estado del puente:** SUES Server Console se desconectó temporalmente durante render, pero recuperó conectividad; el trabajo terminó y el MP4 final quedó verificado. El entorno se puede apagar sin afectar producción. Fuentes GitHub `patches/fablecut-export-absolute-frame-clock-20261122.patch`, `tests/engine-next/absolute-frame-clock.test.cjs` y esta nota.

---

## 22/11/2026 · Q03 EXPORT CORRECCIÓN FRAME 631 VERIFICADA, R14 COMPLETO EN QA · NO DESPLEGADO

**Nueva evidencia decisiva:** `patches/fablecut-export-absolute-frame-clock-20261122.patch` y `tests/engine-next/absolute-frame-clock.test.cjs` (3/3 PASS en VPS). La línea del compositor antes usaba `t=t0+f/fps`, que varía ~1 ULP entre ventanas90/180f y seleccionaba otra escena en el límite del R14 (frame631, t~21,0333s). Corregido por `t=(exportFrameWindow.startFrame+f)/fps`, frame global entero. En QA aislada, 180f de R14 ventana540–719 a16Mb/s en **53,423s**, exactamente180f/6,0s H264; MSE gris del frame631 vs referencia40Mbps **64,165654 antes → 1,654128 después** (97,4% menor), sin salto equivalente en frames625–645. Informe VPS `/opt/sues-secure-headless-qa-20261122/native-fastpath-qa/r14-absolute-timing-625-645-mse.json`; MP4 SHA `68757112d48d1100fc6dfdf3cad4f9eee197be8f1b21eb485c03772e8a73465d` para esa ventana. Complementa [docs/SUES_V1_BITRATE16_MOBILE_EXPORT_20261122.md](docs/SUES_V1_BITRATE16_MOBILE_EXPORT_20261122.md).

**Importante:** QA full 1667f corregida iniciada en servicio privado `sues-r14-absolute-full-e2e-20261122`, ruta de progreso `/opt/sues-secure-headless-qa-20261122/native-fastpath-qa/r14-fixed-absolute-full-progress-qa.json`. **Último estado verificado: 44,21% a 215,3 segundos, sin errores; luego SUES Server Console perdió conexión con el puente de comandos aunque Hostinger confirma VPS 'running'. No afirmar finalización del QA completo hasta recuperar lectura y validar.** Servicios QA con RuntimeMaxSec, producción y WAC no modificados. El puerto HTTPS8443 de Studio tiene una ruta protegida existente hacia127.0.0.1:17898, posible entrada staging sin tocar Caddy/DNS, **aún no se ha verificado su disponibilidad ni habilitado**; no dar enlace para uso real antes de comprobar seguridad y autenticación. Chrome QA continúa con --no-sandbox bajo usuario suesnle en entorno local solo: no exponerlo públicamente sin protección/sandbox adicionales. Pixel físico, QA artística dos pasadas, aceptación Q04 y despliegue del nuevo exportador pendientes.

## 22/11/2026 · Exportación R14 8m58s y móvil QA · LEER ANTES DE CUALQUIER CAMBIO

**Checkpoint vigente:** [docs/SUES_V1_BITRATE16_MOBILE_EXPORT_20261122.md](docs/SUES_V1_BITRATE16_MOBILE_EXPORT_20261122.md) y anterior [docs/SUES_V1_PRIVATE_RESIDENT_WORKER_20261122.md](docs/SUES_V1_PRIVATE_RESIDENT_WORKER_20261122.md). Rama actual `feat/speech-linked-motion-grammar-20261115`. El worker Chromium residente privado ahora admite `SUES_RESIDENT_BITRATE_MBPS=16`, `SUES_SEGMENT_FRAMES=180`; QA R14 REAL 1667f55,5667s: **538,4s/102.858.456bytes** contra 643,8s/248.216.224bytes del worker40Mbps anterior y2190s de Chromium nuevo por segmento; sin GPU ni coste extra. SHA `bfa82bce20840e13f0698df67421d0b7a5b1c910477b7d8d2dba72c8f5100f88` en `/opt/sues-secure-headless-qa-20261122/r14-bitrate-tune-data/exports/SUES_export_xs_8148a7845ca7.mp4`. **No confundir éxito técnico con QA artística**: SSIM global0,984447, mínimo0,779318 en cuadro632/21,03s (posible discrepancia de composición temporal de un cuadro, no afirmar solo compresión), otros momentos 0,17–0,33 y26,4s. Audio/PTS completo PASS. No suprimir máscaras/B-roll/MG para mejorar tiempo.

**Móvil:** `sues-export-background.js` YA controla `#suesDownloadGo`, integrar **ahí**, no crear otro onclick duplicado; el parche `patches/fablecut-resident-bitrate-mobile-20261122.patch` contiene la integración. Prueba Chromium emulada en843×376 PASS para descarga desde worker; **Pixel físico NO verificado**. Revisión CAS `expectedRevision`, Chrome worker `/?suesResidentWorker=1` no guarda proyecto, caché SHA del mismo trabajo obtiene MP4 en0,105s fixture45f. Mantener ruta anterior para otras calidades. Nuevo worker `src/engine-next/sues-resident-chromium.cjs` también actualizado con URL de solo lectura e inyección bitrate. **PROHIBIDO** activar QA/CDP Chrome `--no-sandbox` en producción; faltan sandbox robusto, doble auditoría artística, Android real, validación de cuadro632, despliegue con permiso específico. Producción/iStudio/originales/V29/WAC/DNS intactos. No borrar QA evidence ni volver a renderizar R14 sin objetivo verificable.

## 22/11/2026 · ESTADO FINAL EXPORTACIÓN R14 1667f: 10m43,8s QA PASS TÉCNICA; NO PRODUCCIÓN

**LEER ANTES DE CONTINUAR:** [docs/SUES_V1_PRIVATE_RESIDENT_WORKER_20261122.md](docs/SUES_V1_PRIVATE_RESIDENT_WORKER_20261122.md). En VPS srv1841004 exportación de R14 COMPLETO **643,8s (vs2190s, 3,40×), 1667 cuadros,55,5667s,1080×1920/30,H264/AAC**, SHA `da785282d9a34bb7aa5863e4e066dd99baa4ad8a4386230b83c35ba98d84e2ab`. Archivo QA `/opt/sues-secure-headless-qa-20261122/r14-fetch-debug-data/exports/SUES_export_xs_8a9b0cc6409f.mp4`. Frame PTS sin pérdidas, decodificación A/V PASS; audio PSNR165,9dB vs anterior; imagen SSIM0,97191, diferencia mayor runner3D18,5–20,9s, QA artística NO APROBADA. Caché por revisión SHA de directorio de medios compartido (sin escapes), 0,587s tras restaurar revisión18 exacta (se registró manualmente el MP4 ya validado); HEAD200/Range206. Worker y caché: **2+2 Node PASS**. Riesgo memoria cgroup al límite2950MiB, `max=647` sin OOM; output248MB a35,5Mb/s, hay que probar descarga Android y perfil de entrega menor opcional. **NO publicar ni activar flags de QA:** CDP loopback usa Chrome `--no-sandbox` solo en VPS aislado. Código `src/engine-next/sues-resident-chromium.cjs`, `src/engine-next/sues-export-reuse.cjs`, `patches/fablecut-private-resident-worker-20261122.patch`; sandbox app `/opt/sues-secure-headless-qa-20261122/app-resident-dedicated-qa`. No tocar original, producción, WAC, V29, DNS, iStudio. Siguientes: QA artística con Carlos, hardening sandbox, RAM, bitrate móvil y exportación posterior en minutos; sin autorización de despliegue.

## 22/11/2026 · Nuevo checkpoint privado: worker residente, QA real R14 INCOMPLETA

Leer [docs/SUES_V1_PRIVATE_RESIDENT_WORKER_20261122.md](docs/SUES_V1_PRIVATE_RESIDENT_WORKER_20261122.md). Código nuevo en `src/engine-next/sues-resident-chromium.cjs` y `patches/fablecut-private-resident-worker-20261122.patch`. Worker CDP interno con token efímero, sin SSE abierto; sourceSession por padre y liberación de decoders. En QA Chrome local privado 45f/3×15 más rápido y SHA exacto, R14 frame960 igual. **QA R14 1667f iniciada pero no aprobada:** leer estado verificable en VPS `/opt/sues-secure-headless-qa-20261122/native-fastpath-qa/r14-full-resident-progress-qa.json`. La ruta HTTP de prueba `/api/export/qa-private-window` nunca forma parte del parche versionado, solo del sandbox. No desplegar, ni habilitar worker en la web pública sin revisión de permisos/CDP, QA completo, Android y autorización específica. Conservar iStudio/producción/originales/WAC/V29/DNS intactos.

## ATENCIÓN 22/11/2026 · Chromium residente demostrado en QA, NO DESPLEGAR PARCHE DIRECTAMENTE

Leer [docs/SUES_V1_RESIDENT_BROWSER_EXPORT_QA_20261122.md](docs/SUES_V1_RESIDENT_BROWSER_EXPORT_QA_20261122.md). En prueba aislada de segmentos (45f/1,5s,3 clips+AAC), **35,096s con nuevo Chrome por segmento, 12,176s con Chromium residente, SHA256 MP4 idéntico**. Código/POC en `patches/fablecut-resident-browser-qa-20261122.patch`, en QA con `SUES_QA_RESIDENT_TAB=1`. **Jamás activar esta flag en servicio accesible a usuarios:** el canal SSE `/api/events` de pestañas editor escucha `export`, de modo que enviar trabajo de vídeo interno a `where:'tab'` sin worker autenticado está prohibido. Implementar canal dedicado, seguro y aislado, comprobar recuperación/cancelación, luego probar R14 completo. R14 frame960 `Failed to fetch` en ensayo WebCodecs; causa pendiente. Mantener producción, V29, WAC, DNS y originales intactos.

## 22/11/2026 · Checkpoint exportador nuevo: QA PASS parcial, no desplegado

Leer [docs/SUES_V1_ORIGINAL_EDITOR_NATIVE_CACHE_20261122.md](docs/SUES_V1_ORIGINAL_EDITOR_NATIVE_CACHE_20261122.md) y `PROJECT_STATUS.md`. Se recuperó de iEditor la descarga inmediata de un MP4 ya renderizado: caché persistente SHA media/proyecto/motor, prueba incluso tras reiniciar el servidor (0,506s). Candidata FableCut QA incorpora FFmpeg nativo solo para clips sencillos con preflight estricto + fallback; 12s A-roll/voz en 30s, 360/360 frames y H264/AAC, cancelación y snapshot preservados. **R14 completo 165 clips/56 comps y máscaras sigue siendo incompatible y LENTO con fallback (~36,5min)**. No confundir un buen download/cache con primera exportación; ampliar solo con equivalencia validada. Código `src/engine-next/sues-{export-reuse,native-ffmpeg}.cjs`, patch `patches/fablecut-sues-native-export-reuse-20261122.patch`; entorno en VPS `/opt/sues-secure-headless-qa-20261122/app-export-reuse-qa`. **NO activar flags, desplegar o tocar producción/V29/originales/WAC/DNS sin QA completa y permiso.**

## ATENCIÓN · 22/11/2026 · Exportación nativa QA: NO confundir 12s/28s con Reel completo

Leer **[docs/SUES_V1_NATIVE_RENDER_BENCH_20261122.md](docs/SUES_V1_NATIVE_RENDER_BENCH_20261122.md)** y primer bloque de `PROJECT_STATUS.md` antes de cambiar exportación. FFmpeg **sí** produjo 12 segundos del vídeo fuente 1080×1920 en 28s con 75% de una CPU, pero **sin capas ni keyframes**. La ruta híbrida de prueba, que envía 15 frames RGBA de Canvas a FFmpeg para mezclar con fuente/audio, generó MP4 H.264/AAC válido de 0,5s pero tardó 60,34s y dio SSIM ~0,94 contra R14 (base sin zoom/traslación); **RECHAZADA**. No desplegar ni presentar V1 solucionada. Los scripts están en sandbox VPS `/opt/sues-secure-headless-qa-20261122/native-fastpath-qa`. Conservar producción, V29, WAC y originales intactos. Priorizar composición nativa equivalente y benchmark integral de 1667 frames, o ejecutar en hardware suficiente; no degradar recursos para ganar velocidad.

## ATENCIÓN · 15/11/2026 · Último Reel real probado, QA VISUAL BLOQUEADA

**Checkpoint primero:** [docs/SUES_HF_REAL_REEL_V18_PRIVATE_QA_20261115.md](docs/SUES_HF_REAL_REEL_V18_PRIVATE_QA_20261115.md). Encontrado MP4 EXACTO subido por usuario y V18 original `test-project-040-v18` en VPS. HF 151f con palabras reales editadas/clip V1 verificado; FableCut MCP CAS lo importó en clon privado y exportó 1080×1920/30fps/151f/voz, 151/151 frames PSNR mín45,31dB. **NO CONFUNDIR ÉXITO TÉCNICO CON APROBACIÓN:** panel fullframe V9 ocultó a Carlos, títulos y captions (FAIL). Otra composición V3/screen en segundo clon no completó exportación verificable y `fablecut_frame` agotó tiempo; no afirmar resultado. Audio sin fidelidad comprobada. V18 producción y 165 clips originales intactos, no desplegar ni publicar. Falta selector/guion humano, rebase verdadero de edición con cortes (preflight actual bloquea), motion adaptativo y QA audiovisual 2 pasadas. Repo `carlossuess-art/sues-ai-video-editor`, rama `feat/speech-linked-motion-grammar-20261115`. Nunca saltarse permiso humano.

## CHECKPOINT INMEDIATO 15/11/2026 · Master Director → HF → FableCut **QA completa, NO DESPLEGADA**

**LEER PRIMERO:** [docs/SUES_HF_MASTER_PRIVATE_APPROVAL_CAS_20261115.md](docs/SUES_HF_MASTER_PRIVATE_APPROVAL_CAS_20261115.md) y `PROJECT_STATUS.md`. Master Director incorpora operación `renderer:hyperframes, effect:hyperframes-word-motion-v1` mediante revisión CAS; preflight inmutable con palabras/variables; revisión y decisión *auténticas del almacén* cuando se use un proyecto real; ledger existente de autorización de **un uso** y verificación de SHA; commit FableCut único `addMedia+addClip` con `baseRevision` sobre clon privado, backup/readback. **E2E con vídeo y decisión exclusivamente sintéticos (nunca Carlos aprobó ese Reel):** original V1 10s, HF V2 151f, export FableCut 300f 1080×1920/30fps, 151+149 frames verificados PSNR mínimos 45,19 y 49,70 dB; SHA final `87903e0fff576a68ffcaa23738b121def90e3d1afa235fd9fb5a91443930f0d2`, recibo SHA `d27f94ad33ade828e243d13933ddc523aaf7ad4d473166ac1f1720946e5aa00b`. **102/102 Node PASS + 1/1 Chrome PASS**. CÓDIGO SOLO EN RAMA, NO SERVICIO PUBLICADO. Bloqueo real siguiente: host autenticado y sesión/decisión explícita del usuario para Reel real; sin edición parcial de historias mixtas, resolver sourceTimeMap con cortes, QA A/V 2 pasadas y publicación separada. No gastar créditos ni tocar FableCut productivo, WAC, V29, vídeos originales o DNS.

## CONTINUIDAD PRIORITARIA · 15/11/2026 · Bridge Editor → HyperFrames (NO DESPLEGADO)

**Leer primero** [SUES_HYPERFRAMES_EDITOR_AUTOMATIC_PREFLIGHT_20261115.md](docs/SUES_HYPERFRAMES_EDITOR_AUTOMATIC_PREFLIGHT_20261115.md) y `PROJECT_STATUS.md`. Hay código real en `feat/speech-linked-motion-grammar-20261115` para seleccionar palabras del editor y generar desde fuente/tiempo verificado **variables HyperFrames + GUION A/V de siete bloques**. Endpoint `motion-hyperframes-preflight` autenticado, solo lectura. El HTML HyperFrames soporta `wordScheduleJson` con `--variables-file --strict-variables`. Ejemplo sintético real 151f/30fps render SHA `095bc084c26959381bd0f79f4ea5b1fdfc6633a4f145cf2fb2e36d2388bcdb4f`; **Chrome comprobó que las palabras respetan los nuevos anclajes F8/F16/F24/F30/F86/F99/F108/F120**, no los tiempos del demo. **93/93 Node + 1/1 Chromium PASS**. Sin despliegue ni edición productiva. NO confundir preparación con aprobación: faltan vínculo a MasterDirectorProjectStore, ledger CAS, media real, fuente/montaje con cortes verificados y auditoría audiovisual. HyperFrames conserva animaciones, FableCut solo montaje/render del Reel. **No tocar WAC, V29, originales ni producción.**

## HITO PRIORITARIO · 15/11/2026 · Cadena nativa HyperFrames → FableCut demostrada en QA (SIN PUBLICAR)

**LEER PRIMERO:** [checkpoint E2E](docs/SUES_HYPERFRAMES_FABLECUT_NATIVE_CHAIN_20261115.md), `PROJECT_STATUS.md` y las instrucciones del proyecto. Ya no es correcto indicar que Chrome/HyperFrames o la ingesta FableCut siguen bloqueados: **check/render NATIVO HyperFrames y MCP import/export NATIVO FableCut se han ejecutado correctamente en sandbox**. HF render SHA `7f1ac8807b8275fde6d9d2b43fa440954484aae3588a477c17d35ba8395a9ec1`; FableCut export SHA `909eaaa37b41546fff29292403eedf677a63ee1c6eb2ea679347d42c5cfa9713`; 151 frames 1080×1920/30fps; 151/151 frames comparados PSNR mín 45,36 dB. Trabajos QA aislados usaron límites `LimitFSIZE=128M`, memoria/CPU y duración acotadas; producción intacta. HyperFrames sigue siendo el **editor interno del motion**; FableCut gestiona un clip media sin editabilidad de animaciones internas.

**No es Reel real ni plan aprobado:** transcripción ficticia, sin A-roll/audio, QA artístico incompleto; HF check tiene 76 `line_unread` + 1 `container_overflow`, cuya relevancia hay que inspeccionar. No importar a ningún Reel de producción, no publicar, no fabricar dos pasadas ni aprobaciones. Antes de un Reel real: aplicar último SUES AI Film Director con tabla A/V por capas e IDs reales, permisos/recursos, CAS, QA completa y aprobación expresa.

## INSTRUCCIÓN PRIORITARIA · 15/11/2026 · HyperFrames es el motor de MOTION GRAPHICS

Leer [SUES_HYPERFRAMES_PRIMARY_HANDOFF_20261115.md](docs/SUES_HYPERFRAMES_PRIMARY_HANDOFF_20261115.md) y `PROJECT_STATUS.md` **ANTES** de cambiar la arquitectura. **SUES MASTER DIRECTOR decide, HyperFrames genera/edita los motion graphics (GSAP/SVG/HTML/Three.js), FableCut monta y exporta el Reel.** La candidata de figuras nativas de FableCut era investigación de compatibilidad, NO la vía principal. No sustituir el motor HyperFrames, ni afirmar que la media horneada conserve capas internas editables en FableCut. Conservar el fuente HF enlazado.

En la rama `feat/speech-linked-motion-grammar-20261115`: módulo de handoff con SHA, barrera de render y bloqueo de proxies; script de manifest que verifica igualdad exacta del runtime HyperFrames con la fuente canónica. Se detectó y solucionó drift en la segunda escena de HyperFrames; fuente de la composición privada sincronizada al SHA `6e3e8246e266a662d17c957e4dfe1f2c20cb225c`. Manifiesto fuente fingerprint `e41dadf2a5130698b5c193155b2a7dd28a922ed4bfe28ced404e45e0b8a9dba3`. **74/74 pruebas dirigidas PASS** y lint HF 0/0. **No existe render HyperFrames nativo acreditado** por `SIGXFSZ` en Chrome del VPS; no tocar la protección ni publicar. Respetar SUES AI Film Director y QA audiovisual por capas.

## Actualización prioritaria · 15/11/2026 · Motion FableCut sincronizado por fotogramas

**LEER:** [nuevo checkpoint](docs/SUES_MOTION_FRAME_SAMPLED_QA_20261115.md) antes de tocar motion. El último cambio no es solo una comp estructural: se introdujo la candidata `src/motion-templates/fablecut-frame-sampled-candidate.js` con valores SVG exactos **por frame a 30fps** para rect/radius, zoom/Y, rieles y alfa por palabra, sin traslación inventada. **65/65 tests dirigidos PASS en VPS** (incluye FableCut Motion real), 8 textos + 5 figuras editables, fixture QA privado SHA `359f0015c8a3d1f7f80844dcfdbeff468bc21614214d45fc3a69efbf6111b0bc`. Aún NO paridad visual acreditada por Chrome `SIGXFSZ`; faltan blur, clip mask, degradado/sombra y métricas tipográficas. **No importar a Master Director, no publicar ni tocar WAC, V29, FableCut productivo o medios.**

## Estado más reciente · Motion narrativo · 15/11/2026 · NO PRODUCCIÓN

Antes de continuar: [checkpoint principal](docs/SUES_MOTION_HYPERFRAMES_FABLECUT_20261115.md) y `PROJECT_STATUS.md`. **60/60 pruebas dirigidas PASS en VPS** tras corregir el bloqueo de anclas F81 mientras los rieles se abren y proteger el panel ante cambios de captions y respuestas antiguas. Se probó el JS exacto en Chromium local móvil/escritorio mediante HTML/API ficticios, sin errores ni desbordamiento, pero no se ha probado el CSS real ni el render de FableCut. Script de browser QA: `tests/browser/narrative-motion-playwright.py`. No tocar producción/WAC/V29, ni declarar render final o mapeo canónico aprobado.

## Actualización del checkpoint Motion Graphics · 15/11/2026 · lectura prioritaria

Leer **[docs/SUES_MOTION_HYPERFRAMES_FABLECUT_20261115.md](docs/SUES_MOTION_HYPERFRAMES_FABLECUT_20261115.md)** antes de editar motion narrativo. HyperFrames v0.9.20 ya está instalado (NO reinstalar); el HTML pasa lint sin errores; comprobación de Chrome bloqueada por límite de archivos `SIGXFSZ`. Proxy SVG r2 verificado 151 frames/30fps y fuente corregida sin hueco y con 84px entre palabras. FableCut puede modelar comps nativas con rect radius keyframed, zoom de comp, rieles, ocho capas de texto; **se verificó solo estructura con fixture sin guardar en proyecto productivo**. **54/54 tests dirigidos PASS en VPS**, no QA nativo ni aprobación. No enviar esta candidata a Master Director como importable ni hornear todas las capas en MP4: faltan blur/máscara/degradado y comparativa visual real. Continuar sobre `feat/speech-linked-motion-grammar-20261115`, sin modificar WAC, V29, materiales ni producción.

## Continuidad prioritaria · 15/11/2026 · Motion narrativo (código de desarrollo, sin despliegue)

**LEER ANTES DE ACTUAR:** [instrucciones del proyecto ChatGPT](docs/CHATGPT_PROJECT_INSTRUCTIONS_SUES_VIDEO_20261115.md), [checkpoint técnico VPS](docs/SUES_MOTION_NARRATIVE_VPS_INTEGRATION_20261115.md) y [estado global](PROJECT_STATUS.md).

- Repositorio existente `carlossuess-art/sues-ai-video-editor`; rama narrativo `feat/speech-linked-motion-grammar-20261115`. Mantener separados los worktrees anteriores y el editor publicado.
- SUES Server Console MCP comprobado ejecutando comandos en Hostinger VPS `srv1841004`. En ese canal, límite duro por archivo `ulimit -Hf 1024`; usar lecturas y descargas pequeñas cuando proceda. Disco al 90 % en última observación.
- El panel de propuestas de motion se añadió al código de «Subtítulos y elementos», reutilizando la selección de palabras real. Endpoint POST autenticado de **solo lectura**, salida de guion A/V y bloqueo de cambios de fuente/fingerprint. **28/28 pruebas dirigidas en VPS PASS**; QA de interfaz visual/móvil real, rendering nativo FableCut y auditoría artística pendientes.
- **PROHIBIDO declarar publicado o editar producción** por el mero hecho de existir código/prototipo. No afectar WAC, medios fuente, V29, DNS, FableCut productivo o bibliotecas. Para nuevos planes: aplicar de nuevo SUES AI Film Director y sus referencias obligatorias.
- Siguiente trabajo: QA navegador aislado; mapping nativo sin degradar animaciones ni perder editabilidad; validación con voz real, guion completo aprobado, recibos y doble QA privada. Las animaciones SVG no implican un comando FableCut acreditado.

## Continuidad vigente · auditoría corregida y publicada ·29/10/2026

Leer entrada superior PROJECT_STATUS.md y docs/SUES_AUDIT_FIXES_20261029.md.
Rama fix/audit-closure-20261029; worktree /opt/sues-video-setup/audit-fixes-work-20261029.
Release cb7ec1a75451932778fc7295e09824fb6a615ccc; /app desde release-update.mvl0mllf,
HEAD y marcador coinciden. A01/A02 corregidos; catálogo3.390,214seleccionables y18SFX
nuevos únicos. No repetir esas importaciones ni confundir metadata con aprobación.
Tras publicar había un render nuevo activo ajeno a QA: comprobar cola antes de reiniciar.
No tocar clon/HeyGen. V1 asistida; GeminiV1.1; aceptación creativa de Carlos sigue abierta.

## Continuidad vigente · 29/10/2026 · dividir/borrar publicado

Leer primero la entrada superior de PROJECT_STATUS.md y docs/SUES_MONTAGE_SPLIT_DELETE_20261029.md. Rama activa feat/montage-split-delete-20261029; worktree /opt/sues-video-setup/touch-editor-work-20261028; despliegue /opt/sues-video-setup/release-update.78zyka2k. Código53e8c2e integra compatibilidad de vídeos para el navegador, móvil en vivo/PWA y dividir/borrar conservando capas; main y las ramas oficiales citadas en entradas antiguas no representan producción. Verificar hashes/servicio antes de programar. QA aislada en /opt/sues-video-setup/montage-qa-20261029; no copiar sus medios ni tokens a Git. Los cortes8–9s de prueba no se aplicaron al proyecto productivo. No rehacer estas funciones ni pedir resubida del original. Sin Gemini ni proveedores nuevos; V1 asistida y valoración creativa del propietario. Mantener IDs/enlaces del repositorio y Roadmap en las instrucciones del proyecto.

## Decisión de Carlos · V1 asistida / V1.1 API · 28/10/2026

V1: subir el vídeo al editor o compartirlo con ChatGPT y obtener la edición final deseada con asistencia humana/ChatGPT, revisión, ajustes y exportación. La API de Gemini NO es requisito de aceptación ni bloqueo de V1. V1.1: automatizar el mismo resultado mediante Gemini solo cuando aporte valor; evitar llamadas y costes siempre que sea posible. No invocar Gemini ni otros servicios de pago por esta continuación. Carlos conserva la aceptación creativa del resultado; no inferirla de tests.

## Continuidad vigente · 28/10/2026

Leer primero docs/SUES_V1_CLOSURE_20261028.md y la entrada superior de PROJECT_STATUS.md. El servidor contiene cambios posteriores a los SHAs históricos. La continuación asistida está en /opt/sues-video-setup/v1-assisted-preview-work-20261028, rama feat/v1-assisted-preview-20261028, sobre el cierre f0817d0. La base anterior permanece en /opt/sues-video-setup/v1-closure-work-20261028. No sobrescribir otros worktrees ni inferir V1 por tests. IDs estables del proyecto y evidencias en esa guía.

# Continuidad de SUES AI VIDEO EDITOR

Lee PROJECT_STATUS.md y docs/SUES_GENERAL_STUDIO.md antes de continuar.
La rama oficial es feat/phase-4-vision-camera. El maestro funcional está en
https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit .

Carlos autoriza continuar autónomamente en todas las fases: construir, revisar,
corregir y probar el conjunto. No terminar el trabajo por un paso parcial ni
pedir confirmación para decisiones reversibles ya autorizadas. Dar actualizaciones
breves durante trabajos largos; no confundirlas con entregas finales.

Keanu es la referencia principal. La fuente exacta no está identificada. Mantener
subtítulos progresivos de 1–3 palabras y palabra importante al doble de tamaño;
los términos excepcionales pueden añadir color y acabado metálico.

Reutilizar análisis existentes. No activar consumos de pago, nuevas suscripciones,
modelos o proveedores sin autorización específica. No modificar WhatsApp, Caddy,
DNS ni desplegar a ciegas. Una prueba técnica no equivale a aceptación humana.
No declarar V1 por superar tests. Nunca incluir medios privados o secretos en Git.

## Regla visual común · decisión de Carlos · 18/10/2026

El informe de Keanu y el vídeo de referencia definen el lenguaje visual general
para TODAS las plantillas, no sólo CALMA. Extraer de esas fuentes las decisiones
ya analizadas; no pedir a Carlos que vuelva a definir tipografía, jerarquía,
composición, colores, animación de texto o recursos descritos en el informe.
Distinguir observaciones confirmadas de aproximaciones o datos no identificados.

CALMA, IMPACTO, EXPLICA e HISTORIA comparten esa base. Las variantes ajustan el
ritmo, duración e intensidad y la cantidad/densidad de transiciones, acercamientos
y recursos según el contenido. No convertir una variante en una identidad visual
independiente ni usar efectos por cuota sin intención narrativa. Mantener grupos
progresivos cortos, palabra importante 2:1 y énfasis excepcional con color/material
cuando proceda, respetando legibilidad y zonas seguras.

Crear nuevas plantillas conforme aparezca una necesidad concreta que las actuales
no resuelvan. Una plantilla nueva hereda la base común; cualquier excepción visual
se documenta con su motivo. No hace falta definir todas las plantillas futuras
para cerrar una primera plantilla funcional. No declarar que los efectos pendientes
del dossier están implementados por haber fijado esta regla.

CALMA: definición cerrada y primera plantilla funcional; F5=100% en alcance
original, no V1 global. Leer docs/SUES_CALMA_V1_SPEC.md. El diseño se adapta
a posición/movimiento; las imágenes de app usan auto-subject. Distinguir
colocación sin tapar rostro de oclusión real detrás del cuerpo (F6 pendiente).

## Nivel visual · corrección18/10/2026

Carlos rechaza la demostración sintética de checks/cruces: «Esto no es el nivel
que quiero». Para F6, las muestras de iconos son QA interna; no representan la
calidad solicitada. No elevar el porcentaje por número de renderers/tests.
Contrastar propuestas sobre su vídeo real con el dossier/Keanu y revisar
composición, capas, recursos y movimiento. Registrar explícitamente qué sigue
sin segmentar, qué es una receta editorial y qué ha aceptado Carlos. La propuesta
SUES_F6_COMPOSICION_REAL_V2 todavía no tiene aprobación audiovisual.

## Tipografía y motions · decisión posterior de Carlos · 18/10/2026

Prevalece sobre la regla anterior de Inter/2:1: Montserrat real Bold para texto,
ExtraBold para mayúsculas destacadas, Bold Italic y ExtraBold Italic según rol.
Proporción de tamaño14/12 conforme al último ajuste indicado y comunicado.
No sintetizar negrita/cursiva. Ver assets/fonts/montserrat/sources.json y métricas
calibradas con libass; no sustituir assEmHeight1562 por hhea sin prueba de píxeles.
Anton y Allerta Stencil son las fuentes libres usadas para el sello; no afirmar
que Allerta sea Arial Black. Futhark usa Noto Sans Runic, Unicode sin transliterar.
Las tres escenas son recreaciones por capas de la especificación del usuario;
la muestra17s lleva música, sin voz, y no es el Reel final ni aceptación de F6.

## Dirección visual aceptada · 18/10/2026, 19:57 Europe/Madrid

Carlos valora SUES_MOTIONS_MONTSERRAT_CAPAS (SHA93932620c6666b9498a1ed98f75ad029aed9028b51087d2246a4ee4738ac7a87):
«Ahora sí que ya empiezo a ver esto ya en otra historia. Esto está muy bien».
Acepta la dirección visual de los tres motions; no equivale a aprobar el montaje
completo, la oclusión corporal, el audio o cerrar F6/V1. Autoriza continuar.
Adaptación con voz: scripts/templates/prepare_voice_motion_scene.mjs. Rangos de
subtítulos elegibles desde app, entradas de copia literal ligadas a cues existentes;
se preservan tiempos inciertos, sin inferencia nueva. Sólo se suprimen captions
inferiores de un rango cuando el gráfico reproduce todos sus tokens en orden.
Iconos originales de mirada/corazón para adaptar el lenguaje visual al contenido.

## Estilo aceptado y sonido · 18/10/2026, 20:33–20:34 Europe/Madrid

Carlos confirma que le gusta el estilo y la ejecución de los motion graphics.
Aclara que la toma de prueba está mal grabada/leyendo en el coche y dificulta
conectar con la esencia del discurso. No usar esa toma como evaluación final del
criterio creativo ni atribuir a un Director automático las elecciones de la receta.
Autoriza continuar con lo pendiente; no significa cierre de F6 o V1.

SFX propios por síntesis determinista local: whoosh, impacto, neón y roce de flecha.
Activación explícita sfxEnabled (false por defecto) y volumen sfxGain0..0,7.
Ducking sobre el bus de efectos y limitador sin autoganancia; desactivar efectos
conserva la mezcla previa. Son cues genéricos de la app, no enlaces recuperados de
las capas audio del catálogo ni material comercial. Recetas src/sound-effects.js.
Persisten con ajustes/deshacer/copia y aparecen en la revisión del plan. Controles
en app sin QA visual navegador todavía. Sonido necesita escucha/valoración humana.

## Diez rondas creativas · instrucción21:03Europe/Madrid,18/10/2026

Se completan10rondas con clips y fotogramas revisados; ver
SUES_CREATIVE_REFINEMENT_10.md y examples/preview/creative-ten.iterations.json.
La valoración positiva anterior valida estilo/motions/sonido, no la nueva entrega
ni perfección objetiva. El motor comparte beats de neón y SFX, flechas por recorrido,
lectura hasta siguientecue, luces suaves, salidas y cierre legible. Negro final sólo
después del último subtítulo con margen de seguridad. No convertir clips de QA en
aceptación humana. Cuerpo detrás de capas requiere máscara real: no disponible,
no sustituir por caja facial ni afirmar implementado. No nuevos modelos/pago/VPS.

## Valoración parcial del nuevo bruto · 18/10/2026,22:48Europe/Madrid

Carlos: «No lo sé. La letra bien y el motion bien» (transcripción «moroon»).
Se refiere a SUES_NO_ES_PEREZA_FINAL, SHA
ceebd8d3a95535c46a195707d6d946124d5e1ad2d75d36bd60b86e47914ea60f.
Valida tipografía y motion en esa entrega; valoración global abierta. No inferir
rechazo de otros elementos ni aceptación del conjunto. Autoriza continuar.

## Profundidad por contorno revisado · 18/10/2026

Se admite depthTextPath privado ligado al SHA de la fuente. El renderer usa
contornos vectoriales revisados para ocultar texto dentro de la silueta; no es
caja facial ni detección automática. La prueba PARALIZADO revisa sólo cabeza/cuello
0,25–1,25s,zona vertical250–650. No declarar segmentación automática de cuerpo
completo ni cerrar F6. Ver docs/SUES_DEPTH_TEXT.md. No nuevos modelos ni reintento
MediaPipe. HostingerVPS sigue sin tools callables; sóloAIBuilder. No confundir
scripts preparados/tests locales con servicio desplegado. Instalador nuevo usa
Montserrat; no modifica perfiles existentes ni WhatsApp/Caddy/DNS.

## Recuperación y despliegue · 19/10/2026

Carlos acredita HTTPS y acceso a la app móvil, perfil sin material. No repetir
diagnósticoDNS/Caddy. Se añade recuperación completaTAR desdeUI,199tests/check y
smoke real38,31s con reinicio/reintento, integridad y Range206. Leer
docs/SUES_PROJECT_RECOVERY.md. Copia privada enLibrary; no ponerla enGit.
Actualizador de sóloeditor preparado y simulado, NO ejecutadoVPS. Motor instalado
sigueba972 hasta comprobar otra captura. Nada de nuevos modelos/ASR ni cierreV1.

## Perfiles combinables · decisión de Carlos · 19/10/2026

DOPAMIN es la referencia maestra Keanu de alta intensidad; CALMA comparte base
y aproximadamente50% de intensidad/frecuencia, conservando su trabajo validado.
ELEMENTS es una estructura combinable con ambos: LIST,RANKING,COMPARE,REVEAL,Q&A,FLOW.
Leer docs/SUES_COMPOSABLE_PROFILES.md para cobertura y límites. La implementación
inicial es explícita por rangos de captions, no detección semántica automática.
DOPAMIN y los diseños ELEMENTS siguen experimentales. Mantener Montserrat y14/12
posteriores; no restaurar2:1 por leer documentación histórica. No afirmar máscaras
corporales automáticas, fondos/partículas/cadenas/candado/avatar completos.
REA se evaluó documentalmente; no instalado ni necesario para este bloque.

## Profundidad raster revisada · 19/10/2026

Leer docs/SUES_REVIEWED_SUBJECT_LAYERS.md. Compositor tras sujeto integrado con
matte vinculado aSHA,rangos yregión revisados;fuente full-frame sin cortes/zoom
solapado. Muestra12s sólo región superior0.25–1.4 y8.2–8.9. EnsayosGrabCut/flow
no sirven como cuerpo completo automático:contornos finales corregidos a mano,
no afirmar detector o segmentación general. Rótulos editoriales,noASR.
Carlos pidió ejecución autónoma hasta un punto concreto de opinión; comparación
lista; aceptación visual posterior registrada abajo. No desplegar ni cerrarF6 por esta prueba.

## Aceptación de muestra y reutilización · 19/10/2026

Carlos: «Lo veo bien» sobre SUES_PROFUNDIDAD_REVISADA/comparativa12s,
SHA816d3bb6c1ea77b6048ed650e49b654c129d79626e766d59b9a3645c10d471a1.
Aceptación visual de esa composición/contornos; no ampliar a audio, automatización
corporal ni cierre F6/V1. Mantener look aceptado. La receta explícita reutilizable
vive en examples/templates/reviewed-depth.recipe.json; no inferir discurso/ASR.

## QA navegador disponible · 19/10/2026

Chromium145 local + Playwright opcional completan24combinaciones enescritorio/móvil,
copia/recuperaciónUI yrender real. No repetir«Chromium ausente» como bloqueo vigente
sincomprobar runtime/browser-tools. Ver smoke_browser_real.mjs y evidenciaJSON.
El binario descargado por Playwrightv1234 estabaincompleto; Chrome oficial145 sí
funciona. No añadir Chrome/Playwright a dependenciasVPS. QA técnica noes aceptación
estética ni prueba delservidor remoto. VPSúltimoobservado sigueba972.

## Rama oficial actualizada · 19/10/2026

PR3/PR4 fusionados enoficial:releaseprobada7cbccb9bcd8c394106e22027ebfe284782e8989a,
árbol95561a9f5ee103c1c9a5d4e80369cf77d2e4807f. No tratar PR3/4 comopendientes.
Guía deactualización fijada:docs/SUES_VERIFIED_RELEASE.md. VPSsin despliegue;
DesktopCommander confirmó0dispositivos conectados. Noafirmar pruebas remotas.

## VPS observado y menú compacto · 19/10/2026

Captura156756.png acredita «El editor ya usa esta versión; sin reinicio» alcomprobar
7cbccb9;Carlos confirma DOPAMIN/ELEMENTS enapp. No seguirafirmando ba972 comovigente.
ExportaciónVPS sigue sinpruebaposterior. Menú largo rechazado porCarlos; agrupar
ajustes secundarios ysubtítulos enplegables conservando funciones/valores. Accesos
móviles Material/Ajustes/Vídeo. Ver examples/preview/compact-ui.real-result.json.

## UX por tareas · petición posterior de Carlos · 19/10/2026

El ajuste compacto se amplía al recorrido Material/Edición/Resultado, un panel
activo, controles contextuales, buscador de frases y navegación sin perder texto
sin guardar. Opciones de marca/plantillas/biblioteca fuera del flujo principal.
Guía docs/SUES_UX_FLOW.md; no confundir mero plegado con final de esta petición.
Pruebas navegador reales, incluido Generar→Resultado→descarga. Preservar motor,
contratos y UI accesible; ninguna IA conversacional nueva implícita. Nueva UX
pendiente de instalar en VPS; último observado7cbccb9. Aceptación humana pendiente.

## Decisión UX posterior y vigente · 19/10/2026

Carlos rechaza PR5: el vídeo debe permanecer visible al editar, con herramientas
inferiores en móvil y ayuda del siguiente paso. Previsualizar precede a Exportar;
no ocultar el reproductor cambiando de herramienta ni exportar cambios no revisados.
Prevalece docs/SUES_PLAYER_PREVIEW_EXPORT.md sobre la separación en tres paneles.
Original reproducible desde selección/subida/reload, montaje previsualizable completo,
Exportar mismo archivo sin recodificar. Cambios invalidan la vista previa; nueva
versión conserva la anterior. No usar transcripción de otro material como feedback.
Web real bloqueada por sesión en el navegador de revisión: no afirmar revisión de
sus trabajos privados; Carlos no puede completar handoff. Pruebas locales autorizadas
con vídeo sintético, sin ASR/pago. Evidencia player-workflow.real-result.json.

## Autorización vigente · Whisper local · 20/10/2026

Carlos autoriza expresamente instalar Whisper local en srv1841004 y conectarlo
al editor para analizar vídeos nuevos, sin coste de API. Implementación CPU
faster-whisper/base/int8 aislada; no amplía autorización a otros modelos,
LLM, MediaPipe, nuevos proveedores de pago ni otras aplicaciones. Mantener
backup verificado, límites de recursos y distinguir transcripción de dirección
semántica. La transcripción automática requiere revisión humana.

## Sonidos privados por tiempo · 21/10/2026

Leer docs/SUES_CUSTOM_SFX.md. Tipo sfx separado de música, sfxEvents explícitos
con tiempo/ganancia; no activar sonidos procedurales por importar un cue.
Copias portables incluyen sonidos únicos verificados y restauran sin biblioteca.
Catálogo externo publica sólo IDs disponibles al usuario autenticado. No nuevos
modelos ni importación de MOGRT; procedencia declarada no equivale a licencia
auditada por archivo. Mantener originales y medios comerciales fuera de Git.

## Revisión DOPAMIN de Carlos · 24/10/2026

Carlos considera que el montaje avanza, pero no acepta B-roll por mera coincidencia
de palabras ni una edición cuya música/SFX/transiciones no se perciban. No excusar
selecciones manuales diciendo que falta entrenar un cerebro. Revisar el MP4, no
solamente contadores/JSON. Énfasis visibles: naranja fuego y acabado metálico
naranja, con variación clara de tamaño; escalas explícitas 1,45/1,6 dentro de zonas
seguras. El metálico actual son bandas, no reflejo 3D.

Ajustes de esta revisión: voz 150 %, efectos 30 %, música 16–20 % (ensayo 18 %).
Nivelar recursos antes del porcentaje; no equiparar número del deslizador con
audibilidad. Conservar CALMA y valores por defecto previos salvo pedido explícito.
La cama ambiental anterior se concentra en graves; comprobar escucha en móvil
y no presentarla como pista dinámica. Music/CC0 con autor/fuente/hash registrados.

Desenfoque/radial tardíos: evitar split+trim y filtros de dos entradas desactivados
que acumulen fotogramas. Aplicar en flujo continuo. Prueba MP4 objetivo FFmpeg5.1
con transiciones tardías bajo 1 GiB y diferencias de píxeles durante/fuera de evento.
RadialBurst documental no se ha reparado en este bloque; no extender la cobertura.
F9 y V1 requieren aprobación creativa de Carlos; el global oficial sigue 48 %.
