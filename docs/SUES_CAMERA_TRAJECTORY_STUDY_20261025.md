# Cámara temporal y prueba audiovisual real de 10 segundos · 25/10/2026

Estado: componente experimental verificado; hito cinematográfico de 10 s INCOMPLETO.
Rama: feat/camera-trajectory-study-20261025, desde e4904a2b7c5a1b0a9af79768f5eeb2cefe323a22.
Producción no modificada: último release observado b2ebf6df3725d245e7c3bb5518f574899d1fed0d.
No nueva inferencia, instalación de modelos, servicios de pago ni reinstalación REA.

## Qué cambia y qué se reutiliza
Se reutilizan vision.js, reframe.js, el compositor FFmpeg, captions libass, catálogo,
mezcla, contrato de planes externos y fixtures históricos. camera-trajectory.js añade
keyframes acotados con curvas lineales/coseno y binding SHA de fuente y landmarks.
El plan externo anuncia camera-trajectory sólo con ojos existentes; reemplazar
zooms anteriores requiere replaceLegacyZooms:true explícito. La trayectoria
se compila al filtro real; no basta con validar un JSON.
El cambio es opcional y no altera CALMA ni los defaults anteriores.

Controles: un único tramo continuo; 2–16 keyframes ordenados; escala 1–1,6;
retorno final a escala 1; sin expresiones de filtros suministradas por el usuario;
huecos de ojos mayores de 1,1 s rechazados; zoom combinado máximo 1,6;
comprobación de cara/subtítulos a 30 fps. Se rechazan encuadres fijos presentados
como tracking y eventos ocultos por B-roll, gráficos o tarjetas de enfoque.
Se mantienen los guards de máscaras/zoom: no se transforma una máscara estática
como si fuese segmentación temporal válida.

Archivos principales: src/camera-trajectory.js, semantic-render.js, local-preview.js,
automatic-director.js, local-pipeline.js, external-edit-plan.js, illustrations.js,
subject-layers.js y depth-text.js. scripts/qa/prepare_camera_study.mjs produce un
bundle y MP4 desde configuración privada, nunca desde medios privados en Git.

## Fuente, plan y resultado
Fuente autorizada recuperada POC_001, SHA256
50c56298e59f783b2dfe2979c80ddc4e83a84ab4eb9048aa56ff8423be67ba6a.
Se verifica la fuente original y se reutilizan 74 muestras históricas; no se
ejecuta de nuevo MediaPipe. Esto NO acredita tracking para nuevos vídeos.
Tramo bruto 1,6–11,6 s, para excluir el ajuste inicial del teléfono.
La toma en coche ya fue declarada inadecuada como evaluación creativa final.
Esta selección de 10 s es una prueba de capacidades, no un Reel narrativo terminado.

| Tiempo de salida | Plan ejecutado | Evidencia / límite |
|---|---|---|
| 0–0,4 | Destello cálido de composición completa y SFX | Render real; no luz volumétrica ni transición entre dos tomas |
| 0–2 | Escala adicional 1,15→1 con curva suave | Retorno al encuadre conservador existente; no acercamiento de cámara óptica |
| 2–2,2 | Escala adicional 1 | Plano base |
| 2,2–5,5 | Escala 1→1,35 anclada en ojos históricos | Interpolación existente; whoosh privado desde 2,2 |
| 5,5–6 | Escala 1,35→1 | Clic privado 5,76, acompaña regreso; no sincronizado a palabra |
| Palabras reales | MIRAR y RECONOCER naranja metálico, escala 1,6 | Inspección de píxeles/fotogramas del MP4; acabado de bandas, no metal 3D |
| 6–6,4 | Transición de desenfoque global | Declarada como efecto global, NO desenfoque selectivo |
| 6 | Desenfoque sólo de fondo | NOT_IMPLEMENTED: falta matte temporal completo válido |
| 6,4 | Gráfico detrás del protagonista | NOT_IMPLEMENTED: mismo bloqueo de máscara |
| Por discurso | B-roll contextual | NOT_TESTED: no se ha elegido recurso arbitrario para llenar la pantalla |
| 0–10 | Voz, música The Hex y cuatro cues SFX | Mezcla codificada medida; escucha/aceptación humana pendientes |

