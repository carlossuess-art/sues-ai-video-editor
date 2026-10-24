# Continuación de la misión REA y editor autónomo · 24/10/2026

## Estado verificado de estabilidad
Producción: b84067d83f62bafe506758400f6eec16ace9c7d4. Cambios aislados y probados antes de desplegar; copia verificada y rollback conservados. Whisper sigue activo.
- El arranque comprueba la sesión antes de mostrar credenciales. Errores transitorios no se presentan como cierre de sesión.
- Proxy privado 720p para previsualizar; el MP4 1080p de exportación permanece intacto.
- Prueba de vídeo real: 12.895.862 → 2.302.947 bytes (82% menos). HTTP HEAD 200 y Range 206.
- Generación inicial observada: 27,57 s para el clip de 13,41 s; 98,3 s para el maestro de 68,63 s bajo carga. Caché precalentada para ambos; nuevos renders preparan el proxy antes de DONE cuando sea posible.
- Navegador de revisión: sesión existente recuperada, vídeo con readyState=4 y 13,4 s cargados, reproducción llega al final; recarga recupera el proyecto y el vídeo sin credenciales. No acredita ausencia de stalls medidos ni experiencia Android.
- 19 pruebas específicas de estabilidad previas PASS. El seguimiento del búfer muestra rangos reales; carga completa opcional privada en memoria.

## Investigación recuperada, sin reinstalar ni duplicar
REA 6.7.0 ya operativo en entorno aislado. Ver SUES_REA_FINDINGS_20261024.md.
CapCut: tres scripts públicos de bootstrap analizados. Captions: mapa público de dependencias analizado; bundle completo excedió el heap y chunks individuales devolvieron 403. No se intentó eludir el acceso.
Son evidencias de separación de carga, borradores, estilos y planes; no revelan el cerebro de IA ni algoritmos privados. Las capacidades anunciadas oficialmente se distinguen de mecanismos comprobados. No hay código propietario copiado.

## Referencia creativa disponible
VID_20261022_101557_201.mp4: 55,91 s, vertical 1080×1920. Revisión de 56 muestras a 1 fps:
texto en arco/perspectiva sobre torso, cambios fuertes de escala, palabras blancas y acentos cálidos, planos de apoyo, pantallas tipográficas y composición por capas. No se incorpora su metraje ni sus marcas al resultado SUES.
Escaneo adicional de diferencias de escena: 27 detecciones con umbral FFmpeg 0,3 a 270×480. No equivale a contar 27 cortes: los flashes y efectos también producen detecciones.

## Mapa de las cinco capacidades
| Capacidad | Existe y se reutiliza | Pendiente para el objetivo |
|---|---|---|
| Analista | Whisper local, tiempos, análisis técnico, fotogramas, pruebas VLM locales aisladas | Comprensión visual continua, gestos y contexto contrastado; no inferir emociones como hechos |
| Director | Reglas editoriales, catálogo privado, contrato externo validado, nuevo límite de propuestas de modelo | Dirección narrativa fiable, selección y montaje cercano a 60 s, B-roll semántico general |
| Ejecutor | FFmpeg/ASS, captions progresivos, escalas y colores, gráficos, B-roll, SFX, mezcla, transiciones, proxies | Cortes/velocidad generales coordinados con todas las capas; máscaras automáticas de persona |
| Crítico | Decodificación completa, loudness, sincronía técnica, fotogramas reales, auditorías AV | Crítica audiovisual multimodal fiable del archivo final y escucha subjetiva contrastada |
| Mejora | Versiones reversibles y correcciones explícitas existentes | Bucle automático con presupuesto, reparación, render y comparación artística; no cerrado |

