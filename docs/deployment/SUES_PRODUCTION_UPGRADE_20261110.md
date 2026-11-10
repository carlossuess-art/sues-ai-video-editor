# SUES production upgrade — 2026-11-10

Skill 1.7.0 is published. Repository changes are not a production deployment. Use the existing FableCut installation; never create a second working editor.

1. Restore authorized VPS access; verify service identity, current revision, loopback API, data root and available disk. Back up native app, project index, primary project, and shared favorites. Keep V18 and its media intact.
2. Set identical absolute SUES_FAVORITES_FILE for both existing services, accessible only to their service accounts. Do not use separate default registries.
3. Run prepare-native-sues.mjs APP_DIR LIBRARY_DIR without --apply. Inspect changes and template collisions. Apply only after successful preflight; restart existing service and verify browser/native API, favorites and templates. Roll back from backup if smoke fails.
4. Dry-run import-shared-project.mjs SOURCE_DIR TARGET_DIR LOOPBACK_URL. SOURCE_DIR is the verified editable V18 project directory. TARGET_DIR is the existing editor data directory. Check every media dependency and same filesystem hardlinks. Apply only with --apply; inspect import receipt and project list before opening. Never retry an uncertain import blindly.
5. Deploy SUES server/web changes from this branch through existing service deployment procedure. Verify keyword selection persistence and title overlap against actual rendered preview. The style planning API alone is not proof of native rendering.
6. Test old/new revision isolation, original preservation, actual silhouette and B-roll edge, title and subtitle visual contrast, audio, timing, render and readback. Do not approve or publish V18 without Carlos's explicit approval. Metricool remains paused.

Remaining production validation: native end-to-end render of dynamic caption highlighting, actual source-derived matte and compositing, shared project open/readback, and automatic resource marking across every execution route. No claim of completion until these pass.
