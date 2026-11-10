"""Recover the exact original V29 alpha sweep as nine editable groups over V28.
Private intermediate proof, NOT an all-layer V29 reconstruction.
"""
import json, pathlib, subprocess, hashlib, sys, math, os
base=pathlib.Path(sys.argv[1]).resolve(); out=pathlib.Path(sys.argv[2]).resolve()
if out.exists() or out.parent!=base/'automation-v1': raise ValueError('QA only')
qa=base/'qa'; v29=qa/'reel-158404-v29-light-sweep-20261109'
v28=qa/'reel-158404-v28-video-fx-dopamin-20261109'/'SUES_158404_V28_FLASH_SHAKE_TRANSICIONES_SUNO_VOZ100_540P.mp4'
plan=json.loads((v29/'V29-AUDIOVISUAL-OPERATIONS.json').read_text())
asset=pathlib.Path(plan['asset']).resolve()
if asset!=pathlib.Path('/tmp/sues-v29-effects/light_sweep.mkv') or not asset.is_file(): raise ValueError('original overlay missing')
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
out.mkdir(mode=0o700);media=out/'media';media.mkdir()
# Keep original alpha source safe in private QA; 87 KB, no large duplicate.
import shutil
shutil.copyfile(asset,out/'original-light-sweep.mkv')
(media/'v28-base.mp4').symlink_to(v28)
subprocess.run(['ffmpeg','-v','error','-i',str(v28),'-map','0:a:0','-c:a','copy',str(media/'v28-audio.m4a')],check=True)
# Use the actual source frames. The historical overlay filter scales PTS,
# quantized to the 15 fps output grid; record every chosen sample explicitly.
subprocess.run(['ffmpeg','-v','error','-i',str(asset),'-pix_fmt','rgba','-start_number','0',str(media/'sweep-%02d.png')],check=True)
frames=sorted(media.glob('sweep-*.png'))
if len(frames)!=15: raise ValueError('Unexpected frame count')
assets=[{'id':'base','name':'V28 reference composite','kind':'video','src':'/media/v28-base.mp4','duration':72.6,'width':540,'height':960,'fps':15},{'id':'audio','name':'V28 original audio mix','kind':'audio','src':'/media/v28-audio.m4a','duration':72.6}]
for i,im in enumerate(frames):
 n=im.name
 assets.append({'id':f'alpha{i}','name':n,'kind':'image','src':'/media/'+n,'width':540,'height':960})
clips=[{'id':'v28-base','mediaId':'base','kind':'video','track':'V1','start':0,'in':0,'duration':72.6,'props':{'volume':0,'fit':'contain'}},{'id':'v28-audio','mediaId':'audio','kind':'audio','track':'A1','start':0,'in':0,'duration':72.6,'props':{'volume':1}}]
comps=[];receipts=[]
for i,e in enumerate(plan['effects'],1):
 start=e['edited']; duration=e['duration']; first=math.ceil(start*15-1e-6);end=math.ceil((start+duration)*15-1e-6)
 # Select the preceding source PTS (no invented visual substitute).
 samples=[];layers=[]
 for f in range(first,end):
  n=min(14,max(0,math.floor((f/15-start)*15/duration+1e-6)))
  samples.append({'frame':f,'sourceFrame':n})
  layers.append({'id':f'frame-{f}','mediaId':f'alpha{n}','kind':'image','track':'V1','start':(f-first)/15,'in':0,'duration':1/15,'props':{'fit':'contain','opacity':1}})
 cid=f'v29-fx-{i:02d}';d=(end-first)/15
 comps.append({'id':cid,'name':e['op'],'width':540,'height':960,'duration':d,'background':'transparent','tracks':[{'id':'V1','kind':'video'}],'clips':layers})
 clips.append({'id':cid+'-clip','kind':'comp','compId':cid,'track':'V2','start':first/15,'in':0,'duration':d,'props':{'opacity':1,'fit':'contain'}})
 receipts.append({'operationId':f'V29-FX-{i:02d}','cue':e['op'],'requested':[start,start+duration],'frameRange':[first,end],'sourceSamples':samples,'status':'EDITABLE_CANDIDATE_NOT_PIXEL_PARITY'})
p={'name':'SUES V29 nine original sweeps QA','width':540,'height':960,'fps':15,'revision':1,'background':'#000000','tracks':[{'id':'V2','kind':'video'},{'id':'V1','kind':'video'},{'id':'A1','kind':'audio'}],'media':assets,'clips':clips,'comps':comps,'inPoint':0,'outPoint':1}
(out/'project.json').write_text(json.dumps(p,indent=2))
(out/'rebuild-proof.json').write_text(json.dumps({'status':'V29_OVERLAY_CANDIDATE_V28_FLATTENED_BASE','originalAlphaSha256':sha(asset),'sourceV28Sha256':sha(v28),'receipts':receipts,'limitations':['V28 flattened base; V27 all-layer candidate separate','15 fps sample choice requires parity test','no artistic approval']},indent=2))
print(json.dumps({'groups':len(comps),'topClips':len(clips),'frames':sum(len(c['clips']) for c in comps),'alphaSha256':sha(asset)}))
