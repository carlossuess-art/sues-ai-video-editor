# SUES AI VIDEO EDITOR · Prueba real de toda la cadena HyperFrames → FableCut

**Fecha:** 15/11/2026. **Rama:** `feat/speech-linked-motion-grammar-20261115` del repositorio existente `carlossuess-art/sues-ai-video-editor`.

**Estado:** `PRIVATE_NATIVE_CHAIN_VERIFIED` (prueba técnica sintética). No desplegado en FableCut productivo, no vinculada a un Reel real, sin aprobación artística, sin fuente de voz, sin publicación. **HyperFrames es el dueño del motion y conserva la fuente editable; FableCut monta el archivo renderizado, no sus parámetros internos.**

## Hito demostrado

1. **HyperFrames v0.9.20 real**, instalado previamente en Hostinger VPS `srv1841004`: `lint` 0 errores/0 warnings. `check` con Chrome en trabajo QA temporal devolvió `ok:true` y `browserSkipped:false`. Su salida sigue conteniendo **76 advertencias `line_unread` y una `container_overflow`** sobre el grupo de cámara que sale de plano. La inspección visual del contenido confirma la entrada progresiva y transición, pero las advertencias no se consideran eliminadas ni QA artística terminada. Audio `none` es esperado en este fixture sin voz.
2. Se resolvió la incapacidad del MCP SUES Server Console para ejecutar Chrome con un **trabajo transitorio systemd limitado**, no alterando ningún límite general: `LimitFSIZE=128M` (solo job), `MemoryMax` ≈1,4–1,8 GB, `CPUQuota` ≈80–85 %, `TasksMax` y `RuntimeMaxSec`. El primer límite de 16M seguía causando `SIGXFSZ`; el de 128M permitió `check`, `snapshot` y `render`. No se instaló otro motor ni se reiniciaron servicios.
3. **Render nativo HyperFrames/Chrome confirmado**: H.264 High/YUV420P, **1080×1920, 30fps, 151 fotogramas, 5,033333 s**, sin audio, tamaño 378.170 bytes, SHA-256 **`7f1ac8807b8275fde6d9d2b43fa440954484aae3588a477c17d35ba8395a9ec1`**. Archivo QA: `/opt/sues-video-setup/hyperframes-engine-next/sues-motion-narrative-20261115/qa-limited-worker-20261115/hf-native-v1.mp4`. **No es el MP4 proxy SVG.**
4. 12 capturas reales de Chromium comparadas con el MP4 nativo: PSNR **41,62–46,22 dB**, media **43,95 dB**. Fuente vinculada por huella `e41dadf2a5130698b5c193155b2a7dd28a922ed4bfe28ced404e45e0b8a9dba3` y por hashes de GSAP y Montserrat. Recibo privado `hf-native-proof-v1.json` (SHA-256 **`0181528e500ba9f7fa00d7eb7ea6bfb83a67ef2b2e7272f55964aaf2477b9f37`**).
5. **Importación con el MCP REAL de FableCut**: en el directorio QA aislado `/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/hf-native-v2-mcp-qa`, que contiene marcador `ISOLATED_HF_QA_NOT_PRODUCTION.txt`. Se creó un proyecto vacío con el esquema canónico de FableCut, se importó el MP4 con `fablecut_import_media` y se añadió un clip con `fablecut_patch_project` (CAS, revisión 2, 1 media ID `m_wx9pcj2`, 1 clip `qa-hyperframes-native-fullframe`). SHA de bytes importados idéntico al render HF.
6. **Exportación REAL mediante `fablecut_export`** en ese proyecto sintético: servidor privado `127.0.0.1:17942` y navegador Chrome ya instalado con lanzador QA exclusivo, sin tocar puerto 7777 ni FableCut público. H.264 High/YUV420P, **1080×1920, 30fps, 151 fotogramas, 5,033333 s**, tamaño 611.541 bytes y SHA-256 **`909eaaa37b41546fff29292403eedf677a63ee1c6eb2ea679347d42c5cfa9713`**. Archivo QA: `.../hf-native-v2-mcp-qa/exports/SUES HyperFrames QA AISLADA NO PUBLICAR_reel_1080x1920.mp4`.
7. **Comparación de fidelidad HF → FableCut:** en 12 puntos la PSNR fue **39,62–40,03 dB**, media **39,79 dB**. Además, la comparación directa de **TODOS los 151 fotogramas** de ambos MP4 mediante `ffmpeg psnr` devuelve mínimo **45,36 dB**, media **46,97 dB**, sin saltos de índice, con valor más bajo en F56. Los métodos son distintos (JPEG para las 12 muestras frente a vídeo decodificado para los 151 fotogramas); no comparar sus cifras como si fuesen métricas idénticas. PSNR mide similitud técnica y no acredita legibilidad/composición artística en toda la película.
8. **Verificación independiente del puente completo:** recibos/archivos con hashes de la fuente, del MP4 HyperFrames, bytes importados, MP4 FableCut, revisión/CAS, H.264, ausencia de audio, 30fps, 151 fotogramas, 12 muestras y registro `psnr` con **151 entradas consecutivas** validados por `scripts/motion-templates/verify-hyperframes-fablecut-e2e.mjs`. Último recibo privado: `.../hf-native-v2-mcp-qa/hf-fablecut-native-e2e-verified-v2.json`, SHA-256 **`1981c1e94328450a5419f8b97111a357e870b1edad4e2edf6d1d57d579a95161`**. `creativeApproval:false`, `productionChanged:false`, `publicationAuthorized:false`.

