# Legacy SUES editor — archival full-file integrity and isolated extraction drill · 2026-11-08

## Safely executed on the authorized VPS

- Baseline GitHub branch: `feat/master-director-story-orchestration-20261104`, preceding commit `2de8ed3`. No deploy, DNS, Caddy, publication, mutation of FableCut native, or editor container was attempted.
- Verified archive: `/opt/sues-video-setup/update-backup-20261029-182329-365998/editor-state.tar`, **3,042,713,600 archive bytes**, manifested SHA-256 `af13a48966d0e267406c1893a0f5b4a03a19db2538c6c4f1f583bd0ae46ec8f3`.
- Tool `scripts/verify_editor_rollback_archive.py` verifies archive SHA-256 and every internal regular-file payload against the independent manifest without extraction or reading secrets aloud. TAR contains 2,988 entries, 2,582 regular files, no symlinks/hardlinks. **2,582/2,582 file hashes PASS**, **3,037,507,090 payload bytes read**. A synthetic tampered manifest fails closed.
- Tool `scripts/editor-rollback-isolated-extraction-drill.py` RE-verifies archive and unpacks **only to a fresh random directory** under `/opt/sues-video-setup/qa-restore-drills/` with private 0700 dirs and 0600 files. All 2,582 regular files extracted. Verified editor access metadata and jobs directories exist; never print secret content. The temporary directory was automatically deleted at completion. Exit status 0. Production old editor and native FableCut returned HTTP 200 after the drill.
- This exercise demonstrates integrity and full extraction of a historical rollback snapshot. It is NOT a tested live restart of the old editor with its dependencies and session settings, and NOT a successful test of the scheduled retention/rotation service.

## Remaining legacy backup fault

- `sues-backup-rotation.service` still fails on `AssertionError: latest backup incomplete`. Four historical `update-backup-*` directories exist; penultimate directory `update-backup-20261029-182123-365569` lacks `editor-state.tar` and manifest.
- Required PIN `/opt/sues-video-setup/gemini-live-20261026/rollback/editor-before.tar` is missing. Do NOT fabricate it by copying a newer archive under the old name, and do NOT remove the incomplete directory or other history as an apparent repair. Fix requires a truthful new baseline/recovery policy and service change only through authorized administrative path after real live restoration test.
- No backups were moved, renamed, removed, pruned, overwritten, or altered. No production mounts were touched. Snapshot for native FableCut remains verified and its isolated restart worked in earlier checkpoint.

## Next controlled gates

1. Create a non-destructive new baseline strategy backed by documented media/metadata and verified full recovery. Do not silently re-label 2026-10-29 as 2026-10-26.
2. Reconcile retention daemon expectations with the actual existing backup set and add tests for incomplete latest backup, missing pinned reference, disabled deletion, and safely interrupted backup creation.
3. Verify actual restoration of the legacy editor *with isolated dependencies and no external access* before permitting automated pruning or any new internet publishing.
4. Establish authenticated HTTPS studio gateway through an approved administrative channel; prior attempt to change proxy was blocked by security controls and must not be circumvented. Only then advise Carlos on DNS A record.
