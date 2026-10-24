# F7/F9 · QA09 real de sustitución narrativa de B-roll — 24/10/2026

## Resultado audiovisual real, NO aceptado creativamente

Se generó una reproducción **solo de QA**, no un job del usuario ni una versión publicada. Archivo privado: `/opt/sues-video-setup/dopamin-real-broll-qa-20261024/render-conflict-fixed/SUES_DOPAMIN_BROLL_QA09.mp4` (no incluir en Git ni Drive público).

- 68,634 s, 29.712.556 bytes, vídeo H.264 1080×1920, audio AAC mono, decodificación integral PASS.
- SHA256 MP4: `d784965697720bb4c8ba5f91a32d42c56f97c2fcc89d1bfad604f25b6e6b293d`.
- Se preparó contra la configuración real de iteración 08 y el transcrito original. `external-review` primero bloqueó solapamiento entre B-roll y zoom, lo cual es correcto.
- Con permisos explícitos por operación `replaceExistingBrolls:true` y `replaceHiddenZooms:true`, el mismo plan pasó **canApply:true**: 2 B-rolls antiguos demasiado próximos y 2 zooms ocultos retirados; 2 zooms no solapados conservados.
- Escena cadena sobre agua en 9,16–12,54 s de voz, usando 1,51–4,89 s del recurso privado; caminante exterior 40,98–46,92 s usando 0,23–6,17 s del recurso. Ambos mantienen `sourceAudio:false`, `originalVoice:true` y `captions:'preserve'`.
- 88 grupos de subtítulos y tarjeta informativa visibles en los fotogramas de QA muestreados (10,5 s, 25,0 s, 42,5 s). En 42,5 s no hay subtítulo porque el ASR tiene una pausa entre 41,76 y 43,08 s: NO se debe inventar texto en la pausa.

## Medida de audio y prueba fuerte de preservación

Los dos MP4 (QA09 y la iteración 08) se decodificaron de forma idéntica a PCM mono S16LE/16 kHz con FFmpeg. **El SHA256 de ambos flujos PCM es exactamente igual**: `43fbc4b9f2ba09491ccd5b810b37a59e838f5b60dc4b8f317ee39ae23d46554a`. Se ha comprobado, no inferido, que los cambios visuales no alteraron el audio final.

Medición FFmpeg `loudnorm` sobre el audio FINAL de ambos MP4: `input_i=-15.57 LUFS`, `input_tp=-2.01 dBTP`, `input_lra=2.20 LU`. No confundir las estadísticas *output* simuladas por loudnorm con el fichero ya exportado, ni el valor `-16.8 LUFS` de la normalización de VOZ antes de mezcla con la sonoridad del MP4 final. Música en plan al 18 %, efectos 30 %, voz 150 % según configuración de la iteración 08; la coincidencia PCM indica que la mezcla es la misma, pero **no implica aceptación auditiva humana en móvil**.

## Pruebas técnicas / bloqueo de publicación

- `13/13` casos focales de revisión/colisiones y nuevo flujo de plan PASS; `npm run check` PASS.
- Suite integral: `319/321` PASS en Docker restringido; los dos casos de despliegue Git requerían host y habían pasado allí previamente. No se han atribuido fallos al nuevo planificador.
- Código local de la corrección: `/opt/sues-video-setup/dopamin-broll-conflict-resolve-20261024` commit `65c44a8bb2e81e7ceedcf4ac824f9fe9ff126c8c`. GitHub PR #15 BORRADOR INCOMPLETO. Fuente backend remota de PR difiere del blob local (`e96077e4719db470cead3b574d736c1298d4f6a2` frente a `a33a7139225a6aafbd6ca2d6db24fbff61798e65`); faltan UI y otros archivos. **No fusionar ni desplegar PR #15** hasta comprobar correspondencia de blobs y pruebas.
- Bloqueo: el conector rechazó publicar un cambio de la UI; mantener la diferencia documentada y resolver únicamente por vía autorizada. Producción sigue en `b7a7d74ecf2d1b931e6448f5353415d6bb1ce032`. Original iteración 08 inalterado SHA256 `bedb0d504642f71ab03e1f3db061c9417bdc2e15b8ff6bdc42b441e0cfc65cbc`.

## Lo que falta

Revisión audiovisual completa por Carlos y comparación con el referente DOPAMIN (no equivalencia actual); mejorar cinética de captions, ritmo de montajes y elección narrativa; terminar publicación autorizada de UI y sincronización exacta de PR; diagnóstico/QA posdespliegue. No confundir un MP4 válido y audio idéntico con V1/F9 aceptadas. Global oficial 48 %, coste externo de servicios 0 €.
