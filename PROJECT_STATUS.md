## 22/11/2026 · R23 · Rendimiento export móvil

Corregido y desplegado 8443 cargado masivo de reproductores: 44→7 en QA, eliminados parones de >9s en muestra de 5 frames; HTML video activo+próximo, inactivos no se crean y anteriores se liberan. Barra 95/97/100 según etapas reales, QA botón→MP4 0.2s y regresiones 10/10. Instancia de export abierta antes de R23 sigue código anterior y NO fue interrumpida. Proyecto usuario intacto. Sin validación 55s completa ni promesa de tiempo en móvil. Véase docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md.

## 22/11/2026 · Revisión nº 22

Corrección bloqueo mezcla de audio desplegada preview 8443: fuentes audibles únicas, ventanas de exportación, progreso, cancel/timeout; mezcla real 55.57s en 6.5s, QA 8/8; descarga por botón UI real de fragmento 1s H264/AAC con archivo recibido verificado y 10/10 regresión. R14 intacto. Pendiente export UI completa 55s y prueba física, no sustituir por export MCP. Ver docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md.

## 21/11/2026 · Revisión nº 21

Arranque móvil prioritario por proxy y ventana cercana al cabezal, descarga simple MP4/MOV + calidad/peso estimado. Desplegado preview 8443; arranque frío 4.831s/7 reproductores en copia 166 clips; recarga 27.277s con ~20s antes de request, pendiente diagnóstico. QA frío 8/8 + regresión 10/10; R14 propietario intacto. Pendiente prueba física, reproducción completa y render final. Ver docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md.

## 21/11/2026 · Revisión nº 20

Exportación móvil simplificada ES, botones Volver/Exportar/Descargar visibles, ajustes avanzados plegables; volumen slider 0–200%, porcentaje vivo, silencio/original, undo. Desplegado preview 8443, QA 11+8+10, R14 intacto. R18 lean decoders experimental no pasó readiness y NO se desplegó. Pendiente auditoría integral, traducción restante, render real completo, fluidez. Ver docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md.

## 21/11/2026 · Revisión nº 17

Modo contextual móvil desplegado: «Editar existente» predeterminado, iconos/capas activos al cabezal, «+ Añadir» catálogo nativo, «Todas las capas». Máscara/B-roll doble acceso al mismo ID; undo sin pasos vacíos. QA 22/22 específicos y 10/10 regresión, R14 propietario intacto. Proxies 7/7 ready; R16 fluidez experimental aún NO desplegada. Validar en montaje completo y dispositivo real antes de cerrar. Evidencia y rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md.

## 21/11/2026 · Revisión nº 15

Desplegada selección explícita timeline→monitor, hitbox comp por contenido y selector «Elegir elemento» para solapados, «Editar elementos» / «Salir del grupo». QA 15/15 con seis clips reales y 10/10 regresiones; proyecto R14 propietario byte a byte intacto. Fluidez R16 experimental NO desplegada. Reaplicar delta sobre R15 y validar; no cerrar V1/V1.1. Evidencia en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md.

## 21/11/2026 · Revisión nº 14

Prueba privada CONCIENCIA R14 activa preview p_33d4e74d3f, 55.57s, 165 clips, 56 comps, 37 medios importados, 315 operaciones MCP desde fuente. Reutiliza activos y composiciones anteriores, no es prueba de importación maestra completa. Render y doble auditoría pendientes. Evidencia en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. No publicar ni cerrar V1/V1.1.

## 21/11/2026 · Revisión móvil nº 13

Preview 8443 desplegada: menú avanzado, catálogo 57 rutas, modos de corte nativos, recursos 86 visuales/320 SFX reconocidos, bind RO DAEDAL, búsqueda e inserción táctil, proxy 540p y reloj mejorado. QA 14/14 avanzados, 4/4 biblioteca, 10/10 regresiones, export técnico 1s 1080x1920 H264/AAC. Bruto preview p_27306f2839 intacto. Propietario no quiere más pruebas parciales; primera prueba conjunta pegar plan y render. Falta conexión nativa segura de plan al proyecto real, QA de edición/export completo y fluidez; no declarar terminado. Reutilizar store/ledger/MCP existentes, no mezclar contrato legado y nativo, no debilitar guard private-qa ni inventar aprobaciones. Evidencia, parche, límites y rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. No tocar producción.

## 21/11/2026 · Revisión móvil nº 12

Preview 8443 desplegada: hueco inicial 8px, cabezal parte de la izquierda hasta centro y regla libre. Usuario aprueba selección/gestos ronda11. Proyecto activo real p_27306f2839 «SUES · EDICIÓN REAL 158404» (73.75s, 1080x1920, V1/A1 vinculados; streamhash AV idéntico al bruto). Demo conservada. Stage aislado p_701ca40ed3, QA bruto 13/13 split/undo/seek/reloj/guardado; no certifica fluidez. Mantener originales/prod intactos. Continuar cobertura de funciones nativas, biblioteca y QA edición real; no dar V1/V1.1 por cerradas. Evidencia y rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md.

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

## 21/11/2026 · Prototipo V1.1 accesible al propietario

Despliegue de prueba privado https://studio.suesholistics.com:8443/ autorizado por Carlos. Caddy HTTPS autenticado (sesión habitual de Studio), snapshot del stage existente, datos demo separados de producción en /var/lib/sues-v11-preview y servicio aislado sues-fablecut-v11-preview.service. Verified HTTP 200 HTML / demo 4 clips / JS buscador, 302 sin sesión, 403 MCP público/origen ajeno, Studio original en 443 109 clips intacto. Reabrir el enlace tras login habitual. Espera revisión móvil de Carlos, no implica aceptación de ningún módulo V1.1 ni cierre V1. QA técnica en stage 17899. Checkpoint y rollback en docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md.

## 21/11/2026 · Continuación recuperada · VPS limpio y búsqueda contextual en STAGE

VPS 93% -> 86%, 3.8G -> 6.8G libres. Tres tar antiguos eliminados tras verificación del consolidado; un único baseline histórico recuperable conservado más el consolidado actual. Rotación adaptada sin poda automática, test simulado PASS; restauración completa del consolidado pendiente. Stage móvil existente /opt/sues-video-setup/v1_1-mobile-20261121/stage, no desplegado. Recuperadas 87/87 pruebas dirigidas y geometría Chromium real vertical/horizontal/escritorio; nueva corrección búsqueda contextual y 10/10 tests dirigidos PASS + qa-search-real.json (seis condiciones PASS). Faltan gestos táctiles, exportación, paridad completa MCP y validación visual. Capturas CapCut y requisitos r16 recuperados. V1.1 sigue 0/10 aceptadas; V1 Q03/Q04/Q05 pendientes cierre. Checkpoint docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md. Versionar stage recuperado antes de nuevas modificaciones; producción intacta.

## 21/11/2026 · Preparación AISLADA V1.1-01/02 · QA parcial, SIN despliegue

Revisión conjunta Drive V1-2026-11-21-r16. Tras confirmar en vivo que V1 NO está cerrada (Q03 vigente, Q04 pendiente, Q05 publicada con cierre funcional pendiente, Q06 posterior), se preparó en /opt/sues-video-setup/v1_1-mobile-20261121/stage una copia funcional de código del Studio, con data privada qa-data y servidor sólo loopback 127.0.0.1:17899. Prototipo sues-mobile.css y sues-mobile.js introduce monitor y timeline móvil en una pantalla con barra inferior que abre los paneles FableCut originales Medios, Inspector/Ajustes, Mezcla y Transcripción. Prueba de escritorio/Android real NO terminada. No incluir ni activar en producción.

QA comprobada: node --test qa-mobile-shell.test.cjs 2/2 PASS (mock DOM); keyframes + export-jobs + captions 56/56 PASS. Código original app.js SHA256 d68028065f4b9c5155c4405081291cd310ad8b3a5ae7bb29b68cf10f9eff8a8f y style.css 723b68f0a93437576282440b2823e7f74df1f5e0a19f39906151386d973155d4 iguales a publicados. Prueba HTTP aislada 200. Bloqueo: Chromium 155 falló leyendo DOM real y headless-shell 152 se cerró/agotó tiempo para Studio/fixture; test simple HTML sí funcionó. No registrar QA visual ni táctil como PASS. Resumen detallado docs/SUES_V1_1_MOBILE_STAGE_QA_20261121.md; archivos en ops/fablecut/mobile-v1_1/. Último checkpoint commit be24ea53fb719ce573e3aaf9ae51f6ef7a6c5627.

Siguiente V1 activa: atender Q03 y validaciones Q04/Q05 según Roadmap; al poder trabajar V1.1-01, resolver QA de navegador y probar en portrait/landscape con toques reales, selección y reapertura, sin alterar producción. A día de hoy V1.1 0/10 ACEPTADOS.

## 21/11/2026 · V1.1 FableCut móvil PLANIFICADA tras revisión del Roadmap (SIN IMPLEMENTAR)

Carlos definió con capturas CapCut los requisitos de futura V1.1: monitor siempre visible, barra contextual, selección bidireccional monitor/timeline, mover clip desde centro sin variar duración, recortar SOLO desde los extremos, mantener pulsado para cambiar z-order, pellizco sobre vídeo para tamaño de capa y sobre timeline para zoom temporal, dividir clip para zoom instantáneo sin keyframe o con keyframes interpolados, editor de subtítulos estáticos/animados, lupa que lleva al menú original y conserva selección al cambiar de capa, audio/máscaras y QA táctil con export real.

Registrado como V1.1-01 a V1.1-10 en Roadmap Maestro Drive https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit (revisión compartida V1-2026-11-21-r15), resumido en Estado General https://docs.google.com/document/d/1L4gycV0LnKGhZ5VtWXAOlzVOzY3GDCp-qW1_X4A9B08/edit y replicado en docs/SUES_V1_1_FABLECUT_MOBILE_SPEC_20261121.md. NO IMPLEMENTADO NI DESPLEGADO V1.1: 0/10 módulos. V1 permanece Q03 en curso, Q04 pendiente, Q05 publicada con cierre funcional pendiente, Q06 posterior. No declarar V1 cerrada.

FableCut Studio en /srv/sues-fablecut-next/app presenta rama main con modificaciones locales no versionadas en app.js, delivery.js, export-jobs.js, index.html y archivos preview/PWA. No resetear ni sobrescribir esa carpeta; inspeccionar y aislar worktree+backup. Siguiente trabajo V1.1-01 sólo tras cierre de V1 o para preparación en clon aislado.

## 21/11/2026 · Nuevo modo Vista rápida 540p publicado en FableCut Studio

Carlos aprobó separar resolución de revisión del máster: 540×960/15fps para ver y 1080×1920 o perfil elegido al exportar. En la **instalación FableCut Studio existente** se publicó el botón `▶ Vista rápida`, junto a `⬇ Export`. Se añadió `sues-preview` en `delivery.js`, módulo `preview-render.js`, cambio mínimo de `app.js` para capturar JPEG a resolución reducida antes de subirlo, y `index.html`. NO se cambia el perfil ni el proyecto de exportación final; no se descartan capas o animaciones. Backup código antiguo `/opt/sues-video-setup/v1-preview-540-20261121/before`.

QA: 8/8 tests PASS; prueba nativa real aislada `x_lp6c03r7` 2s de proyecto original 106 clips/15 medios => `done` 100 %, 540×960/15fps, 30 frames decodificados y AAC PASS, memoria pico 1,714GB. QA detenido y retirado; prueba `/opt/sues-video-setup/v1-preview-540-20261121/proof.json`. Preview ligera del Reel previamente exportado de 73,749s, 1106 frames, **5,5MiB** HTTPS Range206 verificado: https://studio.suesholistics.com/exports/SUES_158404_V1_VISTA_RAPIDA_540x960_15FPS.mp4 . La copia completa proviene de transcodificar un MP4 anterior, NO de renderizar desde cero todas las capas. El editor sigue con dos proyectos (activo p_65497bf597), originales y V29 intactos. Fuente/patch/test versionados en `ops/fablecut/`, checkpoint `docs/SUES_V1_PREVIEW_540_20261121.md`.

**PENDIENTE REAL**: el compositor sigue pintando el fotograma a resolución original aun en Vista rápida, por lo que el tiempo del proyecto completo de 73s con máscaras continúa siendo elevado; resolver por tramos incrementales y cache de segmentos aprobados, luego confirmar desde navegador/móvil. No confundir 540p real en salida con renderizado nativo interno a 540p; no dar Q03/Q04 por cerrados.

## 21/11/2026 · FableCut render estabilizado y SUES Console limpieza inteligente desplegada

Tras autorización de Carlos de limpiar y corregir interrupciones: FableCut Studio PUBLICADO con heartbeat de render cada 15s, watchdog real 600s, tolerancia headless 180s y 1–2 JPEG workers según RAM. Ruta real: `/srv/sues-fablecut-next/app`; originales `app.js` y `export-jobs.js` respaldados en `/opt/sues-video-setup/v1-render-fix-20261121/before`. 4/4 pruebas export-jobs PASS, canario headless **45/45 fotogramas, 1,5 s, H264/AAC y decodificación total PASS**, 1,15GB peak. La prueba de proxy histórica falla PSNR (26,54dB vs 35dB), aunque proxies reales de bruto y balanza se crean; **NO está validado un render complejo completo nuevo de 73 s**. Preview 720×1280/30fps de 15,8MB servida con HTTP206: https://studio.suesholistics.com/exports/SUES_158404_V1_PRIMERA_PRUEBA_PREVIEW_720P.mp4 . Dos proyectos de FableCut intactos.

Limpieza física real del VPS: de **4,2 GB libres/92%** a **8,0 GB/84%**, mediante hardlink de copia exacta 3,04GB, 24 render-work sin prueba, dependencias Remotion reproducibles, ZIP redundante Chrome, deduplicación de 21 copias del bruto y retiro de seis contenedores de pruebas + 34 contenedores históricos parados; manteniendo originales, proyectos, WAC, backups y rollbacks. Detalles en `docs/SUES_V1_RENDER_STABILITY_VPS_CLEANUP_20261121.md`.

Mejora adicional: servicio privado EXISTENTE SUES Console, `/opt/sues-vps-mcp` puerto 3917, ampliado con herramientas OAuth `cleanup_scan`, `cleanup_prepare`, `cleanup_execute`; escáner clasifica `recomendado`/`revisar`/`conservar`, informe exportable, aprobación temporal única de diez minutos + frase obligatoria y revalidación antes de borrar. Backend publicado, tests sintéticos 2/2 PASS, HTTP OAuth 200 y /mcp sin sesión 401; **NINGÚN BORRADO ejecutado por herramienta nueva**. Inventario actual: 1 recomendado (~6MB), 34 revisar, 5 conservar. Código versionado en `ops/sues-console/`; checkpoint `docs/SUES_SERVER_CONSOLE_CLEANUP_20261121.md`. El botón de limpieza en la web ORIGINAL de Sites no se ha editado: **PENDIENTE acceso a esa interfaz y conexión con autenticación**, no inventar que ya funciona.

Q03/Q04 siguen pendientes de aceptación audiovisual y prueba real compleja; Q05 candidata anterior sigue publicada, no confundir este endurecimiento con V1 terminada. Próximo trabajo con prioridad: render completo de nuevo proyecto desde FableCut, revisión móvil y después conexión UI de consola sin duplicar Sites.

## 21/11/2026 · ENTREGA DEL REEL: CORRECCIÓN 404 DEL ENLACE Y PROYECTO FABLECUT STUDIO VISIBLE

- Carlos reportó mediante captura error `404` al seguir `https://studio.suesholistics.com/exports/SUES_158404_V1_PRIMERA_PRUEBA_20261121.mp4?utm_source=chatgpt.com`. Se reprodujo: el FableCut privado 7780 servía Range GET 206 con y sin query, pero el middleware de autenticación `/srv/sues-fablecut-next/auth/auth.py` comparaba `self.path=='/verify'` literal, por lo que forward_auth con query devolvía 404. Backup preservado: `/srv/sues-fablecut-next/auth/qa-20261121-linkfix/auth-before-url-queryfix.py`. Corregido únicamente `do_GET` para comparar `urllib.parse.urlsplit(self.path).path` en `/verify` y `/login`, syntax check PASS, reiniciado **solo** `sues-fablecut-auth.service`. HTTPS verificado con sesión privada: descarga MP4 con `?utm_source=chatgpt.com` HTTP206, `Content-Type:video/mp4` y rango `0-1023/91532285`; proyectos `/api/projects?utm_source=chatgpt.com` HTTP200. Sin sesión permanece protegido.
- FableCut Studio de producción `/srv/sues-fablecut-next/data` originalmente tenía un proyecto activo `p_3c0550a1dd` de prueba POC, mientras que la copia Q03_d de 158404 permanecía en `automation-v1/test-project-q03-158404-para-20261121`. Para permitir revisión editable al usuario sin tocar el proyecto anterior se verificó SHA y se incorporó con API `/api/projects` acción `import` con `open:false`: proyecto nuevo `p_65497bf597` **SUES 158404 · V1 primera prueba editable**, 106 clips y 15 medios. Los dos medios ya existentes RAW/VOX coincidían SHA; 13 medios nuevos copiados con prefijo reservado `review158404v1_` y hashes verificados, sin sobrescribir ni eliminar fuentes. Readback del proyecto y GET Range 206 para los 15 medios PASS. El proyecto activo `p_3c0550a1dd`, el archivo `data/project.json` y el índice de activos permanecen con SHA inalterado; ahora FableCut lista 2 proyectos.
- Script de importación y comprobaciones: `/opt/sues-video-setup/v1-rollout-20261121/import-158404-private-review.py`; manifiesto `.../fablecut-review-import.json`. La revisión pública no fue automáticamente abierta porque abrirla alteraría el proyecto global activo de FableCut. Carlos debe refrescar el panel de proyectos de Studio y abrir el proyecto con ese nombre. Archivo de descarga: `https://studio.suesholistics.com/exports/SUES_158404_V1_PRIMERA_PRUEBA_20261121.mp4`.
- **No confundir:** proyecto editable visible en FableCut Studio ≠ integración nativa automática habilitada dentro de SUES AI VIDEO EDITOR; esa ruta de host seguía desactivada. Sigue pendiente revisión artística y aceptación Q04. No se publicó en redes. Se debe comprobar en navegador móvil el acceso/visibilidad que comunicó Carlos; la API únicamente acredita listado/medios.

## 21/11/2026 · PRIMER RENDER DE REVISIÓN V1 DEL REEL 158404 DESPUÉS DE DESPLIEGUE

