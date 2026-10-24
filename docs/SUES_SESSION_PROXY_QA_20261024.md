# Sesión y reproducción · corrección basada en pruebas

## Hallazgos confirmados
La pantalla de acceso era visible antes de terminar la comprobación de sesión.
En navegador cloud, después de esperar aparecía el estudio privado sin volver a entrar:
eso demuestra un falso estado de acceso durante el arranque, no explica por sí solo todos
los posibles fallos de cookies del móvil de Carlos.

La vista previa solicitaba el mismo MP4 de exportación. Segundo vídeo real:
12.895.862bytes/13,4s. Cargar ambos reproductores ya se corrigió; faltaba reducir
el coste de red del vídeo visible.

## Cambios propios
Comprobación ligera de sesión antes de catálogo/diseño. Sólo401 muestra acceso;
fallos de red no se convierten en desconexión. Formulario inicial oculto,
pantalla de carga y botón de reintento. Primer perfil preparado seleccionado.
Cookie persistente30d con Max-Age y Expires; HttpOnly/SameSite/Secure conservados.
No se cambia ninguna contraseña, clave o permiso.

Nueva ruta privada /api/jobs/ID/preview genera y reutiliza un proxy720p, H264,
máximo1200kbps,AAC96kbps,faststart yRange. La descarga usa /media y conserva
elMP4full. Caché ligada a firma/SHA256 de fuente y SHA256 de proxy, cola de una
conversión, temporales y cancelación al cerrar. Nuevo vídeo prepara reproducción
antes deDONE; histórico genera proxy al primer acceso. Ningún modelo/API de pago.

## Verificación
19pruebas de sesión,buffer,proxy,HTTPprivado,recarga/reinicio yalmacenamiento PASS.
Incluyen transcodificación/decodificación real,720x1280,audio,duración,faststart,
cache,reutilización,Range206 yarchivo de exportación idéntico.
Sintaxis/diff PASS. Fuente real:12.895.862→2.302.947bytes,82%menos,
13,4s yexportación original intacta. Primera conversión tardó26,976s enCPUlimitada;
después se reutiliza. No confundir primera generación con velocidad de red.

Pendiente al escribir:despliegue,prueba HTTPS,navegador conrecarga yvista previa,
ycomparación de descargas. No afirmar solución universal de red/decodificación móvil.
