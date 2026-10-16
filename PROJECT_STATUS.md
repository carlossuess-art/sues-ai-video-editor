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
Total nuevo aislado: 13/13 aprobados.
Suite completa ejecutada en Work: 32/32 aprobados; npm run check: OK.

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

La suite completa (Fase 2 + Fase 3) se ejecutó con dependencias en Work el 16/10/2026:
32 tests aprobados, 0 fallos. No fue necesario modificar código.

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

Se intentó una llamada ASR real en Work; OpenAI rechazó con HTTP 429,
credit_balance_exhausted / insufficient_quota. Sin transcripción ni cargo de procesamiento.

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

1. Resolver saldo/cuota del proyecto OpenAI antes de otro intento. Suite completa ya aprobada.
2. Realizar UNA prueba ASR real con timestamps por palabra usando el audio de 230 KB,
   dentro del máximo ya autorizado de 0,01 USD, sólo después de resolver cuota.
3. Normalizar transcript real al contrato v1.0 y comparar con el texto de referencia.
4. Compilar captions y validar sincronía.
5. Renderizar primer vídeo subtitulado en Sandbox.
6. Ajustar primer estilo SUES de captions y cerrar Fase 3.

Bloqueos actuales: OpenAI devuelve HTTP 429 credit_balance_exhausted / insufficient_quota
en la organización Criptoleaders, Default project. La red HTTPS mediante proxy funciona:
no es el anterior fallo de DNS ni un rate limit transitorio. No se hizo un segundo intento.
Necesito de Carlos: revisar saldo/facturación del proyecto OpenAI, o seleccionar un proyecto
con saldo disponible. No se compra ni recarga automáticamente. ChatGPT Plus y API son
facturaciones separadas. https://platform.openai.com/settings/organization/billing

## Ejecución Work · 16/10/2026 17:15 Europe/Madrid

Carlos autorizó crear clave temporal 24 h y guardarla en .env.local ignorado. Se creó
mediante conector cifrado; secreto local y clave privada temporal eliminados tras el
rechazo. La clave del proveedor caduca a las 24 h; no afirmar revocación remota.
Audio extraído de la copia local original ya archivada en Drive: MP3 mono 16 kHz,
48 kbps, 38,34 s, 230.529 bytes. No se modificó vídeo original.
Petición: whisper-1, verbose_json, timestamp_granularities[]=word, language=es.
Un POST de transcripción; sin reintentos. HTTP 429 credit_balance_exhausted.
Coste de procesamiento de este intento rechazado: 0 USD; no existe resultado/usage ASR.
Estimación si se procesa: ≈0,003834 USD (0,006 USD/min), cota redondeada 0,0039 USD.
Máximo autorizado sigue 0,01 USD; no comprar créditos. No se envió render Shotstack ni
se crearon fuentes Ingest, por lo que no hay fuentes nuevas que limpiar.
No se generaron transcript real/captions reales/render: no sustituirlos por el dry run.

Audio Drive: https://drive.google.com/file/d/1qIG_xTxMeQGJhErKvAtOxQz3ZkNK5QwC/view?usp=drivesdk
Auditoría Drive: https://drive.google.com/file/d/1a3BJagRgUNY0taCWX_ZpPAcMKlm9qwZy/view?usp=drivesdk
Informe: docs/ASR_ATTEMPT_001.md.
Fase 3 permanece al 60 %, global 21 %; no cerrar hasta validar ASR y vídeo subtitulado.
No iniciar Fase 4.
