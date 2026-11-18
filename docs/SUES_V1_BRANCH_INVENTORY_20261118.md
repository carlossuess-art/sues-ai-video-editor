# SUES AI VIDEO EDITOR — Inventario de ramas V1

18/11/2026. Corte contra `4b0a974079b6a687dd608d7d08574698d753b9b5` de la PR #27. 82 ramas remotas y 17 PR abiertas. El inventario usa el grafo Git completo.

| Grupo | Ramas | Acción |
|---|---:|---|
| Canónica | 1 | Única línea de integración V1. |
| Retirables | 41 | Historial alcanzable desde la PR #27. Retirar cuando haya acceso de borrado, tras comprobar SHA, PR y referencias operativas al momento de actuar. |
| Protegidas | 25 | Mantener ramas de PR abiertas, rama predeterminada y referencias de producción/QA/rollback. |
| Divergentes restantes | 15 | Conservar las puntas. Inspección dirigida si un punto de la V1 depende de sus cambios exclusivos. |

Las 49 ramas históricas ya contenidas incluyen ocho protegidas. La documentación de biblioteca de la PR #28 ya está conservada como referencia histórica en PR #27. Su PR y rama siguen abiertas. Los cambios locales B05 del VPS quedan fuera de la retirada. No se ha eliminado ninguna rama durante este inventario.

Antes de retirar: verificar que la punta indicada sigue siendo ancestro de la rama canónica, que no es origen ni destino de una PR abierta y que no hay dependencia en producción, rollback, automatización o worktree activo. Los SHA registrados permiten recuperar el nombre de las ramas retirables desde el historial canónico. Si una comprobación cambia, conservar esa rama y registrar el motivo.

