# DOPAMIN · reparación y QA del maestro · 24/10/2026

Fuente inmutable: SHA256 `8d775bfab3d48b928adf86c730293b147bd77cc4ab6498bb4efe3760ca622005`, 68,6491 s. Se reutiliza el upload existente; las versiones anteriores no se modifican.

## Causas verificadas

El trabajo `cb62a001-14e7-48d5-ab66-fbf3f6fd8bb1` tenía 88 captions y ningún evento audiovisual. El vocabulario local no encontró candidatos; además, `buildAutomaticDirector` elimina sus decisiones con `full-frame-fit`, porque Whisper no aporta análisis de rostro. La receta tipográfica también depende de un vocabulario pequeño. Activar SFX solo sonoriza motions/transiciones que existan. Activar música/ganancia no selecciona archivos; la biblioteca instalada tenía 20 assets y ninguna pista musical. El endpoint de instrucciones devolvía una nota de música ausente pero permitía ejecutar.

## Cambios

- Comprobar el plan compilado antes de crear/encolar una versión: música, zooms, motions y SFX explícitamente solicitados deben existir. DOPAMIN sin ninguna intervención visual se identifica como captions-only y no se presenta como propuesta ejecutable.
- Instrucciones JSON admiten `framing` revisado visualmente y ligado al SHA del original, seguido de `zoom` con inicio, fin, escala y motivo. No hay nuevo modelo, proveedor ni seguimiento automático: el encuadre es una anotación conservadora y el ancla permanece fija.
- La región revisada pasa por las comprobaciones existentes de recorte, colisión, duración, B-roll, safe zones y presupuesto de cámara por cada fotograma. Los zooms explícitos inseguros fallan en lugar de desaparecer silenciosamente.
- En el modo revisado los captions de grupos cortos se colocan arriba y en línea, manteniendo Montserrat y jerarquía 14/12. No se altera la disposición de los perfiles sin esa anotación. La colocación de motion sigue condicionada a espacio libre; no se simula rotoscopia.

## Validación y límites

Base antes de cambios: 286/286 tests locales. Primera suite de reparación: 290/290; casos nuevos cubren reproducción del fallo, audio sin recurso, SHA equivocado, zoom sin encuadre, recorte inseguro y revisión atómica. Check/diff y nueva prueba audiovisual deben registrarse tras su ejecución.

La aceptación creativa corresponde a Carlos. F6/F7/F9 siguen abiertas, global oficial 48 %. No atribuir esta revisión manual al futuro Director IA autónomo. Ningún coste externo nuevo.

## Segunda revisión técnica

291/291 pruebas locales, `npm run check`, sintaxis frontend y `git diff --check` aprobados. Suite VPS Docker inicial 289/290: único fallo por Git no instalado en esa imagen; el caso pasa 1/1 en el anfitrión VPS. El código de producción aún se debe verificar tras despliegue.

Planes JSON admiten escenas `card` explícitas con el compositor existente, anunciando que cubren al presentador de forma intencional. El control global de zoom modifica o desactiva los acercamientos explícitos sin perder su motivo. La UI conserva encuadre/zooms, B-roll, overlays, voz, mastering y la tercera línea gráfica al ajustar otros campos. El reproductor diferencia versiones sin zooms/gráficos; service worker v20. Se refuerza la revisión de comandos dentro de planes externos y la prueba HTTP demuestra 422 sin nueva versión cuando falta música solicitada.

Primer plan privado del maestro preparado: cuatro ciclos de zoom, dos escenas gráficas, dos planos de apoyo, una capa de luz, tres transiciones, siete SFX y música propia derivada de 70s con ducking. No equivale a presencia audiovisual verificada hasta revisar su MP4; render en curso. Región/ancla revisadas manualmente, no detección automática ni máscara.

## Incidencia real de memoria y separación de pases

La primera iteración monolítica fue terminada por SIGKILL. El kernel del VPS confirmó un OOM de cgroup con ~1.035.864 KiB RSS; el contenedor de QA tenía 1 GiB, igual que el editor. No cuenta como MP4 final ni como PASS. Se conserva el log. El servicio web no se interrumpió.

Se añade render en dos pases a bundles nuevos: vídeo compuesto sin el grafo de audio; después mezcla de voz, música y SFX y mux con copia del vídeo codificado. Se limita la concurrencia de decodificadores y de la comprobación final. Los dos grafos adicionales entran en el digest del bundle. Los bundles antiguos conservan la ruta compatible; los originales nunca se sobrescriben. La nueva decodificación final usa `-xerror -err_detect explode`: no acepta un retorno 0 con errores de decodificación ignorados.

Prueba real nueva bajo RLIMIT_AS de 1 GiB: MP4 20s, voz 440Hz, música 250Hz y SFX privado 880Hz a los 14s; las tres componentes están presentes en audio decodificado, fuente intacta y dos pases registrados. 292/292 tests locales y check aprobados. Esto valida el mecanismo, no la calidad creativa del maestro; el replay real en VPS sigue pendiente.
