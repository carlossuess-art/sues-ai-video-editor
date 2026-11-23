#!/bin/bash
set -euo pipefail
S=/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122
out="$S/data/exports/SUES_Q03_preview_rev30_540x960_15fps.mp4"
part="$out.partial.mp4"
src="$S/data/exports/SUES_export_xs_3fb17db578c8.mp4"
test "$(sha256sum "$src" | cut -d' ' -f1)" = 8af02aae83be7f2d5f55d82b9d0d661f10a6e4790ef9f0663ee2cc377953193d
test "$(python3 -c 'import json;print(json.load(open("/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122/data/project.json"))["revision"])')" = 30
expected=606e224d88eff2dbd5d3adb8b6841bad57f855df86344e44a455e727d5742ad4
actual=$(python3 - <<'PY2'
import json,hashlib
d=json.load(open("/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122/data/project.json"))
d.pop("revision",None)
print(hashlib.sha256(json.dumps(d,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()).hexdigest())
PY2
)
test "$actual" = "$expected"
start=$(date +%s)
ffmpeg -nostdin -hide_banner -loglevel error -y -threads 1 -i "$src" -vf 'fps=15,scale=540:960:flags=fast_bilinear' -c:v libx264 -preset ultrafast -crf 30 -maxrate 1400k -bufsize 2100k -pix_fmt yuv420p -threads:v 1 -c:a aac -b:a 96k -ac 2 -movflags +faststart "$part"
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,nb_frames -of compact=p=0 "$part" >"$S/data/analysis/q03-preview-540-metadata.txt"
grep -q 'width=540|height=960' "$S/data/analysis/q03-preview-540-metadata.txt"
test "$(python3 -c 'import json;print(json.load(open("/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122/data/project.json"))["revision"])')" = 30
newfinger=$(python3 -c 'import json,hashlib;d=json.load(open("/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122/data/project.json"));d.pop("revision",None);print(hashlib.sha256(json.dumps(d,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()).hexdigest())')
test "$newfinger" = "$expected"
mv "$part" "$out"
echo "PREVIEW_READY_SECONDS=$(($(date +%s)-start))"
stat -c 'PREVIEW_BYTES=%s' "$out"
cat "$S/data/analysis/q03-preview-540-metadata.txt"
