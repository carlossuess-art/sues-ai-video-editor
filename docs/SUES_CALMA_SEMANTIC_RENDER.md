# CALMA · motions y zoom semántico · 17/10/2026

Fase 5/10 al 80 %, global 48 %. Estimación técnica; estética provisional,
sin aceptación V1/E2E. El renderer se ejecuta en el worker Work, no exige el PC
de Carlos ni un servicio de render de pago. Coste externo nuevo: 0 USD.

## Entregado

Preview real 37,30 s, 1080×1920/30 fps, H.264 + AAC, 16 captions y outro 3 s.
Dos acercamientos anclados a ojos (primero 1,08× relativo, segundo 1,06×),
seleccionados por el giro «un mundo tras tus ojos» y «detenerte y sentir».
Base 1,40×; máximo combinado 1,512×, dentro del cap 1,60×.
La cita literal «detenerte y sentir.» aparece 14,1–17 s en una caja segura.
Las decisiones de esta demostración son editables y elegidas manualmente desde
el transcript existente: NO hay un modelo proveedor generando planes aún.

Vídeo: https://drive.google.com/file/d/171YWJoZgqAA9LfJblGoA5UiR2wK1TnHH/view?usp=drivesdk
Comparación con base: https://drive.google.com/file/d/1NBVQyOz2srKrwFpYCADt9w0OZuKedbrI/view?usp=drivesdk
Galería sintética de motions: https://drive.google.com/file/d/1XjqG7eSkPjpBjcpOFhAT55jL9Y_PH6ft/view?usp=drivesdk
Entrega: libfile_3c54d4b9d7a081918c3af48031b20268.

## Implementación

`src/semantic-render.js` conecta Director Plan existente con Template/BrandKit,
catálogo y visión guardada. Exige `timeSpace:edit-timeline`, reason/rule, tipos
implementados, semántica de trigger válida para el motion, bindings y duración.
Se rechazan acciones no implementadas; no se ignoran silenciosamente.

Zoom: rampas coseno suaves, plateau y vuelta a 1, sin cambios fuera del intervalo.
No se generan eventos periódicos. Rampas ≥0,6 s, mínimo 1 s entre zooms,
bookends protegidos y rechazo si un B-roll cubre el evento. Se comprueba el zoom
combinado, los ojos dentro del crop y que la cara proyectada no salga del frame.

Ojos reconstruidos de `stabilizeFaceTrack(buildFaceTrack(fixture.frames))`, con
los mismos datos ya guardados. Sin ejecutar MediaPipe ni ASR. Anclas por span de
edición, con extremos fuente independientes a ambos lados de cada corte; así
no se interpola a través de la parte eliminada. Se corrigió ese borde durante
la implementación y tiene regresión explícita.

Render adicional por FFmpeg `perspective`, `sense=source`, `eval=frame`, cubic,
con tiempo de salida `on/30` después de concatenar el vídeo CFR. El rectángulo
se contrae alrededor de la posición real de los ojos dentro del encuadre base.
Los captions/motions se aplican después del zoom, con tamaño estable.

Tres renderers de motions ASS, compartiendo fuentes/colores:

- `QUOTE_CARD_01`: panel y cita, entrada/salida suave; nuevo asset registrado.
- `NUMBER_BADGE_GOLD_01`: número y etiqueta con tiempos de capas escalados.
- `DIVIDER_LINE_01`: línea de marca con revelado horizontal.

Alias únicos exportados por foundation-integration; quote-card ya queda resuelto.
CALMA permite divisor además de sus aliases anteriores. Catálogo: ocho assets,
pero SOLO estos tres tienen renderer en este bloque. Los demás no se dan por
implementados. No se añade SFX de otro asset por omisión.

Colocación elige entre [120,900]×[200,350] y [120,900]×[1010,1160], evitando
la cara durante el intervalo y otros motions simultáneos. Ambas cajas reservan
captions/outro y evitan zonas de UI. Si no cabe, falla antes de renderizar.
Se validan cara vs captions y outro activos en el replay del plan.

