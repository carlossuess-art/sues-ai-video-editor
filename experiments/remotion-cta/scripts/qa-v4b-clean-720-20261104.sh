#!/usr/bin/env bash
set -euo pipefail
R=/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta
OUT="$R/out"
QA="$OUT/v4-rebuild-20261104/final-qa"
FILE=SUES_158404_V4B_DESDE_ORIGINAL_RECONSTRUIDO_PREVIEW720_20261104.mp4
PROBE="$R/node_modules/@remotion/compositor-linux-x64-gnu/ffprobe"
IMAGE=sha256:5b39ca522b4d0758a62a439dd8b2312832fa2baf9f68c97df88da3239ac1e5eb
test -s "$OUT/$FILE"
mkdir -p "$QA/1fps" "$QA/4fps"
"$PROBE" -v error -show_entries stream=codec_name,codec_type,width,height,avg_frame_rate,nb_frames -show_entries format=duration,size -of compact "$OUT/$FILE" > "$QA/ffprobe.txt"
grep -q 'nb_frames=2230' "$QA/ffprobe.txt"
docker run --rm --network none --user 0:0 --read-only --cap-drop ALL --security-opt no-new-privileges --memory 850m --cpus 0.9 --tmpfs /tmp:rw,nosuid,size=50m --mount "type=bind,src=$OUT,dst=/render" --workdir /render "$IMAGE" ffmpeg -nostdin -hide_banner -v error -xerror -i "$FILE" -map 0:v:0 -map 0:a:0 -f null - > "$QA/complete-decode.log" 2>&1
test ! -s "$QA/complete-decode.log" || { cat "$QA/complete-decode.log"; exit 1; }
for fps in 1 4; do
 docker run --rm --network none --user 0:0 --read-only --cap-drop ALL --security-opt no-new-privileges --memory 750m --cpus 0.9 --tmpfs /tmp:rw,nosuid,size=45m --mount "type=bind,src=$OUT,dst=/render" --workdir /render "$IMAGE" ffmpeg -nostdin -hide_banner -y -v error -i "$FILE" -vf "fps=$fps,scale=180:320" -q:v 4 "v4-rebuild-20261104/final-qa/${fps}fps/frame_%04d.jpg"
 docker run --rm --network none --user 0:0 --read-only --cap-drop ALL --security-opt no-new-privileges --memory 650m --cpus 0.9 --tmpfs /tmp:rw,nosuid,size=45m --mount "type=bind,src=$OUT,dst=/render" --workdir /render "$IMAGE" ffmpeg -nostdin -hide_banner -y -v error -framerate "$fps" -i "v4-rebuild-20261104/final-qa/${fps}fps/frame_%04d.jpg" -vf 'tile=4x5:padding=6:margin=6:color=black' -vsync vfr -q:v 4 "v4-rebuild-20261104/final-qa/${fps}fps/sheet_%02d.jpg"
 echo "QA_${fps}fps_COUNT:$(find "$QA/${fps}fps" -name 'frame_*.jpg' | wc -l)"
done
python3 - <<PY
from pathlib import Path
q=Path("$QA")
a=len(list((q/'1fps').glob('frame_*.jpg')))
b=len(list((q/'4fps').glob('frame_*.jpg')))
assert a in (74,75),a
assert b in (297,298),b
print("QA_FRAME_SAMPLING_PASS",a,b)
PY
echo "FILE_SHA256";sha256sum "$OUT/$FILE"
echo "QA_DECODE_AND_CONTACTS_READY"
