import pathlib,json,copy,urllib.request,hashlib
R=pathlib.Path('/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122')
url='http://127.0.0.1:18156/api/project'
def get():
 with urllib.request.urlopen(url,timeout=20) as x:return json.load(x),x.headers.get('X-FableCut-Project')
old,pid=get()
assert old['revision']==35 and len(old['clips'])==169 and len(old['media'])==39
j=copy.deepcopy(old)
assetid='asset-sues-agua-instrumental-user-20261123'
filename='SUES_Q03_agua_instrumental_conciencia_9s.m4a'
src=R/'data/media'/filename
assert src.is_file() and src.stat().st_size==121712
j['media'].append({'id':assetid,'name':'Agua instrumental · Carlos (música meditación suministrada)','kind':'audio','src':'/media/'+filename,'duration':9.7,'size':src.stat().st_size,'folderId':None})
track=next(c for c in j['clips'] if c['id']=='V12-CELESTIAL')
assert track['kind']=='audio' and track['start']==36.4 and track['mediaId']=='v12-celestial'
track['name']='Agua instrumental · transición hacia la conciencia'
track['mediaId']=assetid
track['start']=34.53333333333333
track['duration']=9.7
track['in']=0
track['props']['volume']=0.18
track['props']['gain']=0
track['keyframes']={'volume':[
 {'t':0,'v':0,'ease':'linear'},
 {'t':0.55,'v':0.135,'ease':'ease-in-out'},
 {'t':1.10,'v':0.18,'ease':'ease-in-out'},
 {'t':7.9,'v':0.18,'ease':'linear'},
 {'t':8.65,'v':0.11,'ease':'ease-in-out'},
 {'t':9.7,'v':0,'ease':'ease-in-out'}]}
# Smoothing around 34.9s voice splice; fade out previous fragment to 0 and
# gently ramp new fragment, without moving either or muting the spoken content.
voiceA=next(c for c in j['clips'] if c['id']=='VOICE-4')
voiceB=next(c for c in j['clips'] if c['id']=='VOICE-5')
assert abs(voiceA['start']+voiceA['duration']-voiceB['start'])<1e-5
assert not voiceA.get('keyframes') and not voiceB.get('keyframes')
voiceA['keyframes']={'volume':[{'t':0,'v':1,'ease':'linear'},{'t':voiceA['duration']-0.20,'v':1,'ease':'linear'},{'t':voiceA['duration'],'v':0,'ease':'ease-in-out'}]}
voiceB['keyframes']={'volume':[{'t':0,'v':0,'ease':'linear'},{'t':0.20,'v':1,'ease':'ease-in-out'},{'t':voiceB['duration'],'v':1,'ease':'linear'}]}
j['revision']=36
idsChanged={x['id'] for x,y in zip(old['clips'],j['clips']) if x!=y}
assert idsChanged=={'V12-CELESTIAL','VOICE-4','VOICE-5'},idsChanged
assert j['comps']==old['comps'] and j['tracks']==old['tracks'] and len(j['media'])==len(old['media'])+1
b=R/'data/analysis/q03-rev35-before-agua-r37.json'
raw=(R/'data/project.json').read_bytes()
assert json.loads(raw)==old
b.write_bytes(raw);b.chmod(0o600)
payload=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode()
q=urllib.request.Request(url,method='PUT',data=payload,headers={'Content-Type':'application/json','X-FableCut-Project':pid or ''})
with urllib.request.urlopen(q,timeout=40) as r:reply=json.load(r)
assert reply.get('ok') and reply.get('revision')==36,reply
saved,_=get();assert saved==j
report={'revision':36,'music':'agua instrumental usuario','audioSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'source':str(src),'musicTime':[track['start'],track['start']+track['duration']],'musicPeakGain':0.18,'voiceSplice':voiceB['start'],'voiceFadeSeconds':0.2,'changedClipIds':list(sorted(idsChanged)),'zoomClipsPreserved':30}
(R/'data/analysis/q03-agua-r37-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
