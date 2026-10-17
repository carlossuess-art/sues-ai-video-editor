# Hostinger: procedimiento de consola

Decisión explícita de Carlos, 17/10/2026: entregar bloques completos para pegar
en la consola web de Hostinger. Las descargas e instalaciones largas se ejecutan
en segundo plano con `nohup`, un log y una forma de consultar su estado. No
depender de dar acceso directo al asistente. Buscar antes el trabajo de otros
chats y reutilizar la infraestructura ya instalada.

## Siguiente bloque vigente · servicio aislado

Carlos confirma «Código preparado y comprobado»: fuente informada, no arranque.
Ver [SUES_VPS_SERVICE.md](docs/SUES_VPS_SERVICE.md). El nuevo launcher recupera una
release fija y reutiliza runtime/node_modules; no repite instalaciones. Comprueba
los marcadores de fuenteVPS antes de usarlos. Si faltan original/transcript/fonts,
registra PENDIENTE MEDIOS y no arranca. Cámara sin inferencia desde datos existentes.
Con medios/doctorOK prepara contenedor sólo127.0.0.1:3010, privado y limitado.
HTTPS todavía pendiente; Caddy/WhatsApp sin cambios. Nunca publicar token/medios.
Bloque de consola único con nohup/log/flock. Consulta:
`cat /opt/sues-video-setup/estado-servicio.txt`.

## Inventario histórico recuperado

Fuente: búsqueda de contexto de conversaciones, realizada el 17/10/2026.
Son observaciones anteriores; no acreditan el estado actual del servidor.

| Dato | Observación anterior |
| --- | --- |
| Servidor | 76.13.51.232; root por consola web/SSH 22; hostname srv1841004 observado en julio |
| SO | Ubuntu 24.04.4 LTS, x86_64, inventario del 28/09/2026 |
| Herramientas del host | Git, Docker, rsync y curl presentes; Node/npm/Nginx/Certbot ausentes el 28/09 |
| WhatsApp | `/opt/sues-whatsapp/compose.yml`, proyecto Compose `sues-whatsapp` |
| Contenedores | `sues-whatsapp-caddy-1`, `sues-whatsapp-whatsapp-connector-1` |
| Red | `sues-whatsapp_default` observada en septiembre |
| Puertos | Caddy 80/443; conector 127.0.0.1:3001; no usar 3001 para el editor |
| Dominio WhatsApp | wa.suesholistics.com; DNS de dominio reportado en Cloudflare |
| Recursos | ~41 GB libres y ~3,1 GB RAM disponible el 04/09; capacidad actual pendiente |

No se recuperan ni guardan contraseñas, tokens ni claves privadas. No se da por
instalado Cobalt/FFmpeg/faster-whisper: constaban propuestas, sin prueba de instalación.
Las propuestas históricas de Python/FastAPI no sustituyen la implementación
vigente del editor en Node + worker Python/FFmpeg.

## Inventario actual recibido · 17/10/2026

Fuente: capturas de Carlos del informe ejecutado aproximadamente06:00–06:04UTC.
Host srv1841004, Ubuntu24.04.4 LTS x86_64, kernel6.8.0-136-generic. 1CPU,
RAM3,8GiB/~3,1GiB disponible, swap0, disco48G con40G libres. Git2.43.0,
curl8.5.0, rsync3.2.7, Python3.12.3; Docker29.6.2 y Composev5.3.1.
Node/npm/FFmpeg/ffprobe/gh no instalados en el host.

Activos: sues-whatsapp-whatsapp-connector-1 (127.0.0.1:3001, Up2days) y
sues-whatsapp-caddy-1 (caddy:2.10-alpine, 80/443, Up2months). Red
sues-whatsapp_default. Otros listeners:22, DNSlocal53 y127.0.0.1:65529.
El banner indica reinicio pendiente; este procedimiento no reinicia ni actualiza
el sistema operativo. No asumir que el puerto65529 pertenece al editor.

