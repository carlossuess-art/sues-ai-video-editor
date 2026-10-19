> Perfiles combinables (19/10/2026): DOPAMIN experimental + CALMA conservada +
> ELEMENTS (LIST/RANKING/COMPARE/REVEAL/Q&A/FLOW), con elecciones explícitas.
> [Arquitectura, auditoría, catálogo y límites](docs/SUES_COMPOSABLE_PROFILES.md).
> No desplegado en VPS; consultar PROJECT_STATUS.md y la rama oficial vigente.

> CALMA · 18/10/2026: referencia prioritaria Keanu/deckeanu, grupos de1–3 palabras,
> Inter como aproximación visual, foco desenfocado y nueva prueba con música ambiental.
> [Estado y límites](docs/SUES_CALMA_KEANU_REFERENCE.md). Aceptación estética y VPS pendientes.

> Actualización 18/10/2026: el estudio admite subida privada desde la app y recuperación
> de análisis existentes. Dos ciclos reales CALMA por HTTP comprobados en Work.
> [Guía de subida y límites](docs/SUES_VIDEO_UPLOAD.md). VPS/HTTPS y análisis automático
> de cualquier vídeo nuevo siguen pendientes; no se declara V1.

# SUES AI VIDEO EDITOR

Editor SUES en desarrollo: CALMA con cámara/captions/motions, Director léxico
offline y estudio local del worker Work. La arquitectura objetivo sigue siendo
cloud-first; no se exige al PC de Carlos realizar el trabajo pesado.
El POC Shotstack sandbox se conserva como ruta de render cloud independiente.

Fuente funcional viva: [Roadmap Maestro](https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit).
Leer primero este documento y `PROJECT_STATUS.md` para continuar.

## Estado ejecutable actual

Leer PROJECT_STATUS.md antes de cambiar el proyecto. CALMA tiene definición cerrada y es funcional;
IMPACTO, EXPLICA e HISTORIA son variantes experimentales ejecutables. Edición de
palabras clave, medios privados, gráficos/transiciones y copia recuperable están
integrados. [Funciones y límites](docs/SUES_GENERAL_STUDIO.md). No declarar V1
ni aceptación humana por superar pruebas técnicas.

Comprobación previa sin render ni llamadas de pago: `npm run editor:doctor -- CONFIG`.
La app muestra progreso real de codificación y distingue comprobación/guardado.

Con medios y análisis previamente preparados:

```sh
npm run automatic:preview -- examples/projects/calma-local.example.json runtime/mi-version --render
npm run editor -- examples/projects/calma-local.example.json runtime/editor-jobs 4173
```

Node22+, Python3, FFmpeg/ffprobe conlibass yfontconfig en el worker. Fuentes/licencia
Open Sans y medios propios fuera de Git. Preparación y rutas exactas:
[Estudio local](docs/SUES_LOCAL_EDITOR.md), [Medios/fuentes](docs/SUES_CALMA_LOCAL_PREVIEW.md).
No llama modelos ni proveedores al ajustar/exportar. Guarda75/75 palabras en la
prueba real; el corte técnico del POC no se aplica al Director automático.

El estudio escucha sólo loopback, no proporciona una URL pública ni ingesta de
nuevos vídeos con ASR/visión. La UI incluye montaje, ajustes, plantillas, Brand Kit
 y catálogo de motions; las plantillas permiten elegir variantes. Manifest/SW
preparan el shell PWA; instalación/QA visual en navegador aún pendientes. El SW
no cachea medios ni API. No ejecutar nuevos servicios de pago por defecto.

La exportación admite una cola persistente FIFO (un worker activo y hasta16 en
espera). La UI muestra posición y permite cancelar. Un resultado sólo pasa aDONE
tras comprobar MP4, auditoría, hash/tamaño/duración y fuente/bundle intactos.
[Cola y contrato del worker](docs/SUES_RENDER_QUEUE.md).

Los MP4 nuevos y sus auditorías se archivan en objetos privados por trabajo.
Si falla el guardado se reintenta sin repetir el render; tras reinicio se pueden
recuperar renders completos. [Almacén privado](docs/SUES_PRIVATE_STORAGE.md).

Los captions permiten seleccionar hasta3frases como citas, respetando rostro y
zonas seguras. Guarda/deshaz hasta10ajustes sin reanalizar medios ni sobrescribir
versiones. [Revisión editorial](docs/SUES_EDITORIAL_REVIEW.md).

## Ruta histórica: POC cloud de Fase2

