# Reel 158404 · B02 · Visor preciso, matte y cierre técnico · 08/11/2026

**ESTADO: QA TÉCNICA B02 120/120 PASS EN CLON PRIVADO. NO APROBACIÓN ESTÉTICA NI REEL COMPLETO.** Normativa Film Director V2 D01–D77; storyboard de siete escenas/49 operaciones intacto.

## Visor preciso en FableCut aislado
- La captura antigua en t=10 podía dibujar un frame VFR desfasado antes de que el vídeo terminase de buscarlo. La versión QA emplea decodificación WebCodecs para V1/V3/V4, espera los frames activos y descarta solicitudes de cabezal obsoletas.
- Script `scripts/engine-next/stage-fablecut-private-paused-preview.py`: genera copia aislada y falla si cambia el código original. Nunca escribe en el FableCut instalado ni publica el clon.
- Pruebas Chromium reales: pausa en 10, 11,5, 13; salto rápido con victoria del último tiempo; transición Play/Pause/Play; liberación del decodificador al reproducir y al exportar. Revisión V3 cancela un Play diferido si se pulsa Pausa o se cambia de tiempo, evitando arranques sorpresa.
- **Límite pendiente:** el Play mientras se decodifica puede tardar ~7 s. Necesita mejora de latencia y QA del transporte antes de producción.
- Auditoría visor exacto/export B02: 120 frames H.264 distintos, tres muestras RGB SSIM mínimo **0,965979**. Fuente original VFR 120 muestras ROI descubierta: mínimo **0,965467**, mediana **0,972625**, ninguna inferior a 0,95.

## Máscara temporal B02 9,5–13,5 s
- Matte MODNet H.264 512×896, 120 fotogramas/30 fps, SHA256 `374b6aceb86ed532d9d6bf283e8d36fccd31a96f0366554ebd07532f8f3d79c0`.
- Script `scripts/engine-next/audit-b02-temporal-matte.py` sobre los 120 frames: cobertura binaria **47,63%–51,18%**, máximo cambio de pixels por cuadro **1,939%**, movimiento de centroide máximo **2,23px** a 128×224, cero alertas de continuidad.
- La plancha original sí muestra manchas oscuras en zona de ropa/brazo y posibles huecos de alfa. **Continuidad técnica no garantiza bordes/pelo/manos ni estética**. No aplicar morfología indiscriminada.
- Artefactos PRIVADOS VPS `perf-20261108/B02-temporal-matte-full-120f-continuity.json`, `B02-temporal-matte-contact12.jpg` y `B02-native-output-and-matte-five-keyframes.jpg`.

## Cierre cruzado de evidencia sin aprobación creativa
- Módulos `src/engine-next/b02-proof-closure.js` y `scripts/engine-next/close-b02-evidence.mjs`: cotejan SHA de fuente/matte/MP4, ventana, V1/A1 bloqueados, niños V2 Wide x180/y−250/scale0,73 con fades IN/OUT 0,3s, Carlos V3 con matte V4, oro V5 desactivado, export y VFR ROI 120f.
- Ejecución sobre archivos reales: `B02-milestone-integrated-technical-closure.json` da `technicalReady=true`, 0 fallos técnicos, pero **7 bloqueos artísticos**, `cinematicQA=false`, `approvedByCarlos=false`, `fullReelCompleted=false`. Las pruebas negativas rechazan videos/huellas cambiadas, proyecto sin voz protegida y matte con discontinuidades.
- Siguen pendientes `title-3` «NO MOLESTAR», `captions-2` palabra a palabra (11 candidatos ASR por validar auditivamente), mezcla musical/licencia, revisión de bordes full-resolution, dos pasadas de supervisor y aceptación artística.
- Proyecto original FableCut `127.0.0.1:7780` revisión54/seis clips intacto. QA `127.0.0.1:7784` cerrado. Nada publicado ni copiado a GitHub que contenga rostro/voz/niños.

**Correspondencia de storyboard:** `REEL_158404_B02_STORYBOARD_V2_REVIEW_20261108.md` es la salida humana. Este informe y el anexo de operaciones preservan los ID originales sin entregar un JSON importable falso.
