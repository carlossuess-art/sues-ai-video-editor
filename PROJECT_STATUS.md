## Estado vigente: código OAuth desplegado; Google pendiente de credenciales · 20/10/2026

Instalado y verificado directamente mediante Desktop Commander en srv1841004:
b9969f8c468a15a7bc77409f862caf13d98596e2, árbol35157551f9b9d9e0685145fd357787adb757eeb9.
Anterior6da5a3d. Oficial avanzó mediante lease desde080fe98, sin force. Despliegue
systemd sues-editor-update-20261020-131347-725ebeca: SUCCESS/exitCode0 y systemd0.
HTTPS200; API401 sin sesión; salud available y cola0/0/0. Cuatro trabajos y155
archivos originales idénticos por SHA antes/después, incluida contraseña privada.

239 tests+check PASS local y en copia aislada del VPS (Node/Git host22.23.3,
FFmpeg real de imagen existente);28 Python infraestructura simulada PASS.
Chromium145 escritorio/móvil: contraseña, ojos, emergencia, persistencia y OAuth
con HTTPS local/proveedor RSA SUSTITUTO PASS. Intentos iniciales de QA VPS fallidos
por herramientas/disco/permisos del arnés se documentan; no se cuentan como PASS.
No se ha introducido la contraseña real de Carlos ni probado Google vivo.

Backup privado verificado: /opt/sues-video-setup/update-backup-20261020-131350-17153,
TAR SHA256 df38087e10b0ef076c1c5deb9053d9962684a91c22adcfca9a2b9ed7bb967505.
Contenedor anterior conservado para rollback; no se realizó reversión innecesaria.
Sin gastos, paquetes nuevos ni cambios en WAC/WhatsApp/Caddy/DNS/otras apps.

Google NO ACTIVO: no hay credenciales privadas; botón desactivado con explicación,
contraseña y enlace de emergencia operativos. Work Google Cloud devuelve Site
Unavailable, también tras recarga. Falta creación/autorización del cliente web y
login Google real; callback https://editor.suesholistics.com/api/auth/google/callback .
Solo cuenta carlossuess@gmail.com y scopes openid/email. No pegar secretos al chat.
Informe y límites: docs/SUES_GOOGLE_LOGIN_20261020.md. Esta evidencia sustituye
las entradas antiguas que dejaban pendiente el despliegue del login por correo.

---
## Google OAuth preparado y probado localmente · 20/10/2026

Base oficial080fe98; VPS observado directamente usa6da5a3d, contraseña configurada,
cuatro trabajos y cola vacía. Se añade Continuar con Google, manteniendo contraseña,
ojos y recuperación anterior. OAuth Code+PKCE/state/nonce, firma/claims OIDC,
email_verified y cuenta única carlossuess@gmail.com; sesiones SUES30d. Sin nuevas
dependencias ni cambios de motor. Google ausente queda desactivado explícitamente.

239 Node + check PASS; 28 Python de despliegue con infraestructura simulada PASS.
Chromium145 real móvil/escritorio: contraseña, tres ojos y persistencia PASS;
flujo Google sobre HTTPS local real con proveedor/JWKS RSA SUSTITUTOS PASS,
incluidos rechazo de otra cuenta y reinicios. No acredita Google en producción.
Detalles y límites: docs/SUES_GOOGLE_LOGIN_20261020.md. Google Cloud en navegador
Work devuelve Site Unavailable también tras recargar; cliente/secret no disponibles.
Falta creación/autorización de Google y login real, sin exponer secretos al chat.
Despliegue del código y conservación remota de datos pendientes de comprobar.

---
## Login por correo terminado y probado · 20/10/2026 · pendiente de instalar

Release aprobada: 6da5a3d9145dde6bff7056e318b67d020e99c66f. Árbol probado:
53954f7657a1561ef72720a2daa12cd6c99b1f3e, idéntico al publicado. Continúa
feat/editor-email-login-20261020 desde 550fc179. Oficial avanzó con lease desde
d2e789c, sin force ni reconstrucción.

Cuenta carlossuess@gmail.com. Hash scrypt privado bajo /state/access, sesiones
firmadas persistentes de 30 días y botón de ojo en login, creación y confirmación.
Configuración mediante enlace HTTPS de un uso, 256 bits y caducidad de 30 minutos,
generado por root en VPS. Solo se instala el hash del token; la contraseña se
introduce en el formulario HTTPS. Enlace privado anterior conservado. Sin proveedor
operativo de correo verificado, la recuperación se hace mediante administración
del VPS y enlace privado, sin envíos ficticios ni nuevos servicios.

233 pruebas Node y npm run check PASS. 28 Python de despliegue PASS, con Docker,
systemd, red y chown simulados. Chromium 145 real en móvil y escritorio: creación,
confirmación, tres ojos, login, errores, cookie persistida tras reiniciar navegador
y servidor, logout y enlace anterior PASS. 24 combinaciones del editor PASS, con
copia y recuperación por UI. Tres renders FFmpeg de 24 segundos: reproducción,
exportación con SHA idéntico al preview, nueva versión, decode PASS y original
intacto. Primera ejecución en workspace fallida no cuenta; ejecución aislada
posterior en /tmp completa PASS. No cambia motor, fingerprints ni dependencias.

Scripts publicados descargados y checksums comprobados. Comandos y evidencia:
docs/SUES_EMAIL_LOGIN_VERIFIED_20261020.md. Actualizador con TAR verificado antes
de instalar configuración, contenedores anterior/fallido conservados y rollback
automático de código/configuración. No se despliega en esta misión por instrucción
de Carlos. VPS último acreditado: 71399e1. Siguiente: comando 1, comprobar SUCCESS
con comando 2, abrir enlace privado y crear contraseña. Login HTTPS real y recorrido
F9 siguen pendientes. F6 abierta; porcentajes no recalculados. Sin gastos ni cambios
en WhatsApp, WAC, Caddy, DNS u otros servicios.

---
## Despliegue VPS acreditado por capturas · 20/10/2026

Carlos aporta capturas 156828–156830 de la consulta independiente tras reconectar.
Modo deploy, commit 71399e1c9ac6a7da1b586c50b8dae5d93651050b,
Result=success, ExecMainCode=0, ExecMainStatus=0, state=SUCCESS y exitCode=0.
Log: copia privada verificada SHA256 y ACTUALIZACIÓN OK para ese commit.
Backup conservado: /opt/sues-video-setup/update-backup-20261020-054955-12714.
La unidad transitoria terminó (inactive/dead); no significa caída del editor.
Evidencia remota aportada por Carlos, no sesión administrativa de Work.
Según el updater verificado, éxito exige salud privada, protección de API y HTTPS.
Rollback disponible; no fue necesario ni se ha ensayado en producción.
Versión anterior exacta no visible en estas capturas. No repetir instalación.

Queda pendiente aceptación F9 en producción: subir vídeo real, preparar edición,
reproducir preview, ajustar/nueva versión y exportar MP4. El doctor muestra
renderExecuted=false: despliegue correcto no acredita un render remoto.
F6 sigue abierta, porcentajes no recalculados; últimos cambios de teclado del
frontend continúan aislados. Sin cambios WhatsApp/WAC/Caddy/DNS ni gasto externo.
Siguiente: abrir editor.suesholistics.com con la sesión habitual y probar recorrido.

---
## Desbloqueo e integración verificados · 20/10/2026

Código oficial: 71399e1c9ac6a7da1b586c50b8dae5d93651050b; árbol
29523d4dba89ac4fc113b0fabe1c61ceaebb79a8. Integra F6 renderer-text
3aaf56b3 (incluye capability/preflight); timeline-guard apunta al mismo SHA.
223 pruebas Node/check y20 Python PASS, repetidas sobre commit remoto.
Render FFmpeg real24s1080×1920/H264/AAC, decodePASS/originalintacto,
fuente sintética y tiempos QA sin ASR. No validación de producción.

Conector GitHub lee/escribe correctamente; Git directo sin credenciales push.
Sin cambios de permisos ni reconexión. Chromium145 bloqueado al abrir socket
por política del entorno; matriz/player no ejecutados con éxito. Cambios
frontend posteriores a1178 conservados en su rama babc6a54, sin integrar.

Lanzador systemd con logs/estado/código real/locks/checksum y diagnóstico
sin parar el editor. Actualizador conserva contenedor fallido y verifica
recuperación.20testsPython simulan Docker/systemd/red, no son operacionesVPS.
Entrega a Carlos: --diagnose, NO instalación. VersiónVPS actual desconocida;
fd168 reportada, intento1178 sin verificar. GETHTTPS200; HEAD404 no es caída.
Backup/rollback remotos no ejecutados. Guía, ramas, hashes y límites:
docs/SUES_BACKGROUND_PREFLIGHT_20261020.md. F6/F9/V1 abiertas; porcentajes
no recalculados. Siguiente: ejecutar diagnóstico systemd, consultar resultado
y revisar instalación real antes de desplegar. Sin gastos/WhatsApp/WAC/Caddy/DNS.

---
## Misión Work · frontend de referencia · 19/10/2026

Auditoría desde aa6e7c246a8de811ac2329d87936e9e84f091e9e; base oficial
fd168dd2b7ff5817be89ee28d8e654e792002fab. PR7 fusionada sin conflictos:
1178f9c10cff7b1c38ac8e8aa196a034dd4d8c9c, árbol probado
3c995c16cf18159b0ff78b045978d93d5117eb8e. Integración reversible.
Guía y evidencia vigente: docs/SUES_WORK_VALIDATION_20261019.md.
Frontend noche/cian, reproductor persistente, seis herramientas con iconos,
timeline real y exportación del MP4 previsualizado. QA local en Chromium145,
211tests/check y 12 pruebas Python de despliegue. Estas últimas simulan Docker.
Sin cambios de renderer/dependencias ni créditos externos.

