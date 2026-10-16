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


## Dry run con POC_001 real · sin ASR de pago

Se reutilizó el vídeo original de 38,310156 s y el plan real de Fase 2 ([0,12) + [13,38,31)).
El texto conocido del guion se alineó de forma aproximada con pausas del audio únicamente para
probar la geometría temporal; NO se considera transcripción ASR ni validación de precisión.

Resultados:
- audio de prueba extraído a MP3 mono 16 kHz / 48 kbps: 230.528 bytes, 38,34 s;
- muy por debajo del límite de 25 MB del endpoint de transcripción;
- 57 palabras de referencia;
- timeline de salida 37,31 s;
- 11 captions compilados tras omitir palabras atravesadas por el corte mecánico;
- el corte 12–13 s atraviesa habla, confirmando que futuros cortes deben respetar fronteras
  de palabra/frase;
- coste remoto: 0 USD.

Pruebas locales de módulos de Fase 3 actualmente disponibles en repo:
- transcript/segmentación: 6;
- normalización ASR: 5;
- compilador offline de captions: 2.
Total nuevo validado de forma aislada: 13/13. La suite completa del repositorio debe ejecutarse
de nuevo en un checkout con dependencias antes de cerrar la fase.

## Coste estimado de la prueba ASR controlada

La documentación oficial consultada el 16/10/2026 limita archivo a 25 MB y establece que los
timestamps por palabra requieren actualmente whisper-1 con verbose_json y
timestamp_granularities[]=word. Tarifa publicada de whisper-1: 0,006 USD/min.

Para el audio preparado de 38,34 s, el coste estimado sería aproximadamente 0,0038 USD.
No se ejecutó la llamada ni se autorizó gasto. whisper-1 tiene retirada anunciada para
26/02/2027, por lo que cualquier uso será detrás del adaptador ASR y no una dependencia rígida.

## Respuesta real y marcas puntuales · 16/10/2026

Whisper puede devolver start=end para algunas palabras. Transcript v1 conserva ese
valor sin inventar duración y exige timingUncertain=true para aceptar una marca puntual.
La respuesta raw se archiva sin cambios. Una marca puntual sólo se incluye si pertenece
al intervalo de fuente conservado (inicio incluido, final excluido); no genera por sí
sola un clip de duración cero. Un caption sin intervalo positivo falla para revisión.
La segmentación se separa siempre al cambiar de segmento de fuente, incluso sin pausa.
La puntuación de text sólo se aplica a words si todos los tokens coinciden léxicamente;
no se sustituyen palabras por el guion de referencia. No hay karaoke palabra a palabra
ni precisión auditiva validada para marcas inciertas.

La referencia previa «Debajo de mi nombre…» pertenece a otra versión: Carlos confirmó
que grabó «Te enseñaron a mirar…». No usar la referencia antigua para calcular WER.
Suite tras regresiones de respuesta real: 36/36 aprobados.
