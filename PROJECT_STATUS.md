# Estado técnico · 16/10/2026

FASE 3/10 · TRANSCRIPCIÓN + SEGMENTACIÓN + SUBTÍTULOS · EN CURSO
Progreso fase: 60 %.
Progreso global: 21 % = Fase 1 (5 %) + Fase 2 (10 %) + 60 % de Fase 3 (6 %).

Último hito: pipeline offline de captions validado con el vídeo real de POC_001 sin
consumir ASR ni créditos. Fase 2 está integrada en main mediante PR #1
(squash cc9e390e254e82bc993b734208138b56183eccc1).
Rama activa: feat/phase-3-transcript-captions.

## Fase 3 · implementado

- Contrato Transcript v1.0 independiente del proveedor.
- Palabras con timestamps sobre la fuente, idioma y confidence opcional.
- Mapeo fuente → timeline después de cortes.
- Palabras atravesadas por un corte se omiten del caption para no mostrar una palabra
  completa sobre audio parcial; la edición semántica futura deberá evitar estos cortes.
- Segmentación determinista por puntuación, pausas, palabras, caracteres y duración.
- Correcciones manuales por segmento: texto, tiempos o eliminación.
- Compilador transcript → captions editables → Video Edit Plan.
- CLI offline para generar captions.json y plan-captioned.json.
- Normalizador ASR genérico y normalizador de respuesta word-timestamp tipo Whisper.
- Title/outro se conservan; sólo se reemplazan captions.
- Documentación: docs/PHASE_3_TRANSCRIPT.md.

## Validación

Módulos nuevos de Fase 3 probados aisladamente en entorno local:
- transcript/segmentación: 6 tests;
- normalización ASR: 5 tests;
- compilador offline de captions: 2 tests.
Total: 13/13 aprobados.

Además se reutilizó POC_001 real:
- fuente: 38,310156 s;
- plan real: [0,12) + [13,38,31), timeline 37,31 s;
- audio preparado offline: MP3 mono 16 kHz / 48 kbps, 230.528 bytes, 38,34 s;
- texto de referencia conocido + pausas/VAD sólo para dry run, no ASR;
- 57 palabras de referencia;
- 11 captions resultantes;
- coste remoto: 0 USD.

El dry run detectó que el corte mecánico 12–13 s atraviesa habla. Esto confirma que los
cortes definitivos deberán respetar fronteras de palabra/frase.

La suite completa del repo (Fase 2 + Fase 3) todavía debe volver a ejecutarse en un checkout
con dependencias antes de cerrar la fase.

## ASR · decisión provisional

Mantener adaptador ASR reemplazable; no acoplar transcripción a Shotstack ni a un modelo.

Estado de documentación oficial consultada el 16/10/2026:
- OpenAI recomienda gpt-transcribe para transcripción general de archivo.
- Para timestamps por palabra, el endpoint actual requiere whisper-1 con verbose_json y
  timestamp_granularities[]=word.
- límite publicado del archivo: 25 MB;
- precio publicado whisper-1: 0,006 USD/min;
- para el audio POC_001 (38,34 s): coste estimado ≈ 0,0038 USD;
- whisper-1 tiene retirada anunciada para 26/02/2027, por lo que sólo puede usarse detrás
  del adaptador y como solución transitoria si se aprueba.
- Shotstack rich-caption puede auto-transcribir con sincronía palabra a palabra, pero la
  transcripción/generación consume créditos incluso en Sandbox.

No se ejecutó ninguna transcripción remota ni se consumieron créditos.

## Arquitectura y seguridad

- Node.js 22+, JavaScript ESM, Ajv y snapshot OpenAPI oficial.
- Shotstack Edit + Ingest stage sigue como motor de render POC, detrás de adaptador.
- Video Edit Plan propio → timeline → render.
- Originales/resultados en Drive privado; medios y credenciales fuera de Git.
- Producción/generación IA bloqueadas. Sin CapCut ni Lovable en esta fase.
- Claves de proveedor no se almacenan en GitHub/Drive/chat.

## Inventario

- Doc maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
- Drive principal: 1SNifaQFcBMzQ_H_3UQZcNMkUmzrMykOf
- Pruebas Drive: 1efHjGfJ3b5vDYTkdMM_dUjQOumXGgqYr
- Repo privado: https://github.com/carlossuess-art/sues-ai-video-editor
- Repo ID: 1422196475.
- main: Fase 2 validada.
- rama activa: feat/phase-3-transcript-captions.
- Original POC_001 Drive: 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82.
- Resultado Fase 2: 1uQl_nLIwO7NqzayotOQhewnOT7hXRh5S.
- Render Fase 2: a4708c00-45f2-4260-aef7-ebdc7d7b3c2d.
- Evidencia dry run Fase 3: Google Doc 1lBGwakWTeWcL9cP_IbJ3Lm9QHH9nJsxu6ssTlPBM9GA.

## Siguiente acción exacta

1. Ejecutar suite completa del repo en un checkout con dependencias.
2. Realizar UNA prueba ASR real con timestamps por palabra usando el audio de 230 KB,
   sólo tras aprobación de cualquier coste.
3. Normalizar transcript real al contrato v1.0 y comparar con el texto de referencia.
4. Compilar captions y validar sincronía.
5. Renderizar primer vídeo subtitulado en Sandbox.
6. Ajustar primer estilo SUES de captions y cerrar Fase 3.

Bloqueos actuales: Carlos ya autorizó hasta 0,01 USD para UNA prueba ASR real. Se creó una clave OpenAI temporal de 24 h mediante flujo cifrado, sin exponerla en chat/Drive/GitHub. El entorno de chat intentó llamar al endpoint de transcripción, pero la red del contenedor no pudo resolver api.openai.com; la petición no salió y no hubo coste. Archivos temporales de clave privada/clave descifrada se eliminaron. Audio de 230.528 bytes conservado para la prueba.
Necesito de Carlos ahora: nada. Siguiente ejecución recomendada: Work, porque dispone del entorno de red/navegación necesario para completar la llamada ASR y continuar con captions/render sin reconfigurar el proyecto.
