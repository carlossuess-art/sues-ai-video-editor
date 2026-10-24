## F7/F9 · QA09 validada con comparador automatizado · 24/10/2026

**No desplegado ni fusionado**: la producción sigue en `b7a7d74ecf2d1b931e6448f5353415d6bb1ce032`. PR borrador #15 continúa **incompleta**: el archivo `web/app.js` remoto no envía los flags necesarios y `src/external-edit-plan.js` remoto tiene blob `e96077e4719db470cead3b574d736c1298d4f6a2`, distinto del blob local validado `a33a7139225a6aafbd6ca2d6db24fbff61798e65`. **No fusionar ni desplegar.**

**Evidencia nueva de QA sobre MP4 real:** herramienta reutilizable `scripts/qa/compare_visual_renders.py` probada dentro de Docker aislado con las grabaciones original y QA09. Resultado `technicalPass:true`; vídeo H.264 1080×1920, audio AAC mono, igual duración, decodificación integral PASS, 2 B-rolls con `sourceAudio:false`, `originalVoice:true`, `captions:'preserve'` y 88 grupos de captions. Los flujos PCM decodificados tienen SHA256 **idéntico** `43fbc4b9f2ba09491ccd5b810b37a59e838f5b60dc4b8f317ee39ae23d46554a`. Medición *final* FFmpeg: −15,57 LUFS integrados, −2,01 dBTP y LRA 2,2 LU. No confundir con la normalización previa de voz −16,8 LUFS. Informe máquina privado `/opt/sues-video-setup/dopamin-real-broll-qa-20261024/render-conflict-fixed/qa09-media-integrity.json`, no subir vídeo privado a GitHub.

**Otra protección añadida a PR #15:** `tests/broll-conflict-frontend-contract.test.js` comprueba que la UI realmente envíe `replaceExistingBrolls:true` y `replaceHiddenZooms:true` antes de permitir un merge. Test 2/2 PASS con código local completo; debe FALLAR en rama GitHub parcial, indicando explícitamente que aún no está lista. Código de prueba publicado y verificado mediante GitHub connector. QA repetible `scripts/qa/compare_visual_renders.py` publicado y verificado. No se ha eludido el control de seguridad del conector que bloqueó la publicación de parte de la interfaz.

Fotogramas QA09 examinados a 10,5 s (cadena y captions), 25,0 s (tarjeta ELEMENTS) y 42,5 s (caminante). El hueco de caption a 42,5 s coincide con una pausa transcrita de 41,76 a 43,08 s, NO una pérdida de subtítulos. **Sin aprobación creativa/auditiva humana y sin aceptación F9.**

Pruebas de regresión anteriores: 319/321 correctas en Docker más 2/2 de Git en host; pruebas focales de la corrección 13/13 PASS. Coste de servicio externo 0 €. Global oficial 48 % sin inflarlo.

Siguiente acción exacta: completar la publicación de `web/app.js` y sincronizar el backend remoto con el código local probado por vía autorizada, ejecutar el contrato de UI, revisar PR #15, desplegar solo tras backup + rollback y validar el flujo desde navegador. Después, aprobación de montaje real DOPAMIN por Carlos.

---

## F7/F9 · Puente sugerencia narrativa → plan editable revisable · 24/10/2026

Desde la rama de producción `b9b439f9e5a2d0df9abc1731c500565977d6540d`, se añade al panel de sugerencias de recursos un botón individual **Preparar este B-roll para revisar**. Reutiliza las rutas y validación del plan externo existente. Sólo se ofrece en candidatos de vídeo con evidencia contextual y tramo fuente auditado. Genera JSON `sues-edit-plan/v1` con `sourceSha256` real y operación B-roll `resourceId`, `start/end`, `sourceIn`, `reason`; guarda borrador y guía al usuario a **Comprobar plan** y **Ejecutar plan en otra versión**. No ejecuta ni crea MP4 automáticamente.

Control de seguridad: no sobrescribe texto no JSON, fuente ajena, operaciones incompatibles ni B-roll solapado; máximo 3 clips y hasta 60 operaciones; origen y duración contrastados con catálogo actual y proyectos distintos rechazados. Mantiene revisión humana, voz original, CALMA y originales. Código, pruebas y límites: `docs/SUES_REVIEWED_BROLL_TO_EDIT_PLAN_20261024.md`. F7/F9 aún requieren nuevo render/aceptación; global oficial 48%. El despliegue y resultados completos deben verificarse, un commit no implica producción.

---

## F7 · Auditoría temporal y segmentos utilizables de B-roll · 24/10/2026

Rama aislada `feat/dopamin-temporal-scene-qa-20261024` desde el release verificado `773416414cabbb566c1ea8957ef4c5abea123166`. Se ha ampliado la revisión visual a una hoja de contacto de un fotograma/segundo por cada clip, sin declarar validación del contenido entero. FFmpeg ha recorrido todos los fotogramas de 4 B-rolls del banco con pruebas técnicas de cortes (`scene>0.36`), negros y congelaciones; no ha detectado intervalos en los cuatro bajo los umbrales seleccionados. Los 4 originales se contrastaron SHA256. Manifiesto temporal privado 0600 bajo `jobs/library/asset-temporal-audit-v1.json`, no incluido en GitHub.

El Director combina esa medición con contexto narrativo y revisión visual parcial para sugerir **el tramo exacto del recurso** sin saltos técnicos: cadena 1,51–4,89 s para «ajetreados» y caminante 0,23–6,17 s o amanecer 1,861–7,801 s para «crecimiento». No inserta ni reproduce automáticamente recursos; `needsHumanReview:true`. El reloj comercial continúa fuera de propuestas. Scripts, lógica, pruebas de seguridad y documentación: `docs/SUES_DOPAMIN_TEMPORAL_SCENE_QA_20261024.md`.

F7 no aceptada; F6/F9 abiertas, global oficial 48%. Pendiente registro del QA y despliegue real (no equiparar commit con producción), y QA final audiovisual con Carlos.

---

## F7 · Director narrativo de escenas verificables · 24/10/2026

Rama nueva `feat/dopamin-narrative-scenes-20261024`, a partir de release `bc74db06c5a2c09dbe8c251ec070ecf6d460cf37`, sin alterar otros worktrees. Se añaden reglas contextuales por bloques del ASR con negación, roles narrativos y marcas de escena de cuatro fotogramas inspeccionados por recurso. Se exigen prueba de licencias declaradas V2, compatibilidad DOPAMIN, verticalidad y duración. El sistema devuelve propuestas `contextual-review-only` con candidatos/scores/porqué/segundos e incertidumbre expresa; no hay render, modelo multimodal nuevo ni aprobación automática. La UI comunica el motivo y alcance.

Prueba original maestro: «ajetreados» 9,16–12,54 s propone la cadena bajo agua para revisar; «crecimiento» 40,98–46,92 s caminante y amanecer como alternativas; nunca propone el reloj comercial marcado. Todos son sugerencias narrativas, no aprobación. Se catalogaron `sceneTags` manualmente y se conservó una copia original del pequeño manifiesto privado antes de modificarlo. Detalles: `docs/SUES_NARRATIVE_SCENE_MATCHING_20261024.md`.

**F6/F7/F9 abiertas y global 48 %, V1 sin aceptación humana.** Validación final de suite, versión/backup y despliegue se documentarán al ejecutarse; no inferir del commit. Coste de API 0 €.

---

## F7 · Guard visual contra branding de B-roll · 24/10/2026

Nueva rama separada `feat/visual-safety-curation-20261024` basada en `feat/dopamin-context-review-20261024`, sin modificar otro worktree pendiente. Se revisaron cuatro clips **reales** del banco con cuatro fotogramas por archivo: reloj con inscripción comercial visible, sendero con persona de espaldas, cadena/amanecer sin textos observados **solo en las muestras**. Implementada carga validada del índice privado opcional `asset-visual-review-v1.json` que registra riesgos por hash de medio, bloquea recomendaciones de vídeo con marca/texto ajenos y señala muestras limitadas en UI; no aprueba automáticamente nada, no borra recursos y no cambia exportación ni CALMA. Ver `docs/SUES_VISUAL_SAMPLE_GUARD_20261024.md`. F6/F7/F9 abiertas; global oficial 48 %.

---

## DESPLIEGUE VERIFICADO · F7 FILTRO B-ROLL · 24/10/2026 UTC

Producción VPS srv1841004 actualizada al commit de código `43cf0d908636ed2ec7c10101f169bdacab7fdecc`, sin merge a main y conservando PR borrador #10. Primer intento abortó de forma segura y recuperó el contenedor anterior: la copia de datos difería porque `uploads/asr/worker.json` era actualizado continuamente por Whisper (servicio systemd independiente). No se relajó la verificación. Segunda ejecución pausó `sues-editor-whisper.service` temporalmente (sin trabajos pendientes), realizó copia privada verificada SHA256 `69690132066294cfc7e04eb91a82642af7b5cda93228cd7a9387fdfc86822922`, desplegó `43cf0d9` y reactivó Whisper: ACTIVE.

Backup de rollback verificado: `/opt/sues-video-setup/update-backup-20261024-115216-130159`; versión anterior conservada. POSTDEPLOY: commit montado coincide; HTTPS 200; `/api/health`, jobs, assets, capacity, search y media 200 con sesión; datos privados jobs/assets/capacity/search/media sin sesión 401; iteración 08 MP4 conserva hash `bedb0d504642f71ab03e1f3db061c9417bdc2e15b8ff6bdc42b441e0cfc65cbc`, estado DONE. Prueba del nuevo filtro ejecutada desde contenedor vivo como UID 1000 contra transcripción maestra: 0 cues / autoPublish:false. Cambios en código PRODUCTION verificados, pero calidad estética/audio DOPAMIN sigue sin aceptación F9.

La incidencia operativa recurrente de heartbeat ASR durante backups debería resolverse en el script de despliegue con una pausa/restablecimiento seguro, sin renunciar a cotejar los bytes del backup. No repetir despliegue sin cola inactiva y reversión. F6/F7/F9 abiertas; progreso global 48 %; coste externo 0 €.

---

## F7 · Corrección de falsas recomendaciones de B-roll · 24/10/2026

Rama independiente `feat/dopamin-context-review-20261024`, basada en producción `051edfb74296592161f526b434872df1ffd56a4a`; cambios a `src/private-library-search.js`, `src/director-library-cues.js`, tres tests nuevos en `tests/director-context-filter.test.js` y explicación `docs/SUES_DOPAMIN_CONTEXT_BROLL_20261024.md`. **No desplegado**, **no fusionado en main**. No se tocó el trabajo pendiente de audio ni los originales.

Fallo reproducido sobre transcripción existente del maestro: la recomendación confundía «Hacía» con «hacia», vinculaba «tiempo» genérico a un reloj y sugería 3 B-rolls sobre 2 bloques. Filtro conservador exige evidencia literal no genérica o dos coincidencias literales para vídeos; cada recomendación conserva evidencia léxica y revisión humana, sin autoimportar medios. Después sobre el mismo maestro: 0 recomendaciones, mejor que insertar clips arbitrarios. Pruebas focalizadas 9/9 PASS, `npm run check` y git diff sin errores. Aún no hay identificación semántica profunda ni análisis visual del contenido. F7/F9 continúan abiertos, global oficial 48 %, coste 0€. Siguiente: publicar rama, integrar cuando se pruebe; completar revisión visual real del MP4 08 y construir elección narrativa de recursos.

---

## REPARACIÓN SFX CORTOS · 24/10/2026

Prueba con los whooshes privados reales descubre un fallo adicional de FFmpeg/loudnorm con entradas cortas: pad de 1 s producía salida muy atenuada (picos -14,06/-26,15 dBFS antes del gain). Pad de 3 s estabiliza el medidor/limitador (pico -1 dBFS), recortando después al número de muestras original antes de aplicar gain y retraso. No cambia tiempos ni prolonga eventos. Se fija además el layout estéreo explícito tras remuestreo.

Regresión nueva con transitorios sintéticos 0,36/0,864/1,601604 s: nivel audible, picos limitados y duración exacta PASS. Suite 298 pruebas primarias PASS más MP4 con audio/transiciones tardías bajo 1 GiB en runtime VPS PASS; 299 pruebas únicas cubiertas. Versiones 06/07 completas previas a esta corrección NO se consideran aceptación de sonido.

The Hex (Hex 09), de Steven Ruud / The Cynic Project, publicado por su autor como CC0: https://opengameart.org/content/the-hex . Fuente original 85.522.816 bytes conservada, SHA256 5147331643738a8e54e7ae554289b94d86cdb4c83651d54da90f7519cf7e79de. Asset de 70 s 55fc796a8b8062f55686ef690d724522d0d67f5393d72aade9c6c0d631c8dff6 importado como licensed. Original y procedencia guardados en la carpeta musical de Drive. Elección provisional, sin coste, sin aceptar compra/suscripción ni presentar un banco musical completo. La búsqueda en la carpeta musical preparada y SUNO no encontró pistas adicionales; no extrapolar esa ausencia a todo Drive porque el buscador general filtra formatos de audio.

