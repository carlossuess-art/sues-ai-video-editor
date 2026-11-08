# 08/11/2026 · SUES B02 · refinamiento de halos RGB del grupo infantil

**Estado: candidato técnico auditado, NO calidad cinematográfica aprobada, NO desplegado.**

## Problema
PNG recortado de cuatro niños mediante MODNet en V2 sin rectángulo de fondo. Al examinar los bordes aparecieron halos de color en mechones de pelo y ropa, especialmente sobre el fondo real de la escena con Carlos delante. Debe conservarse el canal alfa para no erosionar ni hacer desaparecer niños, extremidades y pelo.

## Experimento y resultado
Se crearon dos correcciones locales del mismo PNG RGBA de 512×896, manteniendo el canal alfa **byte por byte**. Algoritmo offline: partir de los píxeles suficientemente opacos (alfa >0,92), propagar su RGB a la franja hasta 12 píxeles de distancia ortogonal y mezclar el color en zonas semitransparentes (alfa 0,02–0,91) con fuerza **50%** o **85%**, sin cambiar ningún valor alfa.

- JPG original y PNG inicial conservados, ningún servicio externo ni crédito de IA.
- PNG fuente SHA256 `252939e06b787a17ef93de159f49f9e86731d7e628ced605b567968bd283fe5e`.
- Variante 50% SHA256 `aac8b173f301df941a5e9e882c17f7231d34b8cdb36e5991326b7313d7213ea0`, modificados en RGB **17.216** píxeles; mismo canal alfa original (verificado tras decodificar el PNG producido).
- Variante 85% SHA256 `023b9df049fdc85b77d9e01d494b3c3ece61745d9d78839f8c557e9b9a3ba9e5`, modificados en RGB **17.944** píxeles; canal alfa también sin cambios.
- Tres capturas del **visor nativo FableCut** a 11,5 s (inicial / 50% / 85%). Comparación visual: diferencias **sutiles**, con posible oscurecimiento excesivo del 85%; **50% queda como candidato conservador, no una mejora visual certificada**. SSIM entre fotogramas nativos original y 50% 0,999478, lo que demuestra que el tratamiento apenas modifica la composición global; no debe confundirse con calidad de contorno.
- Exportación nativa del candidato 50% en clon privado `127.0.0.1:7781`, ventana 11,0–11,5 s: `status=done`, reporte técnico FableCut `ok=true`, 15 fotogramas H.264 únicos, 1080×1920 a 30fps, audio AAC 48kHz estéreo **−21,8 LUFS y −11,5 dBTP**.
- Paridad del primer fotograma exportado con el visor: SSIM **0,973417**, con `cinematicQA=false`. Aún **no** se ha exportado la escena completa de cuatro segundos con esta nueva variante, y no hay aprobación del pelo.
- Recursos preservados en VPS: `/srv/sues-fablecut-next/data/qa/b02-child-alpha-despill-20261108/` (dos PNG y método); `/srv/sues-fablecut-next/data/qa/b02-despill50-native-proof-20261108/` (PNG 50%, tres capturas FableCut, detalles comparativos, MP4 nativo, informe de exportación, SSIM, proyecto QA, manifest con SHA).
- Instancia QA temporal de ~224MB detenida y eliminada después de guardar evidencia; proyecto FableCut persistente 7780 y editor público HTTP 200, originales **seis clips**, B02 desactivada.

## Código reproducible PR #27
- `scripts/engine-next/refine-modnet-still-edge.py`: CLI local con rutas absolutas, sha de entrada obligatorio, máximo 30 MB, destino nuevo, corrección RGB a 50% u 85%, verificación decodificada de alfa byte a byte, manifiesto de origen y resultado. Ejecución de repetición obtuvo **el mismo SHA exacto** del PNG 50%.
- `src/engine-next/native-b02-edge-refinement.js`: adaptador de edición **solo QA** que crea media independiente V2 y conserva original para deshacer; protege V3/V4/V5 y revisión esperada.
- **BLOQUEO ENCONTRADO EN QA REAL:** el normalizador nativo FableCut descarta metadatos personalizados `media.alphaSha256` incluso cuando estaban en el objeto inicial. El primer adaptador requería ese campo y falló con un proyecto real aunque los tests de objetos sintéticos pasaban. Se corrigió fijando los hashes SHA256 **verificados de este caso concreto** y verificando cualquier campo existente sin asumir que FableCut lo persista. La trazabilidad de SHA permanece fuera del proyecto, en manifest. Prueba nueva con medio normalizado sin `alphaSha256`; validación **real de proyecto por `checkProject` de FableCut PASS** con 8 clips / 9 medios y V4 intacta.
- Suite dirigida tras esta modificación: **58/58 PASS**; PR y GitHub sincronizados.

## Pendiente antes de publicar
Los halos siguen requiriendo juicio visual humano, posiblemente mejores modelos de matting/despill en la zona de pelo. Exportar 120/120 con variante aprobada solo tras decidir cuál es realmente mejor; controles de continuidad, subtítulos progresivos, montaje, música y mezcla final; editor multipista único e integrado y aprobación de Carlos. **No declarar la fase de cine cerrada por una mejora marginal de SSIM.**
