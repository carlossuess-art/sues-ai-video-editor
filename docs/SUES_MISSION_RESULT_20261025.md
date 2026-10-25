# Misión REA + editor audiovisual · evidencia del 25/10/2026
Estado de esta entrega: desarrollo y QA parcial; editor autónomo profesional pendiente.
Las cifras siguientes proceden de medios y ejecuciones reales, no sólo de planes.

## 1. Investigación recuperada
REA 6.7.0 ya estaba disponible: se reutiliza sin reinstalar. CapCut: 3 scripts públicos,
584.357 bytes y 211.967 nodos AST. Captions: bundle completo agotó el heap;
sólo el mapa público de dependencias de 4.679 bytes se analizó completo.
Los chunks inaccesibles devolvieron 403 y no se intentó eludir el acceso.
Los nombres de módulos sugieren separación de planes, estilos, clips, autenticación
y reproductor; no demuestran cómo funciona su IA. No se recuperaron algoritmos
privados ni se incorporó código propietario.
Evidencia, fuentes y clasificación: [informe REA](SUES_REA_FINDINGS_20261024.md).

## 2. Mapa de capacidades
[Mapa detallado](SUES_FUNCTIONAL_GAP_MAP_20261024.md) y
[arquitectura](SUES_INTELLIGENT_EDITOR_ARCHITECTURE_20261024.md).
Analista: Whisper y análisis técnico disponibles; VLM local probado sólo sobre una
muestra, sin comprensión visual continua ni detector fiable de emociones.
Director: reglas y contrato externo; puente de propuestas de modelo limitado a
énfasis con IDs reales. No hay selección narrativa general de 60 segundos.
Ejecutor: captions, composición, SFX, música, B-roll, transiciones y exportación
existentes. Las máscaras revisadas manualmente no equivalen a segmentación general.
Crítico: inspección técnica del MP4 real y muestras visuales. Crítica creativa y
corrección de esta entrega realizadas con asistencia del agente Work.
Mejora: versiones reversibles operativas; bucle creativo autónomo no integrado.

## 3. Modelo local: resultados negativos conservados
Se prueban SmolVLM2 y Qwen3 pequeños en el VPS, sin APIs ni créditos externos.
Qwen3-0.6B copia ejemplos o transcripción. Qwen3-1.7B genera IDs incorrectos y
elige palabras débiles; una única reparación corrige un ID pero conserva elecciones
narrativas inadecuadas. No se habilita el director en producción.
La asistencia Work conserva regularidad y actividades y suprime énfasis de reglas
no elegidos; las decisiones explícitas anteriores permanecen.
Proveniencia, presupuesto y contrato: [QA del director](SUES_LOCAL_DIRECTOR_QA.md)
y SUES_LOCAL_MODEL_PROVENANCE_20261025.json.

## 4. Ejecución real antes de la última corrección
Trabajo fad9491e-5a27-4513-aba9-262df1f70bf8, terminado.
Fuente SHA256 8d775bfab3d48b928adf86c730293b147bd77cc4ab6498bb4efe3760ca622005.
MP4: 68,634 s; 1080×1920; 32.479.894 bytes.
SHA256 8d960a568b86cfeec467706569c39678eb8840c2d07daadd4f187d2adc6000cd.
Decodificación completa PASS; sin intervalos negros ni inicios de congelación
detectados con los umbrales de la auditoría. Audio −15,57 LUFS y −1,91 dBTP.
Proxy 720p: 7.005.603 bytes, original de exportación conservado.

Se revisan fotogramas reales de captions y transiciones: desenfoque, estela radial
y luz cálida están en el archivo. Comparación antes/después: saludaros deja el
énfasis naranja y conserva caption blanco; regularidad/actividades mantienen
énfasis naranja con cambios de tamaño ajustados al ancho; atento queda idéntico.
No se afirma un 60 % físico de ampliación: el ajuste tipográfico limita el ancho.

Se reconstruye el grafo de audio con sus recursos originales, normalización y
agrupación de efectos existente. Música, SFX procedurales y SFX de biblioteca tienen
señal no silenciosa. La correlación del AAC final con la mezcla reconstruida es
0,99969–0,99987 en tres ventanas separadas. Esto acredita ejecución de esa mezcla,
no valoración subjetiva de cada sonido ni aprobación de escucha en móvil.
La primera auditoría sin caché excede 1 GiB y se descarta; la reutilización de lotes
existente completa la prueba dentro del mismo límite, sin cambiar producción.

