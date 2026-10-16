# SUES CALMA · siete referencias recibidas · 16/10/2026

## Estado y alcance

Fase 5/10 al 50 %, global 45 %: sin incremento por catalogar referencias.
Base técnica consultada: `2d85e3b01c5fbb390886f469766e709a61a1bfa0` en
`feat/phase-4-vision-camera`. Carlos indica que los siete archivos son para CALMA.
La revisión revela Reels ya editados: se clasifican como referencias de estilo.
No se añaden al catálogo de B-roll ni se reutilizan sus marcas, personas o música
como si fueran material limpio de Sues. Las fuentes originales quedan intactas.
No se modifica aún la política ejecutable de CALMA ni el BrandKit.

## Inventario verificado

Todos: 1080×1920, 30 fps, vídeo y audio presentes. Total 363,769 s incluyendo
el duplicado. El manifiesto `examples/references/calma-20261016.inventory.json`
contiene hashes SHA256 de archivo y payload de cada stream, tamaño, duración,
IDs y enlaces Drive, momentos muestreados y observaciones por archivo.

| Archivo (VID_20261016_) | Duración s | Observación visual en muestras | Aplicación propuesta |
| --- | ---: | --- | --- |
| 122919_008.mp4 | 57,887 | Interior cálido, sentado, captions discretos, objetos/libro | Composición y subtítulos |
| 123007_459.mp4 | 57,887 | Mismos payloads de vídeo y audio que el anterior | No contar dos veces |
| 123139_098.mp4 | 46,087 | Fondo oscuro, columna numerada, libros y rótulo superior | Recurso explicativo opcional |
| 123155_545.mp4 | 59,467 | Dos personas en interior, rótulos de colores | Comparación opcional |
| 123219_741.mp4 | 40,860 | Exterior/piscina, plano conjunto y planos próximos | Exteriores y variación de encuadre |
| 123248_823.mp4 | 48,479 | De pie, pantalla con imágenes, captions/CTA | Apoyo visual puntual |
| 123512_257.mp4 | 53,102 | Jardín, sentado, vegetación, palabras destacadas | Exterior y composición |

Los dos primeros tienen SHA256 de archivo diferente pero hashes idénticos de
payload comprimido de vídeo y audio. Esto no compara timestamps ni metadatos
contenedor. Cuatro imágenes muestreadas de cada uno son idénticas píxel a píxel.
Conclusión práctica: siete archivos, seis referencias distintas por payload.
No se elimina ningún original.

## Qué aporta a CALMA

Conservar dirección previa: documental cinematográfico, naturaleza/exteriores y
retiros; voz propia, tratamiento natural y recursos que acompañen la idea.
Las muestras aportan un presentador protagonista, captions blancos legibles y
cambios de escala/apoyos gráficos. Propuesta editorial: tomar composición,
legibilidad y exteriores; reducir densidad de rótulos, usar el acento del BrandKit
y reservar listas/comparativas para pasajes que lo necesiten. Esto es una
interpretación editorial inicial, no un ADN cuantificado ni decisión estética final.

La plantilla existente sigue provisional: B-roll 2,5–6 s, cobertura ≤40 %,
separación ≥3 s y selección semántica. Estos números son reglas previas, NO
medidas extraídas de las referencias. Zoom, fuentes exactas, cortes/minuto,
transiciones, SFX, música y relación con el discurso quedan pendientes de
análisis temporal completo. No se afirma que aquí haya B-roll de naturaleza
ni escenas reales de retiros.

## Evidencia y reproducción

Originales y hoja de contacto: carpeta canónica
https://drive.google.com/drive/folders/147twZ2YKpU1-ZHlVgp_MNLa3kPM18KH9

Hoja de contacto:
https://drive.google.com/file/d/1FFeEvCg1I0RREYGRyHq3veMvUPX0JQ5f/view?usp=drivesdk

Utilidad nueva, Python estándar + ffmpeg/ffprobe, sin llamadas de red:

```sh
python scripts/references/inspect_media.py --out runtime/references /ruta/a/VID_*.mp4
```

Ejecutada sobre los siete archivos: 7 lecturas completas para SHA256, hashes de
los streams, metadatos y 28 imágenes al 10/35/65/90 % de duración. QA visual de
las 28 imágenes en hoja de contacto. Manifiesto validado: siete entradas, un
grupo de payload repetido, resolución y exclusión de B-roll. La utilidad trabaja
sobre originales en lectura y crea derivados en --out. No ejecuta MediaPipe,
ASR, detector de cortes ni seguimiento facial. No se ha escuchado el audio ni
visionado íntegramente los Reels. No se reejecuta la suite del motor porque no
se modifica su código; la última suite del motor sigue siendo 80/80 histórica.

## Continuación

Analizar temporalmente las seis referencias únicas para medir cortes, cambios
de escala, captions y motions antes de cerrar el ADN. Mantener el trabajo técnico
pendiente de `SUES_CALMA_PROVISIONAL.md`: mapa edición→fuente, renderer local,
safe zones y aplicación real de look/audio/outro. No confundir hoja de contacto
con preview de la plantilla ni con aceptación E2E.

Coste externo nuevo: 0 USD. Sin compras, generación, render de pago ni Lovable.
Bloqueos de catalogación: ninguno. No hace falta pedir más referencias ahora.
Necesito de Carlos: nada para continuar el análisis y la implementación provisional.
