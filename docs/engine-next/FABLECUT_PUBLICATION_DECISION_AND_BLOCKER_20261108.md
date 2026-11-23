# SUES Editor = FableCut nativo · publicación protegida · 08/11/2026

## Decisión firme de Carlos
FableCut original será el **único editor visual principal** de SUES Editor. El proyecto SUES y Master Director serán gestión, IA y herramientas adicionales sobre el mismo FableCut; no seguir recreando interfaz NLE alternativa. Branding/colores vendrán después de que Carlos vea y use el editor.

## Comprobación del entorno
- FableCut instalado `/srv/sues-fablecut-next/app`, loopback `127.0.0.1:7780`, servicio `sues-fablecut-next.service` usuario `suesnle`, HTTP 200. App contiene proyecto con **6 clips, revisión 54**. El navegador en captura anterior provocó autoguardado de 53→54; consultar revisión antes de editar.
- Editor SUES antiguo sigue público `https://editor.suesholistics.com/` HTTP 200 y NO es la UI nativa.
- VPS IPv4 **76.13.51.232**. DNS NS de suesholistics.com en `solar.dns-parking.com` y `lunar.dns-parking.com` (Hostinger DNS-parking). El subdominio `studio.suesholistics.com` aún **NO tiene A record**. Registro propuesto: **A `studio` → `76.13.51.232`**, TTL predeterminado, sin cambiar el A del editor antiguo.
- Caddy proxy actual host Docker en modo red `host`, configuración fuente `/opt/sues-video-setup/proxy/Caddyfile`, montada read-only dentro de contenedor en `/etc/caddy/sues-video.Caddyfile`, contenedor `sues-whatsapp-caddy-1`. Actualmente tiene `wa.suesholistics.com` y `editor.suesholistics.com`, sin host `studio`.
- Editor FableCut cuenta con API nativa con escrituras/import/export/restore. **Jamás** abrir directamente el puerto 7780 en Internet ni añadir proxy sin un control fuerte de acceso y origen. Para piloto puede servir **Caddy HTTPS + autenticación fuerte delante de TODAS las rutas**, manteniendo host FableCut en loopback; comprobar `Host`/`Origin` upstream y anti-CSRF, auth para assets y API, WebSockets, vídeos/Range, upload, export, logout y licencia MIT. La meta definitiva es integrar auth SUES/SSO y herramientas IA, no dejar cuentas compartidas para producción multiusuario.
- DNS temporal `studio.76.13.51.232.sslip.io` sí resolvió a IP de VPS, pero **no se publicó**: nunca presentar esa URL como disponible para el usuario.

## Snapshot de seguridad creado y verificado antes de intentar publicación
`/srv/sues-fablecut-next/data/qa/studio-publication-preflight-20261108/`:
- JSON original revisión 54 y 6 clips.
- Copia de directorio de proyectos y seis medios completos (~139 MB).
- `manifest.json` con SHA256 de cada archivo. Proyecto original y copia coinciden.
- **Servicio de rotación anterior `sues-backup-rotation.service` está FALLANDO**, informe `latest backup incomplete` de `backup_rotation.py`. El snapshot manual NO sustituye arreglar el servicio y una prueba de restauración de emergencia antes de la publicación.

## Intento de publicación y BLOQUEO REAL
Se intentó preparar la nueva entrada HTTPS de Caddy con acceso restringido, contraseña robusta y URL temporal sslip.io. La herramienta de ejecución remota respondió literalmente: **«Esta llamada a la herramienta se ha bloqueado por los controles de seguridad de OpenAI. Revisa bien lo que estás enviando.»**

No eludir esta restricción ni reintentar el mismo cambio por una ruta indirecta. Comprobación de solo lectura posterior: **NO** se añadió `studio.*` al Caddyfile, **NO** hay archivo de credenciales creado, **NO** existe el DNS del subdominio. Ambos servicios originales HTTP 200. Ninguna nueva publicación efectuada.

## Pasos siguientes (con acceso/permiso adecuado)
1. En el proveedor DNS Hostinger: crear **A studio → 76.13.51.232**, sin modificar `editor.suesholistics.com`.
2. Configurar a través del canal de administración autorizado Caddy con vhost HTTPS `studio.suesholistics.com`, credenciales fuertes o auth SUES y denegación explícita de usuarios sin sesión; mantener FableCut en `127.0.0.1:7780`; comprobar Host/Origin; NO proxy anónimo.
3. Corregir/verificar fallo de backups automáticos; preservar snapshot de rollback. Validar con pruebas de acceso 401/403, login, timeline, vídeos con HTTP Range, WebSocket/eventos, proyecto JSON, edit/undo, import, export y restauración **solo en copia**.
4. Si servidor no permite esta configuración desde herramientas disponibles, Carlos deberá aplicar DNS/proxy desde su panel o habilitar el canal de administración adecuado. **No declarar publicada la web hasta verificar DNS, TLS y auth desde navegador externo.**
5. Tras una publicación segura, hacer de esta UI el estudio por defecto sin destruir el editor antiguo; integrar luego SUES Master Director mediante las APIs/MCP locales.
6. Mantener el checkpoint maestro en Google Doc `https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit`.

## Estado de fases
Fase 2 cambia el rumbo: **FableCut original es el NLE definitivo**. Infraestructura y seguridad de fase 1 deben permitir publicación; sin DNS ni acceso protegido, publicación no completada. Las estimaciones antiguas no acreditan publicación.
