# Primer render cloud · POC 001 · 16/10/2026

Resultado: GO técnico para Shotstack como primer motor del POC.

| Medida | Resultado |
| --- | --- |
| Entrada | PXL_20261016_141233241.mp4, 38,310156 s, 96.942.857 bytes |
| Codec fuente | HEVC 1920×1080 con rotación 90°, AAC 48 kHz estéreo |
| Salida | H.264 MP4 1080×1920, 30fps, AAC 48 kHz estéreo |
| Duración / tamaño | 37,300 s / 24.873.991 bytes |
| Edición | [0,12) + [13,38.31), título 3 s y cierre 3 s, voz original |
| Envío | 2026-10-16T14:20:08.125Z |
| Descarga terminada | 2026-10-16T14:21:11.085Z |
| Latencia total desde envío | 62,96 s |
| RenderTime proveedor | 11.634 ms |
| Render ID | a4708c00-45f2-4260-aef7-ebdc7d7b3c2d |
| Source ID eliminado | zzz01m52-haf02-7avyc-1w53k-0523av |
| Coste | 0 USD Sandbox; marca de agua esperada |
| Saldo antes/después | 10 / 10; dashboard muestra 0 gastados |

Original: https://drive.google.com/file/d/1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82/view

Resultado: https://drive.google.com/file/d/1uQl_nLIwO7NqzayotOQhewnOT7hXRh5S/view

## Comprobaciones y límites

Decodificación FFmpeg completa sin errores; resolución, fps, duración y codecs
comprobados con ffprobe. Tres fotogramas inspeccionados: texto legible, orientación
vertical correcta y cierre presente. Audio mean -31,6 dB/max -9,6 dB frente a original
-31,3/-9,4 dB. Pista no silenciosa; no equivale a escucha humana del contenido.
El corte es mecánico y puede interrumpir una frase. No hay ASR, subtítulos, música,
reencuadre inteligente ni acabado V1. Falta valoración estética/reproducción en móvil;
no bloquea el criterio técnico cloud definido en el roadmap.

## Incidencias corregidas

Primera solicitud de upload agotó 30 s: se consultó sources antes de continuar.
API ahora espera hasta 120 s. Primer PUT devolvió HTTP 501 por transferencia chunked;
se añadió Content-Length obtenido del archivo, cubierto por test offline. Fuente vacía
zzz01m52-h8jp1-sa35t-19hz1-7kcj1e eliminada antes de nueva subida.
Un único POST de render exitoso. Lock residual retirado sólo tras comprobar que no
había proceso activo. Job final CLEANED después de archivar original y resultado.
No se modificó el original ni se subieron vídeos/secretos al repo.

## Continuidad

Fase 1 y 2 completas; global 15 % según pesos del roadmap. Siguiente fase:
transcripción, segmentación y captions editables. Mantener adaptador Shotstack
reemplazable y no activar servicios con coste automáticamente.

Auditoría privada Drive (job, plan, timeline, verificación):
https://drive.google.com/file/d/1SB6EX0zl02B0LuahAYdcg-D6OV3l07YF/view
