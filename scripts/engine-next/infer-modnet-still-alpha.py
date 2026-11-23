#!/usr/bin/env python3
"""Generate one source-bound *candidate* transparent PNG offline from local MODNet.
Do not use as a verified editorial matte or replace source media automatically.
Requires numpy, onnxruntime and ffmpeg; Pillow/OpenCV not needed.

python infer-modnet-still-alpha.py --source /abs/source.jpg --source-sha256 SHA \
  --model /abs/modnet.onnx --model-sha256 SHA --output-dir /abs/fresh-dir
"""
import argparse, hashlib, json, pathlib, subprocess, time, os
os.environ['OMP_NUM_THREADS']='1'
import numpy as np
import onnxruntime as ort

def digest(p):
 with p.open('rb') as fp:return hashlib.file_digest(fp,'sha256').hexdigest()

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--source-sha256',required=True);p.add_argument('--model',required=True);p.add_argument('--model-sha256',required=True);p.add_argument('--output-dir',required=True)
 a=p.parse_args();src=pathlib.Path(a.source);model=pathlib.Path(a.model);dest=pathlib.Path(a.output_dir)
 if not all(x.is_absolute() and x.is_file() and not x.is_symlink() for x in [src,model]):raise ValueError('Source and model must be absolute regular files')
 if not dest.is_absolute() or dest.is_symlink() or dest.exists() or not dest.parent.is_dir():raise ValueError('Output must be a fresh absolute directory')
 if src.suffix.lower() not in ('.png','.jpg','.jpeg') or src.stat().st_size>50*1024*1024 or model.stat().st_size>200*1024*1024:raise ValueError('Unexpected image or model size/type')
 if len(a.source_sha256)!=64 or len(a.model_sha256)!=64 or digest(src)!=a.source_sha256 or digest(model)!=a.model_sha256:raise ValueError('Source/model SHA256 mismatch')
 start=time.monotonic();dest.mkdir(mode=0o750)
 try:
  w,h=512,896
  decode=subprocess.run(['/usr/bin/ffmpeg','-v','error','-i',str(src),'-vf','scale=512:896:flags=bicubic','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],capture_output=True,check=True,timeout=45)
  if len(decode.stdout)!=w*h*3:raise ValueError('Unexpected decoded image size')
  rgb=np.frombuffer(decode.stdout,dtype=np.uint8).reshape(h,w,3)
  ort.disable_telemetry_events();opts=ort.SessionOptions();opts.intra_op_num_threads=1;opts.inter_op_num_threads=1
  session=ort.InferenceSession(str(model),opts,providers=['CPUExecutionProvider']);name=session.get_inputs()[0].name
  normalized=np.transpose((rgb.astype(np.float32)-127.5)/127.5,(2,0,1))[None]
  alpha=session.run(None,{name:normalized})[0][0,0]
  if alpha.shape!=(h,w) or not np.isfinite(alpha).all():raise RuntimeError('Invalid output alpha array')
  alpha=np.clip(alpha,0,1)
  rgba=np.empty((h,w,4),dtype=np.uint8);rgba[:,:,:3]=rgb;rgba[:,:,3]=np.rint(alpha*255).astype(np.uint8)
  png=dest/'modnet-portrait-alpha-CANDIDATE.png'
  subprocess.run(['/usr/bin/ffmpeg','-hide_banner','-v','error','-f','rawvideo','-pix_fmt','rgba','-s','512x896','-i','pipe:0','-frames:v','1','-y',str(png)],input=rgba.tobytes(),capture_output=True,check=True,timeout=45)
  manifest={'schema':'sues-modnet-still-alpha-candidate/v1','status':'NOT_VISUALLY_APPROVED',
  'sourceSha256':a.source_sha256,'modelSha256':a.model_sha256,'outputSha256':digest(png),
  'dimensions':[w,h],'pixelFormat':'rgba','alphaFractionAboveHalf':float((alpha>.5).mean()),
  'elapsedSeconds':round(time.monotonic()-start,2),
  'limitations':['Portrait MODNet can omit people in groups','Human visual review required for hair/arms and group integrity','Original source must be preserved','No timeline write performed']}
  (dest/'manifest.json').write_text(json.dumps(manifest,indent=2))
  print(json.dumps(manifest))
 except BaseException:
  for child in dest.iterdir():
   if child.is_file() and not child.is_symlink():child.unlink()
  dest.rmdir();raise

if __name__=='__main__':main()
