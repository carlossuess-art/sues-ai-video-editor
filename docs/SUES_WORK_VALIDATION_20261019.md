# Auditoría e integración Work · 19/10/2026

Rama auditada: `feat/reference-editor-ui-20261019`, recibida en
`aa6e7c246a8de811ac2329d87936e9e84f091e9e`. Base oficial comprobada:
`fd168dd2b7ff5817be89ee28d8e654e792002fab`. No había commits posteriores en
ninguna de ambas ramas. El Roadmap contiene además una rama distinta
`feat/phase-8-editor-shell`; sus contratos Music Journey/IA no se mezclan con
este frontend ni se presentan como funcionalidades ejecutadas.

## Cambios de la auditoría

- Reproductor permanente y estética noche/cian del frontend recibido.
- Timeline con tiempos reales, transporte, seek, captions del montaje vigente
  y atajos que respetan la escritura y los controles nativos.
- Iconos con etiquetas y accesos independientes a Vídeo, Estilo, Texto, Música,
  SFX e Imágenes, reutilizando los ajustes existentes.
- Más espacio móvil para el vídeo; accesos repetidos del timeline se ocultan
  en móvil. Herramientas inferiores con desplazamiento independiente.
- Seleccionar una frase limpia la búsqueda, abre su editor y enfoca el texto
  sin desplazar la página ni perder el reproductor.
- PREVIEW_READY ahora dice «Listo para previsualizar»; no invita a exportar
  antes de crear la vista previa. Shell PWA v10.
- No cambia el renderer, las recetas, los originales ni las dependencias.

## Evidencias y reproducción

Resultados finales: 24 combinaciones CALMA/DOPAMIN × seis formatos × dos tamaños
PASS; guardar/recargar/deshacer/duplicar y copia/recuperación por UI PASS.
Player completo en ambos tamaños PASS, incluidos tres renders reales de 24 s
(dos de escritorio para comprobar nueva versión y uno móvil), decode y original
intacto. Exportaciones de ambos tamaños SHA256
`ef6403e1c136e4649d66bfc3259926040cf0429222b1e94e4c8afe6caf754238`,
sin aumentar intento al descargar. Timeline/teclado/selección/edición/deshacer y
reproductor visible PASS en ambos tamaños, sin errores JS ni overflow horizontal.
Cambio de estilo/agrupación conserva texto previo para Deshacer y ELEMENTS PASS.

Pruebas Node: 211 PASS. `npm run check`, Python compile y `git diff --check` PASS.
Pruebas Python de despliegue: 7 del actualizador y 5 históricas de HTTPS PASS;
Docker/red remotos están simulados en ellas. No son operaciones en Hostinger.

Chromium oficial 145.0.7632.6 con Playwright opcional instalado en Work:
1440×1000 y 393×852. La fuente es un vídeo sintético de 24 s con tono tenue,
con rótulos QA explícitos y tiempos de fixture. No hay transcripción inferida,
nuevos modelos ni llamadas de pago. Los renders usan FFmpeg real, no el worker
simulado de los tests unitarios.

Scripts reproducibles, sin instalar herramientas QA en producción:

```sh
node scripts/app/smoke_browser_real.mjs CONFIG NUEVO_DIRECTORIO
node scripts/app/smoke_player_grouping.mjs CONFIG NUEVO_DIRECTORIO
node scripts/app/smoke_player_workflow.mjs CONFIG ORIGINAL NUEVO_DIRECTORIO
```

Requieren `SUES_PLAYWRIGHT_MODULE` y `SUES_CHROMIUM_PATH`. El último incluye
`verify_reference_timeline.mjs` y comprueba transporte, scrub, selección de
frases, escritura segura, deshacer, visibilidad y exportación sin segundo render.
`SUES_BROWSER_SKIP_RENDER=1` sólo omite el render del primer script; el script
player genera sus propias vistas previas completas. Evidencias sanitizadas:
`examples/preview/reference-work-*.json`. Medios, tokens y capturas QA quedan
fuera de Git. Los fallos iniciales de preparación (permiso de binario y SHA
omitido en fixture) no se contabilizan como ejecuciones satisfactorias. Un
fallo posterior del harness al abrir cámara desde Texto se corrigió navegando
explícitamente a Estilo. La prueba móvil detectó después una regresión de la
compactación: ocultaba el contenedor de captions además de los accesos duplicados.
Se corrigió ocultando sólo las filas informativas y conservando los segmentos
interactivos. Las ejecuciones fallidas no se presentan como PASS.

