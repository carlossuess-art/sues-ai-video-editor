# Reproducción y búfer · 24/10/2026

Carlos informa de paradas mientras la barra de carga intenta adelantarse a la reproducción.
No confundir espera de red con el render que produce el MP4.

Hallazgo: original y montaje tenían preload=auto simultáneo, incluso ocultos.
Se desmonta la fuente del reproductor oculto para detener sus peticiones; conserva
la URL lógica y el punto de reproducción al alternar. Sólo el visible precarga.
La descarga de exportación sigue apuntando al MP4 original del servidor.

Barra de búfer y segundos disponibles por delante, derivados de TimeRanges reales.
Botón «Cargar completo para verlo sin cortes»: descarga autenticada a memoria,
progreso y cancelación. Al terminar usa una URL blob local, conservando posición.
No guarda medios en Service Worker, disco, caché persistente ni servicios externos.
Límite128MiB y errores de descarga/longitud; cambiar proyecto cancela/revoca
la copia anterior. Cargar completo evita esperas de red después de la descarga;
no garantiza decodificación de formatos no soportados ni elimina fallos del dispositivo.

Pruebas:9/9 entre buffer, reproducción privada/Range, frontend y flujo vertical;
sintaxis y diff PASS. Muestras reales backend:1MiB en 0,015–0,100s según recurso
en loopback. No extrapolar esta velocidad a conexión móvil/Internet.
Navegador cloud abre login sin sesión privada; no se declara reproducción Android
ni escucha/aceptación estética. No se solicita intervención para pruebas de código.

Base instalada d3d6ecc. Cambios aislados en fix/playback-buffer-20261024.
Despliegue requiere backup verificado y postdeploy de HTML/helperJS/SW/Range.
Se conserva revisión estética DOPAMIN pendiente y progreso global48%.
Coste externo0; ningún nuevo render, ASR, proveedor, modelo o dependencia.
Roadmap Drive pendiente de sincronizar: métodos anunciados devolvieron Unknown tool.
