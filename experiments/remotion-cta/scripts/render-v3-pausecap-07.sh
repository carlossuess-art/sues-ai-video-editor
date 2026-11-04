#!/usr/bin/env bash
set -euo pipefail
R=/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta
OUT="$R/out"; DIR=v3-drafts-20261104
SOURCE=SUES_158404_V3_REGLAS_158623_BORRADOR_PRIVADO_20261104.mp4
TARGET=SUES_158404_V3C_SILENCIOS_MAX_07_20261104.mp4
test -s "$OUT/$SOURCE"; test -s "$OUT/$DIR/pause-cap-07-filter.txt"
test ! -e "$OUT/$TARGET" || { echo "TARGET_ALREADY_EXISTS_KEPT_INTACT"; exit 1; }
echo "RENDER_PAUSE_CAPPED_START $(date -u +%FT%TZ)"
docker run --rm --network none --user 0:0 --read-only --cap-drop ALL --security-opt no-new-privileges --pids-limit 128 --memory 1700m --cpus 0.85 --tmpfs /tmp:rw,nosuid,size=90m --mount "type=bind,src=$OUT,dst=/render" --workdir /render sha256:5b39ca522b4d0758a62a439dd8b2312832fa2baf9f68c97df88da3239ac1e5eb \
 ffmpeg -nostdin -hide_banner -n -v warning -stats -threads 1 -filter_threads 1 -i "$SOURCE" \
 -filter_complex_script "$DIR/pause-cap-07-filter.txt" -map "[vout]" -map "[aout]" \
 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 -threads 1 \
 -c:a aac -b:a 160k -movflags +faststart "$TARGET"
test -s "$OUT/$TARGET"
echo "RENDER_PAUSE_CAPPED_COMPLETE $(date -u +%FT%TZ)"
ls -lh "$OUT/$TARGET"
