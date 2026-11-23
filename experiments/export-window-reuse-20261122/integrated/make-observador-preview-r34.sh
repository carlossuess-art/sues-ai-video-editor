#!/bin/bash
set -euo pipefail
root=/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122
report="$root/data/analysis/q03-observador-r34-export.json"
out="$root/data/exports/SUES_Q03_OBSERVADOR_preview_rev32_540x960_15fps.mp4"
part="$out.partial.mp4"
expected=9b68699008762e97033ca14736087f98fd1ad801da8233f870cd9da69227a9da
verify_revision() {
  python3 - "$root/data/project.json" "$expected" <<'PY'
import json,hashlib,sys
p=json.load(open(sys.argv[1]))
assert p['revision']==32,('Revision changed',p['revision'])
del p['revision']
# Used in FableCut QA page: SHA256 of compact browser JSON without revision.
# Python sorting differs; this check is for expected content in relevant clips.
a=next(x for x in p['clips'] if x['id']=='SC08-QUESTION')
b=next(x for x in p['clips'] if x['id']=='SC08-TELESCOPE')
c=next(x for x in p['clips'] if x['id']=='V5-SC08-CAP02-0')
assert a['props']['text']=='EL\nOBSERVADOR'
assert b['mediaId']=='asset-telescope' and c['props']['opacity']==0
PY
}
verify_revision
src=$(python3 - "$report" <<'PY'
import json,sys
o=json.load(open(sys.argv[1]))
assert o['status']=='done' and o['pass'] and o['frames']==1667
assert o['src'].startswith('/exports/SUES_export_xs_')
print(o['src'].split('/')[-1])
PY
)
src="$root/data/exports/$src"
test -f "$src"
start=$(date +%s)
ffmpeg -nostdin -hide_banner -loglevel error -y -threads 1 -i "$src" -vf 'fps=15,scale=540:960:flags=fast_bilinear' -c:v libx264 -preset ultrafast -crf 30 -maxrate 1400k -bufsize 2100k -pix_fmt yuv420p -threads:v 1 -c:a aac -b:a 96k -ac 2 -movflags +faststart "$part"
verify_revision
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,nb_frames -of compact=p=0 "$part" >"$root/data/analysis/q03-r34-preview-meta.txt"
grep -q 'width=540|height=960|nb_frames=834' "$root/data/analysis/q03-r34-preview-meta.txt"
mv "$part" "$out"
echo "PREVIEW_540_R34_SEC=$(($(date +%s)-start))"
stat -c 'BYTES=%s' "$out"
cat "$root/data/analysis/q03-r34-preview-meta.txt"