## Validar sin cuenta, vídeo ni coste

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run check
npm run dry-run
```

El último comando crea `runtime/demo/plan.json` y `edit.json`. La URL de example.com es
un marcador para validación offline, NO un vídeo real ni un render ejecutado.
El snapshot oficial OpenAPI permite validar sin volver a consultar al proveedor.

## Ejecutar cuando haya acceso y vídeo real

1. Crear cuenta gratuita en https://app.shotstack.io/ sin tarjeta ni plan de pago.
2. API Keys → Sandbox. La cuenta debe conservar al menos 1 crédito activo.
3. Copiar `.env.example` a `.env` y configurar `SHOTSTACK_STAGE_API_KEY` mediante
   el editor/gestor de secretos; nunca pegar la clave en chat, Drive, commits o comandos.
4. Proporcionar un MP4/MOV/WEBM de 30–60 s, hasta 250 MiB; preferiblemente vertical.
5. Desde Work (el PC sólo necesita subir el archivo):

```sh
npm run poc -- run /ruta/video.mp4 --out runtime/prueba-001 --execute-stage
```

Se sube a Ingest stage, se espera a que esté listo, se lee duración/medidas reales,
se construye y valida el timeline, se solicita UN render, se consulta su estado y
se descargan `result.mp4` y un reproductor `preview.html` en el directorio del job.
No hay que elegir otro proveedor ni desarrollar nada para esta primera prueba.

```sh
npm run poc -- resume runtime/prueba-001 --execute-stage
npm run poc -- cleanup runtime/prueba-001 --execute-stage
```

`resume` no reenvía un render ya solicitado. Antes de `cleanup`, guardar el original y
MP4 final en `06_PRUEBAS · VÍDEOS` de Drive. La limpieza borra sólo la fuente subida de
ese job y mantiene la copia original local y el resultado. El directorio runtime debe
conservarse hasta acabar; no es un servicio cloud persistente ni un scheduler.

## Recuperación excepcional

Si falla la respuesta del POST, el envío queda `SUBMISSION_UNKNOWN`: no se reintenta
porque el proveedor podría haberlo recibido. Buscar el ID en el dashboard y ejecutar:

```sh
npm run poc -- recover runtime/prueba-001 --render-id ID_REAL --execute-stage
```

Sólo acepta un render cuyo payload coincida con el guardado. Si no coincide o no puede
comprobarse, revisión manual antes de continuar. Tras un cierre forzado puede quedar
`.lock`: comprobar primero que NO sigue ejecutándose el proceso de ese job, conservar
`job.json` y retirar únicamente ese lock antes de `resume`. Nunca borrar el job para
«reintentar»: se perdería el ID y se podrían duplicar solicitudes.

## Límites de esta entrega

19 pruebas offline pasan. Primer render real completado el 16/10/2026: 37,3 s,
1080×1920/30fps, Sandbox con marca de agua y coste 0 USD. Original/resultado archivados
en Drive y fuente Ingest eliminada. Ver `docs/POC_RESULTS_001.md`.
El corte 12–13 s es un marcador mecánico para comprobar el montaje, no una decisión
semántica. La plantilla definitiva, ASR, seguimiento de ojos y Director IA pertenecen
al resto del roadmap. No se ha desplegado una nueva web.

Ver `docs/POC_PHASE_2.md`, `docs/ARCHITECTURE.md`, `docs/PROVIDER_RESEARCH.md` y
`docs/VIDEO_EDIT_PLAN.md` para criterios, costes, contrato y siguientes pasos.

## Estado actual de Fase 3

Primer ASR real y render subtitulado archivados. 36 tests aprobados.
Fase 3 completada: Carlos validó los subtítulos por bloques y su sincronía aproximada.
La precisión palabra a palabra se revisará al implementar ese estilo. Global 25 %.
Ver PROJECT_STATUS.md y docs/ASR_RESULTS_002.md; no repetir ASR de pago.

## Preview integrado local de CALMA

La plantilla provisional ya dispone de cámara, cortes, captions, outro y compositor B-roll local con verificación de medios. Guía y evidencias: [SUES_CALMA_LOCAL_PREVIEW](docs/SUES_CALMA_LOCAL_PREVIEW.md). `npm run preview:prepare`, `npm run preview:render` y `npm run preview:smoke` trabajan sin servicios de pago. La estética y la aceptación E2E siguen pendientes; consultar siempre [PROJECT_STATUS](PROJECT_STATUS.md).

### Motions y zoom semántico de CALMA

[Guía de render semántico](docs/SUES_CALMA_SEMANTIC_RENDER.md): dos zooms de demostración anclados a ojos y tres motions ASS probados. `npm run semantic:smoke` verifica el anclaje en vídeo. La selección de la muestra es manual desde el transcript; el Director automático sigue pendiente.

Dossier Keanu aplicado: texto progresivo, entrada por caracteres e imágenes con máscara suave.
Detalle, límites y continuidad: [guía de aplicación](docs/SUES_KEANU_DOSSIER_APPLICATION.md).
