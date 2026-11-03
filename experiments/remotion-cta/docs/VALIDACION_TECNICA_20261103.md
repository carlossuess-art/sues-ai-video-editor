# QA técnica · CTA Remotion · 03/11/2026

## Alcance comprobado

- Repositorio existente: `carlossuess-art/sues-ai-video-editor`.
- Rama **aislada**: `feat/remotion-cta-poc-20261103`.
- Motor: Remotion 4.0.540; Node.js 22.23.3; Ubuntu 24.04.
- Instalación aislada: `/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta`.
- Única finalidad: prototipo del CTA acordado. No se desplegó ni reinició `sues-video-editor` y no se usaron modelos/API de pago.

## Verificaciones realizadas sobre el servidor

1. `npm install --include=dev --ignore-scripts`: correcto. El host define `NODE_ENV=production`; para TypeScript es necesario `--include=dev`.
2. `npm test`: 2/2 correctas (escenas contiguas y texto/fotogramas).
3. `tsc --noEmit`: correcto tras instalar los tipos de React de desarrollo.
4. `npm run assets`: genera fuentes locales Montserrat a partir del repositorio y un único WAV sintético de efectos de máquina de escribir, transición y clic.
5. `remotion still`: fotogramas reales exportados y revisados. Primer render: texto invisible porque el host no tenía fuentes; se corrigió instalando bibliotecas de fontconfig/fuentes básicas. La representación inicial de OM era un glifo no disponible y se corrigió con SVG vectorial.
6. `npm run render`: **330/330 fotogramas codificados** con concurrencia 1. Salida `out/cta-demo.mp4`.
7. `ffprobe` en contenedor temporal aislado: **1080 × 1920**, **30 fps**, **H.264 + AAC**, duración **11,008 s**, **1.314.992 bytes**.
8. Decodificación integral de vídeo y audio mediante FFmpeg: **PASS**; volumen medio de la pista de efectos -45,7 dBFS, pico -12,6 dBFS. Esto acredita presencia y decodificación de audio, no percepción subjetiva ni mezcla final.
9. SHA-256: `97c624dfe6a2925b958eacde0051bf21e389dca8e1c106098a6d02ed8907d5ec`.
10. Fotogramas visualizados: presentación/red neuronal; mecanografiado con texto acumulativo y símbolo OM; Instagram con mano y botón; cierre de marca. La galaxia provisional resulta poco visible: **pendiente de sustitución**.

### Entrega reproducible

- Vídeo DEMO sin material privado: [cta-demo-placeholder.mp4](../examples/cta-demo-placeholder.mp4).
- Guion y timing: [PLAN_EDICION_CTA_V1.md](PLAN_EDICION_CTA_V1.md).
- Instalación: `npm ci --include=dev`, `npm test`, `npm run render`, siempre desde un checkout completo del repositorio. Las dependencias se fijan mediante `package-lock.json`.

## Pendientes creativos que NO se declaran terminados

- Vídeo real de Carlos pronunciando **«Soy Carlos, facilitador de procesos de transformación profunda»**, con segmentación correcta de su silueta, eliminación de fondo y mezcla con red neuronal.
- Recurso definitivo de OM y **galaxia de calidad**, con transparencia, proporciones y brillo ajustados. El fallback de galaxia es solo una aproximación técnica.
- Captura **auténtica y actualizada** de `@suesholistics`; recalibrar pulsación y cambio del botón real. La demo contiene una maqueta explícita.
- Logo auténtico de Sues Holistics en PNG transparente. El título de la demo no es el logo.
- Grabación de voz y timings reales. La prueba actual incluye solo SFX.
- Referencias visuales de subtítulos y aprobación de tamaños/posición (Montserrat del proyecto). **No se alteraron presets globales del editor**.
- Revisión en móvil, escucha humana, evaluación estética de Carlos y dos pasadas QA finales sobre medios auténticos. La prueba técnica no demuestra calidad editorial final.

## Instalación Linux

Para habilitar Chrome Headless en el host se instalaron `libnspr4`, `libnss3`, `fontconfig`, `fonts-dejavu-core` y dependencias mínimas. El servicio existente del editor permaneció activo. No se modificó Docker/Caddy/DNS/WhatsApp, ni se ejecutó despliegue.

**Estado:** motor instalado de forma aislada y primera exportación real validada técnicamente; integración productiva y aceptación creativa pendientes.
