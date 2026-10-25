# MODNet y composición detrás del sujeto · 25/10/2026

Rama: feat/modnet-foreground-effects-20261025.
Base:40c840b8c6dede0f09e1594e087c8bc9e53ccf6c. No desplegado.
Continúa la prueba de cámara de 10 s; no crea otro editor ni reinstala REA.

## Autorización y gasto
Carlos autoriza nuevas aplicaciones/modelos con un máximo TOTAL de20€ para pruebas
y un incremento máximo del10% en el coste final por Reel. Se registra en AGENTS.md
por delante de las restricciones históricas. No son20€ por herramienta.
Gasto externo realizado:0€. Suscripciones/APIs nuevas:ninguna.
Se reutilizan VPS, FFmpeg y ONNX Runtime1.31.0/Numpy del entorno existente.
No se modifica ese entorno ni se instala PyTorch.
El uso local no añade facturación variable en esta prueba, pero sí consume CPU.
No hay un coste base por Reel medido para extrapolar un porcentaje de explotación
a otro servidor o a gran escala. No afirmar un aumento computacional inferior al10%.
Una opción futura de pago necesita contrastar ambos límites antes de adoptarse.

## Modelo real y alcance
MODNet photographic portrait matting, preentrenado de terceros; sin fine-tuning.
El enlace ONNX procede de los autores:
https://github.com/ZHKKKe/MODNet/blob/master/onnx/README.md .
Código/modelos/demos Apache2.0 según su README; no se usa el modelo no publicado
de su demo web ni se copian algoritmos propietarios de editores.
Archivo25.888.640bytes; SHA256
07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9.
CPUExecutionProvider, un hilo. No es un director creativo ni detector facial.
Predice alpha de persona por imagen; no tiene memoria temporal ni garantiza
segmentación correcta de cualquier fondo, pose, cabello u objeto.

Prueba real:84 inferencias a30fps sobre salida6–8,8s del mismo tramo autorizado
original1,6–11,6s. Entrada512×896 RGB en el espacio exacto de cámara compilado,
sin captions/efectos. Nada de aplicar una máscara estática a un zoom cambiante.
127s de pared,63,46s de CPU, pico RSS465.980KiB(≈455MiB), bajo CPUQuota50%/MemoryMax1GiB.
El renderer se ejecuta aparte bajo0,5CPU/1GiB y sin red.
Se limita el script reutilizable a90 inferencias/estudio y300s; no se activa
segmentación de todos los frames de un Reel60s por defecto.
Caché reutilizable: cambiar fuente,cámara,curva,anclas o montaje la invalida.
El modelo no fue reejecutado al corregir únicamente la tipografía.

## Implementación reutilizable
src/foreground-effects.js valida fuente, hash del espacio cámara/montaje, modelo,
matte y cobertura; admite blur de fondo y texto literal detrás del sujeto.
Usa compositor RGB+alpha antes de captions y conserva la pista de voz/mezcla.
El alpha FFV1 gray512×896 tiene300frames; cero fuera del intervalo de inferencia.
Se escala al mismo encuadre1080×1920; no se extrapola a otra cámara o timeline.
No se relajan los guards de los contornos manuales antiguos.

local-pipeline.js acepta foregroundEffectsPath privado opcional y lo compila
después de validar el plan; local-preview.js reutiliza sus filtros. El renderer
Python vuelve a validar el contrato mediante Node y comprueba hash, FFV1, geometría,
30fps, duración,300frames y conservación del matte tras renderizar.
ENGINE_HASH incluye el módulo nuevo. La fuente/modo por defecto no cambian.
Scripts de reproducción: scripts/vision/infer_modnet.py,
scripts/qa/verify_foreground.mjs y scripts/qa/attach_foreground_study.mjs.
La tipografía reutiliza las métricas Montserrat existentes.

El generador offline espera un JSON sues-camera-frames/v1 con sourceSha256,
cameraSpaceSha256, rgbSha256,width512,height896,fps30,frames≤1800,
activeStartFrame y activeFrames≤90. Valida modelo/input antes de inferir.
Se ejecuta en el entorno CPU existente con --model,--input,--manifest,--out;
no descarga ni instala paquetes. Su salida gray se codifica con FFmpeg aFFV1.
La preparación del estudio utilizó un script equivalente acotado de84frames y
el filtro de cámara exacto del bundle anterior; el CLI genérico queda para repetir.
Mantener pesos, fuentes, material y cachés privados fuera de Git.

