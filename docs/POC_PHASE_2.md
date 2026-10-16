# Fase 2 · especificación y ejecución

Objetivo de esta entrega: código y procedimiento listos para insertar un vídeo y
credencial sandbox; la Fase 2 sólo se completa con MP4 real inspeccionado.

## Prueba mínima exacta

- Entrada: un archivo propio MP4/MOV/WEBM, 30–60 s, ≤250 MiB; voz audible y vertical
  preferiblemente. No se modifica el original.
- Subir mediante Ingest stage con URL PUT firmada; usar el metadata real al quedar ready.
- Montaje: segundos [0,12) + [13,duración). El segundo omitido demuestra el corte.
  No usar este marcador como edición final de contenido ni llamarlo Director IA.
- Título “SUES HOLISTICS” 0–3 s y outro textual de 3 s sobre el final del vídeo.
- Voz original a volumen 1; música opcional fuera de la primera ejecución automática.
- Formato MP4, 1080×1920, 30fps. Contain preserva encuadre sin seguimiento de cara.
- Plantilla provisional SUES_CALMA_POC con dos posiciones de texto y márgenes propios;
  no equivale a un Brand Kit o safe zones oficiales definitivas.
- Preview: result.mp4 + preview.html una vez termina. No hay editor web grande.

Captions: `texts` permite frases con tiempos de SALIDA, en pistas rich-text. El ejemplo
incluye una frase demostrativa que no es transcripción. El comando `run` no inventa
subtítulos. Shotstack admite rich-caption a partir de SRT/VTT; ASR y el estilo definitivo
quedan en Fase 3. No usar auto-transcripción en esta primera prueba sin validar sus
condiciones/coste. No requiere transcripción para demostrar este render mínimo.

## Coste y límites

| Escenario | Coste esperado | Condición |
| --- | --- | --- |
| Tests, compilación y dry-run | 0 USD | Offline, sin key |
| Render POC stage 30–60 s | 0 USD | Marca de agua, ≥1 crédito activo, sin generación IA |
| Equivalente PAYG producción | 0,10–0,20 USD | Sólo render, tarifa 0,20 USD/min; NO ejecutado |
| Compra mínima publicada | 10 USD / 50 créditos | NO autorizada ni realizada |

El resultado real dura 29–59 s por el corte de 1 s; la horquilla anterior es una cota
redondeada para 30–60 s. Producción usa 1 crédito/minuto en PAYG, créditos válidos 12
meses. El alta anuncia 10 créditos gratuitos válidos 30 días sin tarjeta. No convertir
USD a EUR con un cambio supuesto. Impuestos/extras no incluidos en la estimación.
Las cuotas y condiciones de una cuenta antigua pueden diferir: verificarlas al acceder.

## GO / NO-GO del primer render

GO cuando el MP4 se descarga, reproduce en móvil y confirma 1080×1920/30fps, voz audible,
corte, título y outro visibles sin truncamientos. Registrar renderId, sourceId, tamaño,
duración, hora de envío/final, renderTime y saldo antes/después. Revisar contenido del
corte y encuadre visual. Archivar y limpiar. Si falta algo, mantener Fase 2 abierta.

NO-GO provisional si stage no acepta el tipo de archivo, key/cuota falla o el render
no respeta el montaje. Corregir el adaptador bajo el mismo contrato; no comprar ni
cambiar de arquitectura sin evidencia. Si el saldo es 0/caducado, detener sólo ejecución
remota y comunicarlo; no recargar automáticamente.

## Publicación de código

Repo privado: https://github.com/carlossuess-art/sues-ai-video-editor (ID 1422196475).
main contiene la base preparada; poc/phase-2 es la rama de trabajo para validar el
primer vídeo real. Sin workflows de Actions ni servicios de pago habilitados.
El ZIP previo de Drive conserva el estado antes de publicar; continuar desde GitHub.