Iteración 06 (fb3b2b60-c3b2-4657-9637-ff0ecbac1c08): MP4 completo 68,634 s, SHA256 2ebf63218637f01bfbb5df69d2091a68bf00df10c609cbf1140e3b7cd30e08a0, 27.440.731 bytes; mezcla -15,50 LUFS/-1,90 dBTP, voz 150 %, efectos 30 %, música 18 %, énfasis naranja/metal 145–160 %. Reproducción completa en navegador y frames reales revisados, sin aprobación creativa de Carlos. Guardada en Drive: https://drive.google.com/file/d/1v7odDTfB08YRbgkT26p_VmoGivPNP8Es/view . Iteración 07 prueba otra pista; nueva 08 pendiente para incorporar el arreglo de SFX cortos. B-roll continúa siendo una decisión editorial por afinar, no un cerebro entrenado. F6/F7/F9 abiertas, global 48 %.

---

## CORRECCIÓN ADICIONAL · Transiciones tardías y memoria · 24/10/2026

Iteración 05 del maestro (03ded122-67af-4877-8e7d-5c068897478a) creada desde Dar instrucciones y fallida por SIGKILL/OOM antes de emitir fotogramas. Las ramas split/trim de transiciones tardías forzaban lectura adelantada y colas de fotogramas 1080p. No contar esa versión como exportada ni aceptada.

Desenfoque y expansión radial ahora operan directamente sobre el flujo continuo, con pulso acotado de 400 ms y sin rama tardía. La fase radial se calcula una vez por fila para evitar trigonometría redundante por cada muestra/píxel. Se conserva el compositor y la voz; radialBurst documental no se modifica en este bloque. El nuevo módulo de niveles entra en ENGINE_HASH.

Prueba real en imagen del VPS/FFmpeg 5.1: MP4 20 s con transiciones a 6/16 s, límite AS 1 GiB y contenedor 1 GiB, PASS. Diferencias de imagen decodificada: desenfoque 4,07, radial 13,81, tras el efecto 0,28 (MAD RGB): efectos visibles y regreso a imagen limpia. Voz/música/SFX medidos en PCM decodificado. Regresión lógica 297/297 PASS. FFmpeg 8 del entorno primario presentó límites de dirección virtual/errores internos x264 con el patrón complejo; la prueba completa se valida en el runtime objetivo del VPS. Ningún original modificado.

Mezcla aislada de 05 antes del fallo visual: RMS -14,7 dBFS, pico -2,2 dBFS; música RMS -28,0 dBFS, SFX procedural pico -18,6 dBFS. Es una medición WAV del grafo, NO el MP4 final ni aceptación de escucha. Nueva versión completa pendiente tras esta reparación; global 48 %, F9 abierta.

---

## REVISIÓN DE CARLOS · Audio y énfasis DOPAMIN · 24/10/2026

Carlos observa que la versión 04 avanza, pero no percibe música/SFX/transiciones ni cambios suficientes de tamaño/color en captions. B-roll mejorable; no hay aceptación F9. Sus niveles solicitados: voz 150 %, efectos 30 %, música 16–20 % (se ensaya 18 %). Énfasis naranja fuego y metálico.

Diagnóstico real: voz normalizada RMS -16,2 dB; música aislada tras ducking RMS -36,8 dB; SFX procedural pico -37,8 dB. Los porcentajes aplicados a fuentes de niveles dispares y la receta sintetizada demasiado baja no garantizaban audibilidad. Los subtítulos corregidos manualmente perdían énfasis automático; los restantes usaban blanco y proporción 14/12 poco perceptible. Los tres eventos llamados transiciones eran destellos cálidos de 400 ms, no cambios de plano elaborados.

Corrección optativa: control de voz 0–200 %, nivelar música a referencia -10 LUFS y SFX a -16 LUFS ANTES de porcentajes; suavizar ducking; mantener originales y tiempos. Fuentes cortas se rellenan para el medidor y se recortan antes de retrasarlas. Valores por defecto anteriores y CALMA conservados. Énfasis explícito por palabra con naranja fuego/metal naranja y escala 1–1,6; control de tamaño y persistencia UI. Desenfoque/expansión radial existentes disponibles por tiempo y sustitución de transición sin duplicar. No reflejos metálicos 3D ni nuevo Director semántico.

QA: 297 pruebas lógicas/regresión PASS; MP4 real bajo 1 GiB en imagen VPS PASS, voz/música/SFX medidos en PCM decodificado. Sintaxis PASS. La prueba detectó y permitió corregir que voiceGain contaminaba el pase de vídeo. Nueva versión del Reel pendiente de generar y revisar; ninguna medición sustituye aceptación creativa. Global oficial 48 %, F6/F7/F9 abiertas.

La versión 04 ya pudo descargarse y guardarse en la carpeta de pruebas de Drive: https://drive.google.com/file/d/18VLI4AKxPX9zoHQNOPpaofpdv0lryRej/view . Conserva el rechazo parcial de audio/énfasis; NO presentarla como final aprobada.

---

## ITERACIÓN 04 TERMINADA · Revisión audiovisual pendiente · 23/10/2026 UTC

Trabajo cca3b1cf-2447-4cb8-a4af-df70c7cc51a9 terminado. MP4 H264/AAC 1080×1920/30 fps, 68,634 s (original 68,6491 s; diferencia 15 ms), 27.431.231 bytes. SHA256 9631b26edbf0dc1979d37aff84da0f12b1d8d9329e95d188d998c8c84987ae8a. Decodificación completa estricta PASS y exportación HTTP 200 con bytes/hash idénticos. Original conserva su SHA obligatorio.
Mezcla FINAL medida: -18,71 LUFS, -4,33 dBTP, LRA 2,40 LU. Son los valores input_i/input_tp del análisis del MP4; output_i/output_tp serían una renormalización hipotética, no el nivel del archivo entregado. Voz antes de mezcla: original -32,37 LUFS → -16,8 LUFS/-3 dBTP. Conserva la edición visual de iteración 03.
Abrir esta versión: https://editor.suesholistics.com/?project=cca3b1cf-2447-4cb8-a4af-df70c7cc51a9
Descarga MP4 privada (requiere sesión autorizada del editor): https://editor.suesholistics.com/api/jobs/cca3b1cf-2447-4cb8-a4af-df70c7cc51a9/media
Pendientes obligatorios: reproducción y escucha completas de esta versión en Work, evaluación frente a referencias y aprobación creativa de Carlos. No se declara aceptación audiovisual ni Fase 9 superada. Subida de MP4 03/04 a Drive bloqueada por desconexión del entorno principal; archivos conservados en editor/VPS. Informe y versión 02 sí están en Drive. Global oficial 48 %, sin porcentaje de fase inventado.


---

## PUBLICADO · Reparación DOPAMIN y mezcla de voz · 23/10/2026 UTC

Código y VPS: `1cf07c3e2ffd320fbbebf1d117c25c248299dca3`, rama documentada, sin merge a main. Flujo real en la web: Dar instrucciones → revisión de 35 operaciones → versión independiente → MP4 exportado y comprobado. Iteración 03: `95dd39c1-ea53-4c88-88f1-62b80fa3698d`, 68,6491 s, SHA256 `901c26f10b24002698f5cc05f35a2e39abc2f4ed3fcd707b6dd28baa486314d9`. La edición incorpora zooms narrativos, tarjetas, B-roll, overlay, transiciones, SFX y música; los recuentos no certifican calidad creativa.

La iteración 02 midió -33,3 LUFS/-13,2 dBTP: mezcla demasiado baja. No se promueve como candidata final. Se publica normalización del audio original en dos pases antes de música/SFX, con ducking adaptado y auditoría de loudness real. Iteración 04 `cca3b1cf-2447-4cb8-a4af-df70c7cc51a9` iniciada con una sola operación voice-level, conservando los ajustes anteriores; comprobación final pendiente al escribir este estado.

Render monolítico falló por OOM: separación vídeo/audio y decodificación estricta resuelven el fallo en MP4 completo. La UI conserva ajustes y recursos y recupera lecturas GET transitorias; las instrucciones se comprueban contra efectos compilados y se bloquean si faltan recursos. Encuadre manual revisado ligado al SHA, sin presentarlo como seguimiento facial/ocular.

Pruebas: 294 PASS en contenedor; única prueba dependiente de Git ejecutada separadamente en host 1/1 (binario ausente en imagen). Python despliegue 29/29. Incluye CALMA y prueba MP4 de voz baja normalizada con música/SFX bajo límite de memoria. Diagnóstico/despliegue OK. Whisper activo; memoria 1,25 GiB conservada. HTTPS 200 y API privada sin sesión 401. Respaldo `/opt/sues-video-setup/update-backup-20261023-231111-119180`, SHA256 `d5ff048f3af7eb8133a3274f1db5353cb12475c708131ebbf7da0bcf8f37c5f2`.

