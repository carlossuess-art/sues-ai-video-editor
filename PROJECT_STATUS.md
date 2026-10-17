# Estado técnico vigente · 17/10/2026

FASE 5/10 · BRAND KIT + TEMPLATE ENGINE
Progreso fase: 80 % (estimación técnica; estética provisional).
Progreso global: 48 % = F1–F4 (40 %) + 80 % del peso F5 (8 %).
Rama oficial: feat/phase-4-vision-camera.
Base de este bloque: acbb8d5471cce1972c886ba9331379f8477dd35d.
Último hito: selección de citas desde captions, deshacer hasta10ajustes y guardado
idempotente. Prueba con vídeo realCarlos38,30s/75palabras/1cita elegida víaAPI completada.
Suite: 133/133 y npm run check (src/scripts/web); Python compile OK.
Smoke API→plan→ajustes→worker FFmpeg→MP4→Range real OK. Audio sintético OK.
Sin aceptación E2E humana ni cierre estético.
Coste externo nuevo: 0 USD. Sin ASR/MediaPipe/Shotstack/generación/Lovable/compras.
Necesito de Carlos: ejecutar preparación de dependencias VPS y devolver estado/log;
aceptación estética pendiente. El trabajo de código puede continuar.

## Hostinger · procedimiento vigente de consola

- Capturas actuales recibidas17/10: srv1841004 Ubuntu24.04.4/x86_64,1CPU,
  RAM3,8GiB/~3,1disponible, swap0, disco40Glibres; Docker29.6.2/Compose5.3.1,
  Python3.12.3. Node/npm/FFmpeg/ffprobe/gh ausentes delhost. WhatsApp yCaddy activos,
  red sues-whatsapp_default, puertos3001/80/443 coinciden con el histórico.
- Preparado scripts/deploy/prepare-runtime.sh: imagen aisladaNode22+Python+FFmpeg+
  fontconfig, sin paquetes enhost/puertos/reinicios. nohup/log/PID/estado persistente,
  flock, mínimo5GiB, verificación temporal sinred y miniH264/AAC. Bash-n OK; noDocker
  enentorno local, build/smoke deimagen pendientes deCarlos. Todavía no desplegado.
- Carlos pide bloques completos para pegar en la consola web; descargas y tareas
  largas en segundo plano con nohup, log y consulta de estado. No depender del
  acceso directo del asistente. Esta instrucción sustituye el bloqueo de acceso.
- Recuperado contexto previo: Ubuntu24.04.4/x86_64, Docker+Caddy; WhatsApp en
  /opt/sues-whatsapp/compose.yml, Caddy80/443 y conector127.0.0.1:3001. Inventario
  del28/09: Git/curl/rsync presentes; Node/npm/Nginx/Certbot ausentes delhost.
- Detalle histórico y fechas enSUES_VPS_CONSOLE.md. No son comprobación actual.
  scripts/deploy/inspect-vps.sh permite actualizarlo sin instalaciones/reinicios,
  config/secretos ni cambios en WhatsApp. No se ejecutó en el VPS desde aquí.
- Capacidad/puertos recibidos; falta preparar dependencias y vía autenticada para
  fuente privada/assets antes del despliegue separado. Ninguna publicación hecha.
- Cambio de procedimiento documentado; F5=80%, global48%, sin cierre adicional.

## Revisión editorial · hito vigente

- highlightCaptions: hasta3IDs únicos del propio montaje, orden canónico, sin planes
  libres/paths/tipos arbitrarios. Se usa el texto actual del caption, incluidos edits,
  marcando origen usuario-editado vs transcript y conservando índices/tiempos fuente.
- Selección explícita reemplaza citas automáticas; zooms se mantienen. Interruptor
  motions las desactiva sin perder selección. Caption próximo a inicio/outro, texto
  que no cabe o geometría insegura rechaza ajuste entero; no se oculta una orden de
  usuario descartándola. La versión anterior siguePREVIEW_READY intacta.
- Botón Destacar por caption y límite3enUI. POST.../undo y control Deshacer restauran
  hasta10ajustes guardados como revisión nueva, sin tocar bundles previos ni lanzar
  análisis/render. POSTsettings con mismofingerprint no añade revisiones redundantes.
