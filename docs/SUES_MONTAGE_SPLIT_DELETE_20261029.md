# Dividir y borrar el montaje · 29/10/2026

Continuación del editor existente, sobre la edición móvil/libass y PWA. Sin Gemini, nuevos proveedores ni llamadas de pago. Estado de publicación y evidencia final en PROJECT_STATUS.md.

## Uso

En Ajustar, coloca el cabezal y pulsa «Dividir aquí». Repite en el final de la parte que quieras quitar. Toca ese tramo del vídeo principal y pulsa «Borrar tramo». Las pistas cierran el hueco y muestran la duración final. Deshacer revierte el borrado; Restaurar vídeo completo recupera los tramos conservando las divisiones. Pausar/recargar conserva el borrador del proyecto. Aplicar cambios crea una versión nueva, conservando el padre y el original.

## Contrato de tiempos y capas

`montageCuts` y `montageSplits` son coordenadas del reloj inmutable de la composición, después de los cortes previos del bruto. `postEdit.spans` proyecta ese reloj al tiempo del MP4 sin huecos; `outputDuration` indica la duración exportada y `duration` conserva la duración de composición. La proyección inversa usa el tramo siguiente en una unión exacta. No se modifica la transcripción ni se renumeran los IDs de captions.

La composición completa se calcula con sus tiempos originales. Al final del mismo grafo de render se seleccionan los fotogramas conservados y se concatenan los rangos idénticos de la mezcla de audio, a 30 fps/48 kHz. Así se conserva la fase de animaciones, voz, música, SFX, B-roll, máscaras raster, gráficos y transiciones, incluso cuando atraviesan un borrado. No se usa un MP4 aplanado como nuevo material de edición ni se destruyen las capas. Los ajustes originales siguen presentes en settings y en las copias recuperables.

La línea de tiempo y los campos de inicio/final de cada recurso muestran el reloj de salida. Los gestos de pista, los campos y la selección traducen esos tiempos al reloj de composición al guardar. La base de edición en vivo conserva el reloj original y salta los intervalos borrados, sincronizando los recursos sobre ese mismo reloj. La vista nativa del MP4 y los fragmentos exactos usan el reloj de salida. El paquete para el Director identifica explícitamente ambos relojes y exige fingerprint actualizado tras un borrado.

Máximo 60 rangos borrados y 120 divisiones. Alineación al fotograma; conserva al menos 0,5 s. No sobrescribe versiones finalizadas ni registra aprobación creativa automáticamente. Un borrado que corta una palabra es una elección manual; revisar escuchando antes de validar. Las transiciones heredadas se conservan en los fotogramas retenidos: no se inventa una transición nueva en cada unión.

## Pruebas

Pruebas unitarias: intervalos solapados/no finitos/fuera de rango, vídeo completo borrado, divisiones repetidas, proyección de capas y conversiones en ambos sentidos a cada fotograma.

Prueba FFmpeg real: vídeo sintético con cambio de tono 440→880 Hz y captions. Borrado 4–7 s de 12 s; MP4 de 9 s; comparaciones de píxeles antes y después del corte frente al montaje original; espectro confirma audio 880 Hz en el nuevo instante 4,2 s. Fragmento de 3 s que atraviesa la unión renderizado y decodificado, fuente intacta. Suite completa inicial 417/417 + 2/2 Git en host. QA posterior y despliegue se registran con sus resultados efectivos, no se dan por realizados aquí.

Evidencias privadas: /opt/sues-video-setup/montage-qa-20261029. Materiales, tokens, capturas y volcados de proyectos permanecen fuera de Git.
