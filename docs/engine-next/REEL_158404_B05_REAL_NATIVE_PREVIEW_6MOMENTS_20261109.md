# Reel 158404 · B05 105f temporal matte: six authentic FableCut paused previews · 09/11/2026

**State: technical proof of native editable composite; artistic review required, not approved, not published.** Complies with preserving Film Director 1.5.7 / V2 D01–D77 and 49-operation master story; the original face/voice/source and the other scene candidates remain unchanged.

## Real native editor evidence

The isolated QA clone of FableCut 1.18.0 at `127.0.0.1:7784` loaded an existing **single editable project** with 7 scene markers, 49-operation external crosswalk, **12 clips and 15 media** (B01 applause, B02 children, B05 mirror under real Carlos with 105-frame MODNet luma matte). No resource generated, no source video or voice edited. On **six actual headless-browser canvas captures**, the corrected paused WebCodecs preview awaited all required decoded video layers, with no browser errors and exact playhead timestamps:

| Original timeline second | Decoded video tracks | Actual result |
| --- | --- | --- |
| 46.8 | Original V1 | No B05, normal Carlos |
| 47.2 | Original V1 + Carlos V3 + luma V4 | Mirror scene begins behind Carlos; real Carlos foreground |
| 48.0 | V1 + V3 + V4 | Composite visible |
| 49.0 | V1 + V3 + V4 | Composite visible |
| 50.4 | V1 + V3 + V4 | Mirror scene closing; V3/V4 present |
| 50.7 | Original V1 | B05 ends, normal Carlos |

All canvas captures are **1080×1920** and private on the VPS at `/srv/sues-fablecut-next/data/qa/reel-158404-B05-mirror-105f-composite-20261108/previews/B05-{46_8,47_2,48,49,50_4,50_7}.png`; manifest `B05-6frame-native-preview-proof.json` and script `verify-B05-5frames-native.cjs` (six actual samples; script basename historical). All 49 operation IDs preserved in `49-operations-b05-temporal-crosswalk.json`: 15 camera source-covered, B01+B02+B05 native technical candidates, 2 disabled candidates, **29 uninstantiated**. None is artistically approved or fully rendered just because the canvas preview exists.

## Real visual inspection (no false approval)

At t=47.2 and t=49, Carlos is in the foreground, real original face unchanged, with the mirror JPEG behind him. The background photograph is dominated by a dark upper region and a large figure partly hidden by Carlos; the supporting visual concept is not clearly legible. A **dark/grey double silhouette or ghost at the top-left edge of Carlos' head** is visible in the t=49 composite; it may be background figure overlap and/or segmentation halo, and requires a full-frame edge/motion investigation, not a guess. The still source is not animated by itself; this 105-frame matte only tracks Carlos' outline. The source photograph contains another identifiable person and rights/context are unverified. **This is not yet a cinematic-quality B05 or a rights-cleared asset.** Do not activate this as approved, do not publicly deploy or export it as a final Reel.

## Next QA gate

1. Compare B05 with a new *composition-only* geometry (same verified media) to make the metaphor visible without hiding the other person's face or creating false endorsement; no new image unless separately authorized. Audit six exact frames again.
2. Evaluate hair/matte/edge temporal consistency for all 105 frames and inspect whether background source figures create confusing silhouettes; existing mask continuity has zero numerical outliers but that is not sufficient artistic approval.
3. Export a short **native B05 segment** only after choosing an acceptable composition candidate; then compare independent MP4 vs actual FableCut canvas. Keep the real source, A1 voice and all 49 operations unchanged.
4. Advance other missing scene operations and verify voice/titles without inventing transcript. Artistic sign-off and third-party image rights remain explicit blockers.

No public site, production FableCut revision54/six clips, Caddy, DNS or legacy editor changed. QA server 7784 stopped after test.
