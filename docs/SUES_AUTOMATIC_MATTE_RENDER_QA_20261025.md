# Continuación entre chats: máscara automática → MP4 real · 25/10/2026

## Resultado

Se recuperó el chat «Avance del vídeo generado» y su trabajo posterior al DOPAMIN MASTER del24/10. Se contrastaron directamente código instalado, ramas, cambios sin publicar, modelos y QA del VPS. Producción continúa en **b2ebf6df3725d245e7c3bb5518f574899d1fed0d**, no b3e0a7a ni esta candidata. No se ha desplegado esta integración.

Nuevo vídeo completo de38,300s,1080×1920/30fps,H264/AAC,15.139.113bytes:
[MP4 privado de revisión](https://editor.suesholistics.com/api/assets/917ae5425b86ad0d4ef68e1e449567e7c341189e95f3667ed6cd15177e984254/media).
Requiere sesión del editor. Acceso HTTPS autorizado206 y anónimo401 verificados.
SHA256 **917ae5425b86ad0d4ef68e1e449567e7c341189e95f3667ed6cd15177e984254**.
Es la fuente real del estudio anterior de10s, ahora completa; NO reemplaza el maestro68,63s ni sus versiones. Original50c56298e59f783b2dfe2979c80ddc4e83a84ab4eb9048aa56ff8423be67ba6a intacto.

La nueva versión está guardada como medio privado «QA completa · capas automáticas25oct · NO USAR COMO B-ROLL», sin metadatos de aprobación narrativa. No se cuenta como un nuevo B-roll del banco:54recursos anteriores más1MP4de revisión.

## Qué se recuperó del otro chat

- b2ebf6d en producción: sesión/búfer/proxy y corrección de RUNAS/EGO duplicados en el maestro.
-00bc9be663311f5c0db5fdefca455ad3d0105459: cámara temporal y prueba MODNet con máscara ya calculada y revisada parcialmente,10s.
- Rama local feat/autonomous-video-flow-20261025 con cambios sin publicar: YuNet, carga del runtime, petición de máscara y caché. Se preservó íntegra; se trabajó sobre snapshot y otra rama.
- YuNet documentado con77/77 y26/27 muestras con cara en dos fuentes; se reutilizan esos análisis, no se atribuye nueva inferencia de visión a esta sesión.
- Investigación REA comparativa recuperada: análisis público parcial, no algoritmos privados. No se reinstaló REA ni se repitieron modelos descartados.
- Se aplicó skills/sues-ai-film-director/SKILL.md del proyecto.

## Correcciones que llegan al vídeo

1. El plan pedía automaticForeground pero render_local_preview.py no generaba ni abría su matte. Se conecta el helper ya preparado, después de validar fuente y contrato; se verifica geometría, codec, frames y hash, se añade la máscara al grafo y se conserva su auditoría.
2. Las tarjetas de receta tienen IDs de captions, no intervalos numéricos. La comparación directa no detectaba sus solapamientos. Ahora se compilan primero a tiempos reales y se apartan sólo las tarjetas automáticas incompatibles. Las elecciones explícitas permanecen prioritarias.
3. Desactivar motions todavía permitía pedir máscara. Regresión reproducida con fallo y corregida. CALMA, autoRecipe:false, depthEnabled:false, ausencia de runtime y composición manual no activan la propuesta automática.
4. El primer render completo ocultaba casi todo OJOS detrás de la cabeza. Tras inspección del MP4 se aumentó el texto y se colocó respecto a la mediana de la mirada detectada en ese intervalo. Se valida también esa posición al ejecutar; no se acepta una coordenada arbitraria.
5. La caché queda ligada a fuente, espacio de cámara, ventana y modelo. La segunda versión reutiliza exactamente el alpha calculado, sin nueva inferencia.

Código publicado de esta continuación: **604a318ad935669d8d84384b02166f4fc1e1f7f2**, árbol88bd6a6a9b60566943e8caf03631bd5a847208b3, rama feat/automatic-matte-render-qa-20261025. Contiene el snapshot previo más las correcciones; se compararon SHA de los15blobs antes de publicar. PR15 no tocada.

## QA sobre los archivos reales

| Momento | Comprobación |
|---|---|
|0–38,30s|MP4 completo; fullDecode PASS, fuente preservada|
|7,833–10,633s|84frames inferidos con MODNet, alpha temporal real|
|8,033–10,633s|OJOS literal del discurso detrás del sujeto, entrada/salida animada|
|8,4 /9,3 /10,2s|Fotogramas finales inspeccionados: rostro nítido, fondo desenfocado y palabra legible; contacto parcial con cabello|
|Resto del vídeo|Hoja de13muestras distribuidas; cámara, captions, tarjeta y recursos previos conservados|
|Audio final|−15,57LUFS,−1,87dBTP,LRA3,70; medición, sin escucha crítica humana|

Plan final:32captions,3ciclos dezoom,2motions,1tarjeta,3transiciones,17SFX,sin cortes ni B-roll. No se declara la densidad cinematográfica del referente por esos contadores.
Primera versión completa conservada:15.107.559bytes,SHA5a9fc1417c65b70b5fabbd0fe805d1604333dd4cccb553981866734dff4cc6b9.
La primera inferencia costó165,52sde reloj/69,49sCPU Python en el entorno limitado; no equivale a duración ni CPU total del render. Área predicha .3507–.3579. Modelo07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9. RuntimeCPU ya instalado.
El matte conserva incorrectamente la cinta roja del coche. Muestras parciales no acreditan bordes perfectos, tracking a30fps ni segmentación general fiable. reviewStatus permanece predicted-unreviewed; no se convirtió en aprobación por superar controles.

## Verificación

- Suite completa:353casos;352PASS Docker y1fallo de acceso Git del entorno. Ambos casos de deploy-service pasan2/2 en host, sin cambiar safe.directory global.
-20pruebas focales iniciales PASS, incluidas composición, cámara, intake, audio separado y copias.
-Tras el ajuste de colocación: pruebas foreground/semantic PASS; sonda real con propuesta positiva,4modos desactivados,prioridad manual,ausencia de runtime,6manipulaciones rechazadas y solapamiento rechazado.
-Reutilización de caché acreditada cacheHit:true en auditoría final y prueba independiente.
-Check de sintaxis y git diff --check PASS. No se presenta la suite anterior como validación de una subida nueva de extremo a extremo.
-Sonda reproducible: scripts/qa/verify_automatic_foreground.mjs CONFIG VISION_JSON JOBS_ROOT; requiere medio privado con concepto elegible y runtime autorizado, no incluye material privado en Git.

## Límites y siguiente bloque

Esto conecta **una composición automática acotada** al render existente. La selección sigue un pequeño léxico explícito y una ventana temprana3,5–14s; máximo90frames de inferencia. No es un Director multimodal profesional ni una máscara de todo el vídeo.
Pendientes: subida nueva→ASR+YuNet→versión→matte→render→copia/restauración en API/UI aislada; robustez en otra fuente; coste/latencia completa; defectos de cinta/bordes; B-roll contextual de manos rompiendo cadenas; incorporación amplia del banco; densidad narrativa; escucha y aceptación estética.
No desplegar por dar PASS a esta prueba: falta esa integración completa y decisión visual de calidad. Mantener V1 y F6/F7/F9 abiertas, global oficial48%sin cambio.
Gasto externo nuevo de esta continuación0€; no compras,API ni suscripciones. Se reutiliza CPU existente; no hay base económica medida que permita acreditar el límite+10%porReel.
Evidencia privada: continuation-audit-20261025, con snapshot, ambos MP4, manifiestos, logs, contrato antes/después, acceso privado y auditoría. No contiene una aprobación artística.
