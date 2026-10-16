# Prueba ASR real 001 · 16/10/2026

Resultado: BLOQUEADA por cuota OpenAI, no por red.

- Una petición POST al endpoint audio/transcriptions desde Work mediante proxy.
- whisper-1, verbose_json, timestamp_granularities[]=word, idioma es.
- Respuesta HTTP 429, error credit_balance_exhausted, tipo insufficient_quota.
- Organización Criptoleaders; Default project. Sin segundo intento.
- Audio MP3: mono, 16 kHz, 48 kbps, 38,34 s, 230.529 bytes.
- Coste de procesamiento: 0 USD, solicitud rechazada sin transcripción/usage.
- Estimación para ejecución correcta: 0,003834 USD; presupuesto autorizado 0,01 USD.
- Tests: suite completa 32/32, sintaxis OK. Sin cambios funcionales necesarios.
- No se generó transcript real ni render; no se subió vídeo a Shotstack.
- Fuentes temporales Ingest nuevas: 0. Clave local/privada temporal eliminadas;
  clave del proveedor con expiración 24 h, no revocada remotamente.

## Evidencias privadas

Audio: https://drive.google.com/file/d/1qIG_xTxMeQGJhErKvAtOxQz3ZkNK5QwC/view?usp=drivesdk

Auditoría JSON: https://drive.google.com/file/d/1a3BJagRgUNY0taCWX_ZpPAcMKlm9qwZy/view?usp=drivesdk

Fuente original Drive: 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82.

## Continuar

Revisar saldo de la organización/proyecto en https://platform.openai.com/settings/organization/billing
o elegir proyecto con saldo. No comprar/recargar sin autorización específica.
Tras resolver la cuota, revisar auditoría antes de nueva llamada; normalizar respuesta,
comparar con referencia, compilar captions y validar el corte 12–13 s. Sólo entonces
un render Sandbox, archivo y limpieza. Fase 3 sigue 60 %, global 21 %.
