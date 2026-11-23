import json,copy,hashlib,math,pathlib,urllib.request
root=pathlib.Path('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122')
url='http://127.0.0.1:18156/api/project'
def get():
 with urllib.request.urlopen(url,timeout=20) as r:return json.load(r),r.headers.get('X-FableCut-Project')
old,pid=get()
assert old['revision']==30 and old['name']=='SUES QA R14 COMPLETO 55s', (old.get('revision'),old.get('name'))
titleOld=next(x for x in old['clips'] if x['id']=='SC08-QUESTION')
scopeOld=next(x for x in old['clips'] if x['id']=='SC08-TELESCOPE')
assert titleOld['props']['text']=='INTEGRACIÓN\nPRIVADA'
assert scopeOld['mediaId']=='asset-telescope'
j=copy.deepcopy(old)
title=next(x for x in j['clips'] if x['id']=='SC08-QUESTION')
title['props']['text']='EL\nOBSERVADOR'
# Keep cinematic gold style, position, keyframe timing and 2-line composition.
origShape=next(c for c in old['clips'] if c['id']=='SC01-WAVES')
c=copy.deepcopy(origShape)
c.update({'id':'SC08-OBSERVADOR-FOCUS-RING','kind':'shape','track':'V6','mediaId':None,
          'start':33.96666666666667,'in':0,'duration':1.1333333333333333,
          'name':'Observador · enfoque en lente del telescopio'})
c['props'].update({'x':280,'y':-780,'scale':1,'rotation':0,'opacity':0.72,
                   'text':'Title','glow':0,'shapes':[]})
def ring(radius,stroke,width,alpha=1):
 pts=[[round(radius*math.cos(2*math.pi*i/36),2),round(radius*math.sin(2*math.pi*i/36),2)] for i in range(37)]
 return {'type':'path','name':f'Enfoque anular {radius}',
   'x':0,'y':0,'rotation':0,'scale':1,'opacity':alpha,'trimStart':0,'trimEnd':100,'trimOffset':0,
   'points':pts,'closed':True,'fill':'none','stroke':stroke,'strokeWidth':width,
   'lineCap':'round','lineJoin':'round','keys':[{'t':0,'trimEnd':0},{'t':0.26,'trimEnd':100}]}
c['props']['shapes']=[
  ring(95,'#FFE8B34F',12,0.9),
  ring(95,'#FFF3D0',3,0.9),
  ring(125,'#D9A456A8',2,0.75)
]
c['keyframes']={'opacity':[{'t':0,'v':0},{'t':0.16,'v':0.62,'ease':'ease-out'},
                             {'t':0.72,'v':0.60},{'t':1.1333333333333333,'v':0,'ease':'ease-in'}],
                'scale':[{'t':0,'v':0.88},{'t':0.30,'v':1.0,'ease':'ease-out'},
                         {'t':1.1333333333333333,'v':1.04,'ease':'linear'}]}
assert not any(x['id']==c['id'] for x in j['clips'])
j['clips'].append(c)
j['revision']=old['revision']+1
assert next(x for x in j['clips'] if x['id']=='SC08-TELESCOPE')==scopeOld
assert j['media']==old['media'] and j['comps']==old['comps'] and j['tracks']==old['tracks']
for original,current in zip(old['clips'],j['clips']):
 if original['id']!='SC08-QUESTION':assert original==current
raw=(root/'data/project.json').read_bytes()
assert json.loads(raw)==old
backup=root/'data/analysis/q03-rev30-before-observador.json'
backup.write_bytes(raw);backup.chmod(0o600)
req=urllib.request.Request(url,method='PUT',data=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode(),headers={'Content-Type':'application/json','X-FableCut-Project':pid or ''})
with urllib.request.urlopen(req,timeout=40) as r:result=json.load(r)
assert result.get('ok') and result.get('revision')==31,result
saved,_=get()
assert saved==j
report={'revisionBefore':30,'revisionAfter':31,'text':'EL\nOBSERVADOR',
        'telescopeUnchanged':True,'ringClipId':c['id'],'ringFrom':c['start'],
        'ringTo':round(c['start']+c['duration'],3),
        'changedTopClips':['SC08-QUESTION',c['id']],
        'sha256':hashlib.sha256((root/'data/project.json').read_bytes()).hexdigest()}
(root/'data/analysis/q03-r33-observador-change.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
