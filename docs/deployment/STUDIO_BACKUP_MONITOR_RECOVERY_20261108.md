# VPS production recovery gate — safe backup monitor remediation — 2026-11-08

## Authorized real operations performed

Carlos explicitly requested repair and publication. The existing old-editor backup rotation service was failing due to an incomplete historical backup directory and a missing legacy pinned archive. No historic archives/directories were deleted, renamed, hidden or overwritten. FableCut original at 127.0.0.1:7780 and old editor at https://editor.suesholistics.com both remained HTTP 200.

1. Independently copied **3,042,713,600 bytes** of the fully verified 2026-10-29 archive to `/opt/sues-video-setup/retention-baselines/baseline-created-20261108-from-update-20261029-182329-365998/editor-state.tar` and separately checked its complete SHA-256 **af13a48966d0e267406c1893a0f5b4a03a19db2538c6c4f1f583bd0ae46ec8f3**. Original manifest and a private `provenance.json` recording the true original backup date (2026-10-29) and copying date (2026-11-08) are alongside it. This is a *same-disk independent archival copy*, NOT an off-site backup or a snapshot of the current live 2026-11-08 application state.
2. Prepared a conservative replacement of `/opt/sues-video-setup/backup_rotation.py` in `ops/backup_rotation_safe_20261108.py`. Three fixture tests passed, including fail-closed missing baseline, insufficient complete backups and preservation of incomplete histories. A real staging `--dry-run` read all required archive data successfully: pinned baseline and the two newest **complete** archives; its report listed the incomplete 2026-10-29 directory, **zero removals**.
3. Backed up the original production executable at `/opt/sues-video-setup/backup_rotation.py.before-safe-20261108` with mode 0600 and verified its SHA-256 byte equality against the prechange executable. Atomically installed the replacement in the original executable path (mode 0700).
4. Started the existing `sues-backup-rotation.service` once. **Result=success, ExecMainStatus=0**, with explicit JSON `status=verified-no-prune`, `healthyRestoreArchives=3`, `automaticPruningEnabled=false`, `allHistoricalBackupsPreserved=true`, `incompleteHistoricalDirectoriesRetained=[update-backup-20261029-182123-365569]`, `requiresRetentionReview=true`.
5. The existing timer still runs the same script every 15 minutes. The service is now a *non-destructive integrity monitor*, **not a working automatic-pruning/retention scheduler**. Do not claim history was repaired or that deletion was reenabled. The previous executable is retained for audited rollback; it should not simply be restored without addressing its failed assumptions.
6. Updated `scripts/fablecut-publication-preflight.mjs` to inspect the new verified baseline, two complete update archives and the actual latest service exit status. On VPS with expected IPv4 provided, **PASS** for FableCut snapshot, native FableCut local, legacy backup integrity monitor and public DNS. **BLOCKED** for authenticated studio public HTTPS gateway and real human login.

## Unresolved publication blocking items

- `studio.suesholistics.com A 76.13.51.232` is already correct; no further DNS action is required. The Caddy config still lacks a `studio` vhost and HTTPS fails. Previous attempt to change the live Caddy proxy was blocked by tool safety controls; do not bypass this restriction through another command/tool/interface.
- The candidate Caddy config and operator checklist are in `docs/deployment/FABLECUT_STUDIO_CADDY_CANDIDATE.Caddyfile` and `docs/deployment/FABLECUT_STUDIO_OPERATOR_HANDOFF_20261108.md`. It requires secure credentials provisioned by an authorized administrator, a FableCut allowed-host configuration and real external auth/CSRF/Host/Origin/WebSocket/Range regression checks. A syntactically valid config is **not an installed gateway**.
- Do not publicly expose 7780 or change/overwrite the original six-clip FableCut project. No PR merge or SUES editor production deployment took place.

## Next operator task

Use an *approved administrative channel* to configure authenticated HTTPS, then validate external denial without login and real authenticated human access; keep editor and WhatsApp available. Restore scheduling integrity with independent off-site backups and an explicit, tested pruning policy only after historical state is reviewed. Never silently delete incomplete source archives.
