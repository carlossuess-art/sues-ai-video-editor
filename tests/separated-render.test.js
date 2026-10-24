import {applyResourceLevels} from '../src/audio-levels.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,cpSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {prepareLocalPreview,buildPreviewASS,buildPreviewFilter,buildVideoPassFilter,buildAudioPassFilter} from '../src/local-preview.js';
import {prepareCustomSfx} from '../src/custom-sfx.js';
const run=(cmd,args)=>execFileSync(cmd,args,{timeout:180000,maxBuffer:8*1024*1024});
const read=p=>JSON.parse(readFileSync(p,'utf8'));

test('separated render preserves voice, late private SFX and music under a 1 GiB address-space limit',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-two-pass-'));
 try{
  const source=join(dir,'base.mp4'),music=join(dir,'music.wav'),sfx=join(dir,'sfx.wav');
  run('ffmpeg',['-v','error','-f','lavfi','-i','smptebars=size=108x192:rate=30:duration=20','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=20','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-af','volume=0.05','-c:a','aac','-shortest','-n',source]);
  run('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=250:sample_rate=48000:duration=20','-n',music]);
  run('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=880:sample_rate=48000:duration=0.5','-n',sfx]);
  const sourceSha=createHash('sha256').update(readFileSync(source)).digest('hex'),id=createHash('sha256').update(readFileSync(sfx)).digest('hex');
  const p=prepareLocalPreview({template:read('examples/templates/sues-calma.template.json'),brand:read('examples/brand-kit.sues.json'),source:{width:108,height:192,duration:20,sha256:sourceSha},segments:[{in:0,out:20}],transcript:{version:'1.0',language:'es',sourceDuration:20,words:[{text:'Prueba.',start:1,end:2}]},camera:{keyframes:[0,20].map(time=>({time,x:0,y:0,width:108,height:192,zoom:1}))},backgroundAudio:{assetId:'test_music',rights:'owned',localFile:music,gain:.16}});
  p.voiceGain=1.5;p.audioMix.levelResources=true;
  p.globalTransitions=[{type:'blur',start:6,end:6.4,duration:.4},{type:'radial',start:16,end:16.4,duration:.4}];
  p.voiceNormalization={enabled:true,targetIntegratedLufs:-16,targetTruePeakDb:-3,targetLra:7};
  p.soundEffects={events:[]};p.customSfx=prepareCustomSfx([{assetId:id,start:14,gain:.5}],20,()=>({assetId:id,sha256:id,kind:'sfx',rights:'owned',duration:.5,localFile:sfx}),{voiceNormalized:true});
  applyResourceLevels(p);
  for(const [name,content]of [['manifest.json',JSON.stringify(p)],['captions.ass',buildPreviewASS(p)],['filter.ffscript',buildPreviewFilter(p)],['video.ffscript',buildVideoPassFilter(p)],['audio.ffscript',buildAudioPassFilter(p)]])writeFileSync(join(dir,name),content);
  cpSync('assets/fonts/montserrat',join(dir,'fonts'),{recursive:true});
  const out=join(dir,'preview.mp4');
  try{run('python3',['-c','import resource,runpy,sys;resource.setrlimit(resource.RLIMIT_AS,(1024**3,1024**3));sys.argv=sys.argv[1:];runpy.run_path(sys.argv[0],run_name="__main__")',resolve('scripts/templates/render_local_preview.py'),'--source',source,'--bundle',dir,'--out',out]);}catch(error){throw new Error(readFileSync(join(dir,'render-video.log'),'utf8'),{cause:error});}
  const audit=read(join(dir,'preview.audit.json'));assert.deepEqual(audit.renderPasses,['video','audio-mux']);assert.equal(audit.sourcePreserved,true);assert.equal(audit.fullDecode,'pass');assert.equal(audit.audioPresent,true);assert.equal(audit.voiceGain,1.5);assert.equal(audit.resourceLeveling.librarySfx,true);assert.equal(audit.backgroundAudio.assetId,'test_music');assert.ok(audit.voiceNormalization.inputIntegratedLufs<-40);assert.ok(Math.abs(audit.voiceNormalization.outputIntegratedLufs+16)<1);
  const pcm=run('ffmpeg',['-v','error','-xerror','-threads','2','-ss','14.1','-i',out,'-t','0.25','-vn','-ac','1','-ar','48000','-f','f32le','-']);
  const samples=new Float32Array(pcm.buffer,pcm.byteOffset,pcm.byteLength/4);
  const energy=hz=>{let a=0,b=0;for(let i=0;i<samples.length;i++){a+=samples[i]*Math.cos(2*Math.PI*hz*i/48000);b+=samples[i]*Math.sin(2*Math.PI*hz*i/48000);}return Math.hypot(a,b)/samples.length;};
  console.log('Encoded stem amplitudes',energy(440),energy(250),energy(880));
  assert.ok(energy(440)>.015,'continuous original voice');assert.ok(energy(250)>.006,'music actually present in decoded MP4');assert.ok(energy(880)>.01,'late private SFX actually present in decoded MP4');
  const pixels=at=>run('ffmpeg',['-v','error','-threads','2','-ss',String(at),'-i',out,'-frames:v','1','-vf','scale=216:384','-pix_fmt','rgb24','-f','rawvideo','-']);
  const before=pixels(5.9),blurred=pixels(6.2),radial=pixels(16.2),after=pixels(6.6),difference=a=>a.reduce((sum,v,i)=>sum+Math.abs(v-before[i]),0)/a.length;
  console.log('Decoded visual differences',difference(blurred),difference(radial),difference(after));
  assert.ok(difference(blurred)>.15,'blur visibly changes decoded pixels');assert.ok(difference(radial)>.5,'radial visibly changes decoded pixels');assert.ok(difference(after)<1,'original image returns after transition');
  assert.doesNotMatch(readFileSync(join(dir,'render-video.log'),'utf8'),/ret:Function not implemented/);
  assert.equal(createHash('sha256').update(readFileSync(source)).digest('hex'),sourceSha);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
