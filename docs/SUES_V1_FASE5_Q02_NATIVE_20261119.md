# Fase 5 · Q02 en curso · Plan 158404 por Master Director y MCP

19/11/2026. Q01 finalizado, Q02 en curso. Q03–Q06 pendientes. La V1 sigue abierta.

## Ejecución acreditada

En /opt/sues-video-setup/q02-native-annex-20261119.j3YNOa se recuperó el anexo exacto y los 14 recursos por SHA. El script prepare-158404-annex-native-qa.mjs preservó los 87 IDs fuente, sus intervalos y dependencias en un crosswalk. Generó 107 operaciones por escena dentro de su contexto temporal. La historia pesa 78.796 bytes. Primero se simuló con project-ops real y después el almacén maestro la revisó con READY_FOR_CHOICE.

Copia /srv/sues-fablecut-next/data/automation-v1/test-project-q02-158404-501f25. Ejecución por el servicio existente, ledger de un uso y fablecut_patch_project con CAS. Revisión 1→2 y 107 recibos confirmados por readback. execution.json conserva revisión de historia 2fee378dac2a2228a671c56cda13daba86eaae4a9b0e475da64c9addc3071872 y fingerprint aaf8cdc684fb0220d77b4cdeb089a1d8fe3cfabc8091da8722ccad000ccaad5a.

El scope es technical-qa. Tanto el registro temporal de recursos como la decisión de prueba pertenecen a ese scope. No son una aprobación de Carlos de la expansión técnica, derechos para una salida pública ni aceptación artística del vídeo. El proyecto original permanece separado.

## Cambios necesarios

- Manifiesto de parches exactos del host, vinculado a los SHA de historia, base, petición y resultado. Conserva un lote atómico cuando las escenas expanden las operaciones por encima de 100. El host fija un máximo entre 1 y 1500 y el caso usa 150. Las solicitudes tradicionales siguen limitadas a 100.
- El almacén, el servidor y la entrada web admiten 128.000 bytes para conservar el plan íntegro. La ruta HTTP mantiene 160.000 bytes para el sobre y rechaza campos de contexto/registro falsificados.
- El supervisor admite hasta 1500 operaciones, conserva la partición de muestras y las dos revisiones reales. No genera informes PASS por sí mismo.
- El runner reutiliza nativePatch del host en revisión y ejecución, detecta Chrome y registra el trabajo fallido completo. El ejecutable del exportador en root necesita --no-sandbox, como el Puppeteer privado ya utilizado. El wrapper se crea en la copia temporal. No afecta al navegador del usuario.

Regresión dirigida en VPS 67/67 PASS, 0 FAIL, 0 SKIP, incluyendo peticiones HTTP de más de 60 KB y rechazo del límite UTF-8 de 128 KB, transacción de 101 operaciones y supervisor de 107. Los primeros intentos de tests carecían del helper de fixtures y después revelaron el límite HTTP de 65.536 bytes, corregido en la ruta real.

## Render y límites aún abiertos

El primer render no encontró Chrome. El segundo lo encontró pero el proceso root salió al arrancar. El diagnóstico reprodujo el error y se añadió el wrapper privado. La exportación arrancó con 2212 frames previstos pero avanzó aproximadamente un 2,5 % en 209 s. Se canceló únicamente ese trabajo privado por la tasa observada y el límite de ejecución, conservando la edición aplicada.

Se está reutilizando la caché faststart previa del mismo original, con prueba de paquetes/bitstream. Caché SHA f5957de68954c212e3e88efb35ae008c2aee76ccb0f6f2234c09c45f9e96e91a, original SHA 9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad. Primer app privado faststart-app con estáticos compartidos; después faststart-app-v2 se creó íntegramente mediante stage-fablecut-faststart-private-clone.py, que materializa paths.js dentro del clon y fija los 2212 frames / siete tramos V1. El gateway exige continuidad start/in, velocidad 1 y geometría exacta, además de los hashes. No se ha debilitado el requisito histórico de clip bloqueado para los hosts que no proporcionan esa política explícita. La protección valida identidad del original, caché y mapa continuo de los siete tramos V1. Un intento agotó la recogida del trabajo. Se pasó al handler nativo en una sola pestaña inspeccionada, conservando el claim del servidor y un canal SSE real del coordinador. El intento x_dgyfc54q llegó al 27 % antes de terminar con UND_ERR_BODY_TIMEOUT en el cuerpo fetch del SSE. El runner ahora drena un stream node:http con manejo de errores y permite 60 minutos de render, además del límite externo de la unidad. No fue un cierre audiovisual satisfactorio. Aún no hay MP4 completo verificado.

