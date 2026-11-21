# SUES Master Director — Auditoría de equivalencia real del Reel 158404

**Trabajo de fase 1, solo PR #27 y staging.** La fuente VFR original continúa inmutable y la derivada CFR30 mantiene la aceptación audiovisual de Carlos. No hay render, aprobación creativa ni deploy.

## Comprobación de equivalencia exacta

El módulo `master-director-brief-semantic.js` endurece el cruce del storyboard original con `sues-master-story/v1`:

- El **texto editorial** debe coincidir exactamente, sin reescribirlo ni sustituirlo por una imagen.
- El **B-roll** solo puede enlazarse a la pista `broll`, efecto `video-exact`, con el **mismo ID lógico de recurso** declarado. Una imagen fija no reemplaza un clip sin decisión explícita.
- **Motion M01–M03:** una única capa de texto no acredita una composición cinematográfica. Las capas textuales pueden formar parte de un resultado futuro, pero no sustituyen materiales, profundidad, sincronización, objetos o gráficos completos.
- **Cámara, subtítulos y transiciones** preservan sus pistas y propósitos independientes. No se confunde un cambio de texto o un corte con una transición de entrada/salida verificada.

La coincidencia de operación todavía exige el gate del servidor para el recurso real, licencias, tipografía, geometría, renderizador y fingerprint. Nunca concede `canExecute:true` ni marca una operación revisada como renderizada.

## Inventario de capacidades reales

Nueva ruta `GET /api/jobs/:id/master-brief-capabilities?briefRevision=<sha>`: autenticación y comprobación del SHA de vídeo y timeline; auditoría cerrada por defecto sobre los datos guardados en el Reel. Nuevo botón **«Comprobar capacidades reales del motor»** y auditoría adjunta al paquete «Descargar anexo técnico para Work». El contrato del adaptador Remotion actual (`master-director-remotion-compiler.js`) permite `graphics/captions:text`, `broll:video-exact` y recursos visuales exactos con evidencia independiente; **no** implica capacidades para transiciones, composiciones 2.5D/3D completas, máscaras nuevas, seguimiento de silueta ni subtítulos palabra a palabra sin ASR verificado. La cámara principal se mantiene como fuente, no como un efecto Remotion individual demostrado.

**Resultado real del Reel 158404:** 139 intenciones técnicas, 8 ranuras de recurso sin verificar, 148 líneas originales conservadas, sin pérdida, 19 anotaciones de documentación. Desglose de las restantes 120 intenciones:

| Modelo de equivalencia | Cantidad | Estado |
|---|---:|---|
| Cámara/fuente nativa | 14 | Requiere pruebas de composición y encuadre |
| Estructuralmente modelables con evidencia (títulos y vídeo) | 21 | No renderizables todavía sin licencia, fuentes y geometría |
| Subtítulos de palabras progresivas | 20 | Modelo por capas posible, ASR/tiempos y safe zones pendientes |
| Transiciones B-roll no modeladas por el adaptador estricto | 10 | Motor/tipo/curva/duración pendientes |
| Composiciones motion completas no acreditadas | 3 | Objetos/efectos/recursos y QA pendientes |
| Direcciones técnicas sin operaciones concretas aún | 52 | Conversión semántica exacta pendiente |

Ninguna clasificación prueba QA cinematográfica. Ninguna instrucción se elimina por no ser soportada. El informe sigue etiquetado `BLOCKED_PENDING_EXECUTABLE_EQUIVALENCE`, `approved:false`, `canExecute:false`. La salida del editor productivo permanece inalterada.

## Evidencia

Pruebas `master-director-brief-semantic.test.js`, `master-director-brief-capabilities.test.js`, además de `master-director-brief-crosswalk.test.js` y regresiones de fase 1. Revisión de la ruta con el Reel real en loopback y en Chromium escritorio 1360×900 y móvil 393×852, 0 errores JS. Los resultados están en el staging de la PR; no son licencias ni validación artística del Reel.
