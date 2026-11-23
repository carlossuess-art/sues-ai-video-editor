import json,urllib.request,pathlib,hashlib,copy
root=pathlib.Path('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122')
url='http://127.0.0.1:18156/api/project'
def get():
 with urllib.request.urlopen(url,timeout=20) as r:return json.load(r),r.headers.get('X-FableCut-Project')
old,pid=get()
assert old['revision']==28,old['revision']
j=copy.deepcopy(old)
cm=next(x for x in j['comps'] if x['id']=='comp-V5-SC01-CAP04-0')
host=next(x for x in j['clips'] if x['id']=='V5-SC01-CAP04-0')
assert host['start']==4.5 and host['duration']==1.3
assert [c['id'] for c in cm['clips']]==['V5-W-w012','V5-W-w013','V5-W-w014']
assert not any(c['track']=='V9' and c['start']<5.8 and c['start']+c['duration']>4.5 for c in j['clips'])
moved=[]
for id,word in [('V5-W-w012','que'),('V5-W-w013','puedes')]:
 c=next(x for x in cm['clips'] if x['id']==id)
 assert c['props']['text']==word and c['kind']=='text'
 cp=copy.deepcopy(c)
 cp['track']='V9'
 cp['start']=round(host['start']+cp['start'],12)
 cp['name']=id+' · legible'
 cp['props']['color']='#FFFFFF'
 cp['props']['opacity']=1
 cp['props']['weight']=800
 cp['props']['bold']=True
 cp['props']['fontSize']=92
 cp['props']['textShadow']=9
 cp['props']['strokeWidth']=3
 cp['props']['strokeColor']='#181818'
 moved.append(cp)
cm['clips']=[c for c in cm['clips'] if c['id'] not in ('V5-W-w012','V5-W-w013')]
j['clips'].extend(moved)
j['revision']=29
assert next(x for x in j['clips'] if x['id']=='SC08-QUESTION')==next(x for x in old['clips'] if x['id']=='SC08-QUESTION')
assert j['media']==old['media'] and j['tracks']==old['tracks']
p=root/'data/analysis/q03-typography-rev28-pre-caption-lift.json'
raw=(root/'data/project.json').read_bytes()
assert json.loads(raw)==old
p.write_bytes(raw);p.chmod(0o600)
req=urllib.request.Request(url,method='PUT',data=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode(),headers={'Content-Type':'application/json','X-FableCut-Project':pid or ''})
with urllib.request.urlopen(req,timeout=35) as r: receipt=json.load(r)
assert receipt.get('ok') and receipt.get('revision')==29,receipt
saved,_=get()
assert saved==j
report={'fromRevision':28,'toRevision':29,'moved':[{k:x[k] for k in ('id','track','start','duration')} for x in moved],'titleUnchanged':True,'nestedOtherUnchanged':cm['clips'][0]['id']=='V5-W-w014','projectSha':hashlib.sha256((root/'data/project.json').read_bytes()).hexdigest()}
(root/'data/analysis/q03-caption-r31-change.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
