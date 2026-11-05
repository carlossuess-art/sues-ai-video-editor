# SUES MASTER DIRECTOR · previsualización integrada en desarrollo · 04/11/2026

Rama feat/master-director-story-orchestration-20261104; código aislado, sin deploy ni merge. El cerebro y la misión siguen INCOMPLETOS.

## Avance

- El editor de desarrollo conecta revisión/decisión/edición de capas con una ruta autenticada que realiza preflight de fuente y un render privado Remotion, únicamente si el servidor dispone de configuración explícita y política confiable. Sin política/configuración devuelve bloqueo. Ni los paths del renderizador ni el registro se aceptan del navegador.
- El preflight comprueba aprobación actual, hash de fuente, dimensiones, audio y todos los timestamps de vídeo para exigir CFR 30 comprobado; rechaza SAR/rotación, cortes fuera de fotograma o escalado no admitidos. Proyecta cada tramo de la línea temporal sobre el vídeo y el audio fuente. Revalida la aprobación tras el análisis y antes/después de render/auditoría. No se hace ningún render cuando una operación no tiene traducción fiel.
- El renderizador guarda una previsualización privada 270×480 no final, materializa recursos/fuentes en un directorio temporal y borra las copias temporales tras el render. El audio original, las capas admitidas y sus tiempos se conservan por separado como especificación. La previsualización es un MP4 aplanado para revisar: NO es el proyecto editable.
- Auditor separado de decodificación comprueba SHA de origen/salida, H.264/AAC, duración, FPS, dimensiones y decodificación completa. El resultado mantiene explícitamente pendiente escucha, pertinencia semántica, máscaras, experiencia audiovisual y aprobación creativa. El servidor sella y permite ver mediante sesión y Range solo previews con auditoría técnica correcta; requestId evita duplicados. Cambio de evidencia invalida la aprobación y descarta la salida sin sello. UI permite generar, reproducir y volver a abrir previews anteriores, además de seleccionar versiones de plan.
- `masterPreviewConfig` y `masterDirectorContext` son configuración de arranque exclusivamente del servidor. No se han activado en producción. No habilitar por defecto sin documentar dependencias, fuentes, licencias y rollback.

## Evidencia

- 130/130 Node dirigidas PASS sobre copia del editor productivo con parche selectivo; Chromium PASS en escritorio y móvil con proveedor, renderizador y auditor simulados, incluida aprobación, preview/historial y edición/recuperación de versión. La prueba de navegador NO equivale al test de vídeo real.
- En entorno aislado: prueba HTTP autenticada completa con fixture audiovisual sintético de 24 s y fuente a 30 fps; el renderizador Remotion real creó 720 fotogramas con audio y texto, auditor independiente de proceso verificó decodificación íntegra, la descarga Range devolvió MP4, y repetir el mismo requestId reutilizó salida sin renderizar de nuevo. Los documentos de reglas y proveedor de esa prueba son sintéticos.
- Sobre `source-cfr30.mp4`, copia NORMALIZADA de 65,1 s de la toma 158404 (no es el Reel completo ni incluye necesariamente CTA): probe local verificó 1.953 fotogramas CFR30, 1080×1920 y un audio, SHA ab3020f205e60dc4eed05a1ac5c282081ce82a292699c1180592ea12efa0be85. Se renderizó solo el primer segundo como prueba técnica privada 270×480 con rótulo «PRUEBA TÉCNICA». SHA salida 8a0120f870e0a73f4af184cb84c1f7b9011eac1939d637c1768d21299f88c70d. Auditor técnico independiente de proceso PASS (H264/AAC, audio, 30 fps, decodificación completa). Comparación de imagen sin rótulo en zona superior: PSNR medio 42,27 dB; audio RMS original/salida 0,06802/0,06794 y desplazamiento aproximado 0 ms. No es escucha ni revisión artística.
- La prueba inicial de 65,1 s superó el límite de espera HTTP; una segunda se detuvo por consumo de memoria alto antes de producir salida. No se obtuvo un pase completo. Se implementó solicitud asíncrona con estado persistente, recuperación segura tras reinicio y control de memoria; la repetición con memoria limitada mantuvo margen disponible pero alcanzó el límite de render de 10 minutos y quedó bloqueada sin salida. Se amplió el límite a 30 minutos y se distingue el timeout. La repetición PASS en `/tmp/sues-master-158404-extended-e2e.log`: 1953 frames, 65,109 s, 270×480, 12.069.987 bytes, SHA256 salida `84489cd837f55d1a147adbddfdedaf452148b6ef6bcb11d5fb36b6ee7306d3b9`; audio presente, decodificación íntegra, auditoría técnica separada, Range e idempotencia PASS. La auditoría declara pendientes imagen, escucha, máscaras, sincronía semántica, narrativa y aceptación humana. El plan y contexto son simulados: no representa montaje final ni aprobación creativa.
- La suite amplia anterior produjo 525/529: dos fallos reproducidos en base productiva por tests obsoletos, uno falta de git en contenedor (host PASS) y otro documento ausente en la copia (corregido). Repetir suite final con estos cambios y adecuar tests a comportamiento productivo antes de cierre.

