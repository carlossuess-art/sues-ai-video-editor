import json,copy,urllib.request,pathlib
root=pathlib.Path('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122')
u='http://127.0.0.1:18156/api/project'
def get():
 with urllib.request.urlopen(u,timeout=20) as r:return json.load(r),r.headers.get('X-FableCut-Project')
before,pid=get()
assert before['revision']==31
target=next(c for c in before['clips'] if c['id']=='V5-SC08-CAP02-0')
assert target['start']==33.96666666666667 and target['duration']==0.9 and target['props']['opacity']==1
title=next(c for c in before['clips'] if c['id']=='SC08-QUESTION')
telescope=next(c for c in before['clips'] if c['id']=='SC08-TELESCOPE')
assert title['props']['text']=='EL\nOBSERVADOR'
data=root/'data/project.json'
raw=data.read_bytes()
assert json.loads(raw)==before
backup=root/'data/analysis/q03-rev31-before-caption-hide.json'
backup.write_bytes(raw);backup.chmod(0o600)
after=copy.deepcopy(before)
next(c for c in after['clips'] if c['id']=='V5-SC08-CAP02-0')['props']['opacity']=0
after['revision']=32
assert next(c for c in after['clips'] if c['id']=='SC08-TELESCOPE')==telescope
assert next(c for c in after['clips'] if c['id']=='SC08-QUESTION')==title
for a,b in zip(before['clips'],after['clips']):
 if a['id']!='V5-SC08-CAP02-0':assert a==b
assert before['media']==after['media'] and before['comps']==after['comps']
req=urllib.request.Request(u,method='PUT',data=json.dumps(after,ensure_ascii=False,separators=(',',':')).encode(),headers={'Content-Type':'application/json','X-FableCut-Project':pid or ''})
with urllib.request.urlopen(req,timeout=30) as r:receipt=json.load(r)
assert receipt.get('ok') and receipt.get('revision')==32,receipt
saved,_=get();assert saved==after
print(json.dumps({'revision':32,'hiddenOnly':'V5-SC08-CAP02-0','start':target['start'],'duration':target['duration'],'telescopeIdentical':True,'reticleUnchanged':True,'title':title['props']['text']}))
