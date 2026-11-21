#!/usr/bin/env python3
"""Offline quantitative matte temporal stability. No perceptual or creative approval.
Usage: <python with numpy> audit-modnet-continuity.py /abs/mask.mkv /abs/source-report.json /abs/new-output.json
"""
import hashlib,json,os,pathlib,subprocess,sys
import numpy as np

def main():
 if len(sys.argv)!=4:raise ValueError('Expected absolute matte, report and new output paths')
 video,meta_path,out=map(pathlib.Path,sys.argv[1:]);
 if not all(p.is_absolute() for p in (video,meta_path,out)) or out.exists() or not video.is_file() or not meta_path.is_file():raise ValueError('Invalid input/output paths')
 meta=json.loads(meta_path.read_text());
 if meta.get('schema')!='sues-modnet-temporal-candidate/v1' or meta.get('status')!='CANDIDATE_NOT_VERIFIED' or meta.get('width')!=512 or meta.get('height')!=896 or not 1<=meta.get('frames',0)<=120:raise ValueError('Unsupported matte report')
 with video.open('rb') as f:actual=hashlib.file_digest(f,'sha256').hexdigest()
 if actual!=meta['outputSha256']:raise ValueError('Matte hash mismatch')
 count=meta['frames'];width=512;height=896
 proc=subprocess.run(['/usr/bin/ffmpeg','-hide_banner','-v','error','-i',str(video),'-f','rawvideo','-pix_fmt','gray','pipe:1'],capture_output=True,timeout=60,check=True)
 data=np.frombuffer(proc.stdout,dtype=np.uint8)
 if data.size!=count*width*height:raise ValueError('Decoded matte has wrong frame count')
 frames=data.reshape(count,height,width)
 cov=[];cx=[];cy=[];dif=[]
 xx=np.arange(width,dtype=np.float64)/width;yy=np.arange(height,dtype=np.float64)/height
 last=None
 for im in frames:
  a=im.astype(np.float32)/255.0; area=(a>.5)
  if not np.any(area):raise ValueError('Empty matte')
  cov.append(float(area.mean()));ys,xs=np.nonzero(area);cx.append(float(xs.mean()/width));cy.append(float(ys.mean()/height))
  if last is not None:dif.append(float(np.abs(a-last).mean()))
  last=a
 covdiff=np.abs(np.diff(cov));jump=np.sqrt(np.diff(cx)**2+np.diff(cy)**2)
 result={'schema':'sues-modnet-temporal-stability-evidence/v1','status':'QUANTITATIVE_CANDIDATE_NOT_APPROVED',
  'maskSha256':actual,'frames':count,'fps':30,'durationSeconds':count/30,
  'coverageMin':min(cov),'coverageMax':max(cov),'maxAdjacentCoverageDelta':float(covdiff.max()) if len(covdiff) else 0,
  'maxCentroidJumpNormalized':float(jump.max()) if len(jump) else 0,'meanAdjacentAlphaDifference':float(np.mean(dif)) if dif else 0,
  'maxAdjacentAlphaDifference':max(dif) if dif else 0,
  'outlierFrames':[i+1 for i,(d,j) in enumerate(zip(covdiff,jump)) if d>.05 or j>.08],
  'thresholds':{'coverageStep':.05,'centroidJump':.08},
  'humanVisualQA':False,'notes':['No edge-halo analysis','No matte/child occlusion verification','No preview/export parity guarantee','Only numeric stability diagnostics']}
 out.write_text(json.dumps(result,indent=2));print(json.dumps(result))
if __name__=='__main__':main()