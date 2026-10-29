# SUES Avatar V0 — 2026-10-29

Branch: feat/heygen-avatar-api-v0-20261029. Isolated implementation, NOT deployed.

## Implemented
- Authenticated routes: GET /api/avatar/heygen/capabilities, GET /api/avatar/heygen/avatars, POST /api/avatar/heygen/generate, GET /api/avatar/heygen/videos/:id.
- HeyGen V3 server-side adapter with x-api-key never sent to browser.
- Requested output: avatar_iii, 9:16, 1080p, mp4. Actual provider acceptance requires API account.
- Minimal page /avatar (not integrated in core editor UI), script or public HTTPS audio URL, manual video ID polling and provider MP4 link.
- Existing editor sessions, Origin and custom request header preserved.
- Paid video creation requires BOTH env HEYGEN_ALLOW_PAID_GENERATION=true AND checked approval on the page. With flag unset the generation endpoint is fail-closed.
- No upload of local recordings; voice audio must already be hosted in a provider-accessible HTTPS URL.
- No autonomous creation/consent flow for the Digital Twin; owner must complete authorization through HeyGen.
- No local MP4 import or processing by cinematic Director yet. Video URL can be opened from result.
- Environment key is intentionally NOT configured; no billable request has been made.

## Configuration (future, after entitlement and costs verified)
- HEYGEN_API_KEY: secret server environment variable, never in git or frontend.
- HEYGEN_ALLOW_PAID_GENERATION: default false. Flip only after acceptance + quota and test approval.
- Account must expose owned, consented Digital Twin and compatible Avatar III video generation.
- Launch authenticated editor server, then navigate to /avatar.
- Provider engine selection and output options are currently based on public V3 schema; not yet proven with authenticated generation.

## Checks
- node --check src/editor-server.js; node --check web/avatar.js
- node --test tests/heygen-avatar.test.js => 4 pass / 0 fail with mocked network.
- npm test => 251 pass / 36 fail (287 total) on this VPS worktree. Many fail on missing ffmpeg (ENOENT). Baseline comparison not completed; cannot claim full regression suite green.
- No deployment, no paid calls, no actual MP4.
- IMPORTANT: Before real paid tests, validate response shape, model entitlement, idempotency and billed minutes. Add preflight cost cap and automatic media download as follow-up work.

## Next action
Obtain a HeyGen API key through owner's authorized account (do not paste in chat), verify GET /v3/avatars and Avatar III entitlement; finish payment guardrails, then approve a 10–15s paid render. Only after that enable live generation and integrate actual MP4 into library and editor.
