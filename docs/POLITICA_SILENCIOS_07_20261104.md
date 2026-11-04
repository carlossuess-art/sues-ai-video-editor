# SUES AI VIDEO EDITOR · Política de pausas habladas (04/11/2026)

**Orden vinculante de Carlos:** «Deja un máximo de 0,7 segundos de silencio en las frases. El resto lo cortas».

## Regla única para Remotion, Editor y Director IA

- Los intervalos entre palabras/frases de voz **no excederán 0,7 s** en nuevas ediciones autorizadas. Los huecos de 0,7 s o inferiores se conservan.
- Calcular huecos con timestamps fiables de la voz, no solo con `silencedetect`, ya que puede haber música o ambiente audible mientras nadie habla. Comprobar audio de la fuente cuando sea posible. Si un tiempo es incierto, marcar para inspección, no cortar a ciegas.
- En cualquier hueco superior a 0,7 s, recortar únicamente el exceso, centrando el corte, guardando ≥40 ms de margen respecto de las palabras cuando haya espacio. A 30 fps, dejar típicamente 0,67–0,69 s; no truncar fonemas.
- Ejecutar cortes simultáneamente en imagen y audio; preservar/recalcular `sourceTimeMap`, captions, keyframes, transiciones, máscaras, B-roll, SFX, pista musical y CTA. En V3C se aplica el recorte al compuesto completo para mantener todo unido.
- **Excluidos por defecto**: intro anterior a la primera palabra y pantalla/logo posteriores a la última palabra. Evitar borrar colas musicales por confundirlas con pausas entre frases.
- El render es derivado no destructivo. Originales y versiones anteriores quedan disponibles. QA de decodificación, recuento de fotogramas, mapas de tiempos y muestras 1 fps completas + 4 fps; inspección a 30 fps de uniones dudosas y escucha humana antes de aceptación creativa.

**Código canónico:** `src/speech-pause-cap.js`: `capSpeechPauses(transcript,{limitSeconds:.7,fps:30})`, `mapSourceTimeAfterPauseCuts`. `src/source-cuts.js` emplea por defecto 0,7 s para **proponer** los recortes seguros; el comportamiento de la UI anterior de pedir confirmación para aplicar propuestas sigue preservado. `tests/speech-pause-cap.test.js`: pruebas nuevas. La skill privada SUES AI Film Director **v1.4.3** incluye `references/PAUSAS_VOZ_07.md`, alcanzada desde `KEANU_ADN.md`. El Director IA deberá activar esta política al preparar nuevos renders. **No confundir** una propuesta de corte del editor con aplicación automática en proyectos viejos.

## Implementación verificada en 158404 V3C

- Fuente: `out/SUES_158404_V3_REGLAS_158623_BORRADOR_PRIVADO_20261104.mp4`, 76,309 s (con 3 escenas Remotion y CTA). Se conserva intacta.
- Salida: `out/SUES_158404_V3C_SILENCIOS_MAX_07_20261104.mp4`. SHA256 `a519295ca72a6c508cbcf69424b0a6c7e3d36cea897a2c9c278c9f3ea426bbbf`; 24.130.904 bytes, H.264/AAC, 1080×1920 y 30fps.
- 7 cortes, 59 fotogramas retirados, **1,966667 s**; duración final **74,343 s** (vídeo 2.230 fotogramas / 74,333333 s y audio 74,342 s). Máximo de pausa calculada tras los cortes: **0,693333 s** según transcripción de 168 palabras. 0 avisos de límites inciertos.
- Procedimiento reproducible y auditable: `experiments/remotion-cta/scripts/build-pausecap-07-v3.mjs` genera manifiesto EDL + script de filtros; `experiments/remotion-cta/scripts/render-v3-pausecap-07.sh` produce copia MP4 con corte simultáneo de vídeo y audio y microfundido de audio en cada unión. Los archivos de QA y `pause-cap-07-manifest.json` permanecen en `out/v3-drafts-20261104/` del VPS.
- QA: 17/17 pruebas de cortes del worktree PASS (incluidas pruebas históricas); decodificación completa de vídeo y audio PASS; `ffprobe` 2230 frames, 74,343s PASS; revisión visual 74 fotogramas a 1fps y 297 a 4fps, especial atención a entradas/salidas; original y V2B conservados. La revisión auditiva humana definitiva sigue pendiente.
- Nuevo proyecto privado en el **mismo editor existente**, sin recarga ni consumo API: `https://editor.suesholistics.com/?project=7032b26b-eb87-446c-8d62-39ce40f541e3`, título `EL PRECIO DE SER QUIEN NO ERES · V3C · PAUSAS 0,7s`. Perfil `PREVIEW_READY`, transcripción retemporizada y vídeo fuente aplanado que reproduce la versión editada; las capas editables originales siguen en código Remotion, no se prometen en la línea temporal nativa.
- Producción: módulo de propuestas `source-cuts.js` y nuevo `speech-pause-cap.js` desplegados con backup previo en `/opt/sues-video-setup/editor-backups/20261104-pausecap-proposals/`. Servicio reiniciado y HTTP 200; comprobación del módulo en contenedor PASS (límite 0,7 s). El reproductor ligero implementado antes permanece intacto.
- **Límite técnico**: no se ha cambiado el valor por defecto de `automaticDeletion:false` para montajes existentes; no se deshabilita el consentimiento de cortes manuales por editar una fuente vieja. La aplicación automática a futuros trabajos se ejerce desde el Director/flujo V3C y debe integrarse como etapa predefinida del render automático en Fase 9. V3C aún espera aceptación creativa de Carlos.

## Continuidad
Roadmap Maestro y PROJECT_STATUS llevan este hito. No recalcular porcentajes de fase. No declarar V1 completa ni publicar el Reel hasta aprobación. Próximo paso: revisión personal de V3C, correcciones creativas y puesta a punto de la integración automática del plan/timeline.
