import json,time,urllib.request,pathlib,subprocess,hashlib,urllib.parse,sys
root=pathlib.Path('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122')
out=root/'pixel-service-e2e.json'
base='http://127.0.0.1:18156'
def call(url,method='GET',body=None):
 d=json.dumps(body).encode() if body is not None else None
 req=urllib.request.Request(base+url,data=d,method=method,headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=35) as r:return json.load(r)
started=time.monotonic();job=None
try:
 p=call('/api/project');c=next(c for c in p['clips'] if c['id']=='SC08-QUESTION')
 c['props']['text']='SUES Q03 · INTEGRACIÓN PRIVADA VALIDADA'
 p['revision']=int(p.get('revision',0))+1
 saved=call('/api/project','PUT',p)
 job=call('/api/export/request','POST',{'where':'headless','range':'entire','segmented':True,'expectedRevision':p['revision']})
 print('START',job['id'],flush=True)
 for n in range(250):
  j=call('/api/export/job?id='+job['id'])
  if n%5==0 or j['status'] in ('done','failed','cancelled'):
   info={'status':j['status'],'percent':round(100*float(j.get('progress') or 0),1),'elapsed':round(time.monotonic()-started,1),'error':j.get('error'),'src':j.get('src')}
   out.write_text(json.dumps(info,indent=2));print('UPDATE',json.dumps(info),flush=True)
  if j['status'] in ('done','failed','cancelled'):break
  time.sleep(.8)
 if j['status']!='done':raise RuntimeError('export '+j['status']+': '+str(j.get('error')))
 f=root/'data/exports'/urllib.parse.unquote(j['src'].rsplit('/',1)[-1])
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,codec_type,nb_frames,width,height:format=duration,size','-of','json',str(f)],timeout=40))
 video=next(x for x in probe['streams'] if x['codec_type']=='video')
 audio=next(x for x in probe['streams'] if x['codec_type']=='audio')
 info.update({'pass':video['nb_frames']=='1667' and video['codec_name']=='h264' and audio['codec_name']=='aac','sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size})
 out.write_text(json.dumps(info,indent=2));print('FINAL',json.dumps(info),flush=True)
 if not info['pass']:sys.exit(3)
except Exception as e:
 if job and job.get('id'):
  try:call('/api/export/job/cancel?id='+job['id'],'POST')
  except Exception:pass
 out.write_text(json.dumps({'status':'error','error':str(e),'elapsed':round(time.monotonic()-started,2)},indent=2))
 print('ERROR',repr(e),flush=True);sys.exit(2)
