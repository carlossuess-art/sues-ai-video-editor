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
- CALMA provisional y tres variantes experimentales: IMPACTO, EXPLICA e HISTORIA.
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
