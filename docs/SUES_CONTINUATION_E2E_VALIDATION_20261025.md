# Continuación verificada · 25/10/2026

Se recuperó el trabajo de `continuation-e2e-20261025` sin cambiar su directorio ni producción. Se conservó una copia completa de código antes de corregir sus pruebas.

## Evidencia audiovisual recuperada

- Subida nueva, Whisper base/int8: 75 palabras. YuNet: rostro en 77/77 muestras. Render completo 38,30 s, H264/AAC 1080×1920/30, original preservado. Máscara MODNet acotada a 84 frames, predicha y pendiente de revisión. Música, 41 captions y 16 cues SFX. No B-roll en esta prueba.
- Copia TAR restaurada en almacén aislado sin modelo de segmentación: mismo MP4 codificado, SHA256 `9554a1d92f1a3e4329e97219b74b03e2af8dd688e49223762ff240b6aa91bb11`; ASS y grafo visual idénticos. Pruebas con motions/depth desactivados respetadas.
- Otra fuente real de 13,4102 s: 35 palabras, 26/27 muestras con rostro. Exportación 13,40 s completa, 19 captions, un motion, una transición y tres SFX; sin heredar máscara del primer vídeo. MP4 SHA256 `7a30188e278d4e7024c39214de8944907364646e08bdcdc1929f7a0a514576cd`.
- `E2E_RESULT.json` y `SECOND_RESULT.json` privados acreditan fullDecode PASS, sourcePreserved true y gasto externo nuevo 0 USD. Son pruebas API aisladas; no atribuirlas a un recorrido Android ni aceptación estética.

## Correcciones y regresión

Las pruebas nuevas fallaban por dos expectativas del fixture: un JSON de un byte se rechaza por tamaño antes de parsearlo; el estado público sin análisis es NEEDS_ANALYSIS. Se separó cobertura de JSON inválido de cobertura de tamaño inválido y se corrigió la expectativa del estado. No se debilitó ninguna validación del producto.

21/21 pruebas focales PASS. Suite completa Docker: 363 casos, 362 PASS y un fallo por Git no ejecutable/disponible en ese contenedor. Los dos casos de deploy-service, incluido el fallido en contenedor, pasan 2/2 en host. npm run check y git diff --check PASS. No resumir como 363/363 Docker.

El harness de navegador antiguo seleccionaba estilo sin abrir su panel tras crear un trabajo; se añadió reveal antes de selectOption. Chrome del host carece de libnspr4: se reutiliza imagen de QA ya instalada, sin instalar paquetes ni proveedores.

## Revisión visual y límites

Se inspeccionaron hojas de contacto de ambos MP4 (10 y 7 muestras útiles, respectivamente), no todos sus fotogramas. Se ven énfasis de tamaño/color, tarjeta y cierre; en las muestras del segundo vídeo los captions están fuera de la cara. La celda negra vacía del mosaico de 7 muestras no es un frame del vídeo. No se realizó escucha crítica. El montaje sigue siendo más sencillo que DOPAMIN referencia; no hay aceptación de calidad profesional ni V1. Selección por reglas y máscara parcial no equivalen a Director multimodal ni segmentación general. Cinta roja retenida y escasez de B-roll/contexto siguen abiertos.

## Estado operativo

Producción observada permanece `b2ebf6df3725d245e7c3bb5518f574899d1fed0d`; estas modificaciones no están desplegadas. Al tomar continuidad no había render activo; dos workers aislados de ASR estaban en espera y se preservaron. No se alteraron WhatsApp/Caddy/DNS, originales, trabajos previos ni PR15 incompleta.

FASE6/F7/F9 abiertas; global oficial48% sin cambio. Gasto externo nuevo0€; no se ha medido coste incremental de CPU por Reel ni se acredita el límite+10% con una base no medida.

Siguiente: QA de subida/selección/render/copia desde interfaz aislada con estas dos fuentes; revisar composición cuadro a cuadro alrededor de eventos, integrar sin perder cambios concurrentes y sólo entonces preparar despliegue con backup/rollback verificados. No repetir ASR/matte/renders que ya tienen resultados válidos salvo que cambie el grafo.

## QA navegador completada

Chrome151.0.7922.34 en imagen existente de QA:24/24combinaciones escritorio1440×1000 y móvil393×852, CALMA/DOPAMIN×6formatosELEMENTS. Guardar/recargar,deshacer,duplicar,copia TAR descargada y recuperación por input de archivo en escritorio PASS. Sin errores JS ni desbordamiento horizontal. Panel compacto446px/455px conserva ajustes. No se repitió render en este harness: renderSkipped:true; los MP4 completos corresponden a pruebas API antes descritas. No es todavía nueva subida→IA→render desdeUI ni prueba física Android. Evidencia privada:continuation-validation-20261025/browser-docker-v2/result.json.