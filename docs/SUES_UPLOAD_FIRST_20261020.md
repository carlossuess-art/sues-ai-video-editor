# Nuevo proyecto: subir → confirmar → prompt → ajustes

Corrección pedida por Carlos tras revisar240632a. Se conserva el proyecto y su
motor. Se cambia HTML/JS/CSS y el shell PWA(v15), y se añade persistencia
privada del encargo en metadatos del upload, sin alterar vídeo ni análisis.

- Subir vídeo es la primera acción. Abre el selector y empieza la subida al
  elegir archivo; no exige pulsar otro botón ni ver ajustes previamente.
- Barra de progreso y mensaje debajo. El verde y «Subida completada» aparecen
  sólo tras HTTP201 del servidor, que valida el vídeo.100% transferido antes
  de esa respuesta no equivale a subida confirmada. Fallos muestran error y
  permiten seleccionar de nuevo el archivo, sin falso éxito.
- Después aparece debajo el prompt y Enviar prompt. No se muestran herramientas
  ni el botón de generar antes de enviarlo. El envío obtiene una propuesta real
  de ajustes; si es compatible, abre revisión/herramientas y generación. No lanza
  un render por enviar instrucciones ni declara ejecutada una petición desconocida.
- Recargar un proyecto preparado antes del envío conserva ese paso. Los proyectos
  ya existentes siguen abriéndose en el editor. Recuperación/material guardado
  permanece en un desplegable secundario y explícito.
- Material sin análisis: subida verde porque sí está guardado y campo de encargo
  visible; envío permitido para guardar el encargo asociado a los bytes del vídeo. Se
  explica que falta análisis para generar; no se finge haberlo ejecutado. El
  proyecto pendiente aparece en el dashboard y recupera el prompt al reabrirlo
  o recargar. El brief es privado, acotado a4000 caracteres y persistente en el
  servidor. No se activa ASR/modelo/pago ni se confunde con una subida fallida.

## Pruebas

244 Node PASS, npm run check y diff --check PASS. Chromium145 real escritorio y
móvil con selección de archivo, subida HTTP real y FFprobe real: rechazo de vídeo
inválido, reintento, progreso, verde100%, orden visual, envío antes de herramientas,
recarga, y fuente desconocida sin heredar análisis, guardado de su prompt y reapertura
por dashboard/recarga. Un test HTTP adicional con probe sustituido comprueba
límites, privacidad401, hash ligado al upload y persistencia tras reiniciar. Se retrasa únicamente el fin
de la respuesta201 real para comprobar que el prompt no se adelanta. No se
sustituye la validación ni la respuesta de éxito. Fuente original intacta.

La solicitud de generar queda QUEUED con zoom correcto; autoStart desactivado en
el arnés, por lo que NO se ejecuta render en este ensayo. El motor no cambia;
no atribuirle un nuevo render remoto. Evidencia:
examples/preview/upload-first.chromium-result.json. Los primeros intentos de QA
fallaron por binario temporal ausente, interceptación binaria del arnés y fixture
sin hash; se corrigieron y no cuentan como PASS. Resultado final ambos tamaños
sin errores JS ni overflow, con capturas revisadas.

La primera corrección de orden se desplegó como a55e57d con systemd SUCCESS/0,
backup verificado y215 archivos anteriores intactos. Esta ampliación de briefs
está probada localmente y pendiente de integrar/desplegar al escribir este punto.