`prepare_local_preview.mjs` admite directorPath, visionPath y catalogPath.
Los inputs anteriores sin director mantienen su comportamiento.
Ejemplos preflight/dry-run regenerados por el nuevo registro de quote/divisor;
los tests de aliases se actualizaron a los nuevos IDs, sin retirar controles.

## Pruebas y alcance

Suite completa **101/101**, sintaxis OK. Siete regresiones de semántica y una
más de cara/captions (ver tests para el inventario exacto), además de la suite
previa; el total es la referencia, no se suman pruebas de otro bloque.

Smoke real reproducible con FFmpeg: imagen sintética, detecciones sintéticas,
zoom 8 % y los tres motions. En imagen de control 270×480, el marcador de ojos
permanece prácticamente inmóvil (<1 px); un marcador periférico se desplaza
según el zoom alrededor de ese punto y vuelve al lugar inicial después del evento.
Antes: ojo (134,44;191,44), marcador (53,5;383,5).
En plateau: ojo (134,5;191,5), marcador (47,41;398,89);
esperado (47,02;398,86), error <1,5 px. Después, marcador (53,5;383,5).
No es detección real ni prueba de tracking de producción.

Revisión de imágenes del preview real: 4/7/10/15,3/18/35 s, comparadas con base.
El archivo final coincide byte a byte con el archivo usado para ese QA.
Replay geométrico de 1120 instantes planificados, usando bbox existente más
cercana (no nuevas detecciones): cap, límites de cara y colocación satisfechos.
Captions/outro activos también se comprobaron durante replay. Los contadores
exactos están en `examples/preview/calma-semantic.render-audit.json`.
Esto no acredita precisión facial a 30 fps: la detección fuente sigue ~2 fps.
Decodificación completa del MP4 OK; duración 37,30 vs plan 37,31 s.
Audio AAC payload SHA256 idéntico a V2:
`3acec107e4532db9a584626b04d5fe6fef311edcb367e4e3eaa41e7407784f15`.
Originales preservados. No se afirma escucha completa ni aceptación estética.

## Reproducir

Materializar original/transcript/fuentes del bloque anterior según
`docs/SUES_CALMA_LOCAL_PREVIEW.md`; usar un nombre de salida nuevo.

```sh
npm run reframe -- examples/vision/poc001.mediapipe.json runtime/calma/camera.json
npm run preview:prepare -- examples/preview/calma-semantic.input.json runtime/calma/semantic-preview
```

Copiar las fuentes y OFL a `runtime/calma/semantic-preview/fonts`, después:

```sh
npm run preview:render -- --source runtime/poc/original.mp4 --bundle runtime/calma/semantic-preview --out runtime/calma/semantic-new.mp4
npm run semantic:smoke -- runtime/semantic-smoke-new runtime/calma/preview/fonts
npm test
npm run check
```

Inputs: `examples/director/calma-render-real.json` y
`examples/preview/calma-semantic.input.json`. Evidencias compactas:
`calma-semantic.render-audit.json` y `calma-semantic.synthetic-result.json`.

## Continuación

Falta conectar selección automática del Director al transcript, ampliar motions
que necesiten medios/bindings, música/SFX, material propio de naturaleza/retiros,
UI/backend y E2E real. En esta toma no se fuerza un número ni un divisor sin
motivo narrativo; los tres renderers están demostrados en fixture separado.
Se conserva el corte técnico [12,13) del POC, no un corte semántico final.
Nuevas inferencias MediaPipe siguen pendientes por el tráfico SDK documentado;
no se reejecutan ni se evita el bloqueo. No nuevas dependencias ni APIs de pago.
Bloqueos del bloque: ninguno. Necesito de Carlos: nada para continuar código.

Auditoría del bloque: https://drive.google.com/file/d/1d4BtmOaHzx_l1J1XvMR_poNamNO9ziBb/view?usp=drivesdk
