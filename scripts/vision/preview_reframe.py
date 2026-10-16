#!/usr/bin/env python3
"""Offline source/conservative/composition comparison. Never imports MediaPipe."""
import argparse,json,subprocess
from pathlib import Path
import cv2
import numpy as np


def crop_at(plan,time):
    k=plan['keyframes']
    if time<=k[0]['time']:return k[0]
    if time>=k[-1]['time']:return k[-1]
    for a,b in zip(k,k[1:]):
        if a['time']<=time<=b['time']:
            f=(time-a['time'])/(b['time']-a['time'])
            return {name:a[name]+(b[name]-a[name])*f for name in ['x','y','width','height']}
    raise ValueError('No interpolation interval')


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('video');p.add_argument('conservative');p.add_argument('composition');p.add_argument('--out',required=True)
    a=p.parse_args();out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True)
    plans=[json.loads(Path(path).read_text())for path in [a.conservative,a.composition]]
    cap=cv2.VideoCapture(a.video);cap.set(cv2.CAP_PROP_ORIENTATION_AUTO,1)
    if not cap.isOpened():raise ValueError('Cannot open source')
    pw,ph,header,fps=288,512,40,24
    proc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','bgr24','-video_size',f'{pw*3}x{ph+header}','-framerate',str(fps),'-i','pipe:0','-i',a.video,'-map','0:v:0','-map','1:a:0?','-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-shortest',str(out)],stdin=subprocess.PIPE)
    count=0;shots={};capture_times=[2,10,20,35]
    try:
        while True:
            ok,frame=cap.read()
            if not ok:break
            time=cap.get(cv2.CAP_PROP_POS_MSEC)/1000
            while time+1e-6>=count/fps:
                t=count/fps;h,w=frame.shape[:2];views=[cv2.resize(frame,(pw,ph))]
                for plan in plans:
                    c=crop_at(plan,t)
                    matrix=np.array([[c['width']/pw,0,c['x']],[0,c['height']/ph,c['y']]],dtype=np.float32)
                    views.append(cv2.warpAffine(frame,matrix,(pw,ph),flags=cv2.INTER_LINEAR|cv2.WARP_INVERSE_MAP,borderMode=cv2.BORDER_REPLICATE))
                canvas=np.zeros((ph+header,pw*3,3),dtype=np.uint8)
                for i,(label,view)in enumerate(zip(['ORIGINAL','CONSERVADOR 1.12x','COMPOSICION 1.40x'],views)):
                    canvas[header:,i*pw:(i+1)*pw]=view
                    cv2.putText(canvas,label,(i*pw+9,24),cv2.FONT_HERSHEY_SIMPLEX,.48,(255,255,255),1,cv2.LINE_AA)
                for st in capture_times:
                    if st not in shots and t>=st:shots[st]=canvas.copy()
                proc.stdin.write(canvas.tobytes());count+=1
    finally:
        cap.release();proc.stdin.close()
    if proc.wait()!=0:raise RuntimeError('Preview encoding failed')
    if shots:cv2.imwrite(str(out.with_suffix('.jpg')),np.concatenate(list(shots.values()),axis=0))
    print(json.dumps({'frames':count,'fps':fps,'duration':count/fps,'output':str(out),'contactSheet':str(out.with_suffix('.jpg'))}))


if __name__=='__main__':main()
