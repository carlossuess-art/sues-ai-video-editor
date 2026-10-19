> Estado histórico: el19/10 Carlos pidió después reproductor persistente y
> previsualización antes de exportar. Prevalece SUES_PLAYER_PREVIEW_EXPORT.md.

# Recorrido de edición · 19/10/2026

Carlos pide una experiencia clara y de alto nivel, después de no poder encontrar
los controles en el panel móvil. Plegar el panel reduce altura, pero no define qué
hacer ni en qué orden. La unidad de diseño pasa a ser la tarea del usuario.

## Flujo implementado

| Paso | Decisión del usuario | Acción principal |
| --- | --- | --- |
| Material | Qué vídeo o proyecto usar | Continuar con este material; subir si no hay uno preparado |
| Edición | Qué ritmo y estructura quiere | Generar vídeo |
| Resultado | Comprobar y conservar la exportación | Reproducir y descargar el MP4 |

Sólo se muestra el panel del paso activo. Tras preparar/recuperar un montaje,
se abre Edición. Generar guarda los ajustes y abre Resultado con el progreso real.
Un trabajo ya terminado se abre en Resultado; crear otra versión lleva a Edición.
Los pasos son botones nativos con `aria-current`; permanecen accesibles al navegar.
Marca, plantillas y biblioteca quedan en Opciones del estudio.

En Edición aparecen primero estilo y estructura. CALMA y DOPAMIN son las opciones
principales; los preajustes heredados se conservan en su grupo. Los valores internos
de ELEMENTS no cambian, pero se muestran etiquetas comprensibles en español.
El texto de ayuda estructural sólo aparece si se elige una estructura.

Recursos/cámara, imágenes, sonido y subtítulos se abren bajo demanda. Los subtítulos
tienen resumen de tiempo y frase; el buscador filtra sobre el texto editado y muestra
también el estado sin resultados. Las entradas ocultas siguen guardándose.

Cambiar de paso conserva las entradas sin guardar. Guardar confirma su estado;
editar avisa de cambios pendientes. Buscar no marca el montaje como modificado.
En móvil, Generar vídeo permanece a mano en la barra inferior. Guardar/deshacer
son acciones secundarias. Se conserva la versión previa al duplicar un trabajo.

## Alcance y evidencia

La interfaz reutiliza los mismos endpoints, motor, contratos y controles. No añade
inferencias, prompts, dependencias de producción o servicios de pago. No promete
previsualización instantánea: el vídeo aparece después de la exportación real.
Los vídeos nuevos siguen requiriendo su análisis; la UI comunica esa limitación.
No cambia la composición visual que Carlos aceptó ni las fuentes del renderer.

Chromium 145 valida 24 combinaciones dispositivo/estilo/estructura con guardado,
recarga, copia/recuperación y exportación. La prueba de navegación comprueba una
tarea visible, conservación de texto sin guardar, búsqueda y estado vacío, búsqueda
sin cambios falsos, navegación por teclado y ausencia de desbordamiento horizontal.
Incluye una exportación real activada desde el nuevo botón principal y llegada
automática a Resultado con descarga disponible. Ver evidencia JSON en examples/preview.

209 tests del repositorio y comprobaciones de sintaxis. El comportamiento técnico
verificado no sustituye una prueba de usabilidad con Carlos. Quedan por medir el
tiempo hasta la primera exportación y los errores de búsqueda durante su uso real.
No se atribuye al diseño una mejora porcentual sin medirla.

Comprobaciones opcionales con navegador local existente:

```sh
SUES_PLAYWRIGHT_MODULE=/ruta/playwright/index.mjs \
SUES_CHROMIUM_PATH=/ruta/chrome-headless-shell \
SUES_UX_RENDER=1 node scripts/app/smoke_ux_navigation.mjs PROYECTO.json NUEVA_SALIDA_PRIVADA
```

Las capturas, copias y vídeos de las pruebas permanecen fuera de Git. Las nuevas
pantallas necesitan actualización del editor en el VPS; comprobar la versión
instalada antes de afirmar que Carlos ya las está viendo.
