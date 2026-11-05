#!/usr/bin/env bash
set -euo pipefail
ROOT=/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta
V5=/tmp/sues-158404-v5-20261105/experiments/remotion-cta/out/v5
BASE="$ROOT/out/SUES_158404_V4B_DESDE_ORIGINAL_RECONSTRUIDO_PREVIEW720_20261104.mp4"
FIRST="$V5/board-rules-v2-146f.mp4"
SECOND="$V5/board-choice-236f.mp4"
OUTPUT="$V5/SUES_158404_V5B_ANTRACITA_PREVIEW720_20261105.mp4"
FF="/usr/bin/ffmpeg"
PROBE="$ROOT/node_modules/@remotion/compositor-linux-x64-gnu/ffprobe"
for spec in "$BASE:2230" "$FIRST:146" "$SECOND:236";do
 file="${spec%:*}";expected="${spec##*:}"
 test -s "$file"
 found=$("$PROBE" -v error -select_streams v:0 -show_entries stream=nb_frames -of default=nw=1:nk=1 "$file")
 test "$found" = "$expected" || { echo "FAIL_FRAMES $file $found != $expected"; exit 1; }
 echo "VERIFIED_INPUT_FRAMES:$expected:$(basename "$file")"
done
test ! -e "$OUTPUT" || { echo 'REFUSE_OVERWRITE';exit 1; }
"$FF" -nostdin -hide_banner -v error -threads 1 -filter_complex_threads 1 -i "$BASE" -i "$FIRST" -i "$SECOND" \
-filter_complex "[0:v]split=3[bs0][bs1][bs2];[bs0]trim=start_frame=0:end_frame=231,setpts=PTS-STARTPTS[v0];[1:v]setpts=PTS-STARTPTS[v1];[bs1]trim=start_frame=377:end_frame=1002,setpts=PTS-STARTPTS[v2];[2:v]setpts=PTS-STARTPTS[v3];[bs2]trim=start_frame=1238:end_frame=2230,setpts=PTS-STARTPTS[v4];[v0][v1][v2][v3][v4]concat=n=5:v=1:a=0,format=yuv420p[vout]" \
-map '[vout]' -map '0:a:0' -c:v libx264 -threads:v 1 -preset veryfast -crf 20 -c:a copy -movflags +faststart -vsync cfr "$OUTPUT"
test -s "$OUTPUT"
frames=$("$PROBE" -v error -select_streams v:0 -show_entries stream=nb_frames -of default=nw=1:nk=1 "$OUTPUT")
duration=$("$PROBE" -v error -show_entries format=duration -of default=nw=1:nk=1 "$OUTPUT")
echo "FINAL_FRAMES:$frames FINAL_DURATION:$duration"
test "$frames" = 2230
echo 'V5_REVIEW_ASSEMBLED'
sha256sum "$OUTPUT"
