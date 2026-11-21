# SUES · FableCut mobile V1.1 (isolated prototype, 21/11/2026)

STATUS: PROTOTYPE ONLY. NOT DEPLOYED, not accepted, not a replacement for FableCut, and not closure of V1. Roadmap source: https://docs.google.com/document/d/1OUJyWN4Hs580-C6EEyiyBy_lSSWzQwe8vT62eg5cKPQ/edit (revision V1-2026-11-21-r15).

This directory contains a minimal responsive mobile shell for the EXISTING FableCut Studio. The main app.js, style.css, renderer, data schema and original desktop controls were not modified. It is a first experiment for V1.1-01/02, not completion of them.

Files:
- sues-mobile.css: mobile-only layout for monitor (always visible), timeline, compact header and panel tray.
- sues-mobile.js: small bottom navigation to EXISTING media bin and Inspector/Mixer/Transcript tabs, no duplicated editing actions.
- qa-mobile-shell.test.cjs: DOM-mock tests for navigation and static inclusion.

For QA in a standalone copy only: include <link rel="stylesheet" href="sues-mobile.css"> AFTER style.css in index.html, and <script src="sues-mobile.js"></script> at the end of body after app.js. Do not inject these into production until real mobile browser QA, visual validation and undo/export checks.

Stage path on VPS: /opt/sues-video-setup/v1_1-mobile-20261121/stage (snapshot of existing production code, WITHOUT user data); private data: sibling qa-data. Original production: /srv/sues-fablecut-next/app; do not reset its uncommitted changes.

Evidence: 2/2 dedicated Node tests, 56/56 keyframe/captions/export regression tests. Source unchanged app.js SHA256 d68028065f4b9c5155c4405081291cd310ad8b3a5ae7bb29b68cf10f9eff8a8f; style.css SHA256 723b68f0a93437576282440b2823e7f74df1f5e0a19f39906151386d973155d4.

LIMIT: FableCut Studio mobile screenshots, Android touch QA, interaction with actual clips, font animation and full render NOT validated. Chrome headless (155) did not load a usable DOM under isolated FableCut; headless shell (152) timed out/crashed for the app and minimal CSS fixture (RC153). Blank HTML loads, so this may be environment or application load. Investigate before declaring visual PASS. The standalone QA server on 127.0.0.1:17899 must remain isolated and stopped after the test.
