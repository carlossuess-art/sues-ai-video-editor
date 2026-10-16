# Fase 6 · Motion Library · foundation

Pretrabajo estructural independiente. No contiene assets pesados ni pretende cerrar Fase 6.

## Implementado
- contrato `Motion Asset v1` en `src/motion-library.js`;
- catálogo de ejemplo en `examples/motions/catalog.sample.json`;
- indexación por ID, tag y motivo semántico;
- instanciación de templates dinámicos con bindings;
- tests de catálogo/bindings;
- renderMode separa motion dinámico de asset raster.

## Patrones ya modelados
- BLURRED_RESOURCE_01: fondo del vídeo difuminado + recurso integrado + título;
- COMPARE_YES_NO_01: comparación sí/no con divider y cues de audio;
- NUMBER_BADGE_GOLD_01: listas/pasos con badge numerado.

## Reglas
- GitHub sólo guarda contrato/metadata, nunca vídeos pesados;
- fuentes/originales permanecen en Drive;
- cada motion debe declarar capas, tiempos, tags y motivos semánticos;
- contenido sustituible se marca replaceable;
- el Director IA seleccionará motions, pero la plantilla limitará cuáles están permitidos.

## Pendiente
- crear/convertir assets reales;
- decidir alpha/webm/mov/raster por pieza;
- catalogar SFX reales;
- validar safe zones con cara/captions;
- analizar 3 Reels por estilo antes de cerrar biblioteca SUES.
