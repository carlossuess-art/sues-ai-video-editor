# SUES MASTER DIRECTOR · CHECKPOINT ACTIVO ÚNICO

**Corte confirmado:** 2026-11-05 08:00 CET aprox. (07:00 UTC). **Estado:** EN DESARROLLO, sin despliegue. **Progreso global estimado: 50 % ±10 puntos** de la misión completa (estimación humana; NO deriva del número de tests, commits o funcionalidades contadas).

## Prioridad de lectura y autoridad

1. Requisitos maestros: `docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md` (20 reglas aprobadas, prevalece sobre borradores).
2. **Checkpoint vivo**: ESTE documento. Actualizar al cerrar cada fase o al surgir un bloqueo concreto; dar fecha, commit exacto, entorno, evidencia, bloqueos y próxima acción. Las notas antiguas de `PROJECT_STATUS.md` y `docs/SUES_MASTER_DIRECTOR_WORK_*.md` son registros históricos, no el último estado.
3. Código: rama `feat/master-director-story-orchestration-20261104`, PR borrador #27: https://github.com/carlossuess-art/sues-ai-video-editor/pull/27 . HEAD al inicio del checkpoint: `ee71981e57114801e442ad1c1c53d4582ae93301`.
4. Producción: VPS `srv1841004`, contenedor `sues-video-editor`; montaje `/app` desde `/opt/sues-video-setup/release-mobile-layers-20261030`. **No modificar ni desplegar** sin aprobación de Carlos. Se verificó que este montaje no contiene `src/master-director-project-store.js`.
5. Roadmap en Google Drive: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit ; mantener una sección superior de seguimiento con link a este checkpoint y apuntar hitos verificados. No sustituye al repositorio como evidencia de código.

## Regla de coordinación entre los dos Work y el chat normal

**Un único escritor/ejecutor por vez.** El segundo Work debe actuar solo como auditor/lector hasta que el primero ceda la ejecución. Nunca editar simultáneamente la misma rama o el editor productivo. En cada reanudación: (a) abrir este checkpoint, (b) comprobar únicamente si HEAD y los últimos logs referenciados siguen vigentes, (c) realizar la PRÓXIMA ACCIÓN, (d) actualizar este checkpoint y Drive. No repetir auditoría completa ni suites pesadas sin un cambio relevante o una razón explícita. Comprobar vigencia **no significa omitir pruebas de seguridad**.

No reutilizar blindly `src/editor-server.js` de la rama sobre producción; la base instalada es distinta. La herramienta `scripts/master-director/build-isolated-candidate.mjs` crea una candidata reproducible, verifica hashes de la base y aplica parche aislado. Validar la candidata antes de fusionar o desplegar.

## Evidencia confirmada al corte

- Módulos de planificación narrativa, reglas, revisión/aprobación, contexto y políticas del servidor, puente nativo, grafo de capas, Remotion experimental, auditor técnico, previsualización privada y UI parcial: **implementados en rama y entorno de pruebas**; la mayoría no están disponibles en producción.
- Backend autenticado con revisiones inmutables, invalidación por cambios y decisión `approve/autonomous`. Ruta nativa capaz de crear versión hija para **planes estrictamente compatibles**. ELEMENTS nativo probado con formatos LIST, RANKING, COMPARE, Q&A, REVEAL y FLOW; la existencia de esos formatos no acredita belleza de motion cinematográfico.
- Remotion: prueba sintética 24 s, 720 fotogramas, vídeo/audio, auditoría técnica de salida, reproducción por HTTP Range e idempotencia **PASS en host/candidata aislada**; el MP4 de previsualización es aplanado, la fuente estructurada de capas es aparte.
- Suite amplia de regresión: **558/558 PASS** en copia aislada, `/tmp/sues-master-native-elements-regression-20261105.log` (~06:32 UTC).
- Suite dirigida de runtime: **128 PASS / 129, 1 SKIP, 0 FAIL**, `/tmp/sues-master-runtime-v2-suite.log` (~06:44 UTC). No declarar 129/129.
- Render de native ELEMENTS sobre vídeo sintético de 12 s y tests específicos FFmpeg superados según PR #27; resultado técnico, no revisión artística.
- **Bloqueo conocido:** E2E 24 s Remotion dentro de contenedor quedó `BLOCKED` por `PREVIEW_MEMORY_LIMIT`, log `/tmp/sues-master-runtime-container-v2-e2e.log` (~06:47 UTC). Es un bloqueo de guardia de memoria sin superación de prueba, no evidencia suficiente de bug de imágenes ni de éxito. `src/master-director-preview-renderer.js` exige >=512 MiB de margen libre según host y cgroup; inspeccionar configuración/cgroup con entorno exactamente equivalente antes de modificar umbral. Host sí pasó la prueba equivalente.
- Del 158404: copia normalizada ~65,1 s, 1953 frames; un segundo renderizado y auditado en anteriores ensayos. Prueba anterior de 65,1 s abortó por `UND_ERR_HEADERS_TIMEOUT`; no hay Reel completo final verificado. No confundir el CTA ya creado con la edición completa.
- Biblioteca: tres tapices maestros disponibles con derechos antiguos declarados propios, pero faltan **metadatos/evidencias de licencia V2** para política confiable completa. Las pruebas positivas de proveedor usan fixtures, no autorizaciones productivas reales.
- QA técnico verifica estructura, media y decodificación; **NO acredita** calidad artística, máscara dinámica/cuerpo real, mezcla sonora crítica, sincronía semántica, doble auditoría audiovisual ni aceptación de Carlos.
- Sin API de pago, publicación, cambio de skill ni despliegue. La skill SUES AI Film Director NO se adapta hasta que el contrato del cerebro esté estabilizado.

