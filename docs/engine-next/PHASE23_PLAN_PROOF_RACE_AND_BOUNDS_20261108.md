# SUES Master Director → FableCut: approval-race and geometry safety · 2026-11-08

This increment is **development-only**. Carlos requested continued editing-engine development while awaiting a reply from Desktop Commander support on the independent Studio publication issue. No Caddy, DNS, Docker runtime, human credentials, FableCut production project or existing video media were modified.

## Delivered

- `verifyDirectorPlanTransform` now reads the authoritative story revision **again** after awaiting an explicit creative approval. If the Master Director story head advanced during asynchronous approval retrieval, the proof fails closed with `STALE_STORY_HEAD`, instead of trusting the earlier snapshot.
- The exact transform plan is rejected before approval when its native revision is negative/noninteger, coordinates are nonfinite or exceed ±3000, or scale is nonfinite/outside [0.05, 8]. These mirror the native FableCut MCP guard bounds; NaN is properly classified as invalid before comparing exact plan values.
- Added two targeted regression tests: revision changes mid-approval; out-of-bound coordinates and scale, nonfinite values, negative revision, plus valid numerical boundaries.
- Result: `node --test tests/engine-next/*.test.js` **106/106 PASS**, target plan-proof **6/6 PASS**. This proves local contract behavior, not a production MCP write or real human authorization.

## Still pending

- Native creative compiler must explicitly emit exact transform manifests; do not infer from other visual edits. Real SUES job→native project owner binding and real human approval remain required. No automatic editing without them.
- FableCut Studio publication remains deferred. DNS is ready, but external HTTPS and authenticated access still blocked by the previously restricted Caddy configuration route. Do not work around the security block.
- Historical backup monitoring runs in non-deleting verified mode; automatic prune is disabled. Previous preflight and tests remain intact.
