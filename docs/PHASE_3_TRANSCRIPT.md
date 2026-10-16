# Fase 3 · transcript, segmentación y captions

## Objetivo

Separar la transcripción del proveedor de render. El motor recibe un contrato propio con
palabras y tiempos de la fuente; después mapea esas palabras a la timeline ya cortada,
segmenta frases y compila captions editables. Así un corte posterior no rompe los tiempos.

## Contrato Transcript v1.0

```json
{
  "version": "1.0",
  "language": "es",
  "sourceDuration": 38.31,
  "text": "Texto completo opcional",
  "words": [
    {"text":"Hola","start":0.12,"end":0.48,"confidence":0.98}
  ]
}
```

Reglas:
- tiempos en segundos sobre el vídeo FUENTE, no sobre la salida;
- words ordenadas y dentro de sourceDuration;
- confidence opcional 0–1;
- el contrato no contiene credenciales ni información del proveedor.

## Mapeo a timeline

`mapWordsToTimeline()` cruza transcript.words con `plan.segments`.
Las palabras que caen en una parte eliminada desaparecen. Las posteriores se desplazan
exactamente el tiempo retirado. Si una palabra cruza un borde, se recorta y queda marcada
`clipped:true`.

Esto evita el error clásico de subtitular primero y después desincronizar al cortar.

## Segmentación inicial

`segmentWords()` crea frases cortas deterministas usando:
- puntuación fuerte;
- pausa entre palabras;
- máximo de palabras;
- máximo de caracteres;
- duración máxima.

Valores iniciales: 8 palabras, 42 caracteres, 4,5 s y corte por pausa >=0,65 s.
Son defaults de ingeniería, no estilo definitivo. Se ajustarán con vídeo real.

Cada segmento recibe ID estable en esa compilación y puede corregirse manualmente mediante
`applySegmentEdits()`: texto, inicio, fin o eliminación. La corrección queda marcada
`source:"manual"`.

## Compilación a Video Edit Plan

`withTranscriptCaptions()` conserva title/outro y reemplaza sólo captions. Los captions
se convierten a los `texts` existentes del plan, por lo que el render actual puede
usarlos sin acoplar el transcript a Shotstack.

Primera presentación SUES provisional:
- rich-text;
- parte baja del cuadro;
- blanco sobre fondo oscuro semitransparente;
- máximo 1–2 líneas por segmento;
- editable antes de render.

El estilo definitivo y resaltado palabra-a-palabra se validarán después.

## ASR · decisión provisional

El adaptador ASR debe ser reemplazable. No se ejecuta ningún servicio de pago en este bloque.

Hallazgos actuales:
- OpenAI recomienda `gpt-transcribe` para archivo, pero su guía remite a `whisper-1`
  cuando se requieren timestamps por palabra.
- `whisper-1` tiene retirada anunciada para 26/02/2027, por lo que no debe convertirse
  en dependencia rígida.
- Shotstack admite rich-caption y auto-caption mediante alias, con word-sync, pero la
  auto-transcripción consume créditos incluso en sandbox y usa un subprocesador externo.
- Por ello: contrato propio + adaptador ASR. La elección definitiva se hace tras una
  prueba controlada y aprobada, midiendo precisión en español, timestamps, coste y latencia.

Fuentes consultadas:
- https://developers.openai.com/api/docs/guides/speech-to-text
- https://developers.openai.com/api/docs/pricing
- https://developers.openai.com/api/docs/deprecations
- https://shotstack.io/docs/guide/architecting-an-application/rich-captions/
- https://shotstack.io/learn/agentic-video-editing-best-practices/
- https://shotstack.io/sub-processors/

## Validación offline

El módulo nuevo tiene 6 pruebas dedicadas:
1. contrato y confidence;
2. mapeo de cortes;
3. segmentación;
4. corrección manual;
5. compilación a captions;
6. rechazo si transcript y plan no pertenecen a la misma fuente.

Estas 6 pruebas se ejecutaron fuera de GitHub y pasaron 6/6 antes de publicar los archivos.
La suite completa del repo debe volver a ejecutarse antes del primer render de Fase 3.
