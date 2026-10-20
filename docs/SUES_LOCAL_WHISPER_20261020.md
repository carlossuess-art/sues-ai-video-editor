# Whisper local para vídeos nuevos · 20/10/2026

Carlos autoriza expresamente Whisper local, sin consumo de API. Se continúa el
editor existente; no se implementa un LLM semántico ni se reactiva MediaPipe.

## Comportamiento

Enviar prompt guarda nombre, plantilla y encargo, después solicita la transcripción
al servicio local. El mailbox privado pertenece al uid1000 del editor. Una petición
por SHA; reintentos activos idempotentes; errores explícitos; estado recuperable
tras cerrar/reabrir. Al finalizar, el servidor valida identidad, palabras/tiempos,
duración y plan completo antes de publicar el perfil. No genera automáticamente.

Nueva fuente conserva todo el plano en un lienzo1080x1920 con bandas oscuras,
voz y duración originales; sin detecciones faciales inventadas. Acercamientos y
motions que requieren caras quedan desactivados en este modo. Subtítulos automáticos
editables. No hereda música, imágenes ni mattes de otro vídeo. Un prompt libre no
compatible no se aplica parcialmente: hay una acción explícita «Generar solo con
la plantilla», registrada como tal en el historial. No ejecuta ese encargo libre.

## Runtime real

faster-whisper1.2.1 / Whisper base CPU int8 /1hilo, modelo Systran fijado a
revision ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66; manifiesto SHA256 adjunto.
PyAV15.1.0 fijado: la resolución inicial instaló19.0.1, incompatible con el
argumento metadata_errors; primer intento falló, se corrigió y repitió realmente.
Dependencias aisladas en /opt/sues-video-setup/whisper-local/venv, lock exacto.
No cambia package-lock ni la imagen existente. Instalación requiere autorización
explícita; scripts/asr/install_local.py reproduce configuración y verifica modelos.

Servicio systemd sues-editor-whisper:CPU50%,MemoryMax768MiB,1trabajo,timeout1800s;
proceso sin capacidades uid1000 mediante setpriv, sin crear usuarios de host.
Mounts privados mantienen permisos del padre; sólo mailbox escribible, fuentes y
modelo sólo lectura. PrivateNetwork/RestrictAddressFamiliesAF_UNIX impiden red;
HFoffline y telemetry disabled. ONNX emitió advertencia de identificador de telemetría
en primer ensayo; no se permite salida de red y se desactivan también sus eventos.
Logs no incluyen voz, credenciales o enlaces privados. El diagnóstico completo de
fallo sólo está en archivo privado. Servicio independiente de terminal/contenedor.

## Evidencia anterior al despliegue

Backup íntegro comprobado218archivos:
/opt/sues-video-setup/whisper-install-20261020-190145/editor-state.tar,
SHA256693dbd610d8c8baedd7a5e6bc3a888b25614cdb04cc4a325ac4ce5c4b5ad5913.
Whisper real sobre fuente nueva12.979956s:español,11palabras,estadoCOMPLETE;
pico observado316768256bytes. No aceptación humana: hay errores de reconocimiento
y se pide revisar subtítulos. No subir medios/transcripción privados a Git.

245tests Node/check PASS. Contrato de mailbox usa salida sustituida, no acredita
inferencia. Chromium145 real móvil393x852/escritorio1440x1000:subida HTTP/FFprobe,
cola,recarga,nombre/plantilla/prompt persistentes,rechazo de prompt no compatible,
botón básico explícito y visible tras análisis,MP4 real8s,play,descarga idéntica,
fullDecode,fuente intacta,sin overflow. ASR del navegador sustituido; Whisper real
se acredita separadamente en VPS. Primer smoke completó render pero falló en URL
relativa del arnés;corregido y repetido. No presentarlo como PASS inicial.

## Despliegue y rollback

Usar actualizador ya verificado, commit inmutable y exclusión mutua. Detener sólo
worker Whisper durante backup/update para congelar heartbeat; reiniciarlo incluso
si el actualizador falla. Guardar su unidad/script previos, nuevo backup editor
verificado y contenedor anterior. El rollback inmediato usa contenedor+estado del
mismo backup:el código anterior no entiende full-frame-fit. Antes de un rollback
posterior, conservar también cualquier trabajo nuevo; no sobrescribirlo a ciegas.
No cambiar Caddy,DNS,WAC,WhatsApp u otros servicios.

Despliegue de código y MP4 real de la fuente nueva: pendientes al escribir esta
sección. Actualizar abajo sólo con resultados observados, no con simulaciones.

## Corrección detectada por la fuente real

La fuente tiene vídeo12.933333s(388fotogramas) y audio12.979955s; formato
12.979956s. Primera ejecución candidata falló honestamente con Output duration
drift exceeds one frame. No se relajó el control:full-frame-fit conserva el último
fotograma con tpad y recorta a la duración del segmento. Mantiene toda la voz,
no acelera ni inventa movimiento. Regresión Chromium con vídeo8s/audio8.05s,
MP4 y decodificación reales;se vuelve a probar la fuente privada en VPS.

## Resultado final observado

Código instalado a75c76f6612e7720724b39c90a40525555e17a14, árbol
3113d266cf11b3c86cb35e40c0b86631b0c54cf0; anterior2f44a708. GitHub oficial
avanzada con lease sin force. Despliegue20261020-192045-394d190b SUCCESS/exit0,
Resultsuccess/ExecMainStatus0; supervisor también0. Worker reiniciado activo.
Backup /opt/sues-video-setup/update-backup-20261020-192047-25550/editor-state.tar,
SHA2566a9b7858c2a57e5df792e9079b51746c1d8131967565684da99348cf956f0bc5.
Contenedor sues-video-editor-before-update-20261020-192047-25550 retenido.

Candidato aislado exacto a75c76f:render real fuente+ASR/fullDecode PASS. Después
producción HTTPS:importación validada,crear versión y render real1intento/DONE,
job f91ce48c-768e-4b1e-acfb-7ad5189d5393. MP43902956bytes,H2641080x1920/30,AAC,
SHA25610c90bef98f574c9830cd12c88fc1e8ce77d84711f9dd061c7b6cfd006eb1158;
idéntico al candidato.11/11palabras,5grupos,sin cortes semánticos,zoom,motions o
transiciones.5trabajos previos íntegros;original intacto;prompt guardado intacto.
HTTP200,Range206,fullDecode y4recursos web por SHA PASS.223de225archivos previos
idénticos;2cambios previstos:heartbeat y metadata del upload recién preparado.
Fotograma real3s revisado:plano completo,subtítulos;hay errores de ASR para revisar.
No es aceptación estética ni prueba de que el prompt libre se haya ejecutado.

245tests/check ysmoke final Chromium con audio8.05s/vídeo8s PASS;regresión del flujo
Subir→verde→prompt también PASS. QA nativa Work no repetida por protección de
credenciales;VPS privado comprobado mediante HTTP y renderer,no login visual nuevo.
Algunos primeros ensayos de arnés fallaron por mountpoint node_modules ausente y
lock de PID1 reutilizado en contenedor QA:corregidos en entorno aislado/nuevo store,
no contados como PASS ni borrando locks de producción. Sin cambios de otros servicios.

Evidencias:examples/preview/whisper.vps-result.json ywhisper-ui.chromium-result.json.
F6/director semántico/V1 no cerrados. Recuperación por correo/Google no se modifica.