## Nuevo código en rama de investigación
src/model-director.js crea peticiones ligadas a fuente/captions y transforma únicamente decisiones válidas de énfasis en operaciones existentes. Rechaza IDs, índices, estilos, campos, duplicados y análisis obsoletos. Los ejemplos copiados se rechazan. Las observaciones VLM se etiquetan parciales y no verificadas. No convierte una descripción en seguimiento o máscara.
scripts/model-director-qa.mjs prepara la petición, valida la respuesta, compila y renderiza una variante sin sobrescribir el original.
scripts/run-local-model.py ejecuta únicamente un modelo ya disponible, sin descargar ni llamar APIs, con límite de tokens/tiempo y registro de hashes.
scripts/audit-render.py examina un MP4 decodificado, duración, inicio de streams, True Peak y muestras reales. Los contadores planificados no se presentan como prueba audiovisual.
Este puente cubre énfasis seleccionados por modelo; no es el editor autónomo completo y no habilita el botón de producción.

## Pruebas locales de modelos
Runtime oficial llama.cpp b11669, sin puertos expuestos ni red durante inferencia.
SmolVLM2-256M reconoce presentador/interior de coche en una muestra del bruto. Es evidencia parcial, no seguimiento ni análisis de todo el vídeo.
Qwen3-0.6B Q8 falla como director: una prueba copia transcripción y otra formato de ejemplo/saludos. Descartadas; no aplicadas. La salida JSON restringida del runtime falló al inicializar samplers.
Se prepara evaluación aislada Qwen3-1.7B desde pesos oficiales Apache-2.0 con revisión/hash fijados. No se atribuye calidad profesional por descargar o ejecutar un modelo.
Sin claves ni coste de API; no se han contratado servicios ni modificado otras aplicaciones.

## Estado de entrega
El editor automático DOPAMIN solicitado sigue abierto. No se declara V1, aprobación humana ni incremento del 48% oficial. La estabilidad publicada y los experimentos de IA están separados.
Los informes de descubrimientos, mapa y arquitectura viven en este repositorio. Las pruebas y medios privados permanecen fuera de Git.

## Evidencia posterior · 25/10/2026, hora de Madrid
La prueba Qwen3-1.7B Q4_K_M completa tarda 181,90 s: prefill 23 tokens/s y generación 4,1 tokens/s. El resumen recoge el tema general, pero las decisiones incluyen pasaba, unos y un ID inexistente para regularidad. El validador rechaza la propuesta; no se aplica al proyecto. Se hace una única revisión acotada con errores exactos y crítica narrativa del agente Work. Esta asistencia se identifica como tal; no es autocrítica audiovisual integrada en producción.
Se corrige además un falso rechazo de vigencia provocado sólo por orden distinto de claves JSON en observaciones equivalentes. La fuente y los captions siguen ligados por hash y comparación canónica, con prueba de regresión y rechazo de datos alterados.
El puente permite silenciar énfasis de reglas no seleccionados conservando overrides explícitos existentes. No se aplican parcialmente planes inválidos y no se alteran versiones anteriores.

Crítico técnico probado sobre el MP4 real de 68,634 s:
- SHA256 81f4ef4820280ec8ae25fd9c93b74bda418dce6e054e7d690bb0374369170132; 32.560.708 bytes.
- Decodificación completa PASS; audio presente; −15,57 LUFS integrados y −2,01 dBTP.
- 16 fotogramas de captions y hoja de 35 muestras generados; hoja revisada visualmente por el agente.
- Se ven rótulos, escenas gráficas y dos B-roll; la composición sigue demasiado fija frente a la referencia. Los contadores de seis transiciones y música planificada no prueban por sí solos percepción audiovisual.
- La toma del coche no se usa como aceptación creativa final, conforme a las instrucciones existentes. No hay escucha humana ni aprobación de Carlos.
Este MP4 es la variante previa conservada, no un nuevo render producido por el modelo local. No se presenta un plan rechazado como flujo completo ejecutado.

Bloqueo de calidad actual: los modelos locales probados no sostienen todavía una dirección fiable. El analista visual sólo ha sido probado en una muestra; el crítico creativo y el bucle de mejora general no están integrados. No se habilita el botón automático ni se declara el editor terminado. La investigación REA no proporciona un algoritmo privado que resuelva esta carencia.