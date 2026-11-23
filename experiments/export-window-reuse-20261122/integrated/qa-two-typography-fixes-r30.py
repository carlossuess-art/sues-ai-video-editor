import json,urllib.request,hashlib,pathlib,sys,copy
root=pathlib.Path('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122')
data=root/'data'
u='http://127.0.0.1:18156/api/project'
def get():
 with urllib.request.urlopen(u,timeout=20) as r:return json.load(r),r.headers.get('X-FableCut-Project')
old,project_id=get()
assert old.get('name')=='SUES QA R14 COMPLETO 55s'
assert old.get('revision')==27,('Concurrent revision!',old.get('revision'))
j=copy.deepcopy(old)
caption=next(c for c in j['comps'] if c['id']=='comp-V5-SC01-CAP04-0')
for word,x in [('V5-W-w012',-220),('V5-W-w013',76)]:
 c=next(c for c in caption['clips'] if c['id']==word)
 assert c['props']['text']==('que' if word.endswith('012') else 'puedes')
 c['props'].update({'x':x,'fontSize':88,'weight':700,'bold':True,'color':'#FFFFFF','textShadow':15,'strokeWidth':4,'strokeColor':'#101010'})
title=next(c for c in j['clips'] if c['id']=='SC08-QUESTION')
assert title['start']==33.96666666666667
assert title['props']['text']=='SUES Q03 · INTEGRACIÓN PRIVADA VALIDADA'
title['props'].update({'text':'INTEGRACIÓN\nPRIVADA','fontSize':100,'x':0,'y':-516,'lineHeight':1.04,'align':'center'})
kfs=title['keyframes']['scale']
assert max(k['v'] for k in kfs)==1.31
for k in kfs:
 if k['v']>1.08:k['v']=1.08
j['revision']=old['revision']+1
# Evidence: only desired top-level keys, one title and two nested words.
assert j['clips'][:34]==old['clips'][:34] and j['clips'][35:]==old['clips'][35:]
for a,b in zip(j['comps'],old['comps']):
 if a['id']!='comp-V5-SC01-CAP04-0':assert a==b
 else:
  for x,y in zip(a['clips'],b['clips']):
   if x['id'] not in ['V5-W-w012','V5-W-w013']: assert x==y
assert j['media']==old['media'] and j['tracks']==old['tracks']
backup=root/'data/analysis/q03-typography-rev27-backup.json'
backup.parent.mkdir(parents=True,exist_ok=True)
raw=(data/'project.json').read_bytes()
assert json.loads(raw)==old
backup.write_bytes(raw)
backup.chmod(0o600)
before=hashlib.sha256(raw).hexdigest()
payload=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode()
req=urllib.request.Request(u,data=payload,method='PUT',headers={'Content-Type':'application/json','X-FableCut-Project':project_id or ''})
with urllib.request.urlopen(req,timeout=35) as r: receipt=json.load(r)
assert receipt.get('ok') and receipt.get('revision')==28,receipt
saved,pid=get()
assert saved==j,(saved.get('revision'),j.get('revision'))
assert (data/'project.json').exists()
report={'project':project_id,'beforeRevision':27,'afterRevision':28,'beforeSha256':before,'afterSha256':hashlib.sha256((data/'project.json').read_bytes()).hexdigest(),'modifiedTopClip':'SC08-QUESTION','modifiedNestedWords':['V5-W-w012','V5-W-w013'],'titleText':title['props']['text'],'titleFontSize':100,'titleMaxScale':max(k['v'] for k in kfs),'subtitleFontSize':88}
(root/'data/analysis/q03-typography-r30-apply.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