- 133/133tests+check; APIundo y rechazo de highlight inválido comprobados. No QA visual
  de navegador, no aceptación humana. Edición representada mediante petición de prueba.
- Vídeo realCarlos:38,30s/75palabras/16captions/2zoom1,07×/cita del primer caption
  «Te enseñaron a mirar,». Requestsimula selección, no elección o aceptación deCarlos.
  MP4H2641080×1920/30,AAC;18.568.845bytes; decode/hashfuente intactos,1intento yRange206.
  SHA450da24730969b3617c6a2ed3626f1d66fcb7fcc2ceab8c998999c24000ad349.
- Guardado privado validado. Frame3,2s revisado: cita por encima del rostro y caption
  inferior; sin escucha completa. Tras endurecer mensajes/orden settings se comparó
  manifest idéntico yASS/filtro byte idénticos con código vigente.
- Entrega prueba: https://drive.google.com/file/d/1puywRV66cfHXio6uitaADPGqGPfSSHA5/view?usp=drivesdk
  Chatlibfile_5b2f7cdf3c288191989af4aa96b6f0b3. No sustituye automáticamente la entrega
  automática anterior. Plan/auditoría enexamples/director/calma-caption-highlight-real.json
  yexamples/preview/caption-highlight-real.audit.json. GuíaSUES_EDITORIAL_REVIEW.md.
- Coste externo nuevo0USD, sinASR/visión/LLM/Lovable ni servicios nuevos. F5sigue80%,
  global48%; avancesF8. Bloqueo de despliegue: administraciónVPS no callable y destino
  cloud/HTTPS/autorización pendiente. Supabaseactivo es delOráculo: no se toca.

## Progreso y diagnóstico · hito anterior

- src/render-progress.js lee sólo64KiB finales del reporte generado por FFmpeg;
  rechaza symlinks/valores no finitos y tolera ausencia/lecturas parciales.
- API expone porcentaje/tiempo/frame/speed reales, nunca una animación simulada.
  progress=end significa comprobar, tope99%; PUBLISHING/PUBLISH_FAILED guardado99%;
  sóloDONE100%. Cola0%; error/cancelación no dan un porcentaje de éxito.
- UIprogressbar accesible, texto de comprobación y conteos de cola/proceso/guardado.
  GET/api/health protegido por sesión/origen, sin paths/tokens ni comandos pesados;
  muestra estado del coordinador, no garantiza dependencias o desplieguecloud.
- npm run editor:doctor -- CONFIG: Node/Python/FFmpeg/ffprobe, fuente/hash/rotación/
  audio, plan/captions, OpenSans400/700/licencia y filtros necesarios. Pasa con el
  proyecto realCarlos38,31s/16captions/0palabras omitidas; no render/ASR/visión nuevos.
- 129/129 tests+check/Python compile. Smoke real2MP4: reportes360frames, tiempo11,989333s,
  estadosqueued/rendering/verifying/complete observados;100% trasDONE. SHA de vídeo
  idéntico al fixture previo: el reporte no cambia bytes de codificación.
- Recuperación privada tras retirar temporales sintéticos y reiniciar vuelve a pasar;
  no se reexporta el vídeoCarlos. Evidencia render-progress.synthetic-result.json y
  editor-doctor.real-result.json enexamples/preview. GuíaSUES_RENDER_PROGRESS.md.
- Supabase leído sólo en metadatos: planfree, activo dedicado al Oráculo yBoards
  inactivo. No se identifica proyectoeditor; no se mezclan tablas/buckets ni se crea
  proyecto/se acepta coste. HostingerVPS/hosting sigue sin tools callables.
- Coste externo nuevo0USD. F5 estética80%,global48%; avancesF8 no cierranF9 niV1.

## Almacén privado y recuperación · hito anterior

- src/private-storage.js: objetos SHA256 por ámbito técnico owner/project, copias
  por bloques, creación exclusiva, deduplicación, modo700/600, límite256MiB por objeto.
  Rechaza escapes, symlinks, scopes ajenos y hash/tamaño/tipo/permisos alterados.