## Despliegue: condición pendiente por acceso

Web real abierta por HTTPS: `https://editor.suesholistics.com/`.
Muestra «Session required»; no hay sesión compartida con el móvil de Carlos.
No se accedió a trabajos privados, no se ha comprobado el commit instalado y
no se ha ejecutado esta release en VPS. «Instalado» de Carlos acredita su reporte
sobre la entrega anterior fd168dd2; no valida esta nueva interfaz remotamente.

Inventario disponible: cero herramientas Hostinger VPS expuestas, cero dispositivos
Desktop Commander conectados y ningún archivo de clave/configuración SSH en
`/root/.ssh`. No se han pedido contraseñas ni leído enlaces secretos. No hay una
vía autorizada operativa para inspeccionar Docker, ejecutar backup o actualizar.

El actualizador existente se ha auditado y reforzado. SHA256 nuevo:
`52d5c6b8d68a8da6cb2d36b3f29d5d08198c80d1b5c119db836939149da37524`.
El checksum histórico 903881… corresponde a releases anteriores.

Procedimiento autorizado para cuando haya acceso:

1. Inventariar sólo editor, commit, mounts, imagen, espacio y estado de cola.
2. Usar `python3 scripts/deploy/update_service.py COMMIT40_VERIFICADO` desde la
   release exacta publicada, tras comprobar el SHA del actualizador.
3. El script comprueba salud/sesión, ausencia de renders/cola/guardado/copias,
   mismo lock de dependencias y doctor con el runtime existente.
4. Para exclusivamente el editor. Crea `update-backup-FECHA/editor-state.tar`,
   conserva propietarios/permisos, verifica los bytes de cada archivo contra
   el estado detenido y escribe `editor-state.manifest.json` con hashes y SHA
   de archivo TAR. Rechaza enlaces, tipos especiales o espacio insuficiente.
5. Sólo tras verificar copia renombra el contenedor anterior, crea el nuevo con
   imagen/mounts existentes y comprueba salud, API privada y HTTPS. No hace pull,
   build ni instala dependencias. Fallar en backup reinicia el editor anterior.
6. Conserva `editor-inspect.json`, `previous-commit.txt`, `editor-container.txt`
   y contenedor anterior. Ante fallo de arranque revierte automáticamente.
7. Para rollback posterior: comprobar que no hay trabajos activos; parar y
   renombrar el editor nuevo a un nombre único conservándolo; renombrar el
   contenedor indicado por `editor-container.txt` a `sues-video-editor` y arrancarlo.
   Verificar salud/HTTPS y actualizar los marcadores de commit/release desde
   la copia. El estado comparte contrato y no se restaura ciegamente el TAR.
   Si se necesita recuperación de datos, verificar su hash y extraer primero
   a otro directorio privado; nunca sobrescribir los originales en caliente.
8. Validar en producción proyectos anteriores, subida, original, plantillas,
   preview, ajuste/nueva versión, exportación SHA idéntica y responsive.

No se modifica WhatsApp, WAC, Caddy, DNS o servicios ajenos. No hay backup ni
rollback remoto ejecutados en esta misión. No afirmar V1 ni aceptación visual.

## Continuidad

F8 frontend con QA local; F9/10 remota y aceptación pendientes. F6 sigue abierta.
No recalcular porcentajes por número de tests. La integración usa PR con merge
reversible a `feat/phase-4-vision-camera`; el SHA final se registra en el Roadmap.
La siguiente acción depende de un acceso administrativo operativo al VPS y de la
sesión privada del editor en el navegador de revisión. No existe herramienta para
enviar el informe a otro chat: el informe se entrega en Work.
