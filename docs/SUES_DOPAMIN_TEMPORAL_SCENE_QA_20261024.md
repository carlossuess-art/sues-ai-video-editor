# F7 · Auditoría temporal de B-roll y sugerencias de tramos limpios (24/10/2026)

## Qué se ha conseguido

El Director ya comparaba motivos narrativos del ASR con escenas etiquetadas manualmente a partir de 4 fotogramas/clip. Ahora dispone además de **auditoría técnica de toda la duración de cada clip instalado**, realizada con FFmpeg offline, para encontrar un tramo continuo apto para el tiempo de la frase. **No es interpretación visual integral ni OCR**: medir continuidad y fotogramas oscuros no demuestra ausencia de logos, rostros, derechos o contenido inadecuado.

## Fuentes y recursos preservados

Se amplió inspección visual mediante hojas de contacto tomadas a **1 fotograma/segundo** desde el inicio hasta el final de los clips locales (incluyendo reloj 19,6 s, cadena 6,4 s, caminante 6,4 s y amanecer 9,663 s). Los JPG siguen en VPS, carpeta privada `/opt/sues-video-setup/dopamin-visual-review-20261024`; **no se publican** en GitHub. Persisten el reloj con inscripción comercial, el caminante con persona de espaldas, la cadena sobre agua y el amanecer panorámico. La inspección por muestras es limitada; no constituye revisión cuadro a cuadro. El reloj conserva el bloqueo como candidato automatizado.

Script `scripts/audit-broll-temporal.mjs`: lee manifest privado de escenas ya etiquetadas, verifica **SHA256 de cada .media**, comprueba ffprobe y recorre el metraje **completo** con FFmpeg filters `blackdetect`, `freezedetect`, `select=gt(scene,0.36)` y `showinfo`, sin red ni API. Ejecutado bajo UID1000 con límites de memoria/CPU, contenedor sin red, assets en montaje original, preservando originales. La salida se guarda exclusivamente en un archivo JSON nuevo con permiso **0600** `jobs/library/asset-temporal-audit-v1.json`; este script usa `wx` (no sobrescribe). No guarda rutas privadas o medios en la salida pública.

Resultados de los 4 clips: **0 cortes detectados** con sensibilidad de escena 0,36; **0 intervalos negros** con umbral `pix_th=0.07, pic_th=0.96`; **0 intervalos congelados** con `n=-55dB:d=1.2`. Son resultados de umbrales, no pruebas de ausencia de cambios o movimiento. El reloj no se reautoriza.

## Motor y UI

`src/scene-temporal-qa.js` valida rigurosamente el índice privado, rechaza symlinks/entradas corruptas y calcula `suggestedSourceRange` para un segmento de duración compatible con la frase: separa ventanas mediante cambios de plano y negros, aplica margen alrededor de cortes y prefiere la mayor ventana disponible. Si ningún tramo cubre la duración necesaria, ese candidato auditado se excluye; si falta el índice, sigue como propuesta manual claramente no auditada. No modifica `videoEvents` ni llama al render.

En el vídeo maestro inmutable, sobre 165 palabras y 68,6491 s:
- «Meses muy ajetreados»: voz 9,16–12,54 s → cadena 1,51–4,89 s de su archivo original, **únicamente sugerido**.
- «Nuestro crecimiento»: voz 40,98–46,92 s → caminante 0,23–6,17 s o amanecer 1,861–7,801 s, como alternativas **sin aplicar**.

Las propuestas siguen siendo `approvedToAutoPublish:false`, `needsHumanReview:true` y `visualContentVerified:false`. La interfaz enseña el origen sugerido y recuerda que no ha editado el vídeo. CALMA, audio, origen, subtítulos y render permanecen intactos.

## Alcance y próximos pasos

Esta versión completa un **filtro técnico temporal, no una visión semántica autónoma**. Para alcanzar V1 hace falta evaluar imágenes completas, textos comerciales en otros segundos, rostro y safe zones, permitir selección/aplicación opcional de cortes de B-roll dentro del Video Edit Plan y generar/escuchar un nuevo MP4 real. La selección automática solamente puede activarse cuando el sistema tenga evidencia visual y QA suficiente; no convertir recomendaciones en edición sin aprobación.

**Estado**: F7 parcial, F6/F9 pendientes de validación creativa. Progreso global oficial 48% sin inflar. Coste externo 0 €.
