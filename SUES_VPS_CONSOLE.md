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

## Siguiente paso ejecutable

`scripts/deploy/inspect-vps.sh` hace una lectura breve del inventario actual sin
instalar, descargar, reiniciar ni cambiar aplicaciones. No imprime variables de
entorno, configuración Compose/Caddy, volúmenes, credenciales ni argumentos de
procesos. Se puede pegar directamente su contenido en la consola.

Con la salida se preparará un instalador específico en segundo plano, con
directorio propio del editor y log/PID. Todavía no existe un despliegue del editor
en este VPS. El acceso al repositorio privado y a los vídeos/fonts persistidos
debe resolverse con un mecanismo autenticado real, sin URLs inventadas ni tokens
pegados en el chat. La aplicación actual escucha en loopback y requiere trabajo
de integración antes de publicarla mediante el proxy.

No reemplazar Caddy por Nginx ni alterar/reiniciar el stack de WhatsApp para
instalar el editor. Un posible puerto 3010/3011 requiere comprobación previa.