## Roadmap secuencial con intervención de Carlos

| Fase | Entregable y evidencia de cierre | ¿Carlos? | Estado |
|---|---|---|---|
| 1. Unificación/continuidad | Checkpoint único GitHub+Drive, commits y logs referenciados, 1 escritor | No | COMPLETADO: GitHub+Drive+PR+PROJECT_STATUS |
| 2. Candidata reproducible | Reconstruir desde montaje productivo con hashes; ejecutar suite dirigida y comparativa; conservar backout | No | COMPLETADO: candidata 458 hashes; 132 pruebas+MP4 nativo |
| 3. Bloqueos y recursos | Investigar `PREVIEW_MEMORY_LIMIT`, diferenciar capacidad real del contenedor; revisar metadata/procedencia de masters sin inventarla | Solo si falta documento de titularidad o hacen falta recursos/gastos nuevos | PENDIENTE |
| 4. Integración efectiva | Cerebro→nativo+Remotion mixto, edición de capas y keyframes, audio, máscaras reales, versiones recuperables; rechazo exacto de efectos no soportados | No para desarrollo | PARCIAL |
| 5. QA de Reel real 158404 | Plan genuino, recursos reales autorizados, preview y MP4 final, voz/música/SFX/oclusiones, 2 auditorías audiovisuales independientes completas, regresión | Sí para aceptación estética | PENDIENTE |
| 6. Release seguro | Snapshot/backup y rollback probado, producción contra candidata, autorización explícita de despliegue | Sí | PENDIENTE |
| 7. Skill | Informe técnico final para adaptar SUES AI Film Director en chat normal | Sí, luego | PENDIENTE |

## Checkpoint de permisos y finanzas

**Se puede avanzar SIN Carlos:** inspeccionar GitHub/VPS/Drive existentes; parchear en rama; crear candidata aislada; ensayar fixtures/medios existentes autorizados sin gastar; comparar, ejecutar tests enfocados y corregir errores; actualizar este documento y Drive con evidencia.

**Parar para Carlos SOLO en:** nuevo gasto/servicio de pago, cambiar recursos de marca o aprobar una alternativa visual importante, titularidad de recursos cuando falte evidencia, despliegue sobre producción/cambios peligrosos, publicación y valoración creativa final. No aceptar aprobación inventada de recursos o límites.

## Próxima acción exacta al retomar

1. Validar el builder reproducible en staging sin escribir a producción y registrar SHA de candidata.
2. Diagnosticar por qué el mismo E2E 24 s pasa en host y produce `PREVIEW_MEMORY_LIMIT` en contenedor: RAM host y cgroup, límites y lectura/procedencia de comprobaciones. Ajustar SOLO si hay evidencia y sin relajar el control preventivo. Repetir un test dirigido, no toda la batería.
3. Verificar capacidad de edición de versiones y composición con una operación real mínima; después integrar operaciones mixtas y máscaras dinámicas por capas.
4. Completar política con procedencia real documentada; no simular licencias.
5. Finalmente Reel 158404 y dos ciclos QA. En cada hito actualizar este documento + nota superior Drive.

