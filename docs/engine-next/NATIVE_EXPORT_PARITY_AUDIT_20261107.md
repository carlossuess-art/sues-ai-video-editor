# SUES Engine Next · FableCut exportación nativa con matte B02 · QA aislada 07/11/2026

**Estado:** EVIDENCIA TÉCNICA PARCIAL. **NO ES APROBACIÓN VISUAL/CINEMATOGRÁFICA NI DESPLIEGUE.**

## Qué se ha demostrado
Se recuperó de la prueba anterior un proyecto FableCut **editable** en tres pistas B02: niños V2 con `props.masks` y feather 90; Carlos foreground V3 con `props.matte=luma` y `props.matteTrack=V4`; vídeo grayscale MODNet V4 de 120 cuadros sobre bruto original V1. Se creó una copia temporal independiente en 127.0.0.1:7781, jamás usando ni reescribiendo FableCut persistente 127.0.0.1:7780 ni el editor público.

Se exportó realmente con la función `/api/export/request` de FableCut, usando `{ "range":"in-out", "where":"headless" }`, intervalo absoluto 10–10,5 s del Reel 158404 (0,5 s, 15 cuadros). Headless Chromium y FFmpeg corrieron localmente en la VPS.

### Incidencia y mitigación limitada
1. Primer intento de exportar falló con `presented frame timeout`; FableCut exige `requestVideoFrameCallback` sobre las capas de vídeo y la VPS tarda más que los límites 80/250/600 ms.
2. **SOLO EN LA COPIA QA** de `app.js` se aumentaron los tres esperas a 500/1200/2500 ms, sin modificar ni la instalación persistente ni el código del proveedor en producción.
3. Con este ajuste experimental se obtuvo el MP4 **native** completo de 15 fotogramas (1080×1920, H.264, 30 fps, AAC estéreo 48 kHz). El primer reporte del exportador falló **solo** el control de true peak: +0,1 dBTP (exceso de 0). No declarar primer archivo aprobado.
4. Se volvió a exportar cambiando volumen de las tres fuentes de audio/vídeo presentes en la escena a **0,65**, exclusivamente en el clon QA. Segunda exportación: reporte `ok=true`, audio integrado −24,4 LUFS, pico verdadero −1,0 dBTP, 15 cuadros, 0,5 s, H.264, AAC. Este nivel NO es una mezcla final aprobada.
5. Comparación entre el PNG nativo de FableCut a 10,0 s y el primer frame de las dos exportaciones: **SSIM RGB All 0,976552**, PSNR primer export **38,711840 dB**. H.264 es con pérdidas y SSIM a un solo frame NO certifica sincronía, matte, oclusiones ni equivalencia temporal completa.
6. Decodificación frame-md5 de la segunda exportación: **15 cuadros / 15 hashes distintos**, sin adyacentes duplicados. Audio decodifica sin errores.
7. Independientemente, se analizaron los **120 cuadros** de MODNet del tramo 9,5–13,5 s con `scripts/engine-next/audit-modnet-continuity.py`: cero saltos sobre los umbrales definidos (Δ cobertura >0,05; salto centro >0,08); máximo Δ cobertura 0,01708, máximo desplazamiento normalizado del centro 0,01505 y diferencia media de alfa 0,00885. Estas cifras **NO son validación perceptual de bordes**.

## Evidencia persistente en la VPS
`/srv/sues-fablecut-next/data/qa/native-export-parity-20261107/`: exportación inicial, exportación con audio corregido, proyecto QA de control, PNG visor, trabajos FableCut con sus reports, prueba de similitud, framemd5, prueba de estabilidad, error log de audio, diff de los tiempos de espera y manifest con SHA256.

Fuente temporal del matte:
`/srv/sues-fablecut-next/data/qa/modnet-158404-b02-120frames.{mkv,json}`.
Proyecto FableCut multipista sin exportar:
`/srv/sues-fablecut-next/data/qa/native-b02-editable-20261107/`.

**Huella SHA256 segunda exportación:** `2d8e2c29f43257274a2110dc083036e27892bdd15f8d1e00feaeefec6c058fbf`.
**Huella SHA256 primera exportación:** `44f6bf5b02e4df1f1c896fd6ed729b493763f8e70767f7c7fb5f6ad0e066970c`.
**Huella SHA256 fuente original:** `9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad`.

La copia temporal QA ~214 MB y su puerto 7781 se detuvieron y borraron **tras conservar evidencia**. Editor público y FableCut persistente siguen HTTP 200, sin cambios en proyecto de producción.

## Código de regresión reutilizable
- `src/engine-next/export-parity-audit.js`: garantiza número de cuadros/formato/resolución, extrae diagnóstico, cuenta hashes distintos; no concede aprobación.
- `tests/engine-next/export-parity-audit.test.js`: rechaza datos incorrectos/incompletos y mantiene `cinematicQA:false`.
- `scripts/engine-next/audit-native-export-parity.mjs`: FFprobe + imagen nativa + FFmpeg SSIM + framemd5, huellas SHA256 y reporte de lectura.
- `scripts/engine-next/audit-modnet-continuity.py`: comprueba transiciones de cobertura y centro de máscara en todos los cuadros.

## Puertas siguientes (no terminadas)
- Resolver en el motor definitivo la captura/exportación determinista sin confiar en aumentar ciegamente temporizadores, y comprobar que la edición concurrente no produce carrera.
- Exportar **120/120 cuadros** del tramo B02 y compararlos de forma temporal con el visor; con 3,8 GiB RAM y CPU de VPS podrá tardar mucho.
- Revisar perceptualmente matte continuo, bordes finos, gestos, silueta, integración de niños y fuentes visuales/licencias.
- Validar un objeto alfa delante + textos/captions progresivos + mezcla de voz; aprobar estéticamente y pasar QA de SUES Film Director V2 antes de publicar.
- Integrar frontend multipista FableCut autenticado dentro de SUES, preservando proyecto y edición manual/IA en una sola autoridad.
