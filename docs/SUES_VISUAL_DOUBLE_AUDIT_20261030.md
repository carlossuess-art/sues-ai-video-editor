# Auditoría visual real · 30/10/2026 · EN CURSO, 0/2 auditorías completas

Esta misión no acredita las 32 operaciones completas ni dos auditorías consecutivas. Las regresiones dirigidas que se enumeran abajo no sustituyen ese criterio.

## Base observada y aislamiento

Producción real: contenedor `sues-video-editor`, montaje `/opt/sues-video-setup/release-mobile-layers-20261030`. Comparación inicial por SHA256 contra `a7b87a019aa0c27b11cb965f766e3c256c0006c6`: todos los archivos de aplicación coinciden; solo PROJECT_STATUS difiere. Código móvil base `11ffc7c`. GitHub publica este bloque como 7b53bb8ca313834cd38d590af19a6ea9a6b60c85, en un historial distinto del checkout local. No ordenar ambos SHAs como versiones: contrastar contenidos. Rama de corrección: `fix/visual-double-audit-20261030`; worktree independiente `/opt/sues-video-setup/visual-double-audit-work-20261030`.

Proyecto de QA creado desde la interfaz usando material guardado de 13,41 s: raíz `4e8ccae3-5c9a-4e81-8904-a0aa7f1f0270`, primer render `94f13283-db10-4f5e-83d0-7f001bc2aff2`. Original y proyectos previos conservados. Staging independiente en puerto 3012, archivos y medios originales montados solo lectura. Sin APIs IA ni costes nuevos.

## Registro de errores y correcciones

| ID | Clase | Reproducción y causa | Corrección / evidencia |
|---|---|---|---|
| V01 | Sincronización / interacción | Cambiar color y fijar 180px antes de terminar la vista; añadir keyframe muestra 209px. Se calculaba contra un tamaño provisional. | Edición numérica/keyframes esperan metadata exacta; browser confirma 180px después de keyframe. |
| V02 | Motor / preview | Añadir imagen manual a vídeo sin detecciones: `Vision track: no se detectó ninguna cara`. La inserción pedía auto-subject. | Nueva imagen con caja manual explícita; preview y fragmento real sin detección facial. |
| V03 | Interacción | Arrastrar imagen pierde su selección. Se guardaba `0` en vez de `image-0`. | Prefijo estable; drag y pinch táctil conservan selección. |
| V04 | Visual móvil | En 393x852 el número de tamaño queda parcialmente cortado al añadir keyframe. Todo el editor de fuente se paginaba como una pieza. | Separación en páginas de tamaño, botones y keyframes; captura con 180 legible. |
| V05 | Sincronización | Elegir caption mientras carga la base puede devolver el cabezal a cero. | Conservar el intervalo seleccionado al terminar la carga inicial. |
| V06 | Interacción / audio | Silenciar keyframe deja el campo mostrando la ganancia base (30%). | Mostrar ganancia interpolada en el cabezal; prueba móvil en ambos tamaños. |
| V07 | Audio / motor | Dividir dentro de una rampa eliminaba el keyframe de frontera del primer tramo. | Preservar el valor interpolado en ambos lados; regresión compara continuidad. |
| V08 | Carencia funcional | Efectos vacío no permite seleccionar ni colocar uno. | Añadir/mover/modificar/quitar warm, blur y radial del motor existente; fragmento FFmpeg real. No se simula preview instantáneo de filtros. |
| V09 | Interacción / rendimiento | Completar un refresh pendiente mientras se escribe el tiempo del efecto borra el valor escrito. Reproducido en prueba ampliada (3,54 en vez de 5). | No reconstruir inspectores ajenos a captions al finalizar el refresh; regresión ampliada repite la edición. |
| V10 | Clasificación | Catálogo histórico muestra `behind-video` en Motion además del B-roll con máscara. | Excluir ese duplicado histórico de Motion; no altera medios ni máscara. Revisión pública pendiente. |

También se protegen overrides opcionales de motions y se corrige +/- de fuente sobre keyframes y su interpolación. No se contabilizan como errores visuales independientes acreditados.

## Pruebas y evidencias

- Navegador Work real: creación, generación, Ajustar, color/tamaño/keyframe, imagen insertada/movida/temporizada, músicas añadidas/superpuestas/divididas, silencio de tramo, SFX insertado/recortado/desplazado/volumen. Exportación completa desde Guardar y generar versión: `6842afc3-e9a0-4b5a-a0fa-3b5713e3419d`, DONE. MP4 inspeccionado visualmente: palabra CIAN ampliada e imagen de manos/corazón movida. Tres tramos musicales (dos fuentes), SFX sourceIn 0,088 / duración 0,412 / gain 0,45.
- Regresiones complementarias Chromium móvil: 393x852 y 412x915. Acciones de navegador reales y touch CDP; no son un teléfono Android físico ni gesto multitáctil ejecutado por el navegador Work.
- 15/15 pruebas relacionadas pasan: mobile-e2e-export, live-preview, manual-visuals, manual-broll-integration y music-tracks. Incluyen exportación H264/AAC con dos músicas, silencios, recuperación, imagen y captions.
- Fragmento corregido generado desde la interfaz: 4,000 s, 540x960 H264/AAC, decode completo PASS. Evidencias privadas `/opt/sues-video-setup/visual-double-audit-20261030/`: logs, PNG, MP4, estados de pruebas. Nunca incorporar medios/tokens al repositorio.
- Scripts reproducibles: `scripts/app/qa_manual_visual_regressions.mjs` y `scripts/app/qa_music_split_regression.mjs`. Requieren BASE y proyecto de QA desechable, SUES_QA_TOKEN_FILE (ruta, nunca valor), Playwright y Chrome configurados; SUES_QA_OUTPUT_DIR para evidencias, SUES_QA_WIDTH=393/412 en el primero. Se ejecutan contra staging antes de producción.

## Matriz de aceptación pendiente

Subtítulos: falta secuencia ampliar/mantener/reducir y movimiento de palabra individual (el transform actual es de caption). B-roll: falta recorrido completo de añadir/desplazar/recortar/máscara en esta misión. Motion: el recurso histórico CAMBIO PROFUNDO solo ofrece ocultar/restaurar; no equivale a composición con texto/fondo editables. Gráficas: falta lista/varias razones/VF/revelación en ambos ciclos. SFX y música: acciones ejecutadas y mezcla técnica, pero sin escucha subjetiva verificada. No hay verificación física Android ni teclado real. Keyframes no son universales para todas las propiedades/capas.

Operaciones principales ejecutadas al menos una vez: 17/32 (A2, C4, F4, G3, H4); algunas solo tienen verificación técnica, no toda la comprobación audiovisual exigida. Herramientas con modificaciones: 5/8. Motion/B-roll inspeccionados sin cambiar originales; esa inspección no se cuenta como edición aprobada. Auditorías completas consecutivas: **0/2**.

## Continuación exacta

Verificar primero hashes de producción y cualquier render/análisis activo. Reutilizar el proyecto de QA y estos scripts. Terminar B-roll, composición Motion, ELEMENTS y los recorridos pendientes de captions/audio. A continuación ejecutar las 32 operaciones y comprobaciones transversales desde cero sobre la versión publicada. Cualquier fallo o nuevo despliegue reinicia el contador. No publicar `2/2` por sumar estas regresiones.
