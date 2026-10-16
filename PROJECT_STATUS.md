# Estado técnico · 16/10/2026

FASE 3/10 · TRANSCRIPCIÓN + SEGMENTACIÓN + SUBTÍTULOS · REVISIÓN FINAL
Progreso fase: 90 %.
Progreso global: 24 % = Fase 1 (5 %) + Fase 2 (10 %) + 90 % de Fase 3 (9 %).
Rama activa: feat/phase-3-transcript-captions.
Último hito: ASR real → Transcript v1 → 14 captions editables → primer render
subtitulado Sandbox descargado, verificado técnicamente y archivado; fuente eliminada.

## Implementado y validado

- Contrato Transcript v1, normalización genérica/Whisper y correcciones manuales.
- 75 palabras reales; 8 timestamps puntuales conservados con timingUncertain=true,
  sin inventar duraciones. No afirmar precisión de karaoke.
- Puntuación restaurada sólo cuando text y words coinciden léxicamente.
- Mapeo fuente→timeline con omisión de palabras atravesadas por corte.
- Separación de captions obligatoria al cambiar de segmento de fuente.
- 14 captions; título/cierre conservados, cajas verticales sin superposición.
- Un único render subtitulado Shotstack stage. MP4 H.264 1080×1920, 30fps, AAC estéreo,
  duración 37,311667 s y 23.745.554 bytes. Voz original volumen 1; marca de agua Sandbox.
- Decodificación completa sin errores. Fotogramas a 2,5/6/11,9/12,5/35 s revisados:
  orientación correcta, subtítulos legibles, corte y salida de captions coherentes.
- Audio presente: mean -31,4 dB, max -9,5 dB; original -31,3/-9,4 dB.
  Esto no equivale a escucha humana ni certificación de transcripción exacta.
- Suite completa 36/36 aprobados, sintaxis y diff OK.
- Fuentes Ingest nuevas eliminadas después de archivo y ausencia en listado verificada.
- Fase 4 NO iniciada; sin producción, CapCut, Lovable ni compras del agente.

## Referencia y calidad pendientes

Carlos confirmó que grabó «Te enseñaron a mirar…». El guion archivado
«Debajo de mi nombre…» era otra versión y no permite validar precisión/WER.
No se reemplazó el texto ASR por aquella referencia. Se preservó respuesta raw.
Pendiente revisar escuchando el vídeo: transcripción literal completa y sincronía
percibida, especialmente palabras inciertas y alrededor del corte mecánico 12–13 s.
No certificar Fase 3 completa hasta corregir/revisar cualquier diferencia.
Palabras ASR como «Construistes», «escribe» y frase final requieren revisión;
no corregirlas por intuición sin contrastar audio.

## Costes y credenciales

- Intento previo Criptoleaders rechazado por 429 credit_balance_exhausted; 0 USD.
- Se verificó saldo Criptoleaders 0 USD y Personal 10 USD con auto-reload OFF.
  Carlos realizó la recarga fuera del navegador remoto. 10 USD es saldo observado,
  no importe de compra certificado; el agente no hizo ninguna compra.
- ASR procesado en Personal / Default project: whisper-1, verbose_json,
  timestamp_granularities[]=word, language=es. Una llamada de pago, sin reintentos.
- usage.seconds=39 → coste calculado 0,0039 USD a 0,006 USD/min.
  No es factura desglosada; dentro del máximo autorizado 0,01 USD.
- Render stage 0 USD. Dashboard posterior: 10 créditos, 0 gastados.
- Clave temporal 24 h por conector cifrado; clave privada y archivo .env.local
  eliminados. No afirmar revocación remota; expira a las 24 h.
- Org Personal: org-TDpkka3cfP79DtsIjHQnOOSq.
- Proyecto: proj_itDBbDLgoXAWqb2r0HfbfgEh.
- .env conserva únicamente credencial stage ignorada. Sin secretos/medios en Git.

## Inventario y evidencias

- Maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
- Repo privado: https://github.com/carlossuess-art/sues-ai-video-editor (ID 1422196475).
- main: Fase 2 integrada por PR #1, squash cc9e390e254e82bc993b734208138b56183eccc1.
- Drive principal: 1SNifaQFcBMzQ_H_3UQZcNMkUmzrMykOf.
- Pruebas: 1efHjGfJ3b5vDYTkdMM_dUjQOumXGgqYr.
- Original intacto: 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82.
- Resultado Fase 2: 1uQl_nLIwO7NqzayotOQhewnOT7hXRh5S.
- Raw ASR real: 1Fqd8uVqFYxUVO_4q6AVFCX3pzEZJZM89.
- Transcript normalizado: 11cNi2n-Qkim0_pKMkz2WMle3xDWH1nEa.
- Captions editables: 1LQXw3cBcGlVrLsfiNzfIrtK2gm-hRtY6.
- Render subtitulado: https://drive.google.com/file/d/15yKyk_ATF9bj5vYs_bo-zrb6QbHvpXBw/view?usp=drivesdk
- Auditoría completa con SRT/job/plan/timeline/validación:
  https://drive.google.com/file/d/1qsAAzLTD0hIVZWmBJSjmK6FJWOVuiHpC/view?usp=drivesdk
- Resultado entregado en chat: libfile_f16cb3239c488191b4aec6678d0d0c0f.
- Render ID: e024aea2-82b5-4656-913d-31ed3e616994.
- Source eliminado: zzz01m52-pctmg-b5ng8-yvwwh-tmggpb.
- Job local: runtime/prueba-002-captioned/job.json, estado CLEANED.
- Enviado 15:48:52.826Z, descarga completa 15:51:14.046Z (141,22 s).
  renderTime reportado: 29.704,37 ms.
- Informe actual: docs/ASR_RESULTS_002.md.
- Intento fallido anterior: docs/ASR_ATTEMPT_001.md, auditoría Drive
  1a3BJagRgUNY0taCWX_ZpPAcMKlm9qwZy.
- Dry run antiguo: Doc 1lBGwakWTeWcL9cP_IbJ3Lm9QHH9nJsxu6ssTlPBM9GA,
  referencia incorrecta para este vídeo; conservar sólo como evidencia histórica.

## Siguiente acción exacta

Carlos revisa el MP4 subtitulado y confirma/corrige texto y sincronía.
Aplicar correcciones mediante transcript/captions editables, sin repetir ASR de pago.
Cualquier nuevo render debe revisarse como otra ejecución; no reenviar el job CLEANED.
Cerrar Fase 3 sólo al superar esta revisión. No iniciar Fase 4 aún.
Bloqueos técnicos: ninguno. Pendiente de calidad: revisión humana de audio/texto.
Necesito de Carlos: ver el vídeo y señalar frases incorrectas o desfases.
Leer este archivo y el Doc maestro antes de continuar; reutilizar repo y rama.
