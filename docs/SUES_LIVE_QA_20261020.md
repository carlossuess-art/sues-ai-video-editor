# Prueba real Work y corrección de memoria · 20/10/2026

Se recuperó el acceso real del navegador Work mediante browserAuth. Primer intento
sin resultado de acceso:declined; no evidencia de contraseña incorrecta. Segundo
intento con correo y contraseña:submitted y editor autenticado visible, cuatro
trabajos y Cerrar sesión. La contraseña no fue leída ni puesta en chat/servidor/logs.
Google queda pendiente opcional: el objetivo de revisar en Work se resuelve con
la sesión SUES actual. No se han creado cuentas públicas, accesos sin contraseña
ni clientes OAuth. API y sesión visual se distinguen expresamente.

## Fallos observados

Original38,31s:HEVC Main1920x1080 con rotación; el navegador Work reproduce AAC,
pero videoWidth=0, sin error nativo y pantalla negra. El onerror existente no
explicaba este caso. Se añade aviso en loadeddata/playing y al volver a Original:
previsualizar en formato compatible. No se recodifica ni sustituye el original.
HEVC sigue dependiendo del soporte real del navegador; no afirmar imagen original
reproducible en Work. Montaje H264 es la ruta compatible.

Dos trabajos existentes FAILED, con SIGKILL de FFmpeg. Reproducción aislada con
misma imagen instalada, límite1GiB/0,5CPU, estado /state montado solo lectura y
copia privada del bundle:baseline alcanza1073741824 bytes y memory.events registra
oom1/oom_kill1. No es un mero aviso Fontconfig ni fallo de login.

La rama de focus hacía split y trim de la segunda entrada hasta15,06s. Framesync
retenía los fotogramas1080p de la rama principal hasta recibir el primero de la
rama retrasada. Se conserva la línea de tiempo completa en ambas ramas y se
aplican fade/enable en los tiempos absolutos originales. No cambia el efecto,
intensidad, ventana, audio o texto. El nuevo ENGINE_HASH invalida snapshots de
motor anterior; los fallidos se conservan y Previsualizar crea una versión nueva
con sus mismos ajustes, en lugar de reintentar su bundle antiguo.

## Pruebas antes de instalar

240 Node PASS y npm run check PASS. Regresión FFmpeg real:focus a18s debe producir
el primer fotograma azul sin alterar dentro de un límite virtual768MiB. Prueba
Chromium145 real escritorio1440x1000 y móvil393x852 con HEVC/AAC sintético:aviso de
imagen no compatible, conservación del aviso al volver a Original, sin overflow,
reintento tras fallo crea versión nueva y conserva exactamente la fallida. El
renderer de este último ensayo se hace fallar intencionadamente: NO valida render.

Comparación VPS real:el bundle con streaming produce38,3s H2641080x1920/30 con
AAC, fullDecode PASS, fuente intacta,18332121bytes y SHA256
2c26c0564cab764098164062589afa20f21fcca0b6d7ead8507154d3a2743404.
Pico463597568bytes (~442MiB), cero eventos OOM, mismo1GiB/0,5CPU. Fuente y ajustes
privados no se suben a Git. Evidencia pública solo de resultados:
examples/preview/focus-streaming.vps-real-result.json y
examples/preview/hevc-live-qa.local-chromium-result.json.

Antes de las pruebas, TAR verificado y154 archivos persistentes idénticos al
backup update-backup-20261020-131350-17153. Jobs originales sin modificar.
La comparación aislada no equivale a publicar el montaje desde la UI. Instalación
y recorrido final Work se registrarán tras completarlos. No cerrar F6/V1.

## Instalación y prueba real posterior

Oficial y VPS:9d8d07776f974b02cc74724b89b3b6b7e7a42e18, árbol
7521eb75a5386e0198b793434c6c5b8469ae4533, idéntico al checkout probado.
Anteriorb9969f8c. Launcher/updater sin modificar y SHA comprobados. Unidad
sues-editor-update-20261020-144641-2058f69e:SUCCESS/exitCode0 y systemd0.
Backup /opt/sues-video-setup/update-backup-20261020-144644-22424, TAR SHA256
948125e28ef63835292b3263a7027d9827d4738e5e870a2d714e8d49c7972f8d.
Contenedor anterior conservado; mismas cuotas1GiB/0,5CPU, sin cambios ajenos.

Recarga Work tras despliegue:sesión conservada y Cerrar sesión visible. Aviso
HEVC correcto en original. Crear otra versión desde trabajo fallido produjo
56e3df6c-e917-44a5-a71b-2bf42b04e09b. Cambio de zoom100→99, Guardar y Deshacer
verificados visualmente; vuelve100 y se mantienen los ajustes iniciales.
Previsualizar desde UI:progreso real, DONE en1intento. Originales154 archivos
persistentes sin cambios respecto al backup; solo se añade la copia QA y salidas.

Montaje reproducido desde Work:currentTime7,080334, duration38,3, paused=false,
readyState4, videoWidth1080/videoHeight1920, error=null. La fuente HEVC sigue
sin imagen en ese navegador; el H264 generado sí se reproduce. No se comprobó
escucha estética del audio ni se registró aprobación humana.

Descarga HTTP real autenticada:/api/jobs/<QA>/media devuelve200,18332121bytes,
SHA256 idéntico al audit y render aislado:
2c26c0564cab764098164062589afa20f21fcca0b6d7ead8507154d3a2743404.
Range0–31 devuelve206 y32bytes. Intentos siguen1 después de descargar:sin
recodificación. Audit fullDecode=pass, sourcePreserved=true, audioPresent=true.

Límite de la prueba visual:al intentar preparar el evento download y pulsar
Exportar, el navegador Work informó retained_data_restricted y reinició su kernel.
No se puede asegurar que ese clic se enviase. Una pestaña nueva en el origen y
el reinicio documentado del REPL no recuperaron observación:«native credential
state cannot be safely resumed». Se detuvieron los intentos de navegador; no
se leyó ni inyectó ningún token/cookie ni se pidió otra contraseña. Por eso
la descarga por botón, la captura final y recarga visual DESPUÉS del render
quedan pendientes. Descarga/API real y reproducción anterior sí verificadas.
No convertir esta restricción del runtime en un fallo de contraseña o de la web.

Siguiente:reabrir sesión de revisión en un runtime Work operativo y completar
el último clic/recarga visual. El acceso por contraseña está comprobado; Google
no es requisito para seguir. F9 es validación parcial real sobre material
recuperado, no una prueba completa de subida/análisis nuevo ni cierreF6/V1.
Auditar memoria de otros efectos que aún usan split+trim retrasado (transiciones
globales blur/radial) antes de ampliar esta conclusión a todas las plantillas.
No se afirma que esta corrección cubra esas ramas no ejercitadas.
