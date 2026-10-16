# Contrato Video Edit Plan v1.0

Unidad: segundos; rangos de fuente [in,out). La timeline de salida concatena segmentos
en el orden de la lista. Las frases tienen tiempos sobre la SALIDA ya cortada.
El compilador es determinista y valida antes de cualquier POST. Ejemplo completo:
`examples/plan.json`. No contiene credenciales ni medios.

| Campo | Tipo y validación | Uso |
| --- | --- | --- |
| version | "1.0" | Versión del contrato |
| template | "SUES_CALMA_POC" | Único estilo habilitado |
| source.url | HTTPS accesible a workers | URL Ingest ready |
| source.duration | Número finito 30–60 | Metadato real |
| segments | 1–8 objetos {in,out} | 0≤in<out≤source.duration |
| texts | 0–60 objetos | rich-text; máximo 90 caracteres/frase |
| texts[].role | title / caption / outro | Estilo y posición |
| texts[].start, length | Inicio ≥0, longitud >0 | Dentro de la duración de salida |
| originalVolume | 0–1 | Voz original |
| music (opcional) | url HTTPS, duration, volume≤0.2 | Audio propio que cubra timeline |
| output | MP4, 1080×1920, 30fps | Fijo para POC |

Salidas: plan.json, edit.json, job.json, result.mp4 y preview.html. Los archivos runtime
contienen URLs/IDs de trabajo y se archivan privadamente, nunca en GitHub. El job
registra hashes, horas, IDs y referencia de los archivos, no la API key ni URL de PUT.

| Estado job | Significado / siguiente acción |
| --- | --- |
| CREATED | Registro creado |
| UPLOADING | Se solicita URL y sube el archivo; sourceId persistido antes del PUT |
| INGESTING | Se espera ready; sourceId permite consultar al reabrir |
| READY | Metadata/plan/edit validados |
| SUBMITTING | POST en curso; no repetir al reabrir |
| SUBMISSION_UNKNOWN | Resultado de POST incierto; recuperar ID del dashboard |
| RENDERING | renderId persistido; polling y descarga reanudables |
| DONE | MP4 descargado; archivar original/resultado y limpiar fuente |
| FAILED | Fallo confirmado de ingest/render o validación de metadata; limpiar fuente |
| CLEANED | Fuente de prueba eliminada; original y salida conservados |

Los timeouts y errores HTTP conservan el estado reanudable. Los fallos confirmados del
proveedor van a FAILED. El campo cleanupDueAt es una fecha de revisión, no un scheduler.
Si la subida se interrumpe, resume consulta el sourceId. Si no llega a ready, revisar
el dashboard y el job antes de crear otra prueba; no se reenvía automáticamente el PUT.

Fases posteriores ampliarán el contrato con transcript, tracking, motions, motivo
semántico y versionado de Brand Kit. No introducir esos campos silenciosamente en v1.
