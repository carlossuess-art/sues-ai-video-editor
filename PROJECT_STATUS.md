# Estado técnico vigente · 16/10/2026

FASE 5/10 · BRAND KIT + TEMPLATE ENGINE
Progreso fase: 70 % (estimación técnica; plantilla/estética provisionales).
Progreso global: 47 % = F1–F4 (40 %) + 70 % del peso de F5 (7 %).
Rama oficial: feat/phase-4-vision-camera.
Base de este bloque: fb95338d654290be88456ed2a6e2768673d3658f.
Último hito: primer preview CALMA local integrado, cámara + cortes + captions +
outro compartido; compositor B-roll con bindings locales probado con fixture real.
Suite: 93/93 tests, npm run check, py_compile y smoke FFmpeg con colores/tonos OK.
Coste externo nuevo: 0 USD. Sin ASR/MediaPipe/Shotstack/generación/Lovable/compras.
Necesito de Carlos: nada para continuar código; revisión estética pendiente.

## Resultado verificable

- Preview real: 37,30 s, H.264 1080×1920/30fps, AAC; plan 37,31 s (-0,01 s).
- 16 bloques de captions del transcript existente, originalVoice, cierre de 3 s.
- Cámara composition 1,40× fija, 73 keyframes existentes; sin nuevas inferencias.
- Open Sans estática 400/700; captions 56 px y outro 44 px. Paleta del kit.
- SHA256 original antes/después idéntico, guardado en render-audit.
- Decodificación íntegra; 8 fotogramas QA revisados, incluidos ambos lados del corte.
- 55 checks de bbox facial muestreada contra overlays activos, 0 colisiones.
- Ancho caption máximo 661,18 px/caja 780; outro 523,44 px. Layout evita UI derecha
  desde x=930 y franja inferior desde y=1540; caption/outro no se solapan.
- No escucha completa ni aceptación estética humana. No se afirma V1 ni E2E app.

## Código y reproducción

- src/time-map.js: fuente↔edición, repeats/reorder y cámara por spans sin puente.
- src/local-preview.js: plan, ASS, kit/layout y filtros FFmpeg; crop con tiempo
  fuente ANTES de reset PTS; fail-closed zoom efectivo >1,60 o tamaño variable.
- Cortes intermedios de duración entera en frames 30fps para no acumular deriva;
  último fragmento con tolerancia máxima de un frame, comprobada en salida.
- prepare_local_preview.mjs + render_local_preview.py: prepare/probe/hash/render/
  decode/audit. No overwrite. Fuente y recursos locales, audio principal conservado.
- B-roll: binding explícito por sourceRef, duración de stream verificada, 9:16 cover,
  audio del recurso excluido, repeatlast=0 y retorno al presentador al acabar slot.
- Material marcado style-reference o brollEligible:false no puede usarse como B-roll.
- Muestra de Carlos usa keep-presenter: todavía no hay B-roll propio seleccionado.
- Smoke sintético reproduce azul→rojo→azul y conserva 440 Hz sin el recurso 1700 Hz;
  relación recurso/voz 3,16e-7. No es validación de calidad de imágenes reales.
- npm run preview:prepare -- examples/preview/calma-real.input.json runtime/calma/preview
- npm run preview:render -- --source runtime/poc/original.mp4 --bundle runtime/calma/preview --out runtime/calma/local-new.mp4
- npm run preview:smoke -- runtime/smoke-new runtime/calma/preview/fonts
- npm run references:scan -- --out runtime/refs /ruta/a/los/seis.mp4
- npm test; npm run check. Ver docs/SUES_CALMA_LOCAL_PREVIEW.md para materializar
  fuente/transcript/fuentes tipográficas y ejecutar reframe primero.
- Dependencias del lock sin cambios. Restauración local de cachés con integridad;
  fast-uri v3.1.8 de tag oficial por conector. node_modules no se versiona.

## Referencias CALMA

Siete archivos, seis payloads únicos; originales en Drive y no en GitHub.
Inventario: examples/references/calma-20261016.inventory.json.
Temporal: examples/references/calma-20261016.temporal.json. Se recorrieron todos
los frames y se revisaron secuencias 1fps de toda la duración; no escucha/ASR.
Candidatos scene>0,12: 18/2/6/2/1/1; NO son cortes confirmados ni tasa de montaje.
Primera referencia: cinco apoyos aproximados, 14,87 s/25,68 % de cobertura;
las fronteras dependen de muestras/candidatos y no son anotación frame a frame.
Se mantiene provisional CALMA 2,5–6 s, cobertura ≤40 %, gap ≥3 s, voz propia,
selección semántica. No se importa identidad, personas o música de esos Reels.

## IDs y entregables

Repo: https://github.com/carlossuess-art/sues-ai-video-editor (1422196475).
Maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
Fuente original: 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82.
Transcript: 11cNi2n-Qkim0_pKMkz2WMle3xDWH1nEa.
Preview: https://drive.google.com/file/d/1BNpxaHnUUluHQKqzVOXKD96jzElrluLV/view?usp=drivesdk
QA: https://drive.google.com/file/d/1o4fYQhtcyA3xXX1mYmicJzgagMjIF-oH/view?usp=drivesdk
Auditoría: https://drive.google.com/file/d/1BaYgRv-yUSqjXPmUjyQZM_vLoVkh6any/view?usp=drivesdk
Fuentes/licencia: https://drive.google.com/file/d/1el7DYji13Pj9aBOPIS5oz4KUQ8a8blj-/view?usp=drivesdk
Análisis referencias: https://drive.google.com/file/d/19WDKXoRjZCOzAv2OXfoA59RQKgomoEDy/view?usp=drivesdk
Vídeo en chat: libfile_c8264a14cc7c8191b3b9f461dc8488d3.
Referencia/asignaciones Drive originales: examples/references/calma-20261016.inventory.json.
Informe principal: docs/SUES_CALMA_LOCAL_PREVIEW.md.
Auditorías compactas: examples/preview/calma-real.render-audit.json y calma-broll.synthetic-result.json.

## Límites que siguen vigentes

Fase 4 cerrada para un POC, una cara, muestra ~2fps. composition 1,40×/tope1,45;
conservative 1,12×/tope1,20; eye-line .40, headroom .06; zoom fijo no semántico.
Nuevas inferencias MediaPipe 1.1.1 siguen pendientes por tráfico inesperado a
play.googleapis.com rechazado por auto-review. No reejecutado ni evadido; fixture
existente permite el trabajo offline. ASR histórico 0,0039 USD, no repetido.

Corte [12,13) heredado del POC: omite tres palabras, no es edición semántica final.
No soundtrack/SFX, relight, logo final, zoom semántico ni renderer de motions.
Color natural se aplica como identidad de fuente. Ramas/contratos F6–F10 siguen
integrados como foundations, sin completar sus fases. quote-card sigue sin resolver.
No UI grande ni backend persistente, seguridad de producción o E2E aprobado.

## Siguiente acción exacta

Leer maestro + este estado + docs/SUES_CALMA_LOCAL_PREVIEW.md. Continuar bindings
/render de motions y zooms semánticos con safe zones; verificar después recursos
propios de naturaleza/retiros con el compositor ya probado. Afinar estética antes
de cerrar F5. No pedir más referencias ni repetir ASR/MediaPipe por defecto.
Bloqueos de este bloque: ninguno. Sin nuevas cuotas ni servicios contratados.

Histórico anterior íntegro: docs/archive/PROJECT_STATUS_BEFORE_LOCAL_CALMA_20261016.md.
Más métricas de cámara: docs/CAMERA_PROFILES_VALIDATION.md.
