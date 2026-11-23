#!/bin/bash
set -euo pipefail
S=/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122
report="$S/data/analysis/q03-brain-overlay-r35-export.json"
out="$S/data/exports/SUES_Q03_CEREBROS_preview_rev33_540x960_15fps.mp4"
part="$out.partial.mp4"
verify(){
 python3 - <<'PY'
import json
p=json.load(open('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122/data/project.json'))
assert p['revision']==33
c=next(x for x in p['clips'] if x['id']=='SC01-BRAIN-MIRROR-CHROMA')
assert c['start']==2.4 and c['duration']==1.8 and c['props']['chromaKey']=='#26C73B'
assert abs(next(x for x in p['clips'] if x['id']=='SC01-TITLE')['duration']-(2.4-1/30))<1e-6
PY
}
verify
src=$(python3 - "$report" <<'PY'
import sys,json
r=json.load(open(sys.argv[1]))
assert r['status']=='done' and r['pass'] and r['frames']==1667
print(r['src'].split('/')[-1])
PY
)
src="$S/data/exports/$src"; test -f "$src"
t0=$(date +%s)
ffmpeg -nostdin -hide_banner -loglevel error -y -threads 1 -i "$src" -vf 'fps=15,scale=540:960:flags=fast_bilinear' -c:v libx264 -preset ultrafast -crf 30 -maxrate 1400k -bufsize 2100k -pix_fmt yuv420p -threads:v 1 -c:a aac -b:a 96k -ac 2 -movflags +faststart "$part"
verify
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,nb_frames -of compact=p=0 "$part" >"$S/data/analysis/q03-brains-preview-metadata.txt"
grep -q 'width=540|height=960' "$S/data/analysis/q03-brains-preview-metadata.txt"
mv "$part" "$out"
echo "PREVIEW_SEC=$(($(date +%s)-t0))"
stat -c 'PREVIEW_BYTES=%s' "$out"
cat "$S/data/analysis/q03-brains-preview-metadata.txt"
