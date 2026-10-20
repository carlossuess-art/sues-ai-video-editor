# Operación DevOps del VPS · 20/10/2026

## Sistema reutilizado
- Hostinger `srv1841004`: Desktop Commander Remote MCP online y `desktop-commander-remote.service` activo.
- El proyecto ya incluye `scripts/deploy/background_update.py` (systemd transitorio, bloqueo por locks, commit y SHA256 fijos, registros JSON y estado final) y `scripts/deploy/update_service.py` (checks de trabajos/medio, backup de estado verificado, rollback automático, comprobación HTTPS). No crear otro agente de ejecución privilegiada ni segundo actualizador.
- Nuevo `scripts/deploy/editor_status.py`: diagnóstico **solo lectura** con commit instalado, Docker, HTTPS, última operación y resultado; no imprime tokens, URL privadas, configuraciones ni variables de entorno.
- El diagnóstico es apto para ejecutarse directamente por Desktop Commander; no sustituye la aceptación de vídeo real.

## Comprobaciones reales
En VPS con acceso root remoto autorizado:
- `docker ps`: `sues-video-editor` activo.
- `servicio-commit.txt`: `71399e1c9ac6a7da1b586c50b8dae5d93651050b`.
- `desktop-commander-remote.service`: activo.
- Script nuevo descargado del commit `502e2ecdfde604e92b2952343a829fdde9f7bff2`; comprobación de sintaxis Python: PASS.
- Ejecución real del diagnóstico: HTTPS 200, contenedor activo, último despliegue SUCCESS / exitCode 0.
- No se han iniciado despliegues ni alterado los demás servicios.

## Política operativa
1. Consultar Roadmap, estado oficial de GitHub, dispositivo remoto y `editor_status.py`.
2. Usar pruebas y ramas de desarrollo para cambios de aplicación; fijar SHA inmutable y comprobar código/lock/dependencias antes de deploy.
3. Backup verificado y cola vacía antes de sustituir exclusivamente el editor; rollback automático ante fallo.
4. Para instalación de credenciales, mantener flujo privado HTTPS de un solo uso; nunca enviar token en chat ni imprimir archivos secretos.
5. Los controles de autorización de la herramienta cliente prevalecen: si bloquea ejecutar una actualización, pedir ejecución directa al propietario con el comando de release aprobado, sin construir puertas traseras ni rutas alternativas para eludir ese control.
6. No anunciar éxito ni V1 sin pruebas de funcionamiento en producción.

## Siguiente acción exacta
Desplegar release ya probada `6da5a3d9145dde6bff7056e318b67d020e99c66f` mediante su configurador autorizado; si la herramienta bloquea el despliegue, Carlos puede usar el comando versionado publicado en `docs/SUES_EMAIL_LOGIN_VERIFIED_20261020.md`. Tras SUCCESS, Carlos crea su contraseña en HTTPS y se comprueba login, persistencia y vídeo real. El diagnóstico es solo lectura: no supone haber desplegado el login.