Original maestro conservado sin modificar/resubir. Iteración 02 en [Drive](https://drive.google.com/file/d/18DNjU2WEL5hGewtBD0RKXF2i9P2gkkZL/view), marcada como prueba. [Informe y comparación en carpeta de pruebas](https://docs.google.com/document/d/1YoBM1VbN9TpQvZXXtJjXDfvh5tUMbm9XM3Cr_3NYkOA/edit). Roadmap actualizado. Evidencia privada/VPS: `/opt/sues-video-setup/dopamin-qa-20261024`.

**Bloqueo real:** el entorno principal de Work se desconectó: navegador y archivos locales no disponibles. Drive rechaza nuevas subidas con “no primary turn environment is available”. Continúa validación técnica en VPS; reproducción/escucha final, exportación de últimas versiones a Drive y aprobación creativa de Carlos pendientes. Global oficial **48 %**, F6/F7/F9 abiertas. No se declara criterio V1 ni Fase 9 superados.

---

## EN DESARROLLO · Reparación DOPAMIN real · 24/10/2026

Reproducida causa de captions-only sobre trabajo cb62a001: sin candidatos léxicos ni visión, sin pista musical asignada y SFX dependientes de eventos inexistentes. Preflight de instrucciones ahora comprueba efectos compilados; encuadre manual ligado al original y zooms explícitos incorporados sin modelos ni costes nuevos. Primera regresión local 290/290. Aún sin despliegue de este bloque ni candidato audiovisual validado. Ver docs/SUES_DOPAMIN_REPAIR_20261024.md. Oficial global 48 %, F6/F7/F9 abiertas.

---

## PUBLICADO · Editor vertical DOPAMIN, instrucciones y streaming ágil · 23/10/2026

**PRODUCCIÓN VPS confirmada:** Git SHA `a9219413ed2054130a4d18b4d66b2921f39f5e68` (versión anterior `f8bc446d` conservada). Proyecto existente, rama `feat/library-ambient-overlays-mastering-20261021`; NO merge a main. Backup previo a actualización verificado en `/opt/sues-video-setup/update-backup-20261023-064607-109940/editor-state.tar`, SHA256 `708a5bc1e40585e5014c8708a9e34cec443ce3d737e074b616a81ec5895e6f99`. Deploy mediante `scripts/deploy/update_service.py`, diagnóstico PASS, cola inactiva, Whisper activo y HTTPS 200 tras la copia.

**FRONTEND:** subir original → plantilla CALMA o DOPAMIN exclusiva y bien identificada → `Dar instrucciones` habilitado (motor compatible existente) / `Edición automática · próximamente` desactivado (Director IA completo no desarrollado). Vista vertical real 9:16, 46 % de columna en desktop, responsive móvil; overlay `EDITANDO VÍDEO` durante cola/render/publicación, `VÍDEO ORIGINAL` hasta tener edición y `VÍDEO EDITADO` con previsualización y exportación cuando DONE. Service Worker shell v19. `preload=auto` y cache segura de hash SHA256 de medios subidos por firma dev/inode/tamaño/mtimeNs/ctimeNs: validación al primer Range y tras cualquier cambio de archivo.

**PRUEBAS:** 11/11 focalizadas, 284/286 Docker y 2/2 de Git en host, `node scripts/check.mjs` PASS, `git diff --check` PASS. Postdeploy autenticado: HTML app.js studio.css sw.js v19 HTTP 200 con identificadores correctos, /health /jobs /assets /library/capacity /library/search /uploads HTTP 200, sin sesión las rutas privadas siguen 401. HTTP Range original subido existente de 34.175.827 bytes: tres solicitudes 206 de 65.536 bytes, tiempos desde VPS de 0,036/0,003/0,002 s. No se borraron ni cambiaron proyectos originales. No afirmar desaparición total de buffering en Android, solo causa probable optimizada y endpoint verificado.

**LÍMITES:** no se ha hecho aún captura y revisión visual en navegador móvil ni aprobación de un vídeo real DOPAMIN, y la ruta de instrucciones sigue aplicando órdenes limitadas (no cine completo). F7 Director IA y F9 aceptación V1 pendientes, porcentaje oficial global 48 % sin incremento. Sin nuevos costes. [QA frontend](docs/FRONTEND_QA_20261023.md).

**Siguiente acción exacta:** validar visualmente interfaz 9:16 y flujo en navegador Android autorizado, tras satisfacción del usuario probar un Reel real, revisar calidad narrativa, safe zones, captions, recursos, audio y aceptar Fase 9. No pedirle probar la interfaz anterior.

---

## FRONTEND · Plantilla única + instrucciones + preview 9:16 · 23/10/2026

Se ha corregido el flujo **subir vídeo → elegir CALMA/DOPAMIN → Dar instrucciones**, manteniendo «Edición automática» desactivada hasta construir el Director IA. Plantilla activa visible y persistente, reproductor de proporciones 9:16 (~46 % ancho estudio escritorio, responsive móvil), estados «VÍDEO ORIGINAL», «EDITANDO VÍDEO» y «VÍDEO EDITADO», previsualización/exportación después del render. La ruta de «Dar instrucciones» conserva el intérprete limitado existente; no simular un Director autónomo ni prometer reproducción cinematográfica 100 %.

Se ha cambiado preload de vídeos a auto y optimizado `VideoIntake.media()`: primera lectura valida SHA256 y peticiones HTTP Range sucesivas reutilizan firma segura mientras dev/inode/size/mtimeNs/ctimeNs permanezcan invariables; alteraciones vuelven a verificar integridad. El Service Worker usa caché shell v19 sin guardar medios sensibles.

QA de rama: 11/11 focalizados PASS, 2/2 tests Git deployment en host PASS, suite Docker 284/286 PASS (dos fallos por falta de ejecución de Git dentro del contenedor, ambos pasan en host). `node scripts/check.mjs`, `node --check web/app.js`, `git diff --check` PASS. No se ha medido todavía reproducción real en Android; no afirmar que los cortes se han resuelto al 100 % ni F9 completada. Documento `docs/FRONTEND_QA_20261023.md`.

Siguiente acción: registrar GitHub SHA, `update_service.py --diagnose`, backup/rollback, deploy controlado y verificación autenticada de CSS/HTML/JS, HTTP Range, fuentes privadas, Whisper y render sintético; solo entonces indicar producción actualizada. Porcentajes oficiales sin cambio: global 48 %.

---

## RESOLUCIÓN F6 · Biblioteca reparada y release desplegado · 23/10/2026

**Producción verificada:** `f8bc446dc21e1a2718708447d4ffe2caec1d8ebf` instalado mediante `scripts/deploy/update_service.py` (no equivale a merge en `main`). Servidor srv1841004, HTTPS 200, Whisper activo. `/api/health` y `/api/jobs` 200 autenticados; cola 0 renderizando y 0 en espera antes del deploy.

**Incidencia #8 resuelta:** Desktop Commander root restauró la propiedad de entradas root:root de las carpetas privadas `editor/jobs/assets` y `editor/jobs/library` a UID:GID 1000:1000 sin cambiar modos ni hacer públicos los archivos. Se verificó previamente backup completo y hash SHA256 `68f16be2c4e18639c527e604081aab3d8809bd069b81f1da3c3ebe5732ca0310`. El preflight de lectura UID1000 comprobó 62 entradas assets y 9 índice, bloqueadas **0/0**, `ready:true`, sin modificaciones adicionales. Las rutas autenticadas `/api/assets`, `/api/library/capacity`, `/api/resource-catalog` y `/api/library/search` devuelven HTTP **200**; 20 medios instalados, capacidad 128 / 2 GiB, búsqueda devuelve sugerencias sin aprobación automática; `GET /api/jobs/:id/library-cues` HTTP 200 con `approvedToAutoPublish:false`. Sin cookie válida APIs privadas devuelven **401**. HEAD de media privado autenticado 200.

**Nuevo respaldo y rollback:** `/opt/sues-video-setup/update-backup-20261023-052537-102969/editor-state.tar` validado SHA256 `a8d2d17c30f251eddb949cd619f21feb0a02776317dbfd67b6b2886447602688`; release anterior conservado por actualizador.

**Prueba real de render, sintética (no aceptación F9):** `scripts/templates/smoke_local_preview.mjs` en Docker aislado, salida MP4 12s y `result.json` en `/opt/sues-video-setup/library-qa/smoke-deploy-20261023/`, PASS. B-roll visual rojo solo en 3–6s, azul antes/después; voz de 440Hz preservada y tono B-roll de 1700Hz omitido. Ratio 3,2333e-7. No se editaron proyectos reales del usuario. Suite de rama anterior 282/284 PASS en Docker (dos pruebas Git 2/2 en host). La aceptación estética de vídeo DOPAMIN y las fases F7/F9 siguen abiertas. Porcentajes oficiales sin variación: global 48 %, no inventar avance.

**Siguiente acción:** QA con vídeo propio de Carlos en flujo completo (subida, análisis, propuesta, retoque, preview, MP4), validar seguridad visual de captions/ojos/mascaras, aumentar contenido aprobado de biblioteca por lotes con licencia y pasar aceptación F9. No hay gasto nuevo.

---

## F6/F7 · Director con caché privada, UI de revisión y preflight preventivo · 22/10/2026

Desarrollo aislado sin cambios de producción: el Director recorre la transcripción con timestamps y consulta el catálogo de 24 entradas (20 medios/4 motions) y 309 índices de Drive con **un solo parseo por petición** en lugar de repetir lectura por frase. Sugerencias exclusivamente de vídeos, imágenes y overlays, nunca SFX, audio, motions nativos ni fuentes remotas; siempre `needsHumanReview:true` y sin autoinserción. En la interfaz Edición automática se agregó panel desplegable de sugerencias para la versión seleccionada; no altera el proyecto hasta que exista flujo de revisión/aplicación autorizado.

Preflight read-only `library_access_preflight.py` integrado en `update_service.py` antes de descarga/parada del contenedor e incluso en comprobación idempotente; detecta si el UID1000 no puede leer bibliotecas. En VPS real verificó 21 entradas de medios + 9 del índice sin acceso, **30/71**. La reparación sigue bloqueada por la conexión; no se ha realizado ni intentado eludir. Tests focalizados de preflight/caché/cues/HTTP/workflow **8/8 PASS**; suite integral de esta rama en Docker **282/284 PASS**, dos casos de Git fallan solo en Docker por imposibilidad de ejecutar el binario temporal y pasan **2/2 en VPS anfitrión**; `node scripts/check.mjs`, Python compile y `git diff --check` PASS. No afirmar 284/284 en un único contenedor. Guía `docs/SUES_PRIVATE_LIBRARY_ACCESS_PREFLIGHT_20261022.md`.

Estado de producción permanece `120ffb059d025f0318b2cabbff98a0242822a185`, HTTPS 200, Whisper activo, backup SHA256 verificado y rollback disponible. Rama de código actualizada localmente hasta revisión/publicación; último remoto antes de este bloque `9c91909363c6c7f85a435bc0e473766a9f0388bb`. F6/F7/F9 abiertas, global oficial 48 %, sin costes nuevos. Próxima acción: desbloqueo autorizado de permisos sin cambiar confidencialidad, QA de endpoints autenticados, despliegue reversible cuando los controles permitan y prueba creativa vertical.

---

## SEGURIDAD · preflight UID/GID biblioteca + filtro de sugerencias · 22/10/2026

Se añadió auditoría no destructiva de permisos `scripts/deploy/library_access_preflight.py` para que `scripts/deploy/update_service.py` aborte **antes de descargar/reiniciar** si el UID1000 no puede leer medios e índices. Sobre la biblioteca privada actual detectó **62 entradas de assets con 21 bloqueadas y 9 entradas de índice con 9 bloqueadas**, total 30 de 71; no se tocó ninguno. Tests aislados 3/3 PASS para usuario propio/ajeno, bloqueo de lectura, enlace simbólico y sugerencias por tipo. Director ya no confunde `native-motion` con B-roll: solo `video`, `overlay` o `image`. Documentación en `docs/SUES_PRIVATE_LIBRARY_ACCESS_PREFLIGHT_20261022.md`. La corrección real de propiedad continúa bloqueada por controles de seguridad de la conexión; no se ha sorteado ni aplicado. Bloqueo mantiene API de biblioteca no funcional hasta intervención autorizada. Cambio de código solo en desarrollo, pendiente de publicación/regresión; producción sigue `120ffb059d` intacta. F6/F7/F9 sin aceptación; global oficial 48 %.

---

## CIERRE PROVISIONAL · PUBLICACIÓN Y BLOQUEO OPERATIVO · 22/10/2026

GitHub rama `feat/library-ambient-overlays-mastering-20261021` publica **`61b08b416a229f3449f7b0fe3880998161a12009`**, incluyendo el Director de sugerencias no automáticas (commit intermedio 7edd62a) y el análisis cuantitativo DOPAMIN (61b08b). La rama no está fusionada con main. Producción sigue en **`120ffb059d025f0318b2cabbff98a0242822a185`**, comprobado en el VPS, no en 61b08b. Sin nuevo despliegue por bloqueo en los permisos de biblioteca.

Suite integral más reciente: 281 casos en Docker, 279 PASS, 2 fallos por binario Git inaccesible en ese contenedor; 2/2 tests Git en host VPS PASS. Verificaciones específicas DOPAMIN, Director y ELEMENTS 15/15 PASS; `scripts/check.mjs` PASS. Informe de referencia `docs/SUES_DOPAMIN_MEASURED_20261022.md` guardado también en Drive canónico (IDs de documentación en Roadmap).

BLOQUEO REAL: APIs de biblioteca autenticadas no disponibles por propiedad root de archivos privados con modo 0600 y directorio de índice 0700, no accesibles al proceso UID1000. Intento de corregir los metadatos de propiedad bloqueado por controles remotos; sin reintento por otro método. Se necesita ajuste autorizado limitado a esa biblioteca (sin permisos públicos) y QA HTTP con sesión. Mientras tanto código de recomendaciones todavía no desplegado y F6/F7/F9 abiertas. Global oficial 48 %, porcentajes no alterados. Próxima acción exacta: levantar bloqueo operativo de permisos, luego revalidar APIs, biblioteca, jobs y primer MP4 vertical; hacer QA de Director, overlays y DOPAMIN.

---

## REFERENCE QA · DOPAMIN cuantificado · 22/10/2026

Fuente privada original en Drive `1nf9lPujkKSjIrcLTQEIh6Dvi0reViPAP`. Mediciones FFmpeg sobre 55,912604s 1080×1920/29,97fps: detector de grandes cambios visuales a umbrales scene 0,20/0,32/0,45 = 45/25/13 eventos, equivalente 48,3/26,8/14,0 candidatos por minuto; NO se equiparan a cortes reales por presencia de animaciones, flashes y overlays. Muestreo HSV 56 cuadros (1 fps): mediana de píxeles de rojo saturado 27,53 %, rojo ≥15 % en 35/56 cuadros, mediana píxeles oscuros 60,34 %. Métodos y limitaciones en `docs/SUES_DOPAMIN_MEASURED_20261022.md` y `examples/references/dopamin-20261022.measured.json`. Copia privada en Drive canónico de las mismas fichas. Código DOPAMIN `visualProfile` referencia nuevo ID complementario sin sustituir Keanu, sin alterar frecuencias ni disparar efectos por tiempo. Tests focalizados de perfiles/Director/ELEMENTS 15/15 PASS. NO es aceptación estética F9 ni cortes minutados humanos. Esta medición y metadatos todavía NO desplegados; se suman a desarrollo, sin incremento porcentual oficial.

---

## BLOQUE 22/10 · Director con sugerencias narrativas; bloqueo de permisos en biblioteca desplegada

Producción ya actualizada a commit remoto `120ffb059d025f0318b2cabbff98a0242822a185`, rama `feat/library-ambient-overlays-mastering-20261021`, HTTPS 200, Whisper active, backup íntegro verificado `update-backup-20261022-205749-81951` SHA256 `68f16be2c4e18639c527e604081aab3d8809bd069b81f1da3c3ebe5732ca0310`. Suite 276/278 PASS en Docker, otros 2/2 tests de git PASS en host. Fuente publicada y árbol idéntico al candidato local.

IMPORTANTE: post-deploy la API autenticada /api/health y /api/jobs responde 200 y cola sin trabajos, pero /api/assets, /api/resource-catalog y /api/library/capacity 400, /api/library/search 503. Causa confirmada: archivos privados de assets/library con propietario root y modo 0600, directorio library root 0700, no accesibles por runtime uid1000. Control de la conexión BLOQUEÓ la reparación; no se sorteó. No confirmar que biblioteca está disponible operativamente hasta ajustar permisos mediante operación autorizada y repetir QA. Se conservan originales y backup.

Nueva rama local de desarrollo sobre release: `src/director-library-cues.js` y GET autenticado `/api/jobs/:id/library-cues`, agrupación de palabras reales/timestamps + consultas a la biblioteca instalada, recomendaciones para revisión y jamás inserción automática ni descarga de enlaces privados. Tests específicos 2/2 PASS. No desplegado ni publicado aún. Documento técnico: `docs/SUES_DIRECTOR_LIBRARY_CUES_20261022.md`.

Próxima acción exacta: resolver mediante procedimiento autorizado el permiso UID/GID de biblioteca de producción y validar APIs privadas; luego publicación/pruebas y despliegue de la consulta narrativa del Director. No subir porcentajes oficiales hasta aceptación de F6/F7/F9.

---

## CONTINUIDAD · DOPAMIN + biblioteca escalable (desarrollo) · 22/10/2026

FASE 6/10 · Biblioteca/motor por capas · ABIERTA. Progreso de fase/global: sin modificar porcentajes oficiales por pruebas todavía no integradas en producción.

Referencia DOPAMIN 100 % nueva: vídeo autorizado como referencia visual por Carlos, `VID_20261022_101557_201.mp4`, 55,91 s, 1080×1920. Original privado y manifiesto depositados en carpeta original Google Drive `01_REFERENCIAS · ADN DE EDICIÓN` (ID `147twZ2YKpU1-ZHlVgp_MNLa3kPM18KH9`); original ID `1nf9lPujkKSjIrcLTQEIh6Dvi0reViPAP`. No se usa como recurso de render; Keanu mantiene su papel de motor visual maestro. Documentación: `docs/SUES_DOPAMIN_REFERENCE_20261022.md`, `examples/references/dopamin-20261022.dna.json`.

En el worktree existente `feat/library-ambient-overlays-mastering-20261021` se preparó una búsqueda semántica autenticada (`GET /api/library/search`), que consulta 24 referencias oficiales y 309 fuentes históricas sin exponer enlaces privados, sin autoaprobación ni descargas. Primer commit **local** `b3d325506a30ed4a5d67bdbc782cf5908b28c746`.

Continuación en desarrollo: cuota MediaLibrary **128 recursos / 2 GiB agregado** con límite individual 40 MiB intacto, endpoint de capacidad autenticado `GET /api/library/capacity` y tests de cantidad, bytes, deduplicación, acceso y parámetros. **La producción todavía tiene 24 plazas y 20 medios instalados**. Antes de esta ampliación: nuevos tests 3/3 PASS, suite host 267 PASS / 8 fallos por FFmpeg no instalado / 1 SKIP de 276; revalidación real FFmpeg focalizada en Docker 19/19 PASS. Con cuota: tests focalizados 8/8 PASS; `scripts/check.mjs` y diff --check PASS. Ver `docs/SUES_LIBRARY_CAPACITY_20261022.md`.

No hay merge, publicación remota ni despliegue nuevo; producción vigente `56b686ff3bc284431528f2612219115632d4670a`, HTTPS 200 y Whisper activo. Próximo hito: publicación GitHub autorizada con verificación del árbol remoto, regresión integral con FFmpeg, backup/rollback y posible despliegue, después integración del buscador al Director IA y QA creativa con Reel propio. No hay gastos nuevos.

---

## FASE 6 · PRIMEROS DOS MEDIOS COMPRADOS RECUPERADOS + CAPAS Y MARGEN AUDIO · 21/10/2026

**RECURSOS REALMENTE INCORPORADOS EN EL VPS PRIVADO**: 1 B-roll de reloj comprado (`clock (1).mp4`, 8.938.314 bytes; SHA256 `8f2cd474490e0b22b9cbb9aa3701ac0676c532c5e77c4a67f18c696113998c32`, 19.6s, 1920×1080), 1 overlay de chispas doradas compradas (`Sparks Pack 28.mp4`, 883.096 bytes; SHA256 `4d893b5a7b857886a678dc221ed99e04af4dd1680b0c1e35004ba0730bee3fe1`, 1.434s, 1920×1080). Derechos de uso privado declarados por Carlos, sin redistribución de archivos brutos a terceros. Fichas V2 en almacenamiento privado con `lifecycle: integrated`, `approvedForProduction:false` y `rightsStatus:unverified` por falta de revisión del alcance del contrato. Preservados 13 sonidos anteriores, 4 motions y 309 referencias a Drive; catálogo operativo total 19 registros (13 SFX, 4 motions, 1 vídeo, 1 overlay).

Un tercer archivo de Light Leaks azul se RECUPERÓ Y INSPECCIONÓ en zona de QA pero aún NO entró en biblioteca operativa. Ningún otro archivo de ~18 GB transferido. Orígenes comprados en Drive de Terapias, originales intactos; SHA en destino comprobados. Backup previo de SFX/metadatos `/opt/sues-video-setup/library-backups/20261021-asset-before-real/assets-before-real.tar` 2.2MB, SHA256 `990afe03b916f4514d782502931a5f52be92e713d1914fd38395b5f5da78da3f`. Copia anterior de catálogo también guardada.

**MP4 REAL CON B-ROLL COMPRADO**: QA de 13s con voz original y cuatro grupos de captions, reloj insertado 5–8s, whoosh existente a 4.75s, eco 1.1–3.1s y TV 8.6–10.5s, decodificación final PASS en 1080×1920. **MP4 CON CAPA DE CHISPAS**: se exportó misma fuente con chispas compradas 9.15–10.4s (compositadas en mitad inferior con intensidad .22), SFX, eco y TV. Auditoría completa de salida PASS, fuentes con hash verificado. **Inspección visual detectó franjas negras de fuente horizontal**, de modo que la colocación del overlay no cumple aún nivel creativo; no confundir composición técnica con aceptación ni rotoscopia.

**MARGEN MASTERING QA**: nueva opción de margen final `masteringEnabled` (por defecto falso hasta revisión creativa), probada sobre MP4 real completo. EBU R128 True Peak/LUFS medido: antes −15.7 LUFS / −0.1 dBTP, después −17.5 LUFS / **−1.7 dBTP**. Correcta decodificación, voz/subtítulos conservados. No equivale a mastering dos pasadas ni aceptación auditiva humana.

**RAMA DE CÓDIGO EN DESARROLLO**, aún NO desplegada: `feat/library-ambient-overlays-mastering-20261021`, hija de los presets ya publicados. `overlayEvents` limita dos clips, 0.4–2.5s, opacidad/intensidad .05–.35, filtro de fondo negro y restricción a mitad inferior, combinada con B-roll, SFX, voz y captions existentes. Implementación de plan Gemini, recurso privado por SHA256, backup portable, prueba de render y metadatos narrativos por emoción ofrecidos a Gemini. Revisión humana imprescindible para sujetos, ojos y safe zones. `masteringEnabled` es opt-in para evitar cambiar versiones anteriores. Tests focalizados 13/13 PASS. Suite general 272/273 PASS en contenedor, caso Git `safe.directory` necesita ejecución en host; prueba host 2/2 PASS; `scripts/check.mjs` PASS. Detalle técnico `docs/SUES_REAL_PURCHASED_LIBRARY_QA_20261021.md`.

**Producción aún en** `56b686ff3bc284431528f2612219115632d4670a` hasta despliegue posterior. Próximo hito: verificar GitHub y desplegar nueva rama solo con backup íntegro/rollback y Whisper en reposo; luego QA con vídeos verticales reales y oclusión. Fase 6, F9 y V1 siguen abiertos, porcentajes sin cambiar. Gastos nuevos 0€.

---

## RELEASE VERIFICADA · FX de voz en producción · 21/10/2026

El bloque de presets que aparece como «desarrollo» más abajo **YA FUE DESPLEGADO** en VPS Hostinger. Commit exacto instalado y comprobado en el contenedor: `56b686ff3bc284431528f2612219115632d4670a`, rama `feat/cinematic-voice-presets-20261021`, sin merge a rama oficial. HTTPS 200; rutas `/api/assets`, `/api/resource-catalog` y `/api/jobs` responden 401 SIN sesión; Whisper ASR active; 13 SFX originales y 309 fuentes de Drive indexadas se conservan.

Auditoría: exportación MP4 previa aislada con B-roll sintético, dos efectos de voz, 4 captions, audio presente y fullDecode PASS; suite de 268 tests, 267/268 en Docker con único caso Git ausente, prueba Git 2/2 en VPS. `check.mjs` PASS. El audio mantiene volumen medio de referencia (-20.8 dB baseline versus -20.7 dB con FX), pero el true peak/masterización y la aceptación estética auditiva siguen pendientes; picos 0.0dB no son un máster final apto para publicación profesional.

Despliegue por `scripts/deploy/update_service.py`: diagnóstico previo PASS, cola inactiva, Whisper sin transcripciones activas pausado únicamente durante la copia y reactivado; copia integral de estado 352 archivos verificados, SHA256 `f9dae667a11701408edaed6b1f22ec9abeb710e25566e21aa66af20d6aa1f194`, ruta `/opt/sues-video-setup/update-backup-20261021-215916-56757`; contenedor anterior conservado y rollback disponible. No se tocó la cuenta de terceros, Creator Club, biblioteca comprada ni configuraciones ajenas al editor. Gastos nuevos 0€.

Documentos: `docs/SUES_VOICE_PRESETS_V1_20261021.md`, Roadmap Maestro https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit y Biblioteca Maestra https://docs.google.com/document/d/1EFK4TtTmi3ToWKfl5qGQC7TvEmCL4zIWuR0apdRotAA/edit. Próxima acción exacta: incorporar por sesión autorizada un B-roll real adquirido, ejecutar Gemini plan con recursos reales y presets, revisar muestras al oído y picos/volumen, después añadir lights/overlays por capas. Fase 6/9/V1 todavía no cerrada, porcentaje no actualizado.

---

## FASE 6 · FX de voz cinematográficos implementados y probados · 21/10/2026

**Desarrollo no desplegado aún** · rama `feat/cinematic-voice-presets-20261021`. Dos presets que se insertan por instrucciones de Gemini en intervalos precisos: `cinematic-echo` y `vintage-tv` (voz de televisión antigua con ruido procedimental separado); el audio original y subtítulos mantienen sus tiempos. Las reglas limitan 4 eventos de 0,7–6 s, intensidad 0,1–0,85, con 150 ms entre efectos y entrada/salida suavizadas. Sin suscripciones, recursos externos ni nueva aplicación. Archivo técnico: `docs/SUES_VOICE_PRESETS_V1_20261021.md`.

**Pruebas**: 4 nuevas pruebas específicas, 14/14 conjunto focalizado PASS. Regresión completa de 268 casos: 267/268 PASS dentro del contenedor FFmpeg, única prueba que necesita Git fuera de imagen pasó 2/2 en host VPS. `node scripts/check.mjs` y `git diff --check` PASAN. MP4 de prueba real con voz y B-roll sintético, eco 1,1–3,1 s, TV 8,6–10,5 s, H264 1080×1920/30fps, duración 12,966667 s, 4 grupos de captions, audioPresent true y fullDecode PASS. No es demo de calidad cinematográfica y no implica creatividad aceptada.

**Riesgo pendiente**: picos medidos 0,0 dB en salida de QA con FX y en baseline. Pendiente margen True Peak/masterización y escucha humana. Los 309 recursos antiguos siguen indexados, no importados; los 13 SFX existentes siguen preservados. Versión realmente publicada antes de este bloque `a5430f21b7d44c0e814a621e36d8f30eefd4ab38`. Próximo hito: preflight backup y despliegue seguro si corresponde, luego importar B-roll comprado y ensayo en app pública. No cambiar porcentaje F6/F9/V1 sin roadmap.

---

## Despliegue real de biblioteca audiovisual · 21/10/2026

**Producción VERIFICADA, actualización posterior a los bloques de desarrollo que figuran debajo.** Código actualmente instalado en Hostinger srv1841004: commit `a5430f21b7d44c0e814a621e36d8f30eefd4ab38`, procedente de rama `feat/library-video-assets-20261021` sin merge a rama oficial. HTTPS 200; contenedor activo; 13 SFX preservados; inventario privado 17 registros (13 SFX + 4 motions) y 309 referencias remotas; Whisper ASR activo.

Pruebas previas: 263/264 suite en contenedor sin Git, caso Git pasa 2/2 en VPS, `node scripts/check.mjs` PASS. MP4 QA aislado real (vídeo de entrada 12.98s con audio, clip sintético B-roll 5–8s, salida 1080x1920 30fps con 4 subtítulos y voz original, fullDecode PASS). Código fuente y pruebas del compositor reproducibles en esta rama.

**Rollback/backup**: primer intento se anuló automáticamente al cambiar el heartbeat `editor/jobs/uploads/asr/worker.json` de Whisper durante la copia. Contenedor antiguo se recuperó y HTTPS volvió a 200. Tras comprobar que ASR no tenía tareas activas, se pausó temporalmente `sues-editor-whisper.service`; segundo despliegue aprobó copia integral de 352 archivos, SHA256 `ebace3c0a00848d488227403a11e705b611e8b226ffd57261ed9290fa43bf92f`, respaldo `/opt/sues-video-setup/update-backup-20261021-201257-53492`. Servicio Whisper reiniciado y confirmado activo. Contenedor anterior conservado. Backup verificado del estado NO significa que todos los recursos externos de Drive estén copiados.

**Límite pendiente**: no se importó todavía en producción el paquete `Shape 08.mp4`: el intento de automatizar el alta por API privada fue bloqueado por los controles de conexión y no se intentó saltarlos. La funcionalidad de alta está desplegada para usuarios autenticados, pero la biblioteca de 309 archivos comprados continúa como catálogo remoto/indexado. El vídeo QA es sintético, no uno de los archivos comprados. No dar por terminada calidad cinematográfica de V1, F6/F9 abiertas, porcentajes sin cambio.

**Siguiente acción**: usar el panel web autenticado/Work para importar unos pocos recursos reales autorizados, clasificar en castellano y probar un MP4 con B-roll comprado+voz+subtítulos+SFX. Después overlays por capas, efectos de voz y selección semántica IA. Coste de servicios y suscripciones nuevos: cero.

---

## Biblioteca: Gemini puede insertar B-roll en un MP4 de QA · 21/10/2026

**Rama de trabajo**: `feat/library-video-assets-20261021` basada en producción `73d673b`; **NO mergeada NI desplegada**. El cambio previo de importación de recursos ahora conecta un tipo nuevo `videoEvents` con el compositor `selectedMedia` existente. Gemini puede incluir `{type:"broll",resourceId:"<sha256>",start:5,end:8,reason:"..."}`; la revisión comprueba ID contra biblioteca privada y reglas de estilo. Se conserva la voz original y los subtítulos al montar el plano completo; hasta tres clips, máximo 40% de metraje, proteger apertura/cierre, validación de duraciones y separación. No se infiere que los recursos sean visualmente pertinentes ni que haya selección LLM autónoma.

**Evidencia MP4**: fuente real con audio del propio editor, 12.979956 s; B-roll SINTÉTICO de QA insertado 5–8 s, duración fuente 4.2s, SHA256 `fa3e5b064fc4909a5e9af38214ecfe524a276b669f3539be61bcbc02222a988a`; exportado `/opt/sues-video-setup/library-qa/20261021/broll-real-export-test.mp4` (solo prueba interna). MP4 H.264 1080x1920 30fps, duración 12.966667 s, audio presente, 4 grupos de subtítulos, vídeo original preservado, decodificación completa PASS, SHA256 de salida `5b02d01735fec1d0e43e2f8df493d938776c6ae1c86afb9f20f079c375e3c533`. El vídeo sintético NO demuestra calidad cinematográfica ni sustituye la Fase 9.

**Pruebas**: cuatro nuevos casos `tests/manual-broll-integration.test.js` PASS (límites B-roll, plan Gemini→línea de tiempo, backup portable y REST autenticado/versionado). Regresión global en contenedor QA: 263/264 PASS, fallo único de Git ausente dentro de contenedor; test específico en VPS anfitrión 2/2 PASS. `node scripts/check.mjs` y `git diff --check` OK. No efectos en producción, no gastos. Copias de seguridad existentes de metadatos preservadas. `docs/SUES_LIBRARY_VIDEO_INTAKE_20261021.md` contiene procedimiento y limitaciones.

**Próximo hito**: incorporar un B-roll REAL comprado mediante copia autorizada, confirmar frame/safe zones y mezcla con voz/SFX en exportación, diseñar overlays avanzados sobre sujeto sin invadir cara; verificar copia completa y rollback, después fusionar y desplegar. 309 ficheros de Drive siguen indexados sin copia masiva; 13 SFX actuales intactos. F6/F9/V1 abiertas y porcentajes sin modificación.

---

## Biblioteca privada · video y overlays · candidato no desplegado · 21/10/2026

Rama GitHub `feat/library-video-assets-20261021`, primer commit remoto `8bd46d8ece5611c049371231c43c540a0add547b`, árbol `a03cfec89beea5dbf0f2bfb2bbee38e0417423fc`. Base inalterada `73d673bf7c67079ee6900916f2e0f12841cf5ab7` = producción previa confirmada; ESTA RAMA NO ESTÁ DESPLEGADA.

Se amplía, sin sustituir, `src/media-library.js` a `video` y `overlay` privados MP4/MOV, 0,2–90 segundos, 40 MiB/archivo, códecs permitidos y FFprobe sin URLs externas, límite de cantidad anterior conservado. Continúan hash, almacenamiento seguro, autentificación/rangos y metadatos V2 sin aprobar automáticamente. Se habilita la previsualización/ingesta en UI con aviso «pendiente de incorporar al montaje». No existen todavía nuevas operaciones de vídeo en planes externos ni inserción desde biblioteca en render.

Evidencias reales: `Shape 08.mp4` de cuenta Terapias, 173536 bytes y SHA256 `dc1b3f104c1a6292fcf7aba6a5c958c931a14e0e3eb1e7e35ab3ef255c9d31fb` se probó localmente, 1920×1080/24fps/1,125s; lleva pista de código de tiempo `tmcd` y fue permitida mediante regla específica. No hay importación de esa muestra a producción. 13 SFX antiguos y cuatro motions intactos; catálogo VPS privado `official-library-v1.json` (17 recursos operativos y 309 archivos externos referenciados por colecciones).

Pruebas: 8/8 focalizadas PASS; test completo 259/260 en contenedor aislado con RAM temporal suficiente. El único fallo corresponde a prueba de Git `safe.directory`, ya que la imagen de test carece de Git; esa prueba y la de despliegue pasan 2/2 en host VPS, con `node scripts/check.mjs` PASS. Total de 260 casos acreditados entre entornos, NO afirmar 260/260 en un único contenedor. Sin despliegue, modificación de trabajos, compra, IA externa ni nuevas suscripciones. Backup previo de metadatos: `/opt/sues-video-setup/library-backups/20261021-2028/asset-records-and-v2-metadata.tar` SHA256 `9a432b353237a6d14fd24e9f52eb5beac3985401f05667e96495a2ba86703b90`; no es backup integral de medios.

Documentación: `docs/SUES_LIBRARY_VIDEO_INTAKE_20261021.md`. Google Drive índice maestro: https://docs.google.com/document/d/1EFK4TtTmi3ToWKfl5qGQC7TvEmCL4zIWuR0apdRotAA/edit . Enlaces a 309 piezas compradas/documentadas, pero todavía no todas accesibles en motor.

Siguiente acción exacta: vincular clips `video` del catálogo al contrato de `selectedMedia` (B-roll que el renderer YA sabe componer cuando existe vínculo verificado), añadir tiempos/selección compatibles con seguridad y F9, recuperar pequeños lotes vía transferencia autorizada, probar una voz real + B-roll + subtítulos + SFX en MP4, respaldar/deplegar solo tras aceptación técnica completa. F6/F9/V1 continúan abiertas; NO se actualiza porcentaje.

---

## Flujo desplegado y dos comparativas reales · 21/10/2026

Instalado 086a9aae75af01c7919774aaaab0fb00d1c3ec8e (árbol e21feaf79129888aebf1b245aff1403b6d45c7ae).
Despliegue SUCCESS, HTTPS200/API401, Whisper activo,285 archivos previos sin bajas;
sólo cambia heartbeat. Backup verificado update-backup-20261021-123230-36270,
SHA256 707081336a85e328757280ba8f579a6cb70cfa18b328c13e80f7352c9cd98f23.
Se conservan6trabajos/13SFX y se añaden2versiones por encargo para comparar.
13fichas V2 creadas sin alterar medios ni registros anteriores; repetición idempotente,
ninguna aprobación ni alias asignado.14aliases siguen unavailable.

CALMA9c42517b y DINÁMICA6bb280d8: mismo bruto38.31s, DONE, voz/padre intactos,
H2641080x1920/30,fullDecode pass y descarga idéntica. Recuentos, hashes audiovisuales,
medidas y límites en docs/SUES_REAL_COMPARISON_20261021.md. Loudness -28.07LUFS
ambas: FUERA de banda orientativa, sin normalización ni aceptación humana inventada.
Referencia Keanu medida -22.12LUFS/-2.83dBTP. QA de mono no sustituye escucha.

Esta iteración corrige3líneas de UI: cambio de plantilla/sonido o activación de receta
marca cambios pendientes en DONE y exige revisión antes de generar. Prueba Chromium
con backend real y app.js candidato interceptado: escritorio/móvil PASS, sin crear
otro trabajo, guardar ajustes o registrar aceptación. El primer arnés asumía que
un DONE sin cambios debía habilitar render; se corrigió esa expectativa. Caso real
cambio de estilo reproducido y corregido. También se esperó visibilidad del editor
para evitar carrera de inicialización; no se alteró estado cliente para simular éxito.
Check PASS;257tests de la base. Script de regresión smoke_completed_job.mjs y
auditoría de audio medidos con tono, silencio y referencia real. Esta entrada aún
no afirma desplegada la corrección UI; registrar release/backup y QA sin override.
F6/F9/V1 abiertas. Sin costes externos, dependencias nuevas o cambios de otras apps.

---
## Candidato de flujo dinámico y base de recursos V2 · 21/10/2026

Retomado tras el corte de cuota. Leídos completos los tres documentos V2 de Drive;
fuentes y alcance en docs/SUES_DYNAMIC_FLOW_AND_RESOURCE_V2.md. Especificación
copiada como diseño, sin presentar máscaras, stems ni Director LLM como instalados.

Incluye Editar vídeo con dos rutas, plantilla antes del análisis, revisión obligatoria
antes de generar y comparación CALMA/DINÁMICA por versiones. Receta local opt-in,
recuento de elementos y evidencia del Keanu de 64.2 s con límites de observación.
No se sustituye la voz ni se corta metraje. DINÁMICA permanece experimental.

Base V2 en banco existente: esquema Ajv2020, metadatos laterales atómicos, catálogo
privado sin rutas/pruebas y resolver de 14 alias inicialmente ausentes; ningún alias
mapeado o recurso aprobado automáticamente. Inventario idempotente sin alterar
registros o medios anteriores; selección manual previa conservada.

257 tests PASS y check PASS. Cuatro MP4 sintéticos previos en escritorio/móvil,
decodificación/descarga/original/padre correctos; QA de invalidación de revisión en
ambas pantallas. Pruebas V2 de identidad, derechos, capacidades, duplicados,
persistencia y acceso HTTP. La aceptación creativa y F6/F9/V1 siguen abiertas.

Estado de esta entrada: candidato probado, aún no afirma despliegue. Servicio
instalado anterior d30023f. Tras desplegar, registrar SHA, backup y comprobación real.
Sin nuevas dependencias, APIs de pago ni cambios de WAC/DNS/Caddy.

---
## Motions externos desplegados y verificados · 21/10/2026

Instalado d30023f664aef3ad483fac89913a132be2925013, árbol
d7d638344dd4e8fc9917e37682f18029519f9f7b; anterior e80c2e5.
Publicación autorizada expresamente por Carlos. Conector GitHub utilizado tras
git push sin credenciales locales; árbol publicado idéntico al candidato probado.
Rama feat/external-motions-20261021 conservada y oficial actualizada con lease
desde15fcfe83, sin force. 254tests/check y dos MP4 Chromium previos corresponden
a este árbol; no se repiten renders de prueba innecesarios.

systemd sues-editor-update-20261021-082649-a2a92d7f y supervisor
sues-native-motions-deploy-20261021-d30023f: SUCCESS/exitCode0/Resultsuccess.
Whisper detenido durante copia y reiniciado activo. Backup completo verificado:
 /opt/sues-video-setup/update-backup-20261021-082652-34073/editor-state.tar
SHA256302625bcffeac10287f95a1e32de1d085a7696da5d3dbaf5593f01159484449c.
Contenedor anterior retenido para rollback de código+estado del mismo backup;
guardar primero cualquier trabajo posterior. No reversión real necesaria.

HTTPS200/API401 sin sesión, contenedor running/OOMfalse y cinco archivos de
código/tests/QA SHA idénticos al candidato probado. Catálogos reales incluyen
cuatro motions; revisión privada de cada uno aprobada sobre un proyecto existente
y bloqueo de Whisper solo comprobado. Operaciones de revisión únicamente: sin
nuevo render personal, borrador ni versión creados. Se conservan6trabajos y13SFX.
285archivos previos comprobados:0bajas/284idénticos; sólo cambia heartbeat
jobs/uploads/asr/worker.json. Backup verificado también contraSHA del TAR.
Resultado privado motions-production-qa.json; log background-update/
20261021-082649-a2a92d7f/run.log. No nuevo QA visual de navegador de producción;
navegador y MP4 reales del candidato constan abajo.

El bloqueo de autorización está resuelto y el cambio está desplegado. Siguiente:
adaptar recursos CreatorClub y completar análisis espacial para vídeos nuevos;
director LLM propio, cuerpo general y F6/F9/V1 siguen abiertos. Sin porcentajes
nuevos, costes externos ni cambios de otras aplicaciones.

---
## Publicación y despliegue autorizados · 21/10/2026

Carlos responde «Autorizo» a subir este candidato a GitHub y desplegarlo con
copia de seguridad. El bloqueo de autorización del registro anterior queda
resuelto. Aún no acredita despliegue; comprobar resultado del actualizador y QA.

---
## Cuatro motions nativos por plan externo · candidato probado · 21/10/2026

Rama local feat/external-motions-20261021; código43bcba0 y ajuste de fixture861041b,
basados en oficial15fcfe83. No publicados ni fusionados; producción siguee80c2e5.
Nueva acción motion para QUOTE_CARD_01, NUMBER_BADGE_GOLD_01, STRIKE_TEXT_01 y
DIVIDER_LINE_01. Son renderizadores SUES existentes, no cuatro MOGRT convertidos.
Catálogo con IDs/condiciones y disponibilidad; tiempo/texto por caption, incluidas
correcciones del mismo plan. Requiere análisis facial; Whisper solo bloqueado.
Conflictos, límite3citas/5elecciones, números1–99, apertura/cierre, geometría,
duplicados, comandos que ocultan efectos y revisión obsoleta rechazan el conjunto.
Se mantienen controles/deshacer/historial y versión anterior, sin nuevos modelos.

254pruebas Node y npm run check PASS. Dos MP4 completos24s mediante navegador
Chromium151:1440x1000/393x852. Cuatro motions, imagen/música realmente subidas,
destello17.27s, texto corregido, borrador recuperado, revisión invalidada al cambiar
texto, versión nueva, descarga idéntica, fullDecode, fuente/padre intactos,
controles manuales reconocen3elecciones+1cita ysin overflow/erroresJS.
Vídeo generado/tono y análisis facial de fixture: QA técnica, no nueva inferencia
ni aprobación creativa. Montserrat real conservada. Cuatro fotogramas revisados.
MP4 escritorio16174558bytes/SHA256b5d8fbe622aa5f6d1b20a2a88a7f44560b6100255baa8144f180ec78b41cb3f8;
móvil16174547bytes/SHA2569e143e31909dcb6b43c894d6d3918ba8eb6c5a12e378e94f83d2996372c3e366.
Evidencia examples/preview/external-motions.chromium-result.json; guía
 docs/SUES_EXTERNAL_MOTIONS.md; script smoke_external_motions.mjs.

QA aislada en /opt/sues-video-setup/external-motions-work-20261021 y resultados
external-motions-qa-20261021. Librerías Chrome sólo en contenedor desechable;
no host/app. Primer arranque no leyó herramientas por permisos; segundo sin
librerías; tercer ensayo detectó5captions en fixture que esperaba4: acortada
frase de prueba conforme al envoltorio existente y repetidos ambos dispositivos
correctamente. Esos intentos fallidos no cuentan comoPASS. No deps nuevas de app.

Bloqueo real: revisión automática rechazó git push por requerir autorización
explícita de publicación. Segundo intento también rechazado tras comprobar URL
origin idéntica al repo indicado y permiso admin mediante conector. No se usa
otra vía para publicar/desplegar. Cambios y pruebas conservados; próxima acción:
obtener autorización explícita para subir este candidato y desplegarlo con backup,
después publicación/integración/release fija y QA privada de producción.
No se ha reiniciado producción ni realizado backup nuevo de despliegue, porque
no se ha desplegado. Sin costes externos ni cambios de otras aplicaciones.
Adaptación Creator Club, director LLM propio, cuerpo general y F6/F9/V1 abiertos.
Sin nuevos porcentajes ni necesidad de prueba audiovisual deCarlos en este bloque.

---
## Banco SFX desplegado y verificado · 21/10/2026

Código instalado e80c2e5ce10f7d27b72586ae1a9f375601392c95, árbol
0a68585897350acf2c3c797db49efb7394d9d443; anterior 9febcdfbf2d9f641a455af958a7d1970d47298b5.
Oficial actualizada mediante lease desde f70a144, sin force.
El commit integrado conserva el padre y permite revisión/reversión.

Despliegue systemd sues-editor-update-20261021-064234-b82d11e4: SUCCESS/exitCode0,
Result=success/ExecMainStatus0. Supervisor sues-sfx-deploy-20261021-e80c2e5 también
SUCCESS/0; lock exclusivo, independiente de la terminal. Launcher/updater fijados
y SHA256 comprobados. Whisper pausado durante backup y reiniciado activo.
Backup completo: /opt/sues-video-setup/update-backup-20261021-064236-30014/editor-state.tar
SHA256 b7ee8653725a075bb90cde950e34f5e409e5d7e02013fe99afb82a66d7c81fea.
Anterior contenedor retenido: sues-video-editor-before-update-20261021-064236-30014.
Rollback requiere código+estado del mismo backup, guardando primero trabajo
posterior. No ha sido necesario ejecutar rollback real.

13 sonidos importados por API HTTPS privada;3 cámara / 7 teclado / 2 whoosh / 1 riser.
Originales y normalizados privados con hashes/procedencia fuera deGit. Conversión
48kHz/estéreo/PCM16, sin amplificación ni padding. Procedencia declarada de material
CreatorClub existente; no licencia individual auditada. No música de práctica ni
MOGRT/CapCut importados. Copia adicional del banco26 archivos comprobados:
/opt/sues-video-setup/sfx-private-20261021/bank-assets.tar
SHA256 f4e817fca77b0dfb3f81fabfe82d10c4302ad203c2e6f211a6f057dd23944bfd.

252 pruebas Node tests y check PASS; renderer Python compila. Tres MP4 generados de 24 s con
FFmpeg/decodificación completa (uno de mezcla música+procedurales+SFX, otros dos
por navegador móvil/escritorio). Colocación por muestras, ganancia, atenuación bajo
voz, restauración portable sin biblioteca y alteración de hashes comprobadas.
Chromium151.0.7922.34: móvil 393×852 / escritorio 1440×1000, recurso ausente / operación
incompatible / revisión caducada bloqueados, añadir/quitar/escuchar SFX, ejecución de plan,
descarga idéntica al MP4, padre y original intactos y sin desbordamiento horizontal ni errores JS.

Producción: contenedor running/OOMfalse, HTTPS200;13 audios Range206 y401 sin sesión;
catálogo real con 13 SFX y revisión readonly de whoosh a 2.125 s aprobada sobre proyecto
existente, sin ejecutar ni crear otro trabajo. Navegador sobre HTTPS real en móvil
y escritorio: sesión privada tras recargar, proyecto existente abierto,13 metadatos
de audio decodificados y reproducción de audición avanza. Elegir/escuchar no ensucia
vista previa. Pruebas de render con vídeo generado/análisis fixture; no nuevo render
del vídeo personal ni aceptación sonora humana. Se preservan 6 trabajos y 259 archivos:
0 bajas / 258 idénticos, único cambio esperado jobs/uploads/asr/worker.json (heartbeat).
Resultados privados: sfx-private-20261021/{import-result.json,production-browser/result.json,
browser/result.json}; log completo background-update/20261021-064234-b82d11e4/run.log.
Herramientas de navegador confinadas a QA temporal, sin dependencias nuevas en app.
Sin llamadas IA de pago, cambios de Caddy/DNS/WhatsApp/WAC ni otros servicios.

Siguiente: selección/escucha humana del banco y adaptar 3–5 motions compatibles;
MOGRT requiere adaptación, no carga directa. Director LLM propio, profundidad
corporal general y F6/F9/V1 siguen abiertos. Ver docs/SUES_CUSTOM_SFX.md.

---
## Registro previo a despliegue · SFX probados · 21/10/2026

Nueva biblioteca kind=sfx (0,03–30 s), cues por segundo y ganancia individual,
selección/escucha en UI y operaciones sfx en planes externos. Música conserva
sus límites. No activa los efectos procedurales al importar sonidos explícitos.
Máximo40cues/3simultáneos; sin truncado implícito ni rutas/URLs del plan.
Fingerprint, renderer y backup portable incluyen recursos y hashes; restauración
sin biblioteca probada. Sidechain usa la mezcla existente y limitador sin auto gain.

252tests Node PASS/0skip; npm run check PASS; Python compila. FFmpeg real comprueba
colocación por muestras, ducking bajo voz, mezcla con música y SFX procedurales,
muestras finitas, limitador y conservación fuera de cues. MP4 generado24s/fullDecode,
sourcePreserved, dos cues/una entrada: SHA256
520667df1c3ec91d122af588bf5b2b6572ec80077484d7618fd6055f32b3700e.
Chromium151.0.7922.34 en contenedor QA temporal del VPS, móvil393x852/escritorio1440x1000:
subida/escucha/SFXRange206, añadir/quitar, plan externo/recursoausente/operación
incompatible, revisión invalidada al cambiar texto, MP4 real/descarga igual,
original/versión padre intactos, sin overflow ni errores JS. Vídeo generado y
análisis fixture; no aceptación creativa ni Director LLM. Las dependencias de
navegador sólo se instalaron en el contenedor QA desechable, no en el editor/host.

13originales únicos transferidos al VPS y verificados contra hashes del inventario;
normalizados48kHz/estéreo/PCM16 sin amplificar ni alargar. Privados fuera deGit.
Tres sonidos cámara, siete teclado, dos whoosh y un riser. Procedencia CreatorClub
de material existente; declaración de licencia, no auditoría jurídica individual.
La música de práctica y MOGRT/CapCut no se importan. Despliegue/importación y
verificaciónHTTPS/integridad pendientes en este commit; instalado anterior9febcdf.
Ver docs/SUES_CUSTOM_SFX.md. F6/F9/V1 continúan abiertas.

---
## Banco de recursos · inventario real y plan · 20/10/2026

Acceso Google aCreatorClub completado yverificado;curso71contenidos. Descargas
4packsPremiere/AfterEffects+3CapCutPC localizadas:69MOGRT,1prfpset,75archivos fuentes.
14archivosSFX descargados/FFprobe/hash:13únicos,duplicado de disparo decámara.
Duraciones0.056188–6.2955s. MuestraMOGRT inspeccionada sin ejecutar:contiene
composiciónAdobe+miniaturas. No se han integrado ni convertido estos presets.
Pistaambiental propia46s/48k/estéreo/PCM16 verificada. WebAPIassets=[];
Drive imágenes/motions/final vacías.13referencias,28pruebas y24archivos de trabajo
localizados, no contados como banco limpio. Inventario privado con enlaces guardado
como SUES_BANCO_RECURSOS_INVENTARIO_Y_PLAN.md. No enlaces privados/medios enGit.

Plan:sfx únicos primero→tipoSFX e inserción temporal/ganancia→3–5motions adaptados→
transiciones/overlays ycolocación segura→catálogoGemini→vídeo real para revisión.
Biblioteca actualaudio>=3s esparamúsica:no sirvepara lamayoría deSFX cortos.
ArchivosMOGRT/CapCut necesitanadaptación; tenerlos no implementael efecto.
Auditoría inicial7packs,no todo contenido71clases;licencias/dependencias yselección
sonora pendientes. No nuevos costes,instalaciones ni cambiosVPS/código/despliegue.
Instalado sigue9febcdf;F6/F9/V1abiertas. Ver docs/SUES_RESOURCE_BANK_PLAN.md.

---
## Planes externos desplegados · 20/10/2026

Instalado 9febcdfbf2d9f641a455af958a7d1970d47298b5, árbol
8390f6296c0b5e2126d223e73148df56270de7ce; anterior a75c76f.
Integrado en oficial con lease desde c99f4185, sin force; rama
feat/external-edit-plan-20261020 conserva la implementación probada.
systemd sues-editor-update-20261020-201352-fd680eb5: SUCCESS/exitCode0,
Result=success/ExecMainStatus0; supervisor sues-external-plan-deploy-20261020-9febcdf-retry
SUCCESS/0. Worker Whisper detenido durante copia, reiniciado activo.
Un primer guard detectó como pendiente una solicitud ASR ya COMPLETE y abortó
antes de actualizar; corregido para reconocer terminales sin borrar solicitudes.

Backup verificado /opt/sues-video-setup/update-backup-20261020-201355-26377/editor-state.tar,
SHA256 aba378266bb25a34f829440787f5b49317f7ee93aef1267b2c1f71526850555c;
contenedor anterior sues-video-editor-before-update-20261020-201355-26377 retenido.
Rollback conserva código+estado del mismo backup; guardar primero cualquier
trabajo posterior. No se ha necesitado ejecutar una reversión real.
HTTPS200/API privada401 sin sesión. Revisiones reales por API HTTPS compilan
destello2.27s y bloquean recurso ausente/capacidad no soportada; sólo lectura,
sin otro render de producción ni nueva prueba de login visual nativo Work.
4 recursos web y7 archivos instalados SHA idénticos al código probado.
6trabajos originales intactos;259archivos anteriores comprobados,258idénticos,
único cambio esperado heartbeat;ninguna baja. Contenedor running/OOMfalse.
247Node/check PASS,Chromium145 móvil/escritorio con MP4 real24s,imagen/audio
generados subidos porHTTP,análisis facial sintético,descarga/hash/fullDecode,
borrador recuperado y conservación del padre PASS. Sin API/costes nuevos.
Pruebas creativas con banco definitivo pendientes; no cierre de F6/F9/V1.
No cambios WAC/WhatsApp/Caddy/DNS ni otras aplicaciones.
Evidencias external-plan.vps-result.json y external-plan.chromium-result.json;
contrato y límites docs/SUES_EXTERNAL_EDIT_PLAN.md.

---
## Importación de planes externos · 20/10/2026 · probado localmente

Implementado pegar plan JSON SUES de Gemini/otra IA→comprobar→ejecutar en otra
versión. Catálogo por vídeo con SHA, recursos reales, captions y límites;
ninguna llamada de IA/API. Destello cálido por segundo exacto, imágenes con
análisis facial preparado, música de biblioteca, corrección de captions y
comandos globales soportados. Revisión compila todo; faltante/capacidad no
soportada/invalidez se distinguen y bloquean el conjunto, sin omisión silenciosa.
Hash de revisión evita aplicar un plan obsoleto; requestId idempotente; historial,
originales y versión anterior preservados. Borrador privado recuperable al
recargar, incluso con recursos pendientes. No interpreta prosa libre.
247 Node/check PASS; Chromium145 escritorio/móvil con MP4 real generado24s,
destello15.27s, imagen/audio subidos, corrección, borrador recuperado,
descarga idéntica/fullDecode/sin overflow PASS. Análisis facial de QA sintético.
QA técnica; banco definitivo y valoración creativa pendientes. Whisper solo
no proporciona colocación facial de imágenes. Más límites/contrato en
docs/SUES_EXTERNAL_EDIT_PLAN.md. Despliegue acreditado en el registro superior.

---
## Whisper local desplegado y vídeo nuevo exportado · 20/10/2026

Instalado a75c76f6612e7720724b39c90a40525555e17a14, árbol
3113d266cf11b3c86cb35e40c0b86631b0c54cf0; anterior2f44a708.
Integrado sin force mediante lease desde0f04ab2; implementación4fefef5 y
corrección a75c76f. systemd sues-editor-update-20261020-192045-394d190b y
supervisor sues-whisper-editor-deploy-20261020:SUCCESS/exitCode0/Resultsuccess.
Backup verificado /opt/sues-video-setup/update-backup-20261020-192047-25550,
TAR SHA2566a9b7858c2a57e5df792e9079b51746c1d8131967565684da99348cf956f0bc5;
contenedor anterior conservado. Worker detenido durante copia, reiniciado activo.

Whisper real CPU/base/int8 sin API:vídeo nuevo12.979956s,español11palabras.
Perfil validado por HTTPS y render de producción f91ce48c-768e-4b1e-acfb-7ad5189d5393:
DONE/1intento,DOPAMIN,5grupos,11/11palabras,0cortes/zoom/motions/transiciones;
plano horizontal íntegro dentro de lienzo vertical,voz original. MP4 H264/AAC
3902956bytes,SHA25610c90bef98f574c9830cd12c88fc1e8ce77d84711f9dd061c7b6cfd006eb1158,
vídeo12.966667s(tolerancia1frame),audio conservado,fullDecodePASS. HTTP200/Range206,
descarga idéntica. Fuente intacta;5trabajos anteriores y sus archivos idénticos.
225archivos previos comprobados:223idénticos;únicos cambios previstos son metadata
del nuevo upload(perfil/plantilla) y heartbeat. Ninguna baja. Prompt original intacto.

245Node/check/diff--check PASS. Chromium145 real móvil/escritorio,8s imagen+8.05s
audio,MP4/play/descarga/fullDecode/reanudación/nombre/plantilla/prompt PASS; ASR del
smoke sustituido, inferencia real separada en VPS. Recurso web4/4 SHA idéntico.
Prueba real de producción es HTTP/FFmpeg,no un clic visual Work;protección de
credenciales nativa sigue vigente. Error real inicial de duración corregido con
último fotograma hasta fin de voz,sin relajar validación;primeros intentos fallidos
están documentados. No afirmar transcripción perfecta ni aceptación audiovisual.

Servicio sues-editor-whisper persistente systemd:uid1000/capacidades0,CPU50%,
768MiB máximo,modelo fijado+hash,red bloqueada,fuentes/modelo RO,sólo mailbox RW.
Autorización explícita de Carlos registrada en AGENTS. ASR es nuevo; director libre,
cortes semánticos,seguimiento facial y efectos del prompt siguen pendientes.
Los encargos no compatibles no se aplican; acción básica explícita y registrada.
Sin costes/API/otros servicios ni cambios WAC/WhatsApp/Caddy/DNS. F6/F9/V1 abiertas.
Informe docs/SUES_LOCAL_WHISPER_20261020.md;evidencia whisper.vps-result.json y
whisper-ui.chromium-result.json. Mis proyectos:«Prueba de tu vídeo · Whisper local».

---
## Whisper local autorizado · validación previa20/10/2026

Instalado ASR aislado faster-whisper1.2.1/base/int8 en VPS. Fuente nueva real
12.98s→11palabras es/COMPLETE;sin API.245tests/check y Chromium móvil/escritorio
con mailbox sustituido+MP4 real/descarga/hash PASS. Nuevo flujo guarda plantilla/
nombre,prompt y reanuda análisis;modo plano completo sin inventar caras. No LLM.
Código aún sin desplegar;instalado editor sigue2f44a708. Backup218archivos
verificado antes de instalación. Detalle docs/SUES_LOCAL_WHISPER_20261020.md.

---
## Subir → confirmación verde → enviar prompt · desplegado20/10/2026

Instalado2f44a708a88ce8ced0d698ce3a2c1448f4c717dd, árbol
8d2454afafeadbc4e7bdccbeed93c524d21145f1. Anteriora55e57d(primera corrección
ya instalada). systemd sues-editor-update-20261020-183710-a533b295:SUCCESS,
exitCode0,Resultsuccess/status0. HTTPS200, API401 sin sesión/200 privada;
4 recursos públicos y6 archivos instalados con SHA idénticos al código probado.
215 archivos persistentes anteriores intactos,5 trabajos,cola0/0/0.
Backup verificado /opt/sues-video-setup/update-backup-20261020-183713-23841,
TAR SHA256108ffdcd2445e2252181eebc99fef5bd9dc68e412665625b4a54cc8c86c4cc8e;
contenedor anterior conservado para rollback. No cambios de otras aplicaciones.

Nuevo proyecto empieza por Subir vídeo,selector/subida directa y barra/mensaje
verde únicamente tras201 validado. Después prompt/Enviar prompt y,tras propuesta,
herramientas/generación. También guarda el encargo privado de vídeos sin análisis:
proyecto pendiente en dashboard,recarga y reapertura sin perderlo. No presenta
el guardado como análisis/edición ejecutados. El análisis nuevo sigue pendiente.
244 Node/check PASS local. Chromium145 real móvil/escritorio con HTTP/FFprobe,
fallo/reintento,201 demorado,verde,orden,guardado y recarga PASS. Este ensayo sólo
encola la generación,no ejecuta renderer. No nuevo login visual Work,que sigue
limitado por protección de credenciales. Sin modelos,dependencias o costes nuevos.
Informe docs/SUES_UPLOAD_FIRST_20261020.md;evidencias upload-first.*.json.

---
## Prompt guardado también para vídeos pendientes de análisis · 20/10/2026

Primera corrección de orden instaladaa55e57d(systemd SUCCESS/0); ampliación local:
Enviar prompt guarda también encargos de fuentes sin análisis, privados y ligados
al hash del upload. Aparecen en dashboard y se recuperan al recargar/reabrir.
No genera, analiza ni promete haber ejecutado el encargo. API acotada4000chars,
requiere sesión/CSRF; vídeo original intacto.244 Node+check PASS; Chromium145
móvil/escritorio con subida real/FFprobe, verde tras201, envío, guardado y
recuperación del pendiente PASS. Renderer no ejecutado en este ensayo.
Ampliación pendiente de instalar; no cambios de dependencias/motor/costes.
Informe docs/SUES_UPLOAD_FIRST_20261020.md.

---
## Corrección: subir primero, prompt después · 20/10/2026 · validada localmente

Nuevo proyecto abre con Subir vídeo como primera acción. Selector+subida en un
solo recorrido, progreso real y verde/Subida completada únicamente tras201 del
servidor. Después aparece prompt/Enviar prompt; herramientas y generación sólo
tras una propuesta compatible. Errores no se muestran como éxito. Material sin
análisis guardado se explica y no puede enviar todavía. No cambia motor/deps.
243 Node/check PASS. Chromium145 real móvil/escritorio:archivo inválido/reintento,
HTTP+FFprobe,progreso/201 retrasado,verde,orden,recarga y fuente desconocida PASS.
Ensayo no ejecuta renderer:solicitud sólo QUEUED con ajustes correctos.
Informe docs/SUES_UPLOAD_FIRST_20261020.md; JSON upload-first.chromium-result.json.
Integración/despliegue pendientes; último instalado240632a.

---
## Dashboard y director desplegados y verificados · 20/10/2026

Instalado240632a7d969919ce402e072da8297fd1c5a7299, árbol
41636d976d65582525da121862abfe6ee973ebe2. Anterior9d8d077. Integración oficial
con lease desde8c89b500,sin force. systemd
sues-editor-update-20261020-160252-78817089:SUCCESS/exitCode0,Resultsuccess/status0.
HTTPS200, API401 sin sesión/200 privada, propuesta de instrucciones de sólo
lectura y JPEG real privados PASS.214 archivos persistentes previos idénticos
por SHA;5 trabajos conservados;cola0/0/0. Backup verificado:
/opt/sues-video-setup/update-backup-20261020-160254-22885, TAR SHA256
b78a283069e50a8a3bc6babbff2ff02f0ad641665b8e80f30eb19b220d1d7502;
contenedor anterior conservado para rollback. Sin cambios de otras aplicaciones.

243 tests Node/check PASS local. Chromium145 móvil/escritorio: tres renders
sintéticos8s,reproducción,descarga idéntica al preview,fuente intacta,proyectos/
versiones,prompts y persistencia. Layout final separado con fixture y poster real,
no otro render. Nueva UI oscura/cian con proyectos,instrucciones y herramientas
contextuales. Director local de ajustes explícitos; no LLM libre/cortes por
significado ni nuevo ASR. Peticiones desconocidas se rechazan enteras. Work nativo
no se pudo reabrir por protección de credenciales; no afirmar login visual VPS
nuevo. Carlos sí confirma descarga real móvil anterior. Aceptación estética de
esta UI y F6/F9/V1 abiertas. Sin créditos,dependencias nuevas ni costes.
Informe docs/SUES_PROJECT_DIRECTOR_UI_20261020.md y tres JSON project-director.*.

---
## Dashboard y director por instrucciones · 20/10/2026 · probado localmente

Nuevo recorrido sobre el editor existente: inicio/Nuevo proyecto, nombre y
plantilla, instrucciones opcionales, generación/revisión/exportación, historial
de versiones dentro del proyecto. Originales antiguos agrupados sin reescribir.
Interfaz oscura/cian, panel contextual y vídeo visible en móvil/escritorio.
Instrucciones locales explícitas aplican ajustes reales; las desconocidas se
rechazan completas. No LLM general, cortes semánticos ni análisis nuevo activado.
No gastos ni nuevas dependencias. Detalles y límites:
docs/SUES_PROJECT_DIRECTOR_UI_20261020.md.

243 tests Node, check y diff --check PASS. Chromium145 real móvil/escritorio,
tres renders FFmpeg sintéticos8s, play, descarga por botón SHA igual al preview,
fuente intacta, persistencia, historial, búsqueda y combinación manual/prompt
(escritorio). Layout final validado aparte con fixture, no otro render. Carlos
confirma descarga móvil de su vídeo real en la versión anterior. Work nativo
sigue limitado por protección de credenciales; no afirmar nuevo login visual.
Integración/despliegue de esta UI pendientes al escribir esta entrada.

---
## Work autenticado, render real desbloqueado y desplegado · 20/10/2026

Código instalado9d8d07776f974b02cc74724b89b3b6b7e7a42e18, árbol
7521eb75a5386e0198b793434c6c5b8469ae4533, oficial con lease desde3d6b5a2.
Anteriorb9969f8c. Contraseña real introducida únicamente mediante browserAuth:
primer intento declined(no acredita contraseña errónea), segundo submitted,
editor autenticado visible. No se leyó ni publicó contraseña/token/cookie.
Google opcional y desactivado:no bloquea el objetivo de revisar con sesión SUES.

Prueba visual encontró original HEVC con audio pero videoWidth0 en Work y dos
FAILED/SIGKILL antiguos. Baseline aislada misma imagen1GiB/0,5CPU:OOMkill1,
pico1GiB. Corregido focus split+trim:ramas completas alineadas y fade absoluto,
sin alterar intensidad/tiempos. Render real38,3s, H2641080x1920/30, audio y
fullDecode PASS con463597568bytes de pico y0OOM. Sin ampliar recursos.

240 tests Node y check PASS local; Chromium145 real móvil/escritorio con HEVC
sintético:aviso compatible, reintento crea versión nueva y conserva fallida PASS.
Ese ensayo induce fallo del renderer y NO valida exportación. Render real sí
comprobado aparte sobre material recuperado del VPS. Informe:
docs/SUES_LIVE_QA_20261020.md y JSON de evidencia en examples/preview.

Despliegue systemd SUCCESS/código0. Backup verificado:
/opt/sues-video-setup/update-backup-20261020-144644-22424, TAR SHA256
948125e28ef63835292b3263a7027d9827d4738e5e870a2d714e8d49c7972f8d;
rollback con contenedor anterior conservado. Work mantuvo sesión tras despliegue.
Copia QA56e3df6c-e917-44a5-a71b-2bf42b04e09b:guardar zoom99/deshacer100,
previsualizar por UI, DONE en1intento, vídeo reproducido en Work(1080x1920,
38,3s, tiempo avanza, sin error). Originales154 archivos persistentes intactos.
Descarga HTTPS real200/Range206:18332121bytes, SHA256
2c26c0564cab764098164062589afa20f21fcca0b6d7ead8507154d3a2743404,
idéntico al preview, sin otro render; fuente intacta y audit completo.

Límite vigente:al intentar evento download/clic Exportar, runtime Work bloqueó
observación por protección de credenciales; nueva pestaña/REPL no recuperan.
No afirmar clic/descarga del navegador o recarga final superados. API/archivo y
reproducción visual sí probados. No pedir otra contraseña para resolverlo como
si fuera error del editor. Falta ese cierre visual en runtime operativo y F9
completa con subida nueva; F6/V1 abiertas. Auditar otros split+trim retrasados
(transiciones globales) antes de afirmar todas las plantillas libres de OOM.
Sin créditos, paquetes, costes ni cambios WAC/WhatsApp/Caddy/DNS/otras apps.

---
## Estado vigente: código OAuth desplegado; Google pendiente de credenciales · 20/10/2026

Instalado y verificado directamente mediante Desktop Commander en srv1841004:
b9969f8c468a15a7bc77409f862caf13d98596e2, árbol35157551f9b9d9e0685145fd357787adb757eeb9.
Anterior6da5a3d. Oficial avanzó mediante lease desde080fe98, sin force. Despliegue
systemd sues-editor-update-20261020-131347-725ebeca: SUCCESS/exitCode0 y systemd0.
HTTPS200; API401 sin sesión; salud available y cola0/0/0. Cuatro trabajos y155
archivos originales idénticos por SHA antes/después, incluida contraseña privada.

239 tests+check PASS local y en copia aislada del VPS (Node/Git host22.23.3,
FFmpeg real de imagen existente);28 Python infraestructura simulada PASS.
Chromium145 escritorio/móvil: contraseña, ojos, emergencia, persistencia y OAuth
con HTTPS local/proveedor RSA SUSTITUTO PASS. Intentos iniciales de QA VPS fallidos
por herramientas/disco/permisos del arnés se documentan; no se cuentan como PASS.
No se ha introducido la contraseña real de Carlos ni probado Google vivo.

Backup privado verificado: /opt/sues-video-setup/update-backup-20261020-131350-17153,
TAR SHA256 df38087e10b0ef076c1c5deb9053d9962684a91c22adcfca9a2b9ed7bb967505.
Contenedor anterior conservado para rollback; no se realizó reversión innecesaria.
Sin gastos, paquetes nuevos ni cambios en WAC/WhatsApp/Caddy/DNS/otras apps.

Google NO ACTIVO: no hay credenciales privadas; botón desactivado con explicación,
contraseña y enlace de emergencia operativos. Work Google Cloud devuelve Site
Unavailable, también tras recarga. Falta creación/autorización del cliente web y
login Google real; callback https://editor.suesholistics.com/api/auth/google/callback .
Solo cuenta carlossuess@gmail.com y scopes openid/email. No pegar secretos al chat.
Informe y límites: docs/SUES_GOOGLE_LOGIN_20261020.md. Esta evidencia sustituye
las entradas antiguas que dejaban pendiente el despliegue del login por correo.

---
## Google OAuth preparado y probado localmente · 20/10/2026

Base oficial080fe98; VPS observado directamente usa6da5a3d, contraseña configurada,
cuatro trabajos y cola vacía. Se añade Continuar con Google, manteniendo contraseña,
ojos y recuperación anterior. OAuth Code+PKCE/state/nonce, firma/claims OIDC,
email_verified y cuenta única carlossuess@gmail.com; sesiones SUES30d. Sin nuevas
dependencias ni cambios de motor. Google ausente queda desactivado explícitamente.

239 Node + check PASS; 28 Python de despliegue con infraestructura simulada PASS.
Chromium145 real móvil/escritorio: contraseña, tres ojos y persistencia PASS;
flujo Google sobre HTTPS local real con proveedor/JWKS RSA SUSTITUTOS PASS,
incluidos rechazo de otra cuenta y reinicios. No acredita Google en producción.
Detalles y límites: docs/SUES_GOOGLE_LOGIN_20261020.md. Google Cloud en navegador
Work devuelve Site Unavailable también tras recargar; cliente/secret no disponibles.
Falta creación/autorización de Google y login real, sin exponer secretos al chat.
Despliegue del código y conservación remota de datos pendientes de comprobar.

---
## Login por correo terminado y probado · 20/10/2026 · pendiente de instalar

Release aprobada: 6da5a3d9145dde6bff7056e318b67d020e99c66f. Árbol probado:
53954f7657a1561ef72720a2daa12cd6c99b1f3e, idéntico al publicado. Continúa
feat/editor-email-login-20261020 desde 550fc179. Oficial avanzó con lease desde
d2e789c, sin force ni reconstrucción.

Cuenta carlossuess@gmail.com. Hash scrypt privado bajo /state/access, sesiones
firmadas persistentes de 30 días y botón de ojo en login, creación y confirmación.
Configuración mediante enlace HTTPS de un uso, 256 bits y caducidad de 30 minutos,
generado por root en VPS. Solo se instala el hash del token; la contraseña se
introduce en el formulario HTTPS. Enlace privado anterior conservado. Sin proveedor
operativo de correo verificado, la recuperación se hace mediante administración
del VPS y enlace privado, sin envíos ficticios ni nuevos servicios.

233 pruebas Node y npm run check PASS. 28 Python de despliegue PASS, con Docker,
systemd, red y chown simulados. Chromium 145 real en móvil y escritorio: creación,
confirmación, tres ojos, login, errores, cookie persistida tras reiniciar navegador
y servidor, logout y enlace anterior PASS. 24 combinaciones del editor PASS, con
copia y recuperación por UI. Tres renders FFmpeg de 24 segundos: reproducción,
exportación con SHA idéntico al preview, nueva versión, decode PASS y original
intacto. Primera ejecución en workspace fallida no cuenta; ejecución aislada
posterior en /tmp completa PASS. No cambia motor, fingerprints ni dependencias.

Scripts publicados descargados y checksums comprobados. Comandos y evidencia:
docs/SUES_EMAIL_LOGIN_VERIFIED_20261020.md. Actualizador con TAR verificado antes
de instalar configuración, contenedores anterior/fallido conservados y rollback
automático de código/configuración. No se despliega en esta misión por instrucción
de Carlos. VPS último acreditado: 71399e1. Siguiente: comando 1, comprobar SUCCESS
con comando 2, abrir enlace privado y crear contraseña. Login HTTPS real y recorrido
F9 siguen pendientes. F6 abierta; porcentajes no recalculados. Sin gastos ni cambios
en WhatsApp, WAC, Caddy, DNS u otros servicios.

---
## Despliegue VPS acreditado por capturas · 20/10/2026

Carlos aporta capturas 156828–156830 de la consulta independiente tras reconectar.
Modo deploy, commit 71399e1c9ac6a7da1b586c50b8dae5d93651050b,
Result=success, ExecMainCode=0, ExecMainStatus=0, state=SUCCESS y exitCode=0.
Log: copia privada verificada SHA256 y ACTUALIZACIÓN OK para ese commit.
Backup conservado: /opt/sues-video-setup/update-backup-20261020-054955-12714.
La unidad transitoria terminó (inactive/dead); no significa caída del editor.
Evidencia remota aportada por Carlos, no sesión administrativa de Work.
Según el updater verificado, éxito exige salud privada, protección de API y HTTPS.
Rollback disponible; no fue necesario ni se ha ensayado en producción.
Versión anterior exacta no visible en estas capturas. No repetir instalación.

Queda pendiente aceptación F9 en producción: subir vídeo real, preparar edición,
reproducir preview, ajustar/nueva versión y exportar MP4. El doctor muestra
renderExecuted=false: despliegue correcto no acredita un render remoto.
F6 sigue abierta, porcentajes no recalculados; últimos cambios de teclado del
frontend continúan aislados. Sin cambios WhatsApp/WAC/Caddy/DNS ni gasto externo.
Siguiente: abrir editor.suesholistics.com con la sesión habitual y probar recorrido.

---
## Desbloqueo e integración verificados · 20/10/2026

Código oficial: 71399e1c9ac6a7da1b586c50b8dae5d93651050b; árbol
29523d4dba89ac4fc113b0fabe1c61ceaebb79a8. Integra F6 renderer-text
3aaf56b3 (incluye capability/preflight); timeline-guard apunta al mismo SHA.
223 pruebas Node/check y20 Python PASS, repetidas sobre commit remoto.
Render FFmpeg real24s1080×1920/H264/AAC, decodePASS/originalintacto,
fuente sintética y tiempos QA sin ASR. No validación de producción.

Conector GitHub lee/escribe correctamente; Git directo sin credenciales push.
Sin cambios de permisos ni reconexión. Chromium145 bloqueado al abrir socket
por política del entorno; matriz/player no ejecutados con éxito. Cambios
frontend posteriores a1178 conservados en su rama babc6a54, sin integrar.

Lanzador systemd con logs/estado/código real/locks/checksum y diagnóstico
sin parar el editor. Actualizador conserva contenedor fallido y verifica
recuperación.20testsPython simulan Docker/systemd/red, no son operacionesVPS.
Entrega a Carlos: --diagnose, NO instalación. VersiónVPS actual desconocida;
fd168 reportada, intento1178 sin verificar. GETHTTPS200; HEAD404 no es caída.
Backup/rollback remotos no ejecutados. Guía, ramas, hashes y límites:
docs/SUES_BACKGROUND_PREFLIGHT_20261020.md. F6/F9/V1 abiertas; porcentajes
no recalculados. Siguiente: ejecutar diagnóstico systemd, consultar resultado
y revisar instalación real antes de desplegar. Sin gastos/WhatsApp/WAC/Caddy/DNS.

---
## Misión Work · frontend de referencia · 19/10/2026

Auditoría desde aa6e7c246a8de811ac2329d87936e9e84f091e9e; base oficial
fd168dd2b7ff5817be89ee28d8e654e792002fab. PR7 fusionada sin conflictos:
1178f9c10cff7b1c38ac8e8aa196a034dd4d8c9c, árbol probado
3c995c16cf18159b0ff78b045978d93d5117eb8e. Integración reversible.
Guía y evidencia vigente: docs/SUES_WORK_VALIDATION_20261019.md.
Frontend noche/cian, reproductor persistente, seis herramientas con iconos,
timeline real y exportación del MP4 previsualizado. QA local en Chromium145,
211tests/check y 12 pruebas Python de despliegue. Estas últimas simulan Docker.
Sin cambios de renderer/dependencias ni créditos externos.

VPS: no desplegado por Work. HTTPS abre; Session required bloquea la revisión
privada. No hay herramientas HostingerVPS, dispositivos DesktopCommander ni
claves/config SSH disponibles. Instalación anterior fd168 reportada por Carlos;
commit remoto no verificado. Actualizador reforzado con TAR privado verificado
y recuperación del contenedor anterior; backup/rollback remotos no ejecutados.
F8 QA local; F6/F9/V1 y aceptación humana pendientes. Porcentajes no recalculados.
Siguiente: habilitar acceso administrativo existente, ejecutar release fija y
validar subida→preview→ajuste→exportación en producción sin tocar servicios ajenos.

---
## Reproductor persistente y previsualización antes de exportar · 19/10/2026

Carlos rechaza el recorrido PR5 por falta de visibilidad. Pide vídeo siempre
presente con herramientas debajo (móvil), guía contextual y Previsualizar antes de
Exportar. Nueva decisión prevalece sobre paneles separados. Guía vigente:
docs/SUES_PLAYER_PREVIEW_EXPORT.md. Rama feat/persistent-player-preview.

Original reproducible al seleccionar, después de subir y tras recargar; nombre,
tamaño y estado visibles. Nuevo vídeo sin análisis no conserva transcripción ni
selección del anterior, incluso si ya había un montaje abierto y se recarga.
Reproductor permanente con Original/Montaje, play/pausa/búsqueda/pantalla completa.
Herramientas Vídeo/Estilo/Texto/Sonido/Imágenes. Previsualizar renderiza el montaje
completo; Exportar descarga ese mismo MP4 sin repetir render. Editar bloquea Exportar
hasta actualizar la vista previa en nueva versión. Cambio de estilo prepara cues
antes de ELEMENTS y Deshacer conserva texto previo sin guardar.

211tests/check y10simulaciones PASS. Chromium145, escritorio/móvil: selección y
subida reales del vídeo de prueba, playback nativo original/montaje, recarga,
fuente nueva sin texto ajeno, herramientas con vídeo visible, exportación SHAigual
sin otro render, edición→nueva vista previa yversión anterior conservada. Tres
renders24s con decodePASS/originalintacto. Regresiones de fuente/reload y estilo/
Deshacer/ELEMENTS en ambos tamaños PASS; sin erroresJS ni overflow horizontal.
Evidencia examples/preview/player-workflow.real-result.json. Demo UI10,8s guardada:
libfile_99fa6c00ec9c81919386a02db5dc7106. Vídeo sintético/etiquetasQA, sin ASR nuevo.

Web publicada navegada: shell nuevo visible, «Session required» en navegador
remoto. Carlos no puede completar ese acceso; no se inspeccionaron sus trabajos
VPS. El navegador remoto tampoco accede al loopback local. Se usaron pruebas de
software de la copia local; no afirmar exportación/autenticación VPS ni aprobación
humana. Nueva corrección todavía no instalada remotamente. Sin cargos, proveedores,
modelos o dependencias nuevas de producción; nada de WhatsApp/Caddy/DNS.

---
## Recorrido UX por tareas implementado · 19/10/2026

Carlos pide diseño UX de alto nivel. La corrección del panel se amplía al recorrido
Material → Edición → Resultado: sólo un panel visible, contexto y acción principal
por tarea, navegación reversible, opciones del estudio fuera del flujo principal.
Preparar/recuperar abre Edición; Generar guarda y abre Resultado; descarga al acabar.
Ajustes secundarios plegados, subtítulos individuales y búsqueda con estado vacío.
Texto sin guardar conservado entre pasos; indicador de cambios, sin falsos cambios
al buscar. Botón Generar accesible en barra inferior móvil. Valores y motor intactos.
Guía: docs/SUES_UX_FLOW.md. PR5 amplía el ajuste compacto; aún sin instalar en VPS.

Chromium145:24 combinaciones escritorio/móvil × estilos × ELEMENTS PASS;
guardar/recargar/deshacer/duplicar/copia/recuperación y render real38,31s,
decodePASS, fuente intacta yRange206. Prueba adicional en móvil/escritorio:
texto sin guardar, búsqueda/0resultados, tecladoEnter, una tarea visible,
sin scroll horizontal. Botón principal nuevo genera un vídeo real, abre Resultado
y habilita descarga;decodePASS yoriginalintacto.209tests/checkPASS.
Evidencia guided-ux.real-result.json yux-navigation.real-result.json.

VPS observado7cbccb9 por captura delactualizador yDOPAMIN/ELEMENTS visibles.
Nueva UX local verificada; su despliegue remoto pendiente por falta de acceso.
No se declara aceptación de usabilidad, mejora porcentual medida ni cierre F6/V1.
Sin créditos externos, nuevos modelos/ASR/proveedores ni dependencias deproducción.

---
## Panel compacto verificado · 19/10/2026

Carlos confirma DOPAMIN yELEMENTS visibles enapp tras actualización; captura
156756.png muestra «El editor ya usa esta versión; sin reinicio» para7cbccb9.
VPSobservado ahora7cbccb9, reemplaza ba972 como últimoestado; exportación remota
noacreditada. Carlos indica queelmenú esdemasiadolargo ydificulta encontrar cosas.

Ajuste incremental deinterfaz:estilo/estructura yguardar/deshacer siemprevisibles;
recursos,cámara,imágenes,sonido ysubtítulos enseccionesplegables. Cada subtítulo se
abre individualmente; trabajosguardados tambiénplegados. ELEMENTS con etiquetas
enespañol manteniendo valorespersistidos; al elegirformato seabre susección.
