# Login de administrador · implementación y aceptación local · 20/10/2026

Cuenta única: `carlossuess@gmail.com`. Se continúa la rama existente desde
`550fc179aeb8f93b8427be5e16bb49319e07c3a6`, basada en oficial `d2e789c`.
VPS último acreditado por Carlos: código `71399e1`, con backup conservado.
Esta misión NO ejecuta un nuevo despliegue: Carlos recibe el comando fijado.

## Comportamiento

- Formulario privado por correo/contraseña y sesión persistente durante30d.
- Botón de ojo accesible en login, contraseña nueva y repetición; ocultas al abrir.
- Creación/recuperación mediante enlace de un uso,256bits aleatorios,caducidad30min.
- Fragmento del enlace retirado de la barra antes de peticiones; no viaja en URLHTTP,
  referrer, analítica, logs de systemd ni argumentos de procesos. Solo su hash
  SHA256/expiración se instalan en el estado privado del servidor.
- Root ve el enlace en su terminal y conserva una copia `.url` con permisos0600
  en directorio0700 fuera del montaje del editor. No compartir ese enlace.
- La contraseña solo se introduce en la páginaHTTPS; nunca en CLI, Git o Work.
- Hash scrypt-v1 con sal128bits,N16384,r8,p1,salida64bytes, comparación constante.
  Verificación asíncrona y máximo dos hashes concurrentes; límites de cuerpo y clave.
- Cinco intentos fallidos/15min por dirección de socket; no confía en X-Forwarded-For.
  Tras Caddy se comparte la dirección del proxy: límite conservador para un propietario.
- Sesiones firmadas con HMAC, nonce y expiración, derivadas del token y hash actuales.
  Cookie HttpOnly/SameSite=Strict/Path=/,Secure con origenHTTPS y Max-Age30d.
  Persisten al reiniciar navegador/servidor con estado/token/hash conservados.
- Cerrar sesión elimina la cookie del navegador; cambiar la contraseña invalida
  las sesiones de contraseña anteriores. No hay gestión remota de dispositivos.
- Se mantiene el enlace privado previo y su token como recuperación temporal.
  No se rota ni se publica ese token. El enlace de recuperación concede acceso:
  debe seguir privado. No confundirlo con el enlace de configuración de un solo uso.
- No se ha encontrado configuración de envío de correo en el proyecto ni se dispone
  de infraestructura SMTP/API operativa verificada para este editor. No se implementa
  envío ficticio ni se reutilizan credenciales de WAC/WhatsApp. No servicios nuevos.

## Correcciones respecto a la rama recibida

La rama buscaba el hash bajo jobs/access y emitía una cookie de sesión sin plazo.
El arranque ahora resuelve el hash desde la carpeta del token persistente, que en
producción es `/state/access`. Los fallos de autenticación vuelven al formulario;
no se multiplican timers tras entrar. Se oculta el estudio antes de autenticar.
Enlaces fragmento funcionan también desde una pestaña ya abierta. Formulario
con confirmación y ojo, cierre de sesión y cachéPWA v11. No cambia el motor de vídeo,
las fuentes, dependencias, perfiles, contratos de proyecto ni sus fingerprints.

## Provisión y despliegue

`configure_login.py` genera el enlace en el VPS y descarga un lanzador por commit
con SHA256 comprobado. El comando exterior comprueba también el configurador.
No solicita ni guarda una contraseña en terminal. La salida con enlace es del
proceso en primer plano, no del servicio ni de su registro. Esperar SUCCESS antes
 de abrirlo. Se requiere administración root del VPS ya existente.

El lanzador systemd copia su runner a carpeta privada, desacopla la tarea de la
terminal y registra log/result.json y código real. Locks impiden duplicados.
El proceso queda protegido al cerrar la terminal una vez lanzada la unidad;
no se configura reanudación automática tras reiniciar el VPS.

El actualizador verifica commit, editor/origen/mounts, cola inactiva, mismo lock de
paquetes y doctor con imagen existente. Detiene exclusivamente sues-video-editor.
Antes de instalar el registro de configuración crea TAR de editor, verifica bytes
por archivo, manifiesto y SHA. Conserva propietarios/permisos y contenedor anterior.
El registro nuevo queda0600,uid1000/gid1000,visible solo en el acceso privado.
No contiene contraseña ni el token de configuración en claro.

