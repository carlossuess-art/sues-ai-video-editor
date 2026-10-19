# Continuidad de SUES AI VIDEO EDITOR

Lee PROJECT_STATUS.md y docs/SUES_GENERAL_STUDIO.md antes de continuar.
La rama oficial es feat/phase-4-vision-camera. El maestro funcional está en
https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit .

Carlos autoriza continuar autónomamente en todas las fases: construir, revisar,
corregir y probar el conjunto. No terminar el trabajo por un paso parcial ni
pedir confirmación para decisiones reversibles ya autorizadas. Dar actualizaciones
breves durante trabajos largos; no confundirlas con entregas finales.

Keanu es la referencia principal. La fuente exacta no está identificada. Mantener
subtítulos progresivos de 1–3 palabras y palabra importante al doble de tamaño;
los términos excepcionales pueden añadir color y acabado metálico.

Reutilizar análisis existentes. No activar consumos de pago, nuevas suscripciones,
modelos o proveedores sin autorización específica. No modificar WhatsApp, Caddy,
DNS ni desplegar a ciegas. Una prueba técnica no equivale a aceptación humana.
No declarar V1 por superar tests. Nunca incluir medios privados o secretos en Git.

## Regla visual común · decisión de Carlos · 18/10/2026

El informe de Keanu y el vídeo de referencia definen el lenguaje visual general
para TODAS las plantillas, no sólo CALMA. Extraer de esas fuentes las decisiones
ya analizadas; no pedir a Carlos que vuelva a definir tipografía, jerarquía,
composición, colores, animación de texto o recursos descritos en el informe.
Distinguir observaciones confirmadas de aproximaciones o datos no identificados.

CALMA, IMPACTO, EXPLICA e HISTORIA comparten esa base. Las variantes ajustan el
ritmo, duración e intensidad y la cantidad/densidad de transiciones, acercamientos
y recursos según el contenido. No convertir una variante en una identidad visual
independiente ni usar efectos por cuota sin intención narrativa. Mantener grupos
progresivos cortos, palabra importante 2:1 y énfasis excepcional con color/material
cuando proceda, respetando legibilidad y zonas seguras.

Crear nuevas plantillas conforme aparezca una necesidad concreta que las actuales
no resuelvan. Una plantilla nueva hereda la base común; cualquier excepción visual
se documenta con su motivo. No hace falta definir todas las plantillas futuras
para cerrar una primera plantilla funcional. No declarar que los efectos pendientes
del dossier están implementados por haber fijado esta regla.

CALMA: definición cerrada y primera plantilla funcional; F5=100% en alcance
original, no V1 global. Leer docs/SUES_CALMA_V1_SPEC.md. El diseño se adapta
a posición/movimiento; las imágenes de app usan auto-subject. Distinguir
colocación sin tapar rostro de oclusión real detrás del cuerpo (F6 pendiente).

## Nivel visual · corrección18/10/2026

Carlos rechaza la demostración sintética de checks/cruces: «Esto no es el nivel
que quiero». Para F6, las muestras de iconos son QA interna; no representan la
calidad solicitada. No elevar el porcentaje por número de renderers/tests.
Contrastar propuestas sobre su vídeo real con el dossier/Keanu y revisar
composición, capas, recursos y movimiento. Registrar explícitamente qué sigue
sin segmentar, qué es una receta editorial y qué ha aceptado Carlos. La propuesta
SUES_F6_COMPOSICION_REAL_V2 todavía no tiene aprobación audiovisual.

## Tipografía y motions · decisión posterior de Carlos · 18/10/2026

Prevalece sobre la regla anterior de Inter/2:1: Montserrat real Bold para texto,
ExtraBold para mayúsculas destacadas, Bold Italic y ExtraBold Italic según rol.
Proporción de tamaño14/12 conforme al último ajuste indicado y comunicado.
No sintetizar negrita/cursiva. Ver assets/fonts/montserrat/sources.json y métricas
calibradas con libass; no sustituir assEmHeight1562 por hhea sin prueba de píxeles.
Anton y Allerta Stencil son las fuentes libres usadas para el sello; no afirmar
que Allerta sea Arial Black. Futhark usa Noto Sans Runic, Unicode sin transliterar.
Las tres escenas son recreaciones por capas de la especificación del usuario;
la muestra17s lleva música, sin voz, y no es el Reel final ni aceptación de F6.

## Dirección visual aceptada · 18/10/2026, 19:57 Europe/Madrid

Carlos valora SUES_MOTIONS_MONTSERRAT_CAPAS (SHA93932620c6666b9498a1ed98f75ad029aed9028b51087d2246a4ee4738ac7a87):
«Ahora sí que ya empiezo a ver esto ya en otra historia. Esto está muy bien».
Acepta la dirección visual de los tres motions; no equivale a aprobar el montaje
completo, la oclusión corporal, el audio o cerrar F6/V1. Autoriza continuar.
Adaptación con voz: scripts/templates/prepare_voice_motion_scene.mjs. Rangos de
subtítulos elegibles desde app, entradas de copia literal ligadas a cues existentes;
se preservan tiempos inciertos, sin inferencia nueva. Sólo se suprimen captions
inferiores de un rango cuando el gráfico reproduce todos sus tokens en orden.
Iconos originales de mirada/corazón para adaptar el lenguaje visual al contenido.

## Estilo aceptado y sonido · 18/10/2026, 20:33–20:34 Europe/Madrid

Carlos confirma que le gusta el estilo y la ejecución de los motion graphics.
Aclara que la toma de prueba está mal grabada/leyendo en el coche y dificulta
conectar con la esencia del discurso. No usar esa toma como evaluación final del
criterio creativo ni atribuir a un Director automático las elecciones de la receta.
Autoriza continuar con lo pendiente; no significa cierre de F6 o V1.

