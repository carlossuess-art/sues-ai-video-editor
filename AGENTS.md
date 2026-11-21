## 21/11/2026 · Revisión móvil nº 11

Selección de capas aprobada por propietario. Desplazamiento de clips SOLO tras hold650ms horizontal/vertical, feedback visible turquesa/elevación y vibración opcional; taps sin espera, swipe temprano no muta clip. Regla SIEMPRE libre. Preview 8443 desplegada, sesión 21/21, 12/12 taps + 4/4 nombres y arrastres, 10/10 regresiones. Evidencia y rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. No cerrar V1/V1.1 ni tocar producción.

## 21/11/2026 · Revisión móvil nº 10

Corrección expresa del propietario: regla temporal SIEMPRE desplazable, sin hold ni bloqueo. Sustituye la norma anterior de rondas 7–9. Se conserva la selección de clip al navegar y la pulsación prolongada únicamente para cambios de pista. Preview 8443 desplegada; sesión continua 15/15, regresión 10/10 y cero conflictos de guardado. Evidencia/rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. No cerrar V1/V1.1 ni tocar producción.

## 21/11/2026 · Revisión móvil nº 9

Auditoría autónoma UI en Chromium móvil 411x923 DPR2.625. Regla antes en blanco confirmada visualmente, render nativo visible 36px, hold500ms selección persistente, gestos clasificados, swipe no seleccionado navega, seleccionado mueve, selección/move sin rebuild masivo, serialización guardado y sync de revisiones antiguas. Sesión continua 14/14, 0 conflictos, 12/12 selección +4/4 nombres y 10/10 regresiones. Preview 8443 desplegada, detalle/evidencia/rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. Pendiente QA Android físico/proyectos largos; no delegar decisiones de diseño de gestos al usuario, no cerrar V1/V1.1, no tocar producción.

## 21/11/2026 · Revisión móvil nº 8

Preview privada 8443 actualizada por queja de precisión. Captura estable timeline, selección por nombre/clip, resaltado sincronizado, gestos horizontal/vertical separados y regla hold500ms con tolerancia 14px y origen recalculado. CDP 12/12 clips y 4/4 nombres, arrastres, ruler/pinch y 10/10 regresiones PASS. Evidencia y rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. Falta validación humana móvil; no cerrar V1/V1.1 ni tocar producción.

## 21/11/2026 · Revisión móvil nº 7

Preview privada 8443: regla como barra protegida mediante hold 500ms, borde blanco activo, release desactiva; clips sin espera adicional y pinch conservado. CDP qa-ruler-hold-real.json PASS, 10/10 regresiones. Detalle y rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. Pendiente usuario móvil; no cerrar V1/V1.1 ni tocar producción.

## 21/11/2026 · Revisión móvil nº 6

Preview 8443 desplegada: regla temporal operativa, cabezal fijo centrado, scroll táctil y zoom sin mutación de clips. CDP qa-centered-timeline-real.json PASS, 4 pruebas navegador adicionales y 10/10 regresiones. Usuario aprueba mejora de navegación ronda 5, no aceptación formal completa. Ver detalle y rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. Próximo: validación humana de regla. No tocar producción.

## 21/11/2026 · Revisión móvil nº 5

Preview 8443 actualizada según investigación CapCut aportada. Catálogo 46 rutas, galería nativa Entrada 12/Salida 11/Bucle 5 y Filtros 15; Formato 5; controles audio contextuales. QA CDP qa-capcut-tree-real.json PASS, otras 5 pruebas navegador y 10/10 regresiones. Mantener volumen 0–200%, pistas 70%, monitor aprobado e interfaz privada. No certificar equivalencia 100%, miniaturas animadas ni paridad MCP completa. Detalle, arquitectura y rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. Una pregunta humana por turno. No tocar producción.

## 21/11/2026 · Revisión móvil nº 4

