# Revisión previa a publicación · 17/10/2026

Carlos autoriza hacer público el código de sues-ai-video-editor para eliminar la
autenticación de las descargas del VPS. Acepta que otros copien el código y conozcan
su origen. No se añade una licencia nueva ni se modifica el control de acceso de
la aplicación, del VPS, de Drive o de Supabase.

## Alcance y resultado

- 10 ramas,92commits únicos y91árboles inspeccionados medianteGitHub.
- 301blobs únicos,1.574.928bytes dehistoria alcanzable desde esas ramas leídos sin
  errores. Análisis de claves privadas, tokensGitHub/OpenAI, JWT, credencialesAWS,
  URLs concredenciales, asignaciones de secretos yURLsfirmadas.
- No se detectan credenciales reales con esos patrones. No hay archivos .env
  reales, bases dedatos, claves privadas ni mediosMP4/audio en esa historia.
  .env.example sólo contiene nombre devariable sin valor.
- Únicas coincidencias: ejemplo deURLfirmadaAWS en vendor/shotstack-edit.openapi.json,
  con Expiresepoch1672819007 (2023), de la especificación vendorizada deShotstack.
  No es una credencial del usuario ni un permiso de carga vigente.
- GitHubActions:0ejecuciones segúnAPI, sin historial de logs por exponer.
- Existen documentación operativa, nombres deproyecto, referencias aarchivosDrive,
  metadatos de análisis y datos deejemplo. No se cambia permiso de los archivosDrive
  enlazados. El usuario acepta la copia delcódigo y su origen.

Esto es una revisión por patrones del alcance indicado, no una garantía de ausencia
de vulnerabilidades. No se han inspeccionado referencias fuera delas10ramas ni
objetos no alcanzables. No se reescribe/borrala historia ni se repiten inferencias.

## Publicación y descarga

El conectorGitHub no ofrece cambio de visibilidad. Se usa su navegador de ajustes,
con sesión de carlossuess-art observada. GitHub solicitó reautenticaciónsudo y el
usuario eligió/aprobó GitHubMobile mediantebrowserAuth seguro, sin contraseñas/OTPs
enchat. LaUI confirma «This repository is currently public» yAPIprivate=false,
visibility=public. DescargaHTTPS anónima del script ySHA256 comprobados.

Al ser público, el VPS puede descargar prepare-source.sh del commit fijo
f603380ac917cc85e2eb34ae7f595774f4e1eb57 víaHTTPS, validar suSHA256 y ejecutarlo con
nohup. Ese script descarga el snapshot fijadoeb441c712c9a6edd07c0d41b344adfdf0275c95d
y ejecuta npmci/check/tests limitados. start-public-source.sh automatiza esa
descarga/verificación, sin auth. No hace falta loginGitHub enVPS. El binariogh
ya descargado puede permanecer sin autorizar; no se elimina nada del servidor.

La publicación por sí sola no arranca app, no abre puertos ni otorga escritura a
visitantes. F5sigue80%, global48%. Ejecución VPS fuente/servicio/HTTPS pendientes.
