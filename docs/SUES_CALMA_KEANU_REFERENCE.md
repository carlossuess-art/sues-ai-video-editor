# CALMA · referencia prioritaria Keanu · 18/10/2026

Carlos confirma como referencia principal el Reel sobre Keanu Reeves de deckeanu,
«Video 1.mp4», y como secundaria Sues_Reel2_May_V1.mov. Esta decisión tiene prioridad
sobre la síntesis anterior de siete referencias. El objetivo es trasladar su
lenguaje visual a CALMA con ritmo más pausado y música ambiental.

## Observado y medido

Principal:64,20s/1080×1920; secundaria:91,467s. Revisadas hojas de16 y8 fotogramas
respectivamente. En la principal hay captions blancos, gruesos y compactos en
palabras/grupos cortos, énfasis de tamaño/color, presentador protagonista, recursos
flotantes y pantallas gráficas. El desenfoque del plano principal concentra la
atención en el recurso. La secundaria comparte letra compacta, grupos cortos,
pantallas gráficas y recursos visuales enmarcados.

Un rótulo de la principal a6,42s («lo que hizo») ocupa aproximadamente x337–743,
y989–1078 en1080×1920, medido dentro de un área de glifos delimitada manualmente.
El MP4 contiene píxeles de texto; no identifica la familia de fuente original.

Se analizaron todos los frames con FFmpeg scene-score>0,12 a180×320:9 candidatos
en la principal y120 en la secundaria. Son candidatos de cambio, NO recuentos
verificados de cortes; gráficos y transiciones disparan varias detecciones.
OCR local a4fps sobre la banda de captions de la principal: ruidoso. No se usa
para inventar tiempos palabra a palabra ni estadísticas exactas de subtítulos.
No se ejecutó ASR, detector facial nuevo o modelo de pago.

## Implementado

- Brand Kit Inter4.1 Regular/Bold oficial con SIL OFL. Es una aproximación visual
  compacta y gruesa; no se afirma que sea la fuente exacta de la referencia.
  Fuente: https://github.com/rsms/inter/releases/tag/v4.1
- CALMA:30 grupos de1–3 palabras en la prueba, en lugar de16 frases completas.
  Texto blanco,96px de diseño1080p, ancho94%, tracking−2; ajuste por métricas del
  archivo de fuente. Si no cabe a un mínimo legible64px, falla antes de renderizar.
  Cada grupo usa tiempos existentes; no se ralentiza ni corta la voz.
- Fade60ms y entrada vertical98→100% en180ms. Son decisiones de adaptación para
  CALMA, no medidas exactas inferidas del Reel. Hereda límites y colores del kit.
- Palabras con evidencia léxica en los momentos elegidos: acento dorado SUES.
  Las correcciones manuales no reciben correspondencias de palabras inventadas.
- Foco de cita literal sobre fondo desenfocado y atenuado, con entradas/salidas
  suaves350ms. El presentador se oculta intencionalmente sólo durante ese foco;
  la voz sigue. El texto de la tarjeta cumple safe zones. No duplica debajo el
  subtítulo automático cuando todas sus palabras ya están en la cita visible.
  Una corrección manual de subtítulo sigue visible: no la oculta la cita original.
- Zooms existentes anclados a ojos, suaves y con motivo semántico. La velocidad de
  cambios es inferior a la referencia; no se inventan cortes o transiciones en
  mitad de la voz para imitar su densidad. No se declara un ratio de zoom medido.
- UI:una/dos/tres palabras por grupo; cambiar agrupación restablece textos/citas
  de esa versión. API rechaza aplicar IDs editados de la agrupación anterior.
  Deshacer restaura también la agrupación y sus ediciones.
- Font kits y renderer admiten Inter y Open Sans legado; fingerprints y digest
  cubren sus archivos/licencia/métricas. Doctor comprueba la familia configurada.

El foco implementado usa una cita de texto, como variante del renderer de citas.
No convierte BLURRED_RESOURCE_01 en un compositor completo de imágenes/vídeos.
Recursos fotográficos, recortes y escenas de retiros/naturaleza siguen pendientes
hasta disponer de material propio/licenciado y sus bindings. No se insertan
personajes o música de la referencia en el montaje de Carlos.

## Música de esta prueba

Cama ambiental original de46s creada proceduralmente: acordes lentos, armónicos
suaves, estéreo y colas. Sin muestras externas, servicios generativos o coste.
Generador:scripts/audio/create_ambient_bed.py; partitura/medidas en
examples/audio/sues-original-ambient.score.json. Usa NumPy sólo como herramienta
de creación offline en Work; no es nueva dependencia del servidor.

Pista privada configurada en este perfil de prueba, gain0,16, fades y ducking sobre
la música. Voz continua y limitador0,95. No es música elegida/aprobada por Carlos;
la escucha humana y el selector de pista/volumen en UI siguen pendientes. No se
empaqueta un WAV grande en Git ni se activa música inexistente en otros perfiles.

## Prueba ejecutada

Primer render técnico→QA→corrección del subtítulo duplicado→segundo render desde
la API de la app: subida97MB→CALMA→ajuste75%→render→almacén privado→Range206.
Resultado:38,30s/75palabras/30grupos/2zooms/1foco;18.198.492bytes, SHA
20abb19a75e4f7e20ac884c58ee3534d736b313f9c4e0f17c1e6e7172aad5299.
H2641080×1920/30 y AAC; decodificación íntegra y original intacto; un intento
pese a POST repetido. Preparación vigente confirma ASS y filtro idénticos a ese
render tras proteger las correcciones manuales. Evidencia compacta en
examples/preview/calma-keanu.real-result.json.

QA8frames:3/6,3/12,5/15,5/16,2/25,5/33/36,5s. Comprobado además el detalle dorado
de «culpa» a25,5s. Audio decodificado: pico−9,28dBFS, RMS−29,00dBFS, sin NaN/Inf;
no se ha hecho escucha completa ni aceptación humana. No QA de navegador/PWA.
151/151 tests en ejecución secuencial, check, Bash y compilación Python correctos.

Fase5:80%; global48%, sin cerrar aceptación estética/V1. VPS/HTTPS no ejecutados;
WhatsApp/Caddy sin cambios. Coste externo nuevo0. Siguiente:Carlos revisa esta
prueba estética; afinar fuente/agrupación/foco/música, completar recursos propios
integrados y después validar la misma release en VPS con acceso operativo.