## Pendiente

Registrar y verificar realmente la procedencia/derechos de los tres tapices (presentes pero sin metadatos V2), instalar política solo en entorno autorizado y validar el contexto de las 20 reglas sin fingir su implementación completa. Añadir efectos, keyframes, máscaras corporales dinámicas y otros motores sin sustitución; integración de biblioteca, mezcla musical y voz más elaborada; funcionamiento autónomo auténtico; recuperación portable de versiones y recursos; vista previa coherente con la exportación final y comprobación móvil; pruebas de regresión completas y dos auditorías audiovisuales independientes sobre un Reel real con plan narrativo revisado. El fragmento técnico y el MP4 sintético no satisfacen el criterio artístico. Carlos conserva aprobación creativa final. Sin gastos nuevos, publicación ni despliegue.

Solo al completar y estabilizar el contrato volver al chat normal para adaptar SUES AI Film Director.

## Robustez de previsualización

La petición ahora devuelve control inmediatamente y la interfaz consulta el estado sin bloquear la sesión. La salida solo se sella tras auditoría; peticiones interrumpidas requieren diagnóstico y no se ejecutan de nuevo silenciosamente. El render limita cachés y memoria de Node, copia medios en streaming y se detiene si queda poca memoria. Con estos límites se repitió satisfactoriamente el recorrido autenticado sintético de 24 s, incluido audio, auditoría, Range e idempotencia. Sin despliegue.

- Actualización: batería específica en copia aislada 113/113 PASS; la prueba del guardián de memoria en el árbol de trabajo 2/2 PASS. Exportación real de regresión móvil con imagen y dos capas musicales PASS, independientemente de la integración Master Director. La suite general sigue en curso; un contenedor de 384 MiB bloqueó correctamente la prueba de preview, que exige 512 MiB disponibles y pasó en host.

## Regresión adicional con dependencias montadas

548 pruebas: 543 PASS, 5 fallos. Dos se reproducen en la base productiva sin el parche (cola de fragmentos y límite de biblioteca). El test Git falla en la imagen sin Git, y pasa en host. La prueba de preview falla con el límite de contenedor 384 MiB frente al mínimo de 512 MiB, y pasa en host. La composición real con máscara FFmpeg falló al crear el fixture en 384 MiB y pasó al repetir exactamente esa prueba en contenedor aislado de 768 MiB (1/1). La suite completa no se puede declarar 548/548. La prueba extendida 158404 pasó técnicamente; sin conclusión creativa ni de exportación final Master Director.

## Curvas de animación · continuación

El adaptador admite ahora `linear`, `ease-in`, `ease-out` y `ease-in-out` con curvas cubic-bezier CSS estándar, aplicadas al tramo que termina en cada keyframe, por propiedad; se conservan posiciones, tiempos y parámetros originales. `spring` sigue bloqueado: no existe un contrato reproducible de masa, rigidez y amortiguación. Pruebas unitarias de extremos y valores intermedios, rechazo de spring y preservación del plan: 8/8 PASS; TypeScript PASS. Un fotograma Remotion sintético a mitad del tramo mostró posiciones distintas conforme a la curva (x 90–94 lineal y x 62–66 ease-in a escala 0,25). No es prueba artística ni de un Reel real. Sin despliegue.

Regresión específica posterior en copia aislada del editor: 114/114 PASS.

El editor de la rama incorpora selector de curva por keyframe (desde el segundo), conserva valores no modificados y guarda cualquier cambio en una nueva versión que requiere revisión. En navegador aislado se verificaron revisión, aprobación, selección de curva, edición y conservación de versión tanto a 1440 como a 390 píxeles; proveedor y render de esa prueba son simulados. No es despliegue ni prueba creativa.

Los controles de capa permiten editar valores existentes de keyframes: tiempo, desplazamiento, escala, rotación y opacidad; se mantienen intactas las propiedades ausentes. El cambio crea revisión nueva y el validador posterior verifica tiempos y compatibilidad. Chromium escritorio y móvil PASS con fixture simulado, incluyendo modificación y recuperación de versión previa. No se han probado aquí máscara dinámica ni Reel creativo.

Prueba adicional de recorrido completo con animación ease-in-out: fuente y política sintéticas de 24 s, aprobación autenticada, render real Remotion 720 fotogramas con audio, auditoría técnica separada y decodificación completa, Range e idempotencia PASS. SHA256 `c15de5904b3b6097ea381b34015d71e186a1d7877df5a31ab78c85634141fdfd`. La auditoría mantiene la calidad visual, movimiento y narrativa pendientes de revisión humana.

## Reel 158541 aportado por Carlos · prueba técnica aislada