## Siguiente paso ejecutable

### Vía vigente: repositorio público y descarga sin login

Carlos autoriza cambiar el repositorio a público y acepta copia/origen del código.
Se revisaron10ramas/92commits/301blobs sin detectar secretos reales, con la única
coincidencia enURLAWS deejemploShotstack caducada2023. Ver informe
docs/PUBLIC_REPOSITORY_REVIEW.md para alcance ylimitaciones.

Cambio aPUBLIC aplicado en navegadorGitHub tras reautenticaciónMobile segura;
UI yAPIlo confirman. Descarga anónima del scriptf603380... validada conSHA256
e486f754fe0321239ef7da40dc09a6b5a32f778d33e2650701d7e434322916c5.
start-public-source.sh permite reanudar preparación pornohup sin loginGH enVPS.
Las instrucciones deautorizaciónCLI anteriores quedan comoalternativa histórica,
ya no son necesarias enel flujo vigente. No se borra el binariogh ni se cambia
ningún archivo decredenciales o configuración deotrosproyectos. Se mantiene
elruntimeya construido. Pendienteejecución del descargador porCarlos.

### Acceso pendiente y autorización web · captura08:43

El primer bloque de fuente dejó PENDIENTE y logvacío: no se comprobó acceso con
credenciales existentes y no comenzó la descarga del código. No se determina si
la causa exacta fue credencial, permiso, red o comprobación dehostSSH.

prepare-github-cli.sh descarga el binario oficial gh2.102.0/Linuxamd64 y compara
SHA256bb766f710eef8ede859c18578c72c327597cd4c8a85b06001b1f3843c6019386
publicado enAPIreleaseCLI. Se instala únicamente en tools/gh bajo el directorio
privado; no apt, servicios, SSHkeys ni loginautomático. Estado/log separados.

Carlos ejecuta authlogin --hostnamegithub.com --git-protocolhttps --web desde
terminal interactivo. Config en /opt/sues-video-setup/github-auth (0700/umask077).
GIT_CONFIG_GLOBAL apunta a github-auth/gitconfig durante login para aislar cualquier
configuración automática y conservar la configuraciónGit deotros proyectos. Si no
hay gestor de credenciales, gh puede guardar el token enarchivo privado; no se
imprime ni se envía alchat. La autorización se realiza sólo en GitHub, con la cuenta
carlossuess-art. No solicitar contraseñas/tokens enchat ni ocultar permisosOAuth.

Tras autorizar se recupera prepare-source.sh del commit deeste bloque mediante
ghapi autenticado, base64decode y bash-n, y se ejecuta por nohup. La versión nueva
usa helpergh explícito porinvocación deGit y resetea otroshelpers sólo enesa
invocación. No monta el directorioauth en el contenedor de npm/tests.
Descarga/login/fuente pendientes deCarlos; no se afirma autenticación ni despliegue.

### Código: siguiente bloque en segundo plano

Captura08:21 confirma DEPENDENCIAS PREPARADAS/CORRECCIÓN TERMINADA: la reparación
del registro final sí terminó. El mensaje de error anterior queda en el log histórico.

scripts/deploy/prepare-source.sh prueba acceso existente HTTPS ySSH al repositorio
privado,20s por transporte. No añade hostkeys, claves ni credenciales. Si no puede
comprobar acceso deja PENDIENTE; puede ser autenticación, red, hostkey o permiso.
Si funciona, descarga snapshot eb441c712c9a6edd07c0d41b344adfdf0275c95d en directorio
nuevo bajo /opt/sues-video-setup, comprueba SHA y prepara dependencias npm del lock
con installscripts/audit desactivados. Ejecuta check+tests de Node secuenciales
con la imagenruntime en contenedor temporal0,5CPU/1GiB, sin puertos ni montajes del
host ajenos al nuevo snapshot. Usuario1000; npmcache/tests temporales en tmpfs.
No monta credencialesSSH/GitHub dentro del contenedor. El código de la aplicación
corresponde al hito133pruebas; el snapshot fija también la corrección de metadatos.
No se clona una rama flotante ni se actualizan otros proyectos.

