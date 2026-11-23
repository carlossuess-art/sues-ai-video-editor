"""Replay the actual V28/V29 post-composition filters on a verified V27 render.

Only the original private filter files and recovered alpha source are accepted.
An FFmpeg post pass does not turn V28's pixel-level effects into native clips;
the editable V27 and the full operation manifest remain separate evidence.
"""
import hashlib, json, pathlib, subprocess, sys
def run(args): subprocess.run(args,check=True)
def probe(p):
 return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
def sha(p):
 h=hashlib.sha256()
 with pathlib.Path(p).open('rb') as f:
  for block in iter(lambda:f.read(1048576),b''):h.update(block)
 return h.hexdigest()
base=pathlib.Path(sys.argv[1]).resolve();src=pathlib.Path(sys.argv[2]).resolve();out=pathlib.Path(sys.argv[3]).resolve()
if out.exists() or out.parent!=base/'automation-v1' or not src.is_relative_to(base):raise ValueError('Private input/output required')
qa=base/'qa'
v28=qa/'reel-158404-v28-video-fx-dopamin-20261109'
v29=qa/'reel-158404-v29-light-sweep-20261109'
v28plan=json.loads((v28/'V28-PLAN-TECNICO-VIDEO-FX.json').read_text())
v29plan=json.loads((v29/'V29-AUDIOVISUAL-OPERATIONS.json').read_text())
filter28=v28/'V28-FFMPEG-VIDEO-FX.txt';filter29=v29/'V29-filters.txt'
alpha=base/'automation-v1/test-project-009/original-light-sweep.mkv'
if sha(alpha)!='4ef92cd95a42d736eec513bea34dbbf4f0b2e3dbce5d8a6c8e3a7ce7a6a7984c':raise ValueError('Original overlay SHA mismatch')
m=probe(src);video=next(s for s in m['streams'] if s['codec_type']=='video')
if (video['width'],video['height'],video['r_frame_rate'])!=(540,960,'15/1') or abs(float(m['format']['duration'])-72.6)>.1:raise ValueError('Expected full V27 output 540x960 15fps 72.6s')
out.mkdir(mode=0o700)
f28=out/'v28-replayed.mp4';f29=out/'v29-replayed.mp4'
ff=['ffmpeg','-nostdin','-v','error','-threads','2','-filter_threads','2','-filter_complex_threads','2']
encode=['-c:v','libx264','-preset','fast','-crf','18','-threads','2','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart','-t','72.6']
run(ff+['-i',str(src),'-filter_script:v',str(filter28),'-map','0:v:0','-map','0:a:0']+encode+[str(f28)])
run(ff+['-i',str(f28)]+sum([['-i',str(alpha)] for _ in v29plan['effects']],[])+['-filter_complex_script',str(filter29),'-map','[v]','-map','0:a:0']+encode+[str(f29)])
manifest={'status':'REPLAYED_POSTPROCESS_NOT_NATIVE_LAYER_PARITY','source':str(src),'sourceSha256':sha(src),'historicalSourceMatch':sha(src)==v28plan['sourceSha256'],'filter28Sha256':sha(filter28),'filter29Sha256':sha(filter29),'alphaSha256':sha(alpha),'v28Operations':v28plan['operations'],'v29Operations':v29plan['effects'],'outputs':[{'file':str(f),'sha256':sha(f),'probe':probe(f)} for f in [f28,f29]]}
(out/'postprocess-proof.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'status':manifest['status'],'historicalSourceMatch':manifest['historicalSourceMatch'],'v28Operations':len(manifest['v28Operations']),'v29Operations':len(manifest['v29Operations']),'duration':manifest['outputs'][1]['probe']['format']['duration']}))
