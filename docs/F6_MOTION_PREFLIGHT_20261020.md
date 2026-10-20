# F6 · Preflight visual de Motion Library · 20/10/2026

Rama de revisión: feat/f6-renderer-text-preflight-20261020, derivada de feat/f6-motion-preflight-clean-20261020. Sin fusión ni despliegue.

El módulo src/motion-preflight.js inspecciona candidatos visuales antes de renderizar, sin programar eventos ni conectar SFX. Conserva la duración máxima de seis segundos y rechaza bindings nulos o vacíos. También anticipa restricciones existentes de src/semantic-render.js: número de badge entre 1 y 99, texto visible de hasta 52 caracteres, sin caracteres de control, palabras de hasta 26 caracteres y salto válido en un máximo de dos líneas de 26 caracteres. No modifica el renderer.

Pruebas añadidas: tests/motion-preflight-renderer.test.js (cinco casos de borde). Verificación aislada local con doble del selector de catálogo: 5/5 PASS y node --check PASS. Esta verificación NO equivale a ejecutar el test integrado sobre el repositorio ni acredita npm test, npm run check, Chromium, FFmpeg o exportación real. La prueba integrada queda preparada en GitHub, pendiente de runner con checkout y dependencias.

El renderer sigue siendo la autoridad final: falta verificar posicionamiento, colisiones con rostro, B-roll, bookends y disponibilidad real de recursos. Las capas de audio del catálogo siguen sin vincularse. Los dos recursos contract-only continúan sin renderer. No declarar Director IA, F6 completa ni V1.

Siguiente acción exacta en un checkout con acceso: npm ci --ignore-scripts --no-audit --no-fund; npm test; npm run check; node scripts/motions/audit_catalog.mjs. Después, revisión de diff y PR borrador sin fusionar.
