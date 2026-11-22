import subprocess,json,time,pathlib,sys
root=pathlib.Path('/opt/sues-secure-headless-qa-20261122')
stage=root/'q03-integrated-stage-20261122'
a=stage/'data/exports/SUES_export_xs_33a6a5c1aaa3.mp4'
b=stage/'data/exports/SUES_export_xs_c98010508888.mp4'
def decode(p):
 c=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(p),
 '-map','0:v:0','-an','-f','framemd5','-'],capture_output=True,text=True,timeout=125)
 return c.returncode,[s.rsplit(',',1)[-1].strip() for s in c.stdout.splitlines() if s and not s.startswith('#')],c.stderr[-1000:]
t=time.monotonic();sa,x,ea=decode(a);sb,y,eb=decode(b)
outside=sum(z==w for i,(z,w) in enumerate(zip(x,y)) if i<900 or i>=1080)
changed=sum(z!=w for i,(z,w) in enumerate(zip(x,y)) if 900<=i<1080)
report={'pass':sa==sb==0 and len(x)==len(y)==1667 and outside==1487 and changed>0,
 'sourceFrames':len(x),'outputFrames':len(y),'unchangedExact':outside,'changedFrames':changed,
 'errors':(ea+eb).strip(),'seconds':round(time.monotonic()-t,2)}
(stage/'pixel-service-frame-parity.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report),flush=True)
sys.exit(0 if report['pass'] else 3)