VPS: no desplegado por Work. HTTPS abre; Session required bloquea la revisión
privada. No hay herramientas HostingerVPS, dispositivos DesktopCommander ni
claves/config SSH disponibles. Instalación anterior fd168 reportada por Carlos;
commit remoto no verificado. Actualizador reforzado con TAR privado verificado
y recuperación del contenedor anterior; backup/rollback remotos no ejecutados.
F8 QA local; F6/F9/V1 y aceptación humana pendientes. Porcentajes no recalculados.
Siguiente: habilitar acceso administrativo existente, ejecutar release fija y
validar subida→preview→ajuste→exportación en producción sin tocar servicios ajenos.

---
## Reproductor persistente y previsualización antes de exportar · 19/10/2026

Carlos rechaza el recorrido PR5 por falta de visibilidad. Pide vídeo siempre
presente con herramientas debajo (móvil), guía contextual y Previsualizar antes de
Exportar. Nueva decisión prevalece sobre paneles separados. Guía vigente:
docs/SUES_PLAYER_PREVIEW_EXPORT.md. Rama feat/persistent-player-preview.

Original reproducible al seleccionar, después de subir y tras recargar; nombre,
tamaño y estado visibles. Nuevo vídeo sin análisis no conserva transcripción ni
selección del anterior, incluso si ya había un montaje abierto y se recarga.
Reproductor permanente con Original/Montaje, play/pausa/búsqueda/pantalla completa.
Herramientas Vídeo/Estilo/Texto/Sonido/Imágenes. Previsualizar renderiza el montaje
completo; Exportar descarga ese mismo MP4 sin repetir render. Editar bloquea Exportar
hasta actualizar la vista previa en nueva versión. Cambio de estilo prepara cues
antes de ELEMENTS y Deshacer conserva texto previo sin guardar.

211tests/check y10simulaciones PASS. Chromium145, escritorio/móvil: selección y
subida reales del vídeo de prueba, playback nativo original/montaje, recarga,
fuente nueva sin texto ajeno, herramientas con vídeo visible, exportación SHAigual
sin otro render, edición→nueva vista previa yversión anterior conservada. Tres
renders24s con decodePASS/originalintacto. Regresiones de fuente/reload y estilo/
Deshacer/ELEMENTS en ambos tamaños PASS; sin erroresJS ni overflow horizontal.
Evidencia examples/preview/player-workflow.real-result.json. Demo UI10,8s guardada:
libfile_99fa6c00ec9c81919386a02db5dc7106. Vídeo sintético/etiquetasQA, sin ASR nuevo.

Web publicada navegada: shell nuevo visible, «Session required» en navegador
remoto. Carlos no puede completar ese acceso; no se inspeccionaron sus trabajos
VPS. El navegador remoto tampoco accede al loopback local. Se usaron pruebas de
software de la copia local; no afirmar exportación/autenticación VPS ni aprobación
humana. Nueva corrección todavía no instalada remotamente. Sin cargos, proveedores,
modelos o dependencias nuevas de producción; nada de WhatsApp/Caddy/DNS.

---
## Recorrido UX por tareas implementado · 19/10/2026

Carlos pide diseño UX de alto nivel. La corrección del panel se amplía al recorrido
Material → Edición → Resultado: sólo un panel visible, contexto y acción principal
por tarea, navegación reversible, opciones del estudio fuera del flujo principal.
Preparar/recuperar abre Edición; Generar guarda y abre Resultado; descarga al acabar.
Ajustes secundarios plegados, subtítulos individuales y búsqueda con estado vacío.
Texto sin guardar conservado entre pasos; indicador de cambios, sin falsos cambios
al buscar. Botón Generar accesible en barra inferior móvil. Valores y motor intactos.
Guía: docs/SUES_UX_FLOW.md. PR5 amplía el ajuste compacto; aún sin instalar en VPS.

Chromium145:24 combinaciones escritorio/móvil × estilos × ELEMENTS PASS;
guardar/recargar/deshacer/duplicar/copia/recuperación y render real38,31s,
decodePASS, fuente intacta yRange206. Prueba adicional en móvil/escritorio:
texto sin guardar, búsqueda/0resultados, tecladoEnter, una tarea visible,
sin scroll horizontal. Botón principal nuevo genera un vídeo real, abre Resultado
y habilita descarga;decodePASS yoriginalintacto.209tests/checkPASS.
Evidencia guided-ux.real-result.json yux-navigation.real-result.json.

VPS observado7cbccb9 por captura delactualizador yDOPAMIN/ELEMENTS visibles.
Nueva UX local verificada; su despliegue remoto pendiente por falta de acceso.
No se declara aceptación de usabilidad, mejora porcentual medida ni cierre F6/V1.
Sin créditos externos, nuevos modelos/ASR/proveedores ni dependencias deproducción.

---
## Panel compacto verificado · 19/10/2026

Carlos confirma DOPAMIN yELEMENTS visibles enapp tras actualización; captura
156756.png muestra «El editor ya usa esta versión; sin reinicio» para7cbccb9.
VPSobservado ahora7cbccb9, reemplaza ba972 como últimoestado; exportación remota
noacreditada. Carlos indica queelmenú esdemasiadolargo ydificulta encontrar cosas.

Ajuste incremental deinterfaz:estilo/estructura yguardar/deshacer siemprevisibles;
recursos,cámara,imágenes,sonido ysubtítulos enseccionesplegables. Cada subtítulo se
abre individualmente; trabajosguardados tambiénplegados. ELEMENTS con etiquetas
enespañol manteniendo valorespersistidos; al elegirformato seabre susección.
Accesosmóviles fijos Material/Ajustes/Vídeo; sin alterar motordevídeo, tipografía,
recetas ni ajustes guardados. ShellPWA v7 para renovar recursosinterfaz.

Chromium145:24combinaciones escritorio/móvilPASS, guardar/recargar/deshacer/
duplicar/copia/recuperaciónUI; sin erroresJS ni desbordamientohorizontal. Panel
plegado774pxescritorio y800pxmóvil; accesoAjustes llegaalselector sinbúsquedalarga.
209tests/checkPASS. No nueva recodificación: motor src/renderer sin cambios.
Evidencia examples/preview/compact-ui.real-result.json. Rama detrabajo
feat/compact-editor-controls; actualización deeste menú enVPS todavía pendiente.

---
## Integración oficial y release verificada · 19/10/2026

PR3 fusionado en8d120cfc9681933214b364df911ffe4fdebadb6b; PR4 fusionado en
7cbccb9bcd8c394106e22027ebfe284782e8989a. Rama oficial feat/phase-4-vision-camera.
Árbol95561a9f5ee103c1c9a5d4e80369cf77d2e4807f idéntico al probado en navegador,
209tests/check y10simulaciones. Sin cambios de package.json/package-lock.json.
DOPAMIN/ELEMENTS ycompositor trasmatte revisado integrados;CALMA siguepor defecto.
Receta visual aprobada preservada. QA de24combinaciones yrender38,31s desde
recuperaciónUI completada; ver evidencia debajoy guía SUES_VERIFIED_RELEASE.md.

Actualizador aislado listo para ese commit; noejecutado remotamente. Inventario
actual deDesktopCommander devuelve0dispositivos conectados; no hay herramientas
HostingerVPS/SSH disponibles. VPSúltimoobservado sigueba972;no asumir actualización.
Necesidad puntual deCarlos:ejecutar elcomando fijado enla terminalHostinger,conservar
su salida ydespués validar app remota. La limitación esacceso alVPS,no autorización.
Sin gasto externo,nuevos modelos,ASR,Lovable oalteracionesWhatsApp/Caddy/DNS.
F6/V1 ysegmentación corporal automática siguenabiertas.

---
## Editor validado en navegador real · 19/10/2026

Chromium145 local:24combinaciones = escritorio/móvil × CALMA/DOPAMIN × seis
formatosELEMENTS. Guardar yrecargar conserva cada formato; sin desbordamiento
horizontal a1440×1000 y393×852. Deshacer restaura huella yduplicar mantieneELEMENTS.
DescargaTAR yrecuperación por selector dearchivo desdeUI conservan los ajustes.
Render real desde proyecto recuperado:38,31s,DONE,decodePASS,fuenteintacta,
Range206/1024bytes;controles deajuste bloqueados al terminar. Sin erroresJS.
209testsNode/check y10pruebas simuladas dedesplieguePASS. Chrome/Playwright sólo
herramientas locales opcionales; dependenciasdel servidor idénticas.
Etiqueta antigua «tamaño doble» corregida a«Palabra importante»; sin cambiar look.
Evidencia examples/preview/browser-integration.real-result.json yscript
scripts/app/smoke_browser_real.mjs. Capturas/medios/cookies privados fuera deGit.
Preparado para integrar PR3/PR4 enoficial;VPS sin modificar. Esta QA técnica no
convierte la tarjetaFLOW detest enuna nueva entrega creativa aprobada.

---
## Muestra de profundidad aceptada y receta reutilizable · 19/10/2026

Carlos: «Lo veo bien», referido a la comparación y muestra vertical de12s,
SHA816d3bb6c1ea77b6048ed650e49b654c129d79626e766d59b9a3645c10d471a1.
Se registra aceptación visual de esta composición/contornos; no aprobación sonora
explícita ni segmentación automática/cuerpo completo, F6 o V1 global.

