import json,copy,urllib.request,pathlib,hashlib
root=pathlib.Path('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122')
url='http://127.0.0.1:18156/api/project'
def get():
 with urllib.request.urlopen(url,timeout=20) as r:return json.load(r),r.headers.get('X-FableCut-Project')
before,pid=get()
assert before['revision']==32 and before['name']=='SUES QA R14 COMPLETO 55s'
rawasset=root/'data/media/r14-brains-green-original.mp4'
assert hashlib.sha256(rawasset.read_bytes()).hexdigest()=='e29dee44c2f4083353a5b523ae7f4ee7016338fee5913e4a214d103ba6ff2c77'
title=next(x for x in before['clips'] if x['id']=='SC01-TITLE')
assert abs(title['start']-1/30)<1e-6 and abs(title['duration']-116/30)<1e-6
after=copy.deepcopy(before)
initial=next(c for c in after['clips'] if c['id']=='SC01-TITLE')
initial['duration']=2.4-initial['start']
for key,ks in list(initial.get('keyframes',{}).items()):
 if isinstance(ks,list):initial['keyframes'][key]=[k for k in ks if k.get('t',0)<=initial['duration']+0.00001]
ref=next(c for c in after['clips'] if c['id']=='SC07-SWEEP')
overlay=copy.deepcopy(ref)
overlay.update({'id':'SC01-BRAIN-MIRROR-CHROMA','mediaId':'asset-brains-mirror-green-user-164226','name':'Dos cerebros · espejo y croma editable','kind':'video','track':'V9','start':2.4,'in':0,'duration':1.8})
overlay['props'].update({'x':0,'y':-530,'scale':0.90,'rotation':0,'opacity':1,'volume':0,'pan':0,'fit':'contain','blend':'normal','chromaKey':'#26C73B','chromaTolerance':32,'chromaSoftness':18,'cropL':0,'cropR':0,'cropT':0,'cropB':0,'masks':[]})
overlay['keyframes']={'opacity':[{'t':0,'v':0},{'t':0.13333333333333,'v':1,'ease':'ease-out'},{'t':1.60,'v':1},{'t':1.8,'v':0,'ease':'ease-in'}]}
assert not any(c['id']==overlay['id'] for c in after['clips'])
after['clips'].append(overlay)
after['media'].append({'id':overlay['mediaId'],'name':'Dos cerebros · vídeo original usuario','kind':'video','src':'/media/r14-brains-green-original.mp4','duration':10.026667,'width':1280,'height':720,'folderId':None,'size':4704443,'fps':24})
for id in ['V5-SC01-CAP02-1','V5-SC01-CAP03-0']:
 cap=next(c for c in after['clips'] if c['id']==id)
 assert cap['props']['opacity']==1
 cap['props']['opacity']=0
ring=[c for c in after['clips'] if c['id']=='SC08-OBSERVADOR-FOCUS-RING']
assert len(ring)==1
after['clips']=[c for c in after['clips'] if c['id']!='SC08-OBSERVADOR-FOCUS-RING']
after['revision']=33
for id in ['SC08-TELESCOPE','SC08-QUESTION']:
 assert next(c for c in after['clips'] if c['id']==id)==next(c for c in before['clips'] if c['id']==id)
assert before['comps']==after['comps'] and before['tracks']==after['tracks']
raw=(root/'data/project.json').read_bytes()
assert json.loads(raw)==before
backup=root/'data/analysis/q03-r32-before-brains-overlay.json'
backup.write_bytes(raw);backup.chmod(0o600)
req=urllib.request.Request(url,method='PUT',data=json.dumps(after,ensure_ascii=False,separators=(',',':')).encode(),headers={'Content-Type':'application/json','X-FableCut-Project':pid or ''})
with urllib.request.urlopen(req,timeout=35) as r:receipt=json.load(r)
assert receipt.get('ok') and receipt.get('revision')==33,receipt
saved,_=get();assert saved==after
report={'revisionOld':32,'revisionNew':33,'titleEnd':2.4,'chromaStart':2.4,'chromaEnd':4.2,'key':'#26C73B','captionsSuppressed':['V5-SC01-CAP02-1','V5-SC01-CAP03-0'],'telescopeUnchanged':True,'reticleRemoved':True,'projectSha256':hashlib.sha256((root/'data/project.json').read_bytes()).hexdigest()}
(root/'data/analysis/q03-r35-brains-timeline-change.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
