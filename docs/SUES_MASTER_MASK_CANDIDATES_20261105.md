# SUES · Máscaras candidatas locales · 05/11/2026

## Alcance

El editor puede preparar una secuencia de máscaras alpha candidatas para una operación Remotion aprobada, usando fuente y mapa temporal comprobados por el servidor. La preparación es local, no hace llamadas de pago, no cambia el plan ni certifica la silueta. Los archivos quedan privados y requieren revisión antes de convertirse en una prueba de máscara confiable. La aplicación y este runtime no se han desplegado.

El archivo de entrada continúa usando `visual.mask:{proofId,mode:"alpha-keep"}`. Una candidatura no es un `proofId` aprobado: no debe insertarse automáticamente como evidencia. El flujo mixto sigue bloqueando máscaras ligadas únicamente a la fuente original hasta verificar su correspondencia con el hijo derivado.

## Flujo

1. La ruta autenticada obtiene una revisión y decisión vigentes, recompone el grafo y preflight del origen y comprueba que la operación corresponde al motor Remotion. Límite actual: 120 fotogramas de salida, lienzo y fuente 1080×1920 y rectángulo de capa entero.
2. El mapa de cortes se traduce a fotogramas del origen. Si falta una correspondencia, se repite o se invierte el orden, se bloquea. FFmpeg extrae los frames en directorio privado; fuente y aprobación se comprueban de nuevo.
3. El proceso Python local produce una imagen alpha por frame con el modelo de segmentación de persona. Se puede conservar el sujeto o el fondo; el recorte corresponde al rectángulo de la capa. Se conserva SHA del frame de entrada, de cada salida y del modelo. Se verifica la integridad del resultado y se eliminan los frames temporales de entrada.
4. El endpoint devuelve `CANDIDATE_NOT_VERIFIED`, nunca una aprobación. Los frames se pueden abrir de forma autenticada mientras sigan vigentes la revisión y la fuente. Un cambio exige nueva revisión. No se crea automáticamente una entrada de la política ni se asigna la máscara al montaje.

## Runtime aislado y configuración opt-in

El prototipo se ha comprobado con Python 3.12, `mediapipe==0.10.14`, `numpy==1.26.4` y `opencv-contrib-python-headless==4.11.0.86`. La instalación temporal utilizada para pruebas está fuera de producción; no constituye un paquete reproducible de producción ni verifica todas las dependencias transitivas.

El arranque lee opcionalmente `SUES_MASTER_MASK_CONFIG`, ruta absoluta y normalizada de un JSON privado con esta estructura:

```json
{
  "schema": "sues-master-mask-config/v1",
  "python": {"path": "/ruta/absoluta/al/venv/bin/python", "sha256": "SHA256_REAL_DEL_PYTHON"},
  "script": {"path": "/ruta/absoluta/generate-mask-candidates.py", "sha256": "SHA256_REAL_DEL_SCRIPT"},
  "model": {"path": "/ruta/absoluta/selfie_segmentation_landscape.tflite", "sha256": "SHA256_REAL_DEL_MODELO"}
}
```

Los valores anteriores son marcadores, no hashes válidos. La configuración y directorios padres deben ser de confianza y no estar abiertos a escritura por terceros. El servidor comprueba los tres hashes al arrancar y el ejecutable/script antes y después de cada tarea; comprueba que el hash del modelo usado coincida. La comprobación de dependencias transitivas, aislamiento íntegro del entorno, límites de CPU/memoria y resistencia a carreras de archivos quedan pendientes antes de cualquier despliegue.

## Evidencia y límites

- Pruebas unitarias Python sobre frames sintéticos: 2/2 PASS. Preparador de candidatos con modelo real y FFmpeg en prueba sintética aislada: 2/2 PASS. API autenticada completa con modelo real y vídeo sintético: 1/1 PASS, con sonda de metadatos simulada. Interfaz escritorio y móvil probada con generación simulada.
- Se evaluaron dos fotogramas existentes de la revisión privada 158404 V6B, sin generar otro Reel. La salida presenta alpha no uniforme y cambia entre ambos frames; la inspección visual de un solo fotograma muestra una silueta aproximada con bordes de cabello imperfectos. No demuestra calidad sostenida, seguimiento robusto, ocultación correcta en movimiento ni derechos de todos los recursos.
- El modelo y la instalación están en entorno temporal, no configurados en producción. Sin generador gratuito de planes operativo, supervisor audiovisual autónomo, aprobación de máscara ni ejecución integral del montaje. Antes de ofrecer el resultado como terminado hacen falta evidencia real, control de licencias, QA de movimiento y aceptación creativa.
