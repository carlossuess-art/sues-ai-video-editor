#!/usr/bin/env python3
"""Private B02 temporal-matte continuity audit; NOT artistic segmentation approval.

Measures grayscale source mask at identical target cadence. Does not create
faces, repair the image, infer an individual's identity or edit media.
"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import re
import subprocess

SHA = re.compile(r'[0-9a-f]{64}\Z')

def sha256(path):
    h = hashlib.sha256()
    with open(path,'rb') as f:
        for block in iter(lambda: f.read(1<<20), b''): h.update(block)
    return h.hexdigest()

def frame_metrics(gray,w,h,previous=None,threshold=128):
    if len(gray)!=w*h or w<8 or h<8 or not 0<threshold<256:
        raise ValueError('Invalid grayscale frame, shape, or threshold')
    bits=bytearray(1 if p>threshold else 0 for p in gray)
    mass=sum(bits)
    if not mass: raise ValueError('Matte is empty at this frame')
    coverage=mass/(w*h)
    soft=sum(1 for p in gray if 32<p<223)/(w*h)
    cx=sum(i%w for i,val in enumerate(bits) if val)/mass
    cy=sum(i//w for i,val in enumerate(bits) if val)/mass
    churn=sum(a!=b for a,b in zip(bits,previous))/(w*h) if previous is not None else None
    return {'coverage':coverage,'softEdgeFraction':soft,'centroidX':cx,'centroidY':cy,'changedPixelsFraction':churn},bits

def audit(matte,expected_sha,output,w=128,h=224,frames=120,max_churn=0.06,max_centroid=8.0,max_coverage_delta=0.06):
    matte,output=Path(matte).resolve(),Path(output).resolve()
    if not matte.is_file() or output.exists() or matte==output or not SHA.fullmatch(expected_sha) or sha256(matte)!=expected_sha:
        raise ValueError('Authentic matte SHA and new output path are required')
    if w<8 or h<8 or frames<2 or frames>5000:
        raise ValueError('Invalid mask dimensions / frame count')
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=nb_read_frames,avg_frame_rate','-of','json',str(matte)],timeout=45))['streams'][0]
    if int(probe['nb_read_frames'])!=frames or probe['avg_frame_rate']!='30/1':
        raise ValueError('Matte does not represent precisely the expected 30fps timeline')
    raw=subprocess.check_output(['ffmpeg','-v','error','-nostdin','-i',str(matte),'-vf',f'scale={w}:{h}:flags=bilinear,format=gray','-vsync','0','-f','rawvideo','-pix_fmt','gray','-'],timeout=180)
    if len(raw)!=frames*w*h:raise ValueError('Decoded video is not frame-accurate at expected dimensions')
    result=[];previous=None;prev_metric=None;alerts=[]
    for i in range(frames):
        pixels=raw[i*w*h:(i+1)*w*h]
        m,mask=frame_metrics(pixels,w,h,previous)
        m['index']=i;m['timeSec']=i/30;m['changedCoverage']=abs(m['coverage']-prev_metric['coverage']) if prev_metric else None
        m['centroidJumpPx']=math.hypot(m['centroidX']-prev_metric['centroidX'],m['centroidY']-prev_metric['centroidY']) if prev_metric else None
        if i and (m['changedPixelsFraction']>max_churn or m['centroidJumpPx']>max_centroid or m['changedCoverage']>max_coverage_delta):alerts.append(i)
        result.append(m);previous=mask;prev_metric=m
    data={'schema':'sues-b02-matte-temporal-continuity/v1','status':'TEMPORAL_MATTE_CONTINUITY_TECHNICAL_PASS' if not alerts else 'TEMPORAL_MATTE_CONTINUITY_REVIEW_REQUIRED',
          'sourceSha256':expected_sha,'frames':frames,'fps':30,'evaluationSize':[w,h],
          'threshold':128,'thresholds':{'maxChangedFraction':max_churn,'maxCentroidJumpPx':max_centroid,'maxCoverageDelta':max_coverage_delta},
          'minCoverage':min(x['coverage'] for x in result),'maxCoverage':max(x['coverage'] for x in result),
          'maxChurn':max(x['changedPixelsFraction'] or 0 for x in result),'maxCentroidJumpPx':max(x['centroidJumpPx'] or 0 for x in result),
          'maxCoverageDelta':max(x['changedCoverage'] or 0 for x in result),'alertFrameIndices':alerts,'perFrame':result,
          'artisticApproval':False,'requirementsOutstanding':['Inspect full-resolution hair/hand edges and 1080x1920 temporal halo','Check child group does not occlude the face or hands','Check frame-accurate source and matte time alignment','Check readability of separate title/captions once speech confirmed']}
    with open(output,'x',encoding='utf-8') as f:json.dump(data,f,indent=2);f.write('\n')
    return data

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--matte',required=True)
    p.add_argument('--expected-sha256',required=True)
    p.add_argument('--output',required=True)
    p.add_argument('--frames',type=int,default=120)
    x=p.parse_args();result=audit(x.matte,x.expected_sha256,x.output,frames=x.frames)
    print(json.dumps({k:result[k] for k in ['status','frames','minCoverage','maxCoverage','maxChurn','maxCentroidJumpPx','alertFrameIndices']}))
    if result['alertFrameIndices']: raise SystemExit(2)
if __name__=='__main__':main()
