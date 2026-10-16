# Estado técnico · 16/10/2026

FASE 4/10 · VISIÓN: CARA, OJOS, REENCUADRE, ZOOM Y SAFE ZONES · EN CURSO
Progreso fase: 20 %.
Progreso global: 28 % = Fases 1–3 (25 %) + 20 % de Fase 4 (3 %).
Rama activa: feat/phase-4-vision-camera.
Último hito: núcleo determinista de cámara inteligente creado y probado de forma aislada.

## Fase 4 · Implementado

- Nuevo `src/vision.js` provider-neutral.
- Contrato de detecciones: tiempo, tamaño de frame, caras, confianza y ojos opcionales.
- Selección de cara principal por confianza + tamaño + continuidad temporal.
- Anclaje a la línea de ojos; fallback geométrico si faltan landmarks.
- Suavizado temporal de posición y escala para reducir jitter.
- Crop vertical 9:16 limitado a los bordes de la fuente.
- Zoom base 1,08 con límite 1,35; todavía no es zoom semántico del Director IA.
- Safe zones 1080x1920 para contenido/captions/UI.
- `buildReframePlan()` produce keyframes independientes del proveedor de render.
- `package.json` incluye `src/vision.js` en `npm run check`.
- Documento técnico: `docs/PHASE_4_VISION.md`.

## Validación

- 7/7 tests aislados de visión pasan en Node 22 en el entorno de chat.
- Baseline completo anterior: 36/36 tests de Fase 3.
- Suite combinada completa del repo: pendiente de repetir en checkout completo.
- No se ha procesado todavía un vídeo real con detector de cara/ojos.
- Coste adicional: 0 USD.
- Sin render, ASR, IA generativa, CapCut, Lovable ni nuevas suscripciones.

## Decisiones vigentes

- Tracking/visión será clásico y reemplazable antes que generativo.
- Línea de ojos estable > centro geométrico del frame.
- Zoom sólo se volverá semántico cuando el Director IA aporte motivo; esta fase sólo
  resuelve composición y estabilidad.
- El mismo track facial podrá alimentar después relight, máscaras y motions.
- Safe zones deben ser una restricción común para reencuadre, captions y overlays.

## Fases 1–3

Fase 3 quedó cerrada al 100 % con captions por bloques aceptados por Carlos.
No repetir ASR ni render de Fase 3. Baseline completo: 36/36 tests.

## Referencias visuales

El Roadmap Maestro contiene las referencias prioritarias de edición y el ranking de Carlos,
incluido el Reel de deckeanu como referencia nº1 y Sues_Reel2_May_V1.mov como nº2.
No usar esas referencias para copiar un estilo literal; extraer mecanismos para ADN SUES.

## Siguiente acción exacta

Elegir y validar un detector real de cara/ojos sobre el vídeo POC ya archivado, sin coste
mensual nuevo. Normalizar detecciones al contrato `vision.js`, producir Reframe Plan real
y revisar estabilidad de cara/ojos. Después conectar los keyframes al render.

Bloqueos: ninguno para seguir diseñando/implementando.
Necesito de Carlos: nada.
Work sólo será necesario/recomendable cuando haga falta un checkout completo y ejecutar
la integración real de vídeo/detector/render en un mismo entorno.
