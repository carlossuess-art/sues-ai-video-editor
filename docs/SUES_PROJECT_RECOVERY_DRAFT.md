# Recuperación desde la app · borrador no desplegable · 19/10/2026

Rama: work/night-20261019, base7e0ac629f97e04ee41c639d65ce993bfd2f0d0b6.
Carlos autoriza continuar sin intervención nocturna. Se recuperan aquí original
privado y análisis existente en runtime/recovered-v5; nunca incluirlos en Git.
Capturas156595–156598 confirman acceso a la app desde móvil y perfil sin material.
No se ejecutó la última comprobación de archivos en VPS: Carlos se fue a dormir.

## Implementado en desarrollo

Recuperar copia TAR desde pantalla, límite512MiB, progreso, endpoint autenticado;
staging privado, extracción Python de archivos regulares, rechazo de rutas/enlaces/
sparse/duplicados y límites; verifyProjectBackup y prepareProject antes de registrar.
Reutiliza original/transcript/cámara/visión/fuentes/medios/ajustes, sin modelos niASR.
Perfil nuevo persistente, jobs nuevos, duplicado de TAR reutiliza almacenamiento.
La API y el perfil evitan exponer paths. Los trabajos existentes no se reemplazan.
Se corrigen estados a español y bloqueo de SFX/controles sin montaje editable.

## Evidencia y bloqueo

Diez pruebas PREEXISTENTES de video-intake y project-backup pasaron localmente
después de integrar el módulo y endpoint. NO prueban el nuevo POST /api/recoveries
ni el extractor. El entorno de ejecución dejó de estar disponible al retomar:
exec-server rejected request (-32603): No such file or directory (os error 2).
Se reconstruyó el borrador desde los cambios registrados en conversación y se
guardó por el conector GitHub; estos bytes reconstruidos NO se han ejecutado.
No declarar smoke, render, navegador, producción ni aceptación completados.
No merge ni despliegue hasta revisar y verificar.

## Siguiente trabajo concreto

1. Recuperar worktree limpio desde esta rama sin tocar checkout viejo con cambios.
2. Añadir tests del extractor: traversal, abs, symlink, hardlink, FIFO, sparse,
   duplicado, tamaños/cantidad, truncado, gzip rechazado; sin escribir fuera destino.
3. Probar restoreHTTP real autenticado, rechazo antes de recibir bytes, sesión/
   origen, copia corrupta, limpieza tras desconexión, cuota/idempotencia y reinicio.
4. Verificar preservación de ASS/filtro/ajustes, exportar fixture y un vídeo real;
   hashes original y Range206. Comprobar fallos parciales al crear el job.
5. Revisar control de trabajo ocupado y limpieza al apagar app. Verificar paquetes
   con distinta versión de motor y fuentes: no asumir equivalencia visual automática.
6. QA móvil/browser si hay navegador disponible (rutaPlaywright localizada,
   ejecutable Chromium NO encontrado; no se descargó nada).
7. Crear copia privada con Montserrat vigente desde análisis existente, salvarla
   persistentemente mediante Library. Nunca subir vídeo/análisis privado a Git.
8. Preparar actualizadorVPS que preserve estado/token/SUES_PUBLIC_ORIGIN sin tocar
   Caddy/WhatsApp; probar primero, publicar después y ejecutar cuando haya acceso.
9. Actualizar maestro/PROJECT_STATUS con los resultados reales.

Producción sigue con motorba972 y HTTPS funcional. No automático para vídeos
nuevos ni segmentación automática ni DirectorLLM; no nuevas llamadas/gasto.