Preview 8443 desplegada: alturas de pistas móvil 70% (V41/A29), navegación por categorías CapCut, menús de clip principal/overlay separados y controles correspondientes. CDP qa-capcut-nav-real.json PASS, regresiones 10/10. Carlos acepta iconos pero todavía no navegación. Referencias, hashes, rollback y pendientes en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. No prometer copia 100% sin inventario completo; no cerrar V1/Q03-Q05 ni aceptación V1.1. Mantener monitor y producción intactos.

## 21/11/2026 · Revisión móvil nº 3

Preview privada 8443 actualizada: menú contextual simplificado aprobado como diseño por Carlos, lupa superior, paneles específicos, volver/confirmar, Más avanzado. CDP qa-context-real.json y búsqueda PASS, 10/10 regresiones dirigidas, geometría monitor preservada. Validación humana portátil pendiente. Leer detalle y rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. No cierre V1 ni aceptación formal V1.1; mantener producción intacta. Próximo: aceptación visual menú, cabezal centrado y demás pendientes ya definidos.

## 21/11/2026 · Revisión móvil del propietario nº 2

Monitor aprobado; CapCut referencia global. Preview 8443 actualizada con selección directa, marco nativo, edición texto multilinea, capas numeradas, volumen numérico 0–200% y ondas. QA CDP y 10/10 regresiones, 2/2 gesto adicional. Ver detalle y pendientes en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. Una pregunta por turno. No confundir prototipo con aceptación, ni modificar producción. Próximo: dock contextual, caja real texto, cabezal centrado y QA pendiente.

## 21/11/2026 · Prototipo privado abierto para prueba humana

Preview HTTPS https://studio.suesholistics.com:8443/ usa sesión habitual de Studio, datos demo aislados y servicio sues-fablecut-v11-preview.service. No modificar el snapshot servido mientras Carlos lo comprueba; trabajar en stage 17899. El canal MCP de UI es local y el proxy rechaza orden pública; no anunciar paridad total. Caddy: preservar 443 Studio, editor, WAC y DNS. Leer última entrada de docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md para reversión. Aceptación humana pendiente.

## 21/11/2026 · Continuidad operativa tras consolidación

Leer la última sección de docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md antes de actuar; prevalece sobre entradas anteriores. Stage móvil existente ya contiene cambios adicionales y evidencia de navegador real, no recrearlo. Búsqueda contextual corregida y 10/10 tests dirigidos PASS; no confundir con aceptación visual/táctil o exportación. Mantener baseline histórico fijado y consolidado verificado hasta restauración completa; no purgar originales, ni WAC, ni producción. Rotación admite consolidado y no elimina automáticamente. V1.1 0/10 aceptadas y V1 todavía en cierre Q03/Q04/Q05.

## 21/11/2026 · Continuidad de prototipo V1.1 aislado (no desplegado)

Antes de modificar el modo móvil, leer docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md y ops/fablecut/mobile-v1_1/README.md, además del Roadmap y docs/SUES_V1_1_FABLECUT_MOBILE_SPEC_20261121.md. CSS/JS existentes están en entorno QA aislado; no importar automáticamente en producción hasta tener prueba visual/táctil y regresión de exportación. Se completaron 2 tests mock y 56 regresiones, pero las ejecuciones Chromium dieron error; no afirmar QA visual aprobada. V1 sigue Q03/Q04/Q05 pendientes de cierre y V1.1 0/10 módulos aceptados. Revisión Drive V1-2026-11-21-r16.

## 21/11/2026 · Requisitos V1.1 del editor móvil (PLANIFICACIÓN, no despliegue)

Consultar docs/SUES_V1_1_FABLECUT_MOBILE_SPEC_20261121.md y Roadmap Maestro Drive, revisión V1-2026-11-21-r15, para diez módulos V1.1-01…V1.1-10. Gestos táctiles: centro de clip mueve sin cambiar duración; solo extremos recortan; pulsación larga cambia pista/profundidad; pellizco en monitor escala la capa y en timeline solo escala temporal; dividir permite zoom puntual sin keyframes; buscador abre la herramienta ORIGINAL dentro de sus menús con capa actual y persistencia al cambiar de capa. Subtítulos estáticos/animados y estilos/animaciones independientes. Exportación y previsualización coherentes.