Archivo ya editado de 13,2 s, H.264/AAC 1080×1920, 30fps. Observación de fotogramas del original: presentador y textos al principio, gráfica con cuadrícula y CTA de marca al final. No confundir con un bruto ni inferir historia adicional o transcripción. Original privado conservado, SHA256 `e44f8c083390dd4fa5a48a3b67e9e5735504e9856d303b1d3cd703440a99e3b9`; no se ha publicado ni subido a GitHub.

El probe bloqueó correctamente el archivo original con `SOURCE_GEOMETRY_UNVERIFIED`: no declara sample-aspect-ratio. Para probar, se creó una copia aislada asumiendo píxel cuadrado 1:1 mediante ajuste de metadatos H.264 sin recodificar, SHA256 `e099b993d782bcf310f0a3285f23e1a01aa3408b8421e00e0a967a93f9511841`. Comparación FFmpeg framemd5 de TODOS los fotogramas decodificados del original y copia PASS; no establece la proporción pretendida en origen.

Con plan, transcripción y política de fixture simulados (NO son análisis del Reel), backend autenticado y Remotion generaron preview técnica privada 270×480 de 396 frames, con texto de prueba y curva suave. Salida SHA256 `be5e1ffd951ce6aa8f7a95151d5388e63aaa17c560d2a901321e6782f3cf56d0`. Auditor técnico independiente de proceso: 13,205 s, audio presente y decodificación completa PASS; Range e idempotencia PASS. La auditoría declara pendientes revisión visual y escucha completas, movimiento, máscaras, sincronización semántica, narrativa y aceptación humana. No equivale a Reel editado por el cerebro ni validación creativa. Copias privadas temporales bajo `/tmp/sues-158541-qa` y fixture aislado `/tmp/sues-editor-abOs1c`; al poder perderse /tmp no son archivo durable.

## Recuperación de errores de preview

Se corrigió el reintento tras estado terminal BLOCKED o FAILED: se usa un nuevo identificador, pues el anterior conserva su resultado idempotente. Cuando la solicitud es INTERRUPTED o existe incertidumbre de conexión, se conserva el identificador para no duplicar renders. La interfaz informa de la geometría no verificada sin asumir SAR. Smoke Chromium escritorio y móvil: fallo de geometría simulado → reintento → preview lista, revisión y recuperación de versión PASS. Sin despliegue.

## Prueba con un bruto de Drive · 05/11/2026

Grabación de práctica de tercero de 30,2 s: Whisper local generó 113 palabras con tiempos, sin validación auditiva humana. Se elaboró un plan preliminar basado en la transcripción y se ejecutó en entorno aislado con política y evidencia visual simuladas. Dos previews privadas, 906 fotogramas a 270×480 con audio, auditoría técnica independiente, decodificación completa, Range e idempotencia PASS. Primera revisión de muestras detectó texto próximo a la cabeza y se corrigió en V2; 15 muestras cada 2 s de V2 sin texto sobre rostro observado, no revisión exhaustiva; texto puede cruzar manos. La comparación numérica de audio V1 arroja correlación 0,999968, no escucha crítica. Sigue sin cumplir la calidad DOPAMIN: faltan recursos con derechos, música/SFX, captions completos y revisión. Derechos de protagonista y recursos no verificados: solo uso privado, sin publicación. La fuente, transcripción, planes y versiones se conservan en directorio privado en el VPS; nunca subirlos al repo público.

La prueba no demuestra funcionamiento del proveedor real de contexto ni implementación de las 20 reglas; no reemplazar producción con la rama completa. No se ha desplegado.

## Arco narrativo basado en fases documentadas · 05/11/2026

El proveedor de contexto prepara ahora la política `reel-observed-v2`: el plan debe tener arco ordenado y cada tramo declarar evidencia comprobable de transcripción o fotograma, pero no se obliga a inventar gancho, caída, moraleja u otras fases ausentes. Se registra y muestra cuáles fases habituales no están documentadas; no se afirma que no existan en el material, solo que el plan no las documenta. Se conserva el modo estricto `reel-v1` para compatibilidad y se mantiene la validación de secuencia y cobertura. El cambio del contexto invalida aprobaciones anteriores para que se revisen de nuevo.

No equivale a comprensión automática completa del vídeo: una marca temporal verificada no demuestra interpretación semántica, revisión íntegra de imagen ni transcripción correcta; `frameEvidence` real todavía está vacío. No se ha activado en producción. Pruebas: 27 dirigidas PASS, 116 específicas en copia aislada PASS, Chromium escritorio/móvil PASS con contexto de prueba simulado.

Prueba adicional con el bruto privado: cinco fases documentadas de la transcripción local (113 palabras) y moraleja no documentada. El proveedor de contexto y decisiones se ejercitaron con las 20 reglas; revisión, decisión y compilación de cinco capas PASS. Los derechos de los tapices son fixtures simulados, no evidencia comercial; imagen completa, escucha y aceptación creativa pendientes. Prueba privada reproducible registrada junto al material, no incluido en Git. También se comprobó que un plan sin arco se bloquea.
