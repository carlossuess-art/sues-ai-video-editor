# SUES AI VIDEO EDITOR · Primera prueba con el último Reel auténtico (10/11/2026)

**Estado: QA TÉCNICA REAL PARCIAL · NO APROBADO CREATIVAMENTE · NO DESPLEGADO.** Fecha de ejecución: 15/11/2026, Hostinger VPS `srv1841004`, rama de desarrollo `feat/speech-linked-motion-grammar-20261115`. Este informe recoge pruebas realizadas, incluyendo fallos. No publica, no modifica V18 publicada ni WAC, ni presupone que las nuevas funciones estén disponibles en el editor web productivo.

## Identificación verificable y reutilización sin subida duplicada

- Archivo MP4 facilitado por el usuario: `sues-2026-11-10-11-59-12.mp4`. Se encontró una copia **idéntica byte a byte** en el VPS: `/srv/sues-fablecut-next/data/automation-v1/recording-20261110-115912/original.mp4`. Tamaño 102.100.959 bytes; **SHA-256 `0190efba90de1f7f73bfef8fc1c3822779a82c123225f77b68a50a9b31a77ad8`**. Bruto de ~59,9 s, 1080×1920 con audio.
- Original preparado CFR30 `recording-20261110-115912/source-cfr30.mp4`: 1080×1920, 30fps, 1797 fotogramas, 59,9s, audio AAC.
- Transcripción preexistente en `recording-20261110-115912/transcript-asr.json`: **129 palabras con IDs y marcas de tiempo**, `humanReviewed:false`; contiene errores ASR que deben corregirse antes del plan definitivo.
- Proyecto existente de FableCut **«SUES · ¿Quién habla en tu cabeza? · V18 integración atmosférica»**: `/srv/sues-fablecut-next/data/automation-v1/test-project-040-v18`. Versión base revisión23, **165 clips en 14 pistas y 49 recursos**, 1080×1920/30fps, timeline final [0,55,5667) s con cortes. SHA original del `project.json`: `1ca6a09fecdfd23bc32ef398c3574e9ff15cbc7dac7a10c8535ff41f1e9ade03`.
- La copia V18 de trabajo se creó con una unidad transitoria acotada (restricción `LimitFSIZE=128M` solo en ese trabajo, no global), con SHA exacto y marcador `ISOLATED_HF_QA_NOT_PRODUCTION.txt` en `/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/reel-20261110-v18-hf`. No se recreó el montaje de cero.

## Motion HyperFrames sobre palabras auténticas: prueba técnica, elección NO aprobada

Para comprobar sincronía con los cortes de V18, se tomó **provisionalmente** el CTA como fixture, sin considerarlo palabra clave elegida por Carlos ni sustituir la selección interactiva obligatoria. Originales seleccionados: ASR `word-112-span-0` «y», `word-113-span-0` «la», `word-114-span-0` «ansiedad», `word-115-span-0` «atrás» y `word-119-span-0` «conectar», `word-120-span-0` «con», `word-121-span-0` «tu», `word-122-span-0` «corazón». Cada comienzo se transformó mediante los **clips reales V1** de bruto→editado, sin suponer un mapa identidad.

- Inicio en el montaje **fotograma1488 = 49,6s**; último fotograma exclusivo **1639 = 54,6333s**. Entradas relativas **[8,14,17,29] + [89,103,108,111]**, 151 fotogramas totales.
- Fuente HyperFrames editable privada `/opt/sues-video-setup/hyperframes-engine-next/sues-motion-narrative-20261115/qa-real-reel-v18-20261115`, con `wordScheduleJson` y `--variables-file --strict-variables`.
- Render HyperFrames **NATIVO H264 1080×1920/30fps/151 frames, 5,033333s, 363.213 bytes**, SHA **`b5d47f9f366b4c86c52523395a582944c8ef8b08479c1092f92aa4fe3603f80f`**.
- **Advertencia de arquitectura:** `src/motion-templates/editor-hyperframes-preflight.js` todavía bloquea proyectos con cortes, como V18. Esta prueba usó un script limitado de QA que calcula el mapa desde los V1 del proyecto; **no demuestra que el editor publicado ya sepa hacer rebase automático** ni que exista aprobación creativa. El template fijo 4+4 palabras no sirve universalmente para cualquier Reel.

## Prueba FableCut A: MP4 REAL exportado, composición creativamente inválida