Estado vigente: V1 aún en validación Q03/Q04/Q05; Q06 después; V1.1 sólo documentada, 0/10 implementada. No alterar producción ni edición existente hasta pruebas; FableCut Studio tiene modificaciones locales no versionadas y requiere clon aislado con preservación previa. Priorizar SUES Server Console; proteger WAC/V29 y otros servicios.

## 21/11/2026 · Vista rápida 540p separada de entrega final

El usuario ha definido **vista previa 540×960/15fps** (o menor según proporción) separada de **exportación final 1080×1920 u otro preset elegido**. Ya publicado botón `▶ Vista rápida` en FableCut Studio; fuente versionada `ops/fablecut/preview-render.js` + patch/test, checkpoint `docs/SUES_V1_PREVIEW_540_20261121.md`; respaldo de código anterior `/opt/sues-video-setup/v1-preview-540-20261121/before`. No bajar calidad del final, no eliminar efectos creativos para acelerar la vista previa, ni asumir que la composición interna ya va a 540p. La prueba aislada 2s/30frames PASS; la copia 73s 540p derivó de máster previo y NO acredita render completo desde cero. Prioridad siguiente: render incremental de intervalos cambiados + caché de tramos, con QA de reproducción móvil; preservar proyectos originales/V29 y WAC.

## 21/11/2026 · Consola de limpieza y corrección de render publicadas

Antes de tocar el render de Studio, leer `docs/SUES_V1_RENDER_STABILITY_VPS_CLEANUP_20261121.md`; código FableCut vivo `/srv/sues-fablecut-next/app`, con heartbeat, watchdog y workers ajustados. Rollback en `/opt/sues-video-setup/v1-render-fix-20261121/before`. Sólo canario corto 45 frames validado; no afirmar export de larga duración corregido sin prueba. Disk 8,0GB libres/84% tras dedupe con hardlinks y limpieza segura, no eliminar rollbacks WAC/V29.

SUES Console existente `/opt/sues-vps-mcp` ya incluye `cleanup_scan/prepare/execute` autenticados; código versionado `ops/sues-console/` y checkpoint `docs/SUES_SERVER_CONSOLE_CLEANUP_20261121.md`. Se exige selección por ID, token único de diez minutos y frase, relectura de inode/mtime/size, informe y auditoría. `revisar` y `conservar` nunca se borran desde ese motor. El botón web original de Sites no está implementado; NO duplicar la web ni exponer borrado root sin auth. Reutilizar MCP/CLI y solicitar conexión de Sites solo en caso de bloqueo real.

## 21/11/2026 · Estado operativo de despliegue V1

- El servicio público `sues-video-editor` YA ejecuta la candidata fuente PR #27 snapshot `b2179b3` montada desde `/opt/sues-video-setup/v1-deploy-candidate-20261121` (solo lectura), con `/opt/sues-video-setup/editor` como estado existente.
- Versión anterior detenida pero preservada: contenedor `sues-video-editor-pre-v1-20261121` con source `/opt/sues-video-setup/release-mobile-layers-20261030`. No eliminar ni sobrescribir. Despliegue y copia del proyecto: `/opt/sues-video-setup/v1-rollout-20261121`; en incidente aplicar procedimiento de reversión contrastando mounts y sesiones, no ejecutar a ciegas otra instalación.
- Pruebas posteriores: web y puerto 3010 HTTP200, API autenticadas /health /jobs /projects HTTP200 con 29 jobs existentes, sin sesión401. NO probado vídeo completo nuevo, render final o aceptación audiovisual en este despliegue.
- El host `SUES_NATIVE_HOST_CONFIG` nativo sigue privado y no está habilitado en producción; admitir explícitamente esa limitación. Reutilizar SUES Server Console y recursos existentes para correcciones asistidas, sin modificar V29/otros servicios. Actualizar Drive Roadmap y Estado General por cada avance. Q03/Q04 abiertos, Q05 candidato desplegado en validación, Q06 después.
- La cifra 65 % antigua del roadmap es histórica y no debe citarse como porcentaje estructural de las cinco fases; no inventar número nuevo.

