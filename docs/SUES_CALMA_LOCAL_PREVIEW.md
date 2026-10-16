# SUES CALMA · preview integrado local · 16/10/2026

## Resultado

FASE 5/10 al **70 %**, global **47 %** (40 % F1–F4 + 7 puntos de F5).
Estimación técnica: la plantilla sigue provisional y no hay aceptación estética/E2E.
El nuevo renderer enlaza cortes, cámara en tiempo fuente, captions y cierre de
BrandKit; compone inserciones verificadas en local y conserva el audio principal.
No se usan Shotstack, ASR, MediaPipe, IA generativa, Lovable ni servicios de pago.
Coste externo nuevo: 0 USD.

Preview real de Carlos: **37,30 s**, H.264 1080×1920/30 fps, AAC, 18 MB aproximados.
Plan: 37,31 s; diferencia -0,01 s, menor que un frame. Decodificación completa OK.
73 keyframes de cámara existentes, perfil composition 1,40×; ningún detector nuevo.
16 bloques de captions de la transcripción ya aceptada; marcas inciertas intactas.
Outro de 3 s con texto y colores del kit compartido; ningún logo inventado.
Open Sans estática 400/700, captions 56 px y outro 44 px a resolución 1080×1920.
FFmpeg confirmó selección de OpenSansRoman-Bold y OpenSansRoman-Regular.

Original SHA256 (antes/después idéntico):
`50c56298e59f783b2dfe2979c80ddc4e83a84ab4eb9048aa56ff8423be67ba6a`.
Los originales se leen, nunca se sobrescriben; el renderer rechaza salidas existentes.

## Código

- `src/time-map.js`: segmentos reordenados/repetidos, intervalos half-open,
  mapeo edición→fuente y spans de cámara separados por corte. No interpolar en
  tiempo editado sobre el salto entre dos fragmentos distintos.
- `src/local-preview.js`: compilación del kit/plantilla, captions, layouts,
  B-roll, ASS y filtergraph FFmpeg. Crop calculado con tiempo fuente ANTES de
  resetear PTS. Origen de cada fragmento preservado al hacer CFR a 30 fps.
- Cortes no finales deben tener duración de un número entero de frames a 30 fps;
  se rechazan fracciones para evitar deriva acumulada. Último fragmento: tolerancia
  de un frame, verificada contra el archivo resultante.
- Cámara de tamaño fijo y zoom efectivo máximo 1,60×. Zoom variable/semántico
  todavía necesita otro renderer; falla explícitamente si se cambia tamaño.
- B-roll con binding local explícito: verificar vídeo, duración real y SHA256;
  trim, cover 9:16, overlay en intervalo half-open, retorno al presentador y
  `repeatlast=0`. Captions se componen después. Audio del recurso jamás se mapea.
- Los vídeos con `role:style-reference` o `brollEligible:false` se rechazan como
  recursos de montaje. La muestra real conserva fallback presentador: no hay
  B-roll propio seleccionado, y no se insertan los Reels ajenos de referencia.
- `scripts/templates/prepare_local_preview.mjs`: prepara bundle reproducible.
- `scripts/templates/render_local_preview.py`: FFmpeg, probes, hashes antes/después,
  formato/duración, decodificación íntegra y auditoría; Python estándar + fontconfig.
  Se soporta actualmente el kit Open Sans y audio original, sin música/SFX.
- `scripts/templates/smoke_local_preview.mjs`: regresión real con colores y tonos
  sintéticos, independiente de inferencias/modelos/credenciales.

## Validación

Suite completa **93/93**, `npm run check` y py_compile aprobados. Dry-run anterior
comparado por deepEqual con su ejemplo: sin cambios. Npm/lock/dependencias no
cambian salvo nuevos comandos en package.json. Ajv/dependencias recuperadas de
cachés locales verificando integridad; fast-uri 3.1.8 recuperado del tag oficial
`fastify/fast-uri@v3.1.8` por conector. No se modifica el lock ni se versiona node_modules.

Nuevas regresiones: bordes de corte, repetición/reordenación, cámara sin puente
sobre partes eliminadas, captions mapeados, marcas puntuales inciertas, límites
absolutos de zoom, wrapping/inyección ASS, safe zones y binds obligatorios.

Smoke real: base azul con tono 440 Hz; recurso rojo con tono 1700 Hz insertado
entre 3 y 6 s. Píxeles: azul 2,5 s; rojo 4,5 s; azul 6,5 s. Audio durante la
inserción conserva 440 Hz: relación recurso/voz ≈3,16×10^-7 (<0,01).
Resultado guardado en `examples/preview/calma-broll.synthetic-result.json`.
Esto valida el compositor con medios sintéticos; no acredita calidad de B-roll real.

