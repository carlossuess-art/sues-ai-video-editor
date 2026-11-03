# CTA real reutilizable · Sues Holistics · 03/11/2026

Este experimento no cambia los archivos ni los proyectos existentes de producción. Objetivo: diseñar una **plantilla de CTA con material real**, dos fuentes y las imágenes de tapices aprobadas.

## Locución maestra

«Soy Carlos, facilitador de procesos de transformación profunda. Si quieres desarrollar tu nivel de conciencia, sígueme».

- **Introducción real:** extraer de la grabación privada original `158404.mp4` desde 65.00 hasta 69.15 s. La frase termina cerca de 68.94 s. Su voz real se conserva.
- **Nueva segunda frase:** todavía no está grabada. Se ha silenciado el tramo antiguo («Si quieres aprender alguna cosita más, sígueme»). No se ha clonado ni simulado la voz del usuario, y la parte nueva se deja como **versión de prueba SIN LOCUCIÓN**, con efectos de teclado reales sincronizados al texto.
- Al recibir la nueva toma, guardar exclusivamente en el entorno privado `public/assets/cta-new-voice.wav`, activar `hasNewVoice` y **recalcular fotogramas de inicio y final según la locución**. No ajustar artificialmente su velocidad ni inventar sincronización.

## Timeline de la composición (`CTA-SUES-REAL`)

| Segundos | Composición | Audio |
| --- | --- | --- |
| 00.00–04.17 | Vídeo de Carlos del original + subtítulos dinámicos; «transformación profunda» enfatizado | Voz original |
| 04.17–08.97 | Tapiz 01, cuadrícula antracita y ámbar; cuatro líneas escritas y acumulativas; OM y pequeño símbolo cósmico | Clics mecánicos sincronizados; voz nueva pendiente |
| 08.97–10.97 | Tapiz 02, cuadrícula en perspectiva; identidad Instagram y botón de seguir, mano animada | Clic en el botón; «sígueme» pendiente |
| 10.97–13.00 | Logo ORIGINAL de Sues Holistics de biblioteca existente, y lema «Vuelve a ti» | En la demo no se añade voz ficticia |

Formato 1080×1920/30fps, 390 fotogramas. Montserrat Bold y ExtraBold + Playfair Display Italic SIL OFL (debe conservarse licencia); segunda familia a confirmar con Carlos. Los tapices y la imagen original del logo están en biblioteca privada del editor; se reusan para el render y **NO se sube ninguna grabación privada al repositorio**.

## Ubicación y render aislados

`experiments/remotion-cta/src/CtaReal.tsx` y `src/Root.tsx` definen la composición. `scripts/prepare-real-audio.mjs` usa un efecto de teclado ya licenciado y guardado privadamente. `public/assets/` y archivos MP4 permanecen ignorados por Git; deben prepararse desde los recursos privados del usuario.

Para renderizar en un entorno con medios privados y deps instaladas:
```sh
node scripts/prepare-real-audio.mjs
npx remotion render src/index.ts CTA-SUES-REAL out/cta-sues-real-v1.mp4 --codec h264 --concurrency 1
```

### Pendientes antes de aceptación

1. Recibir voz regrabada para frase nueva y volver a sincronizar sonido, cada línea y botón con la voz.
2. Revisar comienzo, transición, pulsación, logo y audio por fotograma; dos pasadas de QA sin errores.
3. Segunda tipografía candidata Playfair, no preset global aprobado.
4. No confundir este CTA con la reedición completa del vídeo de 73,75 s: el nuevo plan completo irá después, priorizando máscaras laterales y encuadre real.

**Nota de seguridad:** el archivo privado original, voz extraída y logotipo en producción no se agregan a GitHub. No hay API de pago ni despliegue sobre producción.
