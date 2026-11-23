import json,copy,urllib.request,pathlib,hashlib
R=pathlib.Path('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122')
url='http://127.0.0.1:18156/api/project'
def get():
 with urllib.request.urlopen(url,timeout=20) as q:return json.load(q),q.headers.get('X-FableCut-Project')
p,pid=get()
assert p['revision']==34 and len(p['clips'])==169,(p.get('revision'),len(p.get('clips',[])))
q=copy.deepcopy(p)
cams=sorted((c for c in q['clips'] if c['kind']=='video' and c['id'].startswith('CAM-')),key=lambda c:c['start'])
report=[]
for cam in cams:
 s=round(float(cam['props']['scale']),8);d=float(cam['duration'])
 # Slow optical push-in, 0.7 percentage points per second, max 4.5%.
 delta=min(0.045,max(0.002,0.007*d))
 target=round(min(1.125,s+delta),6)
 assert target>=s and target<=1.125
 kfs=[{'t':0,'v':s,'ease':'linear'},{'t':d,'v':target,'ease':'linear'}]
 cam['keyframes']=dict(cam.get('keyframes') or {},scale=kfs)
 siblings=[c for c in q['clips'] if c['kind']=='video' and c is not cam and abs(c['start']-cam['start'])<1e-6 and abs(c['duration']-d)<1e-6 and ('-MATTE-CAM-' in c['id'] or '-SUBJECT-CAM-' in c['id'])]
 for sib in siblings:
  initial=round(float(sib['props']['scale']),8)
  diff=initial-s
  sib['keyframes']=dict(sib.get('keyframes') or {},scale=[{'t':0,'v':initial,'ease':'linear'},{'t':d,'v':round(min(1.125,target+diff),6),'ease':'linear'}])
 report.append({'camera':cam['id'],'start':round(cam['start'],3),'end':round(cam['start']+d,3),'scaleStart':s,'scaleEnd':target,'linkedMaskTracks':[x['id'] for x in siblings]})
assert len(report)==18
q['revision']=35
oldids={x['id']:x for x in p['clips']}
changed={c['id'] for c in q['clips'] if c!=oldids[c['id']]}
expected={x['id'] for x in cams}|{i for x in report for i in x['linkedMaskTracks']}
assert changed==expected,(changed^expected)
assert q['media']==p['media'] and q['comps']==p['comps'] and q['tracks']==p['tracks']
backup=R/'data/analysis/q03-before-zoom-r36-rev34.json'
raw=(R/'data/project.json').read_bytes()
assert json.loads(raw)==p
backup.write_bytes(raw)
req=urllib.request.Request(url,method='PUT',data=json.dumps(q,ensure_ascii=False,separators=(',',':')).encode(),headers={'Content-Type':'application/json','X-FableCut-Project':pid or ''})
with urllib.request.urlopen(req,timeout=35) as r:res=json.load(r)
assert res.get('ok') and res.get('revision')==35,res
saved,_=get();assert saved==q
(R/'data/analysis/q03-zoom-r36-report.json').write_text(json.dumps({'revision':35,'cameraCount':len(cams),'changedClips':len(changed),'shots':report},ensure_ascii=False,indent=2))
print(json.dumps({'revision':35,'cameraCount':len(cams),'changedClips':len(changed),'first':report[0],'last':report[-1]},ensure_ascii=False))
