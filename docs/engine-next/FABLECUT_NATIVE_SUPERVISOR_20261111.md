# 11/11/2026 · Private native supervisor evidence bridge
Status: development branch, not deployed. No real-person creative acceptance is asserted.

The existing canonical FableCut private runner now records source SHA, timeline fingerprint, story revision, decision, approval fingerprint and native project fingerprint in execution and render proofs. Exact operation-ID coverage is required before authorization, after the durable native result and again before rendering. Technical export checks H.264/AAC, 1080x1920, 30 fps, exact frame count and finite A/V duration; no automatic publication.

## Same job, two evidence stages
After a successful new private run, use the same private clone directory:
- node scripts/engine-next/fablecut-story-run.mjs qa-prepare CLONE_DIR
- Inspect the actual full MP4, the generated private qa-review-index.json and each supervisor inspection's frames and audio.wav. Existing prepareMasterSupervisorEvidence is reused, with whole-timeline samples every second plus start/middle/end of every operation. Groups preserve the 180-frame extractor limit, maximum native batch 100 operations and 120 seconds in this supervisor. Existing extractor byte limits still apply; block rather than omit samples.
- The trusted reviewer prepares CLONE_DIR/qa-review.json (0600) using the contract below, based on two separate actual playback/inspection passes. Do not auto-fill PASS, synthesize reviewer identity, or present a fixture as creative review.
- node scripts/engine-next/fablecut-story-run.mjs qa-verify CLONE_DIR
- The verifier rechecks the original, export SHA, current story/project, every evidence file's hash and exact index. It writes qa-result.json once. Failed checks return operation-specific correction proposals and nonzero status; no automatic edit, re-execution or publication. Any correction requires a new reviewed revision and fresh QA. Historical receipts lacking the new identity fields remain historical, not automatically upgraded.

## Reviewer contract
JSON schema label sues-fablecut-two-pass-review/v1. Copy outputSha256, sourceSha256, timelineFingerprint, storyRevision, decisionId, planFingerprint and projectFingerprint from the exact qa-review-index.json. passes contains exactly two separately performed reviews. Each pass has a distinct id, reviewer (actual reviewer), reviewedAt (actual ISO timestamp), fullPlaybackReviewed:true, operations and globalChecks.

operations has one entry per index operation, {operationId,checks}. checks contains each requiredQA exactly once. globalChecks contains every index globalChecks value exactly once. Each check is {check,status,observation,evidence}; status PASS or FAIL, concrete observation, evidence references "render" (actual full MP4) or exact "inspection-XXXXXX/frame-0001.png" / "inspection-XXXXXX/audio.wav" keys from the index. rendered-frame requires a sample of the relevant operation, audio-playback requires actual audio evidence, motion-playback/time-sync/narrative-review and global checks require full render playback. FAIL additionally requires correction. The machine checks coverage, identity and evidence integrity, not truth of subjective claims.

Global checks: full-playback, narrative, source-continuity, face-and-safe-zones, captions-and-sync, music-and-sfx, no-interference. For absent elements, record the observed absence and why it is consistent with the approved plan, never invent a layer.

A complete review only reaches TWO_REVIEWS_RECORDED_NOT_CREATIVE_APPROVAL (or TECHNICAL_FIXTURE_REVIEW_RECORDED); failed reviews return QA_BLOCKED_CORRECTION_REQUIRED. final:false, creativeApproval:false, publicationAuthorized:false always. Human approval of the exact output remains separate.

## Evidence and limits
11/11 new deterministic unit tests passed locally on Node 22.16.0 using synthetic fixtures for receipt identity, source/plan/output binding, codec and timing validation, sample partition, evidence coverage, two-pass coverage, failure and technical-only status. These are not a VPS test, a real visual review, or a new production deployment. Desktop Commander monthly quota is exhausted; host regression, actual evidence extraction from FableCut and new-recording acceptance remain pending. No original, published Reel, parallel worktree or production configuration changed.
