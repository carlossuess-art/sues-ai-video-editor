#!/usr/bin/env python3
"""Offline bounded MODNet portrait-matte CANDIDATE for a source span.
Not Film Director approval, not final temporal matte/feather/tracking QA.
Requires local numpy+onnxruntime and ffmpeg; runs CPU-only with one thread.
"""
import argparse, hashlib, json, os, pathlib, subprocess, sys, time
os.environ['OMP_NUM_THREADS']='1'
import numpy as np
import onnxruntime as ort

def sha(path):
 with open(path,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def run():
 p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--model',required=True);p.add_argument('--output',required=True)
 p.add_argument('--start',required=True,type=float);p.add_argument('--frames',required=True,type=int);p.add_argument('--model-sha256',required=True)
 a=p.parse_args();source=pathlib.Path(a.source);model=pathlib.Path(a.model);out=pathlib.Path(a.output)
 if any(not x.is_absolute() or not x.is_file() or x.is_symlink() for x in [source,model]) or not out.is_absolute() or out.exists() or out.is_symlink() or not out.parent.is_dir():raise ValueError('Absolute regular inputs and a fresh output required')
 if not 1<=a.frames<=120 or not 0<=a.start<=298 or not a.start*30==round(a.start*30):raise ValueError('1–120 frames and frame-aligned start required')
 if len(a.model_sha256)!=64 or sha(model)!=a.model_sha256:raise ValueError('MODNet model SHA mismatch')
 ort.disable_telemetry_events();opts=ort.SessionOptions();opts.intra_op_num_threads=1;opts.inter_op_num_threads=1
 session=ort.InferenceSession(str(model),opts,providers=['CPUExecutionProvider']);name=session.get_inputs()[0].name
 width,height=512,896;size=width*height*3
 decoder=['ffmpeg','-v','error','-nostdin','-ss',str(a.start),'-i',str(source),'-vf','fps=30,scale=512:896:flags=bicubic','-frames:v',str(a.frames),'-pix_fmt','rgb24','-f','rawvideo','pipe:1']
 encoder=['ffmpeg','-v','error','-nostdin','-f','rawvideo','-pix_fmt','gray','-s','512x896','-r','30','-i','pipe:0','-frames:v',str(a.frames),'-c:v','ffv1','-level','3','-threads','1','-y',str(out)]
 start=time.monotonic();dec=subprocess.Popen(decoder,stdout=subprocess.PIPE,stderr=subprocess.PIPE);enc=subprocess.Popen(encoder,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
 cover=[]
 try:
  for i in range(a.frames):
   raw=dec.stdout.read(size)
   if len(raw)!=size:raise RuntimeError('Incomplete source frame')
   rgb=np.frombuffer(raw,dtype=np.uint8).reshape(height,width,3)
   normalized=np.transpose((rgb.astype(np.float32)-127.5)/127.5,(2,0,1))[None]
   alpha=session.run(None,{name:normalized})[0][0,0]
   if alpha.shape!=(height,width) or not np.isfinite(alpha).all():raise RuntimeError('Invalid MODNet output')
   alpha=np.clip(alpha,0,1)
   # No spatial dilation here; preserve native confidence for later QA.
   cover.append(float((alpha>.5).mean()))
   enc.stdin.write(np.rint(alpha*255).astype(np.uint8).tobytes())
  dec.stdout.close();enc.stdin.close()
  if dec.wait(timeout=20)!=0 or enc.wait(timeout=30)!=0:raise RuntimeError('FFmpeg stage failed')
  report={'schema':'sues-modnet-temporal-candidate/v1','status':'CANDIDATE_NOT_VERIFIED','sourceSha256':sha(source),'modelSha256':sha(model),
   'outputSha256':sha(out),'startSeconds':a.start,'durationSeconds':a.frames/30,'fps':30,'frames':a.frames,'width':width,'height':height,
   'coverageMin':min(cover),'coverageMax':max(cover),'elapsedSeconds':round(time.monotonic()-start,2),'limitations':['no matte-edge QA','no perceptual continuity QA','no 1080p composite','not applied to FableCut timeline','not approved']}
  out.with_suffix('.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
 except BaseException:
  dec.kill();enc.kill();dec.wait();enc.wait();out.unlink(missing_ok=True);raise

if __name__=='__main__':run()