## Guion A/V por capas del fixture de 151 frames (demostración, NO narración real)

| ID / frames [in,out) | VOZ EXACTA / ancla | A-roll / cámara | Capas / B-roll / máscara | Motion / captions | SFX / música | Recursos / QA / estado |
|---|---|---|---|---|---|---|
| H01 [0,8) | **Sin voz**, texto ficticio | A-roll ausente; cámara estática | BG antracita + cuadrícula, tarjeta | Tarjeta de esquinas rectas se despliega | Sin audio | HF capturas reales y MP4 nativo verificados |
| H02 [8,32) | «¿Y» F8, «SI» F14, «TE» F20, «ESCUCHARAS?» F26; **tiempos demo** | Cámara estática | Tarjeta y cuatro palabras con máscara SVG | Radio se redondea conforme entran palabras; blur/opacidad por palabra; sin captions reales | Sin audio | Montserrat declarada; captura F14/F27; no prueba de audio |
| H03 [32,51) | Lectura ficticia | Cámara fija | Grupo de tarjeta/texto | Retención y legibilidad | Sin audio | Captura F36 |
| H04 [51,70) | Enlace visual sin voz | Zoom en la composición de tarjeta hasta salir del plano | Sale el grupo de tarjeta; BG permanece | Zoom/traslación sin corte seco; overflow deliberado en cámara | Sin audio | Capturas F51/F66; overflow reportado |
| H05 [59,92) | Metáfora de abrir espacio; sin voz | Fondo fijo | Dos rieles x540±20→540±426 | Los rieles se separan y liberan centro | Sin audio | Capturas F66/F81/F93 |
| H06 [81,119) | «HAZ» F81, «ESPACIO» F89, «PARA» F104, «ESCUCHARTE» F112; demo | Cámara estática | Dos líneas y cuatro clips de texto visuales | Palabras diferenciadas/animadas y 84px de separación base SVG | Sin audio | Capturas F93/F105, sin word IDs auténticos |
| H07 [119,151) | Retención sin narración | Cámara fija | Texto y rieles | Lectura final; salida posterior sin definir | Sin audio | Capturas F123/F144; no inventar continuidad |

No se dispone de fuente A-roll real, ni permisos de publicación de una obra, ni transcripción auténtica, ni mapa fuente→edición, ni música/SFX ni doble auditoría; estos faltantes **impiden declarar un Reel completo**.

## Código y pruebas

- `scripts/motion-templates/verify-hyperframes-native-render.mjs`: verifica fuente y dependencias, `ffprobe`, SHA del render HF y 12 capturas.
- `scripts/motion-templates/qa-fablecut-hyperframes-import.mjs`: FableCut MCP de verdad, solo entorno privado, copia exacta de media y creación de clip; no toca la versión productiva.
- `scripts/motion-templates/qa-fablecut-hf-private-export.mjs`: puerto privado 17942, navegador Chrome cacheado con wrapper QA, exportación MP4 a carpeta QA; cero edición de Reel.
- `scripts/motion-templates/verify-hyperframes-fablecut-e2e.mjs`: valida con checks de fuentes, SHA, duración, FPS, codec, revisión, 12 capturas y todos los frames del `psnr` raw. Aborta ante anomalías o indicación de publicación/producción.
- Tests nuevos `tests/hyperframes-native-proof.test.js` y `tests/hyperframes-fablecut-e2e.test.js` ejecutados con la evidencia REAL del servidor. Los tests antiguos siguen sin confundirse con QA creativa. **No se han hecho cambios de producto sobre FableCut.**

## Protección y siguientes pasos

**Producción intacta**: servicio FableCut PID de referencia `822968`, SUES Server Console PID `839661` continuaban activos; WAC, DNS, V29, originales, exportaciones publicadas y configuraciones productivas no se modificaron. Disco VPS al ~90 % (~4,8 GB disponibles). El montaje privado tiene un clip de vídeo y referencia/recibos a su fuente HyperFrames, pero sus máscaras/blur/objetos internos no son editables *dentro del MP4 FableCut*: la fuente editable permanece en HyperFrames.

Siguiente aceptación real: utilizar un Reel **nuevo y auténtico**, identificar el original por SHA, transcripción real con IDs y mapa temporal, selector explícito de palabras, guion técnico humano A/V por capas 1:1, recursos/licencias, sincronía real y tratamiento de subtítulos no interferentes; revisar y aprobar creative plan antes de editar. Preparar clon privado, ingesta FableCut con CAS/recibos/undo y comparar todo el Reel en **dos pasadas audiovisuales efectivas**, no automarcadas. Publicar solo mediante permiso independiente. El sistema todavía no tiene mapeo automático canónico de operaciones HyperFrames en un Master Story aprobado: no fingirlo.
