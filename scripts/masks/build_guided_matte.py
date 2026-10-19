#!/usr/bin/env python3
"""Offline assisted rotoscoping; requires optional OpenCV, never downloads weights.
Guides are private polygon keyframes in source pixel coordinates. GrabCut refines
guide frames; optical flow propagates between them. Drift requires corrections.
Outputs are unreviewed until visual QA approves explicit time ranges.
"""
import argparse, hashlib, json, pathlib, subprocess
import cv2
import numpy as np

def sha(path):
    with open(path,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source',required=True,type=pathlib.Path)
    p.add_argument('--guides',required=True,type=pathlib.Path)
    p.add_argument('--out',required=True,type=pathlib.Path)
    args=p.parse_args();source=args.source.resolve(strict=True);g=json.loads(args.guides.read_text())
    if args.out.exists():raise ValueError('Output directory must be new')
    if g['sourceSha256']!=sha(source):raise ValueError('Guides belong to another source')
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(source)]))
    v=next(s for s in info['streams'] if s['codec_type']=='video')
    if (v['width'],v['height'],v['r_frame_rate'])!=(1080,1920,'30/1'):raise ValueError('Full-frame portrait 30fps required')
    keys={round(k['time']*30):k for k in g['keyframes']}
    if 0 not in keys:raise ValueError('Frame-zero guide required')
    args.out.mkdir(mode=0o700);frames=args.out/'frames';frames.mkdir()
    cap=cv2.VideoCapture(str(source));previous=None;alpha=None;coverage=[];n=0
    cv2.setNumThreads(1);cv2.setRNGSeed(20261019)
    # Work at 360x640. Only this offline helper depends on OpenCV.
    width,height=360,640;sx,sy=width/1080,height/1920
    while True:
        ok,frame=cap.read()
        if not ok:break
        im=cv2.resize(frame,(width,height),interpolation=cv2.INTER_AREA);gray=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
        if n in keys:
            points=np.array([[round(x*sx),round(y*sy)] for x,y in keys[n]['points']],np.int32)
            if len(points)<16 or np.any(points<0) or np.any(points[:,0]>=width) or np.any(points[:,1]>=height):raise ValueError('Detailed source contour required')
            seed=np.zeros((height,width),np.uint8);cv2.fillPoly(seed,[points],255)
        else:
            # Current->previous inverse flow samples the previous matte at matching pixels.
            flow=cv2.calcOpticalFlowFarneback(gray,previous,None,.5,3,25,3,5,1.2,0)
            x,y=np.meshgrid(np.arange(width,dtype=np.float32),np.arange(height,dtype=np.float32))
            seed=cv2.remap(alpha,x+flow[:,:,0],y+flow[:,:,1],cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
            seed=np.uint8(seed>=128)*255
        if n not in keys:
            alpha=seed;previous=gray
            full=cv2.resize(alpha,(1080,1920),interpolation=cv2.INTER_LINEAR)
            cv2.imwrite(str(frames/f'{n:05d}.png'),full)
            coverage.append(float(np.mean(seed>0)));n+=1;continue
        erosion=cv2.erode(seed,np.ones((7,7),np.uint8))
        envelope=cv2.dilate(seed,np.ones((11,11),np.uint8))
        labels=np.full(seed.shape,cv2.GC_PR_BGD,np.uint8)
        labels[seed>0]=cv2.GC_PR_FGD;labels[erosion>0]=cv2.GC_FGD;labels[envelope==0]=cv2.GC_BGD
        bg=np.zeros((1,65));fg=np.zeros((1,65))
        cv2.grabCut(im,labels,None,bg,fg,2,cv2.GC_INIT_WITH_MASK)
        raw=np.uint8((labels==cv2.GC_FGD)|(labels==cv2.GC_PR_FGD))*255
        # Keep real holes between fingers/arms. No convex hull or face-box fill.
        alpha=cv2.GaussianBlur(raw,(3,3),.55);previous=gray
        full=cv2.resize(alpha,(1080,1920),interpolation=cv2.INTER_LINEAR)
        cv2.imwrite(str(frames/f'{n:05d}.png'),full)
        coverage.append(float(np.mean(raw>0)));n+=1
    cap.release()
    matte=args.out/'matte.mkv'
    subprocess.run(['ffmpeg','-v','error','-framerate','30','-i',str(frames/'%05d.png'),'-c:v','ffv1','-pix_fmt','gray','-level','3',str(matte)],check=True)
    report={'version':'1.0','sourceSha256':sha(source),'localFile':str(matte.resolve()),'sha256':sha(matte),'method':'guided-grabcut-v1','scope':'full-visible-subject','reviewStatus':'unreviewed','reviewedRanges':[],'width':1080,'height':1920,'fps':30,'duration':n/30,'frames':n,'guideFrames':sorted(keys),'coverageMin':min(coverage),'coverageMax':max(coverage),'automaticPersonDetection':False,'downloadedWeights':False,'externalCostUSD':0}
    (args.out/'matte.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'frames':n,'report':str(args.out/'matte.json')}))
if __name__=='__main__':main()
