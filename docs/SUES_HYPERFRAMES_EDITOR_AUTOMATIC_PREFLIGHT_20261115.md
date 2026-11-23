# SUES AI VIDEO EDITOR · Preflight automático de palabras → HyperFrames

**15/11/2026 · checkpoint de desarrollo aislado.** Rama: `feat/speech-linked-motion-grammar-20261115`. No hay despliegue, Reel aprobado ni publicación. SUES MASTER DIRECTOR decide; HyperFrames crea el motion; FableCut monta la edición.

## Resultado implementado

1. **La selección existente de subtítulos se reutiliza.** `web/index.html` añade «Preparar HyperFrames · sin editar el vídeo» dentro del panel Motion narrativo, sin otro selector, y exportación de variables JSON. `web/narrative-motion-panel.js` controla solicitudes asincrónicas, cambios de proyecto o texto, información por fotograma, informe de revisión y descarga del guion A/V detallado.
2. **Endpoint autenticado y sin escritura:** `POST /api/jobs/:id/motion-hyperframes-preflight` de `src/editor-server.js`. Requiere cookie, cabecera anti-CSRF, mismo origen, huella del job vigente y exactamente `fingerprint` + `selections`. Recalcula el proyecto, catálogo, fuente, transcripción, mapas y palabras desde el servidor; no acepta decisiones creativas o rutas de archivos suministradas por el navegador.
3. **Validación reforzada:** `src/motion-templates/editor-motion-bridge.js` contrasta cada palabra del caption que contiene la selección contra la transcripción original, no solo la palabra destacada. Bloquea cambios fuera de sincronía, caption manual reescrito, palabra con tiempo incierto e índices equivocados.
4. **`src/motion-templates/editor-hyperframes-preflight.js`:** genera una propuesta `sues-editor-hyperframes-preflight/v1` con **8 IDs y posiciones originales** para la gramática fija de dos frases de 4 palabras. Solo admite `TPL_HOOK_DROP_CARD` seguido de `SUES_CARD_TO_SPACE_DEMO`, con dos anclas marcadas y ambas frases reales. Verifica huella fuente/job/timeline, **sourceTimeMap identidad 1:1 sin cortes**, margen de duración, FPS 30, ventanas reales de entrada, ausencia de ID repetido, y palabras ordenadas. Si algo falla retorna `BLOCKED_FOR_EVIDENCE`, nunca un render aproximado.
5. **`src/motion-templates/hyperframes-av-preflight.js`:** produce simultáneamente una tabla humana A/V de **7 filas**, con cada palabra, ID, tiempo original y fotograma editado, las capas, cámara, efectos, audio y QA pendientes. Es la misma revisión que las variables; encabezado **PROPUESTO / NO IMPORTABLE / SIN APROBACIÓN**.
6. **HyperFrames de verdad:** `examples/motions/hyperframes-card-to-space/index.html` declara la variable `wordScheduleJson` y valida esquema, longitudes e IDs, además de los cuatro textos visibles. HyperFrames v0.9.20 acepta el archivo `--variables-file` con `--strict-variables`. El renderer deja de usar los tiempos fijos del ejemplo y consulta los fotogramas enlazados a las palabras.

## Evidencia real de VPS / Chrome

Entorno exclusivamente sintético, directorio de QA `/opt/sues-video-setup/hyperframes-engine-next/sues-motion-narrative-20261115/qa-speech-vars-20261115`:

