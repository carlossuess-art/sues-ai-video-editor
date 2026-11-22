# SUES V1 · Worker privado Chromium reutilizable · Auditoría real 22/11/2026

**Estado: código de desarrollo y pruebas parciales superadas, pero NO DESPLEGADO.** Se ha iniciado QA R14 de 1667f y está EN CURSO en el VPS; no se declara resultado hasta confirmar `done` y validaciones A/V. Producción FableCut, SUES iStudio, WAC, DNS, V29 y originales intactos.

## Código real

- `src/engine-next/sues-resident-chromium.cjs`: ejecuta el compositor FableCut existente mediante Chromium dedicado en la misma máquina, controlado por CDP **local** (127.0.0.1), sin enviar tareas al canal SSE público de pestañas. El servidor mantiene el navegador para trabajos sucesivos; recupera un navegador desconectado. Un token aleatorio de 256 bits se inyecta directamente en el contexto privado mediante CDP. `release()` limpia los decodificadores cuando termina el trabajo principal.
- `patches/fablecut-private-resident-worker-20261122.patch`: cambios aislados de `server.js`, `export-jobs.js`, `sues-segmented-export.js` y `app.js` (aplicables **a la candidata exportación QA anterior**, no aplicar sobre producción sin reconciliar versiones). `SUES_RESIDENT_WORKER=1` habilita `where:'worker'` solo con `trustedWorker:true` invocado internamente desde el orquestador. El frontend no puede elegirlo: HTTP 400.
- `GET /api/export/job/ticket`, `POST .../claim` y `POST .../report` de trabajos del worker requieren `X-Sues-Worker-Token`; audio-only upload también requiere ese token. Las pestañas normales no reciben el ticket ni datos del snapshot.
- `sourceSession` = ID del **trabajo principal**, único para todas sus ventanas: WebCodecs conserva `ExportFrameSource` (demux/decoder) entre cortes adyacentes del mismo origen, pero los cierra en una nueva sesión/revisión. Evita redescodificar GOP de hasta ~250 cuadros en cada nuevo segmento.
- Liberación de decoder pool tras 45s de inactividad sin exportación y `release()` inmediato al concluir el trabajo principal; ante cancelación los recursos se cierran. El navegador permanece disponible.
- El endpoint auxiliar `/api/export/qa-private-window` solo existe en la copia **NO versionada para producción** del VPS, condicionado por `SUES_QA_RESIDENT_WINDOW=1` y clave local; ha sido **excluido expresamente** del patch de GitHub.

**Límites de seguridad/operación antes de producción:** decidir puerto CDP loopback no expuesto, sandbox real de Chrome (en QA se usó `FABLECUT_QA_NO_SANDBOX=1`), límites de memoria/CPU, recuperación de fallo y revisión CAS; evitar publicar flags sin aprobación. No confundir que el código compile con que el despliegue sea seguro.

## Pruebas directas

1. Fixture 45f 1080×1920 H264/AAC, 3×15f, audio continuo. Antes: Chrome nuevo por fragmento **35,096s**, navegador residente con tab compartida **12,176s**, SHA idéntico. **Nuevo worker privado:** 15,655s incluyendo arranque, segundo trabajo caliente **11,603s**, SHA exacto `ea455a47482f228095b348811ae4a9ff1daca4a916b06b6af3cc0a2a173903e1`; 45/45f, duración1,5s, audio AAC. Con decoder pool + nuevo arranque **14,147s**, mismo SHA.
2. R14 auténtico frame960–974 con matte de sujeto: headless directo produjo archivo H264 de 15f en ~57s. Worker privado frío completó en **32,599s**, SHA exacto `95ace4d3820090a5637c22d361141bb01a326bdcbdd4669a7e426f86c1275f4a` igual al headless. Con **mismo sourceSession** y decoders conservados, frame975–989 **12,154s**, frame990–1004 **20,211s**, ambos 15/15f.
3. Tres rutas de trabajos privados `/ticket`, `/claim` y `/report`: **403** sin token. Petición pública con `where:'worker'` rechazada **400**. Test Node `tests/engine-next/resident-worker-isolation.test.cjs`: **1/1 PASS**; no broadcast SSE, claim/cancel, fallo de worker, sourceSession y bloqueo de acceso no autorizado.
4. Diagnóstico del fallo intermitente `Failed to fetch`: en ventana real R14 frame975 con navegador adicional, simultáneamente fallaron `/library/fonts/*.woff2`, `/api/export/job/report`, `/api/media-info`, `/api/proxy/status` y `/api/export/begin`. No son ficheros multimedia desaparecidos; se observó ~1,1 GB swap y Chrome renderer ~1,18 GB, **pero NO se demostró** fallo OOM o causa causal. Evitar Chrome concurrentes.
5. Comparación con MP4 histórico R14 completo da SSIM0,946–0,965 para estas ventanas, pero aquel renderer/referencia no es bit-exacto a la candidata actual. **No utilizar ese SSIM para aprobar paridad**. Únicamente frame960–974 se comparó contra su referencia directa misma versión y dio SHA idéntico. Falta prueba directa frame975 y990 (intento paralelo falló por fetch).

## QA completa R14 en ejecución

Servicio privado bajo `sues-r14-full-resident-server-20261122.service` y seguimiento `sues-r14-full-resident-e2e-20261122.service` en Hostinger; 1vCPU/4GB, CPUQuota75%, MemoryMax2950M, LimitFSIZE512M, puerto 18137 **solo loopback**. Source project copiado, medios solo lectura a través de enlaces simbólicos al sandbox, exports separados en `/opt/sues-secure-headless-qa-20261122/r14-fetch-debug-data/exports`. Informe vivo `native-fastpath-qa/r14-full-resident-progress-qa.json`. Es un test ejecutándose, no un resultado logrado.

**Condiciones para declarar cerrado:** job `done`; MP4 H264/AAC 1080×1920/30fps, 1667 cuadros,55,5667s, audio íntegro y sin cortes; sampleado de escenas/contornos de máscara/subtítulos, comprobación A/V visual y auditiva de dos pasadas, descarga Android desde la aplicación, cancelación/reanudación/revisión concurrente, autorización de despliegue. Sin ellas, V1 NO está terminada.
