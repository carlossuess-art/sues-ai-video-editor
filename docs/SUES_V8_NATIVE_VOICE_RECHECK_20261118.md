# V8 · Verificación nativa de voz y referencia completa

18/11/2026 · PR #27 · Prueba técnica privada del cierre de 2,933 s. La V8 completa y su revisión creativa siguen abiertas. Avance estimado de V1 52 %, etapa 2 de 4 al 72 %.

## Resultado comprobado

- Se recuperó la [referencia visual de 18,2 s](https://drive.google.com/file/d/1CnOBocWfAV2c1iaE-vEFoK9ZpMc5K4af/view) y se verificó que coincide con el SHA registrado `cbdf3a99259eac6953e08aee795a9ef2065dc67913de0a73048ec1bfa9bdf06e`. FFprobe confirma 1080 × 1920, 30 fps, 546 frames. Se cotejaron 12 fotogramas, desde F0 hasta F545.
- Se aplicó únicamente la corrección del punto de entrada de voz `af_voice.in: 0.4 → 0` en una copia privada por MCP con CAS. La verificación de lectura confirmó que las demás capas conservaron su contenido.
- Los intentos con la copia que retenía el catálogo completo quedaron pendientes al abrir la exportación. El Chromium de diagnóstico llegó a cargar el editor, sin completar la petición del ticket antes del límite. Una copia auxiliar independiente con las 14 capas activas y los tres medios utilizados completó el render; no se borró ningún medio ni secuencia del proyecto de referencia. La prueba no aísla una causa única de los fallos anteriores.
- FableCut exportó 1080 × 1920, 30 fps, H.264/AAC, 88 frames y 2,933333 s, SHA `1a07418925061d071a401b6841a796c04d052f869588de4f6021c7fe60ea0daa`. **88/88 fotogramas decodificados idénticos al MP4 previo**. El avance de voz medido respecto a IN pasó de **+399 ms a −1 ms**; respecto al fotograma F459, de **+379 ms a −21 ms**. La diferencia entre ambos relojes es 20 ms por el IN subfotograma de 15,28 s ante el primer fotograma a 15,30 s. Correlación después 0,878526. La medición técnica no sustituye la escucha y aprobación creativa.

## Cobertura de la referencia y continuación

| Intervalo de la referencia | Composición de referencia | Cobertura nativa verificada |
|---|---|---|
| 0–0,55 s, fundido hasta 0,98 s | A-roll original, gráfica de apertura y cambio al tapiz | Ausente del cierre nativo. |
| 0,62–3,73 s | Cerebro, títulos progresivos, movimiento y luz | Ausente del cierre nativo. |
| 3,50–6,40 s | Escucha, órbitas y nueva aparición de A-roll en 6,10–6,38 s | Ausente del cierre nativo. |
| 6,30–10,61 s | Sofá de la apertura y aparición de una voz | Ausente del cierre nativo. |
| 10,68–13,73 s | Tarea, líneas y títulos de la voz interior | Ausente del cierre nativo. |
| 13,56–18,20 s | Respuesta, PFFF, sofá con persona y títulos de cierre | Voz verificada y exportación nativa desde 15,28 s. Paridad visual con la referencia, relieve, trayectorias y animaciones complejas siguen pendientes. |

Los intervalos solapados proceden del render de referencia. La transcripción ASR sin revisión humana sitúa «otra» en 18,02–18,24 s. En el audio de referencia se detectó señal de −25,3 dBFS RMS en los últimos 30 ms, por lo que el corte en 18,20 s requiere escucha al revisar el cierre definitivo. Conservar 18,2 s como control técnico de la referencia. Revisar selección de palabras y salida del plano antes de cerrar una nueva versión.

Siguiente comprobación: acordar la selección de palabras en la transcripción, congelar una revisión del guion por capas, preservar el máximo de capas editables y acreditar equivalencia con la referencia para las operaciones restantes. Después, exportación completa en clon y dos pasadas de imagen y sonido. Producción, biblioteca original y otros proyectos se conservan.
