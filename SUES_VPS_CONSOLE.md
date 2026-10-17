# Hostinger: procedimiento de consola

Decisión explícita de Carlos, 17/10/2026: entregar bloques completos para pegar
en la consola web de Hostinger. Las descargas e instalaciones largas se ejecutan
en segundo plano con `nohup`, un log y una forma de consultar su estado. No
depender de dar acceso directo al asistente. Buscar antes el trabajo de otros
chats y reutilizar la infraestructura ya instalada.

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
