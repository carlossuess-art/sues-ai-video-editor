# SUES AI VIDEO EDITOR · Ajustes manuales V1 · 28/10/2026

## Objetivo

Sobre el editor existente, tras un render terminado, ofrecer **Validar vídeo** o **Ajustar montaje**. El modo Ajustar permite cerrar manualmente defectos concretos sin volver a llamar al Director IA, preservando la edición anterior y el material de origen.

## Ubicación y seguridad

- Rama aislada: `feat/manual-adjust-studio-20261028`.
- Ruta: `/opt/sues-video-setup/manual-adjust-work-20261028`.
- Se copió y confirmó el estado pendiente del trabajo 28/10, 27 archivos, como base previa a estos cambios.
- **Sin modificar producción**, sin reiniciar `sues-video-editor`, sin invocar modelos ni recursos externos de pago.
- La rama actual es LOCAL del servidor. Antes de desplegar, revisar diferencias con GitHub y decidir integración; no asumir que está subida a GitHub.

## Implementación existente en la rama

1. `web/index.html`: acciones posteriores a render y paneles exclusivos Validar/Ajustar.
2. `web/manual-adjust.css`: móvil con reproductor superior e inspector inferior scrollable; escritorio en dos columnas. Pistas azules y bloques amarillos/naranjas; ajuste de geometría para no cubrir controles.
3. `web/manual-adjust.js`: tipos Subtítulos, B-roll, Gráficos, SFX, Imágenes y Música; inspección por intervalo; desplazamiento por toques ±0,1 s, números y pointer drag; ocultar subtítulo; editar palabras; quitar gráficos, imágenes, B-roll o SFX; cambiar recurso por otro instalado; deshacer y descartar borrador. El vídeo anterior continúa disponible.
4. `web/app.js`: inicialización del modo por trabajo y serialización de cambios por evento sin sobrescribir otros ajustes. El guardado genera **otra versión** con API `jobs` y llama directamente al renderer existente, sin análisis IA.
5. `src/automatic-director.js`: `hiddenCaptionIds` admitido, límite y validación de identificadores únicos.
6. `src/local-pipeline.js`: valida correspondencia de los IDs ocultos con el plan y conserva el texto original en el manifest.
7. `src/local-preview.js`: no genera diálogos ASS de subtítulos marcados ocultos, sin cortar audio ni suprimir el resto de captions.
8. `tests/manual-caption-visibility.test.js`: nuevo test de ocultación reversible y validación de entradas malformadas.

## Criterio de aceptación

Abrir la última versión del vídeo de 70,9 s, pulsar Ajustar, situarse aproximadamente en 00:49, seleccionar el subtítulo `transformación` y pulsar Ocultar. La lista debe mostrar el segmento como oculto; el contenido hablado y el gráfico `CAMBIO PROFUNDO` se conservan. Tras Guardar y generar versión debe existir un nuevo ID de trabajo, render válido y subtítulo ausente únicamente en su intervalo. Validar exige revisión explícita de vídeo, gráficos y audio. No aceptar automáticamente.

## Pruebas ejecutadas

- `node --test tests/manual-caption-visibility.test.js tests/graphic-blocks.test.js tests/external-edit-plan.test.js tests/source-cuts.test.js`: 12/12.
- Browser QA aislado, con vídeo y eventos sintéticos, 393×852 y 1390×900: acciones, ocultación, B-roll, deshacer, protección de Validar y ausencia de overflow horizontal; errores JS 0 tras corrección de la superposición de capas.
- Este browser QA no usa sesión autenticada real y no sustituye una prueba de integración en un proyecto privado auténtico.
- `npm run check`: aprobado.
- Batería focalizada adicional con FFmpeg dentro del runtime aislado: **23/23 PASS**, incluyendo visibilidad de subtítulos, tarjetas, flujo de estudio, previsualización y B-roll manual.
- Primera batería integral en host: 358/377 pasa, 18 fallos por `ffmpeg ENOENT` (dependencia ausente del host) y un skip. No interpretar como 18 regresiones.
- Batería integral en contenedor con FFmpeg disponible, aislado y sin red: **376/377 PASS**. Único fallo: comprobación del propietario Git (`safe.directory`) no reproducible en el contenedor.
- La prueba `tests/deploy-service.test.js` en el host pasó **2/2**, incluida la comprobación Git que faltaba.
- `git diff --check` sin anomalías.

## Pendiente de V1 antes de desplegar

P0:
- Probar en proyecto real autenticado sin tocar el proyecto terminado (duplicar primero).
- Confirmar los tiempos y elementos compilados de gráficos complejos y B-roll tras cambios.
- Confirmar que el render final refleja la ocultación de la capa y que no reaparecen subtítulos de otra fuente.
- Verificar que la validación queda ligada al SHA del nuevo MP4.
- Verificar el editor con perfil móvil y tablet reales, el nuevo botón y la persistencia de versión tras recargar.
- Unificar y limpiar cambios anteriores aislados y decidir despliegue con rollback.

P1:
- Previsualización local de los 3–5 segundos afectados antes del render completo (actualmente reproduce la versión anterior hasta generar).
- Inspector editable de textos y capas automáticas que no proceden de `settings.graphicCards` o `settings.videoEvents` explícitos.
- Evitar solapamientos semánticos entre gráficos y subtítulos desde el Director, con override manual prioritario.
- Vista previa ampliada de un recurso antes de sustituirlo y mejor manejo de recursos de biblioteca Drive no materializados.
- Botones para recortar las puntas del bloque en la pista, además de su ajuste por números.

P2:
- Edición espacial de animaciones/máscaras directamente sobre el vídeo y keyframes.

## Restricciones importantes

- La previsualización después de un cambio manual sigue mostrando el último MP4. No prometer que el efecto se ve antes de renderizar.
- Solo se editan directamente los elementos que están representados con IDs/ajustes explícitos en la versión. Componentes automáticos sin representación reversible deben identificarse como pendientes, nunca desaparecer silenciosamente.
- No modificar el estado de producción hasta validación humana y técnica.

## Continuación recomendada a Work / Sol Medium

Comprobar rama `feat/manual-adjust-studio-20261028` en el servidor; ejecutar E2E autenticado en copia aislada del proyecto `5413b0fe-9b40-47d8-a2d0-65b18b178af9`; ocultar solo `transformación` en la línea temporal, comparar frames y subtítulos ASS, validar persistencia; reparar bugs y completar P0. Antes de fusión comprobar `git diff` de estado original para no pisar cambios pendientes. No hacer llamada a Gemini ni consumir créditos nuevos. Desplegar únicamente tras pruebas y copia de seguridad verificadas.