- Backend local usa owner local-session y project UUIDdel job. No autenticación
  multiusuario, cifrado en reposo ni almacenamiento cloud remoto. No URLs públicas.
- RENDERING→PUBLISHING→DONE sólo tras archivar/verificar MP4+auditoría. Descarga/auditoría
  resuelven referencias privadas. DONE legacy mantiene ruta previa sin migración ciega.
- PUBLISH_FAILED permite reintentar guardado con mismo intento, sin FFmpeg/ASR/visión.
  UI tiene estado de guardado y botón específico. Render inválido sigueFAILED.
- Reinicio adopta render completo si request, job, fingerprint/digest, rutas, fuente,
  MP4 y auditoría concuerdan; archiva sin nuevo worker. Incompleto quedaFAILED.
- 125/125 tests; smoke real2MP4 sintéticos130.823bytes, archivados, temporales retirados
  sólo en fixture, servidor reiniciado y descargaRange206/auditorías con hashes
  originales. Cero renders adicionales. Fuente sintética intacta; no nuevo vídeoCarlos.
- Evidencia examples/preview/storage-recovery.synthetic-result.json; guía
  docs/SUES_PRIVATE_STORAGE.md; script scripts/app/smoke_storage_recovery.mjs.
- Hostinger:9servidores registrados, pero no hay toolsVPS/hosting expuestas/callables.
  SóloAIBuilder. No se cambió configuración, VPS, DNS ni permisos. No se hacefallback
  por SSH/API manual para evitar la capacidad ausente. Despliegue no ejecutado.
- Coste externo nuevo0USD; F5 sigue80%,global48%, avancesF8 sin cerrar fases.
  Almacén disco de Work persiste ante reinicio de app, no ante pérdida del host.

## Cola y worker · bloque anterior

- src/editor-jobs.js añade QUEUED persistente, orden monotónico y posición pública.
  Un worker activo, hasta16 en espera; límite configurable por operador1..100.
- Repetir POST en QUEUED/RENDERING/DONE no añade tarea ni intento. Cola llena rechaza
  sin modificar el trabajo. En espera no se permiten ajustes: crear otra versión.
- Cancelar QUEUED no lanza proceso. Cancelar activo espera salida del grupo antes de
  dejar pasar al siguiente. Al cerrar servidor se conservan pendientes; se reanudan
  en orden al abrir. Activo cancelado en cierre normal; crash activo→FAILED y reintento
  sólo explícito. Si worker anterior aún vive, lock impide ejecutar otro en paralelo.
- src/render-worker.js separa contrato version1 local-ffmpeg: job/attempt/fingerprint,
  hashes fuente/bundle, rutas locales y duración. Descriptor privado por intento;
  no URLs, credenciales ni proveedor pagado. No es servicio remoto desplegado.
- Bundles tienen digest de manifest/director/settings/preparation/ASS/filtro y3archivos
  de fuentes/licencia. Se revalida al encolar, al despachar y después del worker.
  Migración legacy sólo si manifest, ASS, filtro y fuentes coinciden con preparación.
- DONE exige fuente intacta/fullDecode/audio, firma MP4, tamaño/hash y H2641080×1920/30,
  duración dentro1frame. Node verifica contrato/hash; fullDecode procede del renderer
  Python (que sí decodifica íntegro). No equivale a aprobación audiovisual humana.
- Si falla worker/artefacto o cambia bundle/fuente durante espera, FAILED sin retry
  automático; la cola continúa. No se cambia el renderer, ASR, visión ni selección.
- UI muestra posición, admite cancelar pendiente y hace polling de QUEUED/RENDERING.
  La revisión visual de navegador sigue pendiente; no se afirma despliegue o UI QA.
- 119/119 tests y check completos. Cinco pruebas nuevas cubren FIFO/reinicio, límites,
  cancelación pendiente/activa, checksum erróneo y bundle alterado. Lifecycle sintético.
