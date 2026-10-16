// Real FFmpeg regression: B-roll replaces only video and cannot replace original voice.
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {prepareLocalPreview,buildPreviewASS,buildPreviewFilter} from '../../src/local-preview.js';
const [outArg,fontsArg]=process.argv.slice(2);
if(!outArg||!fontsArg)throw new Error('Usage: npm run preview:smoke -- output-directory fonts-directory');
const out=resolve(outArg);mkdirSync(out,{recursive:true});
const run=(name,args)=>{
 const r=spawnSync(name,args,{encoding:null,maxBuffer:8*1024*1024});
 if(r.error||r.status!==0)throw new Error(`${name}: ${r.error?.message??r.stderr?.toString()}`);
 return r.stdout;
};
for(const [file,color,hz,seconds]of [['base.mp4','blue',440,12],['red.mp4','red',1700,5]])
 run('ffmpeg',['-v','error','-f','lavfi','-i',`color=c=${color}:s=108x192:r=30:d=${seconds}`,'-f','lavfi','-i',`sine=frequency=${hz}:sample_rate=48000:duration=${seconds}`,'-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-c:a','aac','-shortest','-n',join(out,file)]);
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const input={template:read('examples/templates/sues-calma.template.json'),brand:read('examples/brand-kit.sues.json'),
 source:{width:108,height:192,duration:12},segments:[{in:0,out:12}],
 transcript:{version:'1.0',language:'es',sourceDuration:12,words:[{text:'Base.',start:1,end:2},{text:'Base.',start:8,end:9}]},
 camera:{keyframes:[{time:0,x:0,y:0,width:108,height:192,zoom:1},{time:12,x:0,y:0,width:108,height:192,zoom:1}]},
 slots:[{start:3,end:6,reason:'Synthetic compositor fixture',tags:['synthetic']}],
 assets:[{id:'SYNTHETIC_RED',kind:'nature',sourceRef:'synthetic-red',duration:5,tags:['synthetic'],available:true}],
 mediaBindings:{'synthetic-red':join(out,'red.mp4')}};
const plan=prepareLocalPreview(input);
writeFileSync(join(out,'manifest.json'),JSON.stringify(plan,null,2));
writeFileSync(join(out,'captions.ass'),buildPreviewASS(plan));
writeFileSync(join(out,'filter.ffscript'),buildPreviewFilter(plan));
cpSync(resolve(fontsArg),join(out,'fonts'),{recursive:true});
const video=join(out,'smoke.mp4');
run('python3',['scripts/templates/render_local_preview.py','--source',join(out,'base.mp4'),'--bundle',out,'--out',video]);
const colors={};
for(const time of [2.5,4.5,6.5]){
 const raw=run('ffmpeg',['-v','error','-ss',String(time),'-i',video,'-frames:v','1','-vf','scale=1:1','-f','rawvideo','-pix_fmt','rgb24','-']);
 assert.equal(raw.length,3);colors[time]=[...raw];
}
assert.ok(colors[2.5][2]>200&&colors[2.5][0]<50);
assert.ok(colors[4.5][0]>200&&colors[4.5][2]<50);
assert.ok(colors[6.5][2]>200&&colors[6.5][0]<50);
const pcm=run('ffmpeg',['-v','error','-ss','4','-i',video,'-t','1','-vn','-ac','1','-ar','48000','-f','f32le','-']);
const count=pcm.length/4;
const magnitude=hz=>{
 let real=0,imag=0;
 for(let n=0;n<count;n++){
  const value=pcm.readFloatLE(n*4)*(.5-.5*Math.cos(2*Math.PI*n/(count-1))),angle=2*Math.PI*hz*n/48000;
  real+=value*Math.cos(angle);imag-=value*Math.sin(angle);
 }
 return Math.hypot(real,imag)/count;
};
const voice=magnitude(440),resource=magnitude(1700),ratio=resource/voice;
assert.ok(voice>.02&&ratio<.01,'Original tone must remain, resource tone must not be mixed');
const result={version:'1.0',fixture:'synthetic blue base 440Hz + red insert 1700Hz; no real footage',colorsRGB:colors,voice440HzMagnitude:voice,resource1700HzMagnitude:resource,resourceToVoiceRatio:ratio,result:'pass'};
writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
