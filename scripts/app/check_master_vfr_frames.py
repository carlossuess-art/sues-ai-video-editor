#!/usr/bin/env python3
"""Auditable low-resolution decoded-frame correspondence, not creative approval."""
import argparse, bisect, hashlib, json, os, statistics, sys

def digest(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1048576),b''):h.update(chunk)
    return h.hexdigest()

def inspect(source_raw, derived_raw, pts, expected_target_frames, width=54, height=96):
    size=width*height
    a=open(source_raw,'rb').read();b=open(derived_raw,'rb').read()
    if not a or not b or len(a)%size or len(b)%size or len(a)//size!=len(pts) or len(b)//size!=expected_target_frames:
        return {'status':'BLOCKED_INCOMPLETE_VIDEO_EVIDENCE'}
    if any(not isinstance(x,(int,float)) or x<0 or (i and x<=pts[i-1]) for i,x in enumerate(pts)):
        return {'status':'BLOCKED_INVALID_SOURCE_PTS'}
    mapping=[]; errors=[]; margins=[]; temporal=[]
    for n in range(len(b)//size):
        t=n/30; near=bisect.bisect_left(pts,t)
        options=range(max(0,near-3),min(len(pts),near+4))
        target=b[n*size:(n+1)*size:16]
        scored=[]
        for i in options:
            image=a[i*size:(i+1)*size:16]
            sad=sum(abs(x-y) for x,y in zip(target,image))/len(target)
            scored.append((sad,abs(t-pts[i]),i))
        scored.sort()
        sad,_,chosen=scored[0]
        mapping.append(chosen);errors.append(sad)
        temporal.append(t-pts[chosen])
        margins.append(scored[1][0]-sad if len(scored)>1 else 0)
    order_ok=all(right>=left for left,right in zip(mapping,mapping[1:]))
    acceptable=order_ok and max(errors)<4 and statistics.mean(errors)<2 and max(abs(x) for x in temporal)<.15
    return {'status':'FRAME_CORRESPONDENCE_PASS_LOW_RES_NOT_APPROVAL' if acceptable else 'BLOCKED_FRAME_CORRESPONDENCE',
            'sourceFrames':len(pts),'targetFrames':len(mapping),'mapping':mapping,
            'meanSampledPixelError':round(statistics.mean(errors),4),
            'maxSampledPixelError':round(max(errors),4),'minNextBestMargin':round(min(margins),4),
            'maxTemporalOffsetMs':round(max(abs(x) for x in temporal)*1000,3),
            'monotone':order_ok,'downscaledWidth':width,'downscaledHeight':height,'pixelStride':16}

if __name__=='__main__':
    p=argparse.ArgumentParser()
    for name in ('source_video','derived_video','source_raw','derived_raw','source_pts','output_manifest'):
        p.add_argument(name)
    p.add_argument('--source-duration',type=float,required=True)
    args=p.parse_args()
    pts=[float(x['best_effort_timestamp_time']) for x in json.load(open(args.source_pts))['frames']]
    result=inspect(args.source_raw,args.derived_raw,pts,round(args.source_duration*30))
    doc={'schema':'sues-vfr-derived-evidence/v1','approved':False,'creativeAccepted':False,
         'originalSha256':digest(args.source_video),'derivedSha256':digest(args.derived_video),
         'originalDecodedLowResSha256':digest(args.source_raw),'derivedDecodedLowResSha256':digest(args.derived_raw),
         'sourcePtsSha256':digest(args.source_pts),**result,
         'missingForExecution':['REGISTER_EXPLICIT_DERIVATION','REVIEW_SOURCE_AND_PLAN','NEW_APPROVAL','FULL_AV_QA']}
    doc['evidenceFingerprint']=hashlib.sha256(json.dumps(doc,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    with open(args.output_manifest,'x') as f:json.dump(doc,f,indent=2)
    summary={k:v for k,v in doc.items() if k!='mapping'}
    print(json.dumps(summary,indent=2))
    sys.exit(0 if result['status']=='FRAME_CORRESPONDENCE_PASS_LOW_RES_NOT_APPROVAL' else 2)