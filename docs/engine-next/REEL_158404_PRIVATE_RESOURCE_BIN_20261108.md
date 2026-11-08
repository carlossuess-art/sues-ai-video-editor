# Reel 158404 · Biblioteca privada FableCut: cuatro recursos recuperados

Estado 08/11/2026: prueba técnica de biblioteca, NO aprobación artística, de imagen o de derechos. Normativa Film Director V2 D01–D77; original V1 y voz A1 bloqueados. Los recursos existen en un staging previo y se compararon por SHA256, no se generó ninguno nuevo.

Proyecto QA independiente: `/srv/sues-fablecut-next/data/qa/reel-158404-all-available-assets-bin-20261108/`. FableCut lo abrió realmente y mostró **14 medios, 9 clips**. Media preflight 14/14, cero faltantes. Visor real comprobado en 1,2, 4,3, 11, 32, 48 y 71,5 segundos, sin errores JS. En ninguno de estos cuatro nuevos recursos se creó un clip activo: permanecen 49 operaciones reconocidas y 30 sin materializar.

| ID | Archivo original y SHA confirmado | Limitación que impide activarlo automáticamente |
| --- | --- | --- |
| B04 | `B04_isolation_candidate.jpg`; `d7a08ba26273017bb574d4ecba21606d91cf8e004162682bc4c3fc2c1ca3efd0`, 1600x900 | Persona identificable en contexto de rechazo; permisos/contexto y adaptación del B-roll de 5,2s pendientes; imagen fija no equivale a vídeo |
| B05 | `B05_mirror_candidate.jpg`; `183381691cc4a14c2af50d445a5007f9334b586be1190493502f772b0627f888`, 1400x933 | Persona identificable; falta matte temporal real 47–50,5s detrás de Carlos, tracking y feather |
| M03 | `M03_reconocerte_revisar.mp4`; `b2c06610e66bd920b8681c76ff8407f09a625965a5a7160c735b62a2ecfdf6e0`, H264 1080x1920, 160 frames 5,333333s | Inspección real: solo dos bloques planos «NO CONVERTIRTE EN OTRO» y «RECONOCERTE» sobre tapiz antracita; **referencia no cinematográfica**, no se debe declarar completada la composición 2.5D/3D. Plan 5,33s sin redondeo automático |
| IMPACT | `SFX_whoosh_thunder_intro_original.wav`; `36ca38a0502ad9c30db18053a2ddc78131f078c298f9a204fcf8d68a67687995`, PCM 16bit mono 48kHz 0,96s | Sonido/uso y mezcla de voz sin aprobación; plan inicial 1,1s, diferencia 0,14s; no duplicar audio |

Otros bloqueos: faltan archivos locales de hash exacto para M02 y MUSIC, M01 requiere una composición original no existente, y las dos versiones históricas discrepan en SHA del B02. En la fuente maestra hay 11 títulos con intervalos diferentes; no activarlos sin escuchar palabras reales. No confundir hash coincidente con licencia comercial, derecho de imagen, calidad visual ni aprobación de Carlos.

Herramientas: `src/engine-next/reel-158404-private-resource-bin.js`, `scripts/engine-next/stage-reel-158404-private-resource-bin.mjs` y `tests/engine-next/reel-158404-private-resource-bin.test.js`. En VPS quedaron el nuevo `project.json`, `49-operations-resources-crosswalk.json`, `unapproved-resource-availability.json`, `media-bin-preflight.json` y `private-native-preview/14-resource-native-library-proof.json`. Fotos, vídeo y audios privados NO enviados a GitHub público.

Siguiente trabajo: verificar derechos de B04/B05, crear temporal matte de B05 (sin fabricar persona), construir M01/M02/M03 motion cinematográfico autorizado y verificar por escucha la sincronía de títulos/subtítulos. Solo entonces podrán añadirse clips y efectos a la línea de tiempo única. No tocar producción, Caddy ni Studio público.
