# F2.3 · Private native FableCut → SUES binding registry · 2026-11-08

## Implemented, isolated and tested

- Added `src/engine-next/fablecut-native-project-binding-registry.js` with `createNativeProjectBindingResolver(absolutePrivateFilePath)`. It consumes a single small, canonical JSON record (`sues-native-project-bindings/v1`) supplied by a trusted administrator. Each binding has precisely `nativeProjectId`, `jobId`, `suesProjectId`, `verified:true`.
- No registry file is automatically created, populated, or exposed. No HTTP write endpoint and no inferred binding. The resolver checks the private absolute normalized path; parent ownership and permissions; file ownership, permissions, inode, symlinks, hard links and bounded size. It rejects unknown fields, malformed and duplicate data and non-canonical JSON, including repeated JSON properties. It reads fresh on each request, so removing a binding denies further approvals.
- `createEditorServer` accepts optional `nativeProjectBindingsFile` and passes its private resolver to the existing `createBoundDirectorPlanVerifier` and real job-owned `MasterDirectorProjectStore`. Explicit dependency `nativeProjectBindingResolver` remains for trusted tests/servers. Both configured simultaneously are rejected. All paths are opt-in; there is no production enablement.
- New isolated registry tests exercise missing registry, file permissions, writable directories, symlinks, duplicates, tampered content, changing/removing bindings and malformed IDs. HTTP fixture confirms absent registry returns blocked status with a valid QA session. The full engine-next suite passed **104/104** with `node --test tests/engine-next/*.test.js`.

## Hard limits

- Actual production binding file has NOT been provisioned. This tranche does not confirm a real human identity or a human approval, does not create a cinematic editing plan, does not authenticate password login and does not run a real FableCut MCP clone edit. A server-controlled registry grants project association only, not creative authority.
- Native transform `fablecut-transform-exact/v1` is still not represented by the current creative story compiler, so no real production plan can use this route. Generic SUES admin session identity remains unverified as a person.
- No DNS, Caddy, publication, deploy, PR merge, live editor mutation, backup rotation or external AI credits. The publication of FableCut remains postponed at Carlos's instruction.

## Next tasks

1. Verify actual source video/project/job association privately and provision only a fully verified map (never guess IDs or copy stale jobs).
2. Connect verified person identity and an explicit reviewed decision to the ledger before any real writing.
3. Read and validate the latest SUES AI Film Director V2 skill before extending the story compiler with exact transforms or authoring/revising a film edit plan.
4. Test a full authorized flow on a dedicated isolated FableCut clone including revocation, optimistic concurrency and rollback. Preserve historical backups.
