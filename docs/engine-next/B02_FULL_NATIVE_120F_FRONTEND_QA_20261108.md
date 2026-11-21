# 08/11/2026 · B02 120f FableCut con V5 y PNG alfa refinado + frontend temporal real

**Resultado técnico conseguido. NO aprobado cinematográficamente. NO fusionado ni desplegado.**

## 1. Exportación definitiva de prueba B02 (4 segundos)

Se generó de forma **nativa en FableCut** desde un clon aislado privado `127.0.0.1:7781` de la escena B02 en el Reel 158404, intervalo **9,5 a 13,5 segundos**, con **seis pistas**:

- V1: vídeo Carlos original, audio desactivado.
- V2: niños en **PNG transparente con RGB de halo refinado al 50 %**, media independiente del PNG anterior y JPG original, SHA `aac8b173f301df941a5e9e882c17f7231d34b8cdb36e5991326b7313d7213ea0`.
- V3: Carlos primer plano recortado con matte de luminancia, audio desactivado.
- V4: matte MODNet **temporal de 120 fotogramas**.
- V5: objeto 3D dorado HyperFrames en primer plano a la izquierda, **10,6–11,8 s**, sin tapar a los niños.
- A1: **única voz** a volumen 0,8.

La composición permanece editable con clips separados en el proyecto FableCut JSON, no es un vídeo preaplanado creado por FFmpeg.

**Resultado del exportador FableCut:** `status=done`, `report.ok=true`, **120/120 fotogramas H.264 únicos**, 1080×1920, 30 fps, 4,000 s, color bt709, audio AAC estéreo 48 kHz. Medición de audio: **−23,4 LUFS**, pico verdadero **−5,3 dBTP**, sin mezcla externa posterior. Archivo **5.009.816 bytes**.

Se compararon 3 capturas **reales del canvas FableCut** con los fotogramas exportados en los tiempos correspondientes:

| Tiempo del Reel | SSIM de preview/export |
|---|---:|
| 10,0 s | **0,969279** |
| 11,5 s | **0,978741** |
| 13,0 s | **0,967357** |
| Mínimo / media | **0,967357 / 0,971792** |

**Técnicamente correcto:** 120 hashes de frames decodificados distintos, sin cuadros consecutivos idénticos. Plancha visual de 12 instantes del MP4 exportado: Carlos delante, niños detrás y oro V5 visible únicamente en su intervalo. **No significa que el borde de pelo, fondo, escala, mezcla o coherencia narrativa estén aprobados**. La comparación solo usa 3 capturas del visor, no los 120 puntos de referencia. El Reel completo de ~74 s aún no se ha producido desde esta línea de tiempo.

### Evidencia persistente en VPS
`/srv/sues-fablecut-next/data/qa/b02-despill50-full-120f-proof-20261108/`:
- `B02-4s-FABLECUT-NATIVE-120f-DESPILL50-V5-UNAPPROVED.mp4`
- `staging-editable-project.json` (8 clips de escena, 9 medios, 6 pistas)
- `native-export-job-120.json` con informe del proveedor
- `native-full-parity.json` con los 3 SSIM, y capturas PNG nativas a 10/11,5/13
- `decoded-frame-hashes.txt` con 120 huellas; plancha 12 instantes `contact-12frames-NATIVE-120.jpg`
- PNG de cuatro niños refinado y `manifest.json` con SHA256.

Copia de trabajo QA de ~225 MB eliminada tras conservar los artefactos; puerto privado 7781 detenido. FableCut persistente 7780 y editor público SUES responden HTTP 200. Proyecto original de seis clips permanece con B02 desactivada, revisión 53. No se desplegó ninguna modificación pública.

## 2. Frontend de pruebas SUES: línea de tiempo proporcional y fotogramas

Código actualizado en la misma rama GitHub PR27:
- `web/engine-next-timeline.js`: cálculo puro de duración, posiciones y anchuras de clips dentro de pistas, tiempo `mm:ss:ff` y salto real de `1/30 s` con límites.
- `web/engine-next.js`, `web/engine-next.html`, `web/engine-next.css`: representación temporal proporcional, controles para buscar, avance/retroceso de 1 cuadro, marcador de posición y vista de fotograma nativo del mismo proyecto; evita que refrescar el estado haga regresar el cabezal al principio del clip seleccionado. Los fotogramas viejos se ocultan al cambiar el tiempo para no presentarlos como vigentes.
- `src/editor-server.js`: ofrece el nuevo módulo estático y sirve correctamente imágenes PNG/WebP como tales, preservando origen JPG. El backend de FableCut permanece únicamente en loopback detrás de autenticación SUES para operaciones NLE.
- `tests/engine-next/timeline-geometry.test.js` y actualización `tests/editor-server.test.js`. **61/61 pruebas dirigidas PASS** con rama ya restaurada.

**Incidencia de sincronización y solución:** una lectura del conector de un archivo con más de 1000 líneas devolvió solo las primeras 1000. Esto produjo un commit con `src/editor-server.js` truncado y las pruebas fallaron. Se restauró el archivo completo desde el commit anterior (`git show 7a8a820:src/editor-server.js`) y se reaplicaron **solo** el content-type PNG/WebP y la nueva ruta estática. Se subió a GitHub con lectura explícita de más de 1600 líneas, comprobando más de 1100 y el cierre del archivo. **61/61 tests PASS tras la restauración**; producción nunca se tocó.

**Navegador Chromium real:** se sirvió el HTML de pruebas temporalmente por `127.0.0.1:8098`, interceptando solo las respuestas de API con un proyecto sintético de 6 pistas, y se comprobó:
- 6 pistas visibles;
- posición del clip de niños **12,8784 %** y anchura **5,4225 %**, coherentes con 9,5–13,5 s en vídeo de 73,7667 s;
- duración visible `01:13:23`;
- búsqueda a `00:11:15` y salto de un fotograma a `00:11:16`;
- retorno a vídeo fuente funcional;
- **cero errores de página** detectados en la prueba.
Se detuvo y eliminó el servidor de QA `8098`. Este test simula los datos de API, **no equivale a una prueba de la UI integrada con el backend FableCut real en producción**.

## 3. Pendientes imprescindibles

1. Inspección visual humana en movimiento y corrección fina de halos de pelo/ropa y semántica de la escena infantil (Film Director V2 D01–D77), con recursos debidamente licenciados.
2. Subtítulos palabra a palabra y títulos/efectos en el timeline NLE, con revisión de voz y mezcla cinematográfica final.
3. Integrar completamente FableCut con el frontend SUES autenticado para trabajar con una única autoridad de proyecto, en lugar de la UI de staging que todavía no es NLE completo.
4. Probar exportación del Reel entero, no solo de 4 s, y la paridad de preview/export en un conjunto suficientemente completo de fotogramas.
5. Aprobar visualmente el Reel con Carlos antes de publicar o desplegar producción.

**No se han gastado créditos de APIs externas en esta tanda.**
