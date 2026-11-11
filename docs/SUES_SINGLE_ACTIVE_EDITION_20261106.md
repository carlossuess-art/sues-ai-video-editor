# SUES AI VIDEO EDITOR — una única edición actual por proyecto

**Scope**: development PR #27 only. No production deployment, publish or external generation.

## Product invariant

A Reel is **one editable project**. All approved changes (manual controls, instruction planner, master layer-graph) target its single active working revision. The interface does not show an expanding list of `D1/D2/D3` video copies. Internal hashes/revisions are retained solely for integrity, rollback and safety; a finished export is NOT immutable as an editing project.

Examples: changing the caption at 17s preserves the original source, other captions, motion, typography, masks, audio and B-roll. Changing an 8–12s B-roll preserves all other operations. Setting a mask changes the selected layer, never the entire Reel. A later TikTok variant must be an **explicit branch within the same project**; generating variants automatically is prohibited.

## Implemented in this branch

1. `EditorJobs.adjust` accepts an already exported `DONE` project, transitions it back to editable `PREVIEW_READY`, invalidates stale render/acceptance, and retains the previous artifact only as an internal recovery record. The job UUID and `projectId` do not change, across exports and restarts.
2. Direct instructions, external creative plans, and the master-native apply route mutate that same project job; request receipts prevent duplicate submissions and stale replay. Unsupported plans do not partially apply.
3. User-facing project cards and project list show **one current entry**; the old visible duplicate button is hidden. Technical revision restoration is in a secondary advanced recovery area.
4. `/api/projects` and `/api/projects/:projectId/current` expose one current job per project, with the verified master revision when available; all endpoints retain authenticated access controls.
5. `MasterDirectorProjectStore` has a durable, SHA-256-verified `current` pointer, atomic compare-and-swap with filesystem lock and immutable historical drafts for integrity. Edits that were based on a stale revision return a conflict.
6. The web project uses revision-aware saving (optimistic concurrency) to reject writes from a stale browser tab. Styling changes and backups update the existing project instead of creating user-facing duplicates.
7. `master-current-command` supports **surgical commands**: `caption-text`, `broll-replace`, `mask-set`, `mask-remove` by exact operation ID or time if and only if one operation matches. Missing or ambiguous operations and unregistered resources block without modifying the current project. Safe native primitives (caption text and full-screen B-roll resource swap) are now individually editable; native masks and unsupported effects still fail closed.
8. `scripts/master-editor-cli.mjs` provides owner-operated read-only `status` and explicit `apply` from a trusted machine for the same commands, using the same store and expected revision; no rendering or publishing. This is a bridge for chat-controlled editing, not proof that a standalone ChatGPT Video Editor plugin is connected.
9. Editor checks the project's current master revision periodically while open; unsaved text is protected from being overwritten by updates from another tab or external chat tool.
10. The API and UI preserve the master plan's prior visual styling, unmodified layers and resource references when editing only one property.

## Safety

- Never apply changes from an outdated revision; if two edits collide, the caller must reload and reissue only the desired change.
- Resource replacements must refer to a registered project resource. Masks require a proof reference; QA and actual rendering still enforce supported mask capabilities.
- Any edit invalidates previous creative acceptance and requires fresh review. Exports are never automatically published.
- Preserve original source and existing private artifacts. No automatic deletion of revision history.
- The native/Remotion graph remains the authority for final output. A chat-side change to a master draft requires the same review and render pipeline before its visual output changes. Re-rendering a final MP4 may be necessary after a modification, but **creative decisions and unaffected layers are not regenerated**.

## Verification

- Local Node unit/API tests: working head, stale-tab conflicts, restart, caption and B-roll-specific changes, mask changes, HTTP authentication, existing-job edit after export, idempotence, CLI restart/replay.
- **Browser smoke PASS**: `scripts/app/smoke_project_director.mjs` on synthetic source, desktop 1440×1000 and mobile 393×852, with real FFmpeg render/decode in isolated browser Docker. Both devices verified the same one project ID, voice/source preservation, playback, download hash, review, save, reload, no horizontal overflow. Desktop verified multiple edits and export attempts under the same job. No real personal video used. A separate browser master-story E2E PASS confirmed that editing one native caption preserves another layer, persists the same project ID and reloads the latest revision.
- Full host suite without FFmpeg: 641 tests, 610 passed, 24 failed because the system FFmpeg executable was absent, 7 skipped. Subsequent targeted integration tests passed 33/33. Isolated FFmpeg Docker native master render passed 1/1, actual decoded MP4. A later media-capable isolated Docker suite ran 644 tests: 640 pass, 2 fail, 2 skip. Both failures are unavailable dependencies in that restricted container (Git and local CLI); the same four relevant tests passed 4/4 on the host. This is not full deployment approval.

## Remaining acceptance gates before 'CapCut-like COMPLETE'

1. Review the remaining mixed native+Remotion hybrid pipeline, which uses internal child jobs for certain intermediate stages. The pure `master-native-apply` route now uses the existing project ID, with a successful real native render integration test. Hide internal stages in UI and ensure they continue from current head rather than creating parallel user-facing projects.
2. True GUI timeline editing for **all** native and Remotion layers, including masks and resource placement, with immediate preview and safe QA; `editableInWebEditor:false` currently blocks native parity.
3. Chat connector / plugin permissions and schema so the user can refer to a Reel conversationally rather than supplying job IDs/CLI arguments.
4. Explicit project variants for Instagram/TikTok within one root project and one active revision per variant, preserving a chosen original.
5. Crash recovery of persistent `current.lock` and backup/restore of master revisions and verified resources.
6. Full end-to-end browser + video/audio render QA on a real original Reel, plus supervisor cinematic quality review. No claim that every advanced mask is currently executable.
7. Expand conflict protection to every remaining auxiliary workflow and finish native layers' edit parity before enabling public deployments.

Status: **integrated development only**; must be tested and reviewed before deployment.
