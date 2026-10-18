# Corrección del nivel visual · F6

Carlos rechaza la muestra sintética de iconos. Los tests y el número de
componentes no justifican el nivel visual de la referencia. Se retira la
estimación del80%; no se ofrece un nuevo porcentaje sin criterio validado.

## Nueva propuesta sobre el original

Tarjetas con arcos/nodos, movimiento de parallax, cuadrícula y viñeta; palabra
protagonista, sin encabezados de relleno. Comparación con recorrido progresivo.
Sello inclinado con halo, esquinas y entrada de escala; mantiene el texto literal.
Fotografía de la propia mirada, derivada del fotograma6,2s, a sangre en el tramo
superior libre de rostro, con acercamiento y feather. No fotos de terceros.

La integración rectangular inicial se revisó y descartó. La segunda variante
llena el ancho superior y se desvanece sobre el plano. El recorte de ojos procede
del original de Carlos, no de un modelo o del vídeo de referencia. Tiene el límite
de resolución de esa grabación. No es una máscara corporal ni oclusión tras él.

## Reproducción

```sh
node scripts/templates/prepare_reference_scene.mjs PROYECTO_RECUPERADO NUEVO_DIRECTORIO
python3 scripts/templates/render_local_preview.py --source ORIGINAL --bundle NUEVO_DIRECTORIO/bundle --out NUEVO_DIRECTORIO/preview.mp4
```

Receta ligada al SHA50c56298e59f783b2dfe2979c80ddc4e83a84ab4eb9048aa56ff8423be67ba6a;
no se presenta como Director semántico general. Usa análisis y música existentes.
El script reproduce la imagen derivada, ASS y filtro del render final, comprobados
byte a byte. El perfil mantiene archivos privados fuera de Git.

Slow-push preserva alpha mediante dos transformaciones idénticas, RGB y alpha,
y alphamerge antes del feather y los fundidos. Verificación FFmpeg con PNG de
prueba: esquina transparente RGB35/49/61 conserva base37/50/62 dentro de tolerancia;
centro opaco RGB9/218/50 mantiene verde. EdgeToEdge no relaja la colisión facial
ni permite invadir subtítulos/cierre. Se habilita sólo por perfil explícito.

## Validación y entrega

178tests y comprobaciones de sintaxis/diff correctos. Dos renders visuales;
final38,30s,75/75palabras,31grupos,2zooms,3tarjetas,3transiciones,1imagen.
H264/AAC1080×1920/30,15.537.555bytes. SHA256
74573fa3233e77fc51acb4478b10be04f6564151a2f4e01d5f5f5fe557d4a7fa.
Fuente intacta/fullDecodePASS. Música propia existente con ducking, ganancia0,1.
Sin escucha humana completa ni aprobación deCarlos.

QA8frames:5,35/5,9/6,35/7,9/9,9/10,7/18,5/24,8s. Revisión de foto/fades,
transición radial, tarjetas y sello. No se afirma igualar todos los recursos Keanu.
Library libfile_2a84f53e0d3481918293577deb46eb99,
SUES_F6_COMPOSICION_REAL_V2.mp4. Evidencia pública sin rutas privadas:
examples/preview/motion-library.visual-review.json.

Siguen pendientes la segmentación/oclusión, recursos aprobados adicionales, SFX,
semántica avanzada, navegador/PWA y VPS/HTTPS. No compras, generación, nuevas
inferencias ni cambios aWhatsApp/Caddy/DNS. Coste externo0USD.

## Tipografía y motions · decisión posterior de Carlos · 18/10/2026

Prevalece sobre la regla anterior de Inter/2:1: Montserrat real Bold para texto,
ExtraBold para mayúsculas destacadas, Bold Italic y ExtraBold Italic según rol.
Proporción de tamaño14/12 conforme al último ajuste indicado y comunicado.
No sintetizar negrita/cursiva. Ver assets/fonts/montserrat/sources.json y métricas
calibradas con libass; no sustituir assEmHeight1562 por hhea sin prueba de píxeles.
Anton y Allerta Stencil son las fuentes libres usadas para el sello; no afirmar
que Allerta sea Arial Black. Futhark usa Noto Sans Runic, Unicode sin transliterar.
Las tres escenas son recreaciones por capas de la especificación del usuario;
la muestra17s lleva música, sin voz, y no es el Reel final ni aceptación de F6.

## Dirección visual aceptada · 18/10/2026, 19:57 Europe/Madrid

Carlos valora SUES_MOTIONS_MONTSERRAT_CAPAS (SHA93932620c6666b9498a1ed98f75ad029aed9028b51087d2246a4ee4738ac7a87):
«Ahora sí que ya empiezo a ver esto ya en otra historia. Esto está muy bien».
Acepta la dirección visual de los tres motions; no equivale a aprobar el montaje
completo, la oclusión corporal, el audio o cerrar F6/V1. Autoriza continuar.
Adaptación con voz: scripts/templates/prepare_voice_motion_scene.mjs. Rangos de
subtítulos elegibles desde app, entradas de copia literal ligadas a cues existentes;
se preservan tiempos inciertos, sin inferencia nueva. Sólo se suprimen captions
inferiores de un rango cuando el gráfico reproduce todos sus tokens en orden.
Iconos originales de mirada/corazón para adaptar el lenguaje visual al contenido.
