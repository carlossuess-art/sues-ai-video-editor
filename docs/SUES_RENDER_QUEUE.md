# Cola persistente y contrato del worker

La app conserva el motor y el vídeo CALMA existentes. Este bloque permite enviar
varias exportaciones en vez de recibir «Worker busy» para la segunda. No provisiona
un servicio cloud ni cambia el montaje. Worker local de FFmpeg, coste externo0USD.

## Comportamiento

Un worker activo y hasta16 trabajos esperando. ConstructorEditorJobs acepta
maxQueued1..100; no se expone por HTTP. EstadosPREVIEW_READY/FAILED→QUEUED→RENDERING→
DONE/FAILED/CANCELLED. La rama directaPREVIEW_READY→RENDERING del contrato general se
conserva para compatibilidad; este backend utiliza siempreQUEUED.

Cada submission aceptada guarda queueOrder monotónico/enqueuedAt en job.json mediante
snapshot atómico. FIFO usa ese orden, no timestamps que pudieran coincidir.
GET job incluye queuePosition (1..N esperando, null fuera de cola). UI muestra
posición y sigue consultando estado mientrasQUEUED/RENDERING.

POSTrender repetido enQUEUED/RENDERING/DONE es idempotente, sin intento adicional.
Cola llena devuelve409 sin cambiar el trabajo. CancelarQUEUED→CANCELLED no crea
un proceso ni intento. Cambiar ajustes requierePREVIEW_READY; duplicar completados
para nuevas versiones. Failed no se reintenta automáticamente: POST explícito,
revalidación completa y nuevo directorio de intento.

La cola persiste al cerrar el servidor y se reanuda al abrirlo. Cierre normal cancela
el activo y espera su grupo de procesos antes de liberar el lock; los pendientes se
conservan. Crash con activo dejaFAILED al reiniciar. Si su proceso antiguo sigue vivo,
worker.lock impide que el siguiente arranque; polling interno1s hasta quedar libre.
No se adopta automáticamente un MP4 huérfano ni se repite un envío de pago.

Los locks son exclusivos por directorio/host y dependen de PID namespace compartido.
No usar esta implementación como lock distribuido entre contenedores o réplicas.
Errores de lock corrupto requieren inspección; no se elimina a ciegas un lock activo.

## Contrato ejecutable

src/render-worker.js extrae lanzamiento/resultado del store. Request version1.0,
provider local-ffmpeg: jobId, attempt, fingerprint, bundleDigest, sourceSha256,
source/bundle/output/log locales absolutos yduration. Se guarda render-request.json
privado por intento antes del lanzamiento, sin token de sesión, secretos o URLs.
Actualmente el adaptador ejecuta Python/FFmpeg; no acepta un proveedor remoto ni
comandos de un cliente HTTP. No hay endpoints de trabajadores externos.

Digest SHA256 de manifest/director/settings/preparation/ASS/filtro y fuentes/OFL.
Se calcula al crear/revisar bundle y se compara al encolar/despachar/terminar. La
fuente y la preparación se vuelven a validar en despacho para detectar cambios en
espera. Legacy sin digest sólo se migra tras comparar manifest, grafoASS/filtro y
fuentes con la preparación vigente. Si cambia el motor/fingerprint, crear otro job.

Un exitcode0 por sí solo no significaDONE. El coordinador exige MP4ftyp, tamaño/hash
real, auditoría version1/sourcePreserved/fullDecode/audio, hash fuente correcto,
H2641080×1920/30 y duración con tolerancia1frame. Recomprueba bundle y fuente. La
decodificación íntegra se ejecuta en Python; Node verifica su auditoría y el archivo,
no vuelve a decodificarlo. Un resultado inválido va aFAILED y permite seguir a la cola.
Esto comprueba integridad técnica, no estética, captions aceptados ni calidad musical.

## Validación y comandos

`npm test` incluye FIFO/reinicio, submission duplicada, capacidad, cancelación antes
y durante worker, checksum inválido con exit0, y bundle alterado mientras esperaba.
Los workers de unit tests son sintéticos y no son evidencia de códec.

Smoke de integración con códec y API reales:

```
node scripts/app/smoke_queue_real.mjs RUTA_FIXTURE_SINTETICA RUTA_FUENTES NUEVO_DIRECTORIO
```

Requiere fixture de8–20s,1080×1920 y audio. Genera perfil/captions de prueba sin ASR ni
visión. Envía2trabajos víaAPI local, repite el segundoPOST, espera ambosDONE, compara
orden de final/inicio y descarga1024bytes porRange206. Guarda auditorías de FFmpeg.
No es validación con nueva voz de Carlos ni QA visual del navegador.

Resultado17/10: dos MP4 sintéticos de12s,130.823bytes cada uno, sourcePreserved y
fullDecodepass; un intento por job, sin solapamiento. Registro durable en
examples/preview/queue-real.synthetic-result.json. Vídeo real de Carlos del bloque
anterior se conserva y no se reexporta sin necesidad.

## Siguiente integración cloud

Mantener contrato de request/result y sustituir rutas por objetos privados mediante
un adaptador de almacenamiento; añadir cola con leases/heartbeat, identidad del
worker, fencing y ACK seguro. Separar servidor de sesión y coordinación del worker;
HTTPS, autorización por usuario/proyecto, cuotas y caducidad de recursos. El request
local actual no debe exponerse públicamente. Ninguna de esas capacidades se declara
implementada o desplegada en este bloque.
