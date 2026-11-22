# SUES V1 · Diagnóstico de exportación y Chromium residente · 22/11/2026

**Estado real: QA aislada PASS para 15 y 45 fotogramas; NO probado ni desplegado con R14 completo.** Todo sin coste de servicios externos, sin cambios en producción/3010/7780/17969, originales, V29, DNS ni WAC.

## Hallazgo del código

En FableCut aislado, `sues-segmented-export.js` envía por defecto cada intervalo al `export-jobs.js` con `where:'headless'`. El `launch(j)` de `export-jobs.js` inicia un nuevo proceso Chrome con perfil temporal para cada job; `closeBrowser(j)` lo cierra al concluir. Además existe espera de 1200ms entre segmentos. R14 (1667 cuadros; normalmente unas 19 ventanas de 90 cuadros, más audio) vuelve a cargar toda la aplicación e inicializar medios decenas de veces.

FableCut ya conserva decodificadores WebCodecs por media en la misma sesión y cachés de máscaras/comp con límites; `seekVideosTo` no utiliza siempre el `<video>` HTML. La hipótesis de que todos los fotogramas hacen hard seek se **descarta** como generalización. Tampoco se confirmó un límite físico mínimo de 2,2 minutos ni que SSIM~0,94 del híbrido previo fuera por alfa; ese prototipo omitía transformaciones y zoom del A-roll.

## Perfilado real de Chromium — R14, primeros 15 cuadros

Ensayo directo sin codificación ni HTTP, con compositor FableCut actual y proyecto R14:
- 4,158s de pared.
- Búsqueda/decodificación: **1,558s**; recursos: **0,019s**; composición **2,290s**; VideoFrame **0,157s**. Medición inicial puede incluir calentamiento.
- WebCodecs H.264 sin HTTP: 9,012s de pared, suma del bucle8,019s, flush 0,402s, 15 chunks.
- Integrado R14 real ventana `[0,15]`: **32,190s** de pared, `qaPerf.total=8,916s` dentro de Chromium: `seek=4,585s`, `draw=2,497s`, `upload=0,0586s`, `mux=0,5036s`. **La transferencia NO explica el coste dominante**. El coste externo incluye arranque y carga del headless/servicios y espera de orquestación.
- Intento de ventana R14 cerca de frame960, máscaras: **22,342s, FAIL `Failed to fetch`**. Se encontraron presentes todos los ficheros /media, pero no se estableció qué fetch concreto falló. Ventanas posteriores no verificadas. NO presentar prueba integral R14.

## Prueba técnica de sesión Chromium reutilizada

Se aprovechó únicamente en **QA aislada** el evento SSE `export` de la pestaña ya abierta `/api/events` y `runExportJob(ticket)`, usando un único navegador residente para varias solicitudes. El patch [fablecut-resident-browser-qa-20261122.patch](../patches/fablecut-resident-browser-qa-20261122.patch) usa `SUES_QA_RESIDENT_TAB=1` para despachar hijos a `where:'tab'`, permite provisionalmente videoOnly en una tab, y elimina la pausa de1,2s. **NO es un diseño seguro para producción:** todos los clientes de UI escuchan el mismo SSE; hace falta **worker dedicado autenticado y separado de sesiones editor**, nunca activar esta flag en la web pública.

Pruebas equivalentes:
| Ensayo | Headless nuevo por trabajo | Chromium residente | Verificación |
| --- | ---: | ---: | --- |
| Fixture sencillo, vídeo solo, 15f | 10,095s | 3,025s y 2,415s | SHA256 igual en tres MP4 + SSIM1,000000 |
| Orquestador completo, 15f, AAC/H264 | 14,459s | 4,584s | SHA256 **f51cdc15b0fdf4bc65fc815cb7444bb8459c236c05972d0e86144c68741baeca** exacto |
| Orquestador completo, 45f en 3×15f + AAC | **35,096s** | **12,176s** | SHA256 **ea455a47482f228095b348811ae4a9ff1daca4a916b06b6af3cc0a2a173903e1** exacto, 45/45f, 1,5s, 7.529.995 bytes |

Mejora medida: **3,15×** con 15f, **2,88×** con 45f. Más rápido **sin cambiar un píxel ni una muestra del MP4 final**, al comparar proyectos, medios y códigos idénticos. No extrapolar 2,88× como garantía de R14: el Reel tiene 56 comps, 165 clips, máscaras y muchas pistas, con fallos de fetch en escena32s.

## Evidencia aislada disponible en VPS

- `/opt/sues-secure-headless-qa-20261122/app-integrated-profile-qa/app.js`: copia instrumentada con `qaPerf` por etapa, nunca producción.
- `/opt/sues-secure-headless-qa-20261122/app-resident-qa/`: copia aislada con patch de orquestación de pestaña residente.
- `/opt/sues-secure-headless-qa-20261122/native-fastpath-qa/direct-compositor-profile-qa.json`.
- `.../webcodecs-no-upload-profile-qa.json`.
- `.../webcodecs-integrated-profile-qa.json`.
- `.../r14-real-scene-bench-qa.json`.
- `.../resident-tab-export-bench-qa.json`.
- `.../resident-segmented-full-e2e-qa.json`, `.../headless-comparator-full-e2e-qa.json`.
- `.../multi45-resident-versus-headless-qa.json` (reproducible: dos clones de fixture de 45f).

QA guiada, no QA artística. El checkpoint previo `SUES_V1_ORIGINAL_EDITOR_NATIVE_CACHE_20261122.md` conserva el motor nativo para casos sencillos y la caché SHA segura. En iStudio original, descargar un render existente era rápido; el primer render histórico todavía duraba varios minutos.

## Siguiente ingeniería obligatoria

1. **No usar `where:'tab'` genérico en producción.** Diseñar/instalar un worker **único, autenticado, solo interno** con canal/endpoint privado distinto del SSE de tabs abiertas. La cola debe ser atómica; jobs de audio/segmento conservan la instantánea inmutable y la cancelación llega al mismo worker. Health/reinicio/timeout/recuperación; evitar pérdida de revisión, doble ejecución o fuga hacia editores.
2. Resolver `Failed to fetch` en la zona de 32s del R14 instrumentando URL/fetch y la decodificación de H264/mattes; probar escenas con máscaras, cromas, títulos y audio antes de exportar completo.
3. Ejecutar 1667/1667f + AAC con el worker seguro, medir aceleración real frente a 36,5min, comparar paridad visual y sonora en doble pasada + descarga Android; autorización separada antes del despliegue.
4. Si sigue siendo lento, optimizar composiciones de texto repetidas y otros cuellos medidos (no asumir que basta comprar vCPU), manteniendo efectos. El VPS tiene ~4,3GB libres; vigilar temporales.

**Resumen:** se ha demostrado una oportunidad real de rendimiento sin cambiar el motor de dibujo ni degradar efectos, pero sigue siendo una **prueba de concepto y no una corrección productiva aprobada**.
