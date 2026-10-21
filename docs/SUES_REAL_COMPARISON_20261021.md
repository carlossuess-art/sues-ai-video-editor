# Comparación real de plantillas · 21/10/2026

Mismo bruto recuperado de 38.31 s, no la referencia editada Keanu de 64.2 s.
Dos versiones nuevas, padre y fuente intactos. MP4 H.264 1080×1920/30, duración
codificada 38.30 s (desviación menor de un frame), audio presente, fullDecode pass
y descarga HTTP idéntica por hash/bytes. No se registra aceptación creativa humana.

| Plan compilado | CALMA | DINÁMICA |
|---|---:|---:|
| Zoom in / zoom out | 2 / 2 | 3 / 3 |
| Tarjetas | 1 | 2 |
| Transiciones | 0 | 2 |
| SFX sintetizados | 1 | 4 |
| Grupos de subtítulos | 31 | 32 |
| Motions adicionales / imágenes / cortes | 0 / 0 / 0 | 0 / 0 / 0 |
| Bytes exportados | 18076824 | 17560651 |
| LUFS integrados medidos | -28.07 | -28.07 |
| True peak dBTP | -9.19 | -9.28 |
| LUFS en plegado mono | -32.17 | -32.17 |

Los zooms son los ciclos actuales de acercamiento y retorno. Cada intervención es
una cuenta de plan, no un recuento humano de todos los cambios percibidos.
El SFX de tarjetas/destellos es síntesis existente; no usa los 14 alias pendientes.

El volumen queda por debajo de la banda V2 orientativa -16..-14 LUFS. No se marca
PASS de loudness: se conserva la mezcla/voz original sin normalización automática.
Un aumento de ganancia simple tampoco garantiza el límite -1 dBTP. La escucha,
la inteligibilidad real, la dinámica y el acabado creativo siguen por revisar.
La referencia Keanu mide -22.12 LUFS/-2.83 dBTP y tampoco define por sí sola la meta.

Enlaces privados del editor (requieren sesión):

- CALMA: https://editor.suesholistics.com/?project=9c42517b-8a80-4719-96ab-8a5d22a63121
- DINÁMICA: https://editor.suesholistics.com/?project=6bb280d8-315a-4da6-868f-9f7b5295b792

Evidencia privada del VPS: dynamic-v2-real-comparison.json,
dynamic-v2-real-media-qa.json y dynamic-v2-real-media-qa/*.png. Muestreo de doce
frames por versión revisable; no equivale a inspección de todos los fotogramas.
El transporte inicial docker cp no veía el tmpfs /tmp; se corrigió usando lectura
binaria por docker exec. Sólo la ejecución final completa cuenta como PASS técnico.
Sin nuevos renders por ese fallo del arnés y sin costes de API.

La prueba de navegador del candidato usa el backend real y app.js interceptado
localmente; comprueba el cambio CALMA→DINÁMICA en un DONE y su revisión obligatoria.
La prueba posterior sin intercepción deberá verificar la release instalada.
