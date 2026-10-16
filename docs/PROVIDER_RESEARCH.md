# Validación documental · 16/10/2026

Proveedor recomendado provisionalmente: Shotstack. Encaja con el pipeline propio por
Edit JSON y trabajos asíncronos; Ingest evita contratar otro almacenamiento para probar.
PAYG y sandbox se ajustan al uso ocasional. Se decide el proveedor definitivo tras el
primer render, nunca a partir de una afirmación de marketing.

| Capacidad | Evidencia actual | Decisión POC |
| --- | --- | --- |
| API/timeline | Edit REST, tracks/clips/start/length/trim | Adaptador propio |
| Vertical | Output size/aspectRatio en schema | 1080×1920 explícitos |
| Overlays/texto | RichTextAsset y capas | rich-text sobre vídeo |
| Audio | AudioAsset y video.volume | Voz; música opcional propia |
| Captions | RichCaptionAsset, ficheros SRT/VTT/TTML o media | Frases manuales; ASR posterior |
| Preview | CLI validate/studio sin key; MP4 renderizado | Player mínimo tras render |
| Upload | URL firmada + PUT y GET source | Ingest stage |
| Limpieza | DELETE source y hosting opt-out | Borrado por ID propio |

La CLI oficial actual permite validación local y preview Studio sin API key ni créditos,
pero su entorno por defecto es PRODUCCIÓN. Nuestro POC llama REST directamente y fija
stage; no instala ni depende de esa CLI. Studio es una posibilidad futura, no una
preview exacta validada en esta entrega. Las fuentes deben ser accesibles por HTTPS.

## Coste comprobado y condiciones

Pricing publica PAYG 10 USD por 50 minutos (0,20 USD/min), sin cuota mensual;
el alta anuncia 10 créditos con validez 30 días. Sandbox gratuito con marca de agua
requiere ≥1 crédito activo. La generación IA puede cobrar incluso en stage y queda
fuera del payload permitido. No se ha creado cuenta, comprado ni renderizado.
El coste efectivo y límites de una cuenta existente deben contrastarse al autenticar.

## Contraste rápido: Creatomate

Alternativa razonable: API de render con plantillas y Preview SDK. Su página ofrece
50 créditos de prueba sin tarjeta; calcula aprox. 14 créditos por minuto a 720p/25fps.
La oferta mostrada gira en torno a suscripciones, sin PAYG equivalente claramente
publicado. La misma página lista Preview SDK en planes pero su FAQ lo restringe a
Growth: aclarar esa discrepancia antes de integrarlo. No se creó cuenta ni adaptador.
No se ha detectado un bloqueo funcional de Shotstack que justifique migrar el POC.
Límites reales pendientes: autenticar, vídeo propio y verificación visual/audio.

## Fuentes primarias

- Tarifa/alta: https://shotstack.io/pricing/
- Claves, créditos y stage: https://shotstack.io/docs/guide/getting-started/request-api-keys/
- Sandbox/AI: https://help.shotstack.io/en/articles/14050795-staging-environments-faqs
- API: https://shotstack.io/docs/api/
- Schema snapshot: https://shotstack.io/docs/api/api.edit.json
- Convenciones: https://shotstack.io/docs/guide/agents/conventions/
- CLI y preview: https://shotstack.io/docs/guide/agents/cli/
- Upload/source: https://shotstack.io/docs/guide/ingesting-footage/sources/
- Retención de fuentes: https://shotstack.io/docs/guide/ingesting-footage/ingest-api/
- Hosting opt-out/24 h: https://shotstack.io/docs/guide/serving-assets/self-host/
- Alternativa: https://creatomate.com/pricing

El snapshot oficial se conserva para reproducibilidad; consultar su fecha/hash en
vendor/README.md. Las tarifas anteriores de blogs o chats pueden estar obsoletas.
