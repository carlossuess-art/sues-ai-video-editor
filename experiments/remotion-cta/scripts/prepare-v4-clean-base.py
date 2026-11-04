#!/usr/bin/env python3
import json, pathlib
root=pathlib.Path('/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta')
manifest=json.loads((root/'out/v3-drafts-20261104/pause-cap-07-manifest.json').read_text())
cuts=manifest['cuts'];source_frames=1953;target_frames=2230
ranges=[];prev=0
for cut in cuts:
 a=round(cut['start']*30);b=round(cut['end']*30)
 if a>=source_frames:break
 if a>prev:ranges.append((prev,a))
 prev=min(b,source_frames)
if prev<source_frames:ranges.append((prev,source_frames))
source_remaining=sum(b-a for a,b in ranges)
cta_frames=target_frames-source_remaining
assert source_remaining==1900,(source_remaining,ranges)
assert cta_frames==330
filters=[]
for i,(a,b) in enumerate(ranges):
 filters.append(f'[0:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{i}]')
n=len(ranges)
filters.append(f'color=c=0x0E151C:s=1080x1920:r=30:d={cta_frames/30:.6f},format=yuv420p[v{n}]')
filters.append(''.join(f'[v{i}]' for i in range(n+1))+f'concat=n={n+1}:v=1:a=0,format=yuv420p[vout]')
out=root/'out/v4-rebuild-20261104'
out.mkdir(parents=True,exist_ok=True)
(out/'clean-base-filter.txt').write_text(';\n'.join(filters)+'\n')
info={'sourceFrames':source_frames,'keptSourceFrames':source_remaining,'ctaFrames':cta_frames,'totalFrames':target_frames,'ranges':ranges,'cuts':cuts,'source':'original clean source-cfr30.mp4 (not V2B or V3C video)','cta':'new custom motion graphics; reuse V3C audio only','durationSeconds':target_frames/30}
(out/'base-manifest.json').write_text(json.dumps(info,indent=2)+'\n')
print(json.dumps(info,indent=2))
