# Fase 6 · Presets de voz cinematográficos · 21/10/2026

## Objetivo y límites

Añadir los primeros dos **efectos de voz por frase**, siguiendo el plan acordado de la biblioteca definitiva y sin descargar activos nuevos ni reconstruir el renderizador.

- `cinematic-echo`: eco/reverberación discreta con voz original conservada.
- `vintage-tv`: voz telefónica/televisión antigua mediante paso alto/bajo, reducción de resolución controlada y ruido rosa sintetizado con semilla fija. La pista de estática se genera por código, no es un archivo stock ni se descarga nada de Drive.
- Parámetros: máximo 4 fragmentos de 0,7 a 6 segundos; intensidad 0,10–0,85; sin solapamientos y con 150 ms de separación; se protege el inicio. Aplicación temporal por `start`/`end` sin inventar timestamps.

## Implementación

En `src/voice-effects.js`, el motor FFmpeg ramifica el audio original, añade solo el efecto a los segmentos seleccionados con fundidos de 140 ms, atenúa gradualmente la voz sin filtrar únicamente durante el efecto televisión y recompone a audio único con limitador. Los filtros están integrados *antes* de música y SFX en `renderAudioFilters`, y mantienen el resto de la cadena de mezcla y los subtítulos intactos. No se altera la fuente y no se invocan URLs, IA de pago ni proveedores externos. Determinismo mediante semillas constantes.

El Director valida `voiceEvents`. El contrato pegable de Gemini `sues-edit-plan/v1` admite `{type:"voice",preset:"vintage-tv",start:8.6,end:10.5,intensity:0.6}`, con revisión anterior al guardado de nueva versión. Los eventos inválidos detienen la propuesta sin editar el proyecto original. La ejecución externa usa los mismos controles de autenticación y versionado ya existentes.

## Pruebas verificadas

1. `tests/voice-effects.test.js`: 4 nuevos tests PASS (tipos/intensidad/gaps/rechazos; grafo determinista y sin archivos externos; continuidad de fuente+captions; plan Gemini/rechazos).
2. Suite conjunta focalizada voz, SFX personalizados, SFX nativos, plan externo: 14/14 PASS en imagen runtime que dispone de FFmpeg.
3. Regresión general en Docker sin red: 267/268 PASS. Caso único que falla no es del editor: el test de Git `safe.directory` requiere `git` no incluido en la imagen; se ejecutó por separado en el VPS, 2/2 PASS.
4. `node scripts/check.mjs` pasó en host VPS; `git diff --check` sin problemas.
5. MP4 real aislado con voz existente + B-roll sintético + ambos presets. Fuente original 12.979956 s, B-roll del segundo 5 al 8, eco 1.1–3.1 s, televisión 8.6–10.5 s. Salida MP4 H.264 1080×1920, 30 fps, 12.966667 s, 4 grupos de subtítulos, audio presente, auditoría fullDecode PASS, voiceEffects con ambos eventos. No se ha ejecutado sobre producción ni sobre recursos comerciales.
6. Comparación técnica del audio por volumedetect: render original -20.8 dB de volumen medio, con voz FX -20.7 dB. Los dos muestran picos 0.0 dB digitales; **la corrección de margen True Peak y masterización profesional continúa PENDIENTE**. Tampoco hay todavía revisión humana de timbre e inteligibilidad. No contar los presets como aprobados creativamente.

## Estado de implantación

Esta rama es independiente de `feat/library-video-assets-20261021`; parte del último estado documentado y reutiliza todos los módulos de biblioteca, vídeo/overlay, plan Gemini y Fase 6. La versión pública anterior al bloque es `a5430f21b7d44c0e814a621e36d8f30eefd4ab38`. No actualizar el estatus de producción sin comprobar deploy, commit, acceso HTTPS, Whisper ASR y copias.

## Próximo hito

Probar integración y seguridad del release, respaldo completo con Whisper en reposo, desplegar si no hay riesgo y verificar la web real. Incorporar desde sesión autorizada B-roll comprado, verificar uso desde Gemini con SFX y FX de voz, revisar audio con auriculares/móvil, fijar nivel de picos (ideal <= -1 dBTP), después elementos detrás del sujeto y Director IA semántico.
