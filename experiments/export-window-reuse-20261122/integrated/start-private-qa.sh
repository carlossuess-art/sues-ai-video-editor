#!/usr/bin/env bash
# Existing FableCut only; isolated, NO public reverse proxy or DNS changes.
set -euo pipefail
STAGE=/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122
CHROME=/opt/sues-secure-headless-qa-20261122/native-fastpath-qa/chrome-with-apparmor.sh
test -f "$STAGE/app/sues-segmented-export.js"
test -f "$STAGE/data/project.json"
test -x "$CHROME"
mkdir -p "$STAGE/home/config" "$STAGE/home/cache"
cd "$STAGE/app"
exec env HOME="$STAGE/home" XDG_CONFIG_HOME="$STAGE/home/config" XDG_CACHE_HOME="$STAGE/home/cache" FABLECUT_DATA_DIR="$STAGE/data" FABLECUT_CHROME="$CHROME" PORT=18156 HOST=127.0.0.1 SUES_RESIDENT_WORKER=1 SUES_RESIDENT_DEBUG_PORT=18157 FABLECUT_QA_NO_SANDBOX=0 SUES_RESIDENT_BITRATE_MBPS=16 SUES_SEGMENTED_EXPORT=1 SUES_SEGMENT_FRAMES=180 SUES_EXPORT_REUSE=1 SUES_WINDOW_REUSE=1 FABLECUT_ENABLE_AUDIO_ONLY=1 /usr/bin/node server.js
