# Frontend de referencia · 19/10/2026

Rama: `feat/reference-editor-ui-20261019`
Base: `fd168dd2b7ff5817be89ee28d8e654e792002fab`
Último commit UI: `b004d352bc193b3e7e29ceb02d547109e9443e88`

## Alcance de este bloque

- Se mantienen el reproductor de original/montaje, previsualización real y exportación ya existentes.
- Se adapta la estética a las capturas proporcionadas: noche/cian, paneles oscuros, herramientas visibles y contraste táctil.
- Se incorpora una línea temporal de navegación funcional con duración, progreso y seek sincronizado al vídeo activo.
- Se muestra la pista de subtítulos exclusivamente cuando existe un montaje reproducible y una cuenta de captions.
- No se simulan clips, ondas de audio, seguimiento automático ni renders.
- No hay nuevas dependencias, proveedores o servicios de pago.

## Verificaciones y límites

Código escrito en una rama aislada de GitHub; **no fusionado ni desplegado**.
No se ejecutaron tests Chromium/Node ni un render real en este bloque; la verificación de regresiones queda pendiente.
Antes de integrar: revisar con navegador móvil y escritorio, metadata, seek del original y montaje, reanudación de vídeo, cambio de estado, exportación SHA idéntica, y suite existente.

## Próximo bloque

1. Validar la rama en navegador y corregir cualquier regresión.
2. Incorporar pistas editables de cortes, audio, captions y motion enlazadas al Video Edit Plan, no decorativas.
3. Evolucionar el flujo subir vídeo → plantilla → procesamiento → editor, reaprovechando endpoints actuales.
4. Tras QA, crear PR e integrar sin desplegar automáticamente al VPS.

Fase 6 abierta según roadmap maestro; no se recalcula progreso ni se afirma V1.

## Continuación · 19/10/2026 noche

Último commit: `c66e0c155df5de45586ba5fc1549076cc0aff4ec`

Se añade timeline semántico:
- Usa `plan.manifest.captions` con `start/end/id/text` para situar cada frase; sin clips simulados.
- Cada segmento permite seek en el reproductor visible y abre el editor de la frase concreta.
- Resalta el segmento correspondiente a `currentTime`.
- Limpia y reconstruye elementos al cambiar la identidad o contenido del plan.
- Conserva el scrub real implementado en el bloque anterior.
- Revisión estructural por lectura del código remoto: 7 comprobaciones de puntos de integración superadas.

**Límite explícito:** no se ejecutaron pruebas Node/Chromium, playback, render o VPS. Se requiere una prueba funcional de navegador antes de fusionar. Se mantiene la rama aislada.

## Continuación · controles de timeline

Último commit frontend: `490feba81e2c056059b031533e03a85c3bfef23b`.
Se añaden accesos directos Subtítulos, Audio, Visuales y Estilo dentro del timeline, enlazados con los botones y paneles ya operativos. Sin cambio de motor, persistencia, proveedores o dependencias.

Verificación: código remoto releído y anclajes identificados. Intento de clonación local fallido por DNS de GitHub desde el contenedor; por tanto NO constan en este bloque pruebas completas Node/Chromium ni render. Rama todavía sin merge ni despliegue; siguiente paso obligatorio: QA móvil/escritorio y regresión antes de integrar. No se ha probado el VPS.