Receta declarativa en examples/templates/reviewed-depth.recipe.json; etiquetas,
transiciones, límites de capas y ganancias configurables para DOPAMIN/CALMA.
Preparación DOPAMIN con la receta por defecto conserva manifest,ASS yfiltro
idénticos byte a byte a la muestra aceptada. Identidad del estudio ahora incorpora
plan/fuente/recursos/matte/fuentes/música/motor, en lugar de sólo el JSON de capas.
209tests/checkPASS. Sin recodificar ni consumir servicios; oficial/VPS sin cambios.
Siguiente: integración/revisión de controles en navegador, ampliar máscaras sólo
con contornos revisados y continuar cobertura del catálogo. No reabrir esta opinión
visual para una receta idéntica. PR4 sigue borrador dependiente de PR3.

---
## Composición tras sujeto · muestra para comparar · 19/10/2026

FASE6en curso;sin porcentaje recalculado ni cierreV1. Rama
feat/reviewed-subject-depth,basePR3/0d857ac. Nuevo compositor de recursos detrás
de matte FFV1/gray ligado al original,hash/revisión/rangos/región,copia yaislamiento
de subidas. Matting manual/asistido de región superior; NO cuerpo completo
automático. Cinco ensayos locales no generalizan en manos/pared; se corrigen
contornos a mano yse acota muestra0.25–1.4s y8.2–8.9s,hasta y1100.

207testsNode/check/pycompile/diffPASS;FFmpeg prueba interior intacto/exterior
visible yzona inferior protegida. Copia/restauración yguardas contra rutas
anidadas fuera del paquete. Entrega12s1080×1920/30,H264/AAC,8275828bytes,
SHA816d3bb6c1ea77b6048ed650e49b654c129d79626e766d59b9a3645c10d471a1;
decodePASS,fuenteintacta,11framesrevisados. Rótulos editoriales,noASR/LLM.
Comparativa12s sincronizada:libfile_375c09bd02208191a5e08aa1ec9369b4;
vertical:libfile_e288cc7634488191b40a55117ab806fb;archivo técnico privado
libfile_f8cfb62e98248191bdddb90283de42cf (NO recuperar desdeUI).
Guía docs/SUES_REVIEWED_SUBJECT_LAYERS.md y evidencia JSON.

Siguiente: Carlos compara profundidad ycontornos; tras su opinión,refinar/expandir
los mismos recursos. Pendiente máscara corporal general,segmentación automática,
DirectorLLM,navegador yaceptación sonora/visual. OpenCV opcional sóloensayoslocales,
sin dependencias nuevasVPS,pesos,ASR,proveedores,pagos oLovable. Oficial/VPS sin
cambios; no se presenta la prueba como montaje terminado.

---
## Perfiles combinables verificados · 19/10/2026

FASE 6/10 · Motion Library y composición; avances transversales F5/F7/F8.
Progreso fase/global: no recalculado; las estimaciones anteriores retiradas no
se recuperan por cantidad de componentes ni por QA. F6 sigue abierta; no V1.
Rama de este bloque: feat/composable-editing-profiles.
Base oficial verificada:78f38fb1f47f4bfa279904fe6199cc29d9df9030.

DOPAMIN añadido como perfil experimental de referencia maestra Keanu. CALMA se
conserva por defecto, con intensidad/frecuencia relativas0,5; presupuestos de zoom
y entradas más rápidas enDOPAMIN, sin efectos periódicos ni cortes de voz. ELEMENTS
se combina con ambos mediante LIST,RANKING,COMPARE,REVEAL,Q&A,FLOW: uno a diez
bloques por rangos de captions, dos columnas, preguntas/respuestas, numeración y
progreso. Copia/selección explícitas; no detección semántica automática. Paneles
cubren intencionalmente el plano, no fingen recorte corporal. Controles enUI/API,
SFXopt-in, evidencia, límites, deshacer y recuperación existentes reutilizados.

Auditoría y catálogo de huecos:docs/SUES_COMPOSABLE_PROFILES.md. REA, Captions,
AfterEffects yCapCut evaluados con documentación primaria; no se instalaREA ni
se integra unaAPI supuesta. Sin nuevos modelos,ASR,proveedores,Lovable o cargos.

Validación:199tests baseline;203tests finalesPASS,check ydiffcheckPASS.
12combinaciones preparadas con vídeo/análisis reales,75/75palabras. Un render
final DOPAMIN+COMPARE víaAPI/worker:38,31s,32captions,1elemento,0zooms por ajuste
explícito,1intento,DONE,original intacto,decodePASS,Range206. Guardado/deshacer y
copia/restauración conASS/filtro idénticos. SHAfinal
6a19c534b7d3f17815479cab158eb35868cd83e07c5ff64c82a5ae93000b23aa.
Comparación CALMA anterior78f38fb vs motor nuevo con mismo proyecto/ajustes:
ASS y filtro de vídeo/audio idénticos byte a byte,31captions/75palabras.
QA interna6formatos y5frames del render final; sin escucha humana ni QA navegador
(Chromiumausente,no descarga). Muestra técnica con etiquetasQA,no entrega creativa
ni aceptación deCarlos. Medios privados fuera deGit; evidencia compacta en
examples/preview/composable-profiles.real-result.json.

Siguiente acción exacta: revisar/afinar diseños y extracción semántica deELEMENTS
sobre una locución estructurada, completar máscara corporal/efectos ausentes del
catálogo, validar nuevaUI en navegador y después release fija enVPS. Despliegue
no realizado: sigue últimoestado observadoba972,con actualización previa preparada.
Bloqueos: sinChromiumlocal ni máscaraautomática instalada. Necesito deCarlos:
nada para continuar código; valoración de ejemplo real antes de aceptaciónestética.
NoWhatsApp,Caddy,DNS ni producción modificados. No se cierraF6/V1.

---
## Recuperación completa verificada en Work · 19/10/2026

App permite recuperar TAR privado con vídeo/análisis/fuentes/medios/ajustes,
perfil nuevo y trabajo listo. Reintento/reinicio no duplican trabajo. Seguridad:
sesión/origen antes debytes, extracción acotada sin enlaces/traversal/sparse,
hashes/config declarada y limpieza ante fallos. Estados en español, bloqueoSFX
noeditable y BrandKit del trabajo seleccionado. No ASR/modelos/LLM nuevos.

199testsNode/checkPASS;5Pythonextractor y10desplieguesimuladasPASS. Smoke real:
38,31s/75de75palabras/31captions/2zooms/3motions/3transiciones,DONE,1intento,
fuenteintacta/fullDecode/Range206. ASS/filtro restaurados idénticos. QA4frames,
sin reproducción humana ni QA de navegador; descargaChromium incompleta detenida.
VídeoSHA686105e194b34a9ff050dbeb79a3ee5726767148e534b37eeb4ffa0aca905277.
Copia privada108625920bytes,SHA2a659a1511bc3673b9374c7fb73fc82dfa5a5b0aae2f716b13ac7de8b70e612c,
Librarylibfile_edcad6d1230c8191ad58668614741a3e versión0.

Actualizador update_service.py preparado: commitfijo, imagen/deps/estado/token/
origenHTTPS conservados, doctor y rollback; sóloeditor,sinWA/Caddy/DNS/pull/build.
Cinco tests simulados específicos; no Docker real ni ejecuciónVPS. Producción
sigueba972 con HTTPS y acceso móvil acreditados; perfil aún sin material.
La consulta de archivosVPS quedó pospuesta porCarlos. Pendiente aplicar release,
recuperar copia desdeUI y validar exportación allí. Leer docs/SUES_PROJECT_RECOVERY.md.
No aceptación nueva, segmentación automática, DirectorLLM ni cierreF6/V1.

---
## HTTPS verificado en VPS · captura de Carlos · 19/10/2026

Captura156594 acredita activación completada: editorHTTPS200, API sin sesión401,
y rutaWhatsApp401. Hubo espera inicial000 antes de conseguir certificados/rutas.
Copia conservada /opt/sues-video-setup/https-backup-20261018-223450.
Enlace privado actualizado en /opt/sues-video-setup/editor/access/url.txt;
no publicarlo ni pedir captura del token. Motor desplegado continúa ba972;
activador/doc/tests publicados hasta00fac91c366c507844604dc47f2b383ea1ea2d3e.
HTTPS comprobado desdeelVPS conTLSválido y resoluciónlocalforzada, no prueba de
acceso desdeInternet/navegador. Siguiente: Carlos abre enlaceprivado y revisaapp;
restaurar/subir material privado y validar preview/exportaciónreal enVPS.
No pruebasdeenvíoWhatsApp ni garantíaoperativaintegral; HTTP401 conserva ruta.
F6/segmentaciónautomática/DirectorLLM siguen pendientes; noV1.

---
## Despliegue observado y activación HTTPS preparada · 19/10/2026

Capturas de Carlos acreditan editor ba972d76829c53400e7a6401d5e78a1e8593f9fc
arrancado en VPS76.13.51.232: loopback3010 devuelve200. DNS público de
editor.suesholistics.com resuelve esa IP. WhatsApp loopback3001 devuelve401.
Caddy actual usa reverse-proxyCLI desdewa haciawhatsapp-connector:3001, redbridge;
compose /opt/sues-whatsapp/compose.yml. APIadmin2019 rechaza conexión; Caddyfile
default y autosave no representan el arranque activo. No repetir ese diagnóstico.

