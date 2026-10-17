# CALMA: Director automático y estudio local

Este bloque reutiliza el repositorio oficial, los contratos y el renderer existente.
No requiere Lovable, modelos nuevos, suscripciones, llamadas ASR o inferencia de visión.
El worker se ejecuta en Work; no se exige instalarlo en el PC de Carlos. Es un
prototipo local del worker, no sustituye la arquitectura cloud-first ni proporciona
una URL pública estable, subida autónoma de nuevos vídeos o autenticación multiusuario.

## Montaje desde un comando

Preparar original/transcript/fonts siguiendo SUES_CALMA_LOCAL_PREVIEW.md y generar
cámara con `npm run reframe -- examples/vision/poc001.mediapipe.json runtime/calma/camera.json`.
El ejemplo `examples/projects/calma-local.example.json` resuelve cada ruta desde su
propio directorio. No contiene claves, URLs temporales ni medios pesados.

```
npm run automatic:preview -- examples/projects/calma-local.example.json runtime/mi-version --render
npm run editor -- examples/projects/calma-local.example.json runtime/editor-jobs 4173
```

El destino del bundle debe ser nuevo. El CLI guarda Director, manifest, captions,
filtro, fingerprint, fuentes/licencia, vídeo y auditoría. Sin `--render` sólo prepara.
`--settings archivo.json` admite:

```json
{"zoomIntensity":0.75,"motions":true,"captionOverrides":{"seg-001":"Puedes sentir."}}
```

No se ejecuta una transcripción o análisis de visión al cambiar ajustes. Los
subtítulos mantienen tiempos; una edición se marca manual y conserva texto original.
Las palabras de más de26 caracteres o bloques que no caben en dos líneas se rechazan.
Un cambio de datos, motor o fuentes cambia el fingerprint y exige un trabajo nuevo.

## Director automático: alcance real

`automatic-director.js` es un baseline léxico determinista español, no un LLM.
Busca coincidencias como reconocer/detenerte/sentir/temores, dentro de ventanas de
3–6 palabras y sin cruzar finales de frase. Ordena candidatos y aplica presupuesto,
bookends, pausas entre zooms y cap combinado1,60×. Máximo3 zooms, uno por15s de
presupuesto; fuentes de menos15s no reciben zooms en este baseline. Una cita como
máximo; texto literal de3–5 palabras, nunca reescrito. La permanencia de la cita puede
extenderse para lectura; no se modifican timestamps ASR ni se afirman tiempos nuevos.
Cada decisión conserva índices y marcas originales, coincidencias, regla y método.

El montaje conserva [0,duración) completo: no hay cortes de voz ni eliminación
automática de silencios. Se retira el antiguo corte mecánico12–13s del POC, que
omitía3 palabras. Si no hay coincidencias, no hay eventos inventados. El contenido
del transcript se trata como datos, nunca como instrucciones de herramientas.
Los eventos propuestos pasan por validación geométrica por frame y catálogo. Los
no seguros se descartan con motivo; errores de la base no se esconden por fallback.
La comprensión de ideas, negaciones, arco narrativo y selección B-roll por IA sigue
pendiente. El uso de una palabra no acredita por sí mismo una elección editorial.

## App

El enlace de acceso se imprime al iniciar. El servidor escucha sólo127.0.0.1.
Su token se recibe en fragmento, se retira del historial y se cambia por cookie
HttpOnly/SameSite=Strict. Se comprueban Host/Origin y cabecera explícita para cambios.
CSP sin terceros; sin importaciones de fuentes remotas ni trackers. No exponer este
HTTP local con un túnel como si fuera producción. La sesión no usa TLS porque no
sale del loopback; despliegue real exige HTTPS, usuarios y aislamiento de medios.

Pantallas de este prototipo: material ya preparado, trabajos, montaje, ajustes,
captions, exportación, reproductor y descarga. Sólo CALMA se ofrece como estilo
visual funcional. Impacto/Explica/Historia conservan sus contratos, no una falsa UI
operativa. Plantillas, Brand Kit y Motion Library tienen pantallas de consulta conectadas a
los archivos reales. La edición de identidad/catálogo y la selección manual de
motions en UI siguen pendientes.

API privada local:
- POST /api/session con Bearer token → cookie de sesión.
- GET /api/profiles y GET/POST /api/jobs.
- GET/PATCH /api/jobs/:id; PATCH recibe settings completos.
- GET /api/jobs/:id/plan; POST .../render; POST .../cancel.
- GET/HEAD .../media (Range simple, sufijos y416); GET .../audit.

No permite rutas, comandos, claves de proveedor, URL remotas ni uploads desde HTTP.
Sólo perfiles locales configurados por el operador. Peticiones JSON limitadas64KiB.
El token de arranque no se guarda en Git ni se envía al navegador dentro del HTML.