- Smoke API/FFmpeg real con fixture azul+440Hz de12s: dos trabajosDONE, un intento
  cada uno, sin solapamiento, dos descargasRange206/1024bytes y fullDecode/sourcePreserved.
  Cada MP4 sintético130.823bytes; no es otro montaje de Carlos ni requiere aceptación.
  Evidencia examples/preview/queue-real.synthetic-result.json y script
  scripts/app/smoke_queue_real.mjs. Guía docs/SUES_RENDER_QUEUE.md.
- Coste externo nuevo0USD. Sin servicios, compras, ASR, visión o modelos nuevos.
  Sigue siendo un worker local en Work; no replica/cola distribuida ni hosting público.

## Bloque automático + app local

- F5 permanece80 % y global48 %: estética provisional sin aceptación nueva.
- F7/F8 avanzan en paralelo, sin declararlas cerradas ni sumar pesos por foundations.
- src/automatic-director.js: selección determinista por lexicón español, no LLM.
  Índices de palabras, tiempos originales y reglas como evidencia; citas literales.
- src/local-pipeline.js: guarda bundle, fingerprint de motor/datos/fuentes y ajustes.
  Efectos no seguros se descartan con motivo. No ocultar fallos de la base.
- Nuevo montaje sin corte mecánico12–13s: duración38,30s;75/75 palabras,16captions,
  dos zooms1,07× (intensidad75 %) y cita exacta «detenerte y sentir.». Original intacto.
- src/editor-jobs.js + editor-server.js + web/: app loopback con sesión protegida,
  catálogo de perfiles preparados, trabajos, captions editables, zoom, motions,
  exportación, cancelación, reproductor y descarga con Range.
- Trabajos atómicos, lock servidor/worker, idempotencia, reinicio→FAILED y reintentos
  nuevos sin sobrescritura. No credenciales de proveedor, rutas ni comandos por HTTP.
- Sigue cloud-first: app local es harness del worker Work, no despliegue público ni
  obligación de render en PC. Subida nueva/ASR/visión integral no están implementados.
- QA visual de navegador pendiente: no navegador local instalado; cloud browser no
  alcanza loopback. Pruebas API cubren el lifecycle; no afirmar QA visual de UI.
- Integración real: job0c39a89e-48ae-461e-b886-36d73ce58c9f DONE; un render pese
  a POST duplicado. Ajustes75 % de intensidad y caption literal guardado como manual.
  Descarga MP4 por Range devuelve206 y1024bytes válidos; decodificación íntegra.
- Vídeo final38,30s,18.602.463bytes, SHA256
  a5e14849b73272fbf7f194c7d2851559d3b741b4ad3f5a5a0dc9586d61efed6a.
- Replay1150instantes,809checks cara/caption,90cara/outro, máximo1,498×.
  Son proyecciones de detecciones existentes (~2fps), no nueva inferencia30fps.
- Fingerprint ahora incorpora bytes de original/música además de motor/datos/fuentes.
  Tras ese endurecimiento se verificó manifest idéntico y filtro/ASS byte idénticos
  al render real. Evidencia examples/preview/calma-automatic-real.audit.json.
- Música opcional propia/licenciada declarada por operador: gain<=0,18, sourceIn,
  fades, duck sólo sobre música por voz y limitador0,95. Sin loop implícito.
  Hash/probe de audio y antes/después. Preview real sin música; carpetas04_AUDIO,
  02_ASSETS y03_MOTION GRAPHICS vacías al revisar el17/10. Referencias no se reutilizan.
- Smoke tonos440/880Hz: voz0,24975; música fuera de voz0,01497 y bajo voz0,00315
  (ratio0,2104); fadefinal0,00109. No escucha/elección musical de Carlos ni SFX nuevos.
- UI añadida de consulta de Plantillas, Brand Kit real y catálogo8/3renderers;
  sólo CALMA operativa. Manifest/icono provisional/SW de shell, sin cachear API,
  vídeos, transcripts ni tokens. Instalación PWA y revisión visual pendientes.
- Guía ejecutable: docs/SUES_LOCAL_EDITOR.md. Config: examples/projects/calma-local.example.json.
- Comandos: npm run automatic:preview -- CONFIG NUEVO_DIR --render;
  npm run editor -- CONFIG runtime/editor-jobs 4173. No coste externo nuevo.

