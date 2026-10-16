# Fase 7 · Director IA · contrato foundation

Pretrabajo sin llamadas LLM. El objetivo es fijar el contrato que un modelo deberá producir
y las barreras deterministas que impedirán que improvise fuera de plantilla.

## Implementado
- `src/director-contract.js`;
- tipos de decisión: cut, zoom, reframe, caption-emphasis, motion, transition, look,
  audio-cue y outro;
- cada decisión exige `reason` y `rule`;
- zoom semántico con motivo explícito;
- enforcement contra política de plantilla;
- motions/transitions sólo si la plantilla los permite;
- compilación a eventos con IDs estables;
- fixture de ejemplo y tests.

## Principio central
La IA propone decisiones; el motor determinista decide si son válidas. El modelo no recibe
libertad para inventar zooms, motions, transiciones o looks no admitidos.

## Entradas futuras
- transcript;
- segmentos y timing;
- track facial/reframe;
- template policy;
- Motion Library;
- contexto narrativo/hook/CTA.

## Salida
Un Director Plan estructurado que posteriormente se fusionará con Video Edit Plan.
No se ha elegido modelo ni se ha realizado ninguna llamada de pago.

## Pendiente
- schema final compatible con Video Edit Plan v2;
- prompt/system rules;
- evaluación con varios Reels reales;
- score de decisiones;
- resolución de conflictos entre captions, motions, cara y safe zones;
- validación creativa por estilo.