## 21/11/2026 · E2E auténtico autorizado en clon, no producción

La prueba de la ruta autenticada Master Director → ledger → FableCut MCP ahora es PASS en fixture sintético y clon aislado (revisión 31→32, 15 clips, replay rechazado). Leer `docs/SUES_V1_NATIVE_HOST_PRIVATE_QA_20261121.md`. No confundir con onboarding de proyectos reales, ni con doble auditoría audiovisual o despliegue. El registro QA quedó vacío y su servicio detenido. No repetir el Reel publicado 158404 ni tocar otros servicios.

## 21/11/2026 · Nuevo host confiable de FableCut · privada, sin desplegar

Leer `docs/SUES_V1_NATIVE_HOST_PRIVATE_QA_20261121.md` y `PROJECT_STATUS.md` antes de despliegue. `SUES_NATIVE_HOST_CONFIG` activa un host exclusivamente privado de clon, por defecto deshabilitado. Se probó llamada MCP real y readback en clon 29→30, pero no el E2E de permisos/revisión del editor con un proyecto nuevo. No instalar como producción sin binding multiproyecto seguro, recursos verificados, QA audiovisual y rollback. Conservar WAC, V29, Reel 158404 y originales. La autorización de despliegue consta; no volver a pedirla.

## Continuidad 21/11 · Audio real y despliegue V1

Leer `docs/SUES_V1_TIMING_AUDIO_AUDIT_20261121.md` y cabecera de `PROJECT_STATUS.md`. La auditoría del worker Whisper está solo en PR #27/candidata, no producción; marca tiempos dudosos sin reajustar fonemas. En pista de voz real marcó 2 de 170 palabras, incluida «para»; con música mezclada no funciona igual. No seguir corrigiendo el Reel 158404, ya visionado por Carlos. Falta host nativo FableCut en arranque, regresión, rollback y promoción; no dar por desplegada V1. Respetar WAC, V29 y originales.

## Punto activo · Fase 5 · Q03 en curso

Consultar la cabecera de `PROJECT_STATUS.md` y «Q03 · Correcciones privadas de subtítulos» en `docs/SUES_V1_FASE5_Q02_NATIVE_20261119.md`. PR #27 canónica. Q01 finalizado, Q02 exportó el MP4 completo y verificó 2212 fotogramas. El MP4 de Q02 se conserva como referente. Q03 tiene una prueba nativa de 45 fotogramas de C41.S04 y una candidata que corrige cinco operaciones de captions. Antes de repetir un render consultar `sues-q03-reel158404-captions.service` y `q03-review/captions-render.log` en el workspace privado del VPS. Verificar a oído los pasajes cotejados con ASR y completar dos revisiones audiovisuales sobre el mismo MP4 corregido. Q04–Q06 pendientes.

## Punto de continuidad histórico · 19/11/2026 · Q02 en curso

Última continuación. Consultar la sección «Resultado posterior y punto de reanudación» del checkpoint Q02 y la unidad `sues-q02-v5-segments-resume-20261119.service`. V4 completa se detuvo por memoria. V5 tiene 108 recibos y un tramo nativo real de 213 fotogramas que valida en tres muestras la nueva posición lateral de la balanza. Está en curso la exportación por 12 ventanas. Confirmar su resultado antes de iniciar otro intento.

Consultar primero `sues-q02-render-singlecpu-20261119.service`, trabajo x_bb4okxqo, y `singlecpu-output-verification.json` en el workspace privado Q02 del VPS. La mezcla de 23 tramos terminó y se comprobaron 15 recursos y 108 recibos. El intento actual ya genera fotogramas. La revisión del MP4 completo sigue pendiente. La sección de diagnóstico del checkpoint Q02 documenta los intentos anteriores y la comprobación que debe ocurrir tras el cierre del exportador.

