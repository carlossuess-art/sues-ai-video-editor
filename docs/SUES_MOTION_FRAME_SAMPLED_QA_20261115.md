# SUES · Motion narrativo · FableCut editable sincronizado por fotogramas (QA)

**Fecha:** 15/11/2026. **Estado:** DESARROLLO AISLADO / PRUEBAS DIRIGIDAS APROBADAS / SIN DESPLIEGUE / SIN PARIDAD VISUAL CERTIFICADA.

Repositorio existente: `carlossuess-art/sues-ai-video-editor`, rama `feat/speech-linked-motion-grammar-20261115`.

## Qué se ha corregido

La candidata FableCut previa utilizaba interpolaciones `ease-in-out` y `ease-out` distintas de las curvas del SVG de referencia. Por ejemplo, la esquina redondeada de la tarjeta a mitad de su evolución no coincidía. Se introdujo **`src/motion-templates/fablecut-frame-sampled-candidate.js`**, que deriva directamente del motor SVG ya verificado los valores por fotograma (30 fps) y los traduce a **keyframes nativos editables con interpolación lineal**.

La nueva versión conserva sin hornear el proyecto:
- Altura y radio de la tarjeta, fotogramas F0–F19.
- Zoom y desplazamiento de su composición anidada, F0–F69.
- Posición horizontal, vertical y opacidad de los dos rieles mientras se separan, F59–F91.
- Opacidad de las cuatro palabras del gancho y de las cuatro palabras de la segunda escena, cada una con su momento de entrada independiente.
- Ocho clips de texto independientes, cinco capas de figuras y dos composiciones.

Se eliminó la **traslación Y inventada** de los textos, ausente en el SVG de referencia. La opacidad de cada riel respeta los dos grupos SVG superpuestos (opacidad efectiva al cuadrado). **No se representa el desenfoque gaussiano como si estuviera implementado**: la versión nativa solo acredita el revelado por opacidad, y ese cambio sigue pendiente de aceptación creativa.

## Guion técnico A/V de referencia, sintético y no importable

El ejemplo «¿Y si te escucharas? / Haz espacio para escucharte» no es una grabación auténtica ni tiene narración o banda sonora. Los tiempos son demostración, **no anclas de Carlos ni un plan de Reel aprobado**.

| ID · fotogramas | VOZ / anclas | A-roll / cámara | Capas / máscaras | Movimiento / VFX / captions | Música / SFX | Recurso / QA / estado |
|---|---|---|---|---|---|---|
| MG01 · F0–F7 | Texto ficticio, no hay ASR | Sin A-roll, fondo antracita | Tarjeta y grid editables | Apertura vertical del rectángulo, inicialmente recto | Ninguno | Valores de altura por frame verificados |
| MG02 · F8–F31 | ¿Y F8 · SI F14 · TE F20 · ESCUCHARAS? F26; IDs ficticios | Cámara fija | Cuatro clips de texto; máscara SVG aún sin equivalente | Esquinas 0→62 px al entrar primera palabra; revelado independiente por opacidad, blur todavía pendiente | Ninguno | Clips/keyframes inspeccionados |
| MG03 · F32–F50 | Lectura | Cámara fija | Tarjeta, textos | Pausa visual de lectura sin efectos añadidos | Ninguno | Tiempos conservados |
| MG04 · F51–F69 | Enlace a otra idea, sin narración | Zoom 1→4,5 y desplazamiento hasta −1950 px | Composición anidada | Tarjeta y textos salen de cuadro al ampliar | Ninguno | Keyframes escala/Y verificables; render final pendiente |
| MG05 · F59–F91 | Metáfora de crear espacio | Cámara fija, sin rostro | Dos rieles editables | Rieles se separan; alpha combinado de dos grupos SVG, sin ornamentación | Ninguno | Posición/opacity numéricas verificadas con Motion.shapesAt |
| MG06 · F81–F118 | HAZ F81 · ESPACIO F89 · PARA F104 · ESCUCHARTE F112 | Cámara fija | Cuatro textos editables | Palabras independientes y sin traslación vertical inventada; separación geométrica de 84 px en el modelo SVG | Ninguno | Opacidad por fotograma verificada |
| MG07 · F119–F150 | Permanencia de lectura | Cámara fija | Dos rieles y textos | Pantalla final sin salida posterior definida | Ninguno | No inventar la transición siguiente |