La preparación sigue etiquetada como prueba técnica. La revisión candidate-v4 traduce el duck mediante el detector RMS y duckKeyframes nativos de FableCut (umbral −40 dB) y los ataques de 4 f y releases de 12 f del anexo. Los fundidos son sobres lineales explícitos; se recortan interpolando los bordes de escena, sin reiniciar el valor. Se comprobaron todos los fotogramas de una curva cortada dentro del fundido y los cortes en ataque/hold/release. La escucha del resultado sigue pendiente. La geometría M01 puede interferir con la cabeza y el título y debe corregirse sobre fotogramas del vídeo. La ASR de 8–9, 16–17 y 28–32 s continúa sin escucha acreditada. El script conserva la transcripción existente, sin corregirla por suposición. Nada de esto se da por resuelto por tener recibos.

Para cerrar Q02 se requiere exportación completa y fidelidad del montaje aceptado. Q03 requiere dos pasadas audiovisuales con evidencia y corrección de fallos. Q04 sigue requiriendo valoración de Carlos del resultado exacto. Q05 conserva preparación/rollback y decisión de despliegue. Q06 permanece aparcado hasta validar V1. No se ha modificado producción ni se ha publicado.


## Revisión técnica candidate-v4

Se conservaron los 87 registros originales íntegros en source-annex/crosswalk. La historia ampliada incorpora 108 operaciones y pesa 86.779 bytes. La máscara adicional MT01 es una corrección técnica candidata, no una nueva aprobación creativa. Todas las dependencias fuente están también en la historia expandida. No se ha reejecutado el proyecto de 107 recibos.

Nueva copia: `/srv/sues-fablecut-next/data/automation-v1/test-project-q02-158404-v4-fc92b1`. El almacén devolvió READY_FOR_CHOICE sin incidencias. Revisión de historia `98b95f3f3e1748904d4326efdaf7bac9b7493adf66b3ac33865dbc84cd092719`, fingerprint `40d7807bbf2386c849b714edf15a5cd0be4f9f398be26fc17076d4b1d24de2ad`. Ejecución scope technical-qa por servicio/ledger/MCP: revisión 1→2, 108 recibos confirmados.

La fuente editable existente de M01 está en `/opt/sues-video-setup/hyperframes-engine-next/sues-balanza-decisiones-amor-miedo-v16/index.html`. Su reloj de narración comienza en 35,20 s y el clip del anexo en 35,80 s. La candidata aplica sourceIn 18 f para alinear AMOR/MIEDO con W102/W106. No cambia las animaciones Three.js/GSAP. La disposición y legibilidad continúan pendientes de revisión.

MODNet local ya instalado, modelo SHA `07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9`, produjo 120+93 fotogramas vinculados al original y a los tramos 35,8–39,8 / 39,8–42,9 s. Se codificaron exactamente 213 frames, 1080×1920/30fps sin audio. Máscara candidata `/srv/sues-fablecut-next/data/qa/q02-m01-portrait-20261119/matte-complete.mp4`. M01 usa luma-inverted con V6 y el mismo zoom/ancla de CAM04 para quedar detrás de Carlos. No se dan por aprobados pelo, manos, bordes ni ocultaciones del gráfico. No se han instalado dependencias ni usado servicios de pago.

La exportación v4 se lanzó en `sues-q02-render-v4-20261119.service`, CPU 95 %, memoria máxima 2200M, RuntimeMaxSec 3900 y LimitFSIZE 128M. Consultar `render-v4.exit`, `render-v4.log` y los `render-work-*/export-ticket.json` y `export-status.json` de esa copia. Confirmar su estado antes de cualquier render nuevo. Un proceso en curso no acredita archivo final.

Pruebas adicionales locales: gateway de caché 4/4, incluidas discontinuidad, retiming, recurso sustituido y spans editables; staging 4/4, incluida configuración host explícita; sobres 3/3 (también dentro de las 67 del VPS). No sumar suites solapadas como si fueran pruebas nuevas. El runner se verificó sintácticamente; la estabilidad de SSE largo se comprobará en la exportación v4 real.

## Criterio de continuidad

Q02 sigue activo. No cerrar por recibos, máscara generada o porcentaje de render. Comprobar archivo completo, decodificación, 2212 frames, audio, paridad de la copia y fidelidad del plan. Q03 no dispone todavía de dos revisiones A/V. Este entorno no ha acreditado escucha del audio: no firmar audio-playback ni fullPlaybackReviewed. No fabricar esos resultados. La aceptación Q04 es de Carlos sobre la salida exacta; el permiso de despliegue continúa separado de la autorización de desarrollar y probar.