Tras arrancar comprueba salud privada, disponibilidad del nuevo login/setup,
API sin sesión401 yHTTPS200. Fallo revierte contenedor y registro anterior,
conservando el contenedor fallido y cualquier hash nuevo para diagnóstico privado.
No instala paquetes, no hace pull/build y no toca Caddy/DNS/WhatsApp/WAC.

Rollback posterior: cola inactiva; parar y renombrar el contenedor actual a nombre
único conservándolo; recuperar el contenedor registrado en editor-container.txt
 del backup; arrancar y comprobar salud/HTTPS. El antiguo71399e1 vuelve al enlace
privado, pues no ofrece login por contraseña. Conservar el estado; no extraer TAR
sobre proyectos en caliente. Restauración de datos, si hiciera falta, exige verificar
hash y extraer a directorio separado. No se ejecutó rollback en producción aquí.

Recuperación: el administrador vuelve a ejecutar el configurador de la release
aprobada para generar un enlace nuevo. No necesita la contraseña anterior;
requiere control root del VPS. El enlace antiguo de configuración queda sustituido.
El enlace privado tradicional permanece operativo durante esta transición.

## Validación ejecutada

233 pruebas Node PASS y npm run check PASS; compilaciónPython y diff check PASS.
28 pruebas Python de despliegue PASS. Estas simulan Docker/systemd/red y chown:
no equivalen a backup, permisos ni despliegue reales en Hostinger.
Cobertura: hash/sal, dirección autorizada, cookiesHTTPS, límites/CSRF, formatos
inválidos, contraseña incorrecta, persistencia/reinicio, reset/revocación por hash,
enlace expirado/usado yproyectos/fuente/configuración intactos. Provisión solohash,
permisos de enlace/root, checksum, argumentos sin token, backup antes de instalar
setup yfallo/rechazo decola sin cambiar contraseña anterior.

Chromium145 oficial headless-shell real,1440×1000 y393×852: creación de contraseña en formulario
sobre HTTP loopback local, confirmación errónea/correcta, tres botones de ojo,
login con Enter, rechazo de contraseña, borrado del campo tras login, recarga,
reinicio real de navegador yservidor con cookie persistida, logout yenlace privado.
Sin erroresJS ni overflow. Capturas de creación/login revisadas visualmente.
Prueba de Secure cookie/origenHTTPS realizada mediante HTTPproxy fixture conHost
canónico; no es revisión privada de producción. El navegador sin interfaz es
compatible con la política de sockets de Work; no se desactivó esa política.

24 combinaciones CALMA/DOPAMIN ×6formatosELEMENTS ×2tamaños PASS, con
 guardar/recargar/deshacer/duplicar ybackup/restauraciónUI, sin render en esa matriz.
Vídeos deQA sintéticos y tiempos explícitos; no nuevosASR/modelos/consumos.
Evidencias sanitizadas en examples/preview/editor-email-login*.json.

Regresión adicional: tres renders reales de24s conFFmpeg, reproducción yexportación
porChromium enambos tamaños, decodePASS yoriginalintacto. SHA deexportación:
`6a8da115128faeca832da6b95957806774b5cb497b2341888d0272fd989e156d`.
La primera ejecución del player en workspace produjo una salida incompleta y
falló al reproducir; no cuenta como PASS. Se conservó esa evidencia temporal
y se repitió en un directorio nuevo de /tmp: reproducción completa, descarga
idéntica, ajuste/nueva versión, timeline/teclado y ausencia de erroresJS PASS.
No se cambió el renderer para hacer pasar la prueba.

## Pendiente de producción

Carlos ejecuta el comando de despliegue y consulta el resultado. Solo tras
SUCCESS abre el enlace de configuración, crea la contraseña con ojo yconfirmación,
 cierra sesión yentra desde laURLnormal con su correo. Después prueba un vídeo real.
No afirmar puesta en servicio, envío de recuperación por correo ni cierreF9/V1
hasta evidencias remotas. F6 sigue abierta; porcentajes no recalculados.
