#!/usr/bin/env python3
"""Offline YuNet face/eye landmarks, source-bound and sampled; no identity/emotion inference."""
import argparse,hashlib,json,math,sys,time,resource
from pathlib import Path
MODEL_SHA="8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4"
def analyze(source,model,site,width,height,duration):
    if not math.isfinite(duration) or not 0<duration<=600 or type(width)!=int or type(height)!=int:raise ValueError("source geometry")
    if hashlib.sha256(model.read_bytes()).hexdigest()!=MODEL_SHA:raise ValueError("YuNet hash mismatch")
    sys.path.insert(0,str(site))
    import cv2 as cv
    import numpy as np
    cv.setNumThreads(1)
    cap=cv.VideoCapture(str(source))
    if not cap.isOpened():raise ValueError("video decode unavailable")
    scale=min(1,640/max(width,height));sw,sh=round(width*scale),round(height*scale)
    iw,ih=math.ceil(sw/32)*32,math.ceil(sh/32)*32
    detector=cv.FaceDetectorYN.create(str(model),"",(iw,ih),0.8,0.3,1000)
    frames=[];started=time.perf_counter();cpu=time.process_time();next_time=0
    try:
        while cap.grab():
            if time.perf_counter()-started>180:raise TimeoutError("vision time budget")
            actual=cap.get(cv.CAP_PROP_POS_MSEC)/1000
            if actual+1e-6<next_time:continue
            ok,im=cap.retrieve()
            if not ok:continue
            next_time+=.5
            if im.shape[:2]!=(height,width):raise ValueError("decoded orientation differs from source")
            actual=cap.get(cv.CAP_PROP_POS_MSEC)/1000
            if not math.isfinite(actual) or actual<0 or actual>duration+.05:raise ValueError("invalid decoder timestamp")
            if frames and actual<=frames[-1]["time"]+1e-5:continue
            small=cv.resize(im,(sw,sh),interpolation=cv.INTER_AREA)
            padded=cv.copyMakeBorder(small,0,ih-sh,0,iw-sw,cv.BORDER_CONSTANT,value=(0,0,0))
            _,result=detector.detect(padded);faces=[]
            for row in ([] if result is None else sorted(result,key=lambda r:-float(r[-1]))[:4]):
                x=max(0,min(width,float(row[0])/scale));y=max(0,min(height,float(row[1])/scale))
                right=max(x,min(width,float(row[0]+row[2])/scale));bottom=max(y,min(height,float(row[1]+row[3])/scale))
                if right-x<2 or bottom-y<2:continue
                eye=lambda offset:{"x":max(0,min(width,float(row[offset])/scale)),"y":max(0,min(height,float(row[offset+1])/scale))}
                faces.append({"x":x,"y":y,"width":right-x,"height":bottom-y,"score":max(0,min(1,float(row[-1]))),"rightEye":eye(4),"leftEye":eye(6)})
            frames.append({"time":actual,"frameWidth":width,"frameHeight":height,"faces":faces})
    finally:cap.release()
    if not frames:raise ValueError("no decoded samples")
    with source.open("rb") as f:source_sha=hashlib.file_digest(f,"sha256").hexdigest()
    return {"method":"yunet-opencv-cpu","sourceSha256":source_sha,"modelSha256":MODEL_SHA,"license":"MIT","sampleFps":2,"confidenceThreshold":.8,
        "coverage":{"samples":len(frames),"samplesWithFaces":sum(bool(f["faces"]) for f in frames),"lastSampleTime":frames[-1]["time"],"wholeVideoPixelsReviewed":False},
        "wallSeconds":time.perf_counter()-started,"cpuSeconds":time.process_time()-cpu,"peakRssKiB":resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,"newInference":True,"frames":frames}
if __name__=="__main__":
    p=argparse.ArgumentParser()
    for k in ["source","model","site","out"]:p.add_argument("--"+k,type=Path,required=True)
    p.add_argument("--width",type=int,required=True);p.add_argument("--height",type=int,required=True);p.add_argument("--duration",type=float,required=True)
    a=p.parse_args();r=analyze(a.source,a.model,a.site,a.width,a.height,a.duration)
    with a.out.open("x") as f:json.dump(r,f)
    print(json.dumps({k:v for k,v in r.items() if k!="frames"}))
