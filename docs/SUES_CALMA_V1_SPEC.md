# CALMA · definición cerrada y primera plantilla funcional

Decisión de Carlos18/10/2026: el dossier de43p y su referencia Keanu contienen
información suficiente para fijar la base visual. No esperar a definir otras
plantillas ni volver a preguntar por los parámetros ya analizados.

Fase5 cerrada al100% en su alcance original: Brand Kit, motor reutilizable y una
plantilla funcional. No significa reproducción exacta de cada efecto de Keanu,
aceptación audiovisual de cada exportación o V1 del sistema completo.

## Especificación común y adaptación CALMA

| Elemento | Base fijada | Aplicación actual y certeza |
| --- | --- | --- |
| Familia tipográfica | Sans bold, variantes condensadas/oblicuas; familia intercambiable | Inter4.1/OFL como aproximación implementada. Dossierpp3/5: Montserrat es candidato propuesto, no identificación confirmada. |
| Subtítulo | Grupo progresivo1–3palabras; máximo2líneas | Se conserva la voz y su alineación real. Tokens con tiempos inciertos no reciben duraciones inventadas. |
| Jerarquía | Palabra importante2:1; máxima importancia añade color/material | Blanco y nueve bandas reflectantes para oro/verde/cian/azul/coral; metal estático. La preferencia2:1 es de Carlos, no medida universal del original. |
| Composición | Texto y recurso al servicio del contenido, rostro y zonas seguras | El apoyo automático busca región arriba/medio/abajo/lateral durante todo su intervalo. No fijar una posición universal según la referencia sentada. |
| Integración de imagen | Máscara espacial suave más fundidos temporales | Feather inferior arriba del rostro; feather superior debajo. No equivale a recortar el cuerpo. |
| Entrada de texto | Construcción progresiva y caracteres escalonados | CALMA24ms/130ms,8px,−3°→0°: adaptación implementada, no medidas recuperadas. |
| Ritmo CALMA | Pausado, cámara suave, recursos con intención | Grupo máx2,4s; zoom relativo base1,04/tope1,18 con límite absoluto del motor. No acelerar la voz. |
| Recursos | Naturaleza/exteriores/retiros cuando aporten significado | No imponer dinero/Matrix/cadenas por aparecer en Keanu. Uso propio/licenciado. |
| Transiciones | Diferenciar blur global, expansión radial y luz cálida | Bloques disponibles400ms. Su densidad automática por estilo pertenece al Director pendiente. |
| Marca y cierre | Kit común | Blanco#FFFFFF,oroSUES#D7B56D,oscuro#101820; cierre3s«Vuelve a ti · Sues Holistics». |
| Sonido | Voz original y cama ambiental controlable | Ganancia,ducking,fades y limitador; sin afirmar identificación de SFX del original. |

El informe distingue OBSERVADO/APORTADO/PROPUESTO/PENDIENTE. Un valor propuesto
sirve de punto de partida y no debe presentarse como dato recuperado del MP4.

## Colocación adaptativa comprobada

Imágenes añadidas desde la app usan `auto-subject`: se proyecta el track facial
existente con el crop y zoom reales a30fps de salida. Se prueban regiones con
margen48px y se elige una caja estable para todo el intervalo; no perseguir al
sujeto con saltos. Protege subtítulos, cierre y otros apoyos. Si no cabe durante
todo el tramo, rechaza el ajuste con motivo, sin tapar al sujeto a ciegas.
Los perfiles con una caja explícita conservan esa decisión y se validan.

Prueba FFmpeg sintética: rostro alto→apoyo880–1160px con máscara superior;
rostro medio→apoyo180–460px con máscara inferior. Movimiento entre regiones sin
hueco común→rechazo. Evidencia: examples/preview/subject-layout.synthetic-result.json.
No es prueba de un vídeo caminando ni segmentación del cuerpo. La geometría se
basa en detecciones existentes; los cambios entre muestras aún requieren validar
más grabaciones al integrar análisis automático de originales nuevos.

## Trabajo restante, en su fase correspondiente

- F6: segmentación del sujeto/sillón, oclusión real detrás del cuerpo, capas y
  efectos adicionales del dossier, SFX y más recursos aprobados.
- F7: elección semántica avanzada, densidad de eventos y adaptación narrativa.
- F8–F9: análisis automático de nuevos originales, QA de navegador/móvil y
  aprobación de exportaciones reales. No registrar aprobación humana ficticia.
- F10: VPS/HTTPS y conexiónMCP con ChatGPT; CapCut opcional.

Esta separación conserva todos los pendientes; no desaparecen por cerrar F5.
IMPACTO/EXPLICA/HISTORIA siguen experimentales y heredan esta base. Plantillas
nuevas se crean cuando un caso concreto lo necesite.
