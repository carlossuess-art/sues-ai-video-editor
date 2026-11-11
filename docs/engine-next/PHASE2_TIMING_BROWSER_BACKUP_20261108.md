# 08/11/2026 · Fase 2 etapa 2.3: edición autenticada real + puerta de backup de Fase 1

**ESTADO: pruebas y código en PR #27, NO desplegado, NO fusionado.** El estudio público no ha sido modificado.

## Cambio real de la etapa 2.3
Se añadió `src/engine-next/clip-timing.js`, `tests/engine-next/clip-timing.test.js`, un endpoint protegido `POST /api/engine-next/clip-timing` en `src/editor-server.js`, y controles de inicio/duración en **fotogramas** para clips de texto en `web/engine-next.html/js`.

La operación actualiza el mismo documento autoritativo de FableCut. Requiere:
- Sesión SUES válida, cabecera `X-Sues-Request: editor` y control CAS con `expectedRevision`. Una petición obsoleta devuelve **409**, una sin la cabecera de protección devuelve **403**.
- `clipId` existente y desbloqueado de tipo `text`; rechaza vídeos, imagen, audio y clips bloqueados. Tiempo enteramente basado en fotogramas a **30 fps**, sin valores parciales ni salir de 0–9000 fotogramas.
- Clonación no destructiva del documento antes de modificarlo, sin eliminar medios/pistas/clips ni alterar el indicador `disabled`. No activa subtítulos sintéticos/revisión.
- El frontend guarda la revisión y recarga el estado; no se confunde guardado técnico con aprobación cinematográfica.

**Prueba integral de navegador REAL con proyecto FableCut REAL aislado:**
1. Copia aislada en puerto 7781 del proyecto B02 con **11 clips, siete pistas, V6 desactivada**.
2. SUES staging temporal con autenticación y sesión emitida por `/api/session`.
3. Chromium real carga `/engine-next.html`, encuentra y selecciona `sues_caption_word_0000`, muestra inspector de tiempos.
4. Cambia inicio de **300 a 302 frames** mediante la UI, guarda por el endpoint protegido; una nueva lectura de FableCut confirma persistencia y subtítulo todavía desactivado.
5. Un intento con la revisión antigua devuelve **409**; sin cabecera CSRF devuelve **403**. Se restaura el inicio original de 300 frames, revisión de proyecto pasa de **3 a 5**. Sin errores JavaScript visibles.
6. El primer ensayo había fallado porque el clon temporal todavía no tenía un ID de proyecto activo emitido en la cabecera `X-FableCut-Project`; tras inicializar el catálogo de proyectos privado, el CAS funciona. El código no elude ni relaja esta protección.

**Suite dirigida tras integración y commits concurrentes:** **73/73 pruebas PASS**. GitHub PR27 HEAD al final de esta tanda `2aa5171` (verificar antes de seguir; otros trabajos pueden escribir simultáneamente). Nota: 73 incluye cinco tests nuevos de backup aislado creados en la misma rama por otro proceso, no todos provienen de la operación de timing.

Evidencia del ensayo de edición: `/srv/sues-fablecut-next/data/qa/phase2-native-timing-20261108/` con manifiesto y documento final del clon, SHA256. Clon QA de ~139 MB eliminado tras guardar evidencia.

## Fase 1 · Backup crítico
La misma rama incorporó `src/engine-next/native-project-backup.js` y `tests/engine-next/native-project-backup.test.js`. El módulo realiza solo tres lecturas HTTP GET: proyecto antes, backup de proyecto+versiones y proyecto después. Rechaza incoherencias entre revisiones, versiones duplicadas, rutas no seguras y escritura parcial.

**Se ejecutó realmente contra FableCut persistente 127.0.0.1:7780**, guardando backup verificado de solo lectura en:
`/srv/sues-fablecut-next/data/qa/phase1-readonly-backup-20261108/`
Manifiesto: revision **53**, **6 clips**, **6 media**, **5 tracks**, **11 versiones**, 1080x1920, 30fps; backup **192.778 bytes**, SHA256 `2c5829dbfce5baa13fdd9b8d5a71ee524d05bc917ff96b06c59748aa28bf3c26`. Se comprobó original intacto: 6 clips, B02 desactivado. Servicios SUES público y FableCut privado HTTP 200.

**Límites críticos:** la copia contiene proyecto y versiones pero **NO los bytes de medios**. Tampoco se ha probado recuperar un sistema completo tras una pérdida. No declarar backup integral ni Fase 1 cerrada. Próxima prueba: copia de medios con integridad y restauración controlada EN UNA COPIA, nunca en persistente.

## Progreso de fase y puerta siguiente
- Fase 1 sigue **90% estimado** hasta backup completo con restauración y verificación de condiciones de producción. Se ha avanzado realmente el subpaso de snapshot de proyecto/versiones.
- Fase 2 pasa de **45 a aproximadamente 50% estimado** por demostrar una operación editable nueva desde navegador autenticado, persiste y recupera en el mismo FableCut, con CAS. **No** existe aún el editor multipista integral, operaciones de arrastre/trim/undo y export desde esa UI.
- Próxima tarea principal de Fase 2 etapa 2.3: más operaciones nativas con identidad de proyecto y seguridad, preferentemente selección y cambios en el timeline con persistencia/undo y estado compartido IA-humano. Continuar reutilizando FableCut completo y no reescribirlo.
- Próxima tarea crítica paralela Fase 1: backup íntegro del proyecto+medios y restauración en clon, prevención OOM y rollback. No retrasa el desarrollo de Fase 2.
- Fases 3–7 mantienen sus anteriores estimaciones 80%, 60%, 65%, 40%, 30%; no incrementarlas por esta prueba.