Navegador: carga privada completa en memoria, búfer de 68,633 s y reproducción
observada hasta ended=true. Recargas recuperan sesión/proyecto sin credenciales.
No hay medición de stalls o frames perdidos en Android.

## 5. Crítica y corrección posterior
La revisión del MP4 detecta RUNAS/EGO repetidos en caption superior y rótulo.
Se corrige sólo cuando el rótulo coincide con todos los tokens y cubre todo el
intervalo. Frases distintas o cobertura parcial mantienen caption.
17 pruebas dirigidas PASS. Misma fuente y ASS antes/después: desaparecen 1.039/701
píxeles cálidos del encabezado y el rótulo conserva exactamente 4.251/4.478.
[Especificación y límites](SUES_CAPTION_HERO_COVERAGE_20261025.md).

Producción actual: b2ebf6df3725d245e7c3bb5518f574899d1fed0d.
Se despliega exclusivamente la corrección de duplicación, sobre la estabilidad previa,
con copia de estado verificada SHA256
ea814a7d06fbd0cb34042e9c47581e4847916a66d08b8ce3ade4aa9065fb2d58.
Whisper vuelve a active. Investigación de modelos permanece en rama separada.
Nuevo trabajo 9148a6fe-32e6-4843-9d15-489bb381a91d: DONE, 68,634 s,
32.455.286 bytes, 1080×1920 H264/30fps. SHA256
9a9105f33a3f4a7d60770adb7423595737389deb73efc3ff0ff9f8f1a1a4eff7.
Auditoría propia: decodificación completa PASS, −15,57 LUFS/−1,91 dBTP, sin
negros/congelaciones detectados bajo umbrales. RUNAS/EGO: encabezado cálido
1.026/1.286→0 píxeles, rótulos conservados y fotogramas revisados.
Audio PCM idéntico a la versión anterior, SHA256
50768dcc40fbb5a8dc330354e8e4679cab5c310f17d266e6f0afb72a7ccfbcff.
Navegador: búfer completo 68,633 s, readyState4, reproducción hasta ended=true y
sesión/proyecto recuperados tras recarga. No métricas de frames perdidos Android.
Copia ligera descargada: 7.000.469 bytes, SHA256
474c1518e17ce268d7671632953c432a3b2bb68a87c964f4ccfad8da249490da,
idéntica al proxy privado del trabajo. La descarga 1080p mediante la herramienta
del navegador agotó su tiempo de espera; el archivo 1080p existe en el editor.
La copia de muestra guardada se actualiza con nombre explícito 720p.

## 6. Bruto → plan → resultado
| Aspecto | Bruto | Plan y resultado comprobado |
|---|---|---|
| Duración | 68,649 s | 68,634 s; sin selección narrativa a 60 s |
| Texto | Sin grafismo añadido | Captions progresivos, acentos cálidos y rótulos; duplicación detectada y corregida |
| Apoyos | Toma original | Dos B-roll y capas existentes; selección general contextual pendiente |
| Transiciones | Toma original | Blur, radial y luz cálida visibles en muestras del MP4 |
| Audio | Voz original | Música y dos buses SFX comprobados contra el AAC final |
| Autonomía | Material de entrada | Modelo acotado + corrección Work + motor; no director profesional autónomo |

La referencia VID_20261022_101557_201.mp4 está disponible y se revisan 56 muestras.
El resultado conserva una composición más fija; no se declara equivalencia estética,
edición profesional de 150 €, V1 ni aceptación del usuario. F6/F7/F9 siguen abiertas.

## 7. Bloqueos que impiden el objetivo
Dirección narrativa fiable sobre vídeos nuevos; comprensión visual temporal;
selección contextual y montaje general de B-roll/cortes con todas las capas;
segmentación automática cuando se necesite oclusión; crítico creativo integrado y
bucle de reparación acotado. Los modelos locales probados no resuelven este conjunto.
El VPS de un núcleo hace costosos los renders complejos. Mejoras de estabilidad
no sustituyen estas capacidades. No se ha consumido API de pago.
