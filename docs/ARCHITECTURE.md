> **Documento histórico de la POC Shotstack.** El motor actual en el VPS usa Node/FFmpeg/ASS y almacenamiento privado. Consultar [diagnóstico y plan vigente](SUES_FIRST_DIAGNOSIS_MASTER_PLAN_20261025.md) y [arquitectura de las cinco capacidades](SUES_INTELLIGENT_EDITOR_ARCHITECTURE_20261024.md). No aplicar la ausencia de backend de esta POC al despliegue actual.

# Arquitectura POC · decisión provisional

El proceso ligero se ejecuta en Work; toda la codificación de vídeo se ejecuta en
Shotstack. No existe todavía un backend web persistente ni base de datos.

| Etapa | Responsable | Persistencia |
| --- | --- | --- |
| Original | Carlos / Drive privado | Intacto en 06_PRUEBAS |
| Upload | CLI → Ingest stage → PUT firmado | sourceId en job local |
| Metadatos | GET source hasta ready | Duración/medidas en job |
| Plan | Plantilla determinista propia | plan.json |
| Adaptación | buildEdit + Ajv/OpenAPI | edit.json + hashes |
| Render | POST Edit stage, una vez | renderId y estado atómico |
| Supervisión | GET render con espera acotada | job.json |
| Entrega | Descarga MP4 y player HTML local | Copiar a Drive al terminar |
| Limpieza | DELETE source por ID del job | Marca CLEANED; original intacto |

El contrato Video Edit Plan es propio y no depende del proveedor. Shotstack sólo
recibe Edit JSON compilado; el futuro Director IA producirá ese mismo contrato.
La CLI puede sustituirse por endpoint/worker manteniendo plan, adaptador y tests.
MCP será una fachada posterior. En este POC no se añade API de IA: la edición es
mecánica para aislar si ingest/timeline/render funcionan.

## Almacenamiento y privacidad

Ingest permite subir sin contratar S3/R2 adicional. El PUT firmado es temporal pero
la URL fuente que devuelve el proveedor es accesible por URL y permanece hasta
borrarla. Se aloja en AWS Sydney según la guía. No se hace público un archivo de Drive.
No confundir URL difícil de adivinar con autorización privada.

Se fija `cleanupDueAt` a +24 h y se proporciona comando de limpieza; NO se ha creado
un borrado programado. El operador debe ejecutar cleanup tras guardar el resultado
o revisar los jobs pendientes al finalizar la sesión. No afirmar caducidad automática.
No usar este POC para vídeos sensibles ni material de terceros sin autorización.

El render lleva `destinations:[{provider:'shotstack',exclude:true}]` para evitar el
hosting permanente/CDN por defecto. La URL temporal de salida dura 24 h. La descarga
se realiza inmediatamente y después se conserva el MP4 en Drive; Git nunca guarda medios.

## Seguridad operativa y recuperación

Sólo variable SHOTSTACK_STAGE_API_KEY y endpoints hardcoded stage. Sin parámetros
para producción, pagos, generación IA, enhancement ni destinos externos. El payload
se limita a video/audio existentes y rich-text. POST sin reintentos automáticos.
Los GET esperan como máximo 10 minutos; timeout conserva IDs para `resume`.
Bloqueo por job, escritura atómica y hash del payload antes de enviar. Estado incierto
si la conexión cae al enviar; reconciliar ID del dashboard en lugar de duplicar POST.

Fuentes y MP4 se transmiten en streaming; límite de fichero 250 MiB. `.env`, runtime,
medios y node_modules están ignorados. La CLI es una herramienta confiada de operador,
no un endpoint expuesto a usuarios: no garantiza defensa SSRF para una futura app.
En Fase 8 añadir autenticación, URLs firmadas propias, cuotas, cola durable y expiración
real automatizada antes de admitir subidas públicas.

## Esquema oficial

Snapshot sin modificar: vendor/shotstack-edit.openapi.json, recuperado el 16/10/2026.
OpenAPI incluye additionalProperties:false en los wrappers Asset/Destinations sin
properties propias: un validador JSON Schema puro rechazaría todos los miembros.
Se elimina esa restricción sólo en esas dos copias en memoria; las variantes de Asset
mantienen su validación y el único destino admitido se comprueba exactamente en código.
No se cambia el snapshot ni se deshabilita la validación del payload.
