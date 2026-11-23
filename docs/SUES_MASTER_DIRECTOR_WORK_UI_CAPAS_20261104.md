# SUES MASTER DIRECTOR · revisión web, versiones y prototipos de medios · 04/11/2026

Continuación de la rama de trabajo sobre el árbol 6bed24df2d75fee166d965cb38b3ba060d453f90. Desarrollo aislado, NO desplegado y NO terminado.

## Añadido

- En la interfaz de plan existente: revisión narrativa, lista de recursos con enlaces seguros, botones de aprobar / revisar / encárgate de todo y estado explícito de que la decisión **no inicia** una edición. Se conserva el flujo anterior del Director IA.
- Visualización y recuperación de versiones inmutables del plan de cada trabajo. Antes de abrir otra se guarda el texto actual si es una historia válida; no se sobreescribe la versión anterior. Recargar una versión exige revisarla de nuevo.
- Para capas Remotion disponibles, controles de posición, tamaño, tiempos, texto, opacidad, volumen y fotograma de entrada cuando el parámetro existe. Guardar crea una historia nueva; no cambia directamente el render ni transfiere la aprobación. Las máscaras, curvas y otros parámetros conservados aún no tienen controles propios; no declarar editables todos los parámetros.
- Adaptador Remotion experimental admite vídeo de biblioteca con duración, in-point y reproducción silenciada explícitos, además de texto/fuentes verificadas, imagen, máscara alfa estática y audio individual. Limita lo que acepta y bloquea el resto. No implementa todavía compositor completo con vídeo original, máscaras de sujeto dinámicas, seguimiento, diseño sonoro, ni preview/ejecución automática desde el editor.
- Script `scripts/app/smoke_master_director.mjs` ejecuta navegador real con provider y medios de fixture (sin gasto) en escritorio y móvil. Verifica revisión, decisión, cambio de posición/tiempos/texto, recuperación de versión, errores JS y desbordamiento horizontal.

## Comprobaciones

- 121/121 pruebas Node dirigidas PASS sobre copia aislada del código productivo con parche selectivo del servidor y UI. El provider positivo usa datos de prueba, no el registro real; no es prueba de despliegue.
- Chromium headless y Playwright: PASS a 1440 px y 390 px para revisión/aprobación, edición reversible y recuperación de versión. No equivale a aceptación estética de Carlos.
- Remotion: vídeo sintético multicolor de 60 fotogramas recortado desde el fotograma 15; el MP4 resultante empieza verde y acaba azul, como se esperaba. Composición conjunta de vídeo, texto Montserrat Bold real y SFX sintético: fotogramas inicial/final verdes/azules, texto ausente en fotograma 0 y presente en 12 (650 píxeles claros de muestra), RMS audio 0 antes, 0,05176 durante y 0 después de la ventana; 30 fotogramas 270×480 como ensayo. La licencia del medio fue simulada en la prueba: no afirma derechos del proyecto real ni mezcla profesional.
- Con máscara estática sintética se verificó alfa 255 izquierda / 0 derecha. No prueba máscara corporal en movimiento.
- Regresión amplia anterior 525/529 con las reservas documentadas en SUES_MASTER_DIRECTOR_WORK_AVANCE_CONTEXT_20261104.md; queda repetir completa con el código final y tests ajustados a las funciones productivas actuales. Ninguna de las pruebas demuestra que se haya montado el Reel 158404 ni las dos auditorías completas.

## Pendiente

Habilitar contexto real con evidencia de los masters y recursos, conectar la ejecución real en cola a Remotion sin degradar el plan, fuentes/sonido/máscaras disponibles durante preview y export, editar el resto de parámetros y keyframes, integración de snapshots con backup y recuperación, restauración de todos los recursos, pruebas de proyectos anteriores, audio/imagen de extremo a extremo y dos auditorías independientes completas en un Reel real. La política real permanece sin instalar; decisiones de prueba no ejecutan trabajo. No copiar el `editor-server.js` o la UI enteros de la rama antigua sobre producción: el código de producción contiene funciones posteriores y debe recibir un parche selectivo con pruebas. No desplegar sin autorización, no publicar ni gastar API.

Solo tras estabilizar el contrato y completar el trabajo: preparar informe de intercambio con ChatGPT y volver al chat normal para adaptar SUES AI Film Director.
