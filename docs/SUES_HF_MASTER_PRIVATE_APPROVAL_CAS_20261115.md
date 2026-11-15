# SUES · MASTER DIRECTOR → HyperFrames → FableCut · Hito privado de integración

**Fecha:** 15/11/2026 · **Repositorio reutilizado:** `carlossuess-art/sues-ai-video-editor` · **Rama:** `feat/speech-linked-motion-grammar-20261115` · **Estado:** `PRIVATE_SYNTHETIC_300_FRAMES_TECHNICALLY_VERIFIED`.

Esta prueba **NO** es un Reel real, no ha sido aprobada creativamente por Carlos y no está desplegada en la interfaz publicada. **No hay publicación ni modificaciones en V29, WAC, los originales del usuario o el servicio productivo FableCut.** Todo se desarrolló en la rama aislada y bajo `/opt/sues-video-setup/...` en VPS. Este documento complementa [la prueba anterior de 151 fotogramas](SUES_HYPERFRAMES_FABLECUT_NATIVE_CHAIN_20261115.md) y [el preflight de palabras](SUES_HYPERFRAMES_EDITOR_AUTOMATIC_PREFLIGHT_20261115.md).

## Arquitectura real verificada

**Decisión creativa → SUES MASTER DIRECTOR. Motion → HyperFrames. Montaje → FableCut. Supervisor → pruebas y revisión audiovisual humana.**

1. En `web/narrative-motion-panel.js` y `web/index.html`, tras seleccionar palabras existentes y obtener el preflight, se ofrece el botón explícito **«Incorporar motion al guion maestro · nueva revisión»**. No crea un selector nuevo ni aprueba nada. Pide el HEAD actual `master-current` y manda `fingerprint`, `selections` y `expectedStoryRevision` a un endpoint autenticado y con cabecera anti-CSRF.
2. `POST /api/jobs/:id/motion-hyperframes-stage` de `src/editor-server.js` vuelve a calcular las palabras/tiempos/huellas **en el servidor**, guarda evidencia inmutable 0600 y agrega una única operación canónica `renderer:'hyperframes'`, `effect:'hyperframes-word-motion-v1'`, `track:'graphics'` a la `sues-master-story/v1` existente. `MasterDirectorProjectStore.setCurrent()` crea **nueva revisión con CAS**. Nunca ejecuta/renderiza. Rechaza revisión obsoleta, ausencia de escena que contenga los 151 frames y selección incompatible.
3. `src/motion-templates/hyperframes-master-binding.js` contiene la representación 1:1 y los verificadores de **fuente/word IDs/JSON de variables, tiempos, origen editable, frame start/end y SHA**. `src/master-director-project-store.js` exige `hyperframesPreflight` proporcionado por un servidor de confianza para poder ofrecer la historia en revisión/aprobación. Una operación fabricada desde HTTP no obtiene capacidades. La aprobación sigue asociada a historia inmutable, fingerprint, reglas, revisión y decisión.
4. `src/motion-templates/hyperframes-approved-workflow.js` aporta `inspect/issue/execute`: requiere exactamente una operación HF en este V1 (no trunca historias mixtas), `MasterDirectorProjectStore.approved().mode='approve'` y HEAD idéntico. Reutiliza el registro existente `DirectorApprovalLedger.issueBatch/consumeBatch/recordBatchResult`. Una aprobación de **un solo uso**, emitida únicamente tras sesión humana verificada por el host, queda ligada al proyecto privado, revisión/Fingerprint, operación, fuente, timeline, variables, fingerprint del proyecto HyperFrames, proyecto FableCut y revisión CAS. La marca de la ejecución no habilita publicar. Se consume el token **antes** de un render; fallo/timeout obliga a reconciliar y nunca repetir a ciegas.
5. `src/motion-templates/private-fablecut-hf-import.js` implementa el commit privado: verifica archivo MP4 **nativo** y bytes SHA, fuente original V1 SHA, 1080×1920/30fps/151 frames, sin audio, origen del render, inexistencia de media/clip duplicados; realiza **un único** `fablecut_patch_project` MCP con `baseRevision` y operaciones atómicas `addMedia` + `addClip` en **V2**, recibe y comprueba revisión y proyecto por readback. Conserva backup de `project.json` y referencia al código fuente editable **en HyperFrames**. Un MP4 no convierte sus animaciones internas en keyframes FableCut.
6. `scripts/motion-templates/qa-hf-master-private-roundtrip.mjs` ejecuta el flujo con **única aprobación SIMULADA DE TEST** sobre un proyecto y un vídeo fabricados para QA. La ruta de producción solo podrá usar autorización real y un host privado confiable, no la decisión sintética. `scripts/motion-templates/qa-hf-master-fablecut-export.mjs` exporta el MP4 completo privado mediante la instancia FableCut MCP aislada; `scripts/motion-templates/verify-hf-master-full-export.mjs` revalida **todos** sus 300 fotogramas.
7. Pruebas nuevas: `tests/editor-hyperframes-master-stage-http.test.js` (HTTP firmado, CAS, Master review y aprobación simulada, no autoriza edición por sí sola); `tests/hyperframes-approved-workflow.test.js` (token único, fallos, doble grant y fingerprint); `tests/hyperframes-master-full-export.test.js` (frames íntegros y fidelidad).

## Resultados medidos sobre vídeos y MCP reales (material 100 % ficticio)