Carlos solicita volver a ejecutar el bruto 158404 con el plan de balanza previamente aprobado, sin segunda aprobación de guion. Se reactivó SUES AI Film Director v1.7.1 y todas sus referencias obligatorias, se recuperó `annex.json` (siete escenas, 87 operaciones, 14 recursos) y el proyecto FableCut de QA privado ya ejecutado mediante 108 instrucciones nativas. Se verificaron en disco los SHA256 de los 14 medios contra el anexo. Estilo del proyecto: 63 captions Montserrat de 54 px a y=415 debajo de barbilla, con word-pop salvo la palabra aislada C41.S04 neutralizada por solape con título, cuatro títulos Montserrat 75-92 px ajustados por longitud. NO afirmar que el navegador haya usado Montserrat sin prueba visual; fontconfig del host resuelve DejaVu, aunque FableCut trae WOFF2 Montserrat.

Se reutilizaron las once ventanas anteriores íntegras y se renderizó nativamente `[1575,1775)` en el clon privado `test-project-q03-158404-para-20261121` con la corrección existente de C48.S05 («para» cerca de 54,9 s), recibo/segment-proof y validación de identidad. 200 frames nativos en la ventana; sin tocar Reel V29 ni datos de producción. Ensamblado 12 tramos; MP4 nuevo `SUES_158404_candidata_Q03_d.mp4`, 1080×1920 H264 30fps, 2.212 fotogramas y 73,733333 s, SHA256 `04c8ffd1094fce74b9804b9d50c9d1cd49e0c3b2bee206f2519b67e71ff8c06e`, AAC PCM idéntico a la copia base, decodificación completa PASS. Proof `/opt/sues-video-setup/q02-native-annex-20261119.j3YNOa/q03-review/full-para-20261121/technical-verification.json`, con `speechTimingConfirmedByEar:false` y `doubleAudiovisualReview:false`.

Copia exacta para descarga autenticada: `https://studio.suesholistics.com/exports/SUES_158404_V1_PRIMERA_PRUEBA_20261121.mp4`. Servidor sin autenticación redirige a `/login` (HTTP302), SHA de copia igual al de QA. Carlos debe revisar el vídeo; NO aprobado creativamente ni publicado en redes.

**Alcance técnico:** Se editó/renderizó usando FableCut en clon privado (MCP/QA) y el montaje previo; NO mediante aprobación nativa automática del editor público, que sigue desactivada en producción por host opt-in private-qa. La V1 web desplegada sigue operativa; la prueba no cierra Q03/Q04 ni certifica interoperabilidad nueva de proyectos en producción. Próxima acción: revisar observaciones precisas de Carlos y validación funcional de flujo público, sin volver a renderizar escenas correctas.

## 21/11/2026 · CANDIDATA V1 PUBLICADA · despliegue controlado, aceptación pendiente

Carlos autorizó el despliegue de la V1 actual sin esperar a perfeccionar motion graphics ni al autocorrector ASR. Se publicó la candidata de código `b2179b3` en `https://editor.suesholistics.com`, con montaje `/opt/sues-video-setup/v1-deploy-candidate-20261121:/app:ro` y el MISMO estado persistente `/opt/sues-video-setup/editor:/state`. El contenedor anterior quedó detenido pero íntegro como `sues-video-editor-pre-v1-20261121`, montando aún `release-mobile-layers-20261030`. Script de salida y rollback: `/opt/sues-video-setup/v1-rollout-20261121/deploy-v1.sh`; respaldo verificado de `project.json` e inspect en esa carpeta (0600). Imagen Docker anterior reutilizada, mismos límites de seguridad, sin modificar DNS, Caddy, WAC, FableCut producción, V29 ni originales.

Validaciones PRE: `npm run check` PASS; tests host FableCut 5/5 PASS; candidata en 3099 HTTP200 y token protegido; prueba nueva de arranque candidata con IMAGEN DE PRODUCCIÓN en contenedor aislado 3101 HTTP200, API sin sesión 401. El primer intento preflight fue rechazado correctamente por lock de directorio QA compartido; se rehizo con estado privado independiente y pasó. Validaciones POST: contenedor en ejecución, bind candidate correcto; localhost 3010 y HTTPS públicos HTTP200; /api/jobs y /api/projects SIN sesión 401; con sesión privada autorizada, /api/health 200, /api/jobs 200 (29 trabajos), /api/projects 200; backup anterior conservado. No se realizó nuevo render real en producción ni visualización humana completa de esta versión, por tanto NO se declara V1 aceptada ni QA audiovisual final superada.

LÍMITES VIGENTES: el nuevo native host opt-in solo admite clon private-qa; producción arranca sin SUES_NATIVE_HOST_CONFIG y mantiene la aprobación/ejecución nativa automatizada del Master Director desactivada. Edición asistida con conectores y trabajos manuales sigue posible fuera de esa ruta, pero NO afirmar integración nativa por proyecto nuevo ya publicada. No está desplegado el detector Whisper ni el autocorrector de palabras. Fase 5 Q03 validaciones restantes y Q04 aceptación funcional siguen abiertas; Q05 tiene salida inicial ejecutada y verificación técnica básica correcta, pero cierre funcional integral PENDIENTE. Q06 limpieza postaceptación. El 65% de antigua cabecera Drive no equivale al progreso estructural de cinco fases y requiere revisión separada, no usarlo como estado actual.

## 21/11/2026 · E2E autenticado editor→MCP nativo PASS en clon privado

Prueba complementaria en VPS superada: sesión real, borrador/revisión/decisión Master Director, asociación privada verificada con un job sintético, aprobación ledger, rechazo 401 sin sesión, ejecución MCP real con revisión FableCut 31→32, readback de x=1→2 y 15 clips preservados, rechazo de reutilización de autorización. `qa/v1-20261121/native-e2e.mjs` exit 0 en unidad aislada. Se añadió clip centinela exclusivamente al clon para igualar duración de fixture; no acredita un Reel nuevo ni render. QA server parado y binding revocado. Quedan onboarding multiproyecto, staged assets, reproducción audiovisual, regresión completa y rollback. Producción sin cambios. `docs/SUES_V1_NATIVE_HOST_PRIVATE_QA_20261121.md` actualizado.

## 21/11/2026 · Host FableCut nativo opt-in · QA MCP real en clon

Se añadió `src/engine-next/fablecut-trusted-host.js` y arranque opt-in `SUES_NATIVE_HOST_CONFIG` sin alterar la configuración pública. Host privado 0600, loopback QA, registro de binding y revisión, invocador MCP nativo y bloqueo de assets no verificados. 5/5 tests nuevos de host y 30/30 pruebas dirigidas de host/editor/bridge PASS, `npm run check` PASS. Clon real aislado: revisión obsoleta 999 BLOQUEADA, `fablecut_patch_project` revisión 29→30, transformación `af_text_qué_face` x:0→1, 14 clips intactos y lectura directa PASS. Unidad de QA detenida; proyecto de origen intacto. La prueba de invocador directo NO valida el ciclo HTTP de autorización humana completo. NO desplegado. Faltan binding por proyecto nuevo, recursos verificados, E2E web, doble QA audiovisual, rollback. Ver `docs/SUES_V1_NATIVE_HOST_PRIVATE_QA_20261121.md`. Q03 activo, Q04 aceptación funcional pendiente, Q05 autorizado sin ejecución.

## 21/11/2026 · Auditoría conservadora de tiempos de palabras · candidata aislada

Nuevo `scripts/asr/word_timing_silence.py` y conexión al worker Whisper: detecta silencios largos en intervalos ASR, marca `timingUncertain:true`, conserva timestamps; no hay corrección fonética automática ni retoques al Reel. En voz real separada, 170 palabras, 7 intervalos largos y 2 alertas: «para» 53,42–55,12 (silencio 53,50–55,02) y otro intervalo no aceptado como error. En mezcla con música no se activa la misma alerta; limitación confirmada. 6/6 unittest PASS, `npm run check` PASS, 7/7 tests nativos/bindings PASS. No se han ejecutado dos QA completas ni integrado todavía el arranque nativo público. Q03 sigue activo, Q04 será aceptación funcional, Q05 despliegue autorizado PENDIENTE. Ver `docs/SUES_V1_TIMING_AUDIO_AUDIT_20261121.md`.


## 21/11/2026 · V1 prioritaria; despliegue autorizado y conexión nativa pendiente

Carlos autoriza expresamente desplegar y pide acabar la V1, usando el Reel como prueba y evitando ajustes editoriales de publicación. Se actualizó el ref de PR #27 y se preparó worktree aislado `/opt/sues-video-setup/v1-deploy-candidate-20261121`, commit 98ca4e260b61559d36b04395741b53d8410ece62. La candidata arranca en contenedor privado `sues-v1-predeploy-3099-20261121` (127.0.0.1:3099, estado propio). `npm run check` PASS; pruebas dirigidas con FABLECUT_NATIVE_OPS real 81/81 PASS, 0 omitidas, log `q03-review/v1-predeploy-native-tests-20261121.log`. Hallazgo crítico: `scripts/app/start.mjs` no inyecta `nativeBatchRuntime`, `nativeDirectorInvoker` ni vínculo de proyecto en `createEditorServer`; la ejecución nativa de la interfaz está deshabilitada por defecto (503). Las pruebas previas la inyectaban en host técnico privado; no equivale a conexión productiva. No se desplegó ni se tocó el contenedor de producción. Siguiente acción: implementar/configurar host confiable para asociación real SUES–FableCut por proyecto, ejecución MCP y registro de recursos/decisión, con pruebas de proyecto equivocado y reversión; validar el recorrido antes de activar. Confirmada autorización ya concedida, no pedirla otra vez. Reel solo prueba; su edición final publicada queda fuera del alcance. Q03/Q04 no deben marcarse artificialmente cerrados ni presentar V1 como finalizada.


## 21/11/2026 · Diagnóstico general de pausas en marcas de palabras

En el audio de voz verificado VOX, Whisper asignó «para» a 53,42–55,12 s; diagnóstico RMS en bloques de 20 ms identificó silencio aproximado 53,50–55,02 s dentro de ese intervalo (umbral −55 dBFS; duración mínima 0,3 s). Esto explica la aparición temprana sin afirmar alineación fonética exacta. Prototipo diagnóstico aislado `q03-review/word-timing-research-20261121/detect-silence.cjs`: cuatro casos sintéticos superados y detección del caso real; no modifica marcas, no está integrado ni desplegado, y no demuestra robustez ante ruido, música, respiraciones o voz baja. Ruta existente: `transcribeFile` conserva PCM y usa `joinChunks`, mientras `captions.js` copia los tiempos Whisper. Siguiente: evaluar detección/ajuste conservador con varios audios aislados, pruebas de falsos positivos y experiencia de revisión; integrar de forma versionada solo cuando exista evidencia, preparar regresión y rollback. Se acata instrucción de no seguir corrigiendo el Reel de prueba. Q03 y despliegue no se declaran aprobados por este diagnóstico.


## 21/11/2026 · Instrucción de Carlos: centrar en desarrollo y despliegue

Carlos aclara que Reel 158404 es una prueba de la aplicación y que su edición definitiva ya se publicó. Pide dejar de pulir el Reel como entrega y centrarse en desarrollo, correcciones generales y preparación del despliegue. Se detuvieron las unidades privadas `sues-q03-para-render-20261121` y `sues-q03-para-assemble-20261121`; el render figura failed por detención voluntaria, no interpretar como prueba final. Q03_c y fuentes conservados. Se detectó que Whisper asignó 53,42–55,12 s a «para» incluyendo presuntamente una pausa; el editor hereda timestamps en `captions.js`/`transcribe.js`. Hipótesis: corregir o detectar intervalos de palabra con silencio; pendiente diseñar y probar solución general sobre voz real, sin prometer precisión. La versión del renderizador word-pop permanece aislada sin integrar en producción. No se han completado las dos revisiones integrales de una versión nueva ni otorgado aprobación Q04; no alterar el historial. Q05: preparar candidato de código, pruebas y rollback, y verificar autorización específica de despliegue antes de cambiar producción.


## Q03 · 21/11/2026 · Ajuste de «para» en exportación privada

Carlos detectó desfase en «para» de «ido abandonando para poder encajar». Gemini informa imagen a 10 fps, entrada 53,5 s y voz estimada 54,9–55,0 s (margen aproximado 0,1–0,15 s), por tanto adelanto de ~1,4 s; no equivale a escucha directa del operador. Copia técnica `test-project-q03-158404-para-20261121` preparada y ejecutada con 108 operaciones; se cambió la entrada del tercer wordTime C48.S05 a 54,9 s manteniendo el resto, fingerprint esperado d6f3e4210577107b5f1adcbe65e030ddca7b510a2275b0b5bc9dbb0fd1e18c41. Unidad `sues-q03-para-render-20261121` renderiza frames 1575–1775; unidad `sues-q03-para-assemble-20261121` espera y ejecuta ensamblado con validaciones. Consultar unidades y `q03-review/assemble-para-20261121.log` antes de reintentar. Todavía no hay nueva candidata verificada ni auditoría de ella. Se conserva Q03_c. Q03 en curso, no despliegue.


## Q03 · 21/11/2026 · Segundo visionado de Carlos: «para» pendiente

Carlos comunica un segundo visionado de la candidata Q03_c y considera correcta la sincronización salvo «para» en «ido abandonando para poder encajar», que percibe retrasado aproximadamente un segundo. La copia técnica identifica C48.S05: `ido abandonando para`, clip 52,0667–55,1333 s, entrada configurada de «para» 53,4333 s; ASR previo estima 53,42 s pero no sustituye escucha ni desvirtúa la observación. Evitar mover un segundo por suposición: comprobar a oído y con frames el inicio exacto del «para» hablado y mostrado, y si precisa corregirlo en copia conservando el resto, exportar y validar nueva versión. Carlos no ha aprobado el Reel ni autorizado despliegue. Q03 sigue en curso, no se afirma doble QA de una nueva versión.


## Q03 · 21/11/2026 · Revisión comunicada por Carlos y Gemini

Carlos informa haber visualizado y escuchado la candidata, sin percibir desfases importantes; el «si» le resulta un poco extraño. No ha expresado aprobación definitiva de Q04. Gemini declara haber escuchado audio completo y muestreado imagen a 1 fps y 6 fps entre 29–32 s; informa pausa limpia y «si» en 31,5 s, sincronizado, pero su muestreo no constituye visionado continuo integral y no confirma técnicamente el archivo por SHA. Inspección propia de Q03_c: a 29,6 s no se ve «si», a 31,5 s aparece en minúscula y a 56 s aparece «y» en minúscula. Gemini menciona clic de cierre, no comprobado por escucha del operador. No afirmar dos pases ni aprobación. Candidata conservada, Q03 sigue en curso pendiente segundo pase audiovisual real y cotejo auditivo; Q04 decisión explícita de Carlos, Q05 autorización específica y rollback. Sin despliegue.


## Q03 · 21/11/2026 · Candidata Q03_c completa, pendiente de revisión audiovisual

Los dos tramos de puntuación 1375–1575 y 1575–1775 se renderizaron y verificaron; ensamblado privado Q03_c: 2212 fotogramas, decodificación completa y PCM idéntico a la candidata anterior. SHA-256 `3ed3fb081e125581548acf7036f30a1b4314a3dad85dd675b3e4a7ba0bb72c72`; evidencia `/opt/sues-video-setup/q02-native-annex-20261119.j3YNOa/q03-review/full-punctuation-20261121/technical-verification.json`. Copia de descarga autenticada `https://studio.suesholistics.com/exports/SUES_158404_candidata_Q03_c.mp4` con SHA comprobado; la URL redirige a login sin sesión. El original se conserva. El ajuste de «si» a 31,4 s es provisional: falta comprobarlo a oído. Gemini inspeccionó muestras de la versión anterior, no dos reproducciones completas de esta versión. Pendientes dos visionados completos con imagen y sonido y cotejo auditivo; Q03 sigue en curso y Q04–Q06 pendientes. La variante del renderizador permanece aislada y no integrada en producción.


## Q03 · 21/11/2026 · Reel reconstruido; puntuación en curso

La unidad sues-q03-full-wrap-20261121 verificó 11 ventanas/2175 frames y se detuvo en la última por SILENT_OR_UNVERIFIED_AUDIO. Tras verificar igualdad de clips sin subtítulos y SHA de la ventana histórica final, sues-q03-recover-tail-20261121 ensambló el Reel privado Q03_b con 2212 fotogramas y PCM idéntico a la candidata anterior. SHA-256 2141ece817fba2854abc44fcfe1e697fc7d6b1ff7d0548d1de59e0b264ef8c56; prueba q03-review/full-wrap-20261121/technical-verification.json, sin doble QA ni escucha. NO confundir con resultado final.

La revisión técnica /srv/sues-fablecut-next/data/automation-v1/test-project-q03-158404-punctuation-20261121 ejecutó 108 operaciones y difiere de la revisión anterior exclusivamente en C46.S05 («reconocer qué partes») y C49.S05 («poder encajar.»); no se han cambiado otras capas. Unidad sues-q03-punctuation-render-20261121 renderiza de forma secuencial 1375–1575 y 1575–1775. Consultar unidad y sus logs antes de reintentar. Pendiente comprobar ambos tramos, sustituirlos en ensamblado verificado, comprobar fotogramas, tiempos y PCM, doble revisión audiovisual y escucha. Entrega automática anterior está detenida para no confundir versiones. Q03 EN CURSO; Q04–Q06 pendientes.


## Q03 · 21/11/2026 · Continuación de exportación

Unidad sues-q03-full-wrap-20261121 activa. Las ventanas 0–200, 200–400, 400–600, 600–800 y 800–1000 se verificaron y están en q03-review/full-wrap-20261121/segments.json; ventana 1000–1175 en marcha. Consultar unidad, log y manifiesto antes de reintentar; no duplicar renders. CPUQuota reducida en tiempo de ejecución al 70 % para dejar margen al resto de servicios. Se preparó q03-review/recover-tail-20261121.py sin ejecutarlo para un eventual rechazo por audio bajo de la ventana final: solo admite 11 ventanas previas verificadas y la cola anterior de 37 fotogramas con SHA comprobado y clips iguales sin texto. MP4 completo, escuchas y doble QA siguen pendientes. No producción, no Q04.


## Q03 · 21/11/2026 · Exportación privada en curso

