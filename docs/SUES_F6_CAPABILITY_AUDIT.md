# F6 · Auditoría de capacidades de Motion Library

Bloque aislado: no cambia el renderer, frontend, API ni producción.

`auditMotionCapabilities(catalog, RENDERED_MOTIONS)` compara el catálogo con los IDs realmente soportados por el renderer. Distingue `implemented` de `contract-only` y expone los bindings necesarios. Las capas de audio del catálogo se declaran `unbound-catalog-audio` hasta contar con una integración verificada; los SFX independientes no se ven afectados.

`listEligibleMotionAssets` devuelve únicamente candidatos permitidos por plantilla, motivo semántico explícito, duración mínima y bindings existentes. No toma decisiones de montaje ni crea eventos.

Comprobaciones locales: `node scripts/motions/audit_catalog.mjs` y `node --test tests/motion-capabilities.test.js`.

Pendiente: implementar los dos renderers genéricos, vincular el audio del catálogo y validar la composición con materiales reales. Este informe no acredita aceptación visual ni V1.