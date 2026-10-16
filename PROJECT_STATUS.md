# Estado técnico · 16/10/2026

FASE 3/10 · TRANSCRIPCIÓN + SEGMENTACIÓN + SUBTÍTULOS · EN CURSO
Progreso fase: 40 %.
Progreso global: 19 % = Fase 1 (5 %) + Fase 2 (10 %) + 40 % de Fase 3 (4 %).

Último hito: Fase 2 integrada en main mediante PR #1 (squash
cc9e390e254e82bc993b734208138b56183eccc1). Rama activa:
feat/phase-3-transcript-captions.

## Fase 2 cerrada

Primer MP4 cloud real validado: 37,3 s, 1080×1920, 30fps, voz original,
título y cierre; Sandbox con marca de agua. Coste real 0 USD. 19/19 tests del
POC aprobados. Original y resultado archivados en Drive; fuente temporal eliminada.

## Fase 3 · implementado

- Contrato Transcript v1.0 independiente del proveedor.
- Palabras con timestamps sobre la fuente, language, confidence opcional y duración.
- Mapeo fuente → timeline que elimina palabras dentro de cortes y desplaza las posteriores.
- Segmentación determinista por puntuación, pausas, palabras, caracteres y duración.
- Correcciones manuales por segmento: texto, tiempos o eliminación.
- Compilador transcript → captions editables → Video Edit Plan.
- Title/outro se conservan; sólo se reemplazan captions.
- 6 tests dedicados ejecutados fuera de GitHub: 6/6 aprobados.
- package.json incluye chequeo sintáctico del módulo nuevo.
- Documentación: docs/PHASE_3_TRANSCRIPT.md.

## ASR · decisión provisional

Mantener adaptador ASR reemplazable; no acoplar transcripción a Shotstack.

Investigación vigente:
- OpenAI recomienda gpt-transcribe para archivo, pero la guía actual remite a
  whisper-1 cuando se necesitan timestamps palabra a palabra.
- whisper-1 tiene retirada anunciada para 26/02/2027, por lo que no debe quedar
  como dependencia rígida.
- Shotstack rich-caption puede auto-transcribir y sincronizar palabra a palabra,
  pero la auto-transcripción consume créditos incluso en Sandbox y usa un
  subprocesador externo.
- No se ha ejecutado ninguna transcripción remota ni consumido créditos.

## Arquitectura y seguridad

- Node.js 22+, JavaScript ESM, Ajv y snapshot OpenAPI oficial.
- Shotstack Edit + Ingest stage sigue como motor de render POC, detrás de adaptador.
- Video Edit Plan propio → timeline → render.
- Originales y resultados en Drive privado; vídeos y credenciales fuera de Git.
- Producción/generación IA bloqueadas. Sin CapCut ni Lovable en esta fase.
- Clave Sandbox sólo en entorno Work previo; no asumir persistencia entre entornos.

## Inventario

- Doc maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
- Drive principal: 1SNifaQFcBMzQ_H_3UQZcNMkUmzrMykOf
- Pruebas Drive: 1efHjGfJ3b5vDYTkdMM_dUjQOumXGgqYr
- Repo privado: https://github.com/carlossuess-art/sues-ai-video-editor
- Repo ID: 1422196475.
- main: Fase 2 validada.
- Rama activa: feat/phase-3-transcript-captions.
- Original Drive: 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82.
- Resultado Fase 2: 1uQl_nLIwO7NqzayotOQhewnOT7hXRh5S.
- Render Fase 2: a4708c00-45f2-4260-aef7-ebdc7d7b3c2d.

## Siguiente acción exacta

1. Ejecutar suite completa del repo en un entorno con checkout/dependencias.
2. Añadir adaptador ASR sin activar cargos.
3. Elegir una prueba controlada de timestamps reales.
4. Generar transcript real del vídeo archivado.
5. Compilar captions, revisar sincronía y sólo entonces hacer primer render subtitulado.

Bloqueos actuales: ninguno para seguir preparando código/documentación.
Necesito de Carlos: nada ahora. Antes de consumir créditos o contratar un servicio,
pedir aprobación expresa.
