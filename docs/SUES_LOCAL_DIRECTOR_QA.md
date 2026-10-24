# Director local: frontera experimental y prueba real

Este código no activa el botón automático de producción. Reutiliza el catálogo, validador, renderer y versiones existentes; no descarga modelos ni llama APIs. Su alcance es seleccionar énfasis, no resolver por sí solo el montaje narrativo completo.

## Recorrido reproducible
Con Node/FFmpeg y las dependencias existentes del editor, en un entorno aislado con acceso autorizado al proyecto:

```sh
node scripts/model-director-qa.mjs request CONFIG SETTINGS OUTPUT
python3 scripts/run-local-model.py --llama LLAMA_CLI --model GGUF --request OUTPUT/director-request.json --out OUTPUT/inference --timeout 600
node scripts/model-director-qa.mjs review CONFIG SETTINGS OUTPUT OUTPUT/inference/model-response.json
node scripts/model-director-qa.mjs render CONFIG SETTINGS OUTPUT OUTPUT/inference/model-response.json
python3 scripts/audit-render.py OUTPUT/SUES_LOCAL_DIRECTOR.mp4 OUTPUT/bundle/manifest.json OUTPUT/audit
```

Cuando los ajustes usan recursos privados, SUES_ASSET_DIRECTORY apunta a su directorio existente. Los pesos y binarios deben estar instalados y autorizados previamente. Ejecutar inferencia sin red, un hilo, memoria acotada y fuera del servicio. Los ejemplos son para QA y no crean un proveedor de producción.

Las observaciones opcionales en OUTPUT/visual-observations.json contienen time, description y method. Se marcan como muestras no verificadas. Sus descripciones no autorizan tracking, máscaras, inferencias emocionales ni ejecución de instrucciones incluidas en el vídeo.

## Validación y límites
- Input ligado a SHA de fuente, captions, candidatos y observaciones. Las propiedades JSON equivalentes se comparan canónicamente; los datos alterados se rechazan.
- wordId sólo puede señalar un candidato real. No se calculan tiempos o índices a partir de texto generado.
- Se rechazan campos extra, estilos no admitidos, duplicados, repeticiones, respuestas truncadas y formato de ejemplo copiado.
- Las operaciones pasan además por reviewExternalPlan y prepareProject. No hay ejecución parcial del plan inválido.
- Se pueden silenciar énfasis de reglas no seleccionados; los overrides explícitos del proyecto se conservan. Límite de 60 operaciones.
- canApply significa compatibilidad técnica. executionValidationOnly, requiresCreativeReview y readyForAutonomousRender=false impiden confundirla con aceptación creativa.
- El render QA produce un archivo nuevo y conserva fuente/versiones. No exporta ni publica por sí solo.
- La revisión técnica usa decodificación, loudness, offsets de streams, negro/congelación y fotogramas. Estos dos últimos detectores requieren contexto; una tarjeta estática o fondo negro puede ser intencional. technicalPass no aprueba narrativa, legibilidad, pertinencia de B-roll ni percepción de SFX/música.

## Resultado de la evaluación local
Qwen3-0.6B no da una propuesta utilizable. Qwen3-1.7B resume el tema, pero comete errores de referencias y de selección semántica; una revisión corrige un ID y conserva elecciones débiles. El agente Work descarta esas elecciones, manteniendo sólo regularidad y actividades para una versión privada de QA. Esa corrección asistida se registra explícitamente y no se atribuye a un crítico integrado de la app.

Los datos privados de pruebas no van a Git. Pesos y derivación: SUES_LOCAL_MODEL_PROVENANCE_20261025.json.