QA visual: 2,5 / 7 / 11,9 / 12,1 / 19 / 30 / 35 / 37 s.
Textos dentro del layout: ancho máximo 661,18 px en caja de 780; outro 523,44 px.
55 comprobaciones de bbox facial existente contra overlays activos: 0 colisiones.
Revisión de bbox es muestreada, sin inferencia nueva; no prueba cada frame.
Caja caption [120,900]×[1190,1400]; outro [120,900]×[1430,1530].
Separadas entre sí, fuera de columna derecha x≥930 y franja inferior y≥1540.
No se ha escuchado el vídeo completo ni se afirma aceptación humana estética.

## Referencias: avance temporal

Las seis referencias únicas se recorrieron completas con FFmpeg scene>0,12 a
180×320. Además se revisaron secuencias de imágenes a 1 fps de toda su duración.
Eventos candidatos (NO cortes confirmados): 18 / 2 / 6 / 2 / 1 / 1. Gráficos,
fundidos y cambios de cámara pueden dispararlos; zooms suaves o cortes pequeños
pueden no dispararlos. No convertir estas cifras en cortes/minuto reales.

En la primera referencia se clasifican cinco inserciones aproximadas (bebé,
interacciones/personas y paisaje con cita), ≈14,87 s / 57,89 s = **25,68 %**.
Límites estimados mediante muestras y candidatos, no anotación manual frame a frame.
Los primeros cuatro apoyos duran ~1,17–2,23 s y el paisaje/cita ~7,90 s.
No reemplazar automáticamente el rango provisional de CALMA 2,5–6 s por estos
valores: se conserva su dirección más pausada. Se toma el recurso semántico,
la composición cálida, los captions blancos con acentos y un cierre consistente.
Las otras referencias aportan listas, comparativas y planos sostenidos, como
variantes opcionales. Música/SFX y alineación semántica completa siguen sin medir.
Detalle: `examples/references/calma-20261016.temporal.json`.
`npm run references:scan -- --out runtime/refs /ruta/a/los/seis.mp4` reproduce candidatos.

## Reproducir

Desde raíz del repo, recuperar primero maestro + PROJECT_STATUS; instalar
las dependencias del lock por el método autorizado del entorno.
Materializar fuente y transcript ya existentes en `runtime/poc`:

- original: Drive `1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82` → `runtime/poc/original.mp4`;
- transcript: `11cNi2n-Qkim0_pKMkz2WMle3xDWH1nEa` → `runtime/poc/transcript.json`;
- fuentes/licencia: ZIP enlazado abajo → `runtime/calma/preview/fonts/`.

```sh
npm run reframe -- examples/vision/poc001.mediapipe.json runtime/calma/camera.json
npm run preview:prepare -- examples/preview/calma-real.input.json runtime/calma/preview
npm run preview:render -- --source runtime/poc/original.mp4 --bundle runtime/calma/preview --out runtime/calma/SUES_CALMA_LOCAL.mp4
npm run preview:smoke -- runtime/smoke-new runtime/calma/preview/fonts
npm test
npm run check
```

El smoke exige un directorio nuevo y no reutiliza salidas existentes.
El binding real futuro se introduce mediante `assets` + `mediaBindings` por sourceRef.
Los paths de bindings se resuelven en el entorno de render y no son URLs remotas.

## Artefactos

- Preview: https://drive.google.com/file/d/1BNpxaHnUUluHQKqzVOXKD96jzElrluLV/view?usp=drivesdk
- QA: https://drive.google.com/file/d/1o4fYQhtcyA3xXX1mYmicJzgagMjIF-oH/view?usp=drivesdk
- Fuentes Open Sans/licencia: https://drive.google.com/file/d/1el7DYji13Pj9aBOPIS5oz4KUQ8a8blj-/view?usp=drivesdk
- Análisis/contactos completos: https://drive.google.com/file/d/19WDKXoRjZCOzAv2OXfoA59RQKgomoEDy/view?usp=drivesdk
- Entrega de vídeo: Library `libfile_c8264a14cc7c8191b3b9f461dc8488d3`.

Fuente tipográfica oficial: `google/fonts/ofl/opensans`, blob
`9db85693b027f3b05f6d77471d215f20707127c1`, SHA256 variable
`36643644f318a812aab2d2ed3bb98f8cf0872527f835fe9398d95fe6b9adb878`.
Instancias estáticas con fontTools wght=400/700 y wdth=100; OFL incluida.
No fuentes ni medios pesados en Git.

## Pendiente y siguiente

No hay cierre V1 ni render cloud de esta plantilla. El corte [12,13) se hereda
como prueba técnica del POC y omite tres palabras; el Director deberá decidir
cortes semánticos antes de un montaje final. Color natural = identidad de fuente,
sin relight/grade artificial. No música, SFX, logo definitivo, zooms semánticos,
renderer de motions, UI/backend ni E2E de app.

Siguiente: integrar bindings de motions y zoom semántico con safe zones; usar
el compositor ya validado cuando se verifique B-roll propio de naturaleza/retiros.
Afinar estética con la revisión audiovisual del preview y referencias, sin pedir
más archivos de referencia ahora ni repetir análisis ya pagado.
Bloqueos del bloque: ninguno. Necesito de Carlos: nada para seguir código;
aceptación estética permanece pendiente. Fases 6–10 no se declaran completadas.
