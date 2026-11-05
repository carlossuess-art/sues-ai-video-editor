# SUES MASTER DIRECTOR · Hito de composición nativo → Remotion · 05/11/2026

**Prueba técnica verificada, NO integración de producción ni aceptación creativa.** Código aislado del PR #27. Producción `sues-video-editor` y biblioteca original intactas.

## Qué se implementó

- `src/master-director-hybrid-review.js`: revisión del grafo aprobado con operaciones nativas y de Remotion. Conserva identidades, tiempos, dependencias cruzadas y solapamientos visuales/sonoros. Compila únicamente el subconjunto de capas Remotion para REVISION, manteniendo el render global BLOQUEADO hasta que exista un compositor real. Nunca descarta silenciosamente operaciones.
- `src/master-director-project-store.js`: el endpoint ya autenticado `master-layers` expone `hybrid` cuando el plan es mixto. `master-render-preflight` continúa bloqueando los renders mixtos incompletos.
- `src/master-director-hybrid-handoff.js`: contrato de handoff seguro tras completar el render nativo. Acepta solo un hijo nativo editable, con SHA de origen/salida, duración y auditoría técnica vinculados al plan aprobado; prepara un origen Remotion derivado con el audio nativo. Bloquea máscaras sin evidencia nueva, dependencias Remotion→nativo e interacciones de mezcla sonora sin verificar. **Aún no existe una ruta productiva que cree y persista este handoff automáticamente**; el llamador debe ser código de servidor autenticado, no datos del navegador.
- `tests/master-director-hybrid-review.test.js`, `tests/master-director-hybrid-handoff.test.js` y caso E2E en `tests/master-director-project-store.test.js` comprueban conservación de operaciones, rechazo total en fallos y acceso autenticado.

## Prueba técnica ejecutada en VPS, sin Work ni APIs de pago

- Candidata aislada verificada contra **458 archivos de producción**: `/tmp/sues-director-candidate-EbhvZh`. Checkout comprobado: `fc2645df868658136442a4f588adc73df2b6ab70` (antes de incorporar este documento). `deployed:false`.
- Suite dirigida en la candidata: **146/146 PASS**, cero fallos/omisiones; `/tmp/sues-master-handoff-candidate-tests-20261105.log`.
- Motor nativo real: `tests/master-director-native-render.test.js` con fixture audiovisual y `SUES_QA_OUTPUT`, **1/1 PASS**. Generó la versión hija editable y MP4 de 12 segundos a 1080×1920, 30 fps, con audio, SHA `b24d29d710704b56ae2178fffcd1a510359b64397dea08bbdceb4c0ac09af4f0`. Log `/tmp/sues-master-hybrid-native-poc-20261105.log`.
- Remotion: usando **esa salida nativa como fuente**, con la fuente de marca verificada por SHA, añadió una capa de texto animada sobre los mismos 360 fotogramas, en contenedor Docker temporal `--network none --cpus=0.65 --memory=1900m`. El resultado, preview privada 270×480 H.264/AAC con audio original, superó auditoría técnica y decodificación completa. Se encontraron 6285 canales con diferencia visual significativa en el fotograma de texto frente al nativo. SHA preview `3e04250be184d2bf6125e5925ded0bfd72c20235728177b6a196323b9dd208b4`. Log `/tmp/sues-master-hybrid-remotion-poc-20261105.log`.
- Script reproducible: `tests/master-hybrid-two-stage-poc.mjs` (necesita fixture `/qa/native-stage.mp4`, `/qa/fonts/Montserrat-Bold.ttf` y configuración/manifest de runtime Remotion V2 operada exclusivamente por servidor; **no hace falta copiar ni enviar fuentes al usuario**). El script emplea una aprobación simulada para probar el compositor; NO lo usar como endpoint aprobado ni como evidencia de licencias de bibliotecas reales.

## No concluir más de lo probado

Estos resultados **sí acreditan** la factibilidad técnica de encadenar una salida del editor nativo con una capa animada Remotion, conservando el audio y produciendo MP4 decodificable. No demuestran que la versión Remotion sea editable desde la UI, que sus recursos y las 20 reglas estén habilitados para el Reel real, máscara corporal dinámica, QA musical/creativa, mezclas nativo+Remotion ni montaje cinematográfico terminado. Los MP4 de salida son aplanados para revisión; la información editable debe conservarse en el proyecto, nunca sustituirse por el MP4.

## Siguiente fase concreta

1. Integrar **en el servidor autenticado** la creación de la versión hija nativa y la evidencia de su SHA, con autorización y coste cero, sin aceptarlo del navegador.
2. Conectar el handoff de `master-director-hybrid-handoff.js`, persistir grafo de capas y relación padre/hijo de forma recuperable, revalidar aprobación de principio a fin y exponer preview mixta solamente cuando cada operación tenga representación exacta.
3. Contrastar preview con render final y habilitar edición individual de todos los elementos; cubrir máscaras dinámicas solo con prueba real y no simular efectos.
4. Resolver metadata de licencia V2 de tapices y recursos, plan real del 158404, dos auditorías audiovisuales completas y regresión final. **Pedir a Carlos aceptación creativa y permiso de deploy**, mantener skill sin alterar hasta entonces.

**Importante para otro Work:** no repetir los 146 tests ni los 12 segundos de render por rutina; usar logs, SHA y commits. Volver a probar al modificar código relevante o al preparar release.
