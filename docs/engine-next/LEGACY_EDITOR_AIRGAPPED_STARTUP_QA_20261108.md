# Preparación publicación FableCut · prueba de arranque del editor legacy aislado · 08/11/2026

## Hechos comprobados, sin alterar producción

El archivo histórico del editor SUES `/opt/sues-video-setup/update-backup-20261029-182329-365998/editor-state.tar`, cuyo manifiesto incluye 2.582 archivos SHA-256 correctos, sirvió para restaurar todos sus archivos en un directorio QA efímero. Mediante `scripts/editor-rollback-isolated-startup-drill.py` se arrancó **el editor anterior real**, no una simulación HTTP, usando la imagen Docker ya instalada `sha256:5b39ca522b4d0758a62a439dd8b2312832fa2baf9f68c97df88da3239ac1e5eb`, el directorio de aplicación de la instalación existente y dependencias locales.

El contenedor de ensayo estaba configurado con `--network none`, **cero puertos de host**, capacidades eliminadas, `no-new-privileges`, raíz de solo lectura, volúmenes de aplicación y dependencias en solo lectura, directorio restaurado de QA aislado como `/state`, usuario no privilegiado 1000:1000, límites de memoria/CPU/procesos y sin reconexión automática. No montó `/opt/sues-video-setup/editor` ni el proyecto FableCut real.

Resultados observados:

- 2.582 archivos del backup verificados y extraídos en copia para la prueba.
- Proceso del editor original iniciado y mantenido activo dentro del contenedor aislado durante el sondeo.
- Solicitud GET local (dentro del contenedor sin red exterior) a `/api/health`: **HTTP 401**. Indica que el servicio responde y exige autenticación a la petición de prueba; no demuestra un login humano satisfactorio ni una política de permisos completa.
- Inspección de Docker: `NetworkMode=none`, `PortBindings=null` (ningún puerto publicado).
- No se utilizaron las credenciales privadas restauradas ni se mostraron por pantalla; el contenedor se detuvo/eliminó y el directorio efímero también se eliminó. La huella del `project.json` de producción no cambió durante el proceso.
- Comprobación final separada: contenedor de producción `sues-video-editor` activo, `https://editor.suesholistics.com/` HTTP 200, FableCut ORIGINAL `127.0.0.1:7780` HTTP 200. No quedaron contenedores de QA del ensayo ni directorios temporales.

**Limitaciones:** no se ha iniciado sesión con un usuario real, ejecutado un montaje, reproducido vídeo, exportado, restaurado una base activa de producción ni demostrado resiliencia integral de los servicios exteriores. No se ha probado recuperación en un segundo host; solo contenedor efímero en el VPS actual. No declarar recuperación de desastres completa.

## Bloqueos de publicación sin modificar

1. La rotación `sues-backup-rotation.service` sigue en estado `failed`, porque falta un TAR + manifiesto del penúltimo directorio de actualizaciones y el archivo histórico PIN exigido por su política no existe. No borrar nada, crear respaldo ficticio con fecha antigua ni activar limpieza con estas condiciones.
2. HTTPS privado y puerta de acceso al nuevo dominio `studio.suesholistics.com` todavía no configurados ni probados. Un intento anterior de cambiar Caddy fue bloqueado por controles de herramienta; no sortear el bloqueo por medios alternativos.
3. DNS aún no debe modificarse; avisar a Carlos solo tras garantizar la autenticación HTTPS y una restauración segura con política de retención. La IP 76.13.51.232 es una referencia anterior y deberá reconfirmarse en el momento de publicar.
4. SUES MASTER DIRECTOR y aprobaciones MCP permanecen en PR #27 de desarrollo sin fusionar. FableCut nativo original es el único NLE visual.

## Próximo incremento recomendado

Desarrollar y probar fuera de producción una nueva política de retención conservadora: crear una nueva base con fecha auténtica, inventario y manifest verificados; mantener todos los archivos existentes hasta verificar el nuevo conjunto; rechazar limpiezas destructivas cuando falten PIN, backup más reciente o manifiestos. Después, mediante un canal administrativo autorizado, corregir y validar el servicio en producción sin eludir controles ni eliminar copias históricas. El servicio del editor antiguo y el FableCut no se deben interrumpir.
