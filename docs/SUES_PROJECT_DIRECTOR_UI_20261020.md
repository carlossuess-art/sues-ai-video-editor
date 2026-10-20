# Proyectos, instrucciones y revisión · 20/10/2026

Continúa el código instalado 9d8d077 y oficial 8c89b500. Carlos confirma que el
MP4 se descarga en su móvil; no se atribuye esa prueba al navegador Work.
Las imágenes compartidas son una propuesta visual, no un contrato píxel a píxel.

## Recorrido implementado

- Inicio con Nuevo proyecto, búsqueda y tarjetas con miniatura real del último
  MP4 terminado cuando está disponible. Miniatura privada, pequeña, cacheada;
  se aplaza si el editor está renderizando. Sin descargas externas ni modelos.
- Proyecto con nombre, vídeo, plantilla de partida y campo de instrucciones
  opcional. Las versiones nuevas heredan proyecto y encargo; los trabajos
  anteriores sin metadatos se agrupan por perfil/material, sin reescribirlos.
- Director visible como herramienta principal. Ver propuesta es opcional;
  Editar con IA genera una versión, Aplicar cambios conserva la anterior.
  Play reproduce y Exportar descarga el mismo MP4 sin otro render.
- Herramienta contextual única, vídeo visible y panel desplazable en móvil;
  escritorio en dos columnas. Fondo azul oscuro, acento cian, tipografía de
  interfaz del sistema, controles e iconos propios. No imágenes de terceros.
- Instrucciones y acciones aplicadas persistidas en job.json, visibles tras
  reiniciar/recargar. Cambios manuales e instrucciones comparten ajustes.
  Idempotencia por petición evita crear otro render al repetir un envío.
- Cambio de plantilla/agrupación que invalida textos/recursos requiere aceptar
  el restablecimiento; la versión anterior permanece. Petición desconocida o
  parcialmente compatible se rechaza entera antes de crear la versión.

## Capacidad real, sin costes nuevos

Se interpreta un vocabulario local explícito: CALMA/DOPAMIN y estilos existentes,
música 0–18 %, música suave, ducking, acercamientos 0–100 %, menos zoom,
grupos de subtítulos 1–3 palabras, recursos animados/SFX e imágenes de plantilla.
No es un chat LLM general. No se ha activado otro proveedor ni consumido API.
No puede aún elegir cortes por significado, garantizar otra duración, buscar
recursos nuevos, modificar cualquier palabra por conversación o ejecutar
instrucciones «en este momento». Se explican límites en el panel; no se afirma
que se haya cumplido un encargo que no se puede ejecutar. Música inexistente
se advierte: cambiar volumen no inventa una pista.

Análisis automático de material completamente nuevo sigue pendiente del motor
existente; las subidas y el material recuperado conservan su flujo y límites.
El TAR portátil conserva vídeo/análisis/ajustes como antes; el historial nuevo
vive en job.json y queda incluido en la copia completa del VPS, no en el TAR
portátil de una versión. No se presenta ese TAR como backup del dashboard entero.

## Validación

- npm test: 243 PASS, 0 fallos/omitidas. npm run check y diff --check PASS.
- HTTP: persistencia/ancestría, rechazo sin mutación, idempotencia, sesión y
  miniaturas privadas; FFmpeg real para JPEG. El test de poster usa estado DONE
  de fixture y NO acredita un render.
- Chromium145 real, escritorio1440×1000 y móvil393×852, fuente sintética8s:
  crear/nombre, prompt compatible y rechazo del desconocido, generación real,
  reproducción, descarga por botón idéntica al preview, fullDecode y fuente
  intacta, versiones agrupadas, búsqueda, historial y recarga. Tres renders en
  total; composición de ajuste manual+prompt adicional probada en escritorio.
- MP4 descargado común en ambos dispositivos:
  c96d17d9d4bc7ddbf2251a21cd62df81c0dfd74df9f713c17e236aba97701079.
- Ajuste final de disposición probado aparte en Chromium ambos tamaños con
  MP4 previamente generado y estado fixture: poster real, reproductor/campo
  visibles, siete herramientas sin overflow. NO es otro ensayo del renderer.
- Primer ensayo24s se interrumpió para usar fixture8s; no cuenta como PASS.
  Captura intermedia detectó solapamiento sticky móvil; corregido con dos zonas
  y panel propio, y vuelto a comprobar. Evidencias JSON en examples/preview.

No se ha eludido la protección de credenciales del navegador Work. Las pruebas
anteriores son locales, no un login visual nuevo al VPS ni aceptación estética
humana. F6/F9/V1 globales siguen abiertas. Motor/render y dependencias intactos.

## Publicación

Código instalado240632a7d969919ce402e072da8297fd1c5a7299, árbol
41636d976d65582525da121862abfe6ee973ebe2, idéntico al checkout probado.
Oficial integrada con expected_sha8c89b500, sin force. Despliegue systemd
sues-editor-update-20261020-160252-78817089:SUCCESS, exitCode0, Resultsuccess,
ExecMainStatus0. HTTPS200, API401 sin sesión/200 autenticada, propuesta de
instrucciones de sólo lectura y JPEG privado real PASS. Cola0/0/0.
No se ha enviado otro render de producción para probar la interfaz.

Backup /opt/sues-video-setup/update-backup-20261020-160254-22885/editor-state.tar,
SHA256 b78a283069e50a8a3bc6babbff2ff02f0ad641665b8e80f30eb19b220d1d7502,
recalculado después del despliegue. Manifiesto por archivo verificado por updater.
Contenedor anterior9d8d077 conservado como
sues-video-editor-before-update-20261020-160254-22885(exited) para rollback;
no se hizo reversión innecesaria.214 archivos persistentes previos idénticos por
SHA, incluidos medios, trabajos, ajustes y credenciales. Cinco trabajos presentes.
Se añadió únicamente la miniatura de la prueba HTTP. Sin tocar otros servicios.
Evidencia examples/preview/project-director.vps-result.json.

