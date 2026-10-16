# Fase 5 · Brand Kit + motor de plantillas · foundation

Pretrabajo independiente creado fuera de la secuencia oficial para ahorrar Work. No implica
Fase 5 completada ni sustituye la validación visual posterior.

## Contratos
- `src/brand-kit.js`: BrandKit v1 validable.
- `src/template.js`: Template v1 y compilación a política determinista.
- IDs reservados: SUES_CALMA, SUES_IMPACTO, SUES_EXPLICA, SUES_HISTORIA.
- Primer ejemplo funcional estructural: `examples/templates/sues-calma.template.json`.

## Reglas fijadas
- zoom sólo con motivo semántico;
- safe zones obligatorias;
- captions, transitions, motions, look y audio viven dentro de plantilla;
- B/N y relight son opcionales/semánticos, no periódicos;
- Brand Kit separa identidad visual de comportamiento editorial.

## Pendiente para completar Fase 5
1. Extraer ADN de 3 Reels por estilo antes de cerrar presets visuales.
2. Elegir tipografías reales, pesos, tamaños, color, sombras/glow y caption look.
3. Validar visualmente SUES_CALMA como primera plantilla completa.
4. Integrar tracking/reframe de Fase 4.
5. Render de prueba y aprobación de Carlos.

No se hacen renders, compras ni dependencias nuevas en este foundation.

## Avance posterior: SUES_CALMA provisional

Foundation integrada en la rama oficial; ahora extensión cinematic-nature-retreat
y selector B-roll ejecutable en seco. Ver `SUES_CALMA_PROVISIONAL.md`. Carlos
autoriza definir mejor después y unificar marca mediante kit compartido. Las tres
referencias siguen siendo gate de cierre estético, no de implementación provisional.
80/80 tests y CLI en seco; todavía sin validación visual ni render de plantilla.
