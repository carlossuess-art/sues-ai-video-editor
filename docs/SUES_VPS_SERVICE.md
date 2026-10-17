# Arranque aislado del editor · 17/10/2026

Estado: preparado y probado en desarrollo; **no ejecutado en VPS**. F5 80%, global 48%.
Fuente inicial de este bloque: bec11220ee45a2d233d4be281c0ea34e0b648188.

## Qué faltaba

La fuente preparada por Carlos no acredita arranque. El snapshot anterior es
`eb441c712c9a6edd07c0d41b344adfdf0275c95d`; las diferencias posteriores hasta
bec1122 eran scripts/documentación de preparación. No requieren reinstalar npm.
La app sólo aceptaba Host/Origin loopback; faltaba un modo explícito para HTTPS.

Ahora `createEditorServer({publicOrigin:'https://dominio-confirmado'})` conserva
bind127.0.0.1, comprueba Host/Origin exactos y emite cookie Secure/HttpOnly/Strict.
No confía en X-Forwarded-Host/Proto. El proxy futuro debe preservar Host y ser el
único acceso a ese puerto. Este modo es de operador único, no multiusuario.
SUES_PUBLIC_ORIGIN permite configurarlo al arrancar; no está activado por el
instalador inicial. No hay DNS, certificados ni proxy nuevos en este bloque.

## Fuente, persistencia y recursos

`start-public-service.sh COMMIT40` recupera una release fija bajo
/opt/sues-video-setup/release.*, sin actualizar el checkout previo. Comprueba
fuente-directorio.txt, fuente-commit.txt, HEAD y package-lock idéntico. Monta las
dependencias ya preparadas, sin npmci/pull/build. No usa credenciales GitHub.
El runtime es sues-video-runtime:20261017, sin instalar paquetes en el host.

`prepare-service.sh` mantiene estado-servicio.txt, doctor-servicio.json y servicio.log.
Bloqueos impiden ejecución simultánea. Se conserva cualquier contenedor existente
sues-video-editor; no se sustituye ni reinicia. Un puerto3010 ocupado bloquea.
Contenedor: usuario1000, raíz/código/node_modules sólo lectura, sin capabilities,
no-new-privileges,0,5CPU/1GiB/256PIDs, tmpfs256MiB y logs rotados. Redhost permite
mantener el bind127.0.0.1 sin publicar un puerto Docker ni conectar redesWhatsApp.
Estado privado /opt/sues-video-setup/editor montado en /state. No acceso Docker
socket, credenciales o directorios WhatsApp. Reinicio unless-stopped y parada45s.
Un único contenedor/worker por directorio. No almacenamiento remoto ni backup
frente a pérdida del VPS. No se configura HTTPS ni se toca Caddy/WhatsApp.

SUES_TOKEN_FILE carga un token64hex persistente creado localmente; SUES_ACCESS_FILE
guarda enlace privado0600. Arranque no imprime el token en logs. No pegar este
archivo en chats ni GitHub. La consulta de estado no muestra secretos.

## Material mínimo privado

En /opt/sues-video-setup/editor/media:

| Archivo | Fuente existente | Necesidad |
| --- | --- | --- |
| original.mp4 | Drive 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82 | Vídeo real38,31s; SHA configurado50c56298e59f783b2dfe2979c80ddc4e83a84ab4eb9048aa56ff8423be67ba6a |
| transcript.json | Drive 11cNi2n-Qkim0_pKMkz2WMle3xDWH1nEa | Transcript ya calculado; no repetirASR |
| fonts/OpenSans.ttf | ZIP Drive 1el7DYji13Pj9aBOPIS5oz4KUQ8a8blj- | Regular400 |
| fonts/OpenSans-Bold.ttf | mismo ZIP | Bold700 |
| fonts/OFL.txt | mismo ZIP | Licencia |
| camera.json | generado desde examples/vision/poc001.mediapipe.json | No nueva inferencia |

Template/BrandKit/catálogo/visión ya están en Git. No necesitan packs, música,
B-roll ni los18,4GB catalogados. El instalador informa si detecta posibles copias
previas en el checkout preparado, pero no mueve originales ni los publica.
Los medios siguen privados: falta transferencia autenticada/restauración real en
VPS; el script no inventa URLs públicas. Si faltan archivos guarda PENDIENTE MEDIOS
y sale sin arrancar. project.json se crea sólo si no existe, con rutas /app y /state.
Doctor valida hash, plan, audio, fuentes y filtros sin render/ASR/visión nuevos.

## Lanzamiento desde móvil

Descargar el launcher de un COMMIT40 publicado y comprobar su SHA256 comunicado.
Ejecutar `nohup bash launcher.sh COMMIT40 >>servicio.log 2>&1 </dev/null &`.
Consulta única: `cat /opt/sues-video-setup/estado-servicio.txt`.
El bloque entregado en chat contiene el commit y hash reales, no marcadores.
Cerrar consola no interrumpe. Si termina PENDIENTE MEDIOS, restaurar sólo los cinco
archivos anteriores con permisos1000/600 y relanzar. No repetir runtime/npm/tests
históricos en el VPS. Tras doctorOK arranca loopback y comprueba shellHTTP.
Esto aún no prueba preview/exportación real en VPS, HTTPS o aceptaciónV1.

## Validación y siguiente paso

136/136 tests y npm run check en desarrollo; bash-n de ambos scripts.
Nueva regresión HTTP real de origenHTTPS/cookieSecure y encabezados falsificados;
regresión de orígenes inválidos sin adquirir lock; fixtureBash con Docker/Git
simulados comprueba parada por medios ausentes, config y reutilización del lock.
Docker no está disponible en desarrollo; no se afirma prueba real del contenedor.
Costes externos nuevos0; sin ASR/visión/modelos/servicios contratados.

Siguiente: ejecutar bloque en consola, leer estado-servicio.txt, restaurar medios
mínimos faltantes y comprobar API→ajuste→render→Range en VPS. Después, con el
host/proxy observado, conectar dominioHTTPS sin interrumpir WhatsApp. Subida y
análisis de cualquier vídeo nuevo siguen pendientes; no declarar V1.
