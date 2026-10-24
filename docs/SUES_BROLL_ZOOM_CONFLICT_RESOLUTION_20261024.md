# F7/F9 · Sustitución explícita de planos y zooms incompatibles · 24/10/2026

## Reproducción del bloqueo en la iteración real 08

En un entorno de QA aislado de producción, un plan externo válido por filas con dos escenas nuevas resultó **canApply:false** al reutilizar la configuración DOPAMIN real de 68,6491 s. Motivo literal del motor: `Semantic render: zoom hidden by B-roll`. El comportamiento anterior es correcto desde la seguridad compositiva: un nuevo B-roll a pantalla completa no debe tapar silenciosamente un zoom de presentador. Además, los dos B-rolls ya existentes en los tiempos 8,34–11,24 s y 37,26–40,26 s entraban en conflicto con las nuevas propuestas por la separación obligatoria de 3 segundos de presentador.

## Corrección incremental

En el contrato existente `sues-edit-plan/v1` se añaden dos opciones **explícitas**, por B-roll: `replaceExistingBrolls:true` y `replaceHiddenZooms:true`. Su ausencia/valor false conserva el comportamiento de bloqueo previo. El botón nuevo de la UI las activa y lo advierte en su título: «Preparar B-roll (sustituye planos y zooms incompatibles)», pero no ejecuta cambios hasta que el usuario pulsa `Comprobar plan` y `Ejecutar plan en otra versión`.

La revisión del backend reutiliza el mismo Video Edit Plan, elimina únicamente B-rolls previos cuyo margen de 3 s respecto al nuevo B-roll no se cumple, descarta los zooms explícitos que quedan ocultos bajo él y ordena eventos B-roll cronológicamente. Si todos los zooms explícitos desaparecen, el zoom global se establece a cero para no generar acercamientos automáticos ocultos (el informe lo indica). Se mantienen los zooms no solapados, la voz original, subtítulos y música. **No se quita el guard original del compositor**.

## Evidencia de prueba real, sin tocar al cliente
- Antes de la corrección: `external-review.canApply=false` aunque las operaciones aisladas eran válidas, por zoom oculto.
- Con dos operaciones autorizadas y sus flags: `external-review.canApply=true`, sin notas de incompatibilidad.
- Primer B-roll: cadena industrial bajo agua; 9,16–12,54 s del vídeo; `sourceIn:1.51`, `sourceOut:4.89`. Sustituye el reloj anterior marcado visualmente y el zoom que ahora quedaba oculto.
- Segundo B-roll: caminante exterior; 40,98–46,92 s; `sourceIn:.23`, `sourceOut:6.17`. Sustituye el anterior caminante demasiado próximo y el zoom solapado.
- Otros dos zooms no solapados se conservan. 88 captions, música y voz original intactos en el Video Edit Plan preparado.
- El bundle se genera **exclusivamente** en `/opt/sues-video-setup/dopamin-real-broll-qa-20261024/render-conflict-fixed` sin escribir en jobs ni fuente del editor. Se solicita un MP4 técnico de QA, no un nuevo job de usuario. No declarar calidad cinematográfica ni producción de F9 sin reproducir, escuchar y auditar el resultado.

## Seguridad y límites
`replaceExistingBrolls` y `replaceHiddenZooms` se validan como booleanos. No se altera el comportamiento de planes anteriores sin flags. No se eliminan fuentes, pistas, recursos ni archivos de usuario, y un nuevo job validado se creará solo con confirmación explícita.

Las pruebas focales verifican no mutación del objeto original, supresión selectiva, conservación de intervalos compatibles y rechazo/ejecución condicionada. Seguir ampliando QA con MP4 real de prueba, zonas seguras y pertinencia de escenas. F6/F7/F9 abiertas; progreso oficial 48%.
