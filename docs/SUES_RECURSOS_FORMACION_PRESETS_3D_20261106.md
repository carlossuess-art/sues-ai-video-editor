# SUES · Biblioteca de formación, subtítulos, títulos y objetos 3D · 06/11/2026

## Origen verificable
Carpeta principal proporcionada por Carlos: https://drive.google.com/drive/folders/1l8P_ZvOmLfWiy1vN0HiH8-rV_BNtTnqR

Subcarpetas:
- Objetos 3D: https://drive.google.com/drive/folders/1Tm-gdKwJ1-uqXES5sUmXXjJK2jw-Pkm-
- Texto After Effects: https://drive.google.com/drive/folders/1kjnJYzslGtRbkC1HXty65-ULfCHRmXGY
- Presets texto AE: https://drive.google.com/drive/folders/1gbJd2ujEIjkGY3iaKmhRV_kbMc8__ztk
- DaVinci subtítulos: https://drive.google.com/drive/folders/1oJMeK-2teFkDMG7IK_V8qzNseg_GMHYJ
- CapCut subtítulos: https://drive.google.com/drive/folders/19wbNKAUSbdUo34jfFmd0CbvFQJGZ4H9c
- Premiere subtítulos: https://drive.google.com/drive/folders/1lgPd0Wl39yhF53u9MFE6eolWS6Gylyb3 y https://drive.google.com/drive/folders/1bA4m81P_pZmy-b64-f-5TDpJ_TTNDBcM
- Premiere texto: https://drive.google.com/drive/folders/1bQclXKENHr71paBDwKPfmWLCZcbxbdjm

## Descargas comprobadas del servidor
- 19 archivos .glb descargados en /opt/sues-video-setup/editor/assets/3d-models/; manifest.json con ID, fuente Drive, tamaño, SHA-256, estructura GLB, materiales, geometría y estado de licencia. Los 19 pasaron verificación de cabecera y longitud y lectura de JSON glTF. No representan aún un render 3D ejecutable.
- 69 MOGRT Adobe previamente descargados en /opt/sues-video-setup/full-catalog-trial-20261025/complete-library/; los 69 contienen definition.json, project.aegraphic y thumb.png. Manifest de selección de estilos con ID, nombre, SHA y miniatura en /opt/sues-video-setup/editor/assets/text-presets/manifest.json. No representan presets Remotion ejecutables.

## Normativa SUES aprobada por Carlos
- Paleta base: blanco, beige, negro antracita, rojo/naranja fuego (color de énfasis). Colores narrativos complementarios permitidos, incluidos neones.
- Contraste tipográfico comprobado sobre el fondo real: sombra/contorno fino oscuro sobre fondo claro; sombra clara o beige si mejora contraste sobre fondo oscuro; ajustar fondos complejos por fotograma.
- Subtítulos siempre cerca del rostro JUSTO BAJO LA BARBILLA, de forma estable, sin invadir boca, cara o gestos.
- Jamás mostrar la oración entera instantáneamente. Revelado/acumulación palabra a palabra sincronizado con las palabras realmente pronunciadas, idealmente dos líneas, máximo tres.
- Palabras clave mucho mayores que el resto. Animación POP-IN y POP-OUT en la entrada/salida de cada palabra clave, con anclaje de posición y temporización por fotograma; la palabra clave NO adelanta texto aún no pronunciado.
- Títulos principales mantenidos ENCIMA de la cabeza, aprovechando al máximo el espacio superior seguro. Entrada POP-IN y salida POP-OUT, tamaño impactante sin tapar cabeza ni invadir interfaces.
- La skill solicita por ID y rol narrativo el recurso del inventario real. Siempre inspeccionar miniatura, capacidad de render y licencia antes de aprobar para producción; no inferir licencia comercial de que esté en una formación.

## Contrato y pendientes (NO MARCAR COMO EJECUTADO)
- El MediaLibrary del editor inspeccionado sólo admite image/audio/sfx/video/overlay; **no acepta GLB ni MOGRT como recurso ejecutable**.
- El compilador maestro strict `sues-master-story/v1` permite texto básico y keyframes escala/posición/opacidad según capacidades reales. POP-IN/OUT avanzado, palabras de tamaño distinto con reflow estable, tracking del rostro y render 3D genuino requieren ampliaciones tipadas y QA.
- Crear catálogo de recursos 3D aprobado con licencia, miniatura, geometría, materiales, presets cámara/iluminación, loader seguro y exportación Remotion / composición nativa en la biblioteca; no aceptar archivos sin hash y validación.
- Adaptar MOGRT a presets nativos de texto/captions que cumplan la norma. No pretender renderizar project.aegraphic directamente en Remotion.
- Añadir selector de preset por ID y fallback explícito BLOQUEADO; nunca degradar silenciosamente a un subtítulo convencional.
- Añadir pruebas: pop-in/pop-out palabra clave y título, caption palabra a palabra máximo 2/3 líneas, contraste frente a fondo variable, safe zones, vinculación al rostro, modelo GLB en preview/render, SHA, licencias, trazabilidad source -> scene -> render.
- Preservar el bruto y el trabajo activo de la rama/PR #27. Integrar sólo tras las pruebas y revisión, sin despliegue automático.

Estado: recursos descargados y catalogados; integración del motor/contrato y actualización del plugin de skill no verificadas todavía.
