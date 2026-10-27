# Recursos detrás del sujeto · bloque revisado · 19/10/2026

Base: PR3, commit0d857ac2221dff5d8366e6eb203a6e1576d8849c.
Rama de trabajo: feat/reviewed-subject-depth; sin desplegar ni fusionar en la oficial.

## Motor integrado

`subject-layers.js` permite ilustraciones propias/licenciadas detrás de una máscara
raster revisada. Alfa del recurso × (1 − máscara) deja intactos los píxeles del
sujeto y conserva el plano original como fondo. Subtítulos/efectos globales se
componen después. Los recursos pueden tener deriva vertical y fades independientes.
No se suplanta el contorno con una caja de cara.

Contrato privado `subjectLayersPath`: version1.0,sourceSha256,matte yevents.
Matte local FFV1/gray1080×1920/30fps de la misma duración y SHA verificable; método
manual-rotoscope-raster-v1 o guided-grabcut-v1, estado reviewed, rangos revisados.
Scope upper-body obliga a reviewedRegion y limita el recurso a esa región; no se
extiende una validación parcial al cuerpo completo. El modo full-visible-subject
requiere su propia máscara revisada; su existencia en contrato no demuestra que
se haya obtenido para esta muestra.

Sólo fuente full-frame, timeline íntegro sin recortes/reencuadres adicionales.
Rechaza solapes con zooms, motions, tarjetas, ELEMENTS, imágenes o B-roll; márgenes
de captions/cierre protegidos. Un nuevo original no hereda el binding. El renderer
comprueba procedencia, formato, duración y hashes antes/después. La copia nativa
incluye matte/recursos; el verificador valida también sus rutas anidadas para
rechazar referencias fuera del paquete. El toggle de recursos desactiva estas capas.
Importación por perfil local, sin nuevo selector/subida de máscaras en la UI.

## Muestra concreta que Carlos compara

12s de la toma interior original ya autorizada, desde0.073125s. Se preserva el
bruto y se usa un derivado de12s para esta prueba. Dos ventanas:0.25–1.4s y8.2–8.9s,
región superior y hombros hasta y1100. Código digital, geometría/luz cálida propios,
texto editorial delante, blur/destello global y SFX originales con música existente.
Los rótulos son copy editorial, NO transcripción ni alineación inventada de la voz.
No nuevo ASR, Director LLM o selección semántica automática. No se afirma parecido
completo con Keanu: aquí se contrasta profundidad/composición en un original real.
CALMA reutiliza el mismo compositor y puede usar una de las dos ventanas/una transición.

Se ensayó GrabCut guiado y propagación por optical flow con OpenCV local opcional.
Cinco candidatos mostraron deriva, pérdida de manos o incorporación de pared.
No se aprobaron como segmentación corporal automática. La entrega usa corrección
manual raster de los contornos superiores y se acota a los intervalos revisados.
Una inclinación posterior dejó de encajar y se excluyó del evento. Se mantienen
pendientes cabello fino, brazos/manos y seguimiento de cuerpo completo; no elevar
F6 por disponer del compositor. El helper offline produce estado unreviewed y
rangos vacíos; el renderer no convierte su resultado en material aprobado.

OpenCV5.0.0.93/Numpy2.5.4 se instalaron únicamente en runtime ignorado para ensayos;
no son dependencias nuevas del servidor. No pesos descargados, servicios de IA,
compras o cargos. Fundamento técnico de GrabCut y corrección con guías:
https://docs.opencv.org/4.x/d8/d83/tutorial_py_grabcut.html .

## Validación

207tests Node ycheck/Pythoncompile/diffPASS. Prueba real de FFmpeg: píxeles
interiores de una máscara de control idénticos al plano limpio, recurso visible
fuera y zona inferior intacta. Rechazo de binding/tiempo/revisión/crop/solape,
copia/restauración ASS/filtro, manipulación de hash y ruta anidada fuera del paquete.

Entrega final1080×1920/30fps,H264/AAC,12.00s,8275828bytes:
SHA816d3bb6c1ea77b6048ed650e49b654c129d79626e766d59b9a3645c10d471a1.
DecodePASS, fuente preservada, once fotogramas finales revisados. Comparación
original/resultado sincronizada1080×960,12s,5975670bytes. Revisión visual interna;
sin escucha explícita ni QA navegador; aceptación visual posterior abajo. Un render intermedio fue rechazado
por cambio de hash de máscara; se recodificó a archivo nuevo completo y se revalidó,
sin eliminar comprobaciones de integridad.

Vídeos persistidos: comparativa libfile_375c09bd02208191a5e08aa1ec9369b4 y vertical
libfile_e288cc7634488191b40a55117ab806fb, ambos versión0. Archivo técnico privado
libfile_f8cfb62e98248191bdddb90283de42cf,36945920bytes,versión0. Este último es un
estudio reproducible con vídeo,matte,recursos,fuentes,bundle yreplay; NO es un TAR
de recuperación para subir al botón de la app. Su replay se ejecutó con decodePASS;
el MP4 no es bitidéntico:347/360frames decodificados coinciden. No se promete
replay byte a byte; los assets/fuentes/matte conservan sus hashes. Evidencia en
examples/preview/reviewed-subject-depth.result.json.

