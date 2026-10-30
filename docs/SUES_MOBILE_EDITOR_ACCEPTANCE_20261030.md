# Criterios de aceptación pactados · Editor móvil · 30/10/2026

ESTADO: REQUISITOS, NO IMPLEMENTACIÓN. No confundir con funciones terminadas ni con producción.

1. Timeline: un dedo siempre pausa la reproducción al tocar/arrastrar, muestra los fotogramas bajo el cabezal y permanece pausada al soltar. Pinza para zoom horizontal, barras +/- y precisión de fotograma. No modifica la duración.
2. Subtítulos: posicionar con dedo, escala REAL de tipografía mediante pinza, control numérico de tamaño + slider + +/- + restablecer, color instantáneo, sincronía idéntica entre preview y MP4. Sin límites artificiales de marco: puede salir de safe zone con aviso. Ahora el backend limita captionTransforms.scale a 0.5..2.0: cambiar esquema/render/preview/pruebas juntos.
3. Navegación: vídeo y timeline siempre visibles; submenús sustituyen categorías sin scroll vertical; controles legibles; aviso temporal no obstructivo. Categorías: Subtítulos, B-roll, Imágenes, Motion, Gráficas, SFX, Música, Efectos.
4. B-roll: vídeos y B-roll con máscara; máscaras como ajustes del recurso, no categoría independiente. Imágenes estáticas con su propia categoría. Evitar duplicados/confusión entre Gráficos y Motion.
5. Motion: bloque desplazable en timeline principal, expandible a timeline interna de capas (tapiz/fondo, textos, formas, luces y SFX). Ajustar textos/tiempos individualmente y respetar sincronía. Nuevas composiciones avanzadas pueden esperar; NO fingir capas de un MP4 aplanado.
6. Gráficas: listas de razones 1..7, rankings, verdadero/falso, comparaciones, procesos y revelaciones por voz; usar el mismo motor de capas de Motion, no un segundo compositor.
7. Audio: múltiples pistas de música superponibles, volumen por clip o tramo, cortar/silenciar, keyframes de gain, fundidos y mezclas independientes voz, música, SFX. Verificar preview Y render.
8. Keyframes universales: rombos pequeños sobre clip de timeline con keyframes de escala, posición, volumen, opacidad, máscaras donde aplique; mover en tiempo y expandir propiedades. No añadir keyframes involuntarios. La interpolación debe reproducirse igual en preview/MP4.
9. Pruebas: repetición x10 por función, gestos reales Chromium móvil, sin scroll vertical/errores JS, teclado Android físico pendiente si no hay acceso, proyecto original inalterado, renders comparativos real de texto/video/audio; no afirmar V1 terminada sin aceptación visual.

## Estado técnico comprobado este turno
Producción actual: /opt/sues-video-setup/release-update.mvl0mllf montada en contenedor sues-video-editor y hotpatch del 30/10 vigente. Rama de trabajo feat/mobile-capcut-navigation-20261030.
Commit 128d2ca corrige la condición de pausa en cualquier zona de timeline y amplía rango de zoom horizontal 15..480 px/s. node --check y git diff --check pasan; pendiente prueba Chromium 10x de este cambio. CAMBIO NO DESPLEGADO.
Motor actual: settings.captionTransforms permite únicamente dx,dy,scale (escala 0.5..2); música gain única global máximo .18; pista música única. No existen aún keyframes universales ni multipista musical en esta V1. Cambiar solo la UI no sería suficiente: requiere evolución del esquema, pipeline FFmpeg, preview y aceptación.
