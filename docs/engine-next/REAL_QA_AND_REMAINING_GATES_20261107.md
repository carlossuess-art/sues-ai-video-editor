# SUES AI VIDEO EDITOR · Engine Next — pruebas reales 07/11/2026

**Estado:** integración privada parcial real. Sin despliegue en producción, sin aprobación creativa, sin QA 1080×1920 ni preview/export parity.

## Servicio y proyecto duraderos
- FableCut 1.18.0 corre como `sues-fablecut-next.service` con usuario `suesnle`, en `/srv/sues-fablecut-next`, escuchando solamente `127.0.0.1:7780`. Confirmado HTTP 200.
- Proyecto Reel 158404 con **5 pistas, 6 clips, 6 medios**, revisión 31 al registrar este checkpoint. Original de cámara y voz conservados. Ninguna composición final aprobada.
- HyperFrames 0.9.20 y Three.js 0.180 en `/opt/sues-video-setup/hyperframes-engine-next`, FFmpeg 6.1.1, telemetría de HyperFrames desactivada. Render local 3D genuino y alfa ProRes→WebM VP9 comprobado.
- La VPS mantiene unos **19 GB libres** y 3,8 GiB RAM física sin swap. Renderizar en modo memoria baja y un trabajador por ahora.

## Resultados visuales desde el frontend REAL de FableCut
- Navegador Chrome/Puppeteer en loopback `127.0.0.1:7780`; el frontend nativo abre el proyecto real, muestra el programa y permite `setTime(4.5)`. Sin errores JS. Capturas privadas de FableCut en `/srv/sues-fablecut-next/data/qa/20261107/`.
- **3D HyperFrames:** objeto 3D dorado (prueba geométrica NO acabado cinematográfico), 29 fotogramas/1,2 s. MOV ProRes `yuva444p12le` con transparencia; derivado WebM VP9 `alpha_mode=1`, canal alfa decodificado con libvpx-vp9. Importado como medio editable con fuente HTML/Three.js conservada. Prueba nativa frame 4,5 s con/sin capa: diferencia media de luma 2,31582, máxima 114. Posición de revisión `x=390,y=-370` separa rostro. Clip devuelto a `disabled=true`.
- **Mano delante de Carlos:** el MOV ProRes original `sues-158404-hand-alpha.mov` no mostraba cambios entre captura con/sin capa (diferencia cero). Se conservó original y se convirtió derivado de 29 fotogramas a WebM VP9 alfa de 256×256. Se importó como nuevo medio `m_sues_158404_hand_alpha_webm_browser`, enlazado al mismo clip `sues_alpha_hand_review_only`, sin borrar medios previos. Ahora se ve en el visor nativo: diferencia media 1,12786, máxima 146 con posición `x=340,y=700`, sin ocluir el rostro en el fotograma inspeccionado. Permaneció desactivada al terminar. Capturas y procedencia conservadas en QA privado.
- El material en estado `disabled` permanece disponible para revisión; **las capturas aisladas NO certifican oclusiones en toda la duración ni fidelidad preview/export**.

## Integración autenticada SUES
- `src/engine-next/fablecut-client.js` integra REST FableCut privado con control de revisión 409, protección de IDs/medios y prohibición de eliminación silenciosa de clips/pistas/medios durante cambios de propiedades.
- `src/editor-server.js` incorpora rutas solo con sesión SUES válida, protección de origen y cabecera CSRF ya existentes: GET `/api/engine-next/project`, GET `/api/engine-next/media/:id` con Range 206, POST `/api/engine-next/title-size`, POST `/api/engine-next/clip-transform`. Las rutas siguen condicionadas a `SUES_ENGINE_NEXT_FABLECUT_URL`; no se activaron en producción.
- `web/engine-next.html/js/css`: pantalla SUES de prueba con biblioteca, 5 pistas/6 clips del mismo proyecto, visor **del original no compuesto** (advertencia visible), inspector para tamaño de texto y transformaciones x/y/escala. El frontend completo nativo FableCut aún no está incrustado o publicado detrás de autenticación SUES.
- Browser E2E real desde un SUES temporal con sesión: carga pistas y media protegida, cambia tamaño 84→81, mueve temporalmente 3D y guarda en FableCut; se restauraron ambas propiedades originales tras QA. Ningún error JS.
- `src/engine-next/progressive-captions.js` compila solo palabras humanas verificadas con mapping, geometría y fps 30 corroborados. Pruebas sintéticas preservan negaciones, progresión palabra-a-palabra y rechazo de cortes/títulos inseguros. El ASR real del 158404 tiene 168 palabras, 50 advertencias en el borrador, no verificado: **no se importó ni habilitó ningún subtítulo real**.

