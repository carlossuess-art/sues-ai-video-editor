# Fase 6 · Preflight de acceso privado a medios · 22/10/2026

## Objetivo
Impedir que un nuevo despliegue parezca correcto por superar HTTP /health, aunque el usuario aislado de la aplicación no pueda leer los medios ni los índices privados.

## Qué cambia
- Archivo `scripts/deploy/library_access_preflight.py`: auditoría **solo lectura**, sin chmod, chown, copias ni modificación de datos. Analiza exclusivamente `editor/jobs/assets` y `editor/jobs/library` del proyecto ya instalado.
- Verifica permisos de lectura/ejecución según UID/GID del runtime (1000:1000), además de rechazar entradas especiales o enlaces simbólicos.
- Devuelve número de entradas comprobadas y bloqueadas por área, sin exponer nombres de recursos, tokens ni URLs.
- `scripts/deploy/update_service.py` ejecuta `assert_library_readable` **después de comprobar la cola** y **antes de descargar o detener el contenedor**. Si detecta biblioteca no accesible, aborta sin modificar producción.
- Las sugerencias semánticas del Director solo devuelven tipos `video`, `overlay`, `image`: los motions nativos no se interpretan como medios de B-roll.

## Lectura verificada del VPS real
Comprobación sin cambios en archivos: UID/GID esperado 1000:1000, 62 entradas verificadas en assets (21 bloqueadas), 9 en índices (9 bloqueadas); **30 accesos bloqueados sobre 71 entradas**. La ruta /api/assets no funciona hasta corregir la propiedad de forma autorizada y segura. No se ha intentado resolver mediante permisos públicos ni otros conectores.

## QA
Prueba JavaScript de auditoría en entorno temporal: detecta una biblioteca sana, usuario ajeno, media inaccesible, biblioteca ausente y enlaces simbólicos; confirma `changesMade:false`.
Prueba del Director: recursos `native-motion` y `audio/sfx` no aparecen como vídeo recomendado.
Compilar Python y `node scripts/check.mjs` para validar cambios.
Bloqueo existente: **no desplegar esta rama hasta recuperar permisos de lectura** y comprobar endpoints de biblioteca con sesión.

**Siguiente acción exacta:** operación autorizada del administrador que restituya la propiedad original esperada sin abrir permisos, ejecutar auditoría hasta `ready:true`, verificar API media/catálogo y render real; después continuar integración del Director, QA creativa DOPAMIN y aceptación F9. No alterar porcentajes oficiales por este control preventivo.

## Optimización del Director e interfaz de revisión

`loadPrivateLibraryIndex` valida y carga las dos fuentes privadas una sola vez por petición del Director y reutiliza el objeto validado al puntuar todas las frases. El endpoint de búsqueda manual conserva la interfaz original y continúa leyendo su índice normalmente. Una prueba vacía el directorio después de cargar el índice para comprobar que las búsquedas sucesivas utilizan el snapshot ya validado.

Las sugerencias del Director solo aceptan kinds `video`, `overlay` e `image`; ni los sonidos ni los `native-motion` pueden presentarse como material visual de B-roll. La elección todavía requiere evaluación de derechos, narrativa, safe zones y calidad de imagen.

Interfaz mínima: sección desplegable «Recursos visuales sugeridos para tus frases» dentro de Edición automática, disponible solo con proyecto seleccionado. Botón «Buscar recursos relacionados» llama al endpoint privado `/api/jobs/:id/library-cues`, muestra intervalos, citas y candidatos usando `textContent`; no tiene CTA de autoaplicar recursos ni construye media links privados. La sección queda oculta en el flujo de plan externo. En producción actual fallaría por bloqueo conocido de permisos; **no desplegar hasta QA del índice y medios con UID1000**.

Ensayo de vocabulario contra índice real (solo lectura, fuera de la app): «opresión» → cadena/reloj; «transformación» → sendero/amanecer y chispas como alternativa; «revelación» → chispas/otros recursos relacionados, todas con estado `review-required` y `approvedToAutoPublish:false`. No es evaluación de coherencia narrativa real ni validación de máscaras.
