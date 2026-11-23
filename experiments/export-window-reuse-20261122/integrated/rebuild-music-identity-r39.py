import json,pathlib,hashlib,copy,urllib.request
R=pathlib.Path('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122');url='http://127.0.0.1:18156/api/project'
def get():
 with urllib.request.urlopen(url,timeout=20) as r:return json.load(r),r.headers.get('X-FableCut-Project')
p,pid=get()
assert p['revision']==36 and p['name']=='SUES QA R14 COMPLETO 55s'
j=copy.deepcopy(p)
assets=[('sues-soul-r39','Midnight at the Plaza · soul brass','SUES_IDENTITY_SOUL_BRASS_MIDNIGHT_AT_THE_PLAZA.mp3',58.40975,1409552),('sues-tension-r39','The Unspoken Hour · tensión (candidato)','SUES_IDENTITY_TENSION_THE_UNSPOKEN_HOUR.mp3',39.706083,960664),('sues-reggae-r39','Gold in the Midday Heat · reggae-funk','SUES_IDENTITY_REGGAE_FUNK_GOLD_IN_THE_MIDDAY_HEAT.mp3',60.055458,1449049),('sues-meditative-r39','Meditative · biblioteca sin usar','SUES_IDENTITY_MEDITATIVE_INTROSPECTIVA.m4a',188.68,3399882)]
manifest=[]
for ident,name,filename,duration,size in assets:
 f=R/'data/media'/filename
 assert f.is_file() and f.stat().st_size==size
 assert not any(m['id']==ident for m in j['media'])
 j['media'].append(dict(id=ident,name=name,kind='audio',src='/media/'+filename,duration=duration,size=size,folderId=None))
 manifest.append(dict(id=ident,file=filename,sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
clips={c['id']:c for c in j['clips']}
def edit(id,media,start,end,vol,keyframes,name):
 c=clips[id]; assert c['kind']=='audio' and c['track'] in ('A2','A3')
 c.update(mediaId=media,start=start,duration=end-start,name=name)
 c['in']=0
 c['props'].update(volume=vol,gain=0,duck=0)
 c['keyframes']=dict(c.get('keyframes') or {},volume=[dict(t=round(t,6),v=v,ease='linear') for t,v in keyframes])
 assert all(0<=k['t']<=c['duration']+.0001 and 0<=k['v']<=vol for k in c['keyframes']['volume'])
edit('MUSIC-01','sues-soul-r39',0,8.9,.27,[(0,.27),(7.75,.27),(8.9,0)],'SUES · apertura soul brass inmediata')
edit('MUSIC-02','sues-tension-r39',7.75,35.2,.225,[(0,0),(.9,.225),(25.75,.225),(27.45,0)],'SUES · tensión (candidato)')
edit('V12-CELESTIAL','asset-sues-agua-instrumental-user-20261123',34.53333333333333,43.33333333333333,.175,[(0,0),(.65,.14),(1.1,.175),(7.45,.175),(8.8,0)],'SUES · agua instrumental · reflexión')
edit('MUSIC-03','sues-reggae-r39',41.96666666666667,55.56666666666667,.29,[(0,0),(.72,.24),(2.4,.29),(12.62,.29),(13.6,0)],'SUES · reggae-funk · revelación y CTA')
keep={'SC02-WHOOSH':.24,'SC05-HIT':.30,'SC07-RISER':.23,'SC10-RESOLVE':.125}
removed=[c['id'] for c in j['clips'] if c['kind']=='audio' and (c['id'] in ('V12-WARM-RETURN','SC12-MUSIC-MASTER','SC01-HIT','SC03-POP','SC12-SIGNATURE_SOUND') or c['id'].startswith(('V6-SFX-','V7-POP-')))]
assert len(removed)>=22
for c in j['clips']:
 if c['id'] in keep:c['props']['volume']=keep[c['id']]
j['clips']=[c for c in j['clips'] if c['id'] not in removed]
j['revision']=37
assert len(j['clips'])==len(p['clips'])-len(removed)
assert {c['id']:c for c in j['clips'] if c['kind']!='audio'}=={c['id']:c for c in p['clips'] if c['kind']!='audio'}
assert {c['id']:c for c in j['clips'] if c['track']=='A1'}=={c['id']:c for c in p['clips'] if c['track']=='A1'}
assert j['comps']==p['comps'] and j['tracks']==p['tracks']
assert {c['id'] for c in j['clips'] if c['kind']=='audio' and c['track']!='A1'}==set(keep)|{'MUSIC-01','MUSIC-02','MUSIC-03','V12-CELESTIAL','SC04-DEFLATE'}
backup=R/'data/analysis/q03-rev36-before-music-identity-r39.json'
raw=(R/'data/project.json').read_bytes();assert json.loads(raw)==p
backup.write_bytes(raw);backup.chmod(0o600)
req=urllib.request.Request(url,method='PUT',data=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode(),headers={'Content-Type':'application/json','X-FableCut-Project':pid or ''})
with urllib.request.urlopen(req,timeout=35) as response:result=json.load(response)
assert result.get('ok') and result.get('revision')==37,result
saved,_=get();assert saved==j
report={'revision':37,'removedSFX':removed,'keptSFX':keep,'assets':manifest,'music':[{k:c[k] for k in ('id','mediaId','start','duration')}|{'volume':c['props']['volume'],'keyframes':c['keyframes']['volume']} for c in j['clips'] if c['id'] in ('MUSIC-01','MUSIC-02','MUSIC-03','V12-CELESTIAL')],'preservedOriginalVoice':True,'preservedVisuals':True,'projectSha256':hashlib.sha256((R/'data/project.json').read_bytes()).hexdigest(),'unresolvedThirdPriority':'The Unspoken Hour vs Stillness Between Breaths'}
(R/'data/analysis/q03-music-identity-r39-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'revision':37,'removed':len(removed),'kept':list(keep),'musicLayers':4,'assets':len(assets),'voiceUnchanged':True,'visualUnchanged':True},ensure_ascii=False))