Candidata de espaciado y ajuste de línea en /opt/sues-video-setup/q02-native-annex-20261119.j3YNOa/faststart-app-wrap-20261120 (app.js SHA 3d0f15962c8c4c4d0d4bcf6554ee9b59da37fba9a1c19ebcf72262fa3dfa475e); clon técnico /srv/sues-fablecut-next/data/automation-v1/test-project-q03-158404-wrap-20261120. Comprobación con fuente Montserrat y Chromium de 62 captions: 0 desbordes calculados, dos líneas reacomodadas; muestras reales de los dos casos largos verificadas visualmente en ventanas 1040–1105 SHA b1e701737952c362df074d20a30aa88ad6394a183e335f9f5f4ff4e5a77d3437 y 2025–2080 SHA 5fd254b9553cfa51d0efbb4d7a6bedc953f09d36bd7988226d17e633450d1d47, ambas SEGMENT_COPY_VERIFIED. No equivale a auditoría del vídeo completo. C31.S04 desplazado provisionalmente de 29,233–30,367 a 31,400–31,800 s sobre análisis de Gemini y ASR; ventana 870–960 SHA 19ee64516607db48609621ef2450f1fa0e85cbddb196e3c5dd8b42096ea87049 decodificada y verificada, muestras muestran ausencia a 29,6 y presencia a 31,5. Pendiente confirmación a oído.

Exportación completa privada de 12 ventanas iniciada en unidad sues-q03-full-wrap-20261121, controlador q03-review/render-full-wrap-20261121.py, log q03-review/full-wrap-20261121.log, código de salida q03-review/full-wrap-20261121.exit, manifest q03-review/full-wrap-20261121/segments.json. Consultar unidad/log/manifest antes de reintentar. Primera ventana 0–200 en curso al iniciar. Se exige identidad, mínimo 2,5 GB libres, paridad y SHA por ventana, 2212 fotogramas, timestamps, decodificación y PCM idéntico al MP4 de referencia. El último tramo puede rechazar volumen bajo; no declarar resultado hasta verificar prueba final. En caso de fallo conservar tramos verificados. Sin QA audiovisual completa ni aprobación Q04, sin modificar producción. Q03 continúa activo.


## Q03 · 20/11/2026 · Prueba privada de separación de palabras

En /opt/sues-video-setup/q02-native-annex-20261119.j3YNOa/faststart-app-spacing-20261120 se preparó una variante aislada del renderizador: separa palabras de captions word-pop considerando ampliación y contorno, conservando la animación. Sin cambios en producción ni en la candidata MP4 original. Clon de prueba /srv/sues-fablecut-next/data/automation-v1/test-project-q03-158404-spacing-20261120. Un primer render produjo imágenes útiles pero quedó SIN prueba completa por ausencia de un draft en el clon; no considerarlo validado. Repetición con draft: 720–790, 70 frames SHA 3d0e295097d210551516837d361d8eea89503fbb50eb17a814438e3ab4696c49; 220–280, 60 frames SHA 3ff784439239257206128f1ed95512cd01b49fb7ed0e8abdde9d435a729386bf. Ambos WINDOW_DECODE_VERIFIED y SEGMENT_COPY_VERIFIED. En muestras visuales se leen separados «ser tú mismo» y «De pequeño aprendes». En la ventana 720–790 el PCM decodificado coincide por SHA con la revisión anterior; PSNR de recorte superior sin captions 70,99 dB, no identidad pixel exacta. No demuestra ausencia de desbordes ni sincronización en todos los subtítulos. Pendiente probar el resto del Reel, evaluar ocupación en textos largos, integrar la corrección en código versionado y ejecutar regresión, verificar voz de C31, crear MP4 completo y dos auditorías reales. Q03 EN CURSO; Q04–Q06 pendientes.


## Q03 · 20/11/2026 · Tildes verificadas en fragmento privado

Informe Gemini recibido: «Hasta que un día» está visible en fotograma 520 de la candidata Q03, contrario a su informe; «si» aparece en 29,6 s, su sincronización auditiva no está validada. En C26.S03 se corrigió «ser tu mismo,» a «ser tú mismo,» en la copia técnica aislada /srv/sues-fablecut-next/data/automation-v1/test-project-q03-158404-accent-20261120. Se prepararon y ejecutaron 108 operaciones con alcance technical-qa. Ventana nativa 720–790, 70 fotogramas, 2,333 s, decodificada; verify-segment-copy SEGMENT_COPY_VERIFIED; SHA-256 abdac6e2ae709568b5c620425c01d3816fa9d9d26fd525d9448a42bdcc8cf2da. Fotogramas verifican tildes, pero a 25,8 s «tú mismo» se ve pegado durante word-pop: falta corregir y validar espaciado, sin cambiar animación ni degradarla sin autorización. No se ha generado nuevo MP4 completo ni auditado dos veces; original Q03 SHA 7b90ea6ff2049b3baaca8a79f645a9fb26395110c576b5a1608240f4378a3438 se conserva. Q03 sigue EN CURSO; Q04–Q06 pendientes. Sondeo de escucha con Gemini es apoyo, no dos visionados completos acreditados.

## Fase 5 · Q03 en curso · MP4 corregido completo y verificado técnicamente

La candidata corregida del Reel 158404 terminó con 2212 fotogramas, tiempos verificados y PCM idéntico a la referencia. Confirmado el aspecto de los subtítulos en fotogramas del propio MP4. Quedan los dos pases audiovisuales completos de Q03 y el visto bueno de Carlos en Q04. [Checkpoint Q03](docs/SUES_V1_FASE5_Q02_NATIVE_20261119.md).

## Fase 5 · Q03 en curso · Tramos de subtítulos verificados

Las cuatro pruebas focales se renderizaron y comprobaron en privado. La candidata completa del Reel 158404 está en exportación por ventanas. Consultar los trabajos `sues-q03-reel158404-corrected-windows` y `sues-q03-reel158404-assemble` antes de repetir. Roadmap y Estado General sincronizados en V1-2026-11-19-r13, con Q01 y Q02 finalizados. La escucha de los pasajes pendientes, la doble revisión y Q04–Q06 siguen abiertos. [Checkpoint Q03](docs/SUES_V1_FASE5_Q02_NATIVE_20261119.md).

## 19/11/2026 · Fase 5 · Q03 en curso · Correcciones privadas de captions

C41.S04 se verificó en un tramo nativo de 45 fotogramas. El texto blanco «perderlo?» conserva su posición y pierde el salto de escala al coincidir con el titular superior. La candidata conjunta incorpora además C11.S02, C19.S03, C29.S04 y C30.S04, con 108 recibos en la copia privada. Estado de los tres renders por pasaje en `q03-review/captions-render.log`. El MP4 completo y la doble revisión de la revisión corregida siguen pendientes. Ver [checkpoint](docs/SUES_V1_FASE5_Q02_NATIVE_20261119.md).

## 19/11/2026 · Fase 5 · Q02 con exportación técnica verificada · Q03 iniciado

Reel 158404. El MP4 privado de 73,733 s se completó y decodificó con 2212 fotogramas, H.264 1080 × 1920 a 30 fps y AAC. Q03 registró tres incidencias en subtítulos y la repetición visual de «perderlo» a 42,200 s. La voz de la mezcla se alinea con la pista original en las 18 ventanas medibles alrededor de las uniones. Quedan la corrección de los pasajes, la doble reproducción audiovisual completa y la revisión de Carlos. Consultar `docs/SUES_V1_FASE5_Q02_NATIVE_20261119.md`, sección «Inicio de Q03». Q04–Q06 pendientes.

## 19/11/2026 · Fase 5 · Q02 en curso · 108 órdenes y render privado

Segunda limpieza VPS: aproximadamente 0,91 GB adicionales recuperados. Libres 6,22 GB y 88 % de ocupación. Se archivaron los repositorios Git de tres clones temporales, se retiraron dos cachés de instalaciones npm inactivas y dos índices regenerables de APT. Tercer tramo del Reel verificado (600 de 2212 fotogramas), cuarto en marcha.

Limpieza VPS: se recuperaron unos 1,94 GB de capacidad disponible. Tareas seguras limitadas a perfiles temporales de exportación, caché de paquetes, tres archivos truncados y deduplicación comprobada de copias de QA. El original conserva su SHA. Dos tramos completos verificados y tercero en marcha al revisar el espacio.

Reanudación por v5. El render monolítico v4 se detuvo por memoria. Se renderizó y decodificó el tramo 35,8–42,9 s en dos disposiciones. Tres imágenes del segundo MP4 muestran la balanza a la izquierda y el rostro despejado. V5 aplicada con 108 recibos. Exportación completa por 12 tramos en curso en el VPS. El checkpoint enlaza ambas pruebas y las comprobaciones de salida. Q01 finalizado y Q02 en curso.

Seguimiento tarde del 19/11. El exportador privado ya completó la mezcla de 23 tramos e inició la entrega a 1080 × 1920. Se descartó de la mezcla el audio de capas silenciadas y se limitó FFmpeg a un hilo. Voz sin desfase medido en siete ventanas. El trabajo x_bb4okxqo y el auditor de salida se detallan en el checkpoint Q02. El cierre exige el MP4 completo y la revisión audiovisual.

[Checkpoint Q02](docs/SUES_V1_FASE5_Q02_NATIVE_20261119.md). Las 87 operaciones fuente se conservan; primer clon con 107 recibos y candidata v4 con 108, ambos por Master Director, ledger y MCP, revisión 1→2. V4 traduce sobres de mezcla y fundidos sin reiniciarlos, conserva dependencias y añade máscara temporal candidata y ajuste de 18 frames al motion existente. Regresión VPS 67/67 PASS. Gateway y staging reproducibles comprobados. Se corrigieron límite HTTP, arranque Chrome y timeout SSE; la exportación v4 larga sigue pendiente de resultado. Consultar unidad sues-q02-render-v4-20261119 y sus archivos de estado antes de reintentar. No hay dos revisiones A/V ni escucha acreditada ni aprobación del resultado. Q01 cerrado, Q02 activo, Q03–Q06 pendientes. Revisión compartida V1-2026-11-19-r12. V1 65 % estimado; no subir por tests.

## 19/11/2026 · V1 · Fase 5 de 5 · Punto 1 de 6 finalizado

[Q01 cerrado](docs/SUES_V1_FASE5_Q01_CIERRE_20261119.md). Reel 158404 recuperado, plan de siete escenas y anexo de 87 operaciones preparados y aceptados por Carlos en conversación. Se corrige el seguimiento conforme al criterio Q01 registrado al cerrar la fase 4. Próximo Q02 pendiente, ejecutar en copia y exportar, con preflight de transcripción, recursos y traducción íntegra antes de cualquier escritura. La fuente ASR sigue sin validación auditiva, las 20 operaciones no textuales requieren traducción y el Reel nuevo no tiene exportación. Revisión compartida V1-2026-11-19-r11. V1 65 % estimado, sin incremento por tests. Evidencia técnica anterior conservada.

## 19/11/2026 · Fase 5 · Q01 · Textos y prueba de máscara corregidos

El adaptador de la PR27 conserva ahora caja, contorno y peso tipográfico en títulos y captions. Los títulos admiten reloj de palabra verificado, conservando compatibilidad con títulos históricos. Se corrigió la comparación ID/SHA de las pruebas de máscara. **43/43 pruebas dirigidas con FableCut nativo PASS, cero omitidas**. Prueba adicional de los 63 captions y cuatro títulos del anexo 158404: 67/67 conservan tiempos, posición, dimensiones y estilo en memoria nativa. No se ha renderizado el Reel. Q01 sigue abierto por transcripción, recursos/composición y traducción de las 20 operaciones restantes y sus transiciones. [Evidencia y siguientes pasos](docs/SUES_V1_FASE5_Q01_PREFLIGHT_20261119.md).

## 19/11/2026 · V1 · Fase 5 de 5 · Q01 en curso

Carlos aceptó el plan creativo del Reel 158404. Verificación previa identificó los 14 recursos por SHA, confirmó estructura del anexo (87 operaciones y 168 palabras) y ejecutó 40/40 pruebas dirigidas con el motor FableCut real. El anexo todavía no es importable al contrato maestro. La transcripción contiene fragmentos dudosos que requieren escucha, y siguen pendientes la traducción sin pérdida, composición, ejecución en copia, exportación y doble QA. Q02 no se ha completado. [Detalle y continuación](docs/SUES_V1_FASE5_Q01_PREFLIGHT_20261119.md). Sin cambios en producción.

## 18/11/2026 · V1 · Fase 4 de 5 finalizada

[Recorrido del editor](docs/SUES_V1_FLUJO_EDITOR_FASE4_20261118.md). S01–S04: barra de tres pasos, entrada de plan común, ejecución privada del lote vinculado y correcciones sobre la revisión del proyecto. Chromium comprobó móvil y escritorio, conservar la otra capa, reabrir el trabajo y deshacer. El código se integra en la PR #27. La aprobación creativa y el render del Reel nuevo quedan en la fase 5.

Siguiente fase 5 de 5, punto 1 de 6 (Q01), usar un Reel real distinto para preparar el plan de revisión. V1 65 % estimado de avance funcional. Roadmap y Estado General deben compartir revisión V1-2026-11-18-r7.

## 18/11/2026 · V1 · Fase 3 de 5 finalizada

[Cadena real V17 → V18](docs/SUES_MASTER_DIRECTOR_V17_V18_E02_E05_20261118.md). E02–E05 verificados en un clon con el Master Director, el registro de un uso y FableCut MCP. Diez recibos y equivalencia exacta del proyecto V18. La pérdida de respuesta se reconcilió por lectura, el reintento no duplicó capas y la reversión restauró V17 en revisión 24. Los dos originales se conservaron. El registro y la decisión de QA son exclusivos de la copia privada.

Siguiente fase 4 de 5, punto 1 de 4 (S01), simplificar el recorrido del editor. V1 58 % estimado de avance funcional. Roadmap y Estado General deben compartir revisión V1-2026-11-18-r6.

## 18/11/2026 · V1 · Fase 3 de 5 · Punto 1 de 5 finalizado

[Caso técnico V17 → V18](docs/SUES_MASTER_DIRECTOR_CASO_V17_V18_E01_20261118.md). El almacén del Master Director conserva las 10 órdenes históricas en una revisión privada del contrato existente. Dos ejecuciones independientes dieron la misma revisión y el mismo resultado. Volver a aplicar las órdenes recuperadas al motor nativo en memoria reproduce exactamente el proyecto V18. Se conservan 5 recursos, solapes de V3, fotogramas clave y 18 tramos de A-roll.

Siguiente E02, punto 2 de 5, pendiente. Faltan comprobaciones del registro de recursos y capacidad del adaptador para las órdenes históricas. El borrador técnico no ha ejecutado ediciones vía Master Director. V1 52 % estimado de avance funcional. Roadmap y Estado General deben compartir revisión V1-2026-11-18-r5.

## 18/11/2026 · V1 · Fase 2 de 5 finalizada · Auditoría V17 → V18

[Informe y criterio de regresión](docs/SUES_AUDITORIA_CADENA_REAL_V17_V18_20261118.md). En un clon de la V17, FableCut aplicó las diez órdenes históricas y devolvió exactamente la V18 guardada (165 clips, 49 recursos, revisión 23). Audio idéntico en las previsualizaciones. El Master Director bloqueó el mismo archivo antes de emitir órdenes por `INVALID_STORY_SCHEMA`. Su adaptador también rechazó con `TRACK_OVERLAP` el destello real de V3. El reintento de la revisión 22 mostró conflicto y conservó la 23.

Fase 2, puntos D01 a D04 finalizados. Fase 3, E01 (punto 1 de 5), queda como siguiente. El criterio es pasar esas diez órdenes por la entrada canónica con cobertura por ID, los tiempos y la superposición conservados y el mismo resultado del montaje. V1 52 % estimado de avance funcional. Roadmap y Estado General deben compartir revisión V1-2026-11-18-r4.

## 18/11/2026 · V1 · Limpieza de ramas aparcada

Carlos aplaza la retirada de ramas hasta Q06, último punto tras validar la V1. Siguen las 82 ramas. El inventario conserva las 41 candidatas y sus SHA para revalidar en Q06. La PR #27 sigue como única línea de integración. Roadmap y Estado General verificados en revisión V1-2026-11-18-r3.

Activo D01: recuperar el caso real, su plan y revisión, el proyecto editable FableCut y sus pruebas previas. Siguiente D02: contrastar las operaciones con el montaje. V1 52 % estimado y etapa 2 de 4 al 72 %.

## 18/11/2026 · V1 · Ruta canónica y checklist operativo

La PR #27 es la línea de integración. La prioridad de producto es validar la cadena del Master Director con un plan existente sobre un único proyecto FableCut. [Roadmap Maestro y checklist](https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit) · [Estado General V1](https://docs.google.com/document/d/1L4gycV0LnKGhZ5VtWXAOlzVOzY3GDCp-qW1_X4A9B08/edit) · [Inventario de ramas](docs/SUES_V1_BRANCH_INVENTORY_20261118.md).

Auditoría sobre el grafo completo: 82 referencias, 49 históricas contenidas, 41 retirables tras revalidación, 25 protegidas, 15 divergentes restantes y una canónica. Las 41 referencias siguen en GitHub. Se conserva el estado de producción. Las pruebas de la V8 son evidencia auxiliar: la comparación de 546 fotogramas fue diagnóstica y la exportación nativa completa no terminó. El Roadmap contiene la próxima acción y sus criterios de cierre.

## 18/11/2026 · V8 · Selección de palabras vacía confirmada

Carlos indicó que no quiere añadir palabras destacadas. El plan de estilo conserva el texto y sus tiempos, con subtítulos blancos y los títulos y motions de referencia como capas independientes. El editor distingue la selección vacía guardada de la selección pendiente y evita bloquear la base de subtítulos por texto gráfico que no interviene en su énfasis. **12 pruebas dirigidas superadas**. La traducción de la apertura y el desarrollo a capas nativas y las dos revisiones de la V8 completa siguen pendientes. V1 52 %, etapa 2 de 4 al 72 %.

## 18/11/2026 · V8 · Corrección de voz verificada en exportación nativa

- [Checkpoint del render y la referencia](docs/SUES_V8_NATIVE_VOICE_RECHECK_20261118.md). V1 **52 %**, etapa **2 de 4 · 72 %**. FableCut exportó 88 frames del cierre en una copia privada; 88/88 idénticos al MP4 previo. Respecto al IN solicitado, la desviación de voz pasó de +399 ms a −1 ms.
- La referencia de 18,2 s coincide con el SHA registrado y se comprobó en 12 frames. El nuevo MP4 sigue siendo solo del cierre. Quedan la traducción de las capas anteriores, revisión del límite de voz a 18,2 s, nueva revisión creativa y dos pasadas audiovisuales. Sin despliegue.

