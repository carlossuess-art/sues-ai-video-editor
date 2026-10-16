import {mkdirSync,writeFileSync,cpSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {prepareLocalPreview,buildPreviewASS,buildPreviewFilter} from '../../src/local-preview.js';
import {readFileSync} from 'node:fs';
const [dir,fontPath]=process.argv.slice(2);if(!dir||!fontPath)throw new Error('Usage: smoke_audio.mjs NEW_DIRECTORY FONT_DIRECTORY');
const out=resolve(dir);if(existsSync(out))throw new Error('Directory must be new');mkdirSync(out,{recursive:true});
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:10e6});if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout;};
const source=join(out,'source.mp4'),music=join(out,'owned-synthetic-tone.wav');
run('ffmpeg',['-v','error','-f','lavfi','-i','color=c=blue:s=1080x1920:r=30:d=12','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=12','-af',"volume='if(between(t,2,5)+between(t,8,11),2,0)':eval=frame",'-c:v','libx264','-threads','2','-preset','ultrafast','-c:a','aac',source]);
run('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=880:sample_rate=48000:duration=12','-c:a','pcm_s16le',music]);
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const plan=prepareLocalPreview({template:read('examples/templates/sues-calma.template.json'),brand:read('examples/brand-kit.sues.json'),source:{duration:12,width:1080,height:1920},transcript:{version:'1.0',language:'es',sourceDuration:12,words:[{text:'Prueba de voz.',start:2,end:4}]},segments:[{in:0,out:12}],camera:{keyframes:[0,12].map(time=>({time,x:0,y:0,width:1080,height:1920,zoom:1}))},backgroundAudio:{assetId:'synthetic-owned-sine',rights:'owned',localFile:music,gain:.12}});
const bundle=join(out,'bundle');mkdirSync(bundle);cpSync(resolve(fontPath),join(bundle,'fonts'),{recursive:true});
writeFileSync(join(bundle,'manifest.json'),JSON.stringify(plan,null,2));writeFileSync(join(bundle,'captions.ass'),buildPreviewASS(plan));writeFileSync(join(bundle,'filter.ffscript'),buildPreviewFilter(plan));
run('python3',['scripts/templates/render_local_preview.py','--source',source,'--bundle',bundle,'--out',join(out,'mixed.mp4')]);
const analysis=run('python3',['-c',`
import subprocess,numpy as np,json,sys,pathlib
p=pathlib.Path(sys.argv[1]);raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p/'mixed.mp4'),'-vn','-ac','1','-ar','48000','-f','f32le','-']);x=np.frombuffer(raw,np.float32)
def tone(t,hz):
 a=x[int(t*48000):int((t+.4)*48000)];return float(abs(np.dot(a,np.exp(-2j*np.pi*hz*np.arange(len(a))/48000)))*2/len(a))
quiet=tone(1.4,880);ducked=tone(3.3,880);voice=tone(3.3,440);late=tone(11.7,880)
assert quiet>0.005,(quiet,ducked)
assert ducked<quiet*.75,(quiet,ducked)
assert voice>.1,voice
assert late<quiet*.5,(late,quiet)
r={'synthetic':True,'musicQuiet880Hz':quiet,'musicUnderVoice880Hz':ducked,'voice440Hz':voice,'musicFadeEnd880Hz':late,'duckRatio':ducked/quiet,'decode':'pass','externalCostUSD':0};(p/'result.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
`,out]);console.log(analysis.trim());