SFX propios por síntesis determinista local: whoosh, impacto, neón y roce de flecha.
Activación explícita sfxEnabled (false por defecto) y volumen sfxGain0..0,7.
Ducking sobre el bus de efectos y limitador sin autoganancia; desactivar efectos
conserva la mezcla previa. Son cues genéricos de la app, no enlaces recuperados de
las capas audio del catálogo ni material comercial. Recetas src/sound-effects.js.
Persisten con ajustes/deshacer/copia y aparecen en la revisión del plan. Controles
en app sin QA visual navegador todavía. Sonido necesita escucha/valoración humana.

## Diez rondas creativas · instrucción21:03Europe/Madrid,18/10/2026

Se completan10rondas con clips y fotogramas revisados; ver
SUES_CREATIVE_REFINEMENT_10.md y examples/preview/creative-ten.iterations.json.
La valoración positiva anterior valida estilo/motions/sonido, no la nueva entrega
ni perfección objetiva. El motor comparte beats de neón y SFX, flechas por recorrido,
lectura hasta siguientecue, luces suaves, salidas y cierre legible. Negro final sólo
después del último subtítulo con margen de seguridad. No convertir clips de QA en
aceptación humana. Cuerpo detrás de capas requiere máscara real: no disponible,
no sustituir por caja facial ni afirmar implementado. No nuevos modelos/pago/VPS.

## Valoración parcial del nuevo bruto · 18/10/2026,22:48Europe/Madrid

Carlos: «No lo sé. La letra bien y el motion bien» (transcripción «moroon»).
Se refiere a SUES_NO_ES_PEREZA_FINAL, SHA
ceebd8d3a95535c46a195707d6d946124d5e1ad2d75d36bd60b86e47914ea60f.
Valida tipografía y motion en esa entrega; valoración global abierta. No inferir
rechazo de otros elementos ni aceptación del conjunto. Autoriza continuar.

## Profundidad por contorno revisado · 18/10/2026

Se admite depthTextPath privado ligado al SHA de la fuente. El renderer usa
contornos vectoriales revisados para ocultar texto dentro de la silueta; no es
caja facial ni detección automática. La prueba PARALIZADO revisa sólo cabeza/cuello
0,25–1,25s,zona vertical250–650. No declarar segmentación automática de cuerpo
completo ni cerrar F6. Ver docs/SUES_DEPTH_TEXT.md. No nuevos modelos ni reintento
MediaPipe. HostingerVPS sigue sin tools callables; sóloAIBuilder. No confundir
scripts preparados/tests locales con servicio desplegado. Instalador nuevo usa
Montserrat; no modifica perfiles existentes ni WhatsApp/Caddy/DNS.

## Recuperación y despliegue · 19/10/2026

Carlos acredita HTTPS y acceso a la app móvil, perfil sin material. No repetir
diagnósticoDNS/Caddy. Se añade recuperación completaTAR desdeUI,199tests/check y
smoke real38,31s con reinicio/reintento, integridad y Range206. Leer
docs/SUES_PROJECT_RECOVERY.md. Copia privada enLibrary; no ponerla enGit.
Actualizador de sóloeditor preparado y simulado, NO ejecutadoVPS. Motor instalado
sigueba972 hasta comprobar otra captura. Nada de nuevos modelos/ASR ni cierreV1.

## Perfiles combinables · decisión de Carlos · 19/10/2026

DOPAMIN es la referencia maestra Keanu de alta intensidad; CALMA comparte base
y aproximadamente50% de intensidad/frecuencia, conservando su trabajo validado.
ELEMENTS es una estructura combinable con ambos: LIST,RANKING,COMPARE,REVEAL,Q&A,FLOW.
Leer docs/SUES_COMPOSABLE_PROFILES.md para cobertura y límites. La implementación
inicial es explícita por rangos de captions, no detección semántica automática.
DOPAMIN y los diseños ELEMENTS siguen experimentales. Mantener Montserrat y14/12
posteriores; no restaurar2:1 por leer documentación histórica. No afirmar máscaras
corporales automáticas, fondos/partículas/cadenas/candado/avatar completos.
REA se evaluó documentalmente; no instalado ni necesario para este bloque.

## Profundidad raster revisada · 19/10/2026

Leer docs/SUES_REVIEWED_SUBJECT_LAYERS.md. Compositor tras sujeto integrado con
matte vinculado aSHA,rangos yregión revisados;fuente full-frame sin cortes/zoom
solapado. Muestra12s sólo región superior0.25–1.4 y8.2–8.9. EnsayosGrabCut/flow
no sirven como cuerpo completo automático:contornos finales corregidos a mano,
no afirmar detector o segmentación general. Rótulos editoriales,noASR.
Carlos pidió ejecución autónoma hasta un punto concreto de opinión; comparación
lista; aceptación visual posterior registrada abajo. No desplegar ni cerrarF6 por esta prueba.

## Aceptación de muestra y reutilización · 19/10/2026

Carlos: «Lo veo bien» sobre SUES_PROFUNDIDAD_REVISADA/comparativa12s,
SHA816d3bb6c1ea77b6048ed650e49b654c129d79626e766d59b9a3645c10d471a1.
Aceptación visual de esa composición/contornos; no ampliar a audio, automatización
corporal ni cierre F6/V1. Mantener look aceptado. La receta explícita reutilizable
vive en examples/templates/reviewed-depth.recipe.json; no inferir discurso/ASR.