## Comparación real y corrección
C: vídeo anterior con cámara/captions/audio, sin máscara automática.
D: blur de fondo6–8,8 y MUNDO INTERIOR desde6,4; revisión mostró oclusión demasiado
poco perceptible porque el texto quedaba alto. No se aceptó ese primer diseño.
E: mismo matte, texto reposicionado/ampliado con métricas; INTERIOR cruza detrás
de cabeza y se oculta por alpha. No se vuelve a inferir ni se cambia el audio.
Captions, flash, zooms y mezcla de la prueba anterior se conservan.
La transición global de desenfoque deC se retira; ahora el blur es de fondo,
mientras los captions permanecen nítidos.
La corrección la realizó Work, no un crítico autónomo.

| Evento | Resultado real E | Límite |
|---|---|---|
| Cámara0–6s | Curva existente y ojos históricos conservados | No detector nuevo |
| MIRAR/RECONOCER | Tamaño1,6 y naranja metal existentes | Metal de bandas |
| Fondo6–8,8s | Desenfoque con protagonista nítido | Muestreo visual y cuantitativo; no calidad universal |
| Texto6,4–8,8s | MUNDO INTERIOR detrás de la cabeza | Rótulo conceptual explícito, no ASR adicional |
| Voz/música/SFX | Audio PCM idéntico aC | Escucha/aceptación humana pendientes |
| B-roll contextual | Sin incorporar en esta secuencia | No añadir clips irrelevantes |
| Director/supervisor autónomos | No completados | Dirección y revisión Work |

## Evidencia del archivo final
SUES_DOPAMIN_CAPAS_10S_20261025.mp4:4.878.820bytes,10,000s,
H2641080×1920/30fps/300frames,AAC48kHz estéreo.
SHA256:03cd67f10bb75ad8e288bce1d756974accff165107d2b64119ef75b19d201790.
Full decode PASS;−14,4LUFS/−1,7dBTP,LRA2,8LU; sin negros(d≥0,1s/pix_th0,1)
ni congelaciones(n−50dB/d≥0,5s) detectados.
Audio PCM SHA256:5cb6eded909b920cec401d8b8567b822cad74f5c0e45612a5805b13a9b5284ea,
idéntico al estudio C. Original preservado según renderer.

Matte FFV1 SHA256:412585d405d37a99d34c56cc51b9f6369bad83333e6d8f7e1832efd277464855.
CameraSpaceSHA256:6d484e144fd281b3c90e6ddceaa927d75b9cef1a3d1a6f6326c1d5c0ebae699a.
84frames activos no vacíos; fuera de6–8,8s todos los pixels alpha son cero.

Comparación de fotogramas decodificados C/E a512×896, excluyendo captions(y<620):
foreground alpha≥254; fondo alpha≤1. Error absoluto RGB medio:
| Segundo | Primer plano | Fondo |
|---|---:|---:|
|6,7|1,70|11,58|
|7,4|1,71|11,68|
|8,3|1,87|11,72|
Acredita preservación muestreada del sujeto y modificación del fondo, no excelencia
estética ni ausencia de todo artefacto. Revisión visual de antes/después, cinco
muestras temporales deD y detalleE6,7s. No afirmar reproducción nueva en Android.
El modelo conserva incorrectamente parte de una cinta roja del coche: limitación
observada, no matte perfecto ni segmentación general aceptada por Carlos.

Pruebas:4 nuevas de contrato/caché/cobertura/conflictos y8 focales con cámara PASS.
Suite completa352/353DockerPASS; único fallo Git safe.directory del arnés,
archivo completo2/2 en hostPASS. Tipografía corregida después:8focales y renderE
PASS. Python py_compile y check de sintaxis ejecutados; resultado final registrado.
No usar estos tests como aceptación creativa.

## Pendientes reales
- Integración de generación/caché/proxies/copia portable en el flujo de subida y UI.
foregroundEffectsPath es configuración experimental, no un botón operativo publicado.
No añadir esta operación al catálogo externo como disponible antes de completar
ese ciclo y sus pruebas; el renderer ya la ejecuta desde configuración validada.
- Revisar más poses y fondos, bordes y estabilidad temporal; no ampliar esta muestra
a cualquier vídeo. Evitar que falsos positivos de objetos entren en el matte.
- Selección B-roll pertinente, planificación multimodal y crítica/corrección autónomas.
- Medir coste base final por Reel antes de habilitar gastos recurrentes.

No se cierra el hito10s completo, F6/F7/F9, ni V1; global oficial48% sin alterar.
La máscara y el blur selectivo ya tienen evidencia experimental real que antes
faltaba, pero el flujo subir→DOPAMIN→Editar con IA todavía no está terminado.
