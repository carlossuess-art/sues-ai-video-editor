> CORRECCIÓN POSTERIOR: Carlos rechaza esta demostración sintética por nivel
> visual insuficiente. F6=80% y global75,75% quedan retirados como estado vigente.
> Este documento registra componentes técnicos, no aceptación estética.
> La propuesta real posterior se documenta en SUES_F6_VISUAL_REVIEW.md.

# Fase 6 · Biblioteca de motions · 18/10/2026

Estimación interna F6: 80 %. Global técnico ponderado: 75,75 %.
Se mantiene abierta la fase ampliada; no es aceptación estética ni V1.

## Disponible desde la app

En cada subtítulo, abrir «Recurso animado»: marca de verificación, cruz,
tachado de esa frase, número de paso (1–99) o separador. Máximo cinco elecciones
por montaje, además de las citas destacadas existentes. Los recursos se guardan,
pueden deshacerse y se incluyen en la copia recuperable. Cambiar agrupación o
estilo desde la app limpia las elecciones ligadas a los IDs anteriores; la API
rechaza un cambio de agrupación que traiga elecciones antiguas.

El interruptor de recursos conserva los ajustes y desactiva su render. Los
recursos explícitos sustituyen las citas automáticas, para evitar superposiciones
sorpresa. Las tarjetas de pantalla completa siguen siendo una opción diferente;
se rechazan los cruces temporales incompatibles. No se elige «correcto» o
«incorrecto» mediante inferencia: estas marcas son decisiones del editor.

## Catálogo y procedencia

| ID | Representación disponible | Semántica del catálogo |
| --- | --- | --- |
| QUOTE_CARD_01 | Cita literal, panel y fondo desenfocado | reflexión, énfasis, revelación |
| NUMBER_BADGE_GOLD_01 | Número dorado y rótulo blanco | pasos, lista numerada |
| DIVIDER_LINE_01 | Línea dorada con crecimiento | comparación, antes/después |
| CHECK_GREEN_01 | Marca vectorial verde con fundido | positivo, aprobado, correcto |
| CROSS_RED_01 | Cruz vectorial coral con fundido | negativo, rechazado, incorrecto |
| STRIKE_TEXT_01 | Texto blanco y línea coral progresiva | corrección, mito, error |

Los dos símbolos y el tachado están dibujados en código propio; no dependen de
emojis, fuentes de símbolos, Pinterest, una compra o archivos de terceros.
La cita, el número y el separador reutilizan el motor existente. Inter continúa
siendo aproximación tipográfica. Estos recursos heredan CALMA y sus variantes
creadas desde la base común; no son copias exactas de todos los efectos Keanu.

BLURRED_RESOURCE_01 y COMPARE_YES_NO_01 mantienen sólo su contrato genérico:
la tarjeta comparativa de la app y las imágenes con feather son implementaciones
distintas, no se contabilizan como esos dos renderers. Las capas de audio del
catálogo no tienen todavía un archivo SFX validado: el plan y revisión lo dicen
explícitamente y no sintetizan ni mezclan sonidos ocultos.

## Colocación y seguridad de composición

Región estable entre cuatro alturas durante todo el intervalo, con proyección
a 30 fps del rostro detectado, crop y zoom. Margen facial de 48 px, zonas seguras,
protección de subtítulos/cierre y cajas de otros motions. Rechazo claro cuando
no cabe. Un motion no se permite oculto bajo B-roll. Las citas de enfoque
mantienen su tratamiento declarado de cubrir intencionalmente al presentador.

Los símbolos se dibujan dentro de su caja; texto tachado y rótulo numerado
comprueban tamaño legible antes de preparar un trabajo. No hay cortes nuevos,
aceleraciones ni modificación de los tiempos de locución. El número de paso
se fija explícitamente. La posición sólo usa detecciones existentes: no afirma
seguimiento continuo de un cuerpo ni segmentación entre muestras faciales.

## Validación

177/177 tests secuenciales; `npm run check` y `git diff --check` correctos.
Incluye ajustes HTTP autenticados, persistencia/deshacer, rechazo de IDs obsoletos,
texto editado con procedencia, rostro alto, ausencia de hueco y conservación del
montaje de audio. Ninguna aprobación estética automática.

Prueba sintética reproducible, sin nuevos modelos ni proveedores:

```sh
mkdir -p runtime
node scripts/app/smoke_motion_library.mjs runtime/NUEVA_PRUEBA
```

Genera vídeo con rectángulo facial y tono continuo, prepara desde la app seis
motions, ajusta/deshace/reaplica, copia/restaura y compara ASS/filtro, renderiza con
el worker real, guarda de forma privada y comprueba Range 206. No es una prueba
con un presentador real ni análisis de voz: usa palabras y detecciones sintéticas.

Resultado: 24 s, 1080×1920/30, H264/AAC, 18/18 palabras temporizadas,
6 motions, 0 zooms, 1 render, 414.907 bytes; original intacto y fullDecode PASS.
SHA256 6fc9b436057c4b013bef3d35323cfa7f8a441fe259bacd723aee235be5c3e238.
Revisados seis fotogramas: 2,8 / 5,8 / 8,8 / 11,8 / 14,8 / 17,8 s. Se observan
los seis recursos sin invasión del rectángulo facial ni recortes en esas muestras.
No escucha humana ni QA de navegador/PWA. El tono no equivale a voz hablada.

Evidencia pública sin rutas privadas:
`examples/preview/motion-library.synthetic-result.json`.
Vídeo `SUES_MOTION_LIBRARY_F6_PRUEBA.mp4`,
Library `libfile_06534ceb52888191b4b65c46e5315ebf`.

## Pendiente para cerrar el alcance ampliado de F6

- Máscara real del sujeto/sillón y oclusión de recursos detrás del cuerpo.
- Medios aprobados y SFX verificados, con mezcla/eventos y escucha.
- Completar el renderer genérico de recursos y comparación cuando se integre
  su contrato completo; no dar por resueltas sus capas de audio.
- Validar composición con vídeos humanos distintos y aceptación audiovisual.

La selección semántica avanzada y densidad automática pertenecen a F7. VPS,
HTTPS y QA móvil conservan sus pendientes; este bloque no se ha desplegado.
No se ha buscado ni descargado Creator Club, aplazado por Carlos. Coste externo
nuevo: 0 USD. Sin cambios a WhatsApp, Caddy, DNS, ASR o modelos de visión.
