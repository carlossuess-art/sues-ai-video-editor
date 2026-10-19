# F6 · Preflight visual de Motion Library · 20/10/2026

Rama aislada: feat/f6-motion-eligibility-diagnostics-20261020.

El nuevo módulo `src/motion-preflight.js` envuelve la selección existente sin modificarla y añade diagnósticos de rechazo: duración superior a seis segundos y bindings dinámicos nulos, indefinidos o vacíos. Los IDs sólo son candidatos visuales; no se programan eventos ni se conectan SFX del catálogo. Las capas de audio no vinculadas generan aviso explícito.

Pruebas añadidas: `node --test tests/motion-preflight.test.js`. Pendiente ejecutar la suite completa y `npm run check` en un checkout con todas las dependencias. No se ha desplegado ni fusionado.

Límite conocido: todavía no valida todas las restricciones de texto y posicionamiento del renderer; el renderer sigue siendo la última autoridad y puede rechazar un candidato. No se debe llamar a este módulo Director IA ni declarar cerrada F6/V1.
