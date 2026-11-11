# SUES Engine Next · B02: eliminar fondo del grupo infantil con alfa · 08/11/2026

**Estado: candidato con evidencia técnica real, pendiente de validación artística. No desplegar ni publicar.**

## Diagnóstico visual

La composición de los niños detrás de Carlos en B02 (Reel 158404, 9,5–13,5 s) tenía una transición vertical evidente entre el fondo original y la fotografía. El recurso con 90 px de feather no bastaba.

Se capturaron con FableCut real tres variantes del JPG de niños a 11,5 s: **90, 240 y 400 píxeles** de feather. El de **240 px** reduce la transición sin desvanecer tanto a las figuras como el de 400 px. Se revisó también a 10 y 13 s. Aun así, la fotografía seguía teniendo un borde visible.

Una solución más apropiada fue procesar la fotografía original con el modelo local MODNet ONNX y generar un PNG de 512×896 **RGBA** con siluetas de las cuatro personas y fondo transparente, sin servicio externo ni créditos. En vista de prueba sobre fondo blanco/negro conservó las cuatro personas principales; presenta **halos claros en parte del pelo y ropa**, por lo que **no cumple todavía la QA cinematográfica V2**. Se preserva el JPG original.

Se sustituyó **solo el medio de la pista V2 en un clon FableCut aislado**; se mantuvieron Carlos V1/V3, matte temporal V4 y oro HyperFrames V5. Se retiró la máscara rectangular del recurso infantil, porque el PNG ya incluye su propio canal alfa. Capturas nativas inspeccionadas en **10,0, 11,5 y 13,0 s**: se elimina el recuadro fotográfico y las cuatro figuras siguen visibles a la derecha detrás de Carlos. El oro V5 permanece arriba a la izquierda.

## Exportación, integridad y resultados

En la copia aislada `127.0.0.1:7781`, eliminada después, se exportó de forma **nativa en FableCut** el intervalo 11,0–11,5 s:

- **15 frames H.264 distintos, 1080×1920, 30 fps**, AAC estéreo 48 kHz; `/api/export/job` `status=done`; informe del exportador `ok=true`.
- Audio **una sola voz**, −21,8 LUFS y verdadero pico −11,5 dBTP. No es mezcla de entrega aprobada.
- Primer frame del MP4 frente al visor FableCut nativo a 11,0 s: **SSIM 0,973466**. Se comprueba un único fotograma de paridad, no los 120.
- La opción de foto con feather 240 px también se exportó nativamente 15 frames a 11,0–11,5 s con `ok=true`, SSIM **0,973445**, audio idéntico. La comparación entre los dos SSIM **no determina por sí sola cuál es estéticamente mejor**, porque cambian los píxeles de la composición.
- Huellas SHA256 verificadas del JPG `193ee26b6578228ddc29fcfd3a501760cb73366541324a3f03cd50e759d521b4`, modelo MODNet `07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9` y alfa PNG `252939e06b787a17ef93de159f49f9e86731d7e628ced605b567968bd283fe5e`.
- Se repitió el script de inferencia de imágenes desde el mismo JPG y modelo, obteniendo **exactamente el mismo SHA256** de salida. Inferencia sin GPU ni APIs externas, CPU local.
- Copias de 227 MB (feather) y 222 MB (alfa) de las instancias temporales se eliminaron después de conservar evidencias. FableCut persistente y editor público siguen HTTP 200 sin cambios; proyecto original seis clips, B02 desactivado.

## Evidencia en VPS

- `/srv/sues-fablecut-next/data/qa/b02-edge240-v5-proof-20261108/`: capturas nativas 90/240/400, tres instantes de 240, proyecto multipista, MP4 nativo 15f, informes y huellas.
- `/srv/sues-fablecut-next/data/qa/b02-child-cutout-candidate-20261108/`: PNG RGBA y referencias blanco/negro del modelo.
- `/srv/sues-fablecut-next/data/qa/b02-child-alpha-proof-20261108/`: PNG alfa, proyecto editable JSON, MP4 exportado, tres capturas reales, SSIM, inspección visual y manifest SHA.

## Código en PR27

- `scripts/engine-next/infer-modnet-still-alpha.py`: ejecución offline reproducible, entrada y modelo con SHA256 obligatorios, salida directorio nuevo, PNG RGBA y manifest de candidato; no altera el timeline.
- `src/engine-next/native-b02-child-alpha.js` y `tests/engine-next/native-b02-child-alpha.test.js`: adaptador estricto aislado, preserva original JPG, V3/V4 y V5, evita fingir aprobación.
- `src/engine-next/native-b02-matte.js` y tests: feather acotado 90–300 px, por defecto 240 como **fallback QA de fotografía**.
- **55/55 pruebas dirigidas superadas** después de sincronizar GitHub; producción NO desplegada.

## Bloqueos y siguientes validaciones

1. **Halos del pelo y ropa**: probar despill/recoloración alfa, preservar pelo y cuatro figuras; revisión humana de detalles y licencias del recurso visual.
2. Exportar **los 120 fotogramas del B02 con el PNG alfa** y revisar continuidad de borde y movimiento, especialmente cuando Carlos cruza sobre niños.
3. Integrar más elementos cinematográficos narrativos: subtítulos progresivos y originales en pistas, entradas/salidas, SFX y títulos sin tapar cabeza.
4. Realizar exportación y QA completa del Reel, mezcla de voz y frontend FableCut integrado y autenticado en SUES. Ninguna prueba visual intermedia implica aprobación de Carlos.
