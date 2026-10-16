// Codec-level regression for eye-anchored semantic zoom and all three ASS motions.
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {prepareLocalPreview,buildPreviewASS,buildPreviewFilter} from '../../src/local-preview.js';
const [outArg,fontsArg]=process.argv.slice(2);if(!outArg||!fontsArg)throw new Error('Usage: npm run semantic:smoke -- new-output-dir fonts-dir');
const out=resolve(outArg);mkdirSync(out,{recursive:true});
const run=(exe,args)=>{const r=spawnSync(exe,args,{maxBuffer:12*1024*1024});if(r.error||r.status!==0)throw new Error(r.error?.message??r.stderr?.toString());return r.stdout;};
const source=join(out,'grid.mp4');
run('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x141E32:s=1080x1920:r=30:d=12','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=12','-vf','drawbox=x=200:y=1520:w=32:h=32:color=red:t=fill,drawbox=x=500:y=760:w=80:h=16:color=white:t=fill,drawbox=x=532:y=728:w=16:h=80:color=white:t=fill','-c:v','libx264','-threads','2','-pix_fmt','yuv420p','-c:a','aac','-shortest','-n',source]);
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const motion=(motionId,bindings,start,end)=>({type:'motion',start,end,reason:'synthetic motion regression',rule:'synthetic-fixture',params:{motionId,bindings,semanticReason:motionId==='QUOTE_CARD_01'?'reflection':motionId==='NUMBER_BADGE_GOLD_01'?'steps':'comparison'}});
const input={template:read('examples/templates/sues-calma.template.json'),brand:read('examples/brand-kit.sues.json'),source:{width:1080,height:1920,duration:12},segments:[{in:0,out:12}],
 transcript:{version:'1.0',language:'es',sourceDuration:12,words:[{text:'Base.',start:1,end:2}]},
 camera:{keyframes:[{time:0,x:0,y:0,width:1080,height:1920,zoom:1},{time:12,x:0,y:0,width:1080,height:1920,zoom:1}]},
 visionFrames:[0,12].map(time=>({time,frameWidth:1080,frameHeight:1920,faces:[{x:400,y:600,width:280,height:400,score:1,leftEye:{x:520,y:768},rightEye:{x:560,y:768}}]})),
 catalog:read('examples/motions/catalog.sample.json'),director:{version:'1.0',templateId:'SUES_CALMA',timeSpace:'edit-timeline',decisions:[
 {type:'zoom',start:2,end:6,reason:'synthetic anchored zoom',rule:'synthetic-fixture',params:{reason:'revelation',scale:1.08,ramp:1}},
 motion('QUOTE_CARD_01',{quote:'Texto de prueba.'},3,5),motion('DIVIDER_LINE_01',{},5.3,6.8),motion('NUMBER_BADGE_GOLD_01',{number:'1',label:'Número de prueba'},7,8.8)]}};
const plan=prepareLocalPreview(input);writeFileSync(join(out,'manifest.json'),JSON.stringify(plan,null,2));writeFileSync(join(out,'captions.ass'),buildPreviewASS(plan));writeFileSync(join(out,'filter.ffscript'),buildPreviewFilter(plan));cpSync(resolve(fontsArg),join(out,'fonts'),{recursive:true});
const video=join(out,'semantic.mp4');run('python3',['scripts/templates/render_local_preview.py','--source',source,'--bundle',out,'--out',video]);
const centroid=(raw,white)=>{let x=0,y=0,n=0;for(let j=0;j<480;j++)for(let i=0;i<270;i++){
 const k=(j*270+i)*3,r=raw[k],g=raw[k+1],b=raw[k+2];
 const match=white?(i>=120&&i<=150&&j>=178&&j<=206&&r>210&&g>210&&b>210):(r>160&&g<80&&b<80);
 if(match){x+=i;y+=j;n++;}}
 assert.ok(n>8,'marker visible');return {x:x/n,y:y/n,pixels:n};};
const samples=[1.5,4,6.5].map(time=>{const raw=run('ffmpeg',['-v','error','-ss',String(time),'-i',video,'-frames:v','1','-vf','scale=270:480','-f','rawvideo','-pix_fmt','rgb24','-']);return {time,anchor:centroid(raw,true),marker:centroid(raw,false)};});
for(const s of samples)assert.ok(Math.hypot(s.anchor.x-samples[0].anchor.x,s.anchor.y-samples[0].anchor.y)<1,'eyes remain anchored');
const before=samples[0],peak=samples[1],after=samples[2],expected={x:before.anchor.x+(before.marker.x-before.anchor.x)*1.08,y:before.anchor.y+(before.marker.y-before.anchor.y)*1.08};
assert.ok(Math.hypot(peak.marker.x-expected.x,peak.marker.y-expected.y)<1.5,'marker follows eye-relative zoom');
assert.ok(Math.hypot(after.marker.x-before.marker.x,after.marker.y-before.marker.y)<1,'outside event returns to baseline');
const result={version:'1.0',fixture:'synthetic grid, synthetic detection, 8 percent zoom; not real-face inference',samples,expectedPeakMarker:expected,renderedMotions:plan.semantic.motions.map(m=>m.params.motionId),result:'pass'};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