## 18/11/2026 · PR #27 · Cortes del montaje y sincronía de voz V8

- [Checkpoint técnico](docs/SUES_PR27_V1_CUT_MAP_V8_VOICE_20261118.md). V1 **50 %**, etapa **2 de 4 · 65 %**. El preflight admite cortes lineales comprobados y conserva las palabras completas. VPS V18: 18 clips V1 y ocho anclas reales reproducidas en el tramo de prueba.
- En la exportación privada V8 previa se midió la voz adelantada ~0,38 s. El adaptador de muestra usa ahora el mismo reloj que la referencia V8; queda pendiente comprobarlo en el nuevo MP4.
- La revisión del plan maestro muestra inicio, fin y duración por registro. Chromium aislado verificó la vista con seis operaciones en tamaños móvil y escritorio, y la carga de Montserrat variable en FableCut. La tipografía del nuevo MP4 sigue pendiente de revisión.
- Verificado en VPS aislado: 11/11 mapa, 4/4 Asset-First y regresión de tiempos de V18. Próximo hito abierto: completar el plan ejecutable de V8 (18,2 s), confirmar la voz en el nuevo render y hacer dos revisiones A/V. El plan y el resultado completo siguen pendientes de revisión creativa. Sin despliegue.

## 15/11/2026 · ÚLTIMO REEL AUTÉNTICO (10/11) · HyperFrames/FableCut probado en clon V18, DISEÑO NO APROBADO

**Checkpoint más reciente:** [SUES_HF_REAL_REEL_V18_PRIVATE_QA_20261115.md](docs/SUES_HF_REAL_REEL_V18_PRIVATE_QA_20261115.md). El MP4 subido coincidió por **SHA-256 `0190efba90de1f7f73bfef8fc1c3822779a82c123225f77b68a50a9b31a77ad8`** con `recording-20261110-115912/original.mp4`; se reutilizó la V18 original (165 clips, 49 media, rev23, 55,5667s editados). QA en clon FableCut, sin sobrescribir ni publicar.

- HF render NATIVO con ocho palabras **reales del CTA**, tiempos convertidos desde clips V1 con cortes: inicio F1488 / 49,6s, duración151f, entradas [8,14,17,29] + [89,103,108,111]; MP4 HF SHA **`b5d47f9f366b4c86c52523395a582944c8ef8b08479c1092f92aa4fe3603f80f`**.
- FableCut MCP privado: CAS `addMedia+addClip` V9, proyecto166 clips/50 media, export real151f/30fps/1080×1920 con audio, SHA **`583e49dd53304e93112f785703beb953b2f8d0f7cc6e68bea52661ec7d6b053c`**; 151/151 PSNR mínima45,31dB. **FAIL VISUAL:** panel a pantalla completa cubre a Carlos, título y captions; **NO APROBADO**.
- 2.ª variante V3 blend screen 88 % en otro clon, preserva 165 clips, pero dos exportaciones no completaron archivo único comprobable y la captura compositor `fablecut_frame` falló `presented frame timeout`. **NO VALIDADA.** Mezcla sonora de primera preview vs V18 anterior también difiere; QA auditiva pendiente.
- El preflight de editor rama actual **todavía bloquea sourceTimeMap con cortes**; este QA usó un mapper limitado desde los verdaderos V1 del Reel, no se ha desplegado esa capacidad. Transcripción ASR 129 palabras `humanReviewed:false`.
- Siguiente: **selector humano real, guion A/V de todas las capas, rediseño sin interferencias, rebase formal de cortes, QA audiovisual doble, aprobación de Carlos por revisión, y despliegue separado**. Ningún Reel publicado/WAC ni servicio productivo modificado. No declarar 100 %.

## 15/11/2026 · HITO: Master Director aprobado (QA) → HyperFrames → FableCut CAS y 300/300 frames · NO DESPLEGADO

- **Checkpoint técnico más reciente:** [SUES_HF_MASTER_PRIVATE_APPROVAL_CAS_20261115.md](docs/SUES_HF_MASTER_PRIVATE_APPROVAL_CAS_20261115.md). Código de rama integra selección y guion A/V de palabra real con **una operación `hyperframes-word-motion-v1` en `sues-master-story/v1`**, nueva revisión CAS y comprobación de preflight inmutable antes de aprobación.
- **Flujo privado probado con autorización sintética de QA de un solo uso** mediante `MasterDirectorProjectStore`, `DirectorApprovalLedger`, HyperFrames nativo y FableCut MCP. Commit de **una transacción FableCut** con `addMedia+addClip` preservó vídeo original sintético 10s V1 y puso motion 151f en V2. Proyecto rev1→2; FableCut export normalizó a rev3 sin alterar las pistas.
- **MP4 final FableCut real y aislado:** 1080×1920/30fps/300 fotogramas/10s H264, SHA **`87903e0fff576a68ffcaa23738b121def90e3d1afa235fd9fb5a91443930f0d2`**. Comparados 151/151 fotogramas contra el motion HyperFrames (PSNR mín **45,19 dB**) y 149/149 restantes contra el original (mín **49,70 dB**). Recibo QA SHA **`d27f94ad33ade828e243d13933ddc523aaf7ad4d473166ac1f1720946e5aa00b`**.
- **102/102 tests Node PASS, 0 FAIL/SKIP** más prueba Chromium real 1/1 PASS (anclas palabra a palabra, validación de schedules). **Todo material, decisiones y autorizaciones de esta prueba son ficticios**: NO aprobación de Carlos ni Reel real, NO producción ni publicación. FableCut activo y SUES Server Console intactos.
- **Próximo bloqueo de producto:** host de ejecución auténtico con sesión humana verificada y permisos sobre clon de un Reel real, orquestación multioperación sin pérdida, sourceTimeMap con cortes y QA visual/audio real en 2 pasadas. El workflow de una sola operación HF está probado SOLO en QA, no instalado en el editor publicado.

## 15/11/2026 · Primer puente automatizable: editor palabras → HyperFrames · STAGING NO PRODUCCIÓN

- **Checkpoint más reciente:** [SUES_HYPERFRAMES_EDITOR_AUTOMATIC_PREFLIGHT_20261115.md](docs/SUES_HYPERFRAMES_EDITOR_AUTOMATIC_PREFLIGHT_20261115.md). Se añadió el preflight autenticado `POST /api/jobs/:id/motion-hyperframes-preflight`, botón en el panel de subtítulos existente, comprobación de cada palabra del caption contra la transcripción y exportación de variables HyperFrames y tabla A/V humana por 7 bloques.
- Preflight **solo lectura**: dos frases reales 4+4 palabras, reloj original ↔ editado **identidad sin cortes**, huellas fuente/job/timeline, clip 151f/30fps. Bloquea cualquier dato incierto o modo no soportado, siempre `creativeApproved:false`, `canExecute:false`, sin modificar Reel.
- HyperFrames v0.9.20 renderizó con `--variables-file --strict-variables` una composición sintética con anclas **F8/F16/F24/F30 + F86/F99/F108/F120**. MP4 H264 1080×1920/30fps/151f SHA-256 `095bc084c26959381bd0f79f4ea5b1fdfc6633a4f145cf2fb2e36d2388bcdb4f`; Chrome real confirmó opacidades diferenciadas F15/F19/F93/F102 y bloqueó esquema falso.
- **93/93 tests Node PASS + 1/1 test Chromium PASS** en VPS, sin editar producción. Código, informe y recibo QA guardados; último blob HTML fuente HF `a1fdbe7a3bfa5068fb1e9baec96459d9594f7bf1`.
- **Pendiente crítico:** aprobación creativa auténtica con `MasterDirectorProjectStore`, render exacto y puente al proyecto FableCut del Reel con CAS/ledger, mapas con cortes, QA imagen/voz completa y doble auditoría. La cadena FableCut demostrada previamente corresponde al **demo sin variables reales**, no a un Reel aprobado.

## 15/11/2026 · HITO: HyperFrames → FableCut EXPORTACIÓN NATIVA REAL (PRIVADA) · SIN PUBLICACIÓN

- **Checkpoint principal vigente:** [SUES_HYPERFRAMES_FABLECUT_NATIVE_CHAIN_20261115.md](docs/SUES_HYPERFRAMES_FABLECUT_NATIVE_CHAIN_20261115.md). Se resolvió el bloqueo de Chrome con trabajos transitorios systemd de QA (`LimitFSIZE=128M`, CPU/memoria/tiempo limitados), sin tocar los límites del servidor ni producción.
- **Render HyperFrames REAL:** H.264 1080×1920 30fps, 151 frames, 5,033333 s, SHA **`7f1ac8807b8275fde6d9d2b43fa440954484aae3588a477c17d35ba8395a9ec1`**. HF `check` retornó `ok:true`, con **76 avisos `line_unread` + 1 overflow de cámara** por revisar. No confundirlos con QA aprobada.
- **Importación y exportación FableCut REALES** mediante MCP y Chrome, exclusivamente en QA `fablecut-private-qa/hf-native-v2-mcp-qa` (puerto aislado 17942). MP4 FableCut 1080×1920/30fps/151 frames, SHA **`909eaaa37b41546fff29292403eedf677a63ee1c6eb2ea679347d42c5cfa9713`**; un vídeo editable como clip, animación interna solo editable en HyperFrames.
- **Comparativa:** 12 imágenes PSNR mínima 39,62 dB, y **151/151 fotogramas** comparados íntegramente mediante `ffmpeg psnr`: mínimo **45,36 dB**, media **46,97 dB**. Manifiesto verificador E2E firmado por SHA `1981c1e94328450a5419f8b97111a357e870b1edad4e2edf6d1d57d579a95161`; sin aprobación artística.
- Nuevos módulos de validación SHA, ffprobe, importación, exportación privada y comprobación íntegra. **Sin modificar FableCut publicado, V29, WAC, DNS, medios, ni servidores productivos.** Aún falta voz verdadera, plan A/V aprobado, QA integral en 2 pasadas, mapeo Master Director verificable y aprobación/públicación separadas.

## 15/11/2026 · Arquitectura corregida: HyperFrames dueño de motion, FableCut monta · 74/74 pruebas PASS

- **Checkpoint prioritario:** [SUES_HYPERFRAMES_PRIMARY_HANDOFF_20261115.md](docs/SUES_HYPERFRAMES_PRIMARY_HANDOFF_20261115.md). HyperFrames es el **motor principal** para motion (palabras/blur/máscaras/objetos/cámaras/easing). FableCut es el editor del Reel y consume clips verificados manteniendo una referencia al proyecto editable **en HyperFrames**; un MP4 no convierte sus parámetros internos en objetos FableCut editables.
- Se añadió **`hyperframes-motion-handoff.js`** (bloquea proxies falsos e importaciones prematuras) y `prepare-hyperframes-handoff.mjs` (hash de 3 archivos, verificación de fuente canónica, dimensiones/FPS/seek, salida review-only).
- Hallazgo y reparación en proyecto HyperFrames privado: runtime de segunda escena estaba obsoleto (blob `8d51c9905f9d36705c7e73efdcf710752018cca7`), sincronizado al SHA GitHub `6e3e8246e266a662d17c957e4dfe1f2c20cb225c`, copia anterior conservada. **Fingerprint vigente `e41dadf2a5130698b5c193155b2a7dd28a922ed4bfe28ced404e45e0b8a9dba3`**; manifiesto fuente privado `hyperframes-source-review-v3.json`; no hay render nativo aprobado.
- **74/74 pruebas dirigidas PASS** en VPS (65 anteriores +9 nuevas), `hyperframes lint` 0 errores/0 warnings, `timeline` 5,0333 s. `doctor` detecta actualización disponible, NO instalada. Chrome/HF runtime aún bloqueado `SIGXFSZ`; no producción, WAC, V29, FableCut productivo ni DNS modificados.
- Siguiente paso: render real HyperFrames en navegador autorizado sin límite de consola, QA frame-a-frame 1080×1920/30, y después handoff al montaje FableCut con source ID, derechos, aprobaciones y revisión/fingerprint. **No derivar un contrato FableCut nativo de un prototipo SVG.**

## 15/11/2026 · FableCut por fotogramas · 65/65 pruebas PASS · SIN DESPLIEGUE

- **Checkpoint prioritario:** [SUES_MOTION_FRAME_SAMPLED_QA_20261115.md](docs/SUES_MOTION_FRAME_SAMPLED_QA_20261115.md). Candidata `fablecut-frame-sampled-candidate.js` deriva keyframes **lineales por fotograma real** del motor SVG para radio, altura, cámara, rieles y opacidad de las 8 palabras, sin crear movimiento vertical del texto que no está en la fuente. Doble opacidad de rieles corregida. Dos comps, 8 textos y 5 figuras editables verificadas con `project-ops.js`/`motion.js` de FableCut.
- **QA real VPS:** suite dirigida 65/65 PASS, 0 FAIL/SKIP; fixture privado SHA-256 `359f0015c8a3d1f7f80844dcfdbeff468bc21614214d45fc3a69efbf6111b0bc` guardado sin sobrescribir el anterior. Chrome en VPS sigue bloqueado por `SIGXFSZ`; **no existe aún paridad visual nativa acreditada**, ni fuente de voz real o QA audiovisual doble. Sin cambios productivos.

## 15/11/2026 · Motion: palabras ancladas durante apertura + QA Chromium móvil/escritorio · SIN DESPLIEGUE

- Corregido bloqueo contradictorio de la frase siguiente: anclas con IDs reales pueden comenzar en **F81** durante apertura de líneas, sin exigir F91. `sequence-card-to-space.js` y `bind-sequence-to-speech.js` actualizados.
- Panel narrativo ahora invalida propuestas/exportaciones al editar texto o palabras y descarta respuestas asincrónicas antiguas. `web/narrative-motion-panel.js` actualizado.
- **60/60 pruebas dirigidas PASS en VPS**; Chromium local con **JS exacto SHA `011fdbb34b25e32e8a3c4573b467c9b213638fd0`** en viewports 390×844 y 1280×920: 0 errores JS/overflow, selección fuente 3/5, exportación y reversión por cambios. **Fixture HTML + API ficticia:** no es prueba visual del editor publicado.
- Repetir la QA con `tests/browser/narrative-motion-playwright.py` si se dispone de Chromium+Playwright autorizados; `hyperframes check` en VPS sigue bloqueado por SIGXFSZ. No hay render nativo validado, paridad ni aprobación; leer [checkpoint](docs/SUES_MOTION_HYPERFRAMES_FABLECUT_20261115.md).

## 15/11/2026 · Motion graphics: HyperFrames instalado + composición FableCut editable en fixture · SIN DESPLIEGUE

- **Checkpoint técnico prioritario:** [SUES_MOTION_HYPERFRAMES_FABLECUT_20261115.md](docs/SUES_MOTION_HYPERFRAMES_FABLECUT_20261115.md). Reutiliza el repo y la rama `feat/speech-linked-motion-grammar-20261115`.
- HyperFrames real **v0.9.20** y GSAP preinstalados en VPS. Se preparó escena HTML determinista y `hyperframes lint` pasó **0 errores/0 warnings**. La validación de runtime con Chrome quedó BLOQUEADA por `SIGXFSZ` de la consola (`ulimit -Hf 1024`); **no afirmar render HyperFrames**.
- Se corrigió transición F81/F89/F104/F112 y separación de palabras a **84 px** tras revisión visual del proxy. **Proxy r2** H.264 540×960, 30fps, 151 frames, 5,033s, SHA `b2da9bfbb651739408377ac70854f7f453e8de7b1263ee8cf33d6277993e9bb3`. No es máster.
- **FableCut nativo:** candidata `fablecut-editable-candidate.js` probada en `project-ops.js` y `comp.js` reales, sobre proyecto temporal en memoria: 2 comps, 8 textos y 5 figuras editables, 14 clips virtuales. Fixture solo QA, SHA `e6275c414b5a855ee45b3908f4bd282af8f25b74daaf3cf52ffe9f14c49474aa`. **No validado pixel a pixel** (blur, clipping, degradados, tipografía y easing) ni admitido aún por contrato canónico Master Director.
- **54/54 tests dirigidos PASS en VPS** de los módulos relevantes (no suite histórica completa); FableCut, UI y WAC productivos intactos. Siguiente: renderer/browser QA autorizado, comparación visual de FableCut comp, anclas de voz reales y mapping canónico con protección de revisión/ledger. No publicar.

## 15/11/2026 · SUES Motion narrativo · selector existente → revisión A/V, QA en VPS · NO DESPLEGADO

- **Rama aislada:** `feat/speech-linked-motion-grammar-20261115`; último checkpoint: [docs/SUES_MOTION_NARRATIVE_VPS_INTEGRATION_20261115.md](docs/SUES_MOTION_NARRATIVE_VPS_INTEGRATION_20261115.md).
- **Continuidad entre agentes/chats:** [AGENTS.md](AGENTS.md) y [instrucciones del proyecto ChatGPT listas para incorporar](docs/CHATGPT_PROJECT_INSTRUCTIONS_SUES_VIDEO_20261115.md). Las instrucciones de la interfaz ChatGPT deben incorporarse manualmente si no se dispone de una acción de edición autorizada.
- SUES Server Console MCP ejecuta comandos en VPS real srv1841004; no se necesita Desktop Commander. Código de revisión narrativa integrado en la rama (panel de subtítulos existente, endpoint autenticado POST, adapter de índice original a palabra y reporte A/V). **Solo lectura y revisión: no ejecuta efectos ni monta un Reel.**
- **28/28 tests dirigidos PASS en VPS** con Node 22.23.3: autenticación, CSRF, origen, fingerprint, mapping de palabra, regresión HTTP wiring UI y simulación DOM de selección/revisión; sintaxis JS verificada. No representa suite global ni QA visual.
- Disco ~90 % ocupado; consola impone `ulimit -Hf 1024`, por lo que la prueba usó copia parcial aislada, sin descargar medios ni tocar worktrees existentes. QA de navegador real y dos pasadas audiovisuales pendientes.
- **No desplegar, no publicar, no tocar FableCut/Originales/V29/WAC/DNS.** Siguiente: UI/browser QA aislada y, solo con evidencia de un bruto real y aprobación, mapping nativo sin pérdida.

## 11/11/2026 · Supervisor nativo y skill sincronizada · NO DESPLEGADO

