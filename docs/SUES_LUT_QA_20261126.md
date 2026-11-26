# SUES · Evaluación visual de LUT Creator Club · 26/11/2026

Se descargaron dos colecciones de Drive y se extrajeron 18 originales `.cube` distintos por nombre. Los LUT se aplicaron con FFmpeg `lut3d` e interpolación tetraédrica sobre un mismo fotograma vertical de Q03 a 10,00 s. Se usó como fuente `r14-source.mp4` (1080 × 1920). SHA-256 de la referencia de prueba de 216 × 384: `140f6f2c94fd882b4ed98c0c7474dd05fb69bcee9a11bb72add03fa125bc8d83`.

Visualmente se compararon piel, fondo, luminosidad y contraste sobre la cuadrícula. Las [métricas y hashes](SUES_LUT_QA_METRICAS_20261126.json) contienen luminancia Rec. 709, saturación media, diferencia rojo-azul y proporción de sombras y altas luces cerca de los extremos. Son mediciones de este fotograma.

| Emoción | LUT candidato | Resultado observado |
| --- | --- | --- |
| Intriga | Planeta Alienígena | Tinte frío y contraste oscuro con cromatismo global cercano al original. |
| Dolor | Calor Desvanecido | Baja la luminancia de 0,461 a 0,390 y conserva detalle en la cara. |
| Tensión | Thriller Urbano | Sombra más marcada y tendencia oliva en el entorno. |
| Introspección | Océano oscuro | Baja la luminancia a 0,347 y da un aspecto pizarra al fondo. Sube la saturación ligeramente, de 0,240 a 0,248. La variante Sombra fría necesita reducir saturación y recuperar margen en sombras. |
| Revelación | Urbano Crudo | Aumenta la luminancia a 0,542. Las altas luces extremas suben a 3,6 %, por lo que la intensidad requiere moderación. |
| Confianza y serenidad | Vibrante Luminoso | La saturación, 0,234, es la más cercana al original. Piel legible y tono discreto. |
| Alegría | Vintage Jungle | La imagen más luminosa de la colección, 0,618, con calidez visible en piel. Requiere graduar intensidad para evitar piel amarilla. |
| Esperanza | Nostalgia Cálida | Calidez clara con luminancia 0,473. La saturación sube a 0,444. Una intensidad intermedia es la siguiente prueba adecuada. |
| Blanco y negro dramático | Ajuste de prueba monocromo | Muestra con saturación 0 y contraste 1,15 sobre el mismo fotograma. |

El ZIP contiene las versiones originales, inventariadas por colección, nombre, tamaño de tabla y SHA-256. Las pruebas conservan los originales. Los favoritos son candidatos para integración. La prueba es fotográfica y queda pendiente validar continuidad temporal, aplicación por clip o tramo y paridad del compositor FableCut. Los archivos Creator Club y el fotograma se conservan fuera del repositorio de código. La demostración visual se guardó como `SUES_Comparativa_18_LUT_20261126.png`.