| Rama | SHA para recuperar la referencia | Commits exclusivos | Grupo | Motivo |
|---|---|---:|---|---|
| `feat/automatic-matte-render-qa-20261025` | `262d373c8ffb4417bd75d53c84b863092d892ee8` | 7 | protegida | Origen o destino de una PR abierta |
| `feat/autonomous-video-flow-20261025` | `00bc9be663311f5c0db5fdefca455ad3d0105459` | 5 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/brain-subject-composition-20261027` | `b140acc1ee5a0d6a487bb11c011e2eacabc74f05` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/camera-trajectory-study-20261025` | `40c840b8c6dede0f09e1594e087c8bc9e53ccf6c` | 4 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/cinematic-voice-presets-20261021` | `5e1043f1f1cbe4df3102b955c299b794ce5545f1` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/compact-editor-controls` | `cc6b5e04f5d745d03efa92ee67a1e160cd16431b` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/composable-editing-profiles` | `0d857ac2221dff5d8366e6eb203a6e1576d8849c` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/continuation-e2e-validation-20261025` | `5da6b278b827daecdd2558acbf32c8ec57d99d02` | 11 | protegida | Origen o destino de una PR abierta |
| `feat/director-transparency-20261027` | `3396fef06e6bc84bd00345f182b6f4b71add2ef1` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/dopamin-broll-conflict-resolve-20261024` | `0ec7caa5ac249d8113aa256e643cc99bdd0ba01d` | 7 | protegida | Origen o destino de una PR abierta |
| `feat/dopamin-broll-review-link-20261024` | `f52e9a56dca3ce7aa77645500e2915945e7ad998` | 1 | protegida | Origen o destino de una PR abierta |
| `feat/dopamin-context-review-20261024` | `32b65b4d8ae3d93f994bb1cf0af1821819c0af87` | 0 | protegida | Origen o destino de una PR abierta |
| `feat/dopamin-master-20261024` | `d600f3275383d6857b9cf1048c7ba546b50e2e7d` | 1 | protegida | Origen o destino de una PR abierta |
| `feat/dopamin-narrative-scenes-20261024` | `be9629860469818b2bb7b3073eb0855beb79d3ca` | 1 | protegida | Origen o destino de una PR abierta |
| `feat/dopamin-temporal-scene-qa-20261024` | `7b60937f25ec05ff9bdb4412394e9d6e0b77b94a` | 1 | protegida | Origen o destino de una PR abierta |
| `feat/dopamin-visual-refine-20261024` | `254390f10b77a615002714448d79b9379171d6e5` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/dual-cloud-director-20261025` | `3256d1bb82091fc92d4abd3e89abe9976cff1f12` | 12 | protegida | Origen o destino de una PR abierta |
| `feat/dynamic-recipe-and-edit-flow-20261021` | `73d673bf7c67079ee6900916f2e0f12841cf5ab7` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/editor-email-login-20261020` | `bb3a87f449ca2a129ea26563eed38bca03906db9` | 2 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/external-edit-plan-20261020` | `9febcdfbf2d9f641a455af958a7d1970d47298b5` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/external-motions-20261021` | `d30023f664aef3ad483fac89913a132be2925013` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/f6-motion-capability-audit-20261020` | `0ea33b82addbf22cd82d035f76989c30f2800d35` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/f6-motion-eligibility-diagnostics-20261020` | `f55d39473e474436a521492769a2c17a39e2b2c3` | 2 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/f6-motion-preflight-clean-20261020` | `b26894702ed1bf5d2c31a77b2a27d28206e16f62` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/f6-motion-preflight-verified-20261020` | `e0ceb6a5ad571f86ae3f266dfefbb7d33eee9825` | 3 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/f6-motion-timeline-guard-20261020` | `3aaf56b3cb45597313c8a4b47098507fcdc103e8` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/f6-renderer-text-preflight-20261020` | `3aaf56b3cb45597313c8a4b47098507fcdc103e8` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/film-director-audit-integration-20261025` | `e4904a2b7c5a1b0a9af79768f5eeb2cefe323a22` | 3 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/full-private-library-20261025` | `3befef3d33bf15ec90522f3affe9e780190e6788` | 0 | protegida | Origen o destino de una PR abierta |
| `feat/gemini-live-editor-20261026` | `e730c0b9a8b91b315488c91c171b3c0fc984a7a4` | 0 | protegida | Origen o destino de una PR abierta |
| `feat/heygen-avatar-api-v0-20261029` | `71ae5c9f172aa3316f702b4797cdbf45dbf465b4` | 13 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/library-ambient-overlays-mastering-20261021` | `051edfb74296592161f526b434872df1ffd56a4a` | 0 | protegida | Release histórico y base de PR abierta |
| `feat/library-demand-20261026` | `01a4884f0c68135bf3bee71718d190dde11598c2` | 1 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/library-video-assets-20261021` | `04f3dfefb0d1f97cb81152478e53bb6e48fbd214` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/live-mobile-preview-20261029` | `047b26fc9bdc13530e75f748e1deae27224cf113` | 0 | protegida | Referencia de QA móvil anterior |
| `feat/local-whisper-intake-20261020` | `a75c76f6612e7720724b39c90a40525555e17a14` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/master-director-gate-20261104` | `91b995fc2c11deedf96011ae55bfff26d4ff9fee` | 0 | protegida | Origen o destino de una PR abierta |
| `feat/master-director-story-orchestration-20261104` | `4b0a974079b6a687dd608d7d08574698d753b9b5` | 0 | canónica | PR #27 |
| `feat/mobile-capcut-navigation-20261030` | `7b53bb8ca313834cd38d590af19a6ea9a6b60c85` | 8 | protegida | Referencia del release móvil |
| `feat/modnet-foreground-effects-20261025` | `00bc9be663311f5c0db5fdefca455ad3d0105459` | 5 | protegida | Origen o destino de una PR abierta |
| `feat/montage-split-delete-20261029` | `6a64e8871a3870c79a13ec3d3f997aade613aa06` | 0 | protegida | Base de producción documentada |
| `feat/non-destructive-spoken-cuts-20261027` | `491d13ad6ef166f45c6fe691d82c723a9a14bf6f` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/paste-creative-plan-20261027` | `362e5a7b067e42e3d51d922be9a2c22e7c0f3c18` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/persistent-edit-head-20261106` | `3c612100d4fcb3ffb30c16bafa903bb3e22f96ae` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/persistent-player-preview` | `98dc668b3aa4cefe6f159dc6ae4439eade0864ad` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/phase-10-consolidation-contract` | `7ddeaa66f667d0376caeff071fbb77707461dfde` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/phase-3-transcript-captions` | `10e194a25237b1de4c05af7f0f1b781ce78d43ef` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/phase-4-vision-camera` | `e6ba0184a8f65e89e823ce442eb597e1ec1b49d0` | 1 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/phase-5-template-foundation` | `0c5677c6232508864235de2cb9392ca93900081d` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/phase-6-motion-library-foundation` | `739f1034caf5208ebc9bb315851110ca951ed11b` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/phase-7-director-contract` | `1c7d332f3d7429b0f86bdfcaf7d54971cb63a2f3` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/phase-8-app-contract` | `341e4d3b2316994d6548aaf2cd22d6c4ffb58186` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/phase-8-editor-shell` | `51df219ece65adf96a7a12c731fc0568ccb29407` | 13 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/phase-9-e2e-acceptance` | `89fac4091a9a9a7c4c42bd42996afd3776ab9e89` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/rea-local-director-qa-20261025` | `5e62ea830205290d4f958becaa727a68e1915cce` | 1 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/reel-158404-rev02-preflight-20261112` | `ba7c22f049e8d341c9c73ce6347b61ad3caf54cb` | 1 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/reference-editor-ui-20261019` | `babc6a547f016f95f4d0911d73dbfe3a7a270b23` | 3 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/remotion-cta-poc-20261103` | `005f54f873b7c86e773e8475e4200837cc9f2302` | 13 | protegida | Origen o destino de una PR abierta |
| `feat/resource-library-style-presets-20261106` | `1cccef0f5a6f6d6eb39bc4a77fe6d7a91bcf40d3` | 1 | protegida | Origen o destino de una PR abierta |
| `feat/reviewed-subject-depth` | `5170373a00d916e417325c03f768d504341c8ee8` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/speech-linked-motion-grammar-20261115` | `13b44cc770a0bfd87d278358328d9a03015701c4` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/sues-ai-film-director-skill-20261025` | `e4a12361bf2f233923de3ad7e916273b3d803b1d` | 2 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `feat/touch-editor-20261028` | `b2f3244a449a1e5e4cbf276c5d25691d87417ae3` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/v1-assisted-preview-20261028` | `a4eee894e119f280739eba4dbf8ee2f1abf2e134` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/v1-closure-20261028` | `a6871c7c027769646f85f94cfec67cd81549d8ac` | 0 | retirable | SHA alcanzable desde PR #27 |
| `feat/visual-safety-curation-20261024` | `61f56a5cc52758675397a6dab3359a3cdd551218` | 1 | protegida | Origen o destino de una PR abierta |
| `fix/audit-closure-20261029` | `e11313aa47cf8c6ae05d635e33385fc3037d54b1` | 0 | retirable | SHA alcanzable desde PR #27 |
| `fix/auth-bootstrap-rea-20261024` | `b84067d83f62bafe506758400f6eec16ace9c7d4` | 0 | retirable | SHA alcanzable desde PR #27 |
| `fix/library-preview-freeze-20261026` | `18fd08a0d966c7dab7169aa24c3077059d5427de` | 0 | retirable | SHA alcanzable desde PR #27 |
| `fix/library-sfx-memory-20261026` | `7695417fd57c5d48bb0677cf34f5a3825b3a666c` | 0 | retirable | SHA alcanzable desde PR #27 |
| `fix/literal-hero-captions-20261025` | `b2ebf6df3725d245e7c3bb5518f574899d1fed0d` | 0 | retirable | SHA alcanzable desde PR #27 |
| `fix/literal-master-captions-20261026` | `6f760d07d6e92a98f4ce9d2f7201aee905623e96` | 14 | protegida | Origen o destino de una PR abierta |
| `fix/playback-buffer-20261024` | `7b45be1b92591ffc2144a64a727209975bcc25ac` | 0 | retirable | SHA alcanzable desde PR #27 |
| `fix/tracked-frame-duration-20261026` | `6e59b1c2c06d4ba5fd944bb91c645e0e2c76a412` | 13 | protegida | Origen o destino de una PR abierta |
| `fix/visual-double-audit-20261030` | `4e407c829e93cfaa2d36b4c91de5478def4be5d4` | 15 | protegida | Parches de producción documentados |
| `main` | `dc9ae28537f3c9788a014a20209fc50494d5430d` | 1 | protegida | Rama predeterminada |
| `poc/phase-2` | `b8722c1c6277b519a517e85b820c4f22b57ef9dc` | 5 | divergente | Revisar cambios exclusivos solo ante una dependencia concreta del plan V1 |
| `release/production-b2ebf6d-20261025` | `b2ebf6df3725d245e7c3bb5518f574899d1fed0d` | 0 | protegida | Referencia de rollback |
| `work/dopamin-density-20261028` | `360289d482fd393dbd315eccee82d44bca79ec81` | 0 | retirable | SHA alcanzable desde PR #27 |
| `work/editor-email-login-verified-20261020` | `6da5a3d9145dde6bff7056e318b67d020e99c66f` | 0 | retirable | SHA alcanzable desde PR #27 |
| `work/night-20261019` | `7761087ffbf5362dcd6af8e61063f18aec595ec8` | 0 | retirable | SHA alcanzable desde PR #27 |
| `work/verified-deploy-preflight-20261020` | `71399e1c9ac6a7da1b586c50b8dae5d93651050b` | 0 | retirable | SHA alcanzable desde PR #27 |
