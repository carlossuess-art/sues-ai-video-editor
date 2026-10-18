# Estudio general · 18/10/2026

Este bloque amplía varias fases de forma conjunta. Keanu y su dossier definen la
base visual común de todas las plantillas; Inter 4.1 es una aproximación, no la
fuente identificada.

## Funciones integradas

- Palabra clave elegida por subtítulo: normal, importante 2:1 o excepcional.
  Blanco, oro, verde, cian, azul, coral, oblicua y condensada. El metal son nueve
  bandas estáticas, sin afirmar reflejo animado o geometría 3D.
- Subtítulos progresivos de 1–3 palabras. La edición manual conserva el texto
  del usuario sin inventar alineaciones de palabras. Reagrupar invalida elecciones
  dependientes de IDs; deshacer recupera los ajustes anteriores.
- CALMA funcional y tres variantes experimentales: IMPACTO, EXPLICA e HISTORIA.
  Cambian ritmo gráfico y cámara, sin cortar ni acelerar la voz. No tienen
  aceptación estética humana.
- Biblioteca privada de imágenes y audio, con procedencia propia/licenciada,
  hashes, límites de tamaño y comprobación FFprobe. Selección de música, volumen,
  ducking e imágenes con intervalos desde la app. No se heredan de otro original.
- Tres tarjetas: cuadrícula, comparación y fondo oscuro de idea clave. Tres
  transiciones de 400 ms: desenfoque, estela radial y luz cálida. Las tarjetas
  cubren intencionalmente al presentador; se rechazan solapamientos incompatibles.
  No equivalen a una reconstrucción exacta de todos los efectos de Keanu.
- Revisión del plan con evidencia, tiempos inciertos y decisiones por reglas.
  No se presenta como análisis semántico de un LLM.
- Copia TAR por versión con original, análisis, fuentes, medios seleccionados,
  ajustes y manifiesto SHA256. Hasta cuatro copias por trabajo. La restauración
  genera un trabajo nuevo; no reanuda un render interrumpido.
- Registro de revisión humana ligado al hash de exportación: subtítulos,
  encuadre, audio y número de cambios. El sistema no aprueba su propia estética.
- Doctor de arranque sin medios: verifica runtime, fuentes, plantillas y filtros.
  No instala dependencias ni ejecuta análisis o renders. VPS/HTTPS siguen pendientes.

## Prueba reproducible

```sh
node scripts/app/smoke_general_real.mjs CONFIG ORIGINAL PNG WAV NUEVO_DIRECTORIO
```

Realiza subidas HTTP privadas, edición/deshacer, revisión, copia y restauración,
comparación exacta de ASS/filtro, preparación de las cuatro variantes y un render
completo. Comprueba conservación del original, decodificación, audio y Range206.
Los archivos de prueba son privados y quedan en runtime, fuera de Git.

La copia incluye la revisión Git del motor: conservar esa revisión para restaurar
con comportamiento equivalente. Verificar antes de cargar:

```sh
node scripts/backup/project.mjs --verify DIRECTORIO_EXTRAIDO
node scripts/app/doctor.mjs DIRECTORIO_EXTRAIDO/project.json
```

No extraer archivos TAR de origen desconocido mediante este procedimiento.

## Límites pendientes

Identificación de la fuente, ajuste fino del parecido, segmentación real del
sujeto/sillón, sonido de efectos y aceptación humana. ASR/visión automáticos de
vídeos distintos, QA visual del navegador/PWA y puesta en servicio en VPS/HTTPS
siguen pendientes. El entorno de navegador local no tiene Chromium utilizable;
el navegador remoto no alcanza el loopback de Work. No se declara V1.

## Evidencia final V5

172/172 pruebas y comprobaciones de sintaxis correctas. Un ciclo real completo
con el original de97MB y ambos recursos subidos por HTTP:38,30s,75/75palabras,
31grupos,2zooms,3tarjetas,3transiciones y1imagen. Fuente intacta y MP4 decodificado.
La copia se restauró con ASS/filtro idénticos y referencia a la revisión Git
15b17cd515adb8a70e013404332258a7e831c263, limpia al crearla.

QA13fotogramas, audio pico−9,27dBFS/RMS−30,27dBFS sin NaN/Inf. Sin escucha humana
completa, navegador real o aprobación estética. Las elecciones de esta muestra
son explícitas para ejercitar componentes; no se atribuyen a un Director LLM.
Evidencia pública sin rutas privadas: examples/preview/general-studio.real-result.json.

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

Comprobación de implementación: `applyStyleVariant` en `src/style-variants.js`
hereda la plantilla base y sus políticas; las variantes actuales cambian ritmo,
parámetros de presentación y cámara. La densidad automática de transiciones y
recursos por variante aún necesita integración con el Director. Elegir una
variante no genera por sí solo transiciones que el usuario no haya seleccionado.

## Cierre de F5 y regla espacial

CALMA pasa a primera plantilla funcional con definición cerrada; F5=100% en
alcance original. Especificación y límites: SUES_CALMA_V1_SPEC.md. Las variantes
siguen experimentales. La adaptación espacial según sujeto se aplica a toda la
base común; oclusión real detrás del cuerpo continúa pendiente de F6.

## Ampliación F6 · biblioteca visual

Seis motions renderizables; cinco elecciones explícitas por subtítulo desde
«Recurso animado», con colocación facial conservadora y copia/deshacer.
Guía vigente: SUES_MOTION_LIBRARY_V1.md. Prueba AV sintética completa y177tests;
sin segmentación corporal, SFX ni nuevo despliegue. F6=80%,global75,75% interno.

## Corrección visual posterior

Carlos rechaza la prueba sintética: nivel insuficiente. La estimación F6=80% y
global75,75% de arriba queda retirada como estado vigente. Ver
SUES_F6_VISUAL_REVIEW.md y PROJECT_STATUS.md: propuesta sobre el vídeo humano real,
178tests, aún sin aceptación audiovisual. No avanzar por cantidad de componentes.

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
