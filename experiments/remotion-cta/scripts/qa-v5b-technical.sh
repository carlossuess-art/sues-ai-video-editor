#!/usr/bin/env bash
set -euo pipefail
ORIG=/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta/out/SUES_158404_V4B_DESDE_ORIGINAL_RECONSTRUIDO_PREVIEW720_20261104.mp4
ROOT=/tmp/sues-158404-v5-20261105/experiments/remotion-cta/out/v5
FINAL="$ROOT/SUES_158404_V5B_ANTRACITA_PREVIEW720_20261105.mp4"
mkdir -p "$ROOT/qa"
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,avg_frame_rate,nb_frames -show_entries format=duration,size -of json "$FINAL" > "$ROOT/qa/streams-v5b.json"
ffmpeg -hide_banner -nostdin -v error -xerror -threads 1 -i "$FINAL" -f null - 
echo FULL_DECODE_PASS
ffmpeg -hide_banner -nostdin -v error -i "$ORIG" -map 0:a:0 -c:a copy -f adts "$ROOT/qa/v4b-audio-v5b.aac"
ffmpeg -hide_banner -nostdin -v error -i "$FINAL" -map 0:a:0 -c:a copy -f adts "$ROOT/qa/v5b-audio.aac"
sha256sum "$ROOT/qa/v4b-audio-v5b.aac" "$ROOT/qa/v5b-audio.aac" 
cmp -s "$ROOT/qa/v4b-audio-v5b.aac" "$ROOT/qa/v5b-audio.aac"
echo AUDIO_BITSTREAM_IDENTICAL_PASS
python3 - "$ROOT/qa/streams-v5b.json" <<'PY'
import sys,json
m=json.load(open(sys.argv[1]))
v=next(s for s in m["streams"] if s["codec_type"]=="video")
a=next(s for s in m["streams"] if s["codec_type"]=="audio")
assert (v["codec_name"],v["width"],v["height"],v["avg_frame_rate"],int(v["nb_frames"]))==("h264",720,1280,"30/1",2230),v
assert a["codec_name"]=="aac",a
assert abs(float(m["format"]["duration"])-2230/30)<0.005
print("STREAM_FRAME_DURATION_PASS",v["nb_frames"],m["format"]["duration"])
PY
echo VIDEO_QA_TECHNICAL_PASS