Cada trabajo tiene UUID, journal de estados, snapshots atómicos y bundles
inmutables por revisión. Un solo servidor posee el directorio; un solo worker
exporta a la vez, con lock de proceso. Repetir render duranteQUEUED/RENDERING/DONE es
idempotente. Cada reintento fallido usa un directorio nuevo; no pisa vídeos previos.
Cancelar termina el grupo del worker y FFmpeg, y espera su salida antes de marcar
CANCELLED. Al reiniciar, un trabajo interrumpido pasa aFAILED y permite reintento;
si el proceso anterior aún vive, el lock impide lanzar otro render simultáneo.
Un trabajoDONE se duplica para ajustar otra versión. La UI no usainnerHTML con
contenido del usuario: texto/captions se asignan mediante textContent/value.

## Validación

Tests offline para literalidad/determinismo/voz íntegra, settings y presupuesto,
fallos de geometría, ediciones de captions, sesión, origen/Host, rutas, persistencia,
idempotencia, worker ocupado, cancelación, reinicio y ranges. Los tests de lifecycle
usan un worker sintético pequeño; un smoke separado ejecuta FFmpeg real con el
original de Carlos para verificar integración, decodificación y fuente intacta.
No equivalen a aprobación humana de captions, escucha o aceptación estéticaV1.


## Música propia opcional

No se selecciona música por defecto ni se descargan pistas de terceros. El perfil
local puede declarar backgroundAudio con assetId, rights (owned/licensed), localFile,
gain (0..0,18, excluido0) y sourceIn. Ruta relativa al perfil; requiere audio de
longitud suficiente para el montaje, sin loop implícito. El operador declara sus
derechos: el motor no los verifica jurídicamente ni inventa una licencia.

Se conservan los segmentos de voz originales en una rama propia. Sólo la música
pasa por sidechain de voz (threshold0,025,ratio6,attack25ms,release350ms), con fade
1,2s/2s y limitador final0,95 sin normalización automática. Se valida hash antes y
después del recurso, duración del stream de audio y salida. Sin pista configurada,
el grafo de voz anterior permanece idéntico. No SFX automáticos nuevos.

Smoke de audio reproducible:
`node scripts/templates/smoke_audio.mjs NUEVO_DIR DIRECTORIO_FUENTES`.
Usa tonos sintéticos propios440/880Hz y mide presencia de voz, reducción durante
voz y fade final. No representa escucha ni valoración musical del material real.

## Shell PWA

Manifest, icono tipográfico provisional y service worker de shell están incluidos.
No es logo final ni confirma instalación. Cache sólo HTML/JS/CSS/icono/manifest;
nunca jobs, transcripciones, API, tokens o vídeos. El procesamiento requiere worker
accesible. No se declara una app offline de edición ni despliegue móvil terminado.

## Resultado real del bloque

Vídeo completo38,30s,75/75 palabras,16captions, dos zooms relativos1,07×
(intensidad75 %) y cita literal. Máximo combinado1,498×. Ver plan y auditoría en
examples/director/calma-automatic-real.json y examples/preview/calma-automatic-real.audit.json.
API real: crear→plan→ajustes→render→DONE→Range206/1024bytes. Un render pese a POST
repetido; fuente intacta,1080×1920/30fps,AAC y decodificación íntegra. La corrección
posterior del fingerprint añadió hashes de bytes de medios: plan idéntico y grafo/
ASS byte idénticos al render verificados. Suite114 tests y check del frontend incluidos.
Revisión visual de frames de vídeo hecha; no QA visual del navegador ni aceptaciónV1.


Actualización de cola: la segunda exportación entra enQUEUED, con posición y
cancelación, en lugar de rechazar por worker ocupado. Pendientes sobreviven al
cierre. Resultado119tests y smoke real de2exportaciones en serie en
[Cola y worker](SUES_RENDER_QUEUE.md). No sustituye despliegue cloud ni QA visual.


Estado operativo posterior: exportación muestra porcentaje obtenido de FFmpeg,
comprobación de integridad y guardado privado;100% sóloDONE. Sidebar muestra conteos
de procesamiento/cola/guardado. GET/api/health es privado y no ejecuta diagnóstico
pesado; npm run editor:doctor -- CONFIG verifica dependencias/medios/fuentes sin
render. Ver SUES_RENDER_PROGRESS.md. Última suite129tests.


Revisión editorial: highlightCaptions acepta hasta3IDs de captions para citas de
usuario (sustituyen las citas automáticas, mantienen zooms). No se aceptan citas
inseguras silenciosamente; falla el ajuste conservando versión previa. Undo privado
POST/api/jobs/:id/undo restaura hasta10ajustes como revisiones nuevas. Guardar el mismo
fingerprint no duplica bundles. GuíaSUES_EDITORIAL_REVIEW.md; suite133tests.
