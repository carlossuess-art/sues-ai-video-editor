#!/bin/bash
set -euo pipefail
S=/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122
report="$S/data/analysis/q03-zoom-agua-r37-export.json"
out="$S/data/exports/SUES_Q03_ZOOM_AGUA_preview_rev36_540x960_15fps.mp4"
part="$out.partial.mp4"
verify(){
 python3 - <<'PY'
import json
p=json.load(open('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122/data/project.json'))
assert p['revision']==36
cams=[c for c in p['clips'] if c['id'].startswith('CAM-') and c['kind']=='video']
assert len(cams)==18 and all(c['keyframes']['scale'][-1]['v']>c['keyframes']['scale'][0]['v'] for c in cams)
m=next(c for c in p['clips'] if c['id']=='V12-CELESTIAL')
assert m['mediaId']=='asset-sues-agua-instrumental-user-20261123'
assert round(m['start'],3)==34.533 and round(m['duration'],3)==9.7
assert next(c for c in p['clips'] if c['id']=='SC12-HEART-360-ALPHA')['duration']>1.9
PY
}
verify
src=$(python3 - "$report" <<'PY'
import json,sys
r=json.load(open(sys.argv[1]))
assert r['status']=='done' and r['pass'] and r['frames']==1667
assert r['src'].startswith('/exports/SUES_export_xs_')
print(r['src'].split('/')[-1])
PY
)
src="$S/data/exports/$src";test -f "$src"
t0=$(date +%s)
ffmpeg -nostdin -hide_banner -loglevel error -y -threads 1 -i "$src" -vf 'fps=15,scale=540:960:flags=fast_bilinear' -c:v libx264 -preset ultrafast -crf 30 -maxrate 1400k -bufsize 2100k -pix_fmt yuv420p -threads:v 1 -c:a aac -b:a 96k -ac 2 -movflags +faststart "$part"
verify
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,nb_frames -of compact=p=0 "$part" >"$S/data/analysis/q03-zoom-agua-r37-preview-meta.txt"
grep -q 'width=540|height=960|nb_frames=834' "$S/data/analysis/q03-zoom-agua-r37-preview-meta.txt"
mv "$part" "$out"
echo "PREVIEW_540_SECONDS=$(($(date +%s)-t0))"
stat -c 'PREVIEW_BYTES=%s' "$out"
cat "$S/data/analysis/q03-zoom-agua-r37-preview-meta.txt"