scripts/deploy/activate_https.py prepara migración acotada: Caddyhost con upstreams
loopback3001/3010; conserva volúmenes/certificados, sustituye sólo bloqueCaddy y
compara configuración efectiva del resto. Rechaza trabajos activos. Reutiliza imagen
fijada porID/montajes/estado del editor con SUES_PUBLIC_ORIGIN; conserva contenedor
previo detenido y copiaCompose0600. Verifica TLS real y respuestas200/401/401;
intenta restaurar ambos servicios ante fallo, incluso si falla restaurarCaddy.
No instala, no descarga modelos, no hacepull/build. Ejecutar medianteconsola deCarlos;
no acceso remoto del agente. Cinco pruebas locales simuladas y py_compilePASS;
Docker no disponible en Work. HTTPS todavía NO ejecutado/verificado en VPS.

Activador SHA256:661a8a992117d02fd8886dbb6c65bed20f7475c6c3f3582a3c6da609d47719d4.
Pendientes: resultado de activación, acceso navegador, material privado/preview y
exportación real enVPS. F6/Director/segmentación conservan límites anteriores; noV1.

---
## Último avance · oclusión por contorno manual y preparación Hostinger ·18/10/2026

SUES_PRUEBA_PROFUNDIDAD.mp4,17,20s,SHA
caef5a4f6d305d8a9e541fcf501269e68a658daa1e4347f02fe93563f9b37620.
Library libfile_c097da5c9308819192c920b15578bebc versión2. Texto tras contorno
real revisado de cabeza0,25–1,25s,treskeyframes/37puntos. NO segmentación automática
ni recorte de cuerpo completo. Config depthTextPath ligada a SHA; copia/restauración
y aislamiento de nuevas subidas probados.194tests/check/doctor/decodePASS.
AudioPCM idéntico;10frames revisados. Ver docs/SUES_DEPTH_TEXT.md.
Hostinger: nueve servidores registrados,soloAIBuilder expuesto; no accesoVPS
ni cambios remotos. Instalador usa Montserrat para perfiles nuevos; bash-n yfixture
PASS. No Docker real aquí. No sustituir acceso ausente por SSH/API manual.
Segmentación automática,DirectorLLM,QA navegador y despliegue siguen pendientes.
No nuevos modelos,gasto ni cierreF6/V1. La autorización de continuar no se registra
como aceptación creativa de esta prueba. Contorno privado guardado en el maestro.

## Última revisión visual · 18/10/2026

Carlos confirma letra y motion de la primera entrega; valoración global abierta.
Continúa la revisión con pregunta inicial, acercamiento manual1,10× y cierre
ESCRÍBEME. Voz y mezcla decodificadas idénticas a la versión anterior.17,20s,
1080×1920/30fps,23grupos,1motion. SHA
0ca33d4406b9259a7b7299d8158740d95e7d251643f3d595f037be7c424bfb3d.
Library libfile_c097da5c9308819192c920b15578bebc, nueva versión del mismo archivo.
Decodificación completa,10frames revisados y preparación reproducida byte a byte.
Motor sin cambios desde191tests; script/checkPASS. Sin máscara corporal ni
inferencia/modelos nuevos. No aceptación de la revisión ni cierre F6/V1.
Receta: scripts/templates/refine_reviewed_raw.mjs. Ver docs/SUES_RAW_REEDIT.md.

## Última entrega · reedición de un bruto · 18/10/2026

SUES_NO_ES_PEREZA_FINAL.mp4:17,20s,23grupos de frase,1motion,1salida cálida,
2SFX y música propia. Montaje editorial explícito desde toma interior limpia,
original intacto. Biblioteca libfile_c097da5c9308819192c920b15578bebc,
SHA ceebd8d3a95535c46a195707d6d946124d5e1ad2d75d36bd60b86e47914ea60f.
191tests/check/fullDecodePASS. Tiempos recuperados por frase, inciertos, sin ASR
nuevo ni nuevos modelos; no karaoke inventado. Presets amarillo/rojo planos.
Leer docs/SUES_RAW_REEDIT.md. No aceptación humana nueva ni V1. Cuerpo sin máscara.

# Estado vigente · diez rondas de revisión creativa · 18/10/2026

Carlos valora sonido con «Bien» y pide luces/entradas/salidas. A21:03Europe/Madrid
solicita diez ciclos de revisar, pensar mejoras, aplicar y volver a revisar con
criterio de edición creativa para redes. Se completan10rondas principales y
correcciones internas adicionales: no se declara perfección ni aceptación nueva.
Base:41d6a766eef24dec1c812ac7f0b2535dbe665ec9.

1Revelado con presupuesto de lectura hasta siguientecue;2iconos ligados a voz y
sombra;3papel con viñeta menos cerrada/luz tenue móvil;4neón y sonido al cue real;
5anillo del sello legible/halo elíptico;6jerarquía y márgenes de comparativa;
7flechas dibujadas por recorrido real sin corte rectangular;8zoom desde frame
limpio, flash acotado y flare móvil, papel sostenido sin doble exposición;
9gananciaSFXpor función/roce360ms;10revisión de montaje/cierre legible en2líneas,
fundido posterior a voz y negro final. El cierre minúsculo de primera exportación
se detecta y corrige antes de entregar. Se resuelve punteado en flechas durante
fundido por alfa individual; curvas se sostienen y la transición sale en conjunto.

SUES_RESULTADO_10_RONDAS.mp4:38,30s/1080×1920/30/H264/AAC,75/75palabras,31captions,
3motions/3transiciones/9SFXpropios,gananciaSFX0,3/música0,1 conducking,originalintacto.
188/188tests,check,py_compile,diffcheck;fullDecodePASS,pico−9,3/RMS−30,3dBFS.
QA24fotogramas y clips enfocados en rondas1–9; últimosframesnegrosRGB0 verificados.
No escucha humana completa ni playback humano ni aprobación del nuevo montaje.
ASS/filtro idénticos reproducidos desde receta final. Diez estados de código y
hashes de clips únicos registrados. Recorte corporal continúa pendiente: no hay
paquetes/modelos de segmentación disponibles; no descargar modelos nuevos ni
presentar máscara facial como corporal. Se mejora profundidad de gráficos/capas.

MP4:16.116.255bytes,SHA0b71340d273693a68d08810cb2555ffaa6c2b09bf0d91c6a3e96be212137e726.
Library vídeo libfile_db85616d76a481919bef1a89e5b783e2;
resumen libfile_17631954f3388191b7c5666131933928;
archivoQA libfile_0656b1f4a7248191adb9e35e5a856219 (clips seleccionados y registro).
Ver docs/SUES_CREATIVE_REFINEMENT_10.md,examples/preview/creative-ten.*.json.
Receta scripts/templates/prepare_creative_polish.mjs sobre proyecto con voz
existente; render con render_local_preview.py. Clips de revisión y registro tienen
scripts propios. F6 abierta, sin V1/porcentaje/despliegue. Coste externo0USD.
Próximo: recorte corporal real autorizado y revisión sobre mejor toma/Director.

---
## Registro anterior

# Estado vigente · estilo validado y SFX integrados · 18/10/2026

Carlos confirma a20:33 que le gustan estilo/ejecución de los motions. A20:34 aclara
las limitaciones de su toma en el coche y autoriza continuar. Validación del estilo;
no aprobación global de coherencia, Director automático, sonido o segmentación.
Base del bloque: d25f52e2bca901dbdb2e32b4c831b29316fa589e.

SFX originales por síntesis local determinista: whoosh, impacto, neón y roce.
Opt-in por ajustes persistidos, volumen independiente0..70%, ducking con voz y
limitador sin autoganancia. No activar por defecto en proyectos anteriores.
Eventos ligados a entradas, barrido, flechas y salidas; revisión muestra su origen.
No descargas/modelos/stock/proveedores ni compras. La capa de audio original de
cada asset del catálogo sigue sin binding; estos son cues genéricos separados.

SUES_VIDEO_MOTIONS_SONIDO.mp4:38,30s,voz original/música existente,9eventosSFX.
Remix sobre render verificado con vídeo copiado sin recodificar: hash de paquetes
idéntico. Script rechaza cambios de ASS/filtro base/original/hash de render previo.
Original intacto/fullDecodePASS. Audio38,268s, pico−9,3dBFS/RMS−30,3dBFS.
185/185tests, check, py_compile y diffcheckPASS. PruebaFFmpeg real de4presets:
señal presente, muestras fuera de eventos sin alterar y energía atenuada con voz.
Se corrigió busSFX inicial silencioso con cama de silencio de duración fija; la
prueba de energía evita regresión. Borrador silencioso descartado, no entregado.
No escucha humana completa ni aceptación sonora. Sin cambio visual de montaje.
SHA MP4 c00a80e14cb9d4e59d146d99e7622327f8cf120fb0251fceda6c35a8b575a7cc.
Library libfile_f4fdc281e8dc8191ab189ad7e6d8b465. Evidencia pública sin rutas privadas:
examples/preview/motion-sound.result.json. Receta scripts/templates/remix_motion_sound.mjs;
primero generar la base con prepare_voice_motion_scene.mjs y renderizar normalmente.

F6 abierta: oclusión corporal real, escucha/afinación de sonido y revisión sobre
mejor toma. Director LLM, QA navegador/PWA y despliegue siguen pendientes. No V1,
porcentaje nuevo, nuevos modelos o gasto externo. Próximo bloque: revisar capacidad
local de oclusión sin consumos; no inferir máscara corporal de una caja de rostro.

---
## Registro anterior

# Estado vigente · motions con voz completa · 18/10/2026

