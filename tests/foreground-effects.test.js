import {execFileSync} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {foregroundSpaceHash,prepareForegroundEffects,foregroundEffectFilters} from '../src/foreground-effects.js';
const dir=mkdtempSync(join(tmpdir(),'sues-foreground-')),file=join(dir,'mask.mkv');
writeFileSync(file,'test fixture, not a real matte');
const digest=createHash('sha256').update('test fixture, not a real matte').digest('hex');
const plan={source:{sha256:'a'.repeat(64)},duration:10,timeMap:{duration:10},camera:{keyframes:[]},semantic:{zooms:[],anchors:[]},policy:{captions:{font:'Montserrat'}}};
const fixture=()=>({schema:'sues-foreground-effects/v1',sourceSha256:plan.source.sha256,cameraSpaceSha256:foregroundSpaceHash(plan),matte:{localFile:file,sha256:digest,modelSha256:'b'.repeat(64),method:'modnet-onnx-cpu',width:512,height:896,fps:30,frames:300,duration:10,activeRanges:[{start:6,end:8.8}],reviewStatus:'sample-reviewed'},events:[{type:'background-blur',start:6,end:8.8,sigma:12},{type:'behind-text',start:6.4,end:8.8,lines:['MUNDO','INTERIOR']}]});
test.after(()=>rmSync(dir,{recursive:true,force:true}));
test('foreground compiles only after bound camera-space validation and preserves defaults',()=>{
 assert.equal(prepareForegroundEffects(null,plan),null);assert.deepEqual(foregroundEffectFilters(null,'base',1),{filters:[],base:'base'});
 const d=prepareForegroundEffects(fixture(),plan),f=foregroundEffectFilters(d,'base',3).filters.join(';');
 assert.match(f,/\[3:v\]fps=30/);assert.match(f,/alphamerge/);assert.match(f,/MUNDO/);assert.match(f,/gblur=sigma=12/);assert.doesNotMatch(f,/trim=/);assert.equal(d.acceptance,'pending-human-review');
 assert.doesNotThrow(()=>prepareForegroundEffects(d,plan));
});
test('source, camera, timeline and mask changes invalidate the cache',()=>{
 for(const change of [d=>d.sourceSha256='c'.repeat(64),d=>d.cameraSpaceSha256='c'.repeat(64),d=>d.matte.sha256='c'.repeat(64),d=>d.matte.frames=299,d=>delete d.matte.duration]){
 const d=fixture();change(d);assert.throws(()=>prepareForegroundEffects(d,plan));}
 assert.throws(()=>prepareForegroundEffects(fixture(),{...plan,camera:{keyframes:[{zoom:1.1}]}}));
 const link=join(dir,'mask-link.mkv');symlinkSync(file,link);const d=fixture();d.matte.localFile=link;assert.throws(()=>prepareForegroundEffects(d,plan),/file changed/);
});
test('uncovered intervals, arbitrary effects and injected text are rejected',()=>{
 for(const change of [d=>d.events[0].start=5.9,d=>d.events[0].end=8.9,d=>d.events[0].sigma=21,d=>d.events[1].lines=["MUNDO':movie=x"],d=>d.events[0].filter='movie=x',d=>d.events[0].type='full-frame-fit']){
 const d=fixture();change(d);assert.throws(()=>prepareForegroundEffects(d,plan));}
});
test('foreground cannot be silently hidden by other resources',()=>{
 assert.throws(()=>prepareForegroundEffects(fixture(),{...plan,selectedMedia:[{start:6.5,end:7}]}),/another composition/);
});

test('behind video resolves only verified media and is occluded by the same bound matte',()=>{
 const d=fixture();d.events.push({type:'behind-video',start:6,end:8.8,assetId:digest,sourceIn:0,opacity:.8,reason:'Narrative resource test'});
 const resource={localFile:file,sha256:digest,rights:'owned',duration:4};
 const ready=prepareForegroundEffects(d,plan,()=>resource);const f=foregroundEffectFilters(ready,'base',3).filters.join(';');
 assert.match(f,/\[4:v\]trim=start=0:duration=/);assert.match(f,/\[3:v\]fps=30/);assert.match(f,/\[fg-rgb\]\[fg-mask\]alphamerge/);
 assert.throws(()=>prepareForegroundEffects(fixtureWithVideo(),plan,()=>({...resource,sha256:'c'.repeat(64)})),/provenance/);
 function fixtureWithVideo(){const x=fixture();x.events.push({type:'behind-video',start:6,end:8.8,assetId:digest,sourceIn:0,opacity:.8,reason:'Narrative resource test'});return x;}
});
test('noninteger source duration allows exactly the final 30fps frame',()=>{
 const p={...plan,duration:70.891};const d=fixture();d.cameraSpaceSha256=foregroundSpaceHash(p);d.matte.frames=2127;d.matte.duration=70.9;
 assert.doesNotThrow(()=>prepareForegroundEffects(d,p));d.matte.frames=2126;assert.throws(()=>prepareForegroundEffects(d,p),/geometry/);
});