- **Código en rama PR27**: `87e4244d92d60f771dcabda6306a90178bdc8912` conecta el runner privado de FableCut al supervisor de evidencias existente mediante `qa-prepare` y `qa-verify`. Manifiestos exactos de fuente/timeline/revisión/decisión/plan/proyecto/MP4, comprobación de IDs antes y después de ejecutar, codecs/duración y evidencias de fotogramas/audio, dos informes de revisión y cola de incidencias con operationId/corrección. Sin reescritura autónoma, sin publicación. [Manual](docs/engine-next/FABLECUT_NATIVE_SUPERVISOR_20261111.md).
- **11/11 tests unitarios nuevos PASS** en Node 22.16.0, fixtures sintéticos; blobs de módulo y tests coinciden exactamente con los de GitHub (8c6bdd473a5c5849b452c59ba3887f53a174d420 / 051e0abbbe90f67d0a1f4fc4887328297ff123f8). Los 63/63 anteriores pertenecen al corte del 10/11, no se suman como una suite conjunta ejecutada. Aún no se ha probado este runner nuevo contra FableCut del VPS ni se ha hecho una auditoría artística real.
- **Skill privada SUES AI Film Director 1.7.1 publicada y releída mediante Plugin Creator**, identidad y 16 archivos anteriores preservados (17 con referencia nueva); `FABLECUT_NATIVE_HANDOFF_20261111.md` obligatoria junto a políticas anteriores. La sesión que abrió con 1.7.0 puede conservar caché; consultar release vigente, no afirmar refresco no verificado.
- **Bloqueo real:** dispositivo VPS conectado, pero cuota mensual Desktop Commander agotada. No repetir llamadas, no reconectar para eludir cuota. La copia privada de VPS y producción no se han tocado en este corte. GitHub sí está actualizado; el worktree privado debe reconciliarse con HEAD cuando exista acceso autorizado. No desplegar, no tocar B05 paralelo ni original/Reel publicado.
- **Siguiente acción exacta:** ejecutar la regresión dirigida y nuevos modos QA en un clon privado con acceso autorizado, verificar política/derechos de masters y completar un bruto nuevo auténtico con transcripción, selección interactiva, plan A/V aprobado, montaje editable, render y dos pasadas reales. Faltan rotoscopia integral, híbrido lossless, supervisor semántico autónomo y corrección automática validada. No atribuir 100% ni aprobación creativa.

## 10/11/2026 · Plan canónico → lote aprobado → exportación privada

Conexión real store/ledger/MCP, HTTP privado opt-in, 20 órdenes nativas, subtítulos progresivos, fundido entre capas, efectos visuales. 59/59 regresiones dirigidas; V27 reconstruido 217 clips/1089 frames, V29 completo 72,6 s con filtros históricos y SSIM 0,976504 (no todos efectos editables). Nuevo runner privado prepare/run; QA 015 tres operaciones confirmadas. [Manual y límites](docs/engine-next/FABLECUT_STORY_AUTOMATION_20261110.md). Sin despliegue.

## 10/11/2026 · Puente FableCut por lotes, exportación nativa y MCP real

Adaptador privado generalizado, catálogo de órdenes y búsqueda de recursos; copia V26 169→170 clips, MCP rev124→125 con CAS y autorización técnica. QA 002: export real 1080×1920, 30 frames + AAC estéreo; 28/28 tests dirigidos, negativos y undo. Sin despliegue; aprobación creativa, integración ledger HTTP, mapping completo y reconstrucción V29 pendientes. [Manual y evidencia](docs/engine-next/FABLECUT_COMMAND_ADAPTER_20261110.md).

## 06/11/2026 · MP4 1080 privado para revisión en rama

Los flujos Remotion y mixto admitidos pueden solicitar un MP4 privado de 1080×1920, con verificación técnica, trazabilidad y etiqueta de revisión no final. Se han probado la API y la interfaz con datos simulados y una salida sintética Remotion de seis fotogramas; la memoria, un Reel real, el supervisor semántico y la aceptación siguen pendientes. Sin despliegue. Detalle: [checkpoint](docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md).

## 06/11/2026 · Evidencia de audio para supervisión

La escucha de supervisión usa una conversión estéreo y muestra pico, RMS y muestras próximas al máximo por canal; son medidas objetivas, no QA. Cinco pruebas con FFmpeg pasaron. Se midió también el audio convertido de la previsualización real V6B existente, sin generar otro Reel; la escucha y aceptación completas siguen pendientes. [Checkpoint](docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md). Sin despliegue.

## 06/11/2026 · Ajuste centrado de medios en rama

Las capas Remotion de imagen y vídeo aceptan `fill`, `contain` y `cover` con encuadre centrado. Pruebas dirigidas 37/37, TypeScript y comprobaciones por píxeles en imágenes y un fotograma de vídeo sintéticos; no equivale a QA de movimiento ni Reel real. La skill privada se sincronizó a 1.5.6. [Checkpoint](docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md). Sin despliegue.

## 06/11/2026 · Plan externo: fidelidad del montaje mixto

El grafo conserva tiempos originales y el motor mixto detecta solapamientos antes del redondeo. Se bloquean combinaciones con orden visual nativo/Remotion no implementado en vez de alterar el efecto. Regresión dirigida 174 aprobadas y 5 omitidas; una omitida pasó aparte con FFmpeg sobre material sintético. La composición completa, supervisor, exportación y prueba de Reel real siguen pendientes. Véase [checkpoint](docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md). Sin despliegue.

## 06/11/2026 · Generador local opcional de borradores maestros

En rama existe un adaptador para Qwen3/llama.cpp local conectado al mismo flujo de revisión; está desactivado por defecto y no despliega ni aprueba planes. Una prueba sintética con modelo real produjo JSON; una prueba HTTP guardó un borrador que la revisión bloqueó. Los límites, evidencia y trabajo pendiente constan en [checkpoint activo](docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md) y [manual](docs/SUES_MASTER_LOCAL_GENERATOR_20261106.md).

## 05/11/2026 · Master Director: máscaras candidatas y muestras de supervisión

Estado vivo: [checkpoint activo](docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md). En rama se ha conectado generación local opt-in de máscaras candidatas y preparación independiente de muestras para revisión. No se aprueban máscaras ni se certifica calidad automáticamente. Última regresión: 163 PASS, 0 FAIL, 5 SKIP en host; pruebas específicas omitidas ejecutadas aparte en entornos indicados en el checkpoint. No se ha desplegado ni generado un Reel nuevo. Pendientes planificación IA gratuita real, verificación de máscaras, supervisor audiovisual autónomo, integración integral y aceptación creativa.

## 05/11/2026 · Master Director: continuidad en rama

Estado vivo y detalle de commits: [checkpoint activo](docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md). Entrada IA preparada para proveedor gratuito inyectable, aún sin proveedor configurado; ambas entradas comparten borrador y revisión. Trazabilidad inmutable y comprobación nativa previa a aprobación incorporadas. Pendientes efectos, máscaras, editabilidad integral, supervisor audiovisual y validación posterior. Sin tests ni renders por decisión de Carlos; sin despliegue ni gasto.

## ESTADO ACTIVO · 05/11/2026 · SUES MASTER DIRECTOR

**Consultar antes de continuar:** [CHECKPOINT ACTIVO ÚNICO](docs/SUES_MASTER_DIRECTOR_CHECKPOINT_ACTIVO.md). Es la fuente de verdad operativa del trabajo de Work/chat normal; contiene 50 % estimado global, evidencia, bloqueos, única rama escritora, permisos y próxima acción. **Todo lo que aparece a continuación es HISTÓRICO** y no debe sustituir el último checkpoint. Reglas aprobadas: [20 reglas](docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md). No hay despliegue de este cerebro.

## 04/11/2026 · MASTER DIRECTOR · PREVIEW EN ENTORNO AISLADO · MISIÓN INCOMPLETA

- Servidor/UI de desarrollo integran revisión, versiones y preview Remotion privada con aprobación, validación de fuente CFR30/cortes, bloqueo de cambios, auditoría técnica, reproducción autenticada e idempotencia. No habilitado en producción: política y configuración real faltan; no es exportación final.
- Prueba HTTP completa de 24 s sintéticos: render 720 frames+audio, auditoría de decodificación, Range e idempotencia PASS. Sobre copia normalizada de 158404 se verificó fuente de 65,1 s y se renderizó/auditó solo un segundo de prueba; no Reel creativo. Prueba técnica de 65,1 s en curso: no reclamarla hasta final.
- 130/130 Node dirigidas PASS en copia productiva con parche selectivo; navegador desktop/móvil con fixtures PASS. Suite amplia anterior 525/529 con salvedades documentadas, falta repetir final. Detalle y siguientes pasos: docs/SUES_MASTER_DIRECTOR_WORK_PREVIEW_20261104.md.
- Sin despliegue, gastos API, publicación ni cambio de skill. Faltan evidencia de masters, máscaras dinámicas, compositor integral, recursos, backup portable, QA audiovisual doble y aprobación creativa.

## 04/11/2026 · MASTER DIRECTOR · UI Y PROTOTIPOS MULTICAPA · INCOMPLETO

- Añadida revisión/decisión en UI de desarrollo, selección de versiones y edición reversible parcial de capas (posición, tamaño, tiempos, texto, opacidad, volumen y origen según corresponda). No se inicia render y la política real continúa bloqueada. Prueba Chromium PASS escritorio y móvil con fixtures, incluida recuperación de versión.
- Prototipo Remotion añade vídeo silencioso con entrada exacta y compone vídeo+texto Montserrat+SFX: MP4 sintético de 30 fotogramas comprobado por fotogramas y RMS; no equivale a editar un Reel real ni a verificación de audio profesional. Máscaras estáticas probadas, dinámica aún pendiente.
- 121/121 pruebas Node dirigidas PASS sobre copia productiva y parche selectivo; suite amplia anterior 525/529 con fallos y limitaciones documentadas. No hay deploy, publicación ni gastos API. Informe: docs/SUES_MASTER_DIRECTOR_WORK_UI_CAPAS_20261104.md.

## 04/11/2026 · MASTER DIRECTOR · CONTEXTO Y REMOTION EXPERIMENTAL · INCOMPLETO

- Adaptador del servidor basado en 20 reglas literales, SHA y biblioteca; política real permanece bloqueada hasta documentar derechos de los tres tapices, que existen en biblioteca pero carecen de metadatos V2. Revisiones invalidadas cuando cambia evidencia; edición de parámetros crea otra versión inmutable. No hay aún UI editable ni backup TAR.
- Remotion experimental: texto con fuente real por hash, imagen estática, máscara alfa estática y audio con tiempos/ganancia; reproduce prototipos aislados, rechaza lo no soportado. Sin integración de vídeo completo, máscara dinámica, mezcla completa o QA creativo de 158404.
- Prueba amplia intermedia 525/529: dos fallos reproducidos en base productiva por expectativas antiguas de tests, uno falta de git en contenedor (host PASS), otro documento no copiado en QA (corregido); no declarar regresión limpia. Detalles: docs/SUES_MASTER_DIRECTOR_WORK_AVANCE_CONTEXT_20261104.md.
- Sin producción, deploy, publicaciones, gastos de API ni cambio de skill. Misión no terminada; mantener restricciones originales.

## 04/11/2026 · MASTER DIRECTOR · INTEGRACIÓN PARCIAL DE BACKEND Y PRUEBA REMOTION · SIN DESPLIEGUE

- Nuevas rutas autenticadas de borrador, revisión, decisión y grafo de capas; revisiones inmutables y bloqueo ante cambios. Sin proveedor real de confianza quedan bloqueadas; el ejemplo positivo de tests es sintético. Aún no hay ejecución/render ni UI editable.
- Adaptador experimental Remotion limitado a texto posicionado y keyframes lineales; rechaza máscaras y efectos no soportados. TypeScript PASS y un fotograma sintético renderizado e inspeccionado por píxeles; no demuestra edición de un Reel ni sonido.
- 107/107 pruebas dirigidas Node PASS en copia aislada del código productivo con parche selectivo. La rama y el servidor productivo difieren; no copiar el servidor entero. No deploy, gasto o publicación.
- Limitaciones, resultados y continuación exacta: docs/SUES_MASTER_DIRECTOR_WORK_AVANCE_BACKEND_20261104.md. Siguen pendientes registro confiable real, UI, capas editables, motor integral, QA audiovisual y regresión completa.

## 04/11/2026 · SUES MASTER DIRECTOR · AVANCE VERIFICADO · SIN DESPLIEGUE

- **20 reglas creativas aprobadas verbalmente por Carlos**, capturadas en docs/SUES_MASTER_DIRECTOR_REGLAS_APROBADAS_20261104.md. El borrador anterior es histórico; no pedir reaprobarlo.
- Continúa la rama feat/master-director-story-orchestration-20261104 / PR borrador #27. NO mezclar con main ni con producción.
- Código nuevo/actualizado: master-director-gate, master-director-rulebook, master-director-story, master-director-narrative-arc, master-director-orchestration, master-director-workflow, master-director-native-bridge, master-director-native-review y master-director-layer-graph, con tests.
- Comprobación real sobre una **copia aislada** del editor productivo: 96/96 pruebas Node PASS (director, importador externo y adaptador creativo).
- Pruebas de exportación real con FFmpeg en contenedor temporal de la misma imagen de producción, red desactivada, CPU limitada: 12/12 PASS (máscaras, MP4, audio multicapa, cortes y exportación). No confundir con un vídeo completo ya dirigido por el nuevo cerebro.
- Producción Docker actual: /app montado desde /opt/sues-video-setup/release-mobile-layers-20261030; este directorio NO tiene .git. No modificado.
- **Todavía falta** integrar registro/autorizaciones reales de backend, motor Remotion con capas editables en UI, supervisor QA audiovisual independiente y dos auditorías completas de un vídeo generado mediante este cerebro. La skill continúa sin cambios y no se han consumido créditos API.
- Handoff específico para Work: docs/SUES_MASTER_DIRECTOR_WORK_HANDOFF_20261104.md. Solo cuando corresponda, continuar en Work; no crear otro editor ni duplicar módulos.

## DESARROLLO · unificación de reglas y narrativa del cerebro · 04/11/2026
- Rama: feat/master-director-story-orchestration-20261104; PR borrador #27 contra feat/master-director-gate-20261104.
- Se implementaron: master-director-rulebook.js (ámbitos, aprobaciones verificadas, conflictos no resueltos), master-director-story.js (narrativa integral, metáforas distantes, recursos existentes/por generar, palabras/timings, pruebas obligatorias) y master-director-orchestration.js (puerta única de reglas → historia → gate con snapshot exacto para invalidar aprobaciones).
- QA real de lógica: Node.js v22.23.3, 40/40 PASS; tests combinados del gate y los 3 módulos nuevos en /tmp/sues-master-director-story-qa-20261104. No se han ejecutado suite completa de la app ni pruebas audiovisuales reales.
- No hay merge, deploy, cambios de skill, consumo API, render nuevo ni modificación de proyectos. Las 20 reglas en lenguaje natural esperan aprobación de Carlos.
- Siguiente: verificar árbol efectivo de producción, crear adaptadores por capacidad y backend autenticado, comprobar resultado MP4/preview/capas/audio con 2 QA integrales, obtener aprobación creativa y solo entonces adaptar la skill.

## EN DESARROLLO · cerebro coordinador narrativo · 04/11/2026
- Rama aislada: feat/master-director-story-orchestration-20261104; PR borrador #27 contra feat/master-director-gate-20261104.
- Código nuevo: src/master-director-story.js; traduce historia global, metáforas entre escenas y recursos verificados a sues-master-director/v1; propone creación si falta un recurso ideal, sin generar ni degradar.
- Contrato en lenguaje natural: docs/SUES_MASTER_DIRECTOR_REGLAS_PARA_CARLOS_20261104.md (20 reglas; PENDIENTE APROBACIÓN).
- QA comprobada: 24/24 Node.js 22 en copia temporal aislada (9 gate + 14 narrativa). NO es suite de la aplicación ni auditoría audiovisual; no conectado al renderer ni editor web. Sin merge, deploy, cambio de skill, consumo API ni alteración de originales.
- Siguiente: aprobación de reglas maestras; adaptador seguro al formato del editor y Remotion, capacidades verificadas por motor, supervisor autenticado, QA de vídeo real y doble auditoría limpia. Solo después adaptar skill.

## Publicado · correcciones de auditoría · 29/10/2026

## VIDEO COMPLETO 158404 · V2 GRÁFICOS SUSTITUTIVOS · 04/11/2026

- Rama `feat/remotion-cta-poc-20261103`: tres vídeos sin licencia comercial acreditada (R2, R5, R6) sustituidos por composiciones propias sobre los tapices: RECHAZO/MIEDO (26,70–29,13), RECONOCER (47,80–49,82) y ENCAJAR (53,10–55,22). Se mantienen R1, R3 y R4 de Pexels con procedencia documentada.
- Fuente original 65 s + cierre Maestro V3 11,307 s = 76,3 s previstos. Primer MP4 V1 sí renderizado, pero **V2 corregido NO renderizado ni publicado**.
- Fotogramas V2 y compilación TypeScript verificados en VPS **antes** del último ajuste de máscara, pendientes de repetición después del ajuste. Tests estáticos y documento de reanudación guardados en GitHub.
- Bloqueo: Desktop Commander Remote del VPS `srv1841004` dejó de contestar aunque aparecía Online con último contacto caducado. No reiniciar ni desplegar a ciegas. No cambiar porcentajes ni aceptación global.
- Siguiente: restablecer acceso; ejecutar tests y renders reales; inspeccionar audio, máscaras, títulos y zonas seguras; registrar MP4 en biblioteca privada; solicitar aceptación creativa a Carlos. Ver `experiments/remotion-cta/docs/EDICION_158404_V2_20261104.md`.


## CTA MAESTRO V3 · CIERRE REUTILIZABLE · 03/11/2026

- Cierre `SUES_CTA_MAESTRO_V3_OM_GALAXIA_POP.mp4` guardado como **recurso de tipo vídeo en la biblioteca privada del editor** (SHA-256 `3b66fc2bcf2393cc77e42bf8b7fb706b7d4f6c9c2ab2c9e1d6453fe6dcb08b49`). Tamaño: 1080×1920, 30 fps, 11,307 s, H.264/AAC.
- Dos elementos reutilizables, con fondo transparente, registrados aparte: OM dorado `3868704729815c51ab84fea96e23e0eff31213b58134e6e3be49eff947863d98`; galaxia dorada `a9eb0f9b1f07fee8ecd6bf186d09e89090735c738634fb84371463fdb78e2b28`.
- MP4, fuentes V3 y manual de reutilización almacenados en Drive `05_OUTROS · BRAND KIT/03_Cierres y llamadas a la acción`. PNG originales y WebP optimizados en `03_MOTION GRAPHICS/07_ELEMENTOS_TRANSPARENTES`.
- Su orden final es **primero «Sígueme» con Instagram y después el logotipo auténtico**. Código/recurso todavía aislado de producción. El clip se puede utilizar como vídeo pre-renderizado, pero NO es todavía plantilla paramétrica integrada en Remotion del editor productivo.
- Sin merge ni despliegue. Sin cambios en los porcentajes de avance de la V1. Siguiente: nuevo plan y montaje del vídeo completo cuando Carlos lo solicite, usando este cierre.

