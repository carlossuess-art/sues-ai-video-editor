import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,cpSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {prepareLocalPreview,buildPreviewASS,buildPreviewFilter,buildVideoPassFilter,buildAudioPassFilter} from '../src/local-preview.js';
const run=(cmd,args,limit=150000)=>execFileSync(cmd,args,{timeout:limit,maxBuffer:8*1024*1024});
const read=p=>JSON.parse(readFileSync(p,'utf8'));
test('selected source cut actually shortens both video and original audio in the rendered MP4',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-cut-real-render-'));
 try{
  const source=join(dir,'original.mp4');
  run('ffmpeg',['-v','error','-f','lavfi','-i','smptebars=size=108x192:rate=30:duration=8','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=8','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-af','volume=0.09','-c:a','aac','-shortest','-y',source]);
  const sourceSha=createHash('sha256').update(readFileSync(source)).digest('hex');
  const plan=prepareLocalPreview({template:read('examples/templates/sues-calma.template.json'),brand:read('examples/brand-kit.sues.json'),source:{width:108,height:192,duration:8,sha256:sourceSha},segments:[{in:0,out:2},{in:4,out:8}],transcript:{version:'1.0',language:'es',sourceDuration:8,words:[{text:'Primero',start:.5,end:.95},{text:'sigue',start:4.5,end:4.9},{text:'después.',start:5,end:5.7}]},camera:{keyframes:[0,8].map(time=>({time,x:0,y:0,width:108,height:192,zoom:1}))}});
  plan.voiceGain=1;plan.soundEffects={events:[]};plan.customSfx={events:[],assets:[]};plan.mastering={enabled:false};plan.voiceNormalization={enabled:false};
  for(const [name,content] of [['manifest.json',JSON.stringify(plan)],['captions.ass',buildPreviewASS(plan)],['filter.ffscript',buildPreviewFilter(plan)],['video.ffscript',buildVideoPassFilter(plan)],['audio.ffscript',buildAudioPassFilter(plan)]])writeFileSync(join(dir,name),content);
  cpSync('assets/fonts/montserrat',join(dir,'fonts'),{recursive:true});
  assert.equal(plan.duration,6);assert.equal(plan.timeMap.spans.length,2);
  assert.match(readFileSync(join(dir,'audio.ffscript'),'utf8'),/atrim=start=4:end=8/);
  const out=join(dir,'cut.mp4');
  run('python3',[resolve('scripts/templates/render_local_preview.py'),'--source',source,'--bundle',dir,'--out',out],180000);
  const probe=JSON.parse(run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',out]).toString());
  assert.ok(Math.abs(Number(probe.format.duration)-6)<.15);
  assert.ok(probe.streams.some(x=>x.codec_type==='audio'));
  assert.ok(probe.streams.some(x=>x.codec_type==='video'));
  const audit=read(join(dir,'cut.audit.json'));assert.equal(audit.fullDecode,'pass');
  assert.equal(createHash('sha256').update(readFileSync(source)).digest('hex'),sourceSha);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
