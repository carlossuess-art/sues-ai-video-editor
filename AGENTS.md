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
