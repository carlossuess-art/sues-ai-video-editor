# Catálogo de referencia · Presets DaVinci de Carlos · 2026-11-09

Estado: **inventariados; NO instalados, NO convertidos, NO probados en FableCut**. Documento de referencia para el equipo de programación, no contrato de capacidades.

## Procedencia y compatibilidad

Se inspeccionaron seis archivos .drfx de Google Drive del usuario. Un .drfx es un ZIP con plantillas Fusion .setting y recursos; FableCut/Remotion no ejecuta .setting de forma nativa. No copiar el ZIP a una biblioteca FableCut como si fuera un efecto ejecutable. No incluir archivos de terceros en el repositorio ni redistribuirlos sin verificar licencia.

| Archivo de Drive | ID | Plantillas .setting | Propuesta |
|---|---|---:|---|
| PRESETS V3 - DAVINCI.drfx | 1YAavusADb0IXg6qK0_qfdxEaXMlRBM7x | 12 | Referencia para títulos; Brillo, Botar, Crecimiento, Dispersión |
| Creator Club-Presets Minimalistas.drfx | 1gjrv_JyTN7yd1mEis7HylYYpDUmNVjZz | 9 | Zoom, Camera Pull, blur, deslizar texto |
| MagicAnimateV2.drfx | 1Tw0P0vQO8UMlarMEgE2j3TBKVT6qWIW7 | 3 | Animaciones de transición; inspección técnica necesaria |
| EasierEase.drfx | 103vYVNr48S2xqHYEzimS4CjzNvvsVGCu | 1 | Curvas easing; recreación matemática |
| SSC_PosterizeTime.drfx | 1RuQkOov1Ne4tWIFv51h4KD8idawxjoII | 1 | Movimiento escalonado, prioridad baja |
| VG Deep Glow.drfx | 1B7ma6my_J7PQltDS6OOBVl1s0SVYYT6j | 1 | Resplandor; prueba de fidelidad y coste de render |

Total: 27 plantillas .setting. Nombres completos y contenido del paquete principal en su archivo original de Drive.

## Integración correcta en SUES AI VIDEO EDITOR

1. **Remotion**: recrear efectos de texto/posición/escala/opacidad/easing con keyframes y tipografía verificadas, si el contrato y el renderer lo permiten. La compatibilidad no está probada.
2. **FableCut nativo**: reutilizar efectos existentes solo tras confirmar API, parámetros y resultado visual en la versión desplegada.
3. **FFmpeg**: valorar glow, blur y overlays cuando el motor nativo no pueda reproducirlos; evitar nuevos renders si hay vía nativa equivalente.
4. **Catálogo**: registrar fuente, autor/licencia, efecto equivalente, duración visible, parámetros, pista, motor, estado de QA y evidencias. No marcar un efecto como disponible antes de probarlo.
5. **Master Director**: no introducir nombres de presets DaVinci en `operations[].effect` hasta que figuren en capacidades confiables del servidor. Mantener tiempos exactos y aprobación humana.

## Priorización para prototipos (sin despliegue)

P1: Camera Zoom In, Camera Pull, Intro Blur, Blur cinematográfico, Deslizar texto, Brillo.
P2: Botar, Crecimiento, Deep Glow, Easier Ease.
P3: MagicAnimate, PosterizeTime, bordes redondeados.

Criterios de aceptación: inspección de nodos Fusion originales; mapeo técnico explícito; comprobación de licencias; prueba sintética con comparación de fotogramas y movimiento; duración visible 0,5–1,2 s para destellos/transiciones cuando proceda; revisión visual humana; pruebas de regresión; despliegue separado y autorizado.

**Ningún efecto se considera convertido o incorporado a producción por la existencia de este catálogo.**
