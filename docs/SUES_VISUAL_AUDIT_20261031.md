# SUES AI VIDEO EDITOR · Auditoría visual · 31/10/2026

**EN CURSO. Cero auditorías completas consecutivas aprobadas (0/2).** Las pruebas dirigidas y las operaciones acumuladas no son una auditoría integral.

## Producción comprobada

Código remoto publicado: `3d9cc756a888c11f65be7152f51514723a88c671`, rama `fix/visual-double-audit-20261030`. Commits de este bloque: `6a23cb4`, `bcbd957`, `3d9cc75`. El 31/10 se compararon por contenido los 116 archivos de src/web del candidato y de la aplicación publicada: ninguna diferencia. HTTPS 200. Contenedor existente `sues-video-editor`, release `/opt/sues-video-setup/release-mobile-layers-20261030`. No se creó otra aplicación.

Despliegues con respaldo, comprobación de ausencia de renders activos y hashes de todos los job.json existentes: 47, 48 y 49 conservados respectivamente. Los dos cambios de backend se cargaron reiniciando únicamente este servicio. El último cambio fue estático, sin reinicio. Rollbacks acumulativos en `/opt/sues-video-setup/visual-double-audit-20261030/rollback-6a23cb4`, `rollback-bcbd957` y `rollback-3d9cc75`. Para volver a 863d1d1, restaurar en orden inverso y reiniciar el editor; nunca restaurar datos de proyectos encima de cambios nuevos.

El entorno QA sigue aislado en puerto 3012. Su almacén privado de objetos se copió a un directorio independiente escribible después de descubrir que el montaje QA anterior era solo lectura. Este fallo de publicación era de infraestructura QA, no un fallo probado de producción. Originales de vídeo, biblioteca y proyectos originales conservados. Sin proveedores nuevos ni llamadas IA de pago.

## Nuevas incidencias reproducidas

Los V01–V10 permanecen documentados en SUES_VISUAL_DOUBLE_AUDIT_20261030.md.

| ID | Clase | Reproducción y causa | Corrección y comprobación |
|---|---|---|---|
| V11 | Interacción / motor | Añadir Aurora en 0 s o dejar duración fuera de política: UI aceptaba un borrador que el motor rechazaba al guardar. | Validar apertura, cierre, duración, cobertura, separación y archivo fuente antes de modificar el borrador. Regresión de rechazo, movimiento y ambos recortes. |
| V12 | Navegación móvil | Entrar en añadir recurso sin selección podía ocultar categorías sin ofrecer vuelta a timeline. | Crear el botón de retorno antes de abrir el panel, también sin encabezado. Comprobado en flujo B-roll móvil. |
| V13 | Visual / interacción | En 393 px, botones de Motion quedaban debajo del encabezado; clic interceptado por h3. | Paginar filas de controles y capas como unidades independientes. Regresión real de mover padre, texto y capa hija. |
| V14 | Carencia funcional | TRUE_FALSE no ofrecía editar pregunta, respuesta ni revelación. | Controles conectados al esquema existente de elements; texto, true/false y revealOffset persistentes. Work y MP4 antes/después acreditados. |
| V15 | Cola / render | Guardar mientras se calculaba un fragmento creaba la nueva versión y luego rechazaba iniciar su render. | Admitirla en QUEUED; drain espera al trabajador ocupado. Pruebas de exclusión, cola y generación real completada. |
| V16 | Sincronización / persistencia | Reabrir Motion exportado sumaba otra vez el desplazamiento guardado: 180 px frente a 174 px esperados. | Aplicar solo la diferencia entre borrador y ajustes guardados, tanto al padre como a capas. Regresión de relojes; producción PASS a 393 y 412 px. |
| V17 | Motor / recursos | Fragmento de máscara podía arrancar mientras la base interactiva se calculaba; FFmpeg fue terminado por falta de memoria en QA. | Respetar jobs.previewBusy también al iniciar fragmentos. Regresión de exclusión; mismo fragmento de máscara completado sin concurrencia. |
| V18 | Visual / tipografía | La respuesta FALSO mostraba un cuadrado en live y un aspa en MP4; fuentes web no contenían el símbolo. | Usar × disponible e incluir Inter Bold de la biblioteca existente para ✓. Cobertura cmap, descarga autenticada y observación Work de ambas respuestas; MP4 VERDADERO revisado. |
| V19 | Interacción / audio | Con automatización existente, cambiar volumen entre keyframes modificaba la base; el campo volvía al valor anterior y no se podía crear la rampa con ese gesto. | Crear un keyframe en el cabezal cuando ya hay automatización. Regresiones móviles en desarrollo y producción, 393/412 px; secuencia Work 45→15→0→0→35 %. |

## Evidencia audiovisual

