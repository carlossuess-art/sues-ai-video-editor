#!/usr/bin/env python3
"""Create a NEW, private review project from the verified clean V4B preview.
Never overwrite older V1/V2/V3 files or their project records.
"""
import hashlib,json,subprocess,uuid,os,datetime
from pathlib import Path
ROOT=Path('/opt/sues-video-setup/editor/jobs')
UP=ROOT/'uploads'
R=Path('/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta/out')
F=R/'SUES_158404_V4B_DESDE_ORIGINAL_RECONSTRUIDO_PREVIEW720_20261104.mp4'
V3='a519295ca72a6c508cbcf69424b0a6c7e3d36cea897a2c9c278c9f3ea426bbbf'
FFPROBE='/opt/sues-video-setup/remotion-cta-poc-20261103/experiments/remotion-cta/node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
TITLE='EL PRECIO DE SER QUIEN NO ERES · V4B · SUBTÍTULOS NUEVOS'
def src(p):return json.loads(p.read_text(encoding='utf-8'))
def new_json(p,x):
 if p.exists():raise RuntimeError('Already exists: '+str(p))
 tmp=p.with_name('.'+p.name+'.tmp-'+uuid.uuid4().hex)
 try:
  with open(tmp,'x',encoding='utf-8') as f:json.dump(x,f,ensure_ascii=False,indent=2);f.write('\n')
  os.chmod(tmp,0o600);os.chown(tmp,1000,1000)
  os.link(tmp,p)
 finally:
  if tmp.exists():tmp.unlink()
if not F.exists() or F.stat().st_size<1000000:raise RuntimeError('V4B final MP4 not verified yet')
probe=json.loads(subprocess.check_output([FFPROBE,'-v','error','-show_entries','format=duration,size:stream=codec_name,codec_type,width,height,nb_frames','-of','json',str(F)]))
v=next(x for x in probe['streams'] if x['codec_type']=='video')
a=next(x for x in probe['streams'] if x['codec_type']=='audio')
assert v['codec_name']=='h264' and a['codec_name']=='aac' and v['width']==720 and v['height']==1280 and int(v['nb_frames'])==2230
duration=round(float(probe['format']['duration']),6)
assert abs(duration-74.3333)<.1, duration
checksum=hashlib.sha256(F.read_bytes()).hexdigest()
id='upload-'+checksum
rec=UP/(checksum+'.json');cfg=UP/(checksum+'.project.json');dst=UP/(checksum+'.video')
if rec.exists():print('ALREADY_IMPORTED',checksum,id);raise SystemExit(0)
if cfg.exists() or dst.exists():raise RuntimeError('conflicting output')
derived=UP/'analysis-remotion-v4b-clean-20261104';derived.mkdir(mode=0o700,exist_ok=True);os.chown(derived,1000,1000)
prior=src(UP/(V3+'.project.json'))
words=src(UP/'analysis-remotion-v3c-20261104/transcript.json')
words['sourceDuration']=duration
words['provenance']={'kind':'original-speech-retimed-by-0.7-second-rule','video':'V4B-new-caption-composition','captionWords':168,'keywordBeats':32,'voiceOrigin':'existing-V3C-clean-reviewed-audio','visualOrigin':'original-unsubtitled-source','note':'flattened preview: do not auto-apply subtitles a second time'}
cam={'mode':'full-frame-fit','keyframes':[{'time':0,'x':0,'y':0,'width':720,'height':1280,'zoom':1},{'time':duration,'x':0,'y':0,'width':720,'height':1280,'zoom':1}]}
vision={'method':'preview-not-analyzed','frames':[{'time':0,'frameWidth':720,'frameHeight':1280,'faces':[]},{'time':duration,'frameWidth':720,'frameHeight':1280,'faces':[]}]}
for typ,data in [('transcript',words),('camera',cam),('vision',vision)]:new_json(derived/(typ+'.json'),data)
config={k:v for k,v in prior.items() if k not in ('illustrations','backgroundAudio','subjectLayersPath','depthTextPath')}
config.update({'title':TITLE,'source':{'sha256':checksum,'duration':duration,'width':720,'height':1280},'sourcePath':'/state/jobs/uploads/'+checksum+'.video','transcriptPath':'/state/jobs/uploads/'+derived.name+'/transcript.json','cameraPath':'/state/jobs/uploads/'+derived.name+'/camera.json','visionPath':'/state/jobs/uploads/'+derived.name+'/vision.json'})
os.link(F,dst)
new_json(cfg,config)
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
metadata={'sha256':checksum,'bytes':F.stat().st_size,'name':TITLE+'.mp4','createdAt':now,'source':config['source'],'profileId':id,'brief':{'projectTitle':TITLE,'styleId':'SUES_DOPAMIN','prompt':'V4B: vídeo nuevo compuesto desde material sin subtítulos con 168 palabras y 32 énfasis centrados, pausas <=0,7 s. El MP4 de preview ya lleva captions. No volver a incrustar captions sin quitar los anteriores. Código editable de Remotion en rama feat/remotion-cta-poc-20261103.','savedAt':now}}
new_json(rec,metadata)
print(json.dumps({'status':'READY_TO_REGISTER_JOB','sha256':checksum,'profileId':id,'duration':duration,'width':720,'height':1280,'bytes':F.stat().st_size,'title':TITLE,'path':str(F)}))
