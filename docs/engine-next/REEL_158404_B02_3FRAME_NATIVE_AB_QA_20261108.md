# Reel 158404 · FableCut native A/B B02 with/without experimental gold

**08/11/2026 · visual QA in authorized isolated private clone.** No public gateway or production change. Gold was an isolated V5 proof and is not an explicitly mapped operation among the creative story's 49 IDs. The A/B comparison is a *proposed direction*, not Carlos's aesthetic approval.

## Reproducible facts

- The original B02 native 4-second MP4, at 9.5–13.5 s, 120 frames, retained the V5 gold overlay. QA screenshots in the previous report existed at t=10.0/11.5/13.0 s.
- A **separate editable copy** of the B02 JSON was made: eight clips, V1 original locked and A1 voice locked, V2 children and V3 Carlos + V4 matte retained, V5 gold clip merely marked `disabled:true`. No clip/media was deleted. The actual FableCut clone bound only to `127.0.0.1:7784`, not the public interface, read this project.
- Chrome headless / FableCut native canvas captured new 1080×1920 images at **10.0, 11.5 and 13.0 s** with V5 disabled. `pageerror` list was empty. Reviewer can compare old frame (left) and clone without V5 (right) for each instant. This is a native *preview* comparison, **not a new exported 120-frame MP4**, a qualified visual QA pass, a new semantic title, or a licensing approval.
- Test independently confirmed original persistent FableCut **revision 54, six clips** before and after. Browser clone may advance its own revision during normal load; do not compare clone revisions to production.
- First clone screenshot exposed 'Media offline': project references exist in JSON but derived B02 alpha / temporal matte were outside the persistent media folder. Rebuilt QA clone with source-linked, hash-verified files stored privately in earlier QA packages, without copying them into production. The source is still the original verified MP4; all offline media were resolved on the clone.
- `src/engine-next/native-media-dependencies.js` + `scripts/engine-next/native-media-preflight.mjs`: new safe-path, no-missing-IDs inventory checks to prevent visual preview/export when a clip's source asset is absent. Also separates `playbackReady` (referenced assets present) and `editableProjectPortable` (all media present), so non-visible missing resources are not silently omitted. No auto-download or network requests.
- Original stage with normal production media: **9 media entries, 3 absent, 2 used by visible clips**; standalone QA clone after restoring verified media: **9/9 present, 0 missing**. Both reports retained privately.

## Private evidence, never publish to GitHub

Location: `/srv/sues-fablecut-next/data/qa/reel-158404-milestone1-20261108/`.

- `B02-no-gold-editable-project-QA.json` — actual editable project variant.
- `B02-no-gold-frame-10-NATIVE.png`, `B02-no-gold-frame-11_5-NATIVE.png`, `B02-no-gold-frame-13-NATIVE.png` — real native Chromium canvas images.
- `B02-native-comparison-ON-vs-OFF-3frames.jpg` — three comparisons (left V5 ON, right V5 OFF); SHA256 `2a0da9837c4272d5d6e9b959773b692df79e7403d42fff2de2bd607509f63711`.
- `native-media-original-preflight.json` and `native-media-qa-resolved.json` — before/after completeness proof.

## Next gate

1. Artistic decision: determine whether V5 gold should be removed or replaced with an object narratively relevant to what Carlos says. Do NOT infer semantic approval from visual clarity.
2. Confirm semantic title `title-3` and captions from voice. ASR text not manually reviewed; do NOT activate real captions before human review, chin-safe layout and exact timestamp QA.
3. Move to real full 120-frame export of an approved variant with the real title/captions/audio, then whole Reel. Still blocked on voice review and exact presentation QA; other motor/asset work can continue.
4. Maintain a private reproducible media bundle before enabling any B02 clone, and preserve SHA fingerprint/manifest for all files. Do not substitute flattened video for editable layers.

**Tests:** Node suite 109/109 PASS including 3 new media-dependency tests; separate Python milestone tests 4/4 PASS. PR27 staging only, production HTTPS Studio still unpublished.