## BIBLIOTECA DE TAPICES · 03/11/2026 (RAMA AISLADA)

- Tres fondos verticales de motion graphics aprobados y guardados como imágenes privadas del editor (`/state/jobs/assets`, derechos declarados `owned`); inventario 228 → 231. Ningún vídeo original ha sido modificado.
- Originales en Drive `03_MOTION GRAPHICS/06_TAPICES_MAESTROS`; copias optimizadas WebP en `experiments/remotion-cta/public/backgrounds`, rama `feat/remotion-cta-poc-20261103`.
- 19 capturas de referencia analizadas: `experiments/remotion-cta/docs/ADN_REFERENCIAS_VISUALES_20261103.md`; tokens provisionales en `src/style-reference-draft.json`. No hay aprobación final de tipografías o tamaños, ni se ha desplegado una plantilla.
- Contenedor de producción `sues-video-editor` mantenido activo, sin reinicio ni merge. La V1 y auditorías 0/2 no se dan por cerradas.
- Siguiente: elegir segunda familia tipográfica, contrastar sobre ejemplos reales, añadir selector de tapiz a composición Remotion y auditar previsualización/MP4.
- Variante de tapiz blanco/dorado solicitada, pero pendiente de generar y aprobar. Sin bloqueos técnicos para las tres imágenes ya guardadas.


Release de aplicación cb7ec1a75451932778fc7295e09824fb6a615ccc, rama fix/audit-closure-20261029.
Worktree /opt/sues-video-setup/audit-fixes-work-20261029; producción /opt/sues-video-setup/release-update.mvl0mllf.
Se corrigieron el guard tras postEdit, sustitución explícita de B-roll/zooms, integridad
de la caché con timestamps precisos y despliegue verificable. HEAD/árbol/marcador coherentes.
Actualizador conserva1900MiB/0,8CPU observados, rechaza análisis activos y pausa solo Whisper
inactivo durante la copia para evitar cambios del heartbeat. Primer intento se recuperó
correctamente al detectar copia inconsistente; segundo pasó con backup verificado.
Backup update-backup-20261029-182329-365998; evidencia audit-full-20261029.

423/423 runtime,2/2 Git,14tests updater,6helper recursos y2catálogo. Navegador aislado
móvil/escritorio sustituye B-roll explícitamente sin alterar padre. QA pública móvil/
escritorio/PWA posteriorPASS. Nueva subida12s,Whisper real16palabras,CALMA,corte2–3s,
export11s1080x1920,decode/fuente/RangePASS; otra mezcla aislada con3SFX realesPASS.
No atribuir calidad creativa DOPAMIN a esas pruebas técnicas.

Catálogo privado y MISMO JSON en Drive actualizados:3.390fichas (1.326nuevas metadata),
215medios instalados/214seleccionables;31SFX con18nuevos únicos.20selecciones fuente
incluían duplicados: no anunciar20recursos distintos.2.064fichas anteriores y exclusiones
preservadas;738candidatos vídeo elegibles sin cambios. No afirmar revisión visual completa.
39proyectos anteriores conservan hashes; después comenzó un render nuevo ajeno a la QA,
total40. No cancelarlo ni reiniciar/desplegar mientras haya trabajos activos. Guard de
actualización idempotente rechazó correctamente la operación en ese momento.

Pendientes: controles universales gráficos/motions, preview exacto universal, música por
segmentos, revisión/adaptación completa de biblioteca y recuperación MODNet/cámara general.
GeminiV1.1 y clon separados. No cerrar V1 sin aceptación creativa de Carlos. Siguiente bloque:
comprobar cola/SHA reales y continuar controles manuales; no repetir A01/A02 ni importación.
Roadmap: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
Informe: https://docs.google.com/document/d/1_Ny2nqYFnGq1kVt6xDtH59yGPUs8wEZFlakcBMxKZa4/edit

---

## PUBLICADO · Dividir/borrar + edición móvil en vivo + PWA · 29/10/2026

Última revisión de código publicada:53e8c2e09172951ecec5b94b07d2033c137c0087, árbol c7120b50a6fdb078152ff9d1695bc4e68da68c64. Incluye la compatibilidad MPEG4 de la vista interactiva. Pruebas finales6/6 de compatibilidad/controles y nueva QA HTTPS móvil/escritorio/PWA pasan; diagnóstico público sin errores de medios. El MP4 y su motor no cambiaron con esta corrección.

Base del motor de montaje verificada:41479cd4c4f93badf3f7e38aabd128a9eae20cad, rama feat/montage-split-delete-20261029, árbol de código e15e2dd6f56f349674dba21b807c8f3f07f58b9c. Integra móvil/PWA047b26f y táctil697837b. main no representa el código activo. VPS srv1841004, contenedor sues-video-editor, /app desde /opt/sues-video-setup/release-update.78zyka2k. Worktree /opt/sues-video-setup/touch-editor-work-20261028. Documentación posterior puede tener otro commit sin cambiar el motor. Guía docs/SUES_MONTAGE_SPLIT_DELETE_20261029.md.

FUNCIONA: Dividir aquí, seleccionar/borrar tramo con cierre de huecos, restaurar, Deshacer y recuperar borrador. Las pistas, campos de inicio/final, vista nativa, fragmentos y base interactiva traducen sus relojes. La composición completa y la mezcla reciben los mismos cortes finales; se conservan las capas, su fase y los IDs de captions. No se reutiliza un MP4 aplanado como fuente. Aplicar cambios crea una versión nueva. Hasta60 rangos y120 divisiones; fotogramas30fps y mínimo0,5s conservado.

COMPATIBILIDAD DEL NAVEGADOR: detectado el B-roll «Billetes de euro · superficie» en MPEG4 Part2, que el navegador no admite aunque FFmpeg lo exporta. Se preparan derivados H.264 privados de los vídeos incompatibles para la vista interactiva, con duración/hash comprobados y original intacto. Se reutiliza la base limpia existente; el motor de exportación no cambia. Prueba real MPEG4→H.264 y no duplicación de H.264 pasan; ver codec-tests.log y media-diagnostic.json.

MÓVIL/PWA: el texto libass real cambia al mover/ampliar, con inspector legible y propiedades secundarias plegadas. Se conserva la máscara y sus controles. Manifiesto/iconos192/512/maskable, standalone y botón de instalación. Worker sólo guarda shell/código; ninguna API ni medio privado en caché; requiere conexión. No se ha instalado físicamente en el móvil de Carlos.

PRUEBAS:417/417 suite runtime y2/2 Git en host. Regresiones finales4/4 de render,6/6 UI/recursos y7/7 contexto/plan;check/diffPASS. QA móvil y escritorio: dividir/borrar/deshacer/recarga/salto interactivo y exportación completa. Sintético12→9s: píxeles y cambio de tono440→880Hz en el reloj correcto; fragmento atraviesa la unión sin perder fase. Exportación real aislada 7c482ed0-0b36-4089-adc7-4afd9fcc82eb:69,891s previstos,69,9s codificados,1080×1920H.264/AAC,35997271bytes,SHA256 333a069159d37f909e01a370620a4539498fcf0c53e84195820e32a55ae2fa7c. Decodificación íntegraPASS y fuente intacta. Siete comparaciones frente al padre: error medio de píxel0–0,476/255; máscaras verificadas visualmente. Tres ventanas de mezcla alineadas con correlación0,9987–0,9996. Verificación técnica de audio, sin escucha subjetiva ni aceptación creativa automática. El borrado8–9s fue QA aislada; no modificó el montaje productivo de Carlos.

PRODUCCIÓN:37archivos instalados/verificados y39proyectos previos conservados por hash. Reinicio sólo del editor; HTTPS/sesión200,Range206/1024bytes,salud disponible,0OOM. QA autenticada pública móvil/escritorio pasa dividir/borrar/recuperar/vista en vivo, sin erroresJS ni overflow. PWA CDP sin errores de instalabilidad; sin API privada en caché. Borradores de QA públicos retirados; ajustes del proyecto04096518-c6e0-469e-96b6-7290fa48356b y fingerprint intactos; ninguna aprobación enviada. Rollback incremental /opt/sues-video-setup/montage-file-rollback-20261029; código restaurado independiente arrancó con sesión/saludPASS antes de publicar. Evidencias privadas /opt/sues-video-setup/montage-qa-20261029.

LÍMITES Y CONTINUIDAD: no declarar selección/posición/tamaño libre universal de todos los motions ni compositor exacto instantáneo de todas las capas. Las transiciones, capas heredadas y filtros de voz indicados por la UI requieren fragmento para revisión exacta. La exportación completa sigue siendo un render. La interpretación creativa libre y la API Gemini son V1.1; ninguna llamada ni gasto nuevo. La biblioteca no se reauditó en este bloque. Aceptación creativa de V1/F9 corresponde a Carlos;48% histórico sin recalcular. Siguiente acción: probar un ajuste real desde Ajustar y valorar el resultado; no pedir nueva subida del original ni rehacer dividir/borrar. Antes de editar, verificar esta rama y hashes activos.

---

## Edición móvil en vivo y PWA · 29/10/2026 · validación aislada PASS, pendiente despliegue

Ver docs/SUES_LIVE_MOBILE_PWA_20261029.md. Nueva rama feat/live-mobile-preview-20261029. El marco mueve/escala ahora el texto libass real, con controles principales legibles y capas solapadas separadas. Color/tamaño/máscara comprobados en píxeles y fragmento FFmpeg real. PWA: manifiesto/iconos/CSP/instalación y shell offline verificados en Chromium persistente. No caché de medios privados; conexión requerida. 414/414 runtime +2/2 host iniciales,11/11 pruebas afectadas finales. Producción aún conserva697837b hasta despliegue verificado. No cierre CapCut/V1; dividir/borrar pista principal y gestos universales siguen pendientes. Sin Gemini ni costes externos.

## Continuación asistida · 28/10/2026

Vista previa exacta del borrador desde Ajustar: fragmento de 4 s (API 0,5–8 s), 540×960, motor audiovisual existente, caché de 4 fragmentos, cancelación y exclusión de render concurrente. No crea ni valida una versión final. El botón Guardar y generar mantiene la exportación completa y las versiones anteriores. No hay llamadas nuevas a Gemini ni servicios de pago.

Pruebas: 408/409 en contenedor, única prueba Git ausente pasada en host (2/2); check PASS. Test real de fragmento verifica cortes 4–6 s, remapeo a audio 880 Hz, Range, persistencia, caché y cancelación. Navegador móvil/escritorio sin errores y con borrador conservado; 30,2 s primer fragmento con reproducción principal ya lista, 1,85 s reutilización. Se inspeccionó el fotograma con «PRUEBA DE AJUSTE». El motor puede procesar el prefijo de la línea temporal; no se promete vista instantánea.

Director privado 1.4.1: V1 asistida / V1.1 Gemini, ocho archivos conservados y lectura posterior verificada. Backup del código activo restaurado y arrancado con sesión/salud PASS. Código 4497a0d desplegado y smoke público PASS: 38 versiones intactas, sesión200, Range206/1024 bytes, servicios activos y memoria de producción sin cambios/0 OOM. Fragmentos probados en web pública móvil/tablet/escritorio, caché ~1,1–1,5 s y sin erroresJS; no se envió revisión del propietario. Ver docs/SUES_V1_CLOSURE_20261028.md. La valoración creativa del vídeo final corresponde a Carlos.

## Decisión de Carlos · V1 asistida / V1.1 API · 28/10/2026

V1: subir el vídeo al editor o compartirlo con ChatGPT y obtener la edición final deseada con asistencia humana/ChatGPT, revisión, ajustes y exportación. La API de Gemini NO es requisito de aceptación ni bloqueo de V1. V1.1: automatizar el mismo resultado mediante Gemini solo cuando aporte valor; evitar llamadas y costes siempre que sea posible. No invocar Gemini ni otros servicios de pago por esta continuación. Carlos conserva la aceptación creativa del resultado; no inferirla de tests.

## V1 · bloque técnico desplegado · 28/10/2026

Código existente recuperado y mejoras desplegadas. Rama feat/v1-closure-20261028.
Recortes confirmables, silencio~0,5s, contrato edit-timeline/fingerprint, validador
semántico/hook, jerarquía textual, Validar/Ajustar, capas reversibles, borradores y
export720 separado del proxy.37versiones previas intactas; copia/recuperación probadas.
Nueva revisión e5d48158-777e-4273-86ee-8970db623ab5:70,9s,1080×1920,
SHA dddfa227ee6a01d1e9ed60f3ebd5bf99d877cbb7d3872ca53305646f46c9df45.
Audio idéntico al anterior,decodePASS,fuente intacta; sin aprobación estética.
Suite406/407; único caso Git pasa2/2 en host. Compatibilidad adicional15/15.
UI autenticada móvil/tablet/escritorio; subida real, cortes, dos renders10s,
validación/descargas/reinicio en QA; HTTPS yRange206 en producción. Skill1.4.0.
V1 ABIERTA: Director autónomo real pendiente de autorización específica de consumo
y aceptación creativa del propietario. Sin llamadas de pago;globaloficial48%sinrecalcular.
Detalles, límites, P0/P1/P2, backups y continuación exacta:
docs/SUES_V1_CLOSURE_20261028.md.

## 28/10/2026 · Ajustes manuales posteriores al render · RAMA AISLADA (NO DESPLEGADA)

Rama local `feat/manual-adjust-studio-20261028`, ruta `/opt/sues-video-setup/manual-adjust-work-20261028`. Commits `bf59fbd` (snapshot de 27 archivos pendientes) y `bf2f688` (modo manual). Se ha implementado Validar/Ajustar, pista y categorías de eventos, ocultar subtítulos por ID conservando transcripción/voz, edición manual de B-roll/SFX/imágenes/gráficos instalados, deshacer, sustitución, nueva versión y render sin Director IA. El editor de producción sigue en `/opt/sues-video-setup/release-update.78zyka2k`, sin cambios por esta misión.

QA: 12/12 pruebas dirigidas, navegador móvil/escritorio mock con acciones reales, `npm run check` PASS, contenedor FFmpeg 376/377; prueba Git no aplicable al contenedor y 2/2 PASS en host. No se ha realizado E2E autenticado con MP4 completo real de la nueva versión; no declarar V1 validada ni desplegar. Plan y limitaciones en `docs/SUES_MANUAL_ADJUST_IMPLEMENTATION_20261028.md`.

---

## Nueva edición con máscara y capas · 27/10/2026

Exportación nueva5e5384e2-da7e-4225-8f64-5a5d271ea69e DONE,70,9s1080×1920,
38.802.994bytes,SHA8be1b267e737c4ccaa5493928b5673371751e9cf7e618f754fc339f9b634f038.
Diferente del original y del anterior5f291c06; fuente intacta. Tres B-roll a6/27,6/55,42s,
cuatro símbolos(cross,2checks,number),cinco zooms,16SFX,música,87captions.
Tres escenas con máscara corporal:19–21,5s dinero+COBRAR;34–36,5s blur+SISTEMA
NERVIOSO;43–45,5s aurora+EL CAMBIO. Compositor integrado al motor activo y plan
externo foreground-effects validado.225frames MODNet nuevos; máscara ligada al
SHA y cámara exacta, conservada en caché de mattes estable y copia portable.
QA: decode íntegro PASS,-14,3LUFS,truepeak−2,1dBFS;24fotogramas del MP4 revisados
más4críticos. Pelo con halo suave,rótulos parcialmente ocluidos y número pequeño;
no visionado dinámico ni escucha completos,no aceptación artística del usuario.
App autenticada: vídeo editado,reproduce/pausa,salta a35,2s,Exportar habilitado.
Suite367/368PASS en contenedor; caso Git ausente pasa2/2en host;15/15integración
más9/9finales foreground/backupPASS. Código publicado7df8731,árbol58a264ba.
Director localQwen rechazado por incumplimientos; dirección corregida porChatGPT
Work y ejecutada por motor,no Director autónomo listo. Cero llamadasGemini.
Continuación: valoración artística de Carlos; mejorar legibilidad/contorno si procede;
Director autónomo y QA audiovisual completo siguen pendientes. Evidencia privada:
resource-audit-drive-20261026/video-brain-depth-20261027/QA_RESULT.json.

---

## Mezcla de efectos con memoria acotada · 26/10/2026

La nueva edición independiente 5f291c06-7c4a-43af-8821-28a090d2a2f2 falló al
mezclar audio: SIGKILL y memory.events oom_kill=1, límite contenedor1,25GiB.
La caché anterior sólo cubría efectos procedurales densos. Ahora los efectos de
biblioteca repetidos se calculan en lotes de tres y se mezclan desde un bus PCM;
se conservan ganancias, fades, normalización, tiempos y ducking del plan.
6/6 pruebas focalizadas PASS, incluida comparación de muestras con error<1e-6.
Grafo real70,891s con9cues PASS, pico hijo460040KiB. Sin subir límite de RAM,
sin nuevas dependencias/servicios, originales intactos. Caché temporal eliminada
al salir. Reintento2 en marcha; comprobar DONE y QA audiovisual antes de entregar.
Detalles privados: resource-audit-drive-20261026/video-reedit-from-zero-20261026/.

---

## Interfaz recuperada · 26/10/2026

Queja: página sin carga, clics ni desplazamiento. Backend saludable; en navegador se
reprodujo bloqueo. La biblioteca montaba de entrada todos los vídeos/overlays con
preload metadata, incluso oculta, y repetía la construcción al seleccionar proyecto.
Ahora ninguna URL de vídeo de biblioteca se conecta hasta pulsar Cargar vista previa;
se conserva un solo reproductor de recurso activo y se liberan medios al reconstruir.
No se elimina ningún recurso. También se reabre el proyecto actual desde dashboard.
Cambio de archivos web aplicado al bind mount activo, sin reiniciar servicios.
QA: 6/6 pruebas de preview/buffer PASS; sintaxis PASS. Navegador autenticado:
proyecto 1841bec2 abre, 87 subtítulos, Texto/Director clicables, vídeo reproduce/pausa,
scrollY=300 observado; cero vídeos de biblioteca con src antes de solicitarlos.
Prueba realizada en Chrome de escritorio; Android no verificado. Sin llamadas Gemini.

