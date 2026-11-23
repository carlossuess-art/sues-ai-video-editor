#!/bin/bash
set -euo pipefail
R=/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122
V="$R/data/exports/SUES_export_xs_24bee36ef0c9.mp4"
A="$R/data/exports/SUES_fullmix_x_b5zsjd94.wav"
HD="$R/data/exports/SUES_Q03_IDENTIDAD_SONORA_rev38_HD.mp4"
PV="$R/data/exports/SUES_Q03_IDENTIDAD_SONORA_rev38_540x960_15fps.mp4"
REPORT="$R/data/analysis/q03-musical-identity-r39-render.json"
validate(){
 python3 - "$R/data/project.json" "$R/data/analysis/q03-rev36-before-music-identity-r39.json" "$R/data/analysis/q03-music-identity-r39-report.json" <<'PY'
import json,sys
p,b,r=map(lambda z:json.load(open(z)),sys.argv[1:])
assert p['revision']>=37 and b['revision']==36
assert {c['id']:c for c in p['clips'] if c['kind']!='audio'}=={c['id']:c for c in b['clips'] if c['kind']!='audio'}
assert {c['id']:c for c in p['clips'] if c['track']=='A1'}=={c['id']:c for c in b['clips'] if c['track']=='A1'}
assert p['comps']==b['comps']
clips={c['id']:c for c in p['clips']}
for m in r['music']:
 c=clips[m['id']]
 assert c['mediaId']==m['mediaId'] and abs(c['start']-m['start'])<.001 and abs(c['duration']-m['duration'])<.001 and c['keyframes']['volume']==m['keyframes']
assert not (set(r['removedSFX'])&set(clips))
assert set(r['keptSFX']).issubset(clips)
print('AUDIO_AND_VIDEO_SOURCE_PARITY_PASS',p['revision'])
PY
}
validate
test "$(sha256sum "$V" | cut -d' ' -f1)" = 909a4a43457fe5cddd1d0fa6e0db2bd4cd9ac2e7d52245552ee67275c97686a0
test "$(stat -c %s "$A")" -eq 10668848
t0=$(date +%s)
ffmpeg -nostdin -hide_banner -loglevel error -y -threads 1 -i "$V" -i "$A" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -af 'volume=0.92' -movflags +faststart "$HD.partial.mp4"
ffprobe -v error -show_entries stream=codec_name,codec_type,nb_frames,width,height,avg_frame_rate:format=duration,size -of json "$HD.partial.mp4" >"$R/data/analysis/q03-musical-identity-r39-hd-meta.json"
python3 - "$R/data/analysis/q03-musical-identity-r39-hd-meta.json" <<'PY'
import json,sys
o=json.load(open(sys.argv[1]));v=next(x for x in o['streams'] if x['codec_type']=='video');a=next(x for x in o['streams'] if x['codec_type']=='audio')
assert v['codec_name']=='h264' and int(v['nb_frames'])==1667 and v['width']==1080 and v['height']==1920
assert a['codec_name']=='aac' and abs(float(o['format']['duration'])-55.566667)<.08
print('HD_VERIFIED',o['format']['size'])
PY
validate
mv "$HD.partial.mp4" "$HD"
t_hd=$(date +%s)
ffmpeg -nostdin -hide_banner -loglevel error -y -threads 1 -i "$HD" -vf 'fps=15,scale=540:960:flags=fast_bilinear' -c:v libx264 -preset ultrafast -crf 30 -maxrate 1400k -bufsize 2100k -pix_fmt yuv420p -threads:v 1 -c:a aac -b:a 96k -ac 2 -movflags +faststart "$PV.partial.mp4"
ffprobe -v error -show_entries stream=codec_name,codec_type,nb_frames,width,height,avg_frame_rate:format=duration,size -of json "$PV.partial.mp4" >"$R/data/analysis/q03-musical-identity-r39-preview-meta.json"
python3 - "$R/data/analysis/q03-musical-identity-r39-preview-meta.json" <<'PY'
import json,sys
o=json.load(open(sys.argv[1]));v=next(x for x in o['streams'] if x['codec_type']=='video');a=next(x for x in o['streams'] if x['codec_type']=='audio')
assert v['codec_name']=='h264' and int(v['nb_frames'])==834 and v['width']==540 and v['height']==960
assert a['codec_name']=='aac' and abs(float(o['format']['duration'])-55.566667)<.08
print('PREVIEW_VERIFIED',o['format']['size'])
PY
validate
mv "$PV.partial.mp4" "$PV"
python3 - "$HD" "$PV" "$REPORT" <<'PY'
import json,sys,pathlib,hashlib
h,p,o=map(pathlib.Path,sys.argv[1:])
result={'fullHD':h.name,'preview':p.name,'hdBytes':h.stat().st_size,'previewBytes':p.stat().st_size,'hdSha256':hashlib.sha256(h.read_bytes()).hexdigest(),'previewSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'nativeMix':'SUES_fullmix_x_b5zsjd94.wav','visualOriginal':'SUES_export_xs_24bee36ef0c9.mp4','videoFrames':1667,'hd':'1080x1920 30fps','previewProfile':'540x960 15fps','qa':'FFprobe PASS / preservation check PASS'}
o.write_text(json.dumps(result,indent=2))
print(json.dumps(result))
PY
echo "HD_SECONDS=$(($t_hd-$t0)) TOTAL_SECONDS=$(($(date +%s)-$t0))"