## Gates aún pendientes
1. Frontend FableCut multipista completo integrado tras autenticación SUES sin exposición del API de loopback.
2. Visor FableCut compuesto y exportación 1080×1920 alineados fotograma a fotograma, más audio.
3. Matte temporal continuo verificado para B-roll niño/grupo detrás de Carlos, transiciones IN/OUT reales.
4. QA de la mano y del 3D en toda la duración, no un fotograma; objetos cinematográficos narrativos más elaborados.
5. Transcripción 158404 revisada, capitulado bajo barbilla, límites de dos líneas y títulos semánticos sincronizados con voz.
6. Migración sin pérdida de las 49 operaciones aprobables, control de licencias, dos pasadas de QA audiovisual y aceptación estética de Carlos.

**Último resultado automático dirigido:** 24/24 pruebas pasan en `node --test tests/editor-server.test.js tests/engine-next/*.test.js`. No equivale a suite completa ni a la aprobación de usuario.

## Ampliación: fotograma compuesto autenticado y revisión estable (07/11/2026)

- Nuevo adaptador `src/engine-next/program-frame.js`: usa un único Chromium de corta duración para obtener un PNG del **canvas Program real de FableCut** en el instante solicitado; se rechazan tiempos/revisiones inválidos, fotogramas aún negros/no decodificados, ediciones simultáneas y discrepancias de contenido. Se permite exclusivamente un incremento de revisión producido por normalización de propiedades por defecto si la semántica de pistas, medios, clips, posiciones, visibilidad y texto continúa idéntica; cachea usando la revisión FINAL, no la anterior.
- Ruta privada opt-in `GET /api/engine-next/program-frame?time=4.5&revision=...` bajo sesión SUES y validación de origen. Requiere configurar explícitamente `SUES_ENGINE_NEXT_FABLECUT_URL`, `SUES_ENGINE_NEXT_PUPPETEER_CORE` y `SUES_ENGINE_NEXT_CHROME_PATH`; no se ha activado en producción.
- El Studio SUES dispone de un botón **«Ver fotograma compuesto»**, con retorno al visor del bruto. Se rotula claramente como fotograma de revisión, nunca exportación o vídeo final. La nueva capa de código se conecta al visor nativo sin simular la composición.
- **Prueba completa HTTP autenticada en VPS:** código 200, `image/png`, 69.283 bytes, cabecera `X-Sues-Frame-Revision: 37`, `X-Sues-Cinematic-QA: not-approved`. PNG privado en `/srv/sues-fablecut-next/data/qa/20261107/native-frame-sues-auth-http.png`. La doble captura de la misma revisión devolvió cache hit. Pruebas automatizadas del módulo cubren cache, bloqueo de concurrencia, revisión normalizada y rechazo de mutaciones reales mientras se obtiene el frame.
- **29/29 tests dirigidos superados** tras sincronizar GitHub a HEAD `1c1d7c8`. Editor público y FableCut devuelven HTTP 200, 19 GB libres, RAM 3,8 GiB sin swap. La seguridad de los servicios principales no ha sido alterada.
- Quedan pendientes: streaming compositor con reproducción continua, frontend multipista completo de FableCut dentro de SUES y paridad comprobada con exportación 1080×1920; máscaras dinámicas del niño/grupo y QA de todos los planos, derechos y voz/subtítulos reales.
