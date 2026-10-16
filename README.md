# SUES AI VIDEO EDITOR · POC cloud

Módulo técnico de la Fase 2. Node.js 22+; render remoto con Shotstack sandbox.
No necesita ejecutar FFmpeg, IA ni render pesado en el PC. Tampoco usa Lovable o CapCut.

Fuente funcional viva: [Roadmap Maestro](https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit).
Leer primero este documento y `PROJECT_STATUS.md` para continuar.

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
