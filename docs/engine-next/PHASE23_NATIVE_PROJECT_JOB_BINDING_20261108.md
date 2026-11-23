# F2.3 · FableCut native-project binding to Master Director job · 2026-11-08

## Verified changes

- Added `src/engine-next/fablecut-director-job-binding.js`. `createBoundDirectorPlanVerifier` accepts trusted, server-owned `resolveBinding(nativeProjectId)`, `getJob(jobId)` and `getStore(jobId)` dependencies. It checks exact native project, UUIDv4 job, verified association and matching SUES project ID before calling the existing Master Director approved-plan verifier. The mapping is never taken from HTTP, titles, filenames or inferred from project similarity.
- `createEditorServer` can receive optional `nativeProjectBindingResolver`, using the existing trusted Master Director context to construct the exact `MasterDirectorProjectStore` for the server-registered job. This path takes precedence over generic injected test verifier; absent, the existing opt-in plan-verifier path remains. A successful binding adds SUES job and project IDs to the one-use approval fingerprint and audit provenance.
- Added tests that fail closed for wrong project, wrong UUID/job, intermediate work, missing trusted mapping, stale plan or modified geometry. HTTP test proves that a valid test session plus injected synthetic verifier **cannot** approve any native change when the authoritative project resolver returns no mapping. No FableCut production edits or deployments.
- Full engine-next test suite: `node --test tests/engine-next/*.test.js`, **100/100 PASS**.

## Boundaries

- No concrete administrator-managed binding records have been provisioned to the production service. A binding resolver must use authenticated server-only configuration; nothing is guessed automatically. This is integration plumbing and synthetic QA, NOT proof that a real user approved a reel.
- Existing login still records only a generic `sues-authenticated-admin` actor for native edits. No real named-user identity/permission grant, no human credential test, no autonomous Master Director edits and no fully supported `fablecut-transform-exact/v1` story compiler yet. These remain blocked deliberately.
- Production remains unchanged. No PR merge, DNS, Caddy, FableCut publication, or production video edit. Keep older backups untouched; historical rotation repair still pending.

## Next controlled increment

1. Supply and validate an explicit administrator-controlled native→SUES job mapping, with no client input, and prove a genuine Master Director current/approved decision through a cloned project.
2. Bind a verified person or explicit review identity to the approval ledger. Do not treat internal session tokens as proof of human login or creative approval.
3. Design and validate the precise native transform operation in the SUES AI Film Director-approved cinematic plan schema; run a full isolated-clone E2E, including cancellation, revocation and rollback CAS.
4. Continue only in a PR. Publication is expressly postponed by Carlos.
