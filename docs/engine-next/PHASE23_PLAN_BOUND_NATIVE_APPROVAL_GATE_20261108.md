# F2.3 · Master Director plan proof → FableCut approval · 2026-11-08

## Verified scope

- Added `src/engine-next/fablecut-director-plan-proof.js`: `verifyDirectorPlanTransform` checks an **existing server-owned** `MasterDirectorProjectStore` with a current immutable story head, `approved(storyRevision, decisionId)`, explicit **approve** (not review/autonomous), matching exact operation id, project id/revision, clip id, x/y/scale and plan fingerprint. Unknown and legacy native effects are never mapped to a transform.
- `editor-server.js` native approval/execution endpoints now **fail closed with HTTP 503** unless a trusted `nativePlanVerifier` is injected alongside the opt-in FableCut bridge; the previous session-only permission cannot be issued. The verifier must be supplied by the trusted host from the real MasterDirectorProjectStore, NOT from client-controlled parameters. Approval/execution both verify plan identity; the ledger hash binds the exact `storyRevision`, `decisionId`, `operationId`, plan fingerprint and timeline/project fingerprint to the one-use action. `dispatch-audit.jsonl` includes the plan proof. A changed plan cannot consume the earlier approval.
- New tests reject changed clip, geometry, native revision, plan identity, stale story head, review-only/autonomous decision, duplicate or unsupported operation, missing storage and substituted fingerprints. Full `node --test tests/engine-next/*.test.js`: 95/95 PASS.

## Remaining blockers (do not misreport as done)

- No production-bound resolver from SUES job ID to `MasterDirectorProjectStore`, no verified per-person identity and no real human login QA. `nativePlanVerifier` is an opt-in trusted dependency in this stage. The synthetic test verifier is NOT a real approval provider.
- The creative story compiler does not yet emit `fablecut-transform-exact/v1` operations, so existing plans cannot qualify. No autonomous Master Director→MCP edit has been authorized. The current production flags and invoker remain disabled.
- No published FableCut; no DNS, Caddy, deployment, merge or production video/project mutation. No workarounds for blocked password-login test. Continue QA exclusively in clone.
- GitHub sync: local stage commit is ahead of GitHub because the VPS HTTPS push has no write credentials. Do not insert new secrets into the environment to force it.

## Next

1. Design an authorized server-owned job→project resolver and enforce real actor identity and explicit human approval in `MasterDirectorProjectStore` without using synthetic sessions as evidence.
2. Add exact NLE transform representation to the creative plan schema/validator with SUES AI Film Director V2 validation before authoring editing plans; block unsupported operations.
3. Test real plan approval and cancellation/revision in an isolated FableCut clone; then extend safe, auditable rollback.
4. Preserve historical backups and resolve incomplete legacy rotation before production rollout. Publishing remains postponed at Carlos's direction.
