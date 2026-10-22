# DOPAMIN · ADN audiovisual cuantitativo · 22/10/2026

**Referencia:** `VID_20261022_101557_201.mp4`, identificada por el usuario como DOPAMIN 100 %. Original privado conservado en Drive, sin incorporación como recurso de render.
**Original verificado en Drive:** https://drive.google.com/file/d/1nf9lPujkKSjIrcLTQEIh6Dvi0reViPAP/view

## Datos de origen
- Duración: 55,912604 s; vertical 1080×1920, HEVC, 29,97 fps; audio AAC.
- Análisis técnico ejecutado sobre copia local; no incluye identificación de personas ni reconocimiento del discurso.

## Cambios visuales automáticos (NO equivalen a cortes confirmados)
FFmpeg `select=gt(scene,threshold)` a resolución de análisis 180×320 identifica variaciones grandes en la imagen. Un destello, tipografía o overlay también puede activar el detector; el número de cortes editoriales reales NO está demostrado.

| Sensibilidad | Umbral | Cambios detectados | Eventos/min | Separación mediana |
|---|---:|---:|---:|---:|
| Alta | 0.20 | 45 | 48.3 | 0.501 s |
| Intermedia | 0.32 | 25 | 26.8 | 0.935 s |
| Conservadora | 0.45 | 13 | 14.0 | 2.703 s |

## Distribución temporal
Eventos por bloque de 10 s para el umbral intermedio (0,32):
- 00-10 s: 5 cambios visuales detectados
- 10-20 s: 1 cambios visuales detectados
- 20-30 s: 7 cambios visuales detectados
- 30-40 s: 9 cambios visuales detectados
- 40-50 s: 2 cambios visuales detectados
- 50-56 s: 1 cambios visuales detectados

## Estética de color (medición aproximada)
- Muestras: 56 fotogramas a 1 fps, reducción a 180×320.
- Mediana de píxeles clasificados como rojo saturado: 27.5 %.
- Rojo saturado ≥ 15 % del cuadro en 35 de 56 muestras.
- Mediana de píxeles oscuros (V HSV < 70/255): 60.3 %.
- Estas cifras dependen de umbrales HSV y no representan una paleta profesional exacta.

## Reglas de implementación, no intervalos automáticos
- Mantener a Keanu Reeves como referencia primaria del motor multicapa, y esta muestra como referencia complementaria de dinamismo y jerarquía tipográfica.
- Nunca programar cambios cada 0,9 s por la mediana observada. Decidir cortes, zoom y efectos con evidencias del discurso, pausas y plano.
- Ajustar subtítulos, destellos y B-roll a la cara, al movimiento y a las zonas seguras.
- No inferir rotoscopia o SFX concretos sin inspección técnica independiente.
- No redistribuir el vídeo de referencia ni reutilizar fragmentos en exportaciones.

## Pendiente para aceptación
- Comparar lado a lado con el primer Reel propio editado en DOPAMIN, con revisión estética por Carlos.
- Medir cortes reales con una anotación humana o con análisis multimodal supervisado antes de fijar un objetivo de cortes/minuto.
- Medir música/SFX/voz y sincronía de subtítulos en una fase adicional.

**Estado:** informe técnico medido y guardado como referencia; NO significa que el estilo se haya implementado o pasado V1.