## Preview anterior y evidencias

- 37,30 s, H.264 1080×1920/30fps + AAC; plan37,31 s (-0,01 s).
- Base composition 1,40×; dos zooms relativos 1,08× y 1,06× con rampas suaves.
  Máximo combinado 1,512×, cap absoluto1,60×. Sin zoom fuera de los eventos.
- Ojos reconstruidos de visión guardada y estabilizada; zoom alrededor de su
  posición en el encuadre. No inferencia nueva ni zoom al centro de la imagen.
- 16 captions y cierre3 s del kit compartido (Open Sans400/700 y paleta SUES).
- Cita literal «detenerte y sentir.» 14,1–17 s, colocada por encima de la cabeza.
- Replay geométrico: 1120 instantes planificados, bbox existente más cercana;
  762 checks cara/captions y 90 cara/outro, sin solapamiento. No detección30fps.
- Smoke de vídeo: ancla estable <1px en imagen270×480; marcador periférico
  sigue el 8 % esperado y vuelve después al punto original. Tres motions revisados.
- Audio AAC payload SHA256 idéntico a V2, sin cambios de voz por motions/zoom.
- Originales intactos, decodificación íntegra OK. QA comparado4/7/10/15,3/18/35 s.
- Sin escucha completa, aprobación estética, V1 o E2E de app.

## Implementación y contratos

src/semantic-render.js conecta Director Plan, plantilla, catálogo y visión.
Exige timeSpace explícito edit-timeline, reason/rule, semántica del trigger,
bindings y tipos implementados. Rechaza overlaps/gaps de zoom inválidos,
bookends, B-roll que oculte el zoom, cap combinado y cara que saldría del crop.
Rampa coseno ≥0,6 s, al menos1 s entre zooms. Sin eventos periódicos.
Anclas por spans con extremos fuente independientes al cortar: no interpolar el
hueco eliminado. Regresión añadida para ambos lados del salto.

FFmpeg perspective source/frame/cubic sobre el vídeo CFR ya concatenado usa
on/30 y preserva el ancla ocular. Captions/motions se componen después y mantienen
tamaño estable. Pipeline anterior sin director sigue funcionando.

Renderers ASS implementados: QUOTE_CARD_01 (nuevo asset), NUMBER_BADGE_GOLD_01,
DIVIDER_LINE_01. Quote-card resuelto en aliases/registro. Catálogo contiene8 assets,
pero sólo estos3 tienen renderer en este bloque. BLURRED/COMPARE/check/cross/strike
no se dan por renderizados. Los eventos no implementados fallan antes de exportar.
Posiciones seguras superior/lower-third, evitando cara y otros motions; captions
/outro reservados. Se respetan tiempos relativos de capas al escalar el evento.

Selección del preview en examples/director/calma-render-real.json: manual desde
transcript ya aceptado. No se añade un número/divisor sin motivo narrativo;
ambos están probados en fixture independiente. Director automático sigue pendiente.
No nuevas dependencias ni cambios del lock.

## Comandos

npm run reframe -- examples/vision/poc001.mediapipe.json runtime/calma/camera.json
npm run preview:prepare -- examples/preview/calma-semantic.input.json runtime/calma/semantic-preview
Copiar fuentes/OFL a runtime/calma/semantic-preview/fonts.
npm run preview:render -- --source runtime/poc/original.mp4 --bundle runtime/calma/semantic-preview --out runtime/calma/semantic-new.mp4
npm run semantic:smoke -- runtime/semantic-smoke-new runtime/calma/preview/fonts
npm test; npm run check.

Guía: docs/SUES_CALMA_SEMANTIC_RENDER.md. Para recuperar original/transcript y
fuentes: docs/SUES_CALMA_LOCAL_PREVIEW.md. Renderer local al worker Work, no al PC.
El smoke exige un directorio nuevo. Código/ejemplos de B-roll del bloque anterior
se conservan; compositor verificado y referencias excluidas como material propio.

## Entrega automática vigente

