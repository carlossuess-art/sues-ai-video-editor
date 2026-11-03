# QA de CTA real Remotion · 03/11/2026

## Estado de la tercera exportación

- MP4 renderizado privadamente: `cta-sues-real-v3.mp4` (sin acceso público).
- **13.013 s**, 1080 × 1920, H.264/AAC, tamaño **4.126.585 bytes**, SHA-256 `569cc8ebb8ecc2038df4699d2b1862536dff029cda8ebc88af93bcd390a84368`.
- Se importó en la biblioteca **privada** del editor como vídeo con licencia, ID = SHA-256 anterior; accesible solo con sesión de editor en `/api/assets/{id}/media`.
- No se ha fusionado el código ni desplegado en producción. Se registró como asset nuevo sin alterar originales o proyectos antiguos.
- Primera pasada: fotogramas de cada escena en Remotion; detectó texto faltante al final.
- Segunda pasada: captura de contacto del MP4 cada segundo, 13 fotogramas; todas las frases completas visibles, cambio de escena, botón de seguir, logo y cierre presentes.
- Decodificación integral con FFmpeg sin errores. `ffprobe` confirma H.264/AAC y duración; test de volumen de primera toma: voz -26,2 dBFS media, pico -3,1 dBFS. Segunda toma elevó el tecleo de media -50,1 a -38,1 dBFS y pico -15,4 dBFS.
- Prueba de código `tsc --noEmit` correcta.

## Limitación BLOQUEANTE para CTA final

El usuario pidió regrabar «Si quieres desarrollar tu nivel de conciencia, sígueme». No se dispone de esa locución. Desde 4,17 s está silenciada la voz antigua; los efectos sonoros siguen. **La v3 es una DEMO técnica, no el final aprobado ni un clon vocal**. No sustituir automáticamente con TTS ni prometer sincronía sin grabación.

Próximo paso: recibir audio seco de Carlos con esa frase, alinear cada palabra con la nueva toma y reeditar; después auditar audio e imagen dos veces antes de usar como plantilla estable.