## HITO NUEVO VERIFICADO · 05/11/2026, ~08:20 CET (07:20 UTC)

**Candidata aislada reproducible:** `node scripts/master-director/build-isolated-candidate.mjs /opt/sues-video-setup/release-mobile-layers-20261030` sobre el checkout privado de trabajo `/tmp/sues-master-unified-20261105` al commit `6d9fb7911644bc1c1ebcff79e96071556e7ac401`. Resultado `ISOLATED_CANDIDATE_BUILT`, **458 hashes de archivos de producción verificados**, candidata `/tmp/sues-director-candidate-OcRkNV`, `deployed:false`. El constructor es reproducible sobre la base de hashes; la candidata lleva vínculos de node_modules para QA y **NO instala el runtime Remotion** por sí sola.

**Pruebas nuevas y diferenciadas:**
- **132/132 PASS, 0 omisiones y 0 fallos** en la candidata completa: 23 ficheros de test `master-director-*.test.js` exceptuando el test audiovisual de FFmpeg, `/tmp/sues-master-candidate-directed-20261105.log` (~07:17 UTC).
- **1/1 PASS** del test nativo audiovisual REAL con FFmpeg en Docker aislado y sin red, `tests/master-director-native-render.test.js`: versión hija editable y MP4 privado sintético de 12 s, audio presente, decodificación y reintento idempotente. Log `/tmp/sues-master-candidate-native-video-20261105.log` (~07:19 UTC). No es la QA creativa del Reel.
- **7/7 PASS** de diagnóstico de memoria y cancelación limpia en staging, `/tmp/sues-master-memory-diagnostic-tests-v2-20261105.log` (~07:13 UTC). Se añadió `src/master-director-memory-budget.js`, `scripts/master-director/inspect-preview-memory.mjs` y se mejoró `src/master-director-preview-renderer.js` para comunicar la causa exacta de falta de margen, **manteniendo el mínimo de 512 MiB**. Último commit de este bloque `6d9fb7911644bc1c1ebcff79e96071556e7ac401`.
- **Inspección aislada de memoria del contenedor al arranque:** `--memory=1536m`, `hostAvailableBytes≈2.49 GB`, `cgroupAvailableBytes≈1.60 GB`, `reason=READY`. Por tanto, el bloqueo anterior **no se reprodujo al iniciar**; puede depender del consumo durante render. **No declarar resuelto `PREVIEW_MEMORY_LIMIT` ni volver a lanzar un E2E completo sin medir su pico y garantizar RAM para producción.**
- La rama GitHub y las pruebas NO se han desplegado. `/opt/sues-video-setup/release-mobile-layers-20261030` permanece intacto.

**Próxima acción única:** perfilar memoria incremental del render Remotion 24 s dentro de un cgroup aislado con límite conservador, comprobar motivo del guard cuando aparece (sin reducirlo). Si la capacidad del host no garantiza margen, no competir con producción: optimizar o probar en entorno mayor autorizado. Después cerrar política real/recursos y flujo mixto/Remotion, terminando con 158404 y 2 QA audiovisuales.

## Registro de actualizaciones

- **2026-11-05 ~08:20 CET · Chat normal / ejecución aislada**: se publicaron diagnóstico seguro de memoria y 7 pruebas PASS, se construyó una candidata reproducible (458 archivos productivos verificados) y se probó completa (132/132 Node + 1/1 MP4 nativo FFmpeg). **El bloqueo Remotion en contenedor y la integración cinematográfica final permanecen pendientes.** Ningún despliegue.

- **2026-11-05 ~08:00 CET · Chat normal / auditoría de solo lectura**: corte inicial, 50 % estimado, 558/558 regresión, 128/129 dirigida con 1 omitida, bloqueo memoria contenedor. Este documento inaugura el estado único; no se ha modificado producción. Las mejoras posteriores deben documentarse aquí con su commit y resultados nuevos.
