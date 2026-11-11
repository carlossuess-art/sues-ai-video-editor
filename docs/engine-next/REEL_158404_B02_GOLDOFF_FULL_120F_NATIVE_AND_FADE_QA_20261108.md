# Reel 158404 · B02 · native FableCut 120-frame gold-OFF export and candidate fades · 2026-11-08

**Final state of this increment: B02 4.0 s (9.5–13.5) exported and independently TECHNICALLY VALIDATED. NOT cinematic QA, creative approval or complete Reel.** Original FableCut `127.0.0.1:7780` project revision 54, six clips, unchanged. Existing HTTPS `editor.suesholistics.com` still HTTP 200. Studio gateway publication remains postponed, no attempted Caddy/HTTPS changes. All QA only localhost and cloned data.

## 1. Source/story/real editor evidence

- Story `sues-master-story/v1` has 7 scenes, 49 operations. B02 matches `shot-2-2`, 9.5–13.5 s, a child group behind Carlos; expected high-quality temporal person mask plus IN/OUT transitions. **This test is not a certified 49-operation plan execution.**
- Original source MP4 SHA256: `9e06f49c30731d8a57aed312cfb46281bcffb7b3d5d62bf5a2164333944ccaad`, B02 child source JPG SHA256: `193ee26b6578228ddc29fcfd3a501760cb73366541324a3f03cd50e759d521b4`. Correspond to authoritative story and original V1/A1 remain locked.
- Native editable 8-clip QA project: original V1, child V2, foreground Carlos V3 + temporal matte V4, experimental gold V5 **disabled**, voice A1 (plus other staging clips). Nine referenced media all present in independent QA media set; no substitutions or internet generation.
- Isolated FableCut 1.18.0 server ran on `127.0.0.1:7784` only; private copy of frontend app.js used frame presentation waits `[600,1600,4000]` ms after the unchanged original timeout setting caused errors in earlier small tests. This copy is not a production deployment and no source library of FableCut was overwritten.

## 2. Newly completed four-second real NLE export

- FableCut headless/browser export job `x_g4pkj6pl`: native `done`, 100 %, all native delivery checks `ok=true`.
- Private MP4 path `/srv/sues-fablecut-next/data/qa/reel-158404-milestone1-20261108/B02-goldoff-120f-FABLECUT-NATIVE-QA.mp4`. SHA256 `eaa4e71408a97da2bdaf1b86cf10c15641bca863d4654156b65459be0fcfc5b0`, 5,017,875 bytes.
- `ffprobe -count_frames` independently verified H.264 1080×1920, 30/1 fps, **exactly 120 frames**, **4.000000 seconds**, AAC stereo 48,000 Hz also 4.000000 seconds. Native FableCut report audio −23.4 LUFS and −5.3 dBTP.
- `framemd5` independent decoded video: **120 distinct frame hashes, no adjacent duplicates**. This is diagnostic for the movement in this particular scene, not an all-purpose film requirement.
- Native FableCut browser program canvas captured with `toDataURL` at full 1080×1920 resolution at **10, 11.5, 13 seconds**. A read-only audit compares actual decoded export frame indices 15,60,105 to those preview canvases. **RGB SSIM 0.969370, 0.979356, 0.967472; minimum 0.967472**. Technical similarity threshold ≥0.95 on these three; explicit three-sample qualification, not all-frame perceptual proof.
- Audit code `scripts/engine-next/audit-b02-goldoff-120f.mjs` and `src/engine-next/native-b02-full-window-gate.js` fail closed on wrong source/voice locks, wrong matte relation, V5 enabled, incomplete 120-frame video, unsupported audio, native export report failure, duplicate frames or poor selected SSIM. **All technical checks passed** in `/srv/sues-fablecut-next/data/qa/reel-158404-milestone1-20261108/B02-120f-goldoff-full-window-audit.json`.
- Initial audit script used FFmpeg YUV format against an RGB-specific parser and correctly *failed*. Filter changed to `format=gbrp` (RGB), then exactly three native SSIM samples were verified. Not a change to the rendered MP4.

## 3. New editable IN/OUT fade candidate: native preview, not exported

Film Director V2 D01–D77 requires planned entry and exit for a B-roll. In the **technical gold-off export**, child V2 had no `transitionIn`/`transitionOut`, so this artistic requirement remains open.

- Added conservative, **candidate-only** `src/engine-next/native-b02-fade-candidate.js` and staging CLI `scripts/engine-next/stage-b02-native-soft-fades.mjs`, which copy the native QA project and change **only** the child V2 clip `sues_b02_child_review_only` to `{type:'fade',duration:0.3}` at both edges (9 frames each at 30 fps). No modifications to Carlos' V3 foreground, temporal matte V4, locked V1/A1, disabled V5, or original media; new revision and explicit `QA CANDIDATE NOT APPROVED` project name.
- Private editable candidate `/srv/sues-fablecut-next/data/qa/reel-158404-milestone1-20261108/B02-goldoff-120f-with-child-fades-CANDIDATE.json`; also `.review.json` with proposal and rationale, all nine assets present in the cloned media folder. Distinct FableCut QA clone inspected **12 true native 1080×1920 preview canvases**: six baseline and six with fades at 9.50,9.65,9.83,13.17,13.35,13.49s, **0 JS page errors**.
- Side-by-side image contact sheets: `B02-native-boundary-IN-base-vs-fade.jpg` and `B02-native-boundary-OUT-base-vs-fade.jpg`; left old no-fade, right new fade. Visually the children fade up/down over the original static background while Carlos stays in frame. At 9.83s baseline and faded canvas are byte-identical (SSIM=1). Asynchronous browser seeks between runs may show a different VFR source frame at the other samples, so their per-frame full-frame SSIM must **not** be presented as causal fade effect or all-frame parity; report private `B02-native-fade-boundary-quantitative-QA.json` explains this.
- **Do not declare this candidate approved, exported, or final.** It needs whole-motion/mask review, a new FableCut-native export after creative acceptance, and verification of fade timing against real speech. Its upper-right child crop and person hair/clothing matte still require aesthetic inspection.

## 4. Next genuine gates and risk

1. No full Reel: current result is four seconds of B02 only, not the 73.75-second seven-scene composition. The 49-operation bidirectional creative manifest remains pending.
2. The planned semantic `title-3` («NO MOLESTAR») and 11 B02 caption word candidates are not reviewed humanly; left boundary, low-confidence token and right boundary uncertain. No real captions/title in these exports, and never activate text before reviewing voice/timing/chin clearance.
3. Music, SFX license/ducking, scene transitions, B02 child cutout and temporal matte hair-edge QA need attention. Difference between program preview/export in three samples is technical evidence, not aesthetic acceptance.
4. The VPS (~3.8 GiB RAM and one CPU) took substantial time to export 120 frames with software compositor. Optimize isolated QA pipeline before making full Reel exports a routine. Continue keeping one editable native timeline, preserving source snapshots and rollback.
5. Maintain private QA evidence; **no public media, faces, original voice, or photos of children in GitHub commits**. GitHub only stores auditable code, human storyboard, QA method and provenance.

**Verification tests:** All engine-next Node tests plus four Python milestone tests pass. PR27 branch is unmerged; no Caddy and no production NLE deployment.
