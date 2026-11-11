# SUES AI VIDEO EDITOR · Preparación segura de publicación · 08/11/2026

## Alcance y decisión

Carlos autorizó preparar toda la infraestructura y avisarle cuando llegue el momento de introducir registros DNS. Eso **no** autoriza exponer FableCut sin autenticación, borrar respaldos ni forzar controles remotos. FableCut ORIGINAL es el único NLE visual; SUES MASTER DIRECTOR es su cerebro IA. Conservar el editor público `editor.suesholistics.com` y el FableCut original intactos.

## Verificado por lectura del VPS (8 de noviembre de 2026)

- FableCut v1.18.0 instalado en `/srv/sues-fablecut-next/app`, servicio `sues-fablecut-next.service` activo y puerto privado `127.0.0.1:7780` HTTP 200. El editor anterior `https://editor.suesholistics.com` HTTP 200.
- Proxy Caddy alojado en Docker `sues-whatsapp-caddy-1`, configuración fuente `/opt/sues-video-setup/proxy/Caddyfile`, sirve WhatsApp y editor antiguo. No existe bloque `studio.suesholistics.com`.
- `studio.suesholistics.com` NO resolvió en el chequeo; el registro objetivo conocido de la auditoría anterior es **A studio → 76.13.51.232** bajo Hostinger (DNS parking solar/lunar). Comprobar nuevamente IP y nameservers en el momento de indicar a Carlos cambiar DNS, ya que pueden variar.
- Snapshot histórico de publicación `/srv/sues-fablecut-next/data/qa/studio-publication-preflight-20261108`: se recomputaron SHA-256 de **33 archivos / 144.894.346 bytes**, 0 discrepancias. Proyecto revisión 54, seis clips, seis medios; snapshot consistente según manifest.
- **Ensayo REAL de recuperación en clon aislado**: script `scripts/fablecut-isolated-restore-drill.py` copió ese snapshot a QA temporal, levantó el servidor FableCut ORIGINAL en `127.0.0.1:7783`, verificó por API proyecto revisión 54/6 clips/6 medios, igualdad exacta JSON, listado de versiones y export nativo backup de 107.911 bytes; después apagó la instancia temporal y borró únicamente el clon. El original 7780 devolvió HTTP 200 tras el ensayo. No se restauró la producción ni se demostraron todas las rutas de media/exportación vía navegador externo.
- Rotación automática `sues-backup-rotation.timer` activa cada 15 minutos pero `sues-backup-rotation.service` FALLA con `AssertionError: latest backup incomplete`. Hay cuatro directorios `update-backup-*`: el penúltimo (20261029-182123-365569) carece de `editor-state.tar` y manifiesto. El archivo de restauración fijo `/opt/sues-video-setup/gemini-live-20261026/rollback/editor-before.tar` NO existe. El código de rotación está diseñado para impedir borrados en ese estado. **No se eliminó, desplazó ni sustituyó ningún backup** y no se declaró solucionada esta dependencia.
- Publicación nueva **NO realizada**. Una tentativa anterior de cambiar Caddy y el acceso protegido fue bloqueada por controles de seguridad de las herramientas. NO reintentar el cambio por otra vía. La configuración del acceso protegido deberá aplicarse por un canal administrativo permitido y validarse antes de publicar; no hay DNS ni Caddy nuevo.

## Herramientas nuevas para próximas comprobaciones

- `node scripts/fablecut-publication-preflight.mjs` realiza inspección **solo lectura**, de los SHA del snapshot, puerto interno, backups, DNS y puertas humanas de acceso. Devuelve JSON con `publishAllowed:false` mientras falten requisitos y sale con código 2. Es deliberadamente conservador: ni HTTP 200 ni un token de prueba equivalen a autenticación pública aprobada.
- `python3 scripts/fablecut-isolated-restore-drill.py` repite la restauración **en copia efímera** solo local 7783 y cierra la instancia de QA. No ejecuta ninguna mutación del FableCut original ni usa servicios públicos.

## Puertas de publicación pendientes (NO inventar resultados)

1. **Backups**: establecer un punto de restauración estable verificable para el editor antiguo y reparar la rotación sin borrar ninguna copia previa hasta probar integridad y recuperación; ensayar y documentar rollback completo.
2. **Autenticación**: puerta HTTPS delante de todas las rutas nativas de FableCut (HTML, recursos, API, vídeo con Range, WebSockets, import/export y MCP). Comprobar que un visitante sin sesión recibe denegación real y que los flujos de sesión/CSRF/Host/Origin no se evaden. Requisito de identidad humana pendiente; no confundir con token sintético.
3. **Dominio**: cuando el servidor esté seguro, avisar a Carlos para crear solo el registro A del subdominio `studio`, después de reconfirmar IP y proveedor. No alterar `editor`, `wa` ni el dominio raíz; no abrir puerto 7780.
4. **Prueba externa**: DNS resolviendo, TLS válido, login humano exitoso, visitante no autenticado rechazado, UI nativa funcional, timeline/media/Range/WS/undo/export revisados sin editar el original, rollback disponible.
5. Tras pasar todo, entregar URL definitiva y procedimientos de acceso/reversión; no hacer merge/desplegar cambios de PR27 por el simple hecho de publicar la UI original.

## Estado de la tarea

**Preparación técnica parcial y comprobada; publicación BLOQUEADA.** La intervención DNS de Carlos NO procede todavía: faltan medidas de seguridad y recuperación. No se han consumido créditos de generación externos. El proyecto nativo original permanece reservado; solo hubo lecturas GET contra 7780.