Carlos aprueba la dirección visual de la muestra17s: «Esto está muy bien».
La valoración se liga al SHA93932620c6666b9498a1ed98f75ad029aed9028b51087d2246a4ee4738ac7a87;
no se traslada a una aprobación del montaje completo, audio u oclusiones.
Base del bloque: dd34bea32a9d937fe566388aed9ceb2a8d5181b7.

Nuevo vídeo SUES_VIDEO_COMPLETO_MOTIONS_V1.mp4:38,30s/1080×1920/30,H264/AAC,
voz íntegra y música propia con ducking,75/75palabras,31grupos,3motions y3salidas.
Papel documental13,62–16,28s: «pero nadie te / enseñó a detenerte / y sentir».
Neón17,68–19,80s: «SILENCIO». Esquema23,60–27,56s: «Todos tus temores /
eres culpa, eres temblores». Iconos propios de mirada/corazón, sin stock nuevo.
Entradas de copia literal vinculadas a cues de voz existentes. Se preservan los
intervalos inciertos del ASR anterior; no análisis ni corrección inferida nueva.
Captions inferiores se suprimen sólo si el gráfico reproduce todo el rango de
tokens en orden; en caso contrario se conservan. App permite elegir el último
subtítulo del bloque y los nuevos iconos. Fin con margen hasta la siguiente frase.

182/182tests, check y diffcheckPASS. Receta final reproduce ASS/filtro/PNG de
la versión renderizada. Original intacto y fullDecodePASS; audio pico−9,3dBFS,
sin escucha humana completa. QA12fotogramas para composición/transiciones/texto.
MP4:16.246.450bytes,SHA5edf0f89c5ce7f8d61fbf55dfd4be6087af380fdcc2532cbe2a20d68ab04b543.
Library libfile_1d85a7902d0481919f5fc28f6060b288. Receta reproducible:
scripts/templates/prepare_voice_motion_scene.mjs. Evidencia sin rutas privadas:
examples/preview/full-voice-motions.result.json.

F6 sigue abierta: faltan oclusión corporal real, SFX y revisión de este montaje.
No V1 global ni nuevo porcentaje; no QA navegador/PWA/despliegueVPS. Coste nuevo0USD.

---
## Registro anterior

# Estado vigente · tipografía y tres motions · 18/10/2026

Base: 7caa556cce9dca228ca100c142d066d03ab83923. Carlos fija Montserrat Bold,
ExtraBold, Bold Italic y ExtraBold Italic con archivos reales, sin cursiva o
negrita sintéticas. Sustituye Inter. Proporción vigente 14/12 según su último
ajuste, tracking -2, sombra negra65%/blur15/desplazamiento5/-45°, glow sólo color.
Los números de CapCut se traducen al render; no se afirma equivalencia de sliders.
Anton para centro del sello; Allerta Stencil como alternativa libre para el anillo.

Tres escenas reconstruidas por capas: papel #D9D9D9, cuadrícula7x7 con caída
elíptica, grano/viñeta, órbitas y line-art; revelado de caracteres con blur; sello
rojo con barrido; comparativa de maletas/reloj y flechas curvas progresivas.
Salida radial100→300 en6fotogramas y fogonazo cálido. Copia/iconos/salida editables
en app. Sello e iconos originales recreados, no sticker/plugin extraído del vídeo.

Fuente opcional descargada: Futhark · Noto Sans Runic;24runasUnicode verificadas,
no transliteración latina. Fuentes/licencias descargables mediante catálogo
HTTP autenticado. LicenciasOFL y procedencia/hashes incluidos en Git.

Muestra SUES_MOTIONS_MONTSERRAT_CAPAS.mp4:17s/1080×1920/30,H264/AAC,3escenas,
música propia existente y sin voz. Copia literal suministrada por Carlos, no
montaje semántico de su narración. Original conservado; decodificaciónPASS.
Se verifican6roles en Fontconfig aislado y hashes; logs libass se conservan como
observación parcial, no prueba exhaustiva de selección. QA10fotogramas.
181/181tests, check, py_compile y diffcheck correctos. No aceptación humana.
SHA del MP4: 93932620c6666b9498a1ed98f75ad029aed9028b51087d2246a4ee4738ac7a87.

F6 sigue en revisión visual, sin porcentaje validado; no V1 ni despliegue.
Continúan pendientes oclusión corporal real, SFX y revisión audiovisual.
Coste externo nuevo0USD; sin modelos, ASR, proveedores ni compras nuevos.

---
## Registro anterior

# Estado vigente · corrección de nivel visual F6 · 18/10/2026

Carlos rechaza la muestra sintética: «Esto no es el nivel que quiero».
La estimación F6=80% y global75,75% del bloque anterior se RETIRAN como estado
vigente: sólo medían avance técnico y no justifican el nivel visual solicitado.
FASE6/10 · Motion Library: en revisión visual; porcentaje no validado.
F5 conserva el cierre anterior en su alcance original; no se declara V1.

Base de este bloque: c5d23952a364e47899e920d7ec9e487e1b0e4a76.
Se releen dossier43p, referencia Keanu y fuente real de Carlos recuperada de V5.
Nueva propuesta: tarjetas con cuadrícula/viñeta, arcos y nodos con parallax,
jerarquía literal2:1, sello coral con luz/bordes/entrada y ruta comparativa animada.
Se eliminan los títulos genéricos de relleno. Fotografía de la mirada extraída de
la propia grabación, a ancho completo superior, feather y acercamiento lento.
Se prueban dos composiciones; la primera foto rectangular se descarta, la segunda
funde a ancho completo. No nueva fotografía/modelo/ASR/inferencia ni compra.

Motor: modo de apoyo edgeToEdge explícito, con los mismos rechazos por rostro,
captions/cierre y hashes. Slow-push transforma RGB y alpha por separado y recompone
antes del feather/fades: no destruye transparencia de un PNG. PruebaFFmpeg real
con hueco transparente y centro opaco correcta. Imágenes de app usan slow-push;
la composición a sangre sólo se habilita explícitamente por perfil.

178/178tests, check y diffcheck. Render real38,30s/1080×1920/30/H264/AAC,
75/75palabras,31grupos,2zooms,3tarjetas,3transiciones,1imagen. Original intacto y
fullDecodePASS; música propia existente a0,1 con ducking. Sin escucha humana.
MP4 15.537.555bytes,SHA74573fa3233e77fc51acb4478b10be04f6564151a2f4e01d5f5f5fe557d4a7fa.
Library libfile_2a84f53e0d3481918293577deb46eb99, SUES_F6_COMPOSICION_REAL_V2.mp4.
QA8frames5,35/5,9/6,35/7,9/9,9/10,7/18,5/24,8s. Se comprueba foto/fade,
radial incluyendo texto, tarjeta/sello/ruta. No se afirma igualar Keanu.
Receta reproducible scripts/templates/prepare_reference_scene.mjs ligada al SHA
del original; genera PNG, configuración y bundle. Foto, ASS y filtro idénticos
al bundle renderizado comprobados desde esa receta. No modelo semántico nuevo.

Pendiente: juicio de Carlos sobre esta propuesta, separación/oclusiones reales
del cuerpo/sillón, recursos fotográficos adicionales y SFX verificados. No se
completan por dibujar arcos. No QA navegador/PWA, despliegueVPS/HTTPS ni cambios a
WhatsApp/Caddy/DNS. Coste externo nuevo0USD. No pedir redefinir la referencia.
Siguiente exacto: comparar esta composición real con Keanu y corregir los huecos
visuales concretos; mantener separación corporal y SFX abiertos. No aumentar el
porcentaje por pasar tests. La presentación anterior queda rechazada, esta
propuesta no está aprobada aún.

---
## Registro anterior · estimación retirada, no nivel visual aceptado

# Estado técnico vigente · Fase 6 · 18/10/2026

FASE 6/10 · Motion Library + reglas de colocación
Progreso fase: 80 % (estimación interna; alcance ampliado aún abierto).
Progreso global técnico: 75,75 %. No aceptación estética ni V1.
Rama oficial: feat/phase-4-vision-camera. Base: 13ed08f8c1a8aeaafaf98a694af91c7462577e60.

Seis renderers visuales: cita, número, separador, check, cruz y tachado. Cinco
recursos elegibles por subtítulo desde la app; guardado/deshacer/copia/restauración.
Etiquetas semánticas del catálogo y decisiones explícitas trazables; no se añade
un clasificador LLM ni se interpreta un check como validación factual automática.
Región estable proyectada a30fps con margen facial48px; protege captions/cierre,
rechaza falta de hueco y motions ocultos por B-roll. Audio SFX declarado pendiente.

177/177tests secuenciales, check y diffcheck correctos. Prueba real del worker
con AV y detecciones SINTÉTICAS:24s,1080×1920/30,H264/AAC,18/18palabras,6motions,
1render,original intacto/fullDecodePASS/Range206. Copia restaurada con ASS/filtro
idénticos. QA6frames, sin escucha humana, presentador real o navegador/PWA.
MP4 414.907bytes,SHA6fc9b436057c4b013bef3d35323cfa7f8a441fe259bacd723aee235be5c3e238;
Library libfile_06534ceb52888191b4b65c46e5315ebf.
Guía docs/SUES_MOTION_LIBRARY_V1.md; evidencia examples/preview/motion-library.synthetic-result.json.

| Fase | Estimación interna | Peso | Aportación global |
| --- | ---: | ---: | ---: |
| F1–F4 | Registro anterior | 40 % | 40 % |
| F5 · plantillas | 100 % | 10 % | 10 % |
| F6 · gráficos/motions | 80 % | 10 % | 8 % |
| F7 · director | 25 % | 15 % | 3,75 % |
| F8 · app | 70 % | 10 % | 7 % |
| F9 · integración real | 45 % | 10 % | 4,5 % |
| F10 · despliegue/docs | 50 % | 5 % | 2,5 % |

