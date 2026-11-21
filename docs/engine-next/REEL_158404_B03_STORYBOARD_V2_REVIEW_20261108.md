# SUES Film Director V2 · Reel 158404 · Escena 03 «El conflicto» · Storyboard humano

**08/11/2026. ESTADO: PRUEBA NATIVA PARCIAL, PENDIENTE APROBACIÓN ARTÍSTICA. NO IMPORTABLE.** Conserva los ocho ID de escena 03 y los 49 del plan maestro `sues-master-story/v1`; voz y bruto auténticos protegidos. Normativa V2 D01–D77.

## Escena 03: 16,83–26,67 s
- **Plano A `shot-3-1` 16,83–20,80:** Carlos y voz originales. `M01-overlay`: dos bloques cinematográficos «DECIR NO» frente a «SENTIR CULPA» delante de cámara, sincronizados con palabras auténticas, sin cubrir el rostro. No sustituir la composición por simples textos sin volumen/animación.
- **Plano B `shot-3-2` 20,80–24,10:** Carlos presente. `GIF-STOP-overlay` previsto 22,85–23,95: mano STOP alfa sobre pecho delante del sujeto, con tiempo/entrada/salida anclados a la voz. El WebM existente dura **0,966 s/29 frames**, mientras la operación de storyboard dura **1,10 s**: discrepancia abierta; no alargar ni desplazar sin escuchar.
- **Plano C `shot-3-3` 24,10–26,67:** retorno limpio a Carlos tras el gesto, continuidad verbal y visual.
- **Título `title-4` 23,04–24,10:** «LÍMITES» protagonista, preferentemente sobre cabeza, Montserrat Bold si se verifica archivo/weight; blanco/beige/naranja fuego, neón deliberado permitido por D47. **PENDIENTE** voz, tamaños, contraste y safe zone real.
- **Subtítulos `captions-3` 16,83–26,67:** debajo barbilla, palabra por palabra acumulativa, máximo dos líneas salvo necesidad, negaciones y palabras originales conservadas. ASR no verificado: **NO activar todavía**.
- **Música `music-scene-03` 16,83–26,67:** arco emocional, voz prioritaria, ducking/SFX y licencia acreditados; PENDIENTE de recurso y mezcla.

## Recurso STOP: comparación con visor real FableCut en el segundo 23,25
Se habilitó el recurso VP9 alfa original de 29 frames en **clones privados**, manteniendo V1 fuente y A1 voz bloqueados, sin alterar FableCut producción. Cinco posiciones reales:
| Geometría FableCut x/y/scale | Decisión de revisión |
| --- | --- |
| 340/700/0,33 base | Mano demasiado pequeña y abajo/derecha. |
| 0/0/0,58 centrada | **DESCARTADA**: tapa boca/cara. |
| 150/100/0,50 superior derecha | **DESCARTADA**: tapa cara. |
| −120/455/0,46 pecho izquierdo | Cara libre, más cerca de zona central captions; candidata. |
| **160/430/0,46 pecho derecho** | Cara libre, tamaño más legible, mejor separación del rostro; **candidata provisional, NO APROBADA**. |

- **Ejecución real:** la mano de pecho derecho se exportó con FableCut nativo en **15 fotogramas H.264 1080×1920/30fps y AAC estéreo/48kHz, 0,500 s**. Los 15 cuadros son distintos, audio decodificado idéntico al de la mano base, sin fondo negro. MP4 privado SHA256 `27e7a01e892d2c1faf83d8a3d66b0a841295d588c9eb15d4a00b96968f95ae88`.
- **Defecto artístico:** mano fotográfica aislada con muñeca rectangular abrupta, aunque transparente. Se creó candidato reversible de **feather espacial de los últimos 24px del canal alfa**: WebM VP9 alfa 29 frames SHA `71aae21683898da325f6f36817963f01b6982a79ea59a1ac7e5b3fe98b5d27d4`. Visor FableCut real confirma suavizado localizado, pero el corte sigue perceptible; NO aprobado ni exportado 15f.
- Los recursos originales y los JPEG/MP4/WebM quedan PRIVADOS en VPS `perf-20261108/B03-stop-hand-first-15f`. Comparativas `B03-STOP-three-positions-contact.jpg`, `B03-STOP-baseline-vs-chest-placements.jpg`, `B03-STOP-chest-right-15f-contact.jpg` y `B03-STOP-wrist-feather-before-after-crop.jpg`.

## Siguientes puertas, sin recortar la historia
1. Verificar palabra real y tiempos de inicio/salida de STOP, «LÍMITES» y confrontación «DECIR NO/SENTIR CULPA».
2. Confirmar derechos del recurso y mejorar o sustituir la muñeca cortada si el gesto no alcanza la calidad requerida.
3. Ejecutar entero el plano con M01 cinematográfico, title-4, captions-3 y música licenciada, sin perder capas/ID.
4. QA visual/auditiva a 30fps, dos pasadas del bloque completo y aprobación de Carlos. La escena **no está terminada**.

**Salida técnica coordinada:** `REEL_158404_B03_STOP_ALPHA_TECHNICAL_ANNEX_20261108.md` (**NO IMPORTABLE** hasta autenticar voz/timeline/recursos y capacidades).