- B-roll en Work: Aurora añadida, desplazada a 2–6 s, inicio recortado a 2,5 s (sourceIn 0,5), final a 5,5 s. Versión `62447a1e-c36b-477d-9471-35e1c3809841` DONE. MP4 observado a 4 s: Aurora y caption CIAN visibles.
- Motion editable, no MP4 aplanado: composición number/label, padre +0,1 s, texto de capa «CAMBIO REAL», capa label +0,1 s. LIST de dos razones: primer texto «PRIMERA RAZÓN QA», segunda revelación +0,1 s y composición +0,1 s. Versión Work `b3eef733-1a20-4ac4-9199-917b203515bb` DONE; MP4 observado a 3,8 y 11,2 s. Reapertura del padre conserva 2,9 s.
- TRUE_FALSE: pregunta «LA PRÁCTICA GENERA CAMBIO», respuesta falsa y revelación +0,4 s, persistencia en `21235a1e-6e3d-4e8c-983b-4b276d295a42`. Cambio posterior a verdadera y MP4 `43a51763-6a45-4360-a12d-987efe8ece32` DONE, revisado a 7,7 s. Live muestra ×/✓ legibles.
- Máscara: solo copia QA del proyecto largo. B-roll conserva su máscara vinculada; altura 960 px, difusión inferior 160 px, opacidad 65 %. Fragmento 4 s generado desde UI móvil y descargado por API privada. Fotograma revisado a 1,7 s del fragmento: recurso sobre la mitad superior y detrás del sujeto. No se modificó el original de producción.
- Música en Work: keyframes de la primera pista en 0 s/45 %, 2,55 s/15 %, 4,083 s/0 %, 5,617 s/0 %, 7,15 s/35 %. Segunda fuente y tramo dividido/silenciado ya presentes. Versión resultante ec5bd7dc-27d4-49d9-814e-e7df1ee40347 DONE en producción: H264/AAC, 1080×1920, 13,400 s, 10.756.349 bytes, decode completo PASS, SHA256 339fc0db8c27243641c73d8a4f66afb23e46d302d272fd50a5b580434da4f229. La escucha subjetiva de mezcla/voz sigue sin estar acreditada.

## Pruebas reproducibles

Veinte pruebas de regresión únicas pasan en el bloque final: adjustment-previews, render-during-preview, manual-motion-clock, manual-broll-policy, elements, elements-progressive, typography-kit, element-symbol-fonts, manual-music-volume y music-tracks. Incluyen generación y decode de medios, mezcla técnica y conservación de fuente.

Scripts nuevos de navegador: qa_motion_graphics_layers.mjs, qa_true_false_controls.mjs, qa_music_volume_ramp.mjs. Se usan únicamente con un proyecto QA seleccionado explícitamente; las credenciales se leen de una ruta privada configurada, nunca del repositorio. Logs, PNG y MP4 quedan en el directorio privado de auditoría del VPS. No publicar medios ni tokens.

Regresiones dirigidas publicadas: public-motion-reopen.log y public-music-ramp.log PASS en ambos tamaños. Otras pruebas y fuentes: advanced-regression-v3.log (fallo previo V16), motion-reopen-regression.log, broll-regression-v2.log, true-false-regression.log, mask-regression-v3.log, final-20-regressions.log. Los intentos de música contra la fixture antigua 94f... no pudieron cargar metadata durante su espera; se cambió a una fixture QA generada y disponible, sin marcar esos intentos como aprobados.

## Matriz y límites

Herramientas con modificaciones efectivas acumuladas: **8/8**. Operaciones principales ejecutadas acumuladas: **30/32** (A2, B4, C4, D4, E4, F4, G4, H4), con verificación audiovisual parcial. Esto NO equivale a 30 operaciones aprobadas bajo todo el protocolo ni a una auditoría completa. A3/A4 requieren transformar/animar una palabra independientemente del caption y no están completadas.

Defectos V01–V19 corregidos con regresiones dirigidas. Pendientes confirmados: P01 palabra individual, P02 capas internas del motion histórico, P03 keyframes universales, P04 rendimiento de preparación/render. Total del registro: 23 incidencias (19 corregidas y 4 pendientes). La cobertura aún sin ejecutar de los dos ciclos no se cuenta como defecto reproducido.

P04: se observaron esperas de varios minutos. El fragmento de máscara a 48,3 s procesa la fuente completa de 70,891 s antes de recortar; la base interactiva fría también procesa toda la duración. En QA limitada a 0,5 CPU/1000 MiB, la base rondó cuatro minutos y el fragmento otros cuatro. Producción tiene 0,8 CPU/1900 MiB; no extrapolar tiempos como si fuera el mismo equipo. Los fallos de exclusión se repararon, el coste temporal no.

Work se usó directamente con clics, campos, desplazamientos, reproducción y generación de versiones. Los tamaños 393×852 / 412×915 y touch fueron comprobados con Chromium automatizado complementario. No hay Android físico ni multitáctil real ejecutado por Work acreditados. No se ha realizado escucha subjetiva ni se han marcado casillas de aceptación editorial para desbloquear la descarga. Los MP4 sí se generaron y se inspeccionaron por los medios privados autorizados.

## Continuación exacta

1. Verificar hashes/servicios y recuperar el render musical ec5bd7dc-27d4-49d9-814e-e7df1ee40347 (DONE, decode PASS), sin duplicarlo.
2. Resolver P01 en el modelo, preview y renderer existentes, con prueba de movimiento y escala de una palabra; resolver P02/P03 sin convertir composiciones en vídeos aplanados.
3. Optimizar P04 con ventanas reales y conservación del reloj y del audio; medir antes/después.
4. Completar escucha y comparación preview/MP4 por cada herramienta.
5. Desplegar cualquier nueva corrección con backup y reiniciar el contador.
6. Ejecutar 32 operaciones y TODAS las comprobaciones transversales sobre la versión final publicada, desde dos sesiones y datos distintos. Solo entonces registrar 1/2 y 2/2.
