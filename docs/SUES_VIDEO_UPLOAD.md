# Vídeo desde la app · 18/10/2026

## Comportamiento vigente

El estudio puede arrancar sin vídeo ni análisis privados precargados. La pantalla
permite subir MP4/MOV/WebM con audio, hasta 250 MiB y 10 minutos. La subida usa
streaming a disco privado y muestra bytes enviados, seguidos de comprobación.
Sólo una subida simultánea; máximo cuatro originales distintos en esta V1.
Un reintento del mismo contenido no duplica almacenamiento, incluso al alcanzar
ese límite. Tras una interrupción no se considera subido el archivo parcial.

La subida requiere sesión, Host/Origin válidos y X-Sues-Request. No admite URLs,
rutas o comandos. FFprobe valida vídeo, audio, medidas, duración y orientación;
SHA256 liga el archivo a su análisis. El archivo original externo no se modifica.
Una copia ya almacenada con bytes alterados se rechaza, sin sobrescribirla.

La app muestra tres estados de material:

| Estado | Significado |
| --- | --- |
| READY | Original y análisis disponibles; preparar CALMA |
| WAITING_ASSETS | Se reconoce el original; falta recuperar su análisis |
| NEEDS_ANALYSIS | Archivo guardado; no se dispone de su análisis |

Subir el vídeo real de prueba reconoce el SHA previamente documentado. Si existe
su análisis, prepara CALMA directamente. Un vídeo diferente nunca hereda sus
palabras, encuadre, rostros o tiempos. La transcripción/visión automática de nuevos
originales sigue pendiente de integrar y autorizar; no se ejecuta ningún proveedor
de pago ni se afirma que subir cualquier vídeo produzca ya un montaje automático.

## Recuperación privada desde la pantalla

En un vídeo pendiente, «Recuperar análisis guardado» admite un JSON de hasta 2 MiB:
`sourceSha256`, `transcript`, `camera` y `vision`. Es una importación de datos ya
calculados, no una ejecución ASR/visión. Requiere SHA del original, duración y
coordenadas concordantes; prepara y valida el plan completo antes de habilitarlo.
No toma rutas del JSON ni copia archivos arbitrarios. El perfil se guarda de forma
atómica; análisis inválido conserva el estado anterior. No sustituye análisis
listos ni perfiles utilizados por trabajos existentes. Reiniciar restaura perfiles.
La música de otro original no se hereda al importar un análisis diferente.

`SUES_CALMA_ANALISIS_RECUPERACION.json` se guarda privadamente en Drive y junto a la
entrega del bloque; **no en GitHub**. Contiene los datos ya existentes del vídeo real.
Se selecciona desde la propia app después de subir ese mismo original. Las fuentes
Open Sans Regular/Bold están ahora incluidas en assets/fonts con su licencia SIL
OFL; no requieren transferir un ZIP privado o buscar packs para arrancar.

## API y persistencia

- GET /api/uploads: catálogo de material sin rutas locales.
- POST /api/uploads: cuerpo binario con Content-Length, tipo vídeo o octet-stream.
- POST /api/uploads/SHA256/analysis: JSON privado de recuperación.
- /api/profiles incluye ready para impedir crear montajes sin material completo.
- /api/design puede leerse aunque falte el vídeo o su transcripción.

Los originales quedan en jobs/uploads, con nombre técnico SHA256.video y modo0600.
Directorios0700; metadatos/perfiles atómicos0600. Reserva mínima de disco512MiB.
Límite de recepción15min, inactividad120s y probe15s. No subida por chunks reanudable,
cuentas múltiples, cifrado en reposo ni backup frente a pérdida del VPS. Una subida
interrumpida se repite desde el inicio. El límite de cuatro originales es un guard
del prototipo; su gestión/retención ampliada queda pendiente.

## Prueba real ejecutada en Work, no en VPS

Comando reproducible (directorio nuevo):

```
node scripts/app/smoke_upload_real.mjs PROJECT.json ORIGINAL.mp4 NEW_DIRECTORY --restore-analysis
```

Dos ciclos reales completados por HTTP: original97MB→subida autenticada→CALMA→ajuste
zoom75%→render idempotente→archivo privado→Range206. El segundo parte de rutas
inexistentes para original/transcript/cámara/fuentes e importa el análisis por API,
usando las fuentes versionadas. Cada ciclo hace un único render, conserva75/75
palabras y16captions,2zoom,1cita. Salida38,30s/H2641080×1920/30/AAC,18.602.463bytes.
SHA a5e14849b73272fbf7f194c7d2851559d3b741b4ad3f5a5a0dc9586d61efed6a idéntico en ambos.
Decodificación íntegra y original intacto. Inspección visual de ocho fotogramas:
3/7/12,5/16/18/25,5/33/36,5s, sin texto sobre el rostro en esas muestras.
No escucha completa ni aceptación estética humana; no QA de navegador/PWA real.
Evidencia pública compacta: examples/preview/upload-cold.real-result.json.

## Despliegue

prepare-service.sh deja de bloquear el arranque por medios ausentes: conserva
runtime/dependencias y arranca el shell para recibir la subida. Sólo ejecuta doctor
completo si el material privado ya estaba presente. La cámara de prueba se sigue
generando desde datos existentes, sin inferencia. No modifica WA/Caddy/DNS.

Estado VPS observado antes de este bloque: PENDIENTE MEDIOS, no iniciado. La nueva
release todavía **no se ha ejecutado en VPS**. No hay dispositivo remoto conectado
ni herramienta VPS callable; HTTPS sigue pendiente. El siguiente operador debe
lanzar release fija, comprobar estado, configurar acceso HTTPS protegido tras leer
el proxy real y probar subida/recuperación/exportación allí. No abrir el puerto
loopback3010 directamente a Internet ni imprimir el token privado en logs.