Vídeo: https://drive.google.com/file/d/1--Al_j2ZuMZlVMDe9JTw7a4dYGsAiz1B/view?usp=drivesdk
Chat: libfile_3c26d9eeb0548191aacbe82aca5e9427.
Auditoría compacta: examples/preview/calma-automatic-real.audit.json.
Plan automático exacto: examples/director/calma-automatic-real.json.
Audio smoke: examples/preview/calma-audio.synthetic-result.json.
QA interna6frames: runtime/delivery/CALMA_AUTOMATICO_FINAL_QA.jpg. Captions/cita/outro
vistos sin tapar rostro en muestras3/12,5/16/18/25,5/36s. No escucha completa.

## IDs / entregables anteriores

Repo: https://github.com/carlossuess-art/sues-ai-video-editor (1422196475).
Maestro: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
Original: 1zSsbtfIBH3GEvrnkZfvGhssYRsw9kh82. Transcript: 11cNi2n-Qkim0_pKMkz2WMle3xDWH1nEa.
Nuevo vídeo: https://drive.google.com/file/d/171YWJoZgqAA9LfJblGoA5UiR2wK1TnHH/view?usp=drivesdk
Comparación QA: https://drive.google.com/file/d/1NBVQyOz2srKrwFpYCADt9w0OZuKedbrI/view?usp=drivesdk
Motions QA: https://drive.google.com/file/d/1XjqG7eSkPjpBjcpOFhAT55jL9Y_PH6ft/view?usp=drivesdk
Auditoría: https://drive.google.com/file/d/1d4BtmOaHzx_l1J1XvMR_poNamNO9ziBb/view?usp=drivesdk
Vídeo en chat: libfile_3c54d4b9d7a081918c3af48031b20268.
Fuentes/OFL: https://drive.google.com/file/d/1el7DYji13Pj9aBOPIS5oz4KUQ8a8blj-/view?usp=drivesdk
Ejemplos compactos: examples/preview/calma-semantic.render-audit.json y calma-semantic.synthetic-result.json.
Inventario referencias: examples/references/calma-20261016.inventory.json y .temporal.json.
Medios/fuentes pesados fuera de Git. Archivos anteriores se conservan en Drive.

## Límites que siguen vigentes

Fase4 cerrada para un POC, una cara, detecciones ~2fps. Composition base1,40×,
conservative1,12×; eye-line .40 y headroom .06. El cap del perfil es para el
encuadre inicial; la capa semántica adicional tiene cap combinado1,60×.
MediaPipe1.1.1 no reejecutado: tráfico inesperado a play.googleapis.com fue
rechazado por auto-review; no se evita ese bloqueo. ASR histórico0,0039 USD,
no repetido. No nuevos modelos/servicios. Seguridad/hosting de producción pendientes.

El preview semántico anterior conservaba el corte técnico [12,13); el nuevo
pipeline automático lo retira y conserva todas las palabras. No material propio B-roll seleccionado, soundtrack/SFX, relight ni logo final.
Color natural = identidad de fuente. F6–F10 siguen foundations integradas, no
fases cerradas. Hay UI/backend local persistente; no despliegue público ni E2E humano aprobado.

## Siguiente acción exacta

Leer maestro + estado + SUES_EDITORIAL_REVIEW.md. Rama oficial con cola/archivo/
recuperación/progreso/doctor/citas elegibles/undo integrados y evidencia real. El
siguiente paso de alojamiento necesita acceso operativo a administraciónVPS y
revisar destino/seguridad; no publicar el harness local como servicio terminado.
Hostinger tiene9servidores registrados pero sóloAIBuilder callables en esta sesión.
No SSH/API manual para sustituir tools ausentes. Supabaseactivo corresponde alOráculo,
no hay proyectoeditor identificado; no crear ni aceptar costes sin decisión concreta.

Pendientes: HTTPS/auth/aislamiento/almacenamiento duradero remoto yQA visual/PWA real;
DirectorIA semántico y estética/B-roll/música propios. Respetar bloqueoMediaPipe y
no repetirASR/modelos pagados por defecto. F5sigue80%,global48%; no declararV1.