Leer docs/SUES_V1_FASE5_Q02_NATIVE_20261119.md y la cabecera de PROJECT_STATUS.md. El plan 158404 conserva 87 IDs fuente. Primer clon técnico con 107 recibos; candidata v4 con 108 por máscara adicional, mezcla y continuidad de sobres traducidos, sourceIn M01 corregido con fuente editable existente. No confundir estos cambios técnicos con aceptación creativa del resultado. Consultar la unidad propia sues-q02-render-v4-20261119 y render-v4.exit/log; comprobar que no está activa antes de otro export. No repetir la edición ya confirmada por MCP. Exportación completa, escucha ASR, bordes/composición y doble revisión audiovisual pendientes. Q01 cerrado, Q02 activo, Q03–Q06 pendientes, revisión compartida V1-2026-11-19-r12. PR #27 canónica; speech histórica. No tocar producción ni firmar QA que no se haya percibido.

## Punto de continuidad · 19/11/2026 · Q01 finalizado

Leer docs/SUES_V1_FASE5_Q01_CIERRE_20261119.md y la cabecera de PROJECT_STATUS.md. Fase 5 de 5, Q01 (1/6) cerrado conforme al criterio de preparar y revisar el plan. Próximo Q02 pendiente de preparación y ejecución. Conservar como bloqueos de Q02 la escucha/transcripción, los recursos/composición y la traducción íntegra, sin reabrir la aprobación creativa de la propuesta ya aceptada ni fingir una decisión firmada de ejecución. PR #27 conserva la línea de integración. La rama speech es histórica. Roadmap/Estado General en revisión V1-2026-11-19-r11.

## Puerta de entrada V1 · PR #27

- Abrir primero el [Estado General V1](https://docs.google.com/document/d/1L4gycV0LnKGhZ5VtWXAOlzVOzY3GDCp-qW1_X4A9B08/edit) y el punto activo del [Roadmap Maestro](https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit). Sus cabeceras deben compartir revisión y punto activo. Si difieren, el Roadmap prevalece y se corrige el resumen antes de continuar.
- Un punto activo por vez. Antes de editar, anotar su ID, qué evidencia existente resuelve parte de él, el cambio imprescindible y cómo se verificará. Cualquier idea lateral pasa a pendientes. Abrir una excepción solo cuando una evidencia concreta explique qué criterio del punto activo queda bloqueado.
- Integrar en `feat/master-director-story-orchestration-20261104` (PR #27). El [inventario de ramas](docs/SUES_V1_BRANCH_INVENTORY_20261118.md) documenta las referencias históricas. Incorporar únicamente cambios exclusivos que resuelvan un bloqueo de ese punto y tengan una prueba verificable.
- Aparcar la limpieza de ramas hasta Q06, después de validar la V1. Durante el desarrollo, consultar ramas divergentes solo si hay evidencia de que resuelven el punto activo.
- V1 usa una entrada de plan temporal, una revisión vinculada a la decisión humana y un proyecto FableCut compartido. El Master Director valida y ejecuta la cadena con las capacidades nativas existentes. Las pruebas visuales entran solo cuando comprueban el resultado de esa cadena o aíslan un fallo registrado.
- Dos intentos sin nueva evidencia obligan a registrar el bloqueo y escoger una comprobación que lo distinga. El progreso se registra por resultados comprobados, con barras estimadas global y de etapa.
- Para pasar a FINALIZADO, registrar evidencia, corregir estado/activo/siguiente en el Roadmap, actualizar el Estado General con la misma revisión y verificar ambos antes de empezar el siguiente punto. Actualizar PROJECT_STATUS.md para el checkpoint técnico. El historial inferior conserva contexto y queda subordinado a esta puerta de entrada.

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
