> Actualización transversal posterior: palabras clave editables, paletas metálicas,
> condensada/oblicua, biblioteca de imágenes/audio, controles de música, tres
> tarjetas y tres transiciones ya están integrados. Consulta
> [estudio general](SUES_GENERAL_STUDIO.md). El registro que sigue describe la
> prueba V4 anterior; sus pendientes no sustituyen el estado vigente.

# Aplicación del dossier Keanu · 18/10/2026

Fuente: SUES_AI_VIDEO_EDITOR_Dossier_maestro_Keanu.pdf,43p,
Library `libfile_ed94f38e5bb48191a586e39c12e970dd`. Leído completo y revisadas
tablas y hojas visuales. Referencia de análisis; sus recetas no se convierten
en nombres de fuentes, plugins o sonidos confirmados.

## Cambios incorporados

- CALMA permite subtítulos progresivos dentro de cada grupo. El prefijo crece
  centrado y conserva palabras anteriores hasta terminar el grupo. Se evita
  reservar huecos que dejen una palabra sola en el margen izquierdo.
- Palabra protagonista: caracteres con entrada escalonada24ms, asentamiento130ms,
  desplazamiento vertical8px y rotación−3°→0°. El presupuesto se acorta cuando
  hace falta para no extender la duración del grupo. Son ajustes de adaptación,
  no valores recuperados del Reel. Se mantiene la jerarquía2:1 y el oro por bandas.
- Se conservan marcas reales de palabra y sus índices. Un token de duración cero
  comparte el intervalo real adyacente. Una última ventana de display inferior a
  160ms se agrupa con la anterior sin reescribir el ASR. Los grupos muy breves y
  las correcciones manuales conservan presentación estática. No se promete karaoke
  exacto con esta transcripción, que contiene marcas inciertas.
- Nuevo compositor de imágenes fijas: ajuste cover, máscara espacial inferior y
  fades temporales independientes. Pasa antes de los subtítulos y del foco previo.
  No sustituye al renderer de B-roll completo ni hace rotoscopia.
- Cada imagen necesita ID único, rol illustration, derechos owned/licensed,
  archivo local y SHA256, vínculo al hash del original, tiempo edit-timeline y
  caja/feather/fades explícitos. Rechaza solapamiento con rostro muestreado,
  tarjetas, B-roll u otra ilustración. La comprobación facial usa las detecciones
  ya existentes proyectadas con el mismo crop/zoom; no es segmentación nueva.
- Renderer verifica PNG/JPEG/WebP/BMP y el hash antes/después del render. Las
  nuevas importaciones de análisis no heredan imágenes ni música de otro vídeo.

## Recurso de la prueba

`assets/illustrations/calma-horizon.svg` es una ilustración vectorial original
de horizonte/montañas/lago. Se rasteriza con FFmpeg para esta demostración:

```bash
ffmpeg -v error -i assets/illustrations/calma-horizon.svg -frames:v 1 runtime/calma-horizon.png
```

No es una fotografía, un recorte de Keanu ni una prueba de separación del sujeto.
Su función es comprobar entrada, composición y máscara con material propio.
En el perfil privado se vincula a5,2–8,4s del original de CALMA, «mirar/reconocer».
Caja1080p x120–900,y140–420; feather inferior100px; fades0,3s. Son parámetros
de esta muestra, no coordenadas universales para todos los originales.

El compositor está conectado al pipeline de la app y al worker; la selección de
imágenes por concepto, la subida de imágenes y sus controles en UI siguen pendientes.
La elección en esta prueba es editorial y se configura en el perfil de proyecto.

## Verificación y límites

Prueba real: subida HTTP del original, CALMA, ajuste de zoom75%, workerFFmpeg,
almacén privado y lectura Range206. El original y los recursos se conservan.
Se revisan fotogramas de entrada/estabilización/salida; se valida decodificación
completa y coincidencia del ASS/filtro renderizados con el código final.
La muestra entregada es un extracto0–16s del render, no un montaje completo
que reproduzca todas las escenas de la referencia.

Fuente exacta pendiente; Inter sigue siendo aproximación. Variantes condensadas
e inclinadas, glow/materiales múltiples, segmentación del sujeto/sillón, recursos
traseros, tarjetas gráficas, blur global que incluya texto, radial/flare localizado
y auditoría auditiva de SFX/música siguen pendientes. El oro actual es estático.
No se importan plugins ni se realizan compras, nuevoASR o nueva visión.
No se afirma despliegue aVPS, aceptación estética humana niV1 terminada.

## Continuidad del proyecto

Conservar estos identificadores en las instrucciones del proyecto:

- Repo: https://github.com/carlossuess-art/sues-ai-video-editor
- Rama verificada al iniciar: feat/phase-4-vision-camera,base1e55884288d3b467ee6a5d7a3513d5cf0567693a.
- Maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
- Estado ejecutable: PROJECT_STATUS.md; esta guía no sustituye su lectura vigente.
- Dossier Library: libfile_ed94f38e5bb48191a586e39c12e970dd.
- Referencia principal original: Library libfile_d388093c60e0819195223c347ce18492.

El PDF original y los medios privados permanecen fuera de Git. No ejecutar los
guiones del anexo como campañas, autobiografía o mensajes aprobados.
