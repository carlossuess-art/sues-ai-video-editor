# Estado técnico · 16/10/2026

FASE 5/10 · BRAND KIT + TEMPLATE ENGINE
Progreso fase: 50 % (plantilla provisional ejecutable en seco; estética sin cerrar).
Progreso global: 45 % = Fases 1–4 (40 %) + 50 % del peso de Fase 5 (5 %).
Rama oficial: feat/phase-4-vision-camera.
Último hito: SUES_CALMA provisional cinematográfica (naturaleza/exteriores/retiros),
compilación con BrandKit compartido y selector determinista de B-roll con fallback.
Suite final: 80/80 tests; npm run check y CLI template:calma ejecutados.
Coste externo nuevo: 0 USD. Ningún servicio de pago ejecutado.
Trazabilidad completa: docs/FOUNDATIONS_INTEGRATION_RESULT.md.
Código/auditoría: examples/foundation-preflight.sample.json (renderReady:false).

## Decisiones y validación Fase 4

- Base recomendada: composition, zoom fijo 1,40×, tope configurado 1,45×.
- Alternativa conservative: 1,12× fijo, tope 1,20×, más contexto.
- Línea de ojos objetivo 0,40; headroom mínimo 0,06 del crop.
- La composición inicial fija es distinta de los futuros zooms semánticos del Director.
- 73 keyframes de 74 muestras existentes, sin repetir MediaPipe/ASR.
- Composición: mediana ojos 0,4114 frente a 0,5266 del conservador; error medio
  0,0149 frente a 0,1245. Cara completa 73/73 y crops siempre dentro de fuente.
- Crop composición: velocidad máx 27,82 px/s; paso máx 23,19 px; zoom rate 0.
  Conservador en este POC queda fijado a bordes, velocidad 0.
- Prueba interpolada a 30 fps con bounds y endpoint hold. No zoom periódico.
- Preview local: 864×552, 24fps, 38,274 s, audio original. Sin APIs de render.
- Fotogramas 2/10/20/35 s inspeccionados: composición reduce techo vacío y conserva
  cabeza/torso. Se entrega vídeo para percepción de Carlos; no se afirma escucha
  o visionado humano completo. Cierre técnico de cámara para este POC, no gate V1.
- Test inicial fallaba al confundir paso por muestra con velocidad usando PTS
  irregulares; corregido para verificar el contrato 4 % diagonal/s.
- Baseline legacy reproducido: 27,4636 px/s, zoom 1,105247–1,145857, rate 0,015450/s.
- Suite completa 50/50; npm run check OK. No npm ci: dependencias existentes válidas.

## Código y comandos

- src/vision.js: contrato detector, selección, ancla y safe zones.
- src/reframe.js: filtro temporal, CAMERA_PROFILES, buildCameraProfilePlan,
  sampleReframeAt; legado buildStableReframePlan conservado.
- scripts/vision/build_reframe.mjs: default composition; --profile conservative/legacy.
- scripts/vision/preview_reframe.py: comparación local sin importar MediaPipe.
- JSON real: examples/vision/poc001.mediapipe.json, 74 muestras/73 cara, 20.576 bytes.
- Métricas: examples/vision/poc001.camera-profiles.metrics.json.
- Informe y comandos exactos: docs/CAMERA_PROFILES_VALIDATION.md.
- npm run reframe -- examples/vision/poc001.mediapipe.json runtime/vision/poc001.reframe.json
- npm run reframe -- examples/vision/poc001.mediapipe.json runtime/vision/conservative.json --profile conservative
- npm test; npm run check.
- Preview: venv runtime/preview-venv, opencv-python-headless==5.0.0.93 + FFmpeg.
  No modelo facial ni clave necesarios para reproducir desde fixture.

## Inventario y costes

- Repo privado: https://github.com/carlossuess-art/sues-ai-video-editor (1422196475).
- Maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
- Pruebas Drive: 1efHjGfJ3b5vDYTkdMM_dUjQOumXGgqYr.
- Original intacto: 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82.
- Comparativa: https://drive.google.com/file/d/1CtP7UUYC2BoMg96MtfCQXTrYX9wxlHz1/view?usp=drivesdk
- Fotogramas: https://drive.google.com/file/d/1FdeYFyD2pGR5Y3OBxw7PToKaGjMSBYF3/view?usp=drivesdk
- Auditoría: https://drive.google.com/file/d/1tiazA2Qkl8vlpPCJ9WVkhMCJP7ioYb6P/view?usp=drivesdk
- Entrega en chat: libfile_c66d6825453c8191b0e41a4b9f5f26d5.
- Coste nuevo bloque: 0 USD. ASR histórico 0,0039 USD; no repetido.
- Sin Shotstack, generación, CapCut, Lovable, compras ni nuevos servicios.

## Límites y continuación

MediaPipe 1.1.1 intentó tráfico a play.googleapis.com bloqueado por auto-review:
no se ha reejecutado. Fixture existente permite completar este bloque offline.
Una cara, muestra aproximada 2 fps; no es seguimiento de producción validado en más tomas.
El plan usa tiempo fuente: mapear al timeline cortado antes de exportar E2E.
Safe zones disponibles; resolución de conflictos de overlays vendrá con plantillas/motions.
Foundations ya integradas. Preflight conecta aliases de motion y distingue zoom
semántico relativo del encuadre fijo; rechaza combinado >1,60× y tiempos inválidos.
quote-card sin resolver explícitamente. No hay renderer de motions ni E2E aprobado.
SUES_CALMA provisional ya implementada por autorización posterior de Carlos:
cinematográfica de naturaleza/exteriores/retiros, estética a afinar después.
Comando: npm run template:calma -- examples/broll/calma-dry-run.input.json runtime/templates/sues-calma.plan.json
Contratos y resultado: docs/SUES_CALMA_PROVISIONAL.md; examples/broll/calma-dry-run.output.json.
BrandKit compartido resuelve fuentes, colores, captions y outro; logo pendiente de definir.
No hay assets adicionales reales seleccionados ni render visual de esta plantilla.
Siguiente: mapa de tiempos edición/fuente y aplicación local de decisiones con
fallback de presentador, sin repetir análisis ni usar APIs de pago.
Referencias no bloquean trabajo provisional; pedir 3 por estilo antes del cierre estético.
Bloqueos de este bloque: ninguno. Necesito de Carlos: nada ahora.
Backend pendiente: renderer/bindings, safe zones, enforcement look/audio/outro y E2E real.
No se avanzan fases posteriores por el hecho de fusionar sus contratos.
