# 08/11/2026 · B02: subtítulos progresivos nativos V6 + ASR local no aprobado

**ESTADO: CAPACIDAD TÉCNICA PROBADA. LAS PALABRAS REALES NO ESTÁN APROBADAS. NO FUSIONAR, DESPLEGAR NI PUBLICAR.**

## 1. Motor de subtítulos nativos: V6, sin aplanar vídeo
- Se reutilizó el compilador preexistente `src/engine-next/progressive-captions.js`, que crea una capa de texto por palabra, acumulando la frase progresivamente sin mostrarla entera desde el inicio. Bloquea la compilación si la transcripción no tiene revisión humana o si la geometría es incierta.
- Nuevo `src/engine-next/native-b02-caption-layers.js`: inserta los clips **desactivados por defecto** en una pista **V6** por encima de V5 oro y V4 matte, solo en copias de revisión expresamente nombradas. Ancla source original a SHA256 `9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad`; exige revisión y fingerprint coherentes, clip times 9,5–13,5, IDs únicos, integridad de V1–V5 y posición de texto acotada. La rama explícita `syntheticOnly` autoriza únicamente laboratorio rotulado, **no transcripciones reales inventadas**.
- Nuevo `tests/engine-next/native-b02-caption-layers.test.js`: previene texto activo inesperado, revisión falsa, tiempo fuera de B02, clip duplicado, y verifica progresión de `PRUEBA` → `PRUEBA DE` → `PRUEBA DE CAPAS`.
- FableCut `checkProject` NATIVO aceptó el proyecto real de B02 ampliado de 8 a **11 clips y 7 pistas (V6,V5,V4,V3,V2,V1,A1)**. Ningún clip original se sobrescribió.
- Se comprobó el compositor real de FableCut aislado `127.0.0.1:7781`: 1 fotograma con V6 **desactivado**, luego 3 capturas activadas temporalmente a **10,0667, 10,5 y 10,9 s**. Se observa acumulación correcta de las palabras de **laboratorio** bajo la barbilla, manteniendo niños detrás, Carlos delante y oro V5. **Es texto sintético, no voz de Carlos.**
- Exportación nativa de media segunda de prueba **10,8–11,3 s**, FableCut `status=done`, `report.ok=true`, **15/15 fotogramas H.264 únicos** 1080×1920 30fps, AAC estéreo 48 kHz, **−22,0 LUFS y −11,5 dBTP**. El frame MP4 #3 (10,9 s) contiene realmente `PRUEBA DE CAPAS`, comparado con su equivalente en el visor con **SSIM 0,967116**. No se utilizó FFmpeg para añadir el texto al vídeo; exportado por FableCut.
- Evidencias persistentes: `/srv/sues-fablecut-next/data/qa/b02-v6-progressive-caption-native-proof-20261108/`: MP4 sintético, proyecto 11 clips, capturas original/3 estados, contacto visual, frame exportado, 15 hashes únicos y manifiesto SHA. Copia QA de 225 MB eliminada. Producción 7780 y SUES HTTP 200, original seis clips B02 desactivado y **sin V6 ni palabras sintéticas**.
- **63/63 pruebas dirigidas superadas** en la rama tras sincronizar GitHub.

## 2. Palabras candidatas del audio real (fuera de la línea de tiempo)
- Se utilizó `faster-whisper-base-int8` ya instalado, CPU local, sin APIs externas, para proponer palabras sobre la voz original del Reel 158404 (duración ~73,747 s). Modelo local revisado `Systran/faster-whisper-base` revision `ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66`.
- El análisis automático produjo **168 palabras propuestas** para el audio completo y **11 solapadas con los segundos 9,5–13,5**. Una de las 11 tiene confianza inferior a 0,5. No reproducirlas como transcripción literal aprobada ni introducirlas en V6 sin revisión.
- La voz en `sues-158404-voice.m4a` tiene SHA256 `4ef5fdaa558de448dcc8f42bfd69cbbc6f41e1d7df99c977ae55731f55fb70c0`. Comparación FFmpeg de audio 16kHz mono original vídeo y voz separada por correlación cruzada en ventanas **4–24 s** y **50–70 s**: **desfase 0 ms** en ambas, correlaciones **0,99988465** y **0,99982641**. Esto respalda el reloj compartido para preparar tiempos, **no la exactitud de cada palabra**.
- `compileVerifiedWordCaptions` al recibir el ASR automático **bloquea correctamente** la preparación de capas reales: `WORD_TRANSCRIPT_REQUIRES_HUMAN_REVIEW` y `CAPTION_FACE_SAFE_POSITION_UNVERIFIED`. Resultado **cero clips reales incorporados**, como debe ser.
- Evidencias para revisión (no publicadas): `/srv/sues-fablecut-next/data/qa/b02-local-asr-candidate-20261108/`: `asr-candidate-unreviewed.json`, `audio-clock-audit.json`, `audio-clock-audit-tail.json`, `voice-video-identity-manifest.json`, `caption-readiness-audit.json`. No se ha duplicado un documento con el texto privado en GitHub.

## 3. Próxima puerta de calidad (Film Director V2)
1. Verificar las palabras del segundo 9,5–13,5 escuchando el vídeo original, corregir confianza y límites de cada palabra, incluido posible primer/último término cortado.
2. Confirmar posición **debajo de la barbilla** en movimiento sin cubrir rasgos, 2 líneas máximo de preferencia, 3 únicamente necesario; impacto de palabras clave según normativa.
3. Importar pruebas **reales** a V6, mantener inicialmente desactivadas hasta revisión y exportar B02 120 fotogramas con subtítulos exactos.
4. Validar mix, narrativa, encaje con b-roll y 3D y después Reel completo antes de cualquier merge/deploy.

No afirmar que un proyecto de prueba con tres palabras sintéticas prueba que las palabras reales ya estén sincronizadas o aprobadas.