Pendientes F6: máscara/oclusiones reales del cuerpo/sillón, medios y SFX
verificados; BLURRED_RESOURCE_01 y COMPARE_YES_NO_01 siguen contratos genéricos,
no confundirlos con las imágenes feather/tarjetas de la app. Validación con vídeos
humanos distintos y aceptación audiovisual pendiente. F7 conserva semántica y
densidad automática; F8–10 sus pendientes documentados. Sin despliegue nuevoVPS.
Siguiente acción exacta: integrar máscara temporal ligada al original para oclusión
real y validar con un clip humano; incorporar SFX propios/licenciados verificados
cuando estén disponibles. No inventar una máscara usando sólo la cara.
Bloqueos: sin máscara/persona segmentada ni colección SFX validada. No activar
modelos/proveedores nuevos sin autorización específica. CreatorClub sigue aplazado.
Necesito de Carlos: nada para revisar los motions; máscara/recursos o autorización
concreta de segmentación si se aborda ese siguiente bloque. Coste externo nuevo0USD.
No cambios a WhatsApp/Caddy/DNS/ASR/visión. No se declara V1.

---
## Registro anterior · conservado como histórico

# Estado técnico vigente · construcción general · 18/10/2026

Decisión vigente: el dossier y la referencia Keanu son la base visual de TODAS
las plantillas; variar ritmo, intensidad y densidad según necesidad. Nuevas
plantillas sólo cuando hagan falta. Regla detallada en AGENTS.md y guía general.
La automatización de densidades por variante sigue pendiente del Director.

Construcción transversal F5–F10; implementación 15b17cd515adb8a70e013404332258a7e831c263.
Estimación técnica ponderada: 73,75 %. No es aceptación estética ni V1.
Se conservan los 40 puntos históricos de F1–F4; ahora se contabiliza trabajo
parcial de F6–F10 antes excluido del 48 %. No es una medida de aceptación humana. F5 cierra ahora su alcance original:
kit, motor reutilizable y primera plantilla funcional; variantes aún experimentales.

| Fase | Estimación interna | Peso | Aportación global |
| --- | ---: | ---: | ---: |
| F1–F4 | Registro anterior | 40 % | 40 % |
| F5 · plantillas | 100 % | 10 % | 10 % |
| F6 · gráficos/motions | 60 % | 10 % | 6 % |
| F7 · director | 25 % | 15 % | 3,75 % |
| F8 · app | 70 % | 10 % | 7 % |
| F9 · integración real | 45 % | 10 % | 4,5 % |
| F10 · despliegue/docs | 50 % | 5 % | 2,5 % |

## CALMA cerrada y composición adaptativa · actualización posterior

F5=100% en alcance de primera plantilla funcional; global técnico estimado73,75%.
No significa V1 global ni copia exacta de todos los efectos Keanu. Fuente exacta
no confirmada; Inter es aproximación explícita según niveles de certeza del PDF.
Especificación docs/SUES_CALMA_V1_SPEC.md. F6/F7 mantienen sus pendientes.

Imágenes de app eligen región estable según rostro proyectado en todo el tramo,
protegen texto/cierre y cambian dirección del feather cuando quedan debajo.
Perfiles con caja explícita la conservan con validación. No segmenta cuerpos.
Prueba FFmpeg sintética revisada: cara alta→imagen debajo; cara media→imagen arriba.
Sin hueco seguro durante todo el intervalo→rechazo claro. No vídeo caminando real.
173/173 tests correctos con CALMA funcional y colocación adaptativa; checkOK.
No nuevoASR/visión/modelos/coste externo. V5 anterior conserva su evidencia;
no se afirma que contenga esta mejora posterior. Exportación conjunta actualizada verificada:38,30s,75/75palabras,Range206,
fuente intacta y fullDecodePASS. Copia restaurada con ASS/filtro idénticos.
V6:15.347.158bytes,SHA5b8872c7d0a67eed9eeb7bc22634d5ebad5a5eb58efc2cf1ae3c4910c13fd135.
Library libfile_a346bcf15b888191939d7941993425f8; Drive https://drive.google.com/file/d/1sKNjjc-7j2MzXTQ5moKgIFmfLc7lW-MM/view .
Implementaciónc7d5f7a4e2f7e6f6cac20a15c642c5946b7c66af. Un fotograma real6,15s
revisado para la nueva posición; dos casos sintéticos renderizados y revisados.
Evidencia examples/preview/calma-subject-aware.real-result.json.

## Resultado V5 anterior verificado

- Palabras clave elegibles, jerarquía2:1, paletas reflectantes, oblicua/condensada;
  CALMA provisional y tres variantes experimentales. Font Inter aproximada.
- Subida/selección privada de imágenes y música, volumen/ducking; tres tarjetas
  y tres transiciones globales. Revisión del plan con evidencia y tiempos inciertos.
- Copia recuperable por versión, verificación SHA y restauración probada con
  ASS/filtro idénticos; revisión estética humana registrable ligada a cada MP4.
- Doctor sin medios y perfil restaurado correctos. No ASR/visión nuevos ni modelos.
- 172/172 tests secuenciales, check, Pythoncompile, Bashsyntax y diffcheck correctos.
- Smoke real HTTP:97MBoriginal + PNG + WAV → ajustar/deshacer → copia/restaurar
  → variantes → worker → privado → Range206. Un render, ninguna palabra omitida.
- MP4 V5:38,30s,1080×1920/30,H264/AAC,75/75palabras,31grupos,2zooms,
  3tarjetas,3transiciones,1imagen;15.345.100bytes. Fuente intacta/fullDecodePASS.
  SHA58772c780c7905b0e4819ddb1af4fcfe78dc4fcf7f43b52778f79500bd5a9a8b.
- QA13fotogramas: contraste corregido en tarjetas claras; sin recortes observados
  en las muestras. Audio pico−9,27/RMS−30,27dBFS,0NaN/Inf; sin escucha humana completa.
- Copia TAR106.854.400bytes/16archivos, revisión Git exacta y árbol limpio al crear.
  SHA7e3de59c12f6235baf5363018f45bd4dd4112ed11d6e7ee33bf34b4b151360d5.
- Vídeo: Library libfile_cb1fb8f3fcb08191b15e8fe5399b174a;
  Drive https://drive.google.com/file/d/1RGK8L6EsR6v0dNenBdbFSKvgeqzgmML1/view .
  Copia: Library libfile_2db4a5b84a6c8191b4280d87d43202b0.
- Guía docs/SUES_GENERAL_STUDIO.md; evidencia examples/preview/general-studio.real-result.json.
  AGENTS.md conserva la instrucción de continuidad autónoma del usuario.

## Pendientes reales

Fuente exacta, parecido fino y segmentación del sujeto; sonido de efectos;
Director con semántica avanzada y análisis automático de originales distintos;
aceptación estética humana; QA de navegador/PWA (Chromium no disponible y navegador
remoto sin acceso al loopback); VPS/HTTPS sin acceso operativo. No despliegue nuevo,
ni cambios a WhatsApp/Caddy/DNS. Coste externo nuevo0USD. No se declara V1.

---
## Registro anterior (histórico)

# Estado técnico vigente · 18/10/2026

FASE 5/10 · BRAND KIT + TEMPLATE ENGINE
Progreso fase: 80 % (estimación técnica; estética provisional).
Progreso global: 48 % = F1–F4 (40 %) + 80 % del peso F5 (8 %).
Rama oficial: feat/phase-4-vision-camera.
Base de este bloque: acbb8d5471cce1972c886ba9331379f8477dd35d.
Último hito: texto progresivo, entrada por caracteres e ilustración con máscara suave.
Dossier Keanu aplicado a una muestra CALMA0–16s; Inter sigue siendo aproximación.
Suite vigente:159/159 secuencial y npm run check; estética pendiente de revisión.
Smoke API→plan→ajustes→worker FFmpeg→MP4→Range real OK. Audio sintético OK.
Sin aceptación E2E humana ni cierre estético.
Coste externo nuevo: 0 USD. Sin ASR/MediaPipe/Shotstack/generación/Lovable/compras.
Necesito de Carlos: revisión de la nueva prueba estética; VPS/HTTPS esperan acceso operativo.
Estado VPS observado: PENDIENTE MEDIOS, no iniciado; app/render probados en Work.

## Aplicación del dossier Keanu · 18/10/2026

- Estado recuperado del maestro/Git,base1e55884; sin reconstruir. Dossier43p leído,
  tablas/fotogramas revisados. Guía docs/SUES_KEANU_DOSSIER_APPLICATION.md.
- Subtítulos progresivos: prefijos centrados, tiempos e índices reales conservados.
  Tokens0s unidos al cue real; ventanas finales<160ms coalescen sólo el display,
  sin cambiar ASR. Texto manual estático. Continúan la jerarquía2:1 y oro estático.
- Palabra clave por caracteres:24ms, asentamiento hasta130ms,8px y−3°→0°.
  Ajustes propuestos, no recuperados. Posiciones con métricas Inter/libass.
- Compositor de imagen fija con feather inferior/fades separados, crop/zoom y
  detecciones existentes para evitar rostro. Rechaza cruces con tarjetas/B-roll,
  fuentes ajenas/rol style-reference y recursos sin hash/derechos/vínculo al original.
  Renderer comprueba imagen/hash antes y después. Otra importación no hereda assets.
