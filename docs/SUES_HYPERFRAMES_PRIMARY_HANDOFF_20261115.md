# SUES Motion Graphics · Arquitectura HyperFrames → FableCut · Handoff verificable

**Fecha:** 15/11/2026. **Estado:** desarrollo aislado, sin despliegue ni aprobación artística. La decisión técnica es explícita: **HyperFrames es el motor dueño de las animaciones**; FableCut NO debe sustituirlo. SUES MASTER DIRECTOR diseña la composición y sincronía narrativa; FableCut organiza el Reel, voz, audio, subtítulos y clips.

## Responsabilidades, editabilidad y evidencia

| Componente | Lo que controla | Dónde se puede editar | Límite comprobado |
|---|---|---|---|
| SUES MASTER DIRECTOR | Intención narrativa, selección explícita de palabras, escenas, montaje A/V por capas, identidad/fingerprint y aprobaciones | Contrato creativo revisable | Ningún efecto se ejecuta a partir de una mera propuesta |
| **HyperFrames** | Entrada de palabras, máscara, blur, objetos, posiciones X/Y/Z, curvas, cámara, transiciones, lienzos, animaciones GSAP/HTML/SVG/Three.js | **Fuente HTML/JS + variables/IDs de HyperFrames** | `lint` y `timeline` verificados; Chrome/runtime/render nativo pendientes por `SIGXFSZ` |
| **FableCut** | Edición de clips, voz, canciones, captions, montaje, pistas gráficas, recorte/posición del clip exportado | Montaje y clips en FableCut | Un MP4 importado NO conserva geometría, máscaras o keyframes internos de HyperFrames; mantener enlace al proyecto fuente |
| SVG proxy (QA) | Comparación visual preliminar de la animación fuente | JS/SVG original | NO ES un render nativo de HyperFrames y jamás puede pasar como prueba de integración |

**Modos:** para motion a pantalla completa, el vídeo nativo de HyperFrames puede entrar como clip gráfico una vez verificado y autorizado. Para superponer al rostro, exigir canal alfa/máscara y render compatible acreditados; **no** prometer transparencia ni interferencias cero sin prueba. Tras exportar a FableCut se pueden editar los parámetros del **clip**, no la animación interna. Para retocar palabras, blur, timing fino, máscara, cámara u objetos, modificar la **fuente HyperFrames**, regenerar el clip y volver a revisar la sincronización.

La candidata `fablecut-frame-sampled-candidate.js` y las 65 pruebas precedentes de FableCut fueron un **experimento de equivalencia**, no un cambio de propietario del motion ni la ruta canónica de producción.

## Código nuevo y protección del intercambio

- `src/motion-templates/hyperframes-motion-handoff.js`: contrato de origen/verificación, hashes por archivo, parámetros de 151 frames/30 fps/1080×1920, alcance de editabilidad y barreras de producción. Rechaza intentar etiquetar un **SVG proxy** como render nativo.
- `scripts/motion-templates/prepare-hyperframes-handoff.mjs`: herramienta de generación de manifiesto `SOURCE_ONLY_NO_RENDER`, por hash SHA-256, con escritura exclusiva de prueba. Requiere verificar el HTML, FPS, dimensiones, soporte `hf-seek` y **comparar ambos módulos runtime con el código canónico del editor**. No toca proyectos FableCut.
- `tests/hyperframes-motion-handoff.test.js` (5 pruebas) y `tests/hyperframes-source-sync.test.js` (4 pruebas): propiedad de cada motor, prohibición de suplantar un render, huellas de origen, detección de código obsoleto, base temporal y no sobrescribir evidencias.
- Los 9 tests anteriores pasan; **suite total pertinente 74/74 PASS** en Node del VPS `srv1841004`, 0 FAIL/SKIP, incluyendo las 65 comprobaciones anteriores.
- El proyecto HyperFrames existente `/opt/sues-video-setup/hyperframes-engine-next/sues-motion-narrative-20261115` conserva el HTML, GSAP local, Montserrat y el runtime de dos escenas. **No se instaló ni creó otro motor/editor.**

## Incidencia REAL resuelta: código HyperFrames desactualizado

La auditoría de Git blobs detectó que el archivo runtime `runtime/sequence-card-to-space.js` no era idéntico al canónico vigente:

- Antes: blob `8d51c9905f9d36705c7e73efdcf710752018cca7`.
- Canónico en GitHub: `6e3e8246e266a662d17c957e4dfe1f2c20cb225c`.
- Se guardó una copia del anterior en `/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/` y se actualizó **solo** el runtime del proyecto HyperFrames aislado, usando hash Git verificado. `cmp` confirmó que ahora coincide con el motor fuente de la rama.
- Huella original del paquete: `26cbb08f500526b6f056431602845141b9988ee05927a965808b9773727ab48d`.
- **Huella sincronizada:** `e41dadf2a5130698b5c193155b2a7dd28a922ed4bfe28ced404e45e0b8a9dba3`.
- Manifiesto vigente, privado y no importable: `/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/hyperframes-source-review-v3.json`.

`hyperframes lint` en versión instalada **v0.9.20**: **0 errores / 0 advertencias**. `hyperframes timeline --json`: un clip gráfico desde 0 hasta **5,0333333333 s**. `hyperframes doctor` muestra versión más reciente disponible, **v0.9.53**, pero no se ha actualizado: no hay motivo técnico acreditado para gastar recursos o introducir una versión distinta sin QA. El navegador del VPS sigue fallando por tamaño de archivo al ejecutar Chrome (`SIGXFSZ`); **no manipular protección del sistema ni declarar render HyperFrames válido**. El disco seguía al 90 % (~4,8 GB libres). WAC, vídeos, FableCut productivo, DNS y servicios intactos.

## Siguiente verificación indispensable

1. Ejecutar el proyecto **de HyperFrames** en navegador de QA autorizado que no herede el límite de consola, y comprobar `hf-seek` en los frames F0/F7/F8/F12/F19/F26/F51/F59/F64/F69/F81/F91/F104/F112/F119/F150 sin deducir calidad por pasar `lint`.
2. Crear exportación **nativa de HyperFrames** 1080×1920/30 y registrar SHA del archivo, fuente exacta, `ffprobe`, capturas y comparación visual frente al SVG para blur, clip, tipografía, grid y zoom. Si falta canal alfa o máscara para overlays sobre Carlos, bloquear ese uso y usar exclusivamente pantalla completa o desarrollar una vía verificada.
3. Preparar puente editorial hacia **FableCut** solo después de verificar el resultado y el original/voz reales. Mantener archivo fuente vinculado a clip, track role, ventana temporal, IDs de palabras y revisión/fingerprint.
4. Completar un **guion técnico A/V por capas** 1:1 con la narración auténtica, QA completa en dos pasadas y aprobación creativa diferenciada de la publicación. No importar como `sues-master-story/v1` hasta que exista un mapping autorizado en el registro nativo.

**Políticas vigentes:** SUES AI Film Director 1.7.1, producción 10/11/2026 y guion A/V por capas. No afirmar que un manifiesto `SOURCE_ONLY_NO_RENDER` permita publicar o que la editabilidad interna de HyperFrames exista en los clips de media de FableCut.