## Evidencia y pruebas

- **`tests/fablecut-frame-sampled.test.js`: 5/5 PASS** en Node del VPS, ejecutados contra el motor **real** `/srv/sues-fablecut-next/app/motion.js`, `project-ops.js` y `comp.js`. Incluye comprobación geométrica de rectángulo y rieles, opacidades de los ocho textos, continuidad nativa de composiciones y no alteración de estado productivo.
- **Suite pertinente acumulada: 65/65 PASS**, 0 FAIL, 0 SKIP, ejecutada en `/opt/sues-video-setup/motion-narrative-review-20261115` el 15/11/2026. Incluye regresión del servidor de edición, selector, vínculo de palabras, composición SVG y candidatas nativas. **No** confundir con todas las suites históricas del editor.
- Copia de QA almacenada con escritura exclusiva (`wx`) en `/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/editable-motion-frame-sampled-v1.json`: **100.233 bytes**, **SHA-256 `359f0015c8a3d1f7f80844dcfdbeff468bc21614214d45fc3a69efbf6111b0bc`**, dos composiciones, 14 clips virtuales, ocho textos y cinco figuras. Es solo un fixture local **no publicado**.
- Panel de propuestas narrativas: se ha ejecutado su JS exacto de GitHub (blob SHA `011fdbb34b25e32e8a3c4573b467c9b213638fd0`) en Chromium local a 390×844 y 1280×920, contra datos y API simulados: dos propuestas, índices originales 3/5, exportación, invalidación tras editar y cambiar de proyecto, sin errores JavaScript ni overflow. Evidencia local: `/mnt/data/sues_motion_browser_qa/browser-qa-report.json`, `motion-panel-mobile-qa.png` y `motion-panel-desktop-qa.png`. **NO es la pantalla de la aplicación publicada ni una llamada al servidor productivo.**

## Bloqueos precisos: no declarar acabado

1. **Paridad visual FableCut vs. SVG NO acreditada:** desenfoque progresivo, máscara interior de la tarjeta, sombras, degradados, tipografía real y métricas, composición anidada y encuadre. El runtime de navegador FableCut/HyperFrames en VPS quedó bloqueado por límite duro de archivo heredado de la consola (`SIGXFSZ`); no se modificó ese límite ni se tocó producción.
2. **Voz real no proporcionada:** todavía no hay fuente con SHA verificable, selección de palabras aprobada, mapa tiempos fuente→edición ni audio que escuchar. Mantener «NO IMPORTABLE» y no generar timeline aprobada con datos ficticios.
3. **Falta el QA audiovisual de dos pasadas** y la aprobación creativa de Carlos sobre la composición final; tampoco se ha habilitado un mapping canónico con ledger/fingerprint que ejecute los efectos nuevos.
4. Los ocho textos y cinco figuras están **estructuralmente editables**; no afirmar que el render sea píxel-perfect ni que el vídeo esté listo para publicar.

## Siguiente paso exacto

Usar un navegador autorizado para un proyecto FableCut de prueba totalmente aislado fuera de la sesión con límite `SIGXFSZ`. Renderizar fotogramas F0, F7, F8, F12, F19, F26, F51, F59, F64, F69, F81, F91, F104, F112, F119 y F150 y comparar la misma fuente/paleta con el SVG. Registrar diferencias exactas por clip y corregir únicamente esas operaciones. No tocar el editor, WAC, Reels V29, DNS, assets originales ni ninguna versión publicada. Solo considerar importación tras mapping admitido, contrato íntegro, fuente real y autorización creativa.

**Para continuidad entre chats:** este documento complementa `AGENTS.md`, `PROJECT_STATUS.md` y `docs/SUES_MOTION_HYPERFRAMES_FABLECUT_20261115.md`.
