# POC Remotion · CTA Sues Holistics

Prototipo **aislado** del editor activo: no modifica `package.json` de la raíz ni el servicio del VPS.

## Ejecutar en entorno de pruebas

```bash
cd experiments/remotion-cta
npm install --no-audit --no-fund
npm test
npm run studio
npm run render
```

La instalación requiere Internet y descargará dependencias y, para renderizar, un navegador compatible. El resultado se generará en `out/cta-demo.mp4` **solo cuando se hayan ejecutado con éxito estos comandos**. No se ha desplegado en producción.

El comando `npm run assets` copia **Montserrat Bold/ExtraBold originales del repositorio** a la carpeta pública local y sintetiza los efectos de tecleo, transición y clic sin modelos de pago. Debe ejecutarse desde un checkout completo del repositorio. No subir ni copiar fuentes de forma independiente al cliente.

## Qué incluye la prueba (11 s; 1080 × 1920, 30 FPS)

1. 0–4,6 s: plano de Carlos delante de red neuronal; únicamente subtítulos normales y énfasis grande **transformación profunda**. La voz mantiene la palabra «procesos».
2. 4,6–8,2 s: cuadrícula tenue y texto acumulativo letra a letra con efectos sincronizados; OM arriba izquierda y galaxia arriba derecha.
3. 8,2–9,9 s: perfil de Instagram y dedo pulsando **Seguir**.
4. 9,9–11 s: marca Sues Holistics + «Vuelve a ti» sin recuadro.

**No es el vídeo final**: los medios auténticos se añaden después. Por defecto se muestran maquetas explícitas para el presentador, Instagram y el logo. No se ha generado una captura real ni se ha recreado el logotipo original.

## Archivos reales a incorporar (privados, NO subirlos al Git público)

- `public/assets/carlos-alpha.webm`: vídeo de Carlos segmentado con canal alfa, pendiente de verificación de decodificación.
- `public/assets/neural.mp4`: fondo neuronal elegido y revisado.
- `public/assets/om-alpha.png` y `galaxy-alpha.png`: elementos gráficos transparentes.
- `public/assets/instagram-profile.png`: captura autorizada del perfil @suesholistics; habrá que alinear el botón con su posición real.
- `public/assets/sues-logo.png`: logotipo original con transparencia.
- `public/assets/voice.wav`: locución original. Ajustar después el plan al ASR/ritmo REAL, no inventar sincronía.

Después de incorporar cada archivo, activar su booleano `use*` en `src/Root.tsx` para previsualizarlo. Ninguno se activa automáticamente para evitar rutas inexistentes.

## Comprobaciones pendientes

- Instalar las dependencias y probar la composición en navegador y render MP4 completos; validar vídeo y audio.
- Verificar que el material con alfa se superpone realmente sin rectángulos.
- Comprobar visualmente fotogramas de todas las escenas con los medios reales.
- Ajustar tiempos a la voz de Carlos.
- Validar jerarquía/subtítulos con capturas de referencia aprobadas por Carlos; **las cifras actuales son provisionales**.
- Integrar como módulo reutilizable al editor, sin tocar producción hasta la aprobación.

Licencia y costes deben verificarse según la modalidad de uso y el volumen de negocio. No llamar a servicios de IA de pago ni lanzar render en VPS de producción sin revisar carga/cola.
