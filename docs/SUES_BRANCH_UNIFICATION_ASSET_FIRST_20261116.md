# SUES · Auditoría de ramas e integración Asset-First · 16/11/2026
Estado: código de desarrollo en la misma PR #27, no producción.

## Qué se unifica
La rama `feat/speech-linked-motion-grammar-20261115` desciende directamente de `feat/master-director-story-orchestration-20261104` (182 commits posteriores antes de este trabajo). GitHub devuelve 82 ramas. Las que son ancestros ya están contenidas, no requieren repetir merges. Se integra aquí el módulo privado Asset-First V1 desde VPS, la política de recursos, el puente en el selector existente y las pruebas. La rama PR27 debe actualizarse por fast-forward, sin crear otra rama ni cambiar `main`.

## Qué sigue divergente y por qué
No fusionar sin validación las ramas históricas con commits exclusivos: `feat/remotion-cta-poc-20261103` (13 commits), `fix/visual-double-audit-20261030` (15), `feat/automatic-matte-render-qa-20261025` (7), `feat/modnet-foreground-effects-20261025` (5), `fix/tracked-frame-duration-20261026` (13), `fix/literal-master-captions-20261026` (14), `feat/phase-8-editor-shell` (13), `feat/reel-158404-rev02-preflight-20261112` (1, otro Reel) y otras ramas de experimentos. Su divergencia NO acredita automáticamente función ausente; auditar diferencias específicas antes de cherry-pick. `feat/resource-library-style-presets-20261106` tenía un documento exclusivo sobre 19 GLB y 69 MOGRT: se archiva con advertencia de reglas antiguas.

## Evidencia y restricciones
Seis suites de motion/HTTP y dos de Asset-First: 33/33 PASS en VPS privado; sin generación automática ni gasto. Flujo existente `buildEditorNarrativeMotionReview` añade respuesta `assetFirst` solo lectura, con IDs de palabras reales, sin permiso de edición. Primero favoritos/biblioteca; después PNG/WebP con alfa verdadero si se aprueba recurso; gráficos procedurales por código cuando corresponda. `asset-first-v1.mjs` es adaptador de muestra V8, NO generador universal. FableCut privada: 14 clips editables, reemplazo de PNG/texto comprobado, export nativa de 2,93 segundos a 1080x1920/30fps; NO paridad artística completa. Falta sourceTimeMap, Montserrat, 3D de títulos, Reel completo y doble QA.

## Qué NO se toca
No fusionar a `main`, no publicar/desplegar ni reiniciar FableCut; conservar PWA local no registrada y archivos B05 no rastreados del worktree PR27. No eliminar ramas, directorios release-update, originales ni archivos Drive. Recuperar diferencias históricas solo con revisión por commit, pruebas y autorización.

## Continuidad
Roadmap https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit
Registro https://docs.google.com/document/d/1hLtUY7hlsvzod7S-GKLQC4bRqeImAxwKlE2G-Zljy_Y/edit
