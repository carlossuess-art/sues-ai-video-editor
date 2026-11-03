# ADN visual de referencias · Sues AI Video Editor · 03/11/2026

Estado: **análisis preliminar basado en 19 capturas verticales entregadas por Carlos**. Las capturas muestran fotogramas estáticos de Reels publicados; no permiten conocer keyframes, duración exacta, entrada, salida ni sonido. Esos datos requieren los vídeos originales.

## 1. Decisiones que sí sustentan las capturas

**1. Subtítulos sobre imagen real.**
- Una palabra o grupo corto, centrado en la zona media o ligeramente por debajo del centro visual, sin recuadro opaco.
- Base con sans geométrica gruesa, muy legible (en el repositorio ya existe Montserrat Bold/ExtraBold).
- Destacados en tamaño superior (ejemplos «PROFUNDA», «LIBERTAD», «espiritual», «instantánea») o alternancia cursiva en un pasaje de más de una línea («un espectador»).
- La cursiva expresiva de «un espectador» parece una familia distinta, con contraste de trazos y serifas, no simplemente Montserrat italic. **No se conoce la familia exacta por la captura**; elegir segunda familia con licencia y contraste visual y validar con Carlos antes de fijarla.
- Sombras sutiles que separan el texto del fondo sin caja translúcida. Un recurso de color puede coincidir con la palabra, pero no colorear toda la escena sin motivo.

**2. Elementos y composición narrativa.**
- Una noticia, tarjeta o captura arriba; la persona sigue visible y el subtítulo ocupa una zona distinta.
- Objetos representativos con recorte: persona secundaria, cadenas, candado abierto. La localización depende de rostro, ojos y partes importantes del vídeo.
- Iconografía explicativa como maletas con flechas o claqueta y material de maquillaje; no reemplazarlo por letras que flotan.
- Algunas imágenes muestran máscaras o capas detrás del sujeto, pero el fotograma por sí solo no demuestra qué algoritmo se usó ni si hubo rotoscopia.

**3. Motion graphic de pantalla completa (sin presentador, por defecto).**
- Fondo blanco con cuadrícula gris muy suave, tipografía negra potente centrada o en dos columnas; iconos lineales negros y flechas.
- En pantalla completa la fuente puede ser grande y estructural; no se trata de subtítulos del presentador.
- Las imágenes de «Que podría» y «efectos especiales y maquillaje» son referencias útiles de fondo claro y composición; adaptarlas a marca SUES, no copiarlas literalmente.

**4. Dos familias tipográficas (futuro preset).**
- Familia A: sans geométrica pesada. Candidata ya disponible: Montserrat Bold / ExtraBold; elementos secundarios Montserrat Bold Italic cuando proceda.
- Familia B: serif cursiva editorial, con carácter visual claramente diferente. Candidata conceptual Playfair Display Italic o similar, por validar licencia, instalación y comparación exacta.
- No utilizar dos fuentes indiscriminadamente: la alternancia debe responder a significado y jerarquía.

## 2. Tokens visuales provisionales · salida 1080 × 1920

Son **rangos para una primera comparación**, no medidas exactas de la fuente original ni presets aprobados:

| Propiedad | Propuesta inicial |
| --- | --- |
| Texto normal sobre rostro/vídeo | 70–94 px, sans Bold |
| Palabra clave sobre vídeo | 108–152 px, sans ExtraBold |
| Énfasis cursivo | 108–148 px, serif Italic |
| Texto secundario del motion graphic | 58–86 px |
| Texto principal de motion graphic | 112–164 px |
| Espacio entre líneas | 0,90–1,16 × tamaño tipográfico, ajustado por fuente |
| Área recomendada de texto sobre persona | x 10–80 % del ancho, y 40–66 % de alto, adaptando posición al sujeto |
| Motion graphics de pantalla completa | reservar protección a bordes laterales y franja inferior tapada por UI Reels |
| Sombra de captions | negro suave, no borde opaco agresivo |
| Colores | marfil y blanco cálido; naranja fuego/dorado reservado para énfasis; negro en fondo claro |
| Movimiento de captions | entrada limpia, respetar palabra pronunciada y pausa; nunca animación aleatoria cada n segundos |
| Fondo de cuadrícula | solo en escenas de motion graphics, NO detrás del presentador por defecto |

**Aviso de medición:** cada captura ocupa 684 × 1536 px e incluye interfaz de Instagram y teléfono (iconos, título y barras); no trasladar los píxeles de captura directamente al vídeo exportado. Medir primero el rectángulo de imagen real; convertir a coordenadas normalizadas y validar sobre un render 1080 × 1920 en móvil.

## 3. Tres tapices aprobados, incorporados (no derivados de las capturas)

Todos son composiciones verticales estáticas originales, **941 × 1672**, seleccionadas por Carlos:
1. `tapiz-01-cuadricula-antracita-ambar.webp`: cuadrícula antracita con líneas naranja/ámbar visibles. ID privado del editor: `ff9c419c62a2187967029b48a602dabb06cbfd30e0d9a7573334dd0d6e929f21`
2. `tapiz-02-perspectiva-ambar.webp`: cuadrícula perspectiva / profundidad ámbar. ID: `96733f935696ba3ca805af5aa49f4f9c41a8767a7b80db81a17d006ff8c4cf7d`
3. `tapiz-03-ondas-cobre.webp`: degradados y ondas cobre sin cuadrícula. ID: `1b0ad44ab27d9081f161a4185d5e0a5fa05d275f02b4a0562542313e080bf9d8`

Guardados en `03_MOTION GRAPHICS/06_TAPICES_MAESTROS` de Drive, como `kind=image` / `rights=owned` en la biblioteca privada del editor; además, versiones WebP están versionadas en la **rama de pruebas**, no en producción. Su inclusión no implica que el editor las seleccione automáticamente como plantilla.

## 4. Especificaciones para el Director IA / Remotion

- El Video Edit Plan deberá registrar palabra, timestamp exacto, posición, jerarquía tipográfica, recurso visual, duración, máscara/oclusión, fotogramas de entrada/salida y audio SFX.
- Crear layouts distintos `caption-over-speaker`, `keyword-emphasis`, `motion-grid-light`, `motion-grid-dark`, `motion-card`, `foreground-cutout`. La referencia no impone usarlos todos.
- En un plano real, solo subtítulos ordinarios salvo énfasis justificado. Motion full-screen con tapices sin persona, excepto recorte creativo puntualmente autorizado.
- Para capturas con ejemplos de cadenas, candados o efectos políticos, estudiar la técnica de composición; no heredar obligatoriamente sus colores, símbolos ni tono editorial.
- La variante **blanco/dorado** con contraste inverso está solicitada y sigue **pendiente de aprobación final**; no marcarla como guardada.
- Buscar el vídeo original para cronometrar aparición, SFX, ritmo y profundidad de las máscaras; ninguna captura acredita por sí sola esa cinemática.

## 5. Criterio de aceptación

Antes de fijar estilo global: comparar 3 stills con la misma frase en 2 combinaciones de fuentes; medir anchura y altura de letra, comprobar zonas seguras y rostro; obtener aprobación explícita. Después renderizar un fragmento con locución real y comparar palabra por palabra, máscara, recursos explicativos y sonido.

**Estado de QA:** capturas analizadas; 3 imágenes registradas y disponibles en la biblioteca de recursos. Sin cambios en la app de producción ni presets globales. Ninguna auditoría visual completa de la V1 se acredita aquí.
