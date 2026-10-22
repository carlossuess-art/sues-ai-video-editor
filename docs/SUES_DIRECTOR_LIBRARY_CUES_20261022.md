# Fase 7 · Director IA: señales de biblioteca y revisión humana · 22/10/2026

**Estado: rama de desarrollo, no desplegado.** Fase 7 sigue abierta; el Director LLM completo NO está implementado.

## Implementación
- Reutiliza el índice privado de la biblioteca sin acceso de red y las palabras de la transcripción existente con timestamps.
- Calcula grupos de locución a partir de puntuación, pausas y duración, sin efectos de tiempo fijo.
- Busca material **instalado** relacionado con palabras e intención aproximada. Excluye medios solo listados en Drive, música/SFX y URLs privadas.
- Devuelve como máximo ocho propuestas y tres candidatos por grupo. Conserva los índices exactos de palabras y los tiempos originales.
- Devuelve `approvedToAutoPublish:false` y `needsHumanReview:true` en todos los candidatos. **No crea eventos, no renderiza, no altera trabajos, no aprueba derechos, ni supone que un título de archivo prueba su contenido.**
- Ruta autenticada `GET /api/jobs/:id/library-cues?limit=6`, opcional. `GET /api/library/search` sigue disponible para búsquedas manuales.
- Si el índice no existe o no es accesible: error controlado 503, sin exponer rutas del servidor.

## Validación
`node --test tests/director-library-cues.test.js tests/director-library-http.test.js`: 2/2 PASS.
La suite integral, verificación del deploy, capacidades de cámara y calidad narrativa requieren regresión completa tras publicar. Esta función solo sirve como puente de consulta para Director IA, **no** como un Director semántico terminado.

## Bloqueo real detectado en producción el 22/10
El release `120ffb059d025f0318b2cabbff98a0242822a185` está instalado, HTTPS 200, salud/jobs 200 con sesión y Whisper activo, pero `/api/assets`, `/api/resource-catalog` y `/api/library/capacity` responden 400 y `/api/library/search` responde 503. Diagnóstico local en contenedor: EACCES sobre 21 archivos privados de `/state/jobs/assets` que siguen perteneciendo a root con modo 0600; además `/state/jobs/library` es directorio root 0700 (8 archivos). El editor ejecuta UID 1000 y por diseño no debe leer contenido root 0600. Los ficheros son del editor, no deben hacerse públicos. Existe backup previo verificado en `/opt/sues-video-setup/update-backup-20261022-205749-81951` (SHA256 `68f16be2c4e18639c527e604081aab3d8809bd069b81f1da3c3ebe5732ca0310`).

La corrección dirigida de propiedad privada fue bloqueada por controles de seguridad de Desktop Commander. **No se ejecutó ni se debe eludir por un método alternativo no autorizado**. Acción de desbloqueo: propietario/operador con sesión adecuada debe autorizar el ajuste de propiedad exclusivamente de archivos privados del editor UID root→UID1000, conservando permisos 0600 y dir 0700; verificar copia previa y repetir comprobaciones autenticadas de biblioteca. No tocar secretos ni carpetas ajenas. Hasta entonces no desplegar la nueva ruta de sugerencias ni afirmar biblioteca funcional.

No hay costes nuevos ni cambios a los originales de Drive.
