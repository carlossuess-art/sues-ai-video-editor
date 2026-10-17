# Almacén privado y recuperación de exportaciones

Continúa la app/cola/worker existentes. El adaptador actual usa disco privado en
Work, no almacenamiento cloud contratado ni durabilidad frente a borrado del host.
No se abre una URL pública, no se crea una cuenta ni se ejecutan llamadas pagadas.

## Objetos y ámbito

LocalPrivateStorage expone put(source,context,{mediaType}) y resolve(reference,context)
como operaciones async. Context incluye ownerId/projectId controlados por backend.
Cada objeto se identifica por SHA256 dentro de ese ámbito; repetir put del mismo
contenido es idempotente. Se copia por bloques a temporal privado y se enlaza de
forma exclusiva al nombre final, sin sobrescribir objetos o fuentes. Límite por
objeto256MiB configurable. Sólo video/mp4, application/json y octet-stream.

Se rechazan IDs/rutas que escapan del ámbito, symlinks, tipos incorrectos, permisos
amplios, referencias de otro ámbito, tamaños o hashes alterados. Directorios700,
objetos600. resolve comprueba hash/tamaño antes de devolver una ruta interna, nunca
una URL pública. No hay endpoint que acepte una ruta o referencia arbitraria.

El backend loopback actual usa ownerId local-session y projectId=UUIDdel trabajo.
Es aislamiento técnico del almacén, no autenticación multiusuario. Un adaptador
cloud debe derivar ámbitos de identidad autenticada y aplicar autorización real.
No hay cifrado en reposo implementado, servicio de objetos remoto, cuotas totales,
retención o borrado automático. Acceso del mismo usuario del SO puede modificar
archivos; las lecturas detectan cambios, no se afirma inmutabilidad de hardware.

## Finalización y reintentos

El worker termina y se valida el render como antes. LuegoRENDERING→PUBLISHING:
se guardan MP4 y auditoría como objetos privados, se resuelven y verifican, y se
persisten referencias antes deDONE. Descarga y auditoría usan esas referencias.
LosDONE legacy sin referencia conservan su ruta anterior; no se migran a ciegas.

Un error de guardado producePUBLISH_FAILED. POSTrender en ese estado reintenta sólo
el guardado del mismo intento, sin FFmpeg/ASR/visión. La UI muestra «Reintentar
guardado» y sigue consultandoPUBLISHING. EnQUEUE/RENDERING/PUBLISHING/DONE losPOST
duplicados no crean otros intentos. Resultados de render inválidos siguen enFAILED,
no se presentan como fallo recuperable de almacenamiento.

Al abrir el store, un trabajoRENDERING con request/auditoría/MP4 completos y válidos
se recupera comoPUBLISHING sin lanzar un worker nuevo. UnPUBLISHING interrumpido se
reanuda si su resultado sigue válido. Se compara job/attempt/fingerprint/digest,
fuente/bundle/output/duración con el trabajo y perfil configurado. No se adoptan
archivos ajenos ni se confía en un JSON de auditoría aislado. Incompleto/inválido en
RENDERING→FAILED; guardado interrumpido inválido→PUBLISH_FAILED para inspección.
Los logs/request temporales no se copian al almacén como si fueran entregables.

Los pendientes de cola pueden seguir cuando el worker queda libre; almacenamiento
se ejecuta en su propio paso. Al cerrar servidor se espera cualquier guardado en
curso. No se borra el runtime real ni los originales automáticamente.

## Pruebas

Tests de scopes/symlinks/permisos/corrupción/límites/deduplicación, guardado fallido
seguido de retry con un solo render, descarga tras retirar el render temporal y
reiniciar, y adopción de render terminado sin nuevo worker. Estos usan fixtures de
lifecycle; no son pruebas de códec. Suite125 tests en el hito de integración.

Smoke real reproducible con fuente sintética8–20s1080×1920 y audio:

```
node scripts/app/smoke_storage_recovery.mjs SOURCE FONTS NEW_DIRECTORY
```

Ejecuta la prueba de cola/FFmpeg de2MP4, comprueba el archivo privado, retira sólo
los render temporales sintéticos recién creados, reinicia la app y vuelve a obtener
vídeoRange206 y auditorías con sus hashes originales, sin nuevos intentos. No toca
el vídeo de Carlos, no es QA visual ni aceptación estética. Resultado persistido
en examples/preview/storage-recovery.synthetic-result.json.

## Límite de despliegue

La administración del VPS Hostinger no aparece como herramienta callable en esta
sesión. Los9servidores constan en configuración, pero sólo hay herramientas AI
Builder de Hostinger expuestas. No se sustituye la capacidad ausente con SSH/API
manual, ni se modifican dominios/VPS/cuentas. El código queda preparado y probado;
el alojamiento real necesita la conexión de administración operativa y revisión
del destino, además de HTTPS/autorización/almacenamiento duradero. No se pide una
suscripción nueva para resolverlo.


Comprobación de alternativaSupabase17/10: lecturas de metadatos confirmaron planfree,
un proyectoBoards inactivo y otro activo dedicado al Oráculo. No se identifica uno
para el editor. No se reutiliza el proyecto del Oráculo, no se alteran tablas/buckets,
no se crean proyectos ni se aceptan costes. Sigue pendiente elegir/proveer destino
cloud adecuado cuando esté operativo el acceso de administración.