---

## F7 · Biblioteca Drive bajo demanda · 26/10/2026

Búsqueda y propuestas locales conectadas al inventario privado con fichas en español;
exclusiones de duplicados/QA; recuperación explícita desde Drive con tamaño+SHA256,
caché128MiB y MediaLibrary existente. Prueba real aislada BR-0199,3.596.747bytes,
B-roll5–8s/sourceIn1 sobre vídeo real13,4102s:MP4/decode/voz original PASS;
fotograma revisado, sin aceptación narrativa ni estética global. Ninguna llamada Gemini.
355/356tests en contenedor PASS; único fallo Git ausente pasa en host;13/13 focalizadas
host PASS. Sin nuevas dependencias/cargos. Despliegue pendiente de verificar.
Detalle: docs/SUES_LIBRARY_VIDEO_INTAKE_20261021.md (sección26/10).
F6/F7/F9/V1 abiertas; no recalcular global por tamaño del catálogo. Siguiente:
publicar rama, desplegar con backup/Whisper protegido, verificar API autenticada y
actualizar catálogo/Roadmap. Después completar audio/fragmentos y fuentes pendientes.

---

## Estabilidad y REA · trabajo validado · 24/10/2026

Corrección de arranque: no mostrar credenciales antes de verificar sesión, recuperación
de red sin falsa desconexión ycookie30d conExpires. Proxy720p privado separado de
exportación1080p:12,9→2,3MBen vídeo real(82%menos).19pruebasPASS yfuente intacta.
Código en rama aislada; despliegue aún por verificar. REA6.7.0 ya operativo y usado,
sin repetir instalación; Captions mapa de módulos yCapCut3bootstraps con límites
explícitos, no backend privado. Informes:docs/SUES_REA_FINDINGS_20261024.md,
docs/SUES_FUNCTIONAL_GAP_MAP_20261024.md,
docs/SUES_INTELLIGENT_EDITOR_ARCHITECTURE_20261024.md,
docs/SUES_SESSION_PROXY_QA_20261024.md. F6/F7/F9 abiertas,global48%.
Próximo: publicar estabilidad y probar analista/director local sinAPIdepago.
Roadmap Drive sin sincronizar por Unknown tool; no inventar progreso ni aceptación.

---

## Búfer publicado y comprobado · 24/10/2026

Producción b40e2a5e: precarga sólo vídeo visible, barra de búfer y carga completa
privada enmemoria.9/9 pruebasPASS; test con12,9MBreales convierte aBloblocal,
100% yhashidéntico alMP4. HTML/helperJS/appJS/SW200,privado401,Range206;
backup/rollback verificados yWhisper activo. No reproducción Android acreditada.
Detalles: docs/SUES_PLAYBACK_BUFFER_20261024.md. Cargar completo evita esperas
de red posteriores; no garantiza decodificación del dispositivo. F9 abierta,
global48%; Roadmap Drive sin sincronizar por Unknown tool.

---

## Reproducción · precarga única y búfer completo · 24/10/2026

Queja de Carlos: la carga del vídeo no se adelanta suficiente a la reproducción.
Original/montaje con preload auto simultáneo: ahora sólo precarga el visible;
el oculto suelta la fuente y conserva URL/posición. Barra de carga real y botón
Cargar completo con progreso/cancelación y copia privada en memoria (máx128MiB).
9/9 pruebas específicas/integración PASS; sintaxis/diff PASS. No se ha medido
la conexión móvil ni reproducido en Android. Despliegue aún por comprobar.
Detalle: docs/SUES_PLAYBACK_BUFFER_20261024.md. Sin cargos ni nuevos servicios.
F9 sigue abierta, global oficial48%; Roadmap Drive sin sincronizar por Unknown tool.

---

## F6/F9 · Dos MP4 comprobados y suavizado de luces · 24/10/2026

71fa366b instalado con copia verificada/rollback y Whisper activo. Maestro
68,63s completamente decodificado y revisado en 35+6 muestras; rótulos mayores,
sin repetición inferior del concepto con profundidad. Segundo original 13,41s
editado desde API de producción, sin tiempos/máscaras/textos del maestro: job
eb2ca2a7-a8b8-472f-b0b4-63947a722668 DONE, descarga idéntica por SHA256.
Su edición es escasa (1 gráfico/1 transición/3 SFX, sin cortes/zoom); no demuestra
la calidad DOPAMIN automática objetivo. ASR con nombres por revisar.
13 pruebas integración +2 Git host PASS. Revisión final detecta borde horizontal
en overlay inferior; feather con alpha medido y4 pruebas PASS preparado; nuevo
render necesario para incorporar este último cambio. Ver docs/SUES_DOPAMIN_VISUAL_REFINE_20261024.md.
F6/F7/F9 abiertas, global oficial48%, coste externo0; Roadmap sin sincronizar por
Unknown tool del conector. Siguiente: comprobar despliegue del feather y aplicar
dirección visual a otro original hasta intensidad/aceptación real. No V1.

---

## F6/F9 · Revisión visual real y segundo original · 24/10/2026

Base VPS verificada b3e0a7a. Revisión de la hoja de contacto del maestro detecta
rótulo VOLVEMOS redundante y gráficos pequeños. Corrección aislada elimina sólo
el rótulo inferior cuando coincide con texto de profundidad revisado, aumenta
los gráficos con ajuste métrico y distingue MIEDO/BLOQUEO/EGO. Otro vídeo real de
13,4102s revela la flexión «atentos» ausente: corregida sin copiar tiempos/contornos.
9/9 pruebas específicas y 2/2 Git host PASS; fallo previo de suite era Git ausente
en contenedor. Render completo de QA en marcha, despliegue aún no acreditado.
Detalles y límites: docs/SUES_DOPAMIN_VISUAL_REFINE_20261024.md.
F6/F7/F9 abiertas; global oficial 48%; coste API 0. Roadmap no sincronizado por
Unknown tool de los métodos Drive; continuar sin inventar actualización.

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


27-10-2026 · Importación del Director: versión limitada instalada en el editor activo, rama feat/paste-creative-plan-20261027 (código df1df29b9f20e4ebdb5605fe1dbcdafbeff5946e). El servicio fue reiniciado sin trabajos activos; comprobados HTML, sesión, salud y rechazo de revisión con proyecto obsoleto. En navegador real se verificaron el proyecto existente y el panel «Pegar plan del Director IA». En entorno aislado se verificaron búsqueda, selección, Drive, revisión, render, reproducción y exportación. Texto libre complejo y escucha humana completa siguen pendientes. No se envió material a Gemini. 374/375 pruebas en contenedor; la prueba Git restante pasó en el servidor. Rollback de archivos: /opt/sues-video-setup/creative-plan-file-rollback-20261027.

27-10-2026 · El botón «Preparar información para el Director IA» fue probado en navegador aislado y visto en producción. Prepara contexto local con esquema e identificador del vídeo para copiar, sin envíos automáticos a IA. Archivos web de commit be9b73dc88b23c9acbc3399fbe0cf104eb3bce64 aplicados al servicio activo.

27-10-2026 · Evaluación aislada de Qwen3-1.7B Q4 como traductor de texto (sin red, datos sintéticos): FAIL. Ante un B-roll exacto y una cadena detrás del sujeto con acercamiento y SFX, devolvió campos y tipos ajenos al esquema, duración cero y omitió la cadena. No se integró ni se aplicó su salida. Falta un intérprete fiable y autorizado para lenguaje libre general. Prueba de audio del mismo montaje con voz normalizada al 150 %: -15,5 LUFS/-1,6 dBTP frente a -29,3 LUFS/-11,7 dBTP sin normalización; no equivale a escucha humana.

27-10-2026 · Frases temporales explícitas desplegadas: validación en proyecto real de prueba reconoció una operación B-roll con recurso existente, canApply=true y sin iniciar render. 15 pruebas dirigidas y navegador aislado pasan. Código 5c59bc47726b38c4f091019c6e75efbc15714080; rollback parcial before-timed-prose. El texto complejo general sigue pendiente y no se envió material a Gemini.


28-10-2026 · REEDICIÓN TÁCTIL — EN CURSO, NO DESPLEGADA.
Rama feat/touch-editor-20261028 en /opt/sues-video-setup/touch-editor-work-20261028; base 67a17ab conserva código activo previo. Implementados inspector de palabra (color/tamaño), transformaciones de subtítulos, pistas filtradas y tira real de fotogramas, recorte SFX, región/difusión de máscara y gestos. 18/18 pruebas dirigidas con FFmpeg del runtime pasan (touch-edit, timeline-frames, custom-sfx, foreground-effects, library-sfx-cache). Navegador aislado móvil/escritorio verifica estado de color/tamaño, altura/difusión, arrastre y ausencia de desbordamiento. Fragmento real de subtítulo inspeccionado: palabra naranja ampliada visible. Fragmento real de máscara 48,3–52,3 s generado, decodificado e inspeccionado: B-roll superior con transición difusa y sujeto conservado. Una prueba navegador+renderer juntos bajo 1200 MiB falló SIGKILL; renderer aislado con mismo límite completó. Optimización de fragmento todavía en comprobación.
Evidencias y scripts: /opt/sues-video-setup/touch-editor-qa-20261028 (browser-touch.mjs, media-tests.log, mask-regression/, caption-fragment.png). Fuente original e5d48158-777e-4273-86ee-8970db623ab5 intacta, /state montado sólo lectura en QA. Sin Gemini ni proveedores nuevos.
PENDIENTE: repetir render/browser tras optimización; gestos máscara, trim/undo/recarga/aplicar, exportación; división/borrado del vídeo principal conservando capas; geometría de otros gráficos; inserción en cabezal. No afirmar todas las funciones verificadas. Antes de despliegue comparar archivos activos con base y respaldar diferencias, ejecutar suite completa, commit/push y comprobar producción. Siguiente acción exacta: leer mask-regression-v2.log y proceso 317301, inspeccionar frame v2, ampliar matriz browser y corregir fallos. Producción no contiene estos cambios.

28-10-2026 · Continuación QA táctil: 377/377 pruebas con runtime FFmpeg + 2/2 pruebas Git en host pasan mediante scripts/app/media-runtime-tests.mjs (full-suite-v2.log). Las tres pruebas antiguas que fallaban también se reprodujeron en la base 67a17ab: fixtures actualizados con fingerprint vigente y apoyos semánticos/SFX reales, sin relajar validadores. Evitada autodetección recursiva del ejecutor de pruebas. Navegador móvil y escritorio pasa cambio de palabra, color, tamaño, máscara, pellizco de máscara, SFX, recursos, ocultar/restaurar capas y deshacer; fragmentos de palabra y máscara generados y reproducidos. Recarga detectó y corrigió fallo real: al restaurar un borrador se abría el original en vez de la última preview; ahora manual puede mostrar la versión anterior con aviso explícito. browser-persistence.log confirma recuperación móvil y escritorio. CSS móvil ajustado para ampliar preview sin tapar el inspector. Selección/categoría pasan a formar parte de Deshacer y borrador. Añadir recursos instalados en cabezal implementado, aún pendiente de QA específico; trim izquierdo conserva avance de sourceIn. La escucha subjetiva NO realizada: esta sesión no admite entrada de audio.
En curso prueba de Aplicar cambios desde UI y render completo, contenedor aislado con originales sólo lectura, proceso 324001: /opt/sues-video-setup/touch-editor-qa-20261028/full-apply.log. Al terminar comprobar full-apply-result.json y fotogramas full-apply-word.png/full-apply-mask.png. Producción aún no modificada. Sesión del navegador real existente recuperada, sin pedir credenciales. Main GitHub observado cc9e390e254e82bc993b734208138b56183eccc1; HEAD local de base no está publicado. No sobrescribir main ni archivos activos ajenos. División/borrado del vídeo principal y geometría libre de otros motions siguen pendientes; no declarar edición manual completa.


29/10/2026 · CONTINUACIÓN VERIFICADA · REEDICIÓN TÁCTIL INSTALADA, NO CAPCUT COMPLETO
Esta entrada sustituye el estado «no desplegada / pruebas pendientes» de las notas anteriores del bloque táctil.
Producción: srv1841004, contenedor sues-video-editor, /app montado desde /opt/sues-video-setup/release-update.78zyka2k. Los 15 archivos de aplicación instalados coinciden con los hashes del despliegue probado; servicio en ejecución, OOM=false y ningún trabajo QUEUED/RENDERING/PUBLISHING al comprobar. Código: 697837b5dacf872991261ffd4b0f924550e1aed7, rama feat/touch-editor-20261028. La rama está publicada y desplegada por archivos; no está fusionada con main ni work/dopamin-density-20261028. Worktree: /opt/sues-video-setup/touch-editor-work-20261028. Rollback verificado: /opt/sues-video-setup/touch-editor-file-rollback-20261028.
FUNCIONA Y PROBADO: tira de miniaturas reales (muestreada, máximo 60, no una miniatura por cada fotograma); desplazamiento temporal y pistas filtradas; selección y tiradores temporales de subtítulos/B-roll/imágenes/SFX; máscara con límites de cobertura; cambio por palabra de color y tamaño; arrastrar/pellizcar subtítulos y región de B-roll detrás del sujeto; altura, difusión y opacidad de máscara; volúmenes, ocultar/restaurar capas, Deshacer y recuperar borrador tras recarga; insertar recurso instalado en el cabezal y recortar SFX avanzando sourceIn. Selección en pantalla cubierta para subtítulos y máscara; no reconocimiento universal de todas las capas.
PREVIEW: «Ver fragmento de ajuste» usa el mismo motor para un fragmento de hasta 4 s; «Aplicar cambios» genera una nueva versión completa. El reproductor conserva la versión anterior con aviso mientras hay ajustes. No hay composición final instantánea de todas las capas como CapCut.
PRUEBAS: 411/411 en runtime FFmpeg y 2/2 de despliegue/Git en host. QA móvil/escritorio y prueba autenticada HTTPS en producción pasan color/tamaño, máscara, miniaturas, recuperación, descartar y pausar, sin errores JS/overflow. Controles de añadir en 12,345 s, trim SFX, Deshacer y cobertura de máscara pasan. Dos renders completos de reedición: uno aislado (219a50a4-89b5-432f-b042-7d1cda9f29fb) y uno en producción.
RESULTADO REAL: https://editor.suesholistics.com/?project=04096518-c6e0-469e-96b6-7290fa48356b ; DONE, 70,9 s, 1080×1920 H.264/AAC, 36.759.237 bytes. Creado desde «Aplicar cambios», padre e5d48158-777e-4273-86ee-8970db623ab5 conservado. Word fire/1,6; máscara altura920/difusión300/opacidad0,8; música18%, primer SFX30%. Descargado y decodificado íntegramente; inspeccionados fotogramas activos de palabra y máscara. Esto prueba reedición; no es un nuevo plan creativo desde cero. Escucha subjetiva y aprobación creativa pendientes; no se enviaron aprobaciones automáticas. Original SHA17802a14f4d38f8cfa5427ee6f607367a6b99419b91494623e6e55bf3b6013f7 intacto. Render productivo observado ~9 minutos; no prometer respuesta instantánea.
PENDIENTE REAL: dividir/borrar trozos del vídeo principal YA EDITADO con remapeo y sincronización de todas las capas; ahora sólo existe recorte del bruto antes de preparar el plan. Geometría/tamaño/selección directa de todos los gráficos y motions; previsualización realmente inmediata de la composición completa; revisión creativa y escucha; consolidación de la rama táctil conservando las integraciones previas. No dar el timeline completo ni V1 por aceptados por número de tests. No se ha vuelto a auditar aquí el inventario de biblioteca.
EVIDENCIAS: /opt/sues-video-setup/touch-editor-qa-20261028/{production-apply-result.json,production-ui-result.json,controls-result.json,full-suite-published-qa.log,production-final-probe.json,production-word-verified.png,production-mask-verified.png}. deployment-result.json decía aún «pending» y debe considerarse actualizado por production-ui-result.json PASS.
SIGUIENTE CHAT: leer esta entrada y Roadmap Maestro; verificar hashes y rama activa antes de editar. Prioridad 1: diseñar e implementar dividir/borrar sobre timeline existente conservando original, máscaras y sincronización, sin aplanar capas. Después ampliar gestos al resto de elementos y preview. No volver a pedir subida del original ni rehacer los controles ya probados. Sin llamadas a Gemini ni nuevos servicios de pago; V1 asistida, API Gemini queda para V1.1.

## V2B CORREGIDA PRIVADA · 04/11/2026 · Remotion + vídeo 158404
- Sin cambiar producción: se recuperó VPS srv1841004 y se normalizó copia de la fuente a 30 fps para superar bloqueo de Remotion en frame147. Cuatro fragmentos Remotion exportados a 1080×1920 (MIEDO, RECONOCER, ENCAJAR y matte con borde difuminado). Ensamblaje V2B híbrido FFmpeg sobre V1 conservada, con voz/AAC intacta.
- MP4 probado `out/SUES_158404_V2B_CORREGIDA_PRIVADA_20261104.mp4`: 76,309 s / 2.289 frames / 34.174.819 bytes / sha256 `676bd5880fbf6aeed66f58257d3cd2455ea46e592fec561162cd977b1cd0819f`. Registrado como 236.º recurso en biblioteca privada del editor, ID SHA, NO aprobado para producción. Original conservado.
- QA real: `tsc` OK; tests 6/6; render frame147 y prueba de 180 frames PASS; 4 fragmentos OK; full decode imagen/audio PASS; hash audio V1=V2B; dos revisiones de contacto de 76 muestras (a 1fps y a +0,5s) sin defectos evidentes; CTA completo verificado. Sin auditoría humana de los 2.289 fotogramas ni aprobación creativa de Carlos.
- Rama `feat/remotion-cta-poc-20261103`. Commits: fuente `bd4bf3d937cab02fb62d313bc281ab54b85b1ce9`, pruebas `4634bac0b946db66ae028bd0760e89eef9439c91`, documentación `a5f6da386cf6db22a09102d0cd9ccbc338dac20f`. Ver `experiments/remotion-cta/docs/EDICION_158404_V2B_20261104.md` y Roadmap Maestro actualizado.
- Bloqueos para publicar: aceptación personal de montaje y audio, verificación final licencias/contexto de tres clips Pexels. No merge, despliegue ni costes de API. Fases/porcentajes y aceptación V1 sin cambios. Siguiente: revisión de Carlos y, tras ajustes, integrar escenas como plantilla editable del motor compartido.

