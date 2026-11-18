# SUES AI VIDEO EDITOR · V1 · Sincronía en montajes con cortes y voz V8

**18/11/2026 · PR #27 · validación aislada.** Base de trabajo: `13b44cc770a0bfd87d278358328d9a03015701c4`. Etapa 2 de 4, plan ejecutable. Estimación a cierre de este bloque: V1 50 %, etapa 65 %.

## Hito verificado

El preflight existente emplea las utilidades del mapa temporal del editor. Reconstruye el reloj editado, comprueba los offsets y fusiona divisiones de cámara que conservan la continuidad del bruto. Traslada intervalos íntegros de palabra de la fuente al montaje y rechaza una palabra que se haya recortado o eliminado. Se siguen rechazando mapas inconsistentes, reordenamientos, repeticiones y cambios de velocidad. Los preflights de mapa identidad mantienen la representación anterior. La revisión maestra verifica las nuevas evidencias antes de aceptar el borrador.

En el VPS aislado, la regresión privada leyó la transcripción ASR y los 18 clips V1 auténticos del Reel V18. Comprobó el SHA del original y el del proyecto. Sobre la cobertura continua de V1 hasta 55,0667 s, reprodujo inicio F1488 y entradas relativas **8, 14, 17, 29 · 89, 103, 108, 111**. El proyecto completo llega a 55,5667 s, medio segundo fuera de esa cobertura de V1. La prueba verifica los tiempos del tramo cubierto con los anclajes de referencia previamente documentados, sin atribuir al usuario su selección y sin modificar el Reel. Queda pendiente probar el flujo normal completo con un proyecto auténtico.

El MP4 nativo de V8 de 2,93 s contiene un desplazamiento medido de **+0,379 s** respecto al audio original sin recorte (correlación 0,8383 al alinear). El adaptador de muestra configuraba `in: .4`, aunque el guion y la referencia V8 usan el reloj del bruto desde cero. Se corrigió la orden de voz a `start: 0, in: 0` y se añadió una regresión. El MP4 anterior se conserva como evidencia. La sincronía del nuevo render queda por escuchar y medir.

Pruebas dirigidas en el checkout de desarrollo: **50 PASS, 0 FAIL, 6 SKIP**. En el VPS, **11/11** pruebas del mapa y **4/4** de Asset-First con los PNG existentes, más la comprobación V18 descrita arriba. La suite base en este entorno ya presenta seis fallos ajenos a este bloque: tipografía reflectante, proveedor local, staging de recursos privados, dos pruebas del proveedor Shotstack desactivado y un render FFmpeg con límite de memoria.

## Inicio del siguiente hito

La pantalla de revisión del Master Director presenta **inicio, fin y duración por operación**, en el mismo registro que conserva su ID, tipo y parámetros. La prueba Chromium con seis operaciones solapadas comprobó voz, A-roll, motion, música y dos efectos independientes a 390 y 1280 px. Usó la función real de la vista y datos de prueba en el navegador aislado, sin auditar todo el editor.

El mismo MP4 tras cambiar únicamente Fontconfig no permite atribuir una sustitución de fuente al compositor. Las dos bibliotecas privadas ya tenían `Montserrat.woff2`. Una prueba en Chromium real con el servidor FableCut aislado confirmó que el navegador recibió y cargó Montserrat como variable `1 1000`. Canvas midió «QUÉ PEREZA» a 145 px con resultados distintos para Montserrat 900 (1003,690 px), Montserrat 400 (971,355 px) y sans-serif 900 (1023,921 px). La comprobación del nuevo MP4 y el relieve siguen pendientes.

La suite completa en el entorno local dio 970 PASS, 6 FAIL y 23 SKIP tras los cambios de mapa y voz, frente a 966 PASS, 6 FAIL y 23 SKIP del checkout de control. Coincidieron los seis fallos por nombre. A continuación se ejecutaron 7/7 pruebas dirigidas de interfaz, HTTP y sesión para el cambio de la vista.

## Siguiente hito abierto · V8 completa, 18,2 s

La secuencia nativa previa contiene voz y tapiz durante 18,2 s, y añade PFFF, sofá y dos títulos desde F459. La apertura A-roll, los gráficos y títulos anteriores, la transición del tapiz y el tratamiento tipográfico de la referencia aún no están representados en aquella secuencia. Se comprobó este alcance contra las operaciones nativas guardadas y el código de la referencia existente.

Usar el original, los PNG y la referencia V8 existentes. Antes de editar, recuperar la selección de palabras y la revisión creativa exigida, y comprobar la correspondencia de cada capa con las capacidades del editor. El criterio de cierre es un plan con tiempos por registro, exportación completa en clon, revisión de la voz corregida y dos pasadas audiovisuales con evidencias. La siguiente etapa es repetir el flujo normal con un Reel completo. La PR #27 es la línea de integración. Mantener los originales, el despliegue público y los trabajos B05 aparte.
