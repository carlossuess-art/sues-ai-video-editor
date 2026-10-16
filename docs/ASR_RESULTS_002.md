# ASR real · POC_001 · 16/10/2026

## Facturación y acceso

Se confirmó en navegador: Criptoleaders 0,00 USD; Personal 10,00 USD y auto-reload OFF.
Carlos completó la recarga fuera del navegador remoto. No se afirma importe de compra:
10 USD es el saldo observado. No se realizó compra desde el agente.
Organización usada: Personal (org-TDpkka3cfP79DtsIjHQnOOSq), Default project
(proj_itDBbDLgoXAWqb2r0HfbfgEh). Credencial temporal 24 h creada por conector cifrado,
clave privada/archivo local eliminados. Sin secretos en evidencias o commits.

## ASR

Una llamada procesada whisper-1, verbose_json, timestamp_granularities[]=word,
language=es. Audio MP3 mono 16 kHz/48 kbps, 38,34 s y 230.529 bytes.
Respuesta: 75 palabras, idioma spanish normalizado a es; usage.seconds=39.
Coste calculado: 39/60 × 0,006 = 0,0039 USD; presupuesto máximo 0,01 USD.
Es cálculo basado en uso devuelto y tarifa, no factura desglosada. El intento previo
Criptoleaders devolvió 429 credit_balance_exhausted sin resultado ni cargo; causa
revisada y resuelta usando el proyecto Personal con saldo, sin reintentos automáticos.

## Referencia y precisión

Carlos confirmó que grabó «Te enseñaron a mirar…». El guion archivado «Debajo de mi
nombre…» corresponde a otra versión y no permite calcular WER ni certificar texto.
Se conserva la respuesta raw y el transcript normalizado, sin corregir palabras por
intuición ni copiar texto del guion antiguo. Revisión humana completa pendiente.
Ocho palabras tienen start=end en la respuesta: mundo, correr, luchar, conseguir,
sentir, escribe, cuenta y mente. Se conservan como marcas puntuales inciertas
(timingUncertain=true), sin inventar intervalos o precisión de karaoke.
Captions agrupados en frases; ningún clip tiene duración cero. El corte [12,13)
omite palabras dentro/atravesadas por el corte; tras 13 s se resta exactamente 1 s.
La segmentación se separa en el salto de fuente. Título y cierre se conservan; cierre
bajado y caja reducida para evitar superposición con captions.

## Tests

Suite completa 36/36, sintaxis OK y diff limpio. Cuatro regresiones: marcas puntuales
sin pérdida de texto, puntuación sólo si coincide léxicamente, salto de corte y cajas
caption/outro sin superposición. Contrato y OpenAPI validados antes del render.

## Primer render subtitulado

Render e024aea2-82b5-4656-913d-31ed3e616994; fuente zzz01m52-pctmg-b5ng8-yvwwh-tmggpb
eliminada tras archivar. Job CLEANED, ausencia en Ingest comprobada.
14 captions; 72 palabras mapeadas y 3 omitidas por corte: las de dentro o atravesadas.
MP4 H.264 1080×1920/30fps, AAC 48 kHz estéreo, 37,311667 s, 23.745.554 bytes.
Envío 15:48:52.826Z → descarga 15:51:14.046Z (141,22 s); renderTime 29.704,37 ms.
Decodificación completa sin errores; fotogramas antes/después del corte, título y cierre
revisados. Texto legible y cajas sin superposición. Audio mean -31,4/max -9,5 dB.
No se ha podido validar auditivamente el contenido completo: revisión humana pendiente.
No se realizaron más llamadas ASR. Shotstack: saldo 10 créditos, 0 gastados después.

Resultado: https://drive.google.com/file/d/15yKyk_ATF9bj5vYs_bo-zrb6QbHvpXBw/view?usp=drivesdk

Raw ASR: https://drive.google.com/file/d/1Fqd8uVqFYxUVO_4q6AVFCX3pzEZJZM89/view?usp=drivesdk

Transcript: https://drive.google.com/file/d/11cNi2n-Qkim0_pKMkz2WMle3xDWH1nEa/view?usp=drivesdk

Captions: https://drive.google.com/file/d/1LQXw3cBcGlVrLsfiNzfIrtK2gm-hRtY6/view?usp=drivesdk

Auditoría: https://drive.google.com/file/d/1qsAAzLTD0hIVZWmBJSjmK6FJWOVuiHpC/view?usp=drivesdk

Fase 3 al 90 %, global 24 %. Para cerrar: revisar literalidad/sincronía completa y
corregir manualmente si procede. Fase 4 no iniciada.