## Continuación

Carlos responde «Lo veo bien» el19/10/2026: muestra visual aceptada para esta
composición y contornos. Conservarla al reutilizar o extender la receta. Máscara corporal general, segmentación autónoma, motion library completa,
Director y QA navegador siguen pendientes. No nuevo despliegue, WhatsApp,Caddy oDNS.
Fase6 sigue abierta; no V1 ni estimación porcentual nueva por recuento de pruebas.


## Receta reutilizable y conservación del resultado

`prepare_depth_study.mjs` acepta un sexto argumento opcional RECIPE_JSON;
por defecto usa `examples/templates/reviewed-depth.recipe.json`. Reutiliza plantilla,
marca, fuentes y música del proyecto existente; los rótulos siguen siendo editoriales.
La receta declara etiquetas/tiempos, ganancias y transiciones por estilo, y limita
el número de capas; los bindings y revisión de cada matte siguen siendo obligatorios.
Se rechazan rangos fuera de fuente, etiquetas solapadas, estilos/transiciones y
ganancias inválidos antes de escribir. No se instala un generador semántico.

Con los mismos medios, DOPAMIN produce manifest,ASS yfiltro byteidénticos al
bundle de la muestra aceptada. No hace falta recodificar para comprobar esa igualdad.
La huella ahora liga el plan compilado, estilo, hashes de fuente/recursos/matte,
fuentes y música, motor, renderer y script/validador de receta; antes sólo cubría
el archivo de capas. Dos pruebas nuevas validan límites y la invalidación de la
huella al cambiar cada dependencia. 209tests/checkPASS; sin cambiar el render previo.


## Integración de máscara IA y vídeo detrás del sujeto · 27/10/2026

La prueba MODNet ya existente del25/10 estaba en foreground-work-20261025 y no
formaba parte del motor activo. Se integra foreground-effects.js sin sustituir
subject-layers.js ni las comprobaciones previas. reviewedForeground admite máscara
FFV1/gray512×896/30fps ligada al SHA del bruto y a la huella exacta de cámara,
zoom, anchors y timeMap. Se permite el último fotograma de una duración fraccionaria.
Tres intervalos como máximo de blur/texto/vídeo por tipo; selección de vídeos
privados por ID y SHA verificados, sin su audio original. La máscara restaura el
sujeto delante de la composición; captions y badges aprobados se dibujan después.

Se añade foreground-effects al plan externo existente con validación completa
antes de ejecutar. Los planes pueden conservar la máscara en copia/restauración;
se rechazan rutas fuera del paquete y recursos modificados. El resumen/revisión
operativa muestra capas, B-roll, overlays y SFX de biblioteca. 15/15 pruebas
focalizadas PASS, además de prueba de píxeles de FFmpeg que conserva rojo del
sujeto y muestra el vídeo azul únicamente fuera de la máscara.

Prueba nueva: espiritualidad gratuita, fuente SHA17802a14f4d38f8cfa5427ee6f607367a6b99419b91494623e6e55bf3b6013f7.
Se reutiliza MODNet ONNX SHA07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9;
225frames inferidos en19–21,5s,34–36,5s,43–45,5s; máscara2127frames/70,9s,
319,1s CPU-local de pared y432204KiB de pico. Nueve muestras revisadas; bordes
de pelo suaves. Estado sample-reviewed, nunca aceptación de toda la toma.

Qwen3-1.7B local se ensayó como Director pero se rechazó: duraciones demasiado
cortas, intervalos fuera de rangos y argumento central incompleto. No se aplicó
su salida ni se presenta como Director autónomo listo. La propuesta corregida
procede del análisis de ChatGPT Work sobre locución y muestras visuales; el motor
existente la valida/ejecuta. Sin llamadas Gemini, nuevas descargas o gasto externo.
Render final5e5384e2-da7e-4225-8f64-5a5d271ea69e DONE,70,9s1080×1920,38.802.994bytes.
SHA8be1b267e737c4ccaa5493928b5673371751e9cf7e618f754fc339f9b634f038.
Decode completo PASS,-14,3LUFS,pico−2,1dBFS.24fotogramas revisados y4críticos:
se ven cruz,2checks,número,3B-roll(desde6s)y3escenas de profundidad. Contornos
de pelo suaves; rótulos COBRAR/SISTEMA NERVIOSO parcialmente ocultos; número pequeño.
App: reproduce/pausa/salto35,2s sin error,exportación habilitada. No escucha ni
visionado dinámico íntegros; no aceptación artística del usuario ni Director autónomo.
Suite367/368PASS; único fallo Git ausente pasa en host.9/9foreground+backupPASS.