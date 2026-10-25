"""Derived camera-space alpha cache for the existing FFmpeg executor.
No source/plan mutation. CPU-only pretrained MODNet; maximum 90 inferred frames.
"""
from pathlib import Path
import hashlib,json,os,subprocess,tempfile,shutil,time,uuid,sys
MODEL_SHA="07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9"
def digest(p):
    with Path(p).open("rb") as f:return hashlib.file_digest(f,"sha256").hexdigest()
def prepare_mask(source,bundle,request,progress):
    model=Path(request["runtime"]["modelFile"]);runtime=Path(request["runtime"]["runtimeDirectory"]);cache=Path(request["runtime"]["cacheDirectory"])
    if digest(model)!=MODEL_SHA:raise ValueError("MODNet model changed")
    first,count,total=request["startFrame"],request["activeFrames"],request["frames"]
    if any(type(x)!=int for x in [first,count,total]) or first<0 or not 30<=count<=90 or first+count>total or not 1<=total<=3600:raise ValueError("matte inference budget")
    binding={k:request[k] for k in ["sourceSha256","cameraSpaceSha256","startFrame","activeFrames","frames"]}
    binding.update(modelSha256=MODEL_SHA,onnxruntime="1.31.0",numpy="2.4.6")
    key=hashlib.sha256(json.dumps(binding,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    target=cache/key
    def status(stage,fraction):
        value={"stage":stage,"fraction":fraction,"at":int(time.time()*1000)}
        tmp=progress.with_suffix(".tmp");tmp.write_text(json.dumps(value));tmp.replace(progress)
    def cached():
        if target.is_symlink():raise ValueError("invalid matte cache link")
        meta=json.loads((target/"manifest.json").read_text())
        path=target/"mask.mkv"
        if meta["binding"]!=binding or not path.is_file() or path.is_symlink() or digest(path)!=meta["matteSha256"]:raise ValueError("matte cache changed")
        return path,meta
    if target.exists():
        path,meta=cached();status("model-ready",1)
        return path,{**meta,"cacheHit":True}
    started=time.perf_counter();cpu=time.process_time()
    work=Path(tempfile.mkdtemp(prefix=".matte-",dir=cache));encoder=None
    try:
        status("camera-analysis",0)
        raw=work/"active.rgb";graph=work/"camera.ffscript"
        graph.write_text((bundle/"camera.ffscript").read_text().rstrip()+";\n[camera]trim=start_frame=%d:end_frame=%d,setpts=PTS-STARTPTS,scale=512:896:flags=area,format=rgb24[modelinput]\n"%(first,first+count))
        with (work/"extract.log").open("w") as log:
            subprocess.run(["ffmpeg","-v","error","-threads","2","-filter_complex_threads","1","-i",str(source),"-filter_complex_script",str(graph),"-map","[modelinput]","-frames:v",str(count),"-pix_fmt","rgb24","-f","rawvideo",str(raw)],stdout=log,stderr=log,check=True,timeout=180)
        if raw.stat().st_size!=count*512*896*3:raise ValueError("camera-space frame count")
        sys.path.insert(0,str(runtime))
        import numpy as np
        import onnxruntime as ort
        if (np.__version__,ort.__version__)!=("2.4.6","1.31.0"):raise ValueError("unverified visual runtime")
        ort.disable_telemetry_events()
        opts=ort.SessionOptions();opts.intra_op_num_threads=1;opts.inter_op_num_threads=1
        session=ort.InferenceSession(str(model),opts,providers=["CPUExecutionProvider"])
        matte=work/"mask.mkv";zero=bytes(512*896);areas=[]
        with (work/"encode.log").open("w") as log,raw.open("rb") as inp:
            encoder=subprocess.Popen(["ffmpeg","-v","error","-threads","1","-f","rawvideo","-pixel_format","gray","-video_size","512x896","-framerate","30","-i","pipe:0","-frames:v",str(total),"-c:v","ffv1","-level","3","-g","1","-threads","1",str(matte)],stdin=subprocess.PIPE,stdout=log,stderr=log)
            for _ in range(first):encoder.stdin.write(zero)
            for i in range(count):
                if time.perf_counter()-started>360:raise TimeoutError("matte processing time budget")
                im=np.frombuffer(inp.read(512*896*3),np.uint8).reshape(896,512,3)
                x=np.transpose((im.astype(np.float32)-127.5)/127.5,(2,0,1))[None]
                a=session.run(None,{"input":x})[0][0,0]
                if not np.isfinite(a).all():raise ValueError("nonfinite alpha")
                a=np.clip(a,0,1);area=float((a>.5).mean())
                if not .03<area<.95:raise ValueError("foreground area invalid; source preserved")
                encoder.stdin.write((a*255).astype(np.uint8).tobytes());areas.append(area)
                if i%10==0:status("person-matting",(i+1)/count)
            for _ in range(total-first-count):encoder.stdin.write(zero)
            encoder.stdin.close()
            if encoder.wait(timeout=60)!=0:raise ValueError("matte encoding failed")
        meta={"schema":"sues-derived-matte/v1","binding":binding,"matteSha256":digest(matte),"inferredFrames":count,"wallSeconds":time.perf_counter()-started,"pythonCpuSeconds":time.process_time()-cpu,"areaMin":min(areas),"areaMax":max(areas),"reviewStatus":"predicted-unreviewed","externalCostUSD":0}
        (work/"manifest.json").write_text(json.dumps(meta,indent=2))
        raw.unlink();graph.unlink()
        # Cache contains only derived alpha and audit; no raw frames are retained.
        (work/"extract.log").unlink();(work/"encode.log").unlink()
        if target.exists():
            shutil.rmtree(work);path,meta=cached()
        else:
            work.rename(target);path=target/"mask.mkv"
        status("model-ready",1)
        return path,{**meta,"cacheHit":False}
    finally:
        if encoder and encoder.poll() is None:encoder.kill();encoder.wait()
        if work.exists():shutil.rmtree(work)
