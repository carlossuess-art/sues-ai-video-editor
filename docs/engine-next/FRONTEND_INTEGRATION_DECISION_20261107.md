# SUES Engine Next — decisión de frontend (07/11/2026)

Estado: DECISIÓN ARQUITECTÓNICA; aún no implementado ni desplegado.

## Reutilización
- Reutilizar el Studio NLE de FableCut 1.18.0 (MIT, repositorio ronak-create/FableCut, commit fijado en el POC), incluido visor, timeline multipista, operaciones de clips, API/MCP y control de revisiones, como base del nuevo frontend SUES.
- Conservar identidad visual SUES y funciones de la aplicación previa mediante una adaptación mantenible, no dos timelines ni dos proyectos distintos.
- HyperFrames (Apache 2.0) es un motor complementario de motion 2.5D/3D: su salida con alpha y el manifiesto de origen se registrarán como media/capas editables en el mismo timeline. No incrustar una segunda UI de edición completa.
- SUES MASTER DIRECTOR edita mediante los mismos comandos transaccionales que usa la interfaz, con revision/CAS, historial undo y recuperación de errores.

## Distribución objetivo
Visor del frame compuesto arriba/centro; timeline FableCut debajo; biblioteca de medios/capas y composiciones a la izquierda; inspector de posición, máscaras, curvas, tipografía y audio a la derecha; panel de conversación y decisiones del Master Director colapsable.

## Gates innegociables
1. Aislamiento de dependencias y seguridad del editor web: autenticación, protección del almacenamiento, CSP/origen, API/MCP sin exposición pública por defecto.
2. Un único proyecto real 158404 editado por UI y MCP; conflicto de revisión rechazado sin mutaciones.
3. Máscara temporal continua en primer B-roll y niño/grupo visibles, GIF delante con alpha, subtítulos palabra-a-palabra bajo barbilla y título no anticipatorio.
4. HyperFrames: demostrar render 3D genuino con alpha y fuente editable en el timeline, no solo vídeo/imagen aplanada que no se puede revisar.
5. Mismo compositor y coordenadas para preview y export 1080x1920, QA fotograma/audio y aceptación creativa, sin equivaler a suite de tests automatizados.
6. Backups, feature flag, pruebas de regresión y rollback antes de sustituir el frontend productivo; no eliminar funciones ni archivos legados prematuramente.

## Restricciones actuales verificadas
VPS de 3.8 GiB RAM sin swap y 3.9 GiB libres en / (07/11). FableCut corriendo en loopback 127.0.0.1:7779. HyperFrames descargado en /tmp/sues-engine-research-20261107-round2/HyperFrames, todavía sin adaptador/render validado. No instalar Chromium/Bun ni dependencias voluminosas hasta establecer presupuesto de disco/RAM y estrategia de aislamiento.

## Acción siguiente de implementación
Revisar DOM/API de FableCut, aislar UI bajo la autenticación SUES en staging, implementar adaptador persistente de proyectos, importar composición sintética y verificar equivalencia preview/export. Luego puente HyperFrames, matte y operaciones 158404. Esta decisión no significa que los pasos estén completados.