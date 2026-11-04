#!/usr/bin/env bash
set -euo pipefail
R=/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta
PARTS="$R/out/v4-rebuild-20261104/chunks"
OUT="$R/out"
BASE="$R/out/v4-rebuild-20261104"
FF="$R/node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
PROBE="$R/node_modules/@remotion/compositor-linux-x64-gnu/ffprobe"
FINAL="$OUT/SUES_158404_V4B_DESDE_ORIGINAL_RECONSTRUIDO_PREVIEW720_20261104.mp4"
VIDEOONLY="$BASE/v4b-video-joined-720.mp4"
AUDIO="$OUT/SUES_158404_V3C_SILENCIOS_MAX_07_20261104.mp4"
test -s "$AUDIO"
test ! -e "$FINAL" || { echo "FINAL_EXISTS_NO_OVERWRITE";exit 1; }
test ! -e "$VIDEOONLY" || { echo "VIDEO_INTERMEDIATE_EXISTS_NO_OVERWRITE";exit 1; }
: > "$BASE/concat-list.txt"
all_frames=0
for span in 0-89 90-269 270-449 450-629 630-809 810-989 990-1169 1170-1349 1350-1529 1530-1709 1710-1889 1890-2069 2070-2229; do
 a="${span%-*}"; b="${span#*-}"; file="$PARTS/part-$span.mp4"
 test -s "$file" || { echo "MISSING:$file"; exit 1; }
 count="$("$PROBE" -v error -select_streams v:0 -show_entries stream=nb_frames -of default=nw=1:nk=1 "$file")"
 needed=$((b-a+1))
 test "$count" = "$needed" || { echo "FRAMES_MISMATCH:$span:$count != $needed"; exit 1; }
 printf "file '%s'\n" "$file" >> "$BASE/concat-list.txt"
 all_frames=$((all_frames+needed))
done
test "$all_frames" -eq 2230
"$FF" -hide_banner -nostdin -y -v error -f concat -safe 0 -i "$BASE/concat-list.txt" -c copy -movflags +faststart "$VIDEOONLY"
vcount="$("$PROBE" -v error -select_streams v:0 -show_entries stream=nb_frames -of default=nw=1:nk=1 "$VIDEOONLY")"
test "$vcount" = "2230" || { echo "VIDEO_JOIN_COUNT_FAIL:$vcount"; exit 1; }
"$FF" -hide_banner -nostdin -y -v error -i "$VIDEOONLY" -i "$AUDIO" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 160k -movflags +faststart -shortest "$FINAL"
test -s "$FINAL"
echo "V4B_ASSEMBLED $(date -u '+%FT%TZ')"
"$PROBE" -v error -show_entries stream=codec_name,codec_type,width,height,nb_frames,avg_frame_rate -show_entries format=duration,size,bit_rate -of compact "$FINAL"
sha256sum "$FINAL"