The Hex: Steven Ruud / The Cynic Project, procedencia CC0 ya registrada;
se reutilizan recursos privados con derechos declarados, sin nueva compra.
Voz 150 %, SFX 30 %, música 18 %, con nivelado y ducking existentes.
Los porcentajes no son mediciones de inteligibilidad ni aceptación de escucha.

## Iteración real y QA
A: primer render completo, decode PASS, pero incluía ajuste de cámara inicial y
captions altos. B: nuevo encuadre/captions inferiores rechazado por colisión facial
antes de renderizar; el guard NO se debilitó. C: tramo corregido, perfil conservador
y caja captions 120..900 / 1370..1510; render completo revisado en hoja de 10 muestras
y detalle de MIRAR. El encuadre mantiene bastante techo y el montaje sigue siendo
una prueba técnica; no se presenta como acabado profesional.
La crítica y corrección fueron realizadas por Work, no por un supervisor autónomo.

Archivo C: SUES_DOPAMIN_ESTUDIO_10S_20261025.mp4.
10,000 s; H264 1080×1920, 30 fps, 300 frames; AAC estéreo 48 kHz;
4.912.549 bytes; SHA256
18b865e824515f507ee1d3e627ee2a719300ec3ea2ad10fe0f4fe9da64275e7b.
Auditoría geométrica: 300 frames, 218 comprobaciones caption/cara,
zoom combinado máximo 1,512. Full decode FFmpeg PASS.
Medición del MP4 decodificado: −14,4 LUFS, −1,7 dBTP, LRA 2,8 LU.
Sin negros detectados (d≥0,1 s / pix_th=0,1) ni congelaciones
(n=−50 dB / d≥0,5 s). Estos umbrales no prueban fluidez en todos los móviles.
No se ha realizado nueva prueba del reproductor de producción para este archivo
aislado ni escucha humana; la prueba navegador anterior corresponde al Reel de 68 s.
Medio entregado por canal privado; originales/exportaciones previas intactos.

Pruebas: npm run check exit 0. Suite completa Docker 348/349 PASS;
único fallo: caso Git cross-owner/safe.directory en el arnés aislado.
Ese archivo completo se ejecuta en host Node con Git: 2/2 PASS.
Se cubren así los 349 casos únicos entre runtimes, NO se afirma 349/349 en Docker.
Cuatro tests nuevos verifican tiempos/curvas, hash/huecos/encuadre falso,
límites/rechazo de expresiones y compilación real del plan externo.
La prueba HTTP antigua se adapta a la cookie vigente con Expires: se siguen
comprobando HttpOnly, SameSite, Secure, Max-Age y caducidad; sin cambiar Auth.

## Reproducir de forma segura
En el runtime existente con FFmpeg y fuentes autorizadas:
node scripts/qa/prepare_camera_study.mjs /ruta/privada/study-spec.json /salida/nueva --render
La configuración debe aportar schema sues-camera-study/v1, projectConfig,
sourceSha256, sourceSpan {in,out} de exactamente 10 s, fontDirectory,
assetsDirectory, musicId, trajectory {schema,timeSpace,reason,keyframes},
emphasisWords, transitions, sfxEvents y blockedEvents.
Los paths/IDs y medios privados no se suben al repositorio.
Ejecutar en contenedor aislado UID1000, red desactivada, RAM1GiB/CPU0,5.
No ejecutar el script como servicio de producción ni sobrescribir un bundle revisado.

## Bloqueos y siguiente paso
1. Falta matte temporal del cuerpo para desenfoque selectivo y oclusión real.
No sirven cajas faciales ni los contornos revisados de otras fuentes/intervalos.
AGENTS.md restringe nuevos modelos sin autorización específica; no se ha instalado
uno por inferencia de la misión. Candidato documental: MODNet
https://github.com/ZHKKKe/MODNet (código/modelos/demos Apache2.0 según autores).
Es una opción por evaluar, no una capacidad instalada ni rendimiento CPU acreditado.
El modelo de su demo web no publicada no equivale al checkpoint de investigación.
2. Dirección creativa continúa explícita de Work. El puente de skill existente
sólo dirige énfasis; no hay director/critic audiovisual autónomo completo.
3. Falta selección B-roll pertinente para esta secuencia y revisión sonora humana.
4. Falta integración/despliegue del componente y aceptación E2E con vídeo nuevo.

No se cierra F6/F7/F9, no se altera el porcentaje global oficial48 %, ni se declara
conseguido el hito10s, Reel60s, IA autónoma o calidad equivalente a edición de150€.