| Evidencia | Resultado |
|---|---|
| Vídeo original sintético | 10,000 s · 300 frames · H264 1080×1920 30fps, **sin audio** · SHA `bd104e585a43594ba22e548d8f66f97ddabdcad13768677b0b029306ab90e3c2` |
| Palabras ficticias | [F8, F16, F24, F30] y [F86, F99, F108, F120], sin voz grabada |
| Render HyperFrames con `--variables-file --strict-variables` | 5,033 s · 151 frames · H264 1080×1920 30fps · SHA `095bc084c26959381bd0f79f4ea5b1fdfc6633a4f145cf2fb2e36d2388bcdb4f` |
| Master Story sintética | Revisión `32d5ff81235a85333a8111ba92228138208d6074335264d60207b5e130bda433`, decisión de prueba, token de un solo uso consumido |
| Importación FableCut real privada | Proyecto `hf-master-stage-20261115`; revisión **1→2**, original íntegro V1, motion V2 durante 151 frames; una transacción CAS |
| Exportación FableCut real | 10,000 s · 300 frames · H264 1080×1920/30fps, sin audio, 629.875 bytes · SHA `87903e0fff576a68ffcaa23738b121def90e3d1afa235fd9fb5a91443930f0d2` |
| Fidelidad motion V2 [0–151) | **151/151 frames** comparados contra MP4 HF: PSNR mínima **45,19 dB**, media **46,98 dB** |
| Fidelidad V1 [151–300) | **149/149 frames** comparados contra original: PSNR mínima **49,70 dB**, media **49,75 dB** |
| Proyecto tras exportación | FableCut normalizó/guardó el documento a revisión **3**; ambos clips, IDs, pistas y fuentes permanecen intactos en el readback |
| Pruebas dirigidas | **99/99 Node PASS** del conjunto histórico ampliado; además **3/3** tests del verificador de 300 frames (evaluados junto con pruebas nuevas 8/8). Prueba Chromium real anterior 1/1 PASS |
| Recibo técnico privado final | `/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/hf-master-stage-20261115/qa-hf-master-300frames-verified.json` · SHA `d27f94ad33ade828e243d13933ddc523aaf7ad4d473166ac1f1720946e5aa00b` |

**Nota sobre PSNR:** compara similitud de vídeos decodificados, no aprueba criterio cinematográfico, voz, ritmo, subtítulos o mezcla. El vídeo ficticio original es una composición color/rectángulo sin un rostro ni grabación de Carlos. Las pruebas 10 s no equivalen a la edición real de un Reel.

**Directorio reproducible:** `/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/hf-master-stage-20261115`. Salidas en `exports/`, manifiestos `qa-hf-master-roundtrip-result.json`, `qa-hf-master-fablecut-export-proof.json`, `qa-hf-master-300frames-verified.json`, logs `psnr-hf-first151.log` y `psnr-source-last149.log`. Fuente HF versionada en GitHub; QA local en `/opt/sues-video-setup/hyperframes-engine-next/sues-motion-narrative-20261115/qa-master-approved-20261115`.

## Bloqueos exactos para una edición de usuario

- **NO desplegado:** la integración de aprobación y el flujo privado están en código de rama y comprobados con un harness sintético. Todavía hay que configurar/adaptar un **host de ejecución real** que verifique la sesión humana, permisos, fuente y proyecto privado de un Reel real. La variable `verifiedHumanSession` se puso a `true` solo en el script QA sintético y no supone que Carlos haya aprobado un vídeo.
- **No ejecución parcial de historias mixtas:** el workflow actual requiere una única operación HF, precisamente para no ejecutar una parte de la historia sin sus otras capas. Un Reel real puede tener B-roll, máscaras, subtítulos, música/SFX y varias operaciones. Hay que implementar orquestación multioperación sin pérdida, checkpoints y rollback, no marcar el vídeo completo por montar un solo motion.
- **No asumir cobertura de cortes:** el preflight acepta únicamente un mapa fuente→edición idéntico y una composición demostrada 4+4 palabras. Los Reels con cortes o locuciones/gramáticas distintas siguen bloqueados hasta verificación de `sourceTimeMap` y ampliación narrativa.
- **Aprobación creativa expresa antes de ejecutar en un Reel real**, y revisión del guion A/V completo por capas (incluidos timings, rostro, máscaras, B-roll, captions, SFX, derechos). **Dos pasadas audiovisuales realmente observadas** y aprobación del resultado específicas antes de entrega final. Publicación mediante permiso separado.
- **Sin instalar nada de pago ni tocar producción.** El servidor activo de FableCut y SUES Server Console no se reiniciaron ni reconfiguraron, no se publicó y no se modificó ningún original de Carlos.

## Siguiente decisión técnica

Prioridad: conectar el workflow a un **host de editor autenticado** con una acción de aprobar plan/ejecutar en **clon privado del Reel real**, manteniendo el mismo `MasterDirectorProjectStore`, `DirectorApprovalLedger` y CAS. Seleccionar después un bruto auténtico *nuevo*, fuente y transcripción con IDs, verificar cortes/voz y guion A/V; no reutilizar ni alterar V29 publicada. Expandir el binding a templates adaptativos y multioperación sin sustituir silenciosamente la intención creativa. 

**Regla de continuidad:** Leer primero este checkpoint y `PROJECT_STATUS.md` al continuar; no retroceder a “HyperFrames no renderiza”, “FableCut no importa” o “no hay puente de aprobaciones”. Distinguir siempre prueba sintética privada de despliegue productivo y aprobación de usuario.