Log codigo.log/estado-codigo.txt separados; fuente-directorio.txt/fuente-commit.txt
se escriben sólo si instalación y comprobaciones pasan. No arranca app, no restaura
vídeos/fonts/cámara y no configura HTTPS. Bloque preparado; ejecución pendiente.

### Resultado recibido y corrección · capturas08:18 del17/10

La imagen sues-video-runtime:20261017 se construyó. El contenedor temporal imprimió
Nodev22.23.3/npm10.9.9/Python3.11.2/FFmpeg yffprobe5.1.9-0+deb12u1/fc-scan;
«Filtros y prueba H264/AAC: OK». Después falló `docker image inspect` de la etiqueta
base node:22-bookworm-slim no presente en el almacén local. El ERROR es posterior
a la comprobación funcional, no exige reconstruir o descargar otra vez.

prepare-runtime.sh ahora trata esos metadatos de la base como opcionales. Si la
etiqueta no está disponible, base-digests.json=[] y base-provenance-status.txt lo
declara explícitamente; no se inventa un digest. La huella de la imagen final sí
sigue siendo obligatoria. Se entrega reparación con comprobación de imagen final,
sin build/pull, para guardar este resultado y corregir estado.txt. Pendiente
ejecución/resultado de esa reparación; la aplicación sigue sin desplegar.

`scripts/deploy/inspect-vps.sh` hace una lectura breve del inventario actual sin
instalar, descargar, reiniciar ni cambiar aplicaciones. No imprime variables de
entorno, configuración Compose/Caddy, volúmenes, credenciales ni argumentos de
procesos. Se puede pegar directamente su contenido en la consola.

Con esa salida se ha preparado `scripts/deploy/prepare-runtime.sh`: construye
`sues-video-runtime:20261017` desde la imagen oficial Node22/Bookworm-slim, con
Python3, FFmpeg/ffprobe, fontconfig y certificados dentro de la imagen. No instala
paquetes en el host, no publica puertos y no cambia Caddy/WhatsApp.

Lanzar con nohup y log/PID en `/opt/sues-video-setup`; guarda `estado.txt` con
éxito/error y huellas de imagen/base. Bloqueo flock evita construcciones simultáneas
del mismo script. El bloque pegable entrega el script por stdin de nohup y añade
salida al log (`>>`) sin sobrescribirlo. No necesita conservar variables de sesión.
Exige5GiB libres antes de construir. La comprobación temporal usa usuario node,
sin red, raíz de solo lectura,0,5CPU/768MiB y tmpfs32MiB: Node22+, hashlib,
fontconfig, filtrosASS/perspective/audio y mini codificación/decodificación H264/AAC.
La construcción de Docker usa los recursos normales del daemon; no se afirma que
esté limitada a0,5CPU. No descarga modelos, vídeos ni credenciales.

Sintaxis Bash verificada aquí; Docker no está disponible en este entorno, por lo
que construcción y comprobación del contenedor quedan pendientes de la ejecución
del bloque por Carlos. Las133pruebas de aplicación siguen siendo las del hito previo.
Este paso prepara dependencias; todavía no existe un despliegue del editor
en este VPS. El acceso al repositorio privado y a los vídeos/fonts persistidos
debe resolverse con un mecanismo autenticado real, sin URLs inventadas ni tokens
pegados en el chat. La aplicación actual escucha en loopback y requiere trabajo
de integración antes de publicarla mediante el proxy.

No reemplazar Caddy por Nginx ni alterar/reiniciar el stack de WhatsApp para
instalar el editor. Un posible puerto 3010/3011 requiere comprobación previa.