test('real FFmpeg keeps subject pixels in front and shows video only outside the matte',()=>{
 const d={events:[{type:'behind-video',start:0,end:1,sourceIn:0,opacity:1}]};
 const graph=foregroundEffectFilters(d,'base',1);const script=join(dir,'occlusion.ffscript');writeFileSync(script,'[0:v]format=yuv420p[base];\n'+graph.filters.join(';\n')+';\n['+graph.base+']trim=start=0.5:end=0.534,setpts=PTS-STARTPTS[sample]\n');
 const data=execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=1080x1920:r=30:d=1.2','-f','lavfi','-i','color=c=white:s=512x896:r=30:d=1.2,drawbox=x=256:y=0:w=256:h=896:color=black:t=fill,format=gray','-f','lavfi','-i','color=c=blue:s=1080x1920:r=30:d=1.2','-filter_complex_threads','1','-filter_complex_script',script,'-map','[sample]','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'],{timeout:60000,maxBuffer:8*1024*1024});
 const pixel=x=>[...data.subarray((100*1080+x)*3,(100*1080+x)*3+3)];
 const subject=pixel(100),background=pixel(980);assert.ok(subject[0]>245&&subject[1]<5&&subject[2]<5,String(subject));assert.ok(background[2]>245&&background[0]<5&&background[1]<5,String(background));
});

test('reviewed foreground can share time with bounded foreground check badges',()=>{
 const compatible={...plan,semantic:{...plan.semantic,motions:[{start:6,end:7,params:{motionId:'CHECK_GREEN_01'}}]}};const d=fixture();d.cameraSpaceSha256=foregroundSpaceHash(compatible);assert.doesNotThrow(()=>prepareForegroundEffects(d,compatible));
 const unsafe={...plan,semantic:{...plan.semantic,motions:[{start:6,end:7,params:{motionId:'QUOTE_CARD_01'}}]}};assert.throws(()=>prepareForegroundEffects(fixture(),unsafe),/another composition/);
});


test('bounded background region feathers into original while preserving subject',()=>{
 const resource={localFile:file,sha256:digest,rights:'owned',duration:4},v={type:'behind-video',start:6,end:8.8,assetId:digest,sourceIn:0,opacity:1,reason:'Zona detrás del sujeto',region:{x:0,y:0,width:1080,height:960,featherBottom:400}};
 const f=fixture();f.events=[v];assert.doesNotThrow(()=>prepareForegroundEffects(f,plan,()=>resource));
 for(const r of [{...v.region,height:2000},{...v.region,x:-1},{...v.region,featherBottom:1000},{...v.region,width:1079}]){const x=fixture();x.events=[{...v,region:r}];assert.throws(()=>prepareForegroundEffects(x,plan,()=>resource),/invalid local video region/);}
 const graph=foregroundEffectFilters({events:[{...v,start:0,end:1}]},'base',1),script=join(dir,'feather.ffscript');
 writeFileSync(script,'[0:v]format=yuv420p[base];\n'+graph.filters.join(';\n')+';\n['+graph.base+']trim=start=0.5:end=0.534,setpts=PTS-STARTPTS[sample]\n');
 const data=execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=1080x1920:r=30:d=1.2','-f','lavfi','-i','color=c=white:s=512x896:r=30:d=1.2,drawbox=x=256:y=0:w=256:h=896:color=black:t=fill,format=gray','-f','lavfi','-i','color=c=blue:s=1080x1920:r=30:d=1.2','-filter_complex_threads','1','-filter_complex_script',script,'-map','[sample]','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'],{timeout:60000,maxBuffer:8*1024*1024});
 const pixel=(x,y)=>[...data.subarray((y*1080+x)*3,(y*1080+x)*3+3)],subject=pixel(100,100),top=pixel(980,100),fade=pixel(980,760),bottom=pixel(980,1100);
 assert.ok(subject[0]>240&&subject[2]<10,String(subject));assert.ok(top[2]>240&&top[0]<10,String(top));assert.ok(fade[0]>70&&fade[2]>70,String(fade));assert.ok(bottom[0]>240&&bottom[2]<10,String(bottom));
});