- Clon `reel-20261110-v18-hf`: MCP auténtico `fablecut_patch_project` con CAS baseRevision23, **1 nuevo media + 1 nuevo clip V9**, inicio49,6s, duración5,033s, previsualización solo entre in/out del tramo. Readback mostró revisión24, **166 clips y 50 media**, todos los 165 clips y 49 media de V18 originales conservados. FableCut normalizó el documento tras exportación (nueva revisión de QA).
- MP4 privado real `exports/SUES Quin habla en tu cabeza V18 integracin atmosfrica_reel_1080x1920.mp4`: **1080×1920/30fps, 151 fotogramas, 5,0333s, pista de audio presente**, SHA-256 **`583e49dd53304e93112f785703beb953b2f8d0f7cc6e68bea52661ec7d6b053c`**. Recibo `qa-hf-v18-preview-export.json`.
- Comparación de **los 151/151 fotogramas** con el MP4 de HyperFrames: PSNR mínima **45,31 dB**, media **46,98 dB**. **Esto prueba fidelidad de la composición exportada, no su conveniencia creativa.**
- **FAIL VISUAL importante:** al ir sobre V9, la tarjeta/panel de fondo antracita cubre la imagen de Carlos y los títulos/subtítulos ya existentes en V18. Una comparativa de fotogramas reales muestra la pérdida del rostro y de la composición del CTA. **NO APROBABLE: no promover esta variante.**
- **Audio aún NO certificado:** 5s de audio decodificado comparados con una exportación V18 anterior de 540p presentaron RMS0,07269 referencia vs0,05725 nueva, picos0,839 vs0,802 y correlación0,426 sin desplazar / 0,545 con alineación ±100ms. La presencia de una pista de audio NO acredita preservación fiel de la mezcla; necesita QA sonora.

## Prueba FableCut B: motion detrás del sujeto (bloqueada, NO hay MP4 válido)

- Se hizo una **segunda copia privada independiente** `reel-20261110-v18-hf-behind` y mediante MCP `fablecut_patch_project` se movió **únicamente el clip QA** V9→V3, mezcla `screen` con opacidad0,88, para mantener las capas existentes de sujeto V5 y subtítulos V8 por delante. No se modificaron otros 165 clips. Proyecto QA avanzó de revisión26 a27 y luego tuvo guardados de exportación hasta revisión30.
- **NO se consiguió una segunda exportación completa verificable**: el primer intento detectó que se había reutilizado un nombre de fichero antiguo; el segundo utilizó un nombre de salida único `SUES_HF_DETRAS_QA`, pero la herramienta devolvió un estado sin completar a su timeout y eliminó el `.part.mp4`. No existe segundo MP4 comprobable.
- Se intentó verificar con **`fablecut_frame` real** en la copia privada a los 50,00s y 53,30s. El primer frame falló `presented frame timeout`. **No hay evidencia de preservación del rostro/captions en B.** La composición B queda `QA_BLOCKED_NOT_CREATIVELY_APPROVED`, no afirmar que «funciona detrás».
- La ruta editable interna permanece en HyperFrames HTML/SVG/GSAP. El vídeo H264 exportado carece de canal alfa; `screen` NO equivale automáticamente a una máscara precisa ni a recorte de silueta.

## Consecuencias y siguiente decisión

1. **Motor e ingesta reales demostrados** sobre un Reel auténtico reutilizado y el editor FableCut en su clon, sin usar créditos ni tocar la instalación publicada.
2. **Diseño actual rechazado**: no añadir un panel completo sobre el CTA existente, que ya tiene título `ESTRÉS Y ANSIEDAD`, rostro, manos y subtítulos. Rediseñar como motion/objeto con canal alfa verificable o con matte real, o elegir otro bloque narrativo, solo tras presentar el guion A/V humano por capas y **selección de palabras por Carlos**.
3. Recuperar propuesta artística con 129 palabras verificadas (corregir errores ASR), sus tiempos, mapa fuente→editado de V18, máscaras/rostro, recursos, música/SFX reales, coincidencia de títulos y captions. El nuevo plan no puede ser un simple panel 4+4 insertado encima de la historia.
4. **Antes de cualquier despliegue real:** integrar el rebase de mapas con cortes en el preflight público, multioperación Master Director, host humano autenticado/ledger, y probar una versión privada sin colisiones con dos revisiones audiovisuales reales, incluyendo escucha. Aprobación creativa y autorización de publicación separadas.
5. No reintentar exportaciones largas ciegamente tras timeout: reconciliar estados y logs; usar scopes/fotogramas de baja carga o un render segmentado realmente estable. El VPS disponía de ~4,4GB libres (91% disco) en el tramo de QA. Se utilizó SUES Server Console y límites de CPU/RAM/tiempo **solo en trabajos temporales**.

**Pruebas técnicas no se confunden con diseño aprobado, integración en editor web productivo ni publicación.** Ninguno de los dos clones debe copiarse sobre V18 original sin nuevo plan aprobado y sin QA visual y sonora satisfactoria.
