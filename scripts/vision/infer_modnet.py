#!/usr/bin/env python3
"""Bounded offline MODNet evaluation. No downloads, training or API calls.
Run in a CPU/memory-limited process with the existing ONNX Runtime environment.
Input RGB frames must already use the exact compiled camera and edit timeline.
"""
import argparse,hashlib,json,os,time,resource
from pathlib import Path
os.environ.setdefault("OMP_NUM_THREADS","1")
import numpy as np
import onnxruntime as ort
MODEL_SHA256="07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9"
def digest(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""): h.update(b)
    return h.hexdigest()
def infer(model,input_path,manifest,out):
    # JSON is a binding record, not executable instructions or remote URLs.
    if manifest.get("schema")!="sues-camera-frames/v1": raise ValueError("camera frame manifest required")
    for key in ("sourceSha256","cameraSpaceSha256","rgbSha256"):
        value=manifest.get(key)
        if not isinstance(value,str) or len(value)!=64 or any(c not in "0123456789abcdef" for c in value): raise ValueError("invalid SHA binding")
    if digest(model)!=MODEL_SHA256 or digest(input_path)!=manifest["rgbSha256"]: raise ValueError("model or input changed")
    frames,start,count=manifest["frames"],manifest["activeStartFrame"],manifest["activeFrames"]
    if any(type(v)!=int for v in (frames,start,count)) or not 1<=frames<=1800 or not 1<=count<=90 or start<0 or start+count>frames: raise ValueError("frame budget exceeded")
    if (manifest.get("width"),manifest.get("height"),manifest.get("fps"))!=(512,896,30): raise ValueError("unsupported geometry")
    size=512*896*3
    if input_path.stat().st_size!=count*size: raise ValueError("RGB frame count mismatch")
    out.mkdir(mode=0o700,parents=True,exist_ok=False)
    opts=ort.SessionOptions();opts.intra_op_num_threads=1;opts.inter_op_num_threads=1
    session=ort.InferenceSession(str(model),opts,providers=["CPUExecutionProvider"])
    started=time.perf_counter();cpu=time.process_time();areas=[];zero=bytes(512*896)
    target=out/"timeline-mask.gray"
    with input_path.open("rb") as inp,target.open("xb") as mask:
        for _ in range(start):mask.write(zero)
        for i in range(count):
            if time.perf_counter()-started>300:raise TimeoutError("study inference time budget exceeded")
            im=np.frombuffer(inp.read(size),np.uint8).reshape(896,512,3)
            x=np.transpose((im.astype(np.float32)-127.5)/127.5,(2,0,1))[None]
            a=session.run(None,{"input":x})[0][0,0]
            if not np.isfinite(a).all():raise ValueError("nonfinite matte")
            a=np.clip(a,0,1);area=float((a>.5).mean())
            if not .03<area<.95:raise ValueError("implausible foreground area; not a quality approval")
            mask.write((a*255).astype(np.uint8).tobytes());areas.append(area)
            if i%15==0: print(json.dumps({"frame":start+i,"elapsed":time.perf_counter()-started}),flush=True)
        for _ in range(frames-start-count):mask.write(zero)
    result={**manifest,"schema":"sues-matte-inference/v1","method":"modnet-onnx-cpu","modelSha256":MODEL_SHA256,"license":"Apache-2.0",
        "duration":frames/30,"inferredFrames":count,"wallSeconds":time.perf_counter()-started,"cpuSeconds":time.process_time()-cpu,
        "peakRssKiB":resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,"areaMin":min(areas),"areaMax":max(areas),
        "matteRawSha256":digest(target),"humanReview":"pending","externalSpendEUR":0}
    (out/"inference-result.json").write_text(json.dumps(result,indent=2))
    return result
if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    for key in ("model","input","manifest","out"):p.add_argument("--"+key,required=True,type=Path)
    a=p.parse_args()
    print(json.dumps(infer(a.model,a.input,json.loads(a.manifest.read_text()),a.out)),flush=True)