- Recurso originalSVG de horizonte/naturaleza rasterizado para5,2–8,4s. Es una
  ilustración de prueba, no foto/rotoscopia. Selector/subida de imágenes UI pendiente;
  activo por perfil privado, con interruptor de citas y recursos en la app.
- Dos ciclos reales HTTP/upload→CALMA→zoom75%→FFmpeg→privado→Range206. La primera
  revisión detectó espaciado y fallback excesivo; corregidos y renderizados otra vez.
- Final completo38,30s,31grupos,75/75tokens,2zooms/1foco/1imagen,18.317.243bytes,
  SHA36624ddbe08451cf67a1c43548f39b6e9ae2f2066f30753970f42e76c2b68bce.
  Fuente intacta/fullDecodePASS/AAC. Fingerprint/ASS/filtro coinciden con código.
- Entrega SUES_CALMA_CAPAS_KEANU_V4_16s.mp4:16,00s,1080×1920/30fps,H264/AAC,
  11.817.803bytes,SHA b9af9a187b6ceec854901a52d3594fd43116ec4eaad35af8e15fc6abe435cc2c.
  Library libfile_b3e9454b11f88191a4f73e909cfc2b0d;
  Drive https://drive.google.com/file/d/1Gsy9owJJH4GHq_cP2hByHpoHw_MIRAQk/view .
- QA11frames:2,3/3,1/5,8/5,9/6,1/6,35/7,5/8,35/8,6/12,8/25,6s. Letras construidas,
  texto centrado, máscara/fades y sin invasión facial observada en esas muestras.
  159/159tests secuenciales+check+Pythoncompile+diffcheck; coste externo0.
- Sin fuente exacta, segmentación sujeto/sillón, gráficos completos, estilos
  condensados/oblicuos o auditoría auditiva de SFX. No despliegue nuevo aVPS.
  F5=80%,global48%; aceptación estética yV1 pendientes. No necesita decisión nueva
  deCarlos para continuar con los componentes restantes dentro del alcance autorizado.

## Jerarquía de palabras · 18/10/2026

- Carlos pide término importante al doble de tamaño, excepcional además con color
  y aspecto metálico. Fuente original aún no identificada; Inter aproximada.
- Plantilla y motor: importante blanco144/acompañantes72 px; tres posiciones128/64.
  Ratio2:1, orden conservado, zonas seguras y fallback normal si no cabe legible.
- Oro de nueve bandas con luces/sombras dentro del glifo, una sola sombra/contorno.
  Acabado estático; sin afirmar brillo animado ni metal3D.
- Selección por frase con reglas editoriales/pesos en plantilla; no modelo semántico.
  Reconocer/sentir/silencio/avanzar excepcionales en este perfil. Texto manual no
  recibe correspondencias inventadas. Foco literal previo sigue teniendo prioridad.
- Separación por comas evita mezclar dos cláusulas. Se mantienen todos los tokens
  y tiempos; ASR incierto permanece unido a un intervalo real.
- Referencia revisada44,9/52,6s: BANCO/LIBERTAD con acompañantes y objetos flotantes.
  Recursos flotantes, recortes y cambios cromáticos globales siguen pendientes.
- Prueba final API/upload/worker/Range206:31grupos,75/75tokens,38,30s,2zooms/1foco.
  MP4 18.364.118bytes, SHA514f85c5fbb4e7b015a8c3794db5b6a5506085fe50ff53fff5f248456d407dda.
  Original intacto, fullDecodePASS, AAC, Inter verificado. QA8frames sin recortes
  o solapamiento facial observados en las muestras. ASS/filtro idénticos al código.
  Vídeo SUES_CALMA_JERARQUIA_KEANU_V3.mp4; evidencia pública sin rutas privadas en
  examples/preview/calma-hierarchy.real-result.json.
- 156/156 tests secuenciales y check. Coste externo0. F5=80%,global48%.
  Aplicado/probado en Work; sin despliegue nuevo a VPS ni aceptación humana.

## Referencia prioritaria Keanu · 18/10/2026

- Carlos confirma Reel de deckeanu sobre Keanu Reeves como referencia principal,
  Sues_Reel2_May_V1.mov como secundaria; las siete referencias previas bajan de prioridad.
- «Video1.mp4» recuperado y revisado64,2s; secundaria91,467s. Contactos16/8frames,
  scene-score completo y OCR4fps (ruidoso; no fuente de tiempos). No nuevo ASR/visión.
- Kit compartido pasa a Inter4.1 oficial/OFL como aproximación visual, sin afirmar
  identificación exacta. CALMA usa grupos1–3, blancos/bold/compactos, métricas para
  ajuste de anchura, entrada suave y palabras con evidencia en dorado SUES.
- UI permite1/2/3 palabras; evita aplicar ediciones de IDs viejos tras reagrupar;
  undo restaura agrupación y texto. Tiempos inciertos se agrupan con un token real,
  sin fabricar duración individual. No se cambia la voz o el ritmo de habla.
- Cita literal con fondo blur/dim y fades350ms; evita duplicar debajo el subtítulo
  equivalente. Una corrección manual no se oculta por la cita del transcript.
  Es variante de QUOTE_CARD_01; compositor de imágenes/vídeo BLURRED_RESOURCE pendiente.
- Cama ambiental original46s creada offline, sin samples/modelos/compras, mezclada
  al perfil de prueba a0,16 con duck/fades/limitador. Música privada fuera de Git;
  partitura y generador reproducibles. Selector de pista/volumen UI pendiente.
- Nuevo render real desde API/upload/worker/storage/Range206:38,30s,75/75palabras,
  30grupos,2zoom,1foco;18.198.492bytes. SHA
  20abb19a75e4f7e20ac884c58ee3534d736b313f9c4e0f17c1e6e7172aad5299.
  Original intacto/fullDecode/audio AAC. ASS/filtro vigentes idénticos al render.
- QA8frames y detalle de acento dorado. Audio pico−9,28/RMS−29dBFS sin NaN/Inf;
  sin escucha completa ni aceptación estética humana/navegador/PWA/VPS.
- 151/151 tests secuenciales+check+Bash/Python. Guía docs/SUES_CALMA_KEANU_REFERENCE.md,
  ADN examples/references/calma-keanu-priority.dna.json y evidencia
  examples/preview/calma-keanu.real-result.json. F5=80%,global48%,coste nuevo0.
- Próximo: revisión estética deCarlos, ajuste fino y recursos propios integrados.
  Despliegue/HTTPS y análisis automático de otros vídeos siguen pendientes; no V1.

## Subida desde la app · 18/10/2026

- Base: HEAD 5294b7d. Maestro, estado y guías leídos; no AGENTS.md encontrado.
- Subida privada MP4/MOV/WebM con audio: 250 MiB, 10 minutos, streaming a disco,
  SHA256/FFprobe, una simultánea, cuatro originales. Reintentos sin duplicar,
  reserva de espacio y limpieza de subidas interrumpidas. Sesión/origen protegidos.
- Cada vídeo se liga a su análisis por hash. Otro original queda NEEDS_ANALYSIS,
  sin heredar palabras o encuadres ajenos. READY y WAITING_ASSETS visibles en UI.
- Recuperación privada JSON desde la app: transcript, cámara y visión existentes.
  Comprueba identidad, medidas, duración y plan antes de habilitar el montaje.
  Guarda perfiles atómicos y los restaura al reiniciar. No sustituye análisis listos
  ni usados por trabajos existentes. No hereda música de otro vídeo.
- Open Sans 400/700 + licencia SIL OFL incluidos en assets/fonts (264 KiB).
  Shell y consulta de diseño arrancan sin medios; doctor sólo con perfil completo.
  El despliegue conserva runtime y dependencias, sin reinstalar ni tocar WA/Caddy.
- Dos ciclos reales HTTP: original 96.942.857 bytes → subida → CALMA → ajuste 75 %
  → worker → almacén privado → Range 206. El segundo parte sin original, transcript,
  cámara o fuentes privados, y recupera el análisis por API usando fuentes del repo.
- Ambos: 38,30 s, 75/75 palabras, 16 captions, 2 zooms, 1 cita; un render por ciclo.
  Original intacto, decodificación íntegra y AAC. MP4 de 18.602.463 bytes, SHA
  a5e14849b73272fbf7f194c7d2851559d3b741b4ad3f5a5a0dc9586d61efed6a idéntico.
- QA de ocho fotogramas: 3/7/12,5/16/18/25,5/33/36,5 s; textos fuera del rostro
  en esas muestras. Sin escucha completa, navegador/PWA real ni aceptación humana.
- 145/145 tests, check, Bash y diff-check. Guía docs/SUES_VIDEO_UPLOAD.md y script
  scripts/app/smoke_upload_real.mjs. Evidencia pública compacta en
  examples/preview/upload-cold.real-result.json. Análisis de recuperación fuera de Git.
- Despliegue preparado, NO ejecutado en VPS. No hay dispositivo remoto conectado
  ni herramienta de administración VPS callable. Estado VPS observado: PENDIENTE
  MEDIOS, no iniciado. HTTPS sigue pendiente. No se cambia WhatsApp, Caddy o DNS.
- Vídeos nuevos se pueden guardar e importar con su análisis; ASR/visión automáticos
  de originales distintos siguen sin integrar. No confundir subida con V1 completa.
- Coste externo nuevo: 0. Sin ASR, nueva visión, modelos, generación o Lovable.
  Fase 5: 80 %; global: 48 %. Avance de F8 sin cierre de aceptación estética/V1.

## VPS · ejecución confirmada18/10 01:26

- CapturaCarlos muestra PENDIENTE MEDIOS y «No iniciado»: correcciónGit supera
  comprobaciónfuente/runtime y llega al guard dearchivos; no servicio arrancado.