## 04/11/2026 · Acceso directo a V2B + Biblioteca visible (producción)
- Proyecto independiente PREVIEW_READY `03085c90-2833-4ae9-9b81-4d5ce5205543` (EL PRECIO DE SER QUIEN NO ERES · REMOTION V2B). URL `https://editor.suesholistics.com/?project=03085c90-2833-4ae9-9b81-4d5ce5205543`. Reutiliza MP4 de 76,309 s ya editado, sin subir ni renderizar, fuente plana; capas Remotion mantenidas en rama técnica, NO integradas en timeline.
- Se añadió botón Biblioteca visible en cabecera, Mis proyectos y editor; se reutilizó la biblioteca real guardada con filtro/vista previa. Despliegue de activos estáticos en `release-mobile-layers-20261030/web`, con backup previo en `editor-backups/20261104-library-navigation`. Servicio `sues-video-editor` reiniciado y HTTPS HTTP 200. Parche versionado en `docs/patches/20261104-library-navigation-prod.patch` commit `009a70bda07201066bd70e59100250631c6017f7`.
- Verificación: perfil importado `projectReady=true`, fichero y proyecto presentes, JS sintácticamente válido y navegación comprobada estáticamente. No hay todavía QA autenticado desde móvil, ni aprobación creativa o de licencias. Roadmap Maestro actualizado. Próximo paso: revisión personal desde enlace directo.

## 04/11/2026 · Referencia 158623 · análisis tipográfico y dinámico a 4 fps
- Analizado clip enviado `158623.mp4` (SHA256 `a2c48eab4ad4c4c719b63a03a9b6c250057f460a8764830ad36620780bd29088`), captura vertical de Instagram de 7,626 s, 30 capturas observadas cada 0,25 s. Diferenciadas animaciones reales de superposiciones de Instagram y del control de volumen móvil. El cuadro de tamaños/colores/posiciones aportado por Carlos se conserva como especificación objetivo, no evidencia de tipografía/HEX exactos.
- Gramática verificada: conector blanco + protagonista tipográfico grande acumulado, billetes detrás del sujeto, isla como inserción contextual, cantidad destacada con tratamiento ambiental, cambio a pizarra blanca con texto negro de escritura progresiva e iconos explicativos. Emular jerarquías, ritmo y capas, NO copiar literalmente neones ni fijar reglas por segundos.
- Documento creado: `experiments/remotion-cta/docs/REFERENCIA_158623_ANALISIS_4FPS_20261104.md`, commit `af0c5a08720909575454f26c6f7ed9a1edeb7abc`. Próximo: traducir a `visual-beat` validable por Director IA/Remotion; verificar en reproducción 30 fps y medir con tipografía real. No cambios de código, pruebas de render, despliegue ni costes nuevos; V2B no se aprueba.

## 04/11/2026 · Corrección de prioridad: tabla técnica 158623 validada por Carlos
- Carlos confirma que la tabla de tipografía, tamaños, colores HEX, posiciones y reglas condicionales procede de una IA especializada y debe darse por **buena como especificación técnica**, sin volver a contrastarla contra los fotogramas de 4 fps.
- Actualizado `experiments/remotion-cta/docs/REFERENCIA_158623_ANALISIS_4FPS_20261104.md` para que la tabla por segundo (62–115 px, #26F7FD / #59FF00 / #FFD000, glow, contorno 6 px, X/Y, build-in acumulativo) tenga prioridad de implementación, incluidas las reglas completas de layout con sujeto y modo pizarra. Las capturas sirven para entender movimientos y hacer QA de la implementación, no para cuestionar los valores especificados.
- Preservar fidelidad cromática del preset de referencia; cualquier adaptación a Brand Kit SUES será variante opcional posterior. Sin cambio de código ni despliegue.

## 04/11/2026 · Contrato visual compartido 158623
La tabla técnica de Carlos queda codificada como `sues-visual-grammar-158623-v1` en `src/visual-grammar.js`, conectada a perfiles DOPAMIN/CALMA, catálogo del Director, plan de edición y ELEMENTS. `experiments/remotion-cta/src/SemanticVisualBeat.tsx` usa el mismo contrato y tiene composición de prueba. Skill personal SUES AI Film Director actualizada de verdad a 1.4.2 (release `pluginrel_6aeaf5a026e88191a8da0def8d2f8f6e`), con `references/GRAMATICA_VISUAL_158623.md`. Pruebas focales 11/11 PASS, TypeScript Remotion PASS, dos stills Remotion PASS. Suite general en copia aislada 302 PASS / 50 FAIL, principalmente faltan dependencias ajv y ffmpeg; otros fallos por estudiar. Sin merge ni deploy de motor; producción tiene funcionalidades adicionales que deben preservarse. V2B sin modificar ni aprobación creativa. Documento de continuidad: `docs/GRAMATICA_VISUAL_COMPARTIDA_158623_20261104.md`. Próximo paso: port seguro a versión productiva y prueba integral de vídeo real, sin sobrescribir módulos enteros.

## 04/11/2026 · Pausas de voz ≤0,7 s · V3C y editor
- Instrucción nueva de Carlos: conservar como máximo **0,7 segundos** de silencio entre frases, recortando el exceso en **audio y vídeo simultáneamente**, sin tocar palabras, preservando intros y logo final. Fuente canónica nueva `src/speech-pause-cap.js`; `src/source-cuts.js` utiliza 0,7 s al proponer cortes; 17/17 tests dirigidos PASS. Política detallada en `docs/POLITICA_SILENCIOS_07_20261104.md`.
- V3C verificada: original V3 sin alterar, siete cortes en pausas con timestamps de voz, 59 fotogramas menos (1,966667 s), 168 palabras conservadas; MP4 final 74,343 s, 1080×1920, 30fps, 2230 frames, 24.130.904 bytes, SHA256 `a519295ca72a6c508cbcf69424b0a6c7e3d36cea897a2c9c278c9f3ea426bbbf`. Full decode vídeo/audio PASS. Extraídas e inspeccionadas 74 muestras 1fps + 297 muestras 4fps. Máxima pausa según transcripción: 0,693333s; no afirmar audición humana definitiva.
- Proyecto privado de acceso directo `https://editor.suesholistics.com/?project=7032b26b-eb87-446c-8d62-39ce40f541e3`, PREVIEW_READY, transcripción retemporizada, V1/V2B/V3 conservadas. **Una nueva revisión aplanada**, no capas Remotion en UI. Producción del módulo de propuestas `source-cuts.js` actualizada con backup en `/opt/sues-video-setup/editor-backups/20261104-pausecap-proposals`; reinicio controlado, web HTTP 200, carga de regla en contenedor PASS. Sin cambios en reproductor; sin gasto de API.
- Skill privada `SUES AI Film Director` actualizada y comprobada en versión **1.4.3**, release `pluginrel_6aeb0abffdd48191854637b9d3f2a408`, recurso `references/PAUSAS_VOZ_07.md`. Las propuestas de corte manual siguen requiriendo selección/confirmación (`automaticDeletion:false`) para preservar proyectos antiguos; activar el automatismo universal como paso explícito del render nuevo en Fase 9. No declarar fase completada ni creatividad aprobada hasta revisión de Carlos.

## 04/11/2026 · V4B desde original: subtítulos íntegramente rehechos, preview privada lista
- Nuevo proyecto `d11ad5ff-c365-4187-9382-0149eb11d862` («EL PRECIO DE SER QUIEN NO ERES · V4B · SUBTÍTULOS NUEVOS»), `PREVIEW_READY`. Abrir: https://editor.suesholistics.com/?project=d11ad5ff-c365-4187-9382-0149eb11d862. Producción editor HTTP 200 después de registrar proyecto y reiniciar servicio; código web sin modificaciones nuevas.
- Imagen nueva desde grabación sin subtítulos `public/full/source-cfr30.mp4`, base limpia `public/v4/clean-base-v4.mp4`; motion y 168 palabras de voz renderizados como NUEVAS capas Remotion, **no sobre MP4 V2B/V3C con textos incrustados**. 78 beats y 32 palabras clave semánticas, centradas; tablas técnicas `158623`; corrección de cruce de layouts en segundo 54. Audio conservado de V3C ya editada para respetar voz y silencios <=0,7 s. V1/V2B/V3C intactas.
- Preview privada `SUES_158404_V4B_DESDE_ORIGINAL_RECONSTRUIDO_PREVIEW720_20261104.mp4`, 11.561.089 bytes, H.264/AAC 720×1280, 30 fps, 2.230 frames, 74,333333 s, SHA256 `3c8e608f29021972302ac8adaa8f7097c3b500e38d6e18d91ea23c44c806ff82`. `faststart` y grabación única en biblioteca de proyectos.
- QA verificado: `tsc --noEmit` PASS; 13 segmentos de 2.230 frames; FFmpeg decode completo audio/vídeo PASS; 74 fotogramas a 1 fps y 297 a 4 fps extraídos y hojas de contacto visualmente revisadas, sin palabras protagonistas descentradas/recortes de texto evidentes. No afirmar auditoría exhaustiva de 2.230 frames ni calidad creativa aprobada. Editor accesible; no pruebas visuales reales del reproductor autenticado en móvil.
- Fuentes versionadas en rama de desarrollo, informe `experiments/remotion-cta/docs/EDICION_158404_V4B_20261104.md` commit `da6e44af32296969e8632b66cc78d0c0a8b8baf9`. Assets MP4/logo permanecen privados en VPS/Drive, no se subieron a GitHub. Sin merge, coste nuevo de API 0, ni Full HD final: **preview 720p** pendiente de revisión de Carlos, licencia B-roll y export a 1080p tras aceptación. Progreso de Fase 9 y global no modificados.

## 04/11/2026 · Master Director: preview asíncrona y límites de memoria
- Implementación aislada en rama: solicitud de preview asíncrona con persistencia de estado y recuperación segura; protección de memoria y copias en streaming. Prueba sintética autenticada de 24 s con Remotion, audio, auditoría técnica, Range e idempotencia PASS. Prueba técnica de 65,1 s de la copia normalizada 158404 en curso; intentos anteriores incompletos. No representa un montaje creativo ni prueba de exportación final. Detalles y limitaciones en `docs/SUES_MASTER_DIRECTOR_WORK_PREVIEW_20261104.md`. Sin despliegue, gasto ni publicación.

- Actualización: el render limitado de 65,1 s no terminó por el máximo de 10 minutos; se aumentó el límite a 30 minutos sin desactivar el control de memoria y se inició una nueva prueba. 113/113 pruebas específicas de la copia y 2/2 de renderizador en el árbol PASS; regresión con exportación móvil real PASS, batería general aún en curso. Ninguna de estas pruebas valida un Reel creativo final.

- Regresión aislada: 543/548. Dos fallos presentes en base productiva; Git ausente de imagen (PASS en host); preview bloqueada por contenedor menor que requisito de memoria (PASS en host); máscara FFmpeg PASS al repetir con 768 MiB tras fallar fixture con 384 MiB. Suite completa aún no limpia.

- Prueba técnica aislada 158404 completada: 65,109 s, 1953 fotogramas a 30 fps, preview privada 270×480 con audio, SHA256 `84489cd837f55d1a147adbddfdedaf452148b6ef6bcb11d5fb36b6ee7306d3b9`. Auditoría técnica separada con decodificación completa PASS; Range e idempotencia PASS. Fuente es copia normalizada, plan y contexto simulados. Sin revisión artística, Reel terminado ni exportación final.

- Master Director en rama aislada: curvas de animación `linear`, `ease-in`, `ease-out`, `ease-in-out` implementadas y preservadas con cubic-bezier estándar; `spring` sigue bloqueado. 8/8 pruebas dirigidas, TypeScript y fotograma sintético Remotion PASS. No implica aceptación audiovisual ni despliegue. Detalle en `docs/SUES_MASTER_DIRECTOR_WORK_PREVIEW_20261104.md`.

- UI aislada Master Director: selección de curva por fotograma, guardada en versión nueva con revisión requerida. Smoke Chromium escritorio/móvil PASS con backend de prueba; no desplegado.

- UI aislada Master Director ampliada para editar valores existentes de keyframes con versionado. Prueba de navegador escritorio/móvil PASS con fixture simulado; sin despliegue.

- Prueba aislada autenticada de preview sintética con animación ease-in-out: 24 s con render Remotion real, audio, auditoría técnica independiente, Range e idempotencia PASS. No equivale a calidad creativa aprobada.

- Reel 158541 recibido: archivo ya editado 13,2 s. El original carece de SAR y se bloqueó con seguridad. Una copia privada con SAR 1:1 asumido, sin recodificación y con todos los fotogramas decodificados idénticos, permitió prueba técnica autenticada Remotion: 396 frames, audio y decode completo, Range e idempotencia PASS. Plan y transcripción simulados; sin revisión creativa ni Reel completo. Ver `docs/SUES_MASTER_DIRECTOR_WORK_PREVIEW_20261104.md`. Sin despliegue, publicación ni coste.

- Master Director aislado: corregido reintento de preview tras BLOCKED/FAILED conservando idempotencia en conexiones inciertas; geometría no verificada se explica en UI. Browser desktop/mobile PASS con servicio simulado. Sin despliegue.

- Master Director: bruto de práctica de Drive, 30,2 s; análisis local y plan preliminar aplicado en aislamiento, dos previews técnicas PASS, corrección de ubicación de texto y QA visual parcial. Política simulada, derechos de tercero, acabado cinematográfico y auditoría completos pendientes; sin despliegue ni publicación.

- Master Director rama aislada: validación narrativa basada en fases documentadas, evidencia requerida, aviso de fases sin documentar y sin inventar moraleja/caída. Mantiene compatibilidad del modo estricto y exige nueva revisión cuando cambie contexto. 27 pruebas dirigidas, 116 específicas y Chromium escritorio/móvil PASS con fixtures. No acredita comprensión audiovisual integral ni despliegue.

- Arco observado comprobado con bruto privado y transcripción local: 20 reglas procesadas, fases documentadas, moraleja sin documentar y cinco capas preparadas PASS en proveedor real con derechos de recursos simulados. No demuestra comprensión audiovisual completa, verificación de derechos ni autorización creativa.

- Master Director: arranque normal admite configuración de preview opt-in con rutas y SHA de tres puntos de entrada validados antes de iniciar; por defecto desactivado. 2 tests de configuración/arranque HTTP y 117 pruebas específicas PASS. No protege dependencias transitivas ni sustituye política real/rollback; no configurado ni desplegado en producción.

- Master Director: configuración privada de preview rechaza rutas no normalizadas, directorios padres inseguros o enlaces simbólicos; 122/122 pruebas Master Director en rama PASS. No protege dependencias transitivas ni elimina carreras de archivos; aún requiere runtime inmutable y validación de producción. Sin despliegue.

- Seguridad y perfiles: política del cerebro rechaza ficheros de otro propietario, rutas o directorios inseguros; estilos ajenos a CALMA y DOPAMIN se bloquean en vez de convertirse silenciosamente a CALMA. 122 pruebas específicas PASS. ELEMENTS aún no integrado como perfil; producción intacta.

- Preparación de política: comprobador offline de solo lectura valida bytes, metadatos y 20 reglas para tres IDs seleccionados; no crea política ni modifica biblioteca. 125 pruebas del cerebro PASS. Los tres tapices reales figuran como propios, pero carecen de metadatos V2 de prueba/licencia, por lo que el comprobador bloquea correctamente la activación; no se deben inventar pruebas.

- Regresión 05/11: al probar sobre copia productiva se detectó que alteraciones rápidas del mismo tamaño podían conservar mtime/ctime y evadir caché de integridad de live preview. En rama y staging se recalcula SHA antes de servir cada petición; 30 alteraciones repetidas y suite live PASS. Ensayo local 40 MiB × 5 = 312 ms; impacto en reproducción/cargas grandes pendiente de medir. Sin cambios productivos. Batería inicial 550/552 (Git ausente del contenedor, prueba aislada PASS en host; fallo de integridad corregido).

- Integración nativa: aprobación o modo autónomo conecta con importador existente, revisa de nuevo plan/versión/evidencia y crea versión hija editable con petición idempotente; operaciones incompatibles se bloquean. Test autenticado con FFmpeg real produjo MP4 privado sintético 12 s, audio y decode completo PASS; interfaz escritorio supervisado y móvil autónomo PASS con fixtures y acciones DOM, sin evaluar visibilidad de todos los controles. 125 específicas PASS en host y render real PASS en contenedor. Sin despliegue ni aprobación artística.
- Regresión de base productiva aislada, antes de esta conexión nativa: 554/554 ejecutadas PASS con dos tests actualizados en staging para la cola/límite actual; test Git omitido en contenedor y superado por separado en host. No equivale a batería completa posterior a la conexión ni a auditoría creativa.

- ELEMENTS nativo conectado como formato combinable con CALMA/DOPAMIN: LIST, RANKING, COMPARE, Q&A, REVEAL y FLOW con copy y anclas explícitas, sin reemplazar elementos existentes sin autorización; presentación a pantalla completa declarada. 21 pruebas dirigidas PASS; MP4 sintético privado 12 s con LIST, audio y decode completo PASS con FFmpeg real. No equivale a acabados artísticos avanzados ni Remotion por capas; evaluación audiovisual pendiente. Batería de rama 127 PASS, una prueba real omitida por falta de FFmpeg en host y superada aparte en contenedor.

- Integración completa en copia productiva: 558/558 casos ejecutados PASS (prueba Git omitida en contenedor y PASS por separado en host; dos tests de base ajustados en staging). Generador reproducible crea candidato bajo /tmp, verifica 458 hashes de la base antes y después de copiar y bloquea cambios inesperados; candidato previo 141/141 pruebas dirigidas PASS. Runtime Remotion no instalado ni fijado. Fotogramas sintéticos LIST revisados de forma parcial; no sustituye revisión audiovisual ni artística. Sin despliegue.

### 10/11/2026 · FableCut private automation second checkpoint
63/63 directed tests; 24 native commands, verified source intake, exact approved story batch, isolated render copy parity. QA015 3s/90f and QA018 five operations 1s/30f 1080x1920 with complete technical proofs. DAEDAL 394 files/12 CC0 licences hash verified; QA020 real riser inserted. Actual brand master commercial provenance and new recording acceptance remain pending. See docs/engine-next/FABLECUT_STORY_AUTOMATION_20261110.md. No deployment.
