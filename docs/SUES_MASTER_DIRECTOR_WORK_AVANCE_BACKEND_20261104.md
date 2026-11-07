# SUES MASTER DIRECTOR · integración parcial en desarrollo · 04/11/2026

Base: rama feat/master-director-story-orchestration-20261104, commit inicial 7542983c2372edba4af1efddc5f4559564263491. Las reglas aprobadas 20261104 siguen siendo la fuente. Esto NO es integración terminada, despliegue ni autorización para gastar/publicar.

## Implementado en esta iteración

- `master-director-project-store.js`: historias inmutables identificadas por SHA, comprobación de integridad, revisión usando únicamente contexto suministrado por el servidor, decisiones explícitas vinculadas al plan y a la huella actual del proyecto y estructura de capas inmutable vinculada a la decisión. Al modificar el proyecto, bloquea revisión/decisiones/capas antiguas.
- Rutas autenticadas `master-draft`, `master-review`, `master-decision` y `master-layers` en el servidor existente. La sesión y la protección de cabeceras ya existentes se aplican a todas. Nunca acepta registro, permisos, evidencia o política desde el navegador. El proveedor `masterDirectorContext` es exclusivamente una inyección en el arranque del servidor. **No existe aún un proveedor productivo de confianza:** sin él, revisión, aprobación y capas se bloquean. La prueba positiva usa un proveedor sintético solo en pruebas.
- Compilador experimental `master-director-remotion-compiler.js` con salida restringida a capas de texto de geometría precisa, fuente verificada por el servidor y keyframes lineales. Rechaza operaciones, máscaras, parámetros y curvas que no comprende. `MasterDirectorText.tsx` es una composición Remotion de prueba. No conecta todavía la salida a un render completo ni conserva fuentes registradas en navegador, máscaras, sonido ni render de medios. No presenta MP4 como editable.
- Se conserva y versiona una representación de capas. No existe aún editor visual de estas capas, incorporación al sistema de recuperación, ni control en UI. La decisión guardada no inicia render, no ejecuta acciones ni consume saldo.

## Validación realizada

- 107/107 pruebas Node: suite de director, importación, adaptador creativo y servidor; ejecutadas sobre una copia aislada de los archivos productivos y un parche selectivo aplicado a `editor-server.js`. El servidor de esta rama es más antiguo que el productivo, por lo que no debe copiarse entero ni fusionarse sin reconciliación.
- Las nuevas pruebas incluyen autenticación, ataque por datos de confianza en petición, revisiones, aprobación y bloqueo ante cambio de proyecto. El contexto positivo es sintético, no el registro real.
- TypeScript de Remotion PASS; fotograma sintético 30 renderizado por Remotion (1080x1920), píxeles blancos detectados en límites 217,418–496,493. Esto no acredita aún tipografía de marca, composición real, vídeo, audio ni QA de máscaras.
- Sin cambios en producción ni despliegue; sin servicios de pago, publicación o modificación de skill.

## Siguiente trabajo preciso

1. Implementar proveedor real de contexto del servidor con reglas versionadas verificadas, hash efectivo de masters, licencia y localización reales, capacidades reales, transcripción/fotogramas y time map. Enlazar registros a identidad autenticada, con protección contra manipulación de archivos y invalidación de decisiones al cambiar cualquier evidencia, fuente o versión.
2. Completar revisión y aprobación accesible desde la interfaz, edición reversible de las capas individuales y recuperación de versiones con pruebas de ida/vuelta. No afirmar que JSON persistido es UI editable.
3. Conectar compositor y render Remotion de forma fiel: medios locales verificados, enmascarado y oclusión real, geometría, fuentes cargadas, keyframes, subtítulos, voz y audio. Adaptador de texto actual es prueba limitada: no es motor integral. Rechazar cualquier operación sin soporte y proteger originales.
4. Integrar caminos nativo/Remotion, ejecución supervisada/autónoma con aprobación y límites reales; no renderizar por ausencia de respuesta. Asegurar que aprobación queda ligada también a la evidencia y al resultado final.
5. Regresión sobre la base productiva real (incluidos render, recuperación, móvil y proyectos anteriores), E2E sobre 158404 sin coste, escucha y examen de fotogramas reales, dos auditorías completas independientes consecutivas; decisión creativa de Carlos. No desplegar sin su autorización.
6. Tras estabilizar el contrato real, preparar informe para volver al chat normal y adaptar la skill SUES AI Film Director.
