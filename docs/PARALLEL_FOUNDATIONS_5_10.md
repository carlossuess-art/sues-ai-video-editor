# Pretrabajo paralelo · Fases 5–10 · 16/10/2026

Este documento registra trabajo adelantado desde chat normal mientras Work no estaba
disponible. **No cambia la secuencia oficial del roadmap ni suma progreso global** hasta
que cada rama se integre y se valide en su fase correspondiente.

Todas las ramas parten del cierre estable de Fase 3:
`10e194a25237b1de4c05af7f0f1b781ce78d43ef`.
Así se evita acoplar pretrabajo futuro a una Fase 4 todavía no cerrada.

## Fase 5 · Brand Kit + templates
Rama: `feat/phase-5-template-foundation`
Último commit de este bloque: `0c5677c6232508864235de2cb9392ca93900081d`

Preparado:
- BrandKit v1;
- Template v1 + policy compiler;
- esqueletos estructurales SUES_CALMA / IMPACTO / EXPLICA / HISTORIA;
- reglas: semanticZoomOnly, safe zones, captions, transitions, motions, look, audio;
- tests de contrato;
- documentación.

No validado: tipografías/estética final, ADN de 3 Reels por estilo, render real.
Estado de pretrabajo estimado: **foundation ~35 %**. Oficialmente Fase 5 no iniciada.

## Fase 6 · Motion Library
Rama: `feat/phase-6-motion-library-foundation`
Último commit: `739f1034caf5208ebc9bb315851110ca951ed11b`

Preparado:
- contrato Motion Asset v1;
- indexación/bindings dinámicos;
- BLURRED_RESOURCE_01;
- COMPARE_YES_NO_01;
- NUMBER_BADGE_GOLD_01;
- CHECK_GREEN_01 / CROSS_RED_01 / STRIKE_TEXT_01 / DIVIDER_LINE_01;
- motivos semánticos y cues de audio declarativos;
- tests y documentación.

No validado: assets reales, alpha/raster, SFX reales, render/safe zones visuales.
Estado de pretrabajo: **foundation ~30 %**. Oficialmente Fase 6 no iniciada.

## Fase 7 · Director IA
Rama: `feat/phase-7-director-contract`
Último commit: `1c7d332f3d7429b0f86bdfcaf7d54971cb63a2f3`

Preparado:
- contrato Director Plan v1;
- decisiones tipadas;
- reason/rule obligatorios;
- enforcement determinista contra template policy;
- zoom/motion/transition limitados por plantilla;
- sample + tests.

No validado: modelo, prompts, evaluación real, conflictos de overlays/face/captions.
Estado de pretrabajo: **foundation ~25 %**. Oficialmente Fase 7 no iniciada.

## Fase 8 · App/UI
Rama: `feat/phase-8-app-contract`
Último commit: `341e4d3b2316994d6548aaf2cd22d6c4ffb58186`

Preparado:
- contrato create-edit;
- campaignMode + banner geográfico;
- ajustes permitidos;
- máquina de estados de job;
- requisitos de seguridad previos a uploads públicos;
- tests y UX objetivo V1.

No construido: backend, persistencia, autenticación, preview, UI/Lovable.
Estado de pretrabajo: **foundation ~15 %**. Oficialmente Fase 8 no iniciada.

## Fase 9 · E2E / aceptación V1
Rama: `feat/phase-9-e2e-acceptance`
Último commit: `89fac4091a9a9a7c4c42bd42996afd3776ab9e89`

Preparado:
- manifest de aceptación;
- artefactos obligatorios;
- gates técnicos;
- gate cualitativo exacto: 0 cambios mayores y máximo 2–3 retoques menores;
- tests.

No ejecutado: E2E real.
Estado de pretrabajo: **foundation ~10 %**. Oficialmente Fase 9 no iniciada.

## Fase 10 · consolidación / CapCut opcional
Rama: `feat/phase-10-consolidation-contract`
Último commit: `7ddeaa66f667d0376caeff071fbb77707461dfde`

Preparado:
- checklist de consolidación/deployment;
- frontera CapCut Adapter;
- clone/backup/lint/preview obligatorios;
- MCP como fachada, no motor;
- tests mínimos del contrato.

No ejecutado: deployment, seguridad producción, CapCut real.
Estado de pretrabajo: **foundation ~10 %**. Oficialmente Fase 10 no iniciada.

## Orden de integración cuando vuelva Work

1. cerrar Fase 4 visualmente;
2. integrar y validar Fase 5;
3. integrar Fase 6 sobre templates ya validados;
4. integrar Fase 7 con templates + motions + transcript + vision;
5. construir Fase 8;
6. ejecutar Fase 9 E2E;
7. sólo después consolidar Fase 10.

Antes de cada merge: revisar diff, resolver contratos duplicados y ejecutar suite completa.
No mezclar ramas a ciegas ni sumar porcentajes de pretrabajo al global hasta integración.