- Drive conectado confirma los tres archivos privados, sólo permisoowner:
  original96.942.857bytes, transcript8.364bytes, ZIPfuentes156.915bytes.
  No cambiar permisos ni publicar vídeo. Necesaria transferenciaautenticadaVPS.
- No acceso directoVPS operativo; buscar vía desubida desde móvil antes de pedir
  instalaciones nuevas. No repetir runtime/npm/ASR/visión ni tocarWA/Caddy.
- Nuevo kernel6.8.0-147 visible enbanner; causa/momento no comprobados porasistente.
- F5=80%,global48%, costeexternonuevo0. Siguiente: restaurar los tresarchivos
  privados, extraer sólofuentes/licencia, doctor/arranque, luego API/preview/export.

## Corrección ownershipGit · captura23:01 del17/10

- EjecuciónVPS observada: launcherSHA256OK; preparación falla al comprobar HEAD
  en fuente.BJjpga/source por «detected dubious ownership». No llegó a medios,
  doctor o arranque. No prueba de fallo de runtime/npm; no reinstalar.
- Causa: prepare-source dejó código con UID1000 para runtime, y root comprueba
  HEAD. Corregido a git -c safe.directory="$SUES_SOURCE" sólo en esa invocación;
  conserva comprobación deSHA. Sin configuraciónGitglobal ni excepción comodín.
- PruebaBash exige opción específica; pruebaGitreal reproduce rechazo con hook
  GIT_TEST_ASSUME_DIFFERENT_OWNER y verifica HEAD y gitconfig intacto.
- Suite137/137+check+bash-n en desarrollo. VPS: reparación pendiente deejecutar.
  F5=80%,global48%, costeexternonuevo0. Siguiente: relanzar releasecorregida con
  dependencias existentes y devolver estado-servicio.txt; medios/HTTPS pendientes.

## Arranque aislado · bloque vigente17/10 noche

- Base verificada bec11220ee45a2d233d4be281c0ea34e0b648188; instrucciones/maestro
  recuperados antes de cambiar. Fuente preparada confirmada verbalmente porCarlos;
  HEAD realVPS/medios/servicio aún no observados. CreatorClub/SFX aplazados.
- prepare-service.sh verifica fuente-directorio/commit/HEAD, reutiliza node_modules
  con package-lock idéntico, runtime existente; sin npmci/build/reinstalación.
  start-public-service.sh recupera release fija separada con nohup/flock/log/estado.
- Mínimo: original/transcript/OpenSans400/700/OFL privados; cámara desde visión
  existente sin inferencia. PENDIENTE MEDIOS impide arrancar una app incompleta.
- Servicio preparado: loopback3010, usuario1000,0,5CPU/1GiB, rootfs/código readonly,
  estado privado persistente, restartunless-stopped y logs rotados. No Caddy/WA/DNS.
  Contenedor o puerto existentes se conservan. Doctor previo sin render/ASR/modelos.
- SoporteHTTPS explícito de operadorúnico: Host/Origin fijados, cookieSecure;
  X-Forwarded-* no concede confianza. Bind sigue127.0.0.1. HTTPS no configurado.
  Token persistente enarchivo privado; URL privada fuera del log. No multiusuario.
- Validado desarrollo:136/136tests+npmruncheck+bash-n. Incluye pruebaHTTP de origen/
  cookieSecure y fixtureBash de medios ausentes con Docker/Git simulados.
  NoDocker disponible aquí; no se afirma ejecución ni servicioVPS comprobado.
- Coste externo nuevo0; F5=80%,global48%. Guía docs/SUES_VPS_SERVICE.md.
- Siguiente exacto: bloque consola→estado-servicio.txt→restauración mínima privada→
  doctor/arranque→API/preview/ajuste/exportaciónVPS→HTTPS con proxy observado.
  Subida/análisis de vídeo nuevo y aceptación estética/V1 siguen pendientes.

## Hostinger · procedimiento vigente de consola

- Cambio de estrategia autorizado08:51–08:52: código público y descarga anónima,
  sin preocupación porcopias/origen. No se añade licencia ni se abren app/VPS/Drive.
- Revisión:10ramas/92commits/91árboles/301blobs(1.574.928bytes), sin erroreslectura;
  no credenciales reales detectadas. SóloURLfirmada deejemploShotstack caducada2023.
  Actions0runs. Informe docs/PUBLIC_REPOSITORY_REVIEW.md con alcance ylimitaciones.
- VisibilidadPUBLIC confirmada enUI yAPIGitHub. Cambio realizado enajustes de sesión
  carlossuess-art tras aprobaciónsudoGitHubMobile mediantebrowserAuth seguro.
  DescargaHTTPS anónima de prepare-source.sh ySHA256 verificados; GitHubCLI enVPS
  ya no necesita autorización para este flujo. No se abren app/VPS/Drive.
- scripts/deploy/start-public-source.sh preparado desde snapshotf603380... para
  prepare-source.sh; SHA256 ynohup. Runtime listo;
  fuente/app/HTTPS pendientes. F5=80%, global48%.
- Captura08:43: estado-codigoPENDIENTE, codigo.log vacío. No se pudo comprobar acceso
  existente al repo privado; no hay código descargado por ese bloque. Runtime listo.
- Preparado GitHub CLIoficial2.102.0/Linuxamd64, descargaHTTPS directa ySHA256 fijado
  bb766f710eef8ede859c18578c72c327597cd4c8a85b06001b1f3843c6019386 (APIrelease).
  Sólo binario en/opt/sues-video-setup/tools/gh; sin apt ni acceso automático. Login
  webinteractivo porCarlos, config privada github-auth, GIT_CONFIG_GLOBAL aislado.
  prepare-source.sh soporta helpergh porinvocación, sin tocar gitconfigglobal real
  ni pasar tokens/montar credenciales dentro del contenedor. Implementación pendiente
  de ejecución enVPS. Laautorizaciónweb requiere intervención deCarlos.
- Captura08:21 confirmaDEPENDENCIAS PREPARADAS yCORRECCIÓN TERMINADA. El ERROR
  anterior permanece enlog histórico; la reparación sí terminó. Imagenruntime lista.
- Siguiente bloque scripts/deploy/prepare-source.sh: pruebaaccesos existentesHTTPS/
  SSH(sin alta dehostkeys ni credenciales nuevas), timeout20scadauno. Si hayacceso,
  fetchsnapshot fijoeb441c712c9a6edd07c0d41b344adfdf0275c95d, verificacommit,
  npmci sin installscripts/audit, check ytests secuenciales encontenedor limitado
  0,5CPU/1GiB. Sin puertos ni app arrancada. Si fallaacceso, estadoPENDIENTE sin
  pedir ni imprimir secretos; no atribuir automáticamente el fallo a contraseñas.
  Logs/estado separados delruntime, snapshot en directorio nuevo, sin sobrescribir.
- Capturas08:18: build de sues-video-runtime:20261017 terminado y prueba de filtros/
  miniH264/AAC OK; Node22.23.3,npm10.9.9,Python3.11.2,FFmpeg/ffprobe5.1.9,
  fc-scan presentes dentro deimagen. Fallo posterior sólo al registrar etiqueta
  local node:22-bookworm-slim ausente. EstadoERROR no significa fallo debuild/smoke.
- Corregido registro de huella base para que sea opcional: ausencia se declara en
  base-provenance-status.txt y base-digests.json=[], sin inventar digest ni repetir
  descarga. Reparación deestado confirmada enVPS. No app/HTTPS.
- Capturas actuales recibidas17/10: srv1841004 Ubuntu24.04.4/x86_64,1CPU,
  RAM3,8GiB/~3,1disponible, swap0, disco40Glibres; Docker29.6.2/Compose5.3.1,
  Python3.12.3. Node/npm/FFmpeg/ffprobe/gh ausentes delhost. WhatsApp yCaddy activos,
  red sues-whatsapp_default, puertos3001/80/443 coinciden con el histórico.
- Preparado scripts/deploy/prepare-runtime.sh: imagen aisladaNode22+Python+FFmpeg+
  fontconfig, sin paquetes enhost/puertos/reinicios. nohup/log/PID/estado persistente,
  flock, mínimo5GiB, verificación temporal sinred y miniH264/AAC. Bash-n OK; noDocker
  enentorno local; build/smoke deimagen acreditados por capturasCarlos. Editor aún
  no desplegado. Corrección final deestado confirmada porCarlos.
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

1. Revisar SUES_CALMA_REFERENCIA_KEANU_V2.mp4 con Carlos, partiendo de la referencia
   Keanu/deckeanu y la secundaria Reel2. Afinar letra, agrupación, foco y música
   sin volver a la síntesis anterior de siete referencias como prioridad.
2. Integrar recursos propios/licenciados para las tarjetas de imágenes/vídeos y
   B-roll de naturaleza/retiros. El foco actual sólo tiene cita literal de texto.
3. Cuando exista acceso VPS, lanzar release fija y comprobar shell/HTTPS protegido;
   subir el original, recuperar su análisis si falta y exportar allí. No modificar
   WhatsApp/Caddy a ciegas ni abrir loopback3010 directamente a Internet.
4. Integrar análisis automático autorizado de otros vídeos y completar QA de
   navegador/PWA y aceptación audiovisual integral.

Código, renders y pruebas en Work no equivalen a despliegue. No reinstalar runtime
ni repetir ASR/MediaPipe por defecto. Supabase del Oráculo permanece separado.
Fase5 sigue al80%, global48%; aceptación estética y V1 todavía pendientes.
