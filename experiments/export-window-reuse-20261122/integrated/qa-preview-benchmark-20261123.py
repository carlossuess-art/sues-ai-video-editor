import json,time,urllib.request,pathlib,subprocess,sys
root=pathlib.Path('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122')
base='http://127.0.0.1:18156'
report=root/'data/analysis/q03-preview-preset-benchmark-20261123.json'
start=time.monotonic()
def req(path,method='GET',data=None):
 b=json.dumps(data).encode() if data is not None else None
 h={'Content-Type':'application/json','Origin':'https://studio.suesholistics.com:8443','Host':'studio.suesholistics.com:8443'}
 with urllib.request.urlopen(urllib.request.Request(base+path,data=b,method=method,headers=h),timeout=18) as r:return json.load(r)
rev=req('/api/project')['revision'];print('PROJECT_REV',rev,flush=True)
job=req('/api/export/request','POST',{'where':'headless','range':'entire','preset':'sues-preview'})
print('JOB_ID',job['id'],flush=True)
for tick in range(360):
 j=req('/api/export/job?id='+job['id'])
 if tick%10==0 or j['status'] in ('done','cancelled','failed'):
  out={'status':j['status'],'progress':j.get('progress'),'seconds':round(time.monotonic()-start,1),'job':job['id'],'src':j.get('src'),'error':j.get('error')}
  report.write_text(json.dumps(out,indent=2))
  print('PROGRESS',json.dumps(out),flush=True)
 if j['status'] in ('done','cancelled','failed'):break
 time.sleep(1)
else:raise RuntimeError('preview over 360 seconds')
if j['status']!='done':raise RuntimeError('preview failed: '+str(j))
src=root/'data/exports'/j['src'].split('/')[-1]
p=subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,codec_type,width,height,nb_frames:format=duration,size','-of','json',str(src)],timeout=30)
out.update({'metadata':json.loads(p),'fileBytes':src.stat().st_size,'revisionBefore':rev,'revisionAfter':req('/api/project')['revision']})
report.write_text(json.dumps(out,indent=2))
print('COMPLETE',json.dumps(out),flush=True)
