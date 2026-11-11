# SUES Engine Next · trabajo de integración reversible

El motor actual no se ha sustituido todavía. Este paquete inicia su reconstrucción en la rama del PR 27, sin tocar el entorno de producción.

- `src/engine-next/engine-capabilities.js`: manifiesto de candidatos FableCut (MIT), HyperFrames (Apache 2), FireRed (Apache 2); ledger que no descarta operaciones originales.
- `tests/engine-next/engine-capabilities.test.js`: contrato de conservación, dependencias, IDs, tracks y bloqueos.
- `REEL_158404_ENGINE_GAP_LEDGER.json`: análisis automático de las 49 operaciones originales en siete escenas. Ninguna está declarada como render aprobable.
- `scripts/engine-next/prepare-fablecut-poc.mjs`: genera proyecto nativo FableCut de prueba con SHA de bruto y voz originales, B02 y GIF desactivados hasta verificar matte/alpha. El prototipo se almacena en scratch, nunca en Git.

Una demo que decodifique o pase tests no significa que tenga calidad cinematográfica. Falta integración de todo el contrato, inspección de compositor, HyperFrames source-editable, seguridad y prueba 1080x1920 del Reel. Véase el plan maestro de integración en docs/.