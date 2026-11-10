# 10/11/2026 · Private story-to-native-batch automation
Status: branch-only, private QA. The previously published Reel is reference material, not a publication target.

## Working path
- One canonical `sues-master-story/v1`, preserving operation IDs and dependencies.
- MasterDirectorProjectStore immutable draft/current head, review, fingerprint and decision. Existing ledger issues a one-use, expiring batch grant binding actor, project, story revision, decision, plan, timeline, native revision and exact request hash.
- Exact native operations map through `prepareStoryBatch` to `applyCommandBatch`, atomic native MCP patch and readback, durable operation receipts and undo. Unsupported or ambiguous operations BLOCK; no silent partial batch.
- Authenticated HTTP routes approve-batch/execute-batch are disabled unless a trusted private runtime and verified job binding are explicitly provisioned. Existing single-transform route remains intact.
- Private operator script `scripts/engine-next/fablecut-story-run.mjs` offers prepare, run (execute + render), execute, render. It accepts the exact canonical story, not prose; operator/ChatGPT produces the same technical JSON as the approved human table. A private host.json (mode 0600) must bind actual source bytes and native media, timeline, project hash, track roles, verified registry/rules/resources. Never accept host.json from a client or invent rights/word timings. Source and media SHA are rechecked. A technical-qa scope is NOT Carlos's creative approval; private-reviewed requires explicit approval of the matching review fingerprint.
- Export starts an isolated loopback browser render, checks project identity and exact range, frame count, dimensions, AAC audio duration, full decode, audio level and per-operation receipts. No auto-publication. Render failure permits render-only diagnosis, not blind re-execution.

## Verified milestones
- QA 005: real store + one-use ledger + installed MCP, two exact operations revision 2→3; wrong decision, unverified approval and replay denied. HTTP regression covers session/CSRF, unknown fields, exact approvals, one MCP commit, durable results.
- Exact add_caption checks reviewed word anchors, font evidence, frame timings and progressive word-pop; title, dissolve with exact overlap, native visual properties added. These new capabilities require their own audiovisual acceptance; code-level tests do not prove aesthetic fidelity.
- 59/59 directed regression tests with actual installed native project-ops.
- QA 013: V26 169→217 clips, eight EDL cuts, 27 animation curves and 10 caption segments rebased, one fade sampled at original frames; 72.6 s. 1089 frames 540x960 15 fps native render, no JS errors. QA 014: apply historical 18 V28 effects and 9 V29 sweeps using actual files; 72.6 s, V29 SSIM 0.976504 vs historical master. This is end-to-end reconstruction, **not** pixel-identical or fully native editable V28/V29. Original source and published video untouched. QA 009 preserves actual 15-frame alpha source in nine editable compositions (125 samples); first second SSIM 0.984498 vs historical V29. Full historical postprocess replay QA 012 SSIM 0.987810.
- QA 015: canonical story intake, actual native project and SHA, three operations title/position/fade, one MCP batch revision 2→3, execution.json with full receipts. Export requested at 1080x1920 30fps; initial invalid range corrected to exact in-out; see private render-proof when verified.

## Remaining before claiming autonomous creative editor
New recording requires verified upload, source timeline/transcript/frame analysis, actual rule/asset policy and a creative table approved by Carlos. The private runner is not yet a deployed app, nor an automatic arbitrary-text parser. Existing mixed native/Remotion path is separate; integrate only lossless operations with verified resource/mask evidence. Full dynamic rotoscopy, nested motion graphics, rich titles and V28/V29 effect editing, end-to-end resource selection, automated semantic QA and safe correction loop remain incomplete. Do not assert artistic QA or replace missing operations. Acceptance must use a new actual recording and report all operations, technical/creative QA and unresolved gaps.

No merge, production deploy, publish, paid API or original modification. Keep original checkout and parallel B05 untouched.