- Frases ficticias de ocho palabras con tiempos *escogidos para probar el motor*; no hay audio de Carlos ni transcripción personal. Fotogramas **[8,16,24,30]** y **[86,99,108,120]**, diferentes de los del demo anterior.
- `hyperframes lint`: **0 errores, 0 avisos** en la composición modificada.
- Render HyperFrames **NATIVO con variables estrictas**: H.264, **1080×1920, 30 fps, 151 frames, 5,033333 segundos**, **380.842 bytes**, SHA-256 `095bc084c26959381bd0f79f4ea5b1fdfc6633a4f145cf2fb2e36d2388bcdb4f`.
- HTML versión GitHub blob `a1fdbe7a3bfa5068fb1e9baec96459d9594f7bf1`, guardada como archivo nuevo en QA, sin tocar la composición anterior.
- **Chrome real, DOM y `hf-seek`**: F15 segunda palabra del gancho demo tiene opacidad 0,4213 y con tiempo revisado vale 0; en F19 la revisada alcanza 0,875. F93 la segunda palabra del final demo tiene opacidad 0,9213 y la nueva 0; F102 la nueva alcanza 0,8134. Esquema de calendario incorrecto provoca error de navegador, **no fallback silencioso al demo**. Prueba `tests/browser/hyperframes-variable-runtime.test.mjs`: **1/1 PASS**.
- **Suite Node dirigida de módulos editor, servidor autenticado, render/QA anterior y nuevas pruebas de stage:** **93/93 PASS, 0 FAIL, 0 SKIP**. Incluye 6 pruebas específicas de preflight, seguridad HTTP, controles de no edición y guion A/V, además de la regresión anterior.
- Recibo SHA y evidencia inmutable de QA guardado con permisos privados: `qa-speech-vars-20261115/qa-speech-variable-proof.json`. `canExecute:false`, `creativeApproved:false`, `fablecutImported:false`, `productionChanged:false`.
- El VPS conserva FableCut y SUES Server Console operativos. No se ha instalado ningún motor nuevo ni usado crédito de generación; disco cercano al 90 % como antes.

## Limitaciones VERDADERAS

- **NO hay automatización productiva completa.** La nueva interfaz prepara un borrador con tiempos y variables. No pulsa ni autoriza render o edición; no escribe el plan aprobado en `sues-master-story/v1`, ni tiene mapping canónico de la nueva operación al ledger/CAS FableCut.
- **La plantilla fija es 4+4 palabras**, pantalla completa, con clips de 151 frames; otros discursos y composiciones requieren una gramática adaptativa y aprobación de diseño. No insertar una plantilla forzada en textos que no encajan.
- **Mapas con cortes bloqueados** hasta desarrollar y verificar rebase de palabra/tiempo real. No aceptar `sourceTimeMap` inventado.
- En la fase anterior está probada la **cadena nativa demo HyperFrames → FableCut (MCP) → exportación con comparación de 151 frames**, pero aún NO se ha probado esa cadena con un proyecto real/aprobado ni con estas nuevas variables sobre un Reel.
- Los controles creativos siguen siendo indispensables: selección explícita, guion técnico A/V por capas, revisión de imagen/cara/subtítulos, audio auténtico y dos pasadas audiovisuales completas; aprobación creativa diferenciada de la publicación.

## Próximas etapas

1. Integrar una **ejecución privada aprobada** con el `MasterDirectorProjectStore` existente, ledger de autorización de un uso, fingerprint del guion y fuente, y resolución de proyecto FableCut con CAS. Sin aprobación, el preflight siempre queda no ejecutable.
2. Renderizar el vídeo específico con **exactamente el JSON aprobado**, comprobar fuente/variables/archivo con SHA y `ffprobe`; no reutilizar el MP4 demo.
3. Importar el resultado a **un clon privado del Reel correspondiente** en FableCut, conservando el enlace al proyecto fuente de HyperFrames y realizando readback/recibo y comprobación de duplicados. QA y difusión siempre separadas.
4. Implementar el rebase temporal de proyectos recortados, cuando se disponga de un `sourceTimeMap` verdadero verificable. Nunca desplazar palabras a ojo.
5. Antes de ofrecerlo en producción, probar end-to-end con un Reel auténtico nuevo y auditar de verdad imagen y audio dos veces. No tocar V29/WAC/servidores publicados.

**Continuidad:** `PROJECT_STATUS.md`, `AGENTS.md`, `docs/SUES_HYPERFRAMES_FABLECUT_NATIVE_CHAIN_20261115.md` y este documento.
