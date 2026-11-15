# SUES AI VIDEO EDITOR · Motion narrativo: puente autenticado y QA en VPS

**Fecha:** 15/11/2026. **Estado:** PREPARADO EN RAMA, **SIN DESPLIEGUE**, **SIN APROBACIÓN CREATIVA**, **SIN PUBLICACIÓN**.

**Repositorio:** https://github.com/carlossuess-art/sues-ai-video-editor

**Rama de trabajo:** `feat/speech-linked-motion-grammar-20261115`.

**VPS comprobado:** Hostinger `srv1841004` (identificador `1841004`), Ubuntu, Node `v22.23.3`, servidor SUES Server Console MCP operativo. El VPS del editor y el servicio FableCut fueron observados en ejecución. No se reiniciaron.

## 1. Contrato real del cambio

El panel **Motion narrativo · propuestas por palabras** se sitúa dentro del bloque existente **Subtítulos y elementos** de SUES AI VIDEO EDITOR. No crea un segundo selector: reutiliza las elecciones explícitas de `select[data-keyword]`, el índice de palabra original de `caption.wordIndexes` y el texto visible.

- En `web/app.js` se publica el contexto del trabajo actual `sues:motion-context` después de crear los controles, con jobId, revisión/fingerprint y los metadatos de los captions. El evento `sues:plan-updated` invalida el panel cuando cambia el proyecto.
- `web/narrative-motion-panel.js` recoge solo elecciones manuales; no interpreta `auto` como aprobación. Solicita propuestas al servidor mediante POST autenticado y pinta las respuestas con `textContent` (no `innerHTML`). No escribe ajustes ni crea un render.
- `web/index.html` añade el panel plegable bajo Subtítulos y elementos, y carga la nueva interfaz mediante script servido por la misma aplicación.
- `src/editor-server.js` agrega `POST /api/jobs/:id/motion-narrative` dentro del controlador de trabajos existente, sujeto a autenticación, origen y cabecera anti-CSRF del editor. Exige el fingerprint vigente; lee transcripción y manifiesto del mismo trabajo; responde únicamente con un paquete de revisión.
- `src/motion-templates/editor-motion-bridge.js` transforma índices *reales* de palabras en IDs estables y ligados al SHA de la fuente, sin inventar texto ni timestamps. Bloquea palabras reescritas, mapping roto, selección duplicada, texto no coincidente, palabras sin tiempos fiables y revisión/código fuente desactualizados. Reutiliza `narrative-motion-review.js` y `motion-av-review.js`.
- La salida es `sues-editor-narrative-review-bridge/v1`, que incluye propuestas semánticas, anclas originales y guion audiovisual humano por capas. **No es `sues-master-story/v1` importable.**
- Las palabras con `timingUncertain` se preservan como contexto pero no pueden elegirse para activar un motion ni formar un grupo de evidencia fiable. La presencia de otra palabra incierta fuera del fragmento ya no bloquea propuestas seguras.

## 2. Evidencia de ejecución real

La nueva consola MCP ejecutó comandos reales en Hostinger y devolvió su identificador y resultado. Las primeras descargas Git fallaron con `fetch-pack: invalid index-pack output`. Se confirmó `ulimit -Hf 1024` como tope duro de tamaño por archivo en los comandos. Para evitar sobreescrituras, se creó únicamente un directorio auxiliar `/opt/sues-video-setup/motion-narrative-review-20261115` con código y dependencias pequeñas recuperadas de la rama; se reutilizó la fuente de Montserrat de un worktree antiguo **solo para lectura**. Los elementos binarios/fuentes grandes quedaron fuera de la descarga. No se alteraron worktrees de V29 ni producción.

**Suite dirigida final en VPS:** `node --test tests/editor-motion-narrative-http.test.js tests/editor-server.test.js tests/editor-motion-bridge.test.js tests/editor-motion-ui-wiring.test.js tests/narrative-motion-review.test.js tests/motion-av-review.test.js` → **25/25 PASS, 0 FAIL**, Node 22.23.3.

Cubre autenticación real con cookie, 401 sin sesión, 403 sin cabecera, 403 origen ajeno, 409 en fingerprint antiguo y mapping fuente/caption incorrecto, respuesta 200 para palabra real, sin alteración de revisión o estado. Incluye 6 pruebas preexistentes de regresión HTTP, validación semántica, importabilidad bloqueada y comprobación estática del wiring UI. **No confundir la suite dirigida con todas las regresiones históricas.**

La sintaxis real de `src/editor-server.js`, `web/app.js` y `web/narrative-motion-panel.js` se comprobó con `node --check` sin errores. Los hashes Git de la rama para esos archivos se contrastaron con los obtenidos en el VPS. Las pruebas de movimiento del prototipo anteriores siguen siendo independientes de esta integración.

**No disponible para este bloque:** navegador Chromium/Playwright instalado en el entorno aislado; por tanto **QA visual, interacción táctil y auditoría de dos pasadas no ejecutadas**. El endpoint está probado con HTTP sintético, no se ha empleado un vídeo con voz auténtica ni se han leído proyectos privados de Carlos. Las pruebas de fixture no autorizan creatividad ni edición. El sistema productivo no incorpora aún esta versión.

## 3. Requisitos de entrada antes de un Reel auténtico

- Proyecto existente, fuente SHA verificada, revisión/fingerprint vigente, transcripción original y mapeo fuente↔edición. Los `wordIndexes` existentes deben corresponder exactamente al texto original, o se bloquea y se pide reconciliar.
- Palabras explícitamente marcadas en los subtítulos por Carlos y envío de solicitud de análisis; nunca atribuir una selección automática a Carlos.
- Guion A/V completo por capas, inspección de fotogramas reales, ubicación relativa al rostro/manos, fondo y oclusión reales, derechos de biblioteca y tiempos editados.
- Contrato nativo e importador verificados **para cada operación**. Los dos prototipos SVG aún no son una operación FableCut acreditada; otras cinco familias solo son especificación.
- Plan aprobado vinculado a revisión, clon privado, render 1080×1920/30 genuino cuando proceda, dos auditorías completas y valoración creativa de Carlos. No publicar ni cambiar la versión activa sin una autorización diferenciada.

## 4. Seguridad y rendimiento

El disco del VPS estaba al 90 % y con 4,9 GB libres. No se descargaron modelos, no se instalaron nuevos servicios, no se consumieron APIs de pago y no se copiaron medios privados a GitHub. `SUES Server Console` y FableCut se mantuvieron funcionando. La carpeta aislada de pruebas ocupa aproximadamente 8–9 MB más symlinks a librerías existentes, sin sobrescribir material original.

## 5. Siguiente fase exacta

Realizar QA de interacción visual en un navegador autorizado con el editor en clon aislado. Después de aceptar el panel y verificar un Reel real, diseñar la traducción sin pérdida de operaciones de motion con word IDs y capacidades reales de FableCut/HyperFrames. Mantener separados estado del código, integración técnica, render y aprobación de Carlos.

**Continuidad entre chats:** añadir este documento, el repositorio y la rama a las instrucciones del proyecto.
