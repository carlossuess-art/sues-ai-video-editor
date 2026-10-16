import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareLocalPreview,wrapCaption,buildPreviewASS,buildPreviewFilter,cameraExpression} from '../src/local-preview.js';
import {sampleReframeAt} from '../src/reframe.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
function input(){return {
 template:read('../examples/templates/sues-calma.template.json'),brand:read('../examples/brand-kit.sues.json'),
 source:{width:1080,height:1920,duration:10},segments:[{in:0,out:3},{in:5,out:10}],
 transcript:{version:'1.0',language:'es',sourceDuration:10,words:[{text:'Antes.',start:1,end:2},{text:'omitida.',start:3.5,end:4},{text:'Después.',start:6,end:7}]},
 camera:{keyframes:[{time:0,x:0,y:0,width:900,height:1600,zoom:1.2},{time:10,x:100,y:200,width:900,height:1600,zoom:1.2}]}
};}
test('preview maps camera, spoken captions and outro to same edit duration',()=>{
 const p=prepareLocalPreview(input());assert.equal(p.duration,8);assert.equal(p.cameraSpans.length,2);
 assert.deepEqual(p.captions.map(c=>[c.text,c.start,c.end]),[['Antes.',1,2],['Después.',4,5]]);
 assert.equal(p.originalVoice,true);assert.equal(p.productionReady,false);
 const ass=buildPreviewASS(p);assert.ok(ass.includes('0:00:05.00,0:00:08.00,Outro'));
 assert.ok(p.layout.caption.bottom<p.layout.outro.top);assert.ok(p.layout.outro.bottom<=1540);
});
test('caption line wrapping uses kit limits and blocks ASS override text',()=>{
 assert.deepEqual(wrapCaption('Una frase',26),['Una frase']);
 assert.ok(wrapCaption('Una frase que ocupa dos líneas diferentes',26).every(x=>x.length<=26));
 assert.throws(()=>wrapCaption('x'.repeat(27),26));
 const p=prepareLocalPreview(input());p.captions[0].lines=['{\\pos(1,1)}'];
 assert.ok(!buildPreviewASS(p).includes('{\\pos(1,1)}'));
});
test('unsupported camera or selected unbound footage fail explicitly',()=>{
 let i=input();i.camera.keyframes[1].width=Infinity;assert.throws(()=>prepareLocalPreview(i));
 i=input();i.camera.keyframes.reverse();assert.throws(()=>prepareLocalPreview(i));
 i=input();i.camera.keyframes[1].width=850;assert.throws(()=>prepareLocalPreview(i));
 i=input();i.slots=[{start:2,end:5,reason:'naturaleza',tags:['water']}];i.assets=[{id:'water',kind:'nature',sourceRef:'owned-water',duration:8,tags:['water'],available:true}];
 assert.throws(()=>prepareLocalPreview(i),/B-roll requires/);
});
test('crop expression follows real keyframe interpolation with endpoint hold',()=>{
 const cam=input().camera;cam.keyframes.splice(1,0,{...cam.keyframes[0],time:2,x:30,y:60});
 for(const field of ['x','y']){
  const f=new Function('t','clip','return '+cameraExpression(cam,field));
  for(const t of [0,1,2,5,10,15])assert.ok(Math.abs(f(t,(v,a,b)=>Math.max(a,Math.min(b,v)))-sampleReframeAt(cam,t)[field])<1e-8);
 }
});
test('filter crops with source timestamps before resetting each cut and keeps optional audio',()=>{
 const p=prepareLocalPreview(input()),f=buildPreviewFilter(p);
 assert.ok(f.indexOf('crop=')<f.indexOf('setpts=PTS-0/TB'));assert.ok(f.includes('atrim=start=5:end=10'));
 assert.ok(f.includes('concat=n=2:v=1:a=1'));assert.ok(!buildPreviewFilter(p,{hasAudio:false}).includes('[0:a]'));
 assert.throws(()=>buildPreviewFilter(p,{assFile:'https://example.com/x.ass'}));
});
test('bound footage overlays video only and references cannot be reused as B-roll',()=>{
 const i=input();i.slots=[{start:2,end:5,reason:'naturaleza',tags:['water']}];i.assets=[{id:'water',kind:'nature',sourceRef:'owned-water',duration:8,tags:['water'],available:true}];i.mediaBindings={'owned-water':'/local/owned-water.mp4'};
 const p=prepareLocalPreview(i),filter=buildPreviewFilter(p);
 assert.equal(p.selectedMedia.length,1);assert.ok(filter.includes('[1:v]trim=start=0:end=3'));
 assert.ok(filter.includes('repeatlast=0'));assert.ok(!filter.includes('[1:a]'));assert.ok(filter.includes('lt(t,5)'));
 i.assets[0].role='style-reference';assert.throws(()=>prepareLocalPreview(i),/reference media/);
});
test('non-final fractional-frame cuts fail instead of accumulating sync drift',()=>{
 const i=input();i.segments=[{in:0,out:3.01},{in:5,out:10}];assert.throws(()=>prepareLocalPreview(i),/whole number/);
});
test('uncertain point word stays with a timed caption block without fabricated word duration',()=>{
 const i=input();i.transcript.words=[{text:'Un',start:1,end:1.5},{text:'mundo.',start:1.5,end:1.5,timingUncertain:true}];
 const p=prepareLocalPreview(i);assert.equal(p.captions[0].text,'Un mundo.');assert.equal(p.captions[0].end,1.5);
});
test('absolute crop zoom cannot bypass the limit by changing zoom metadata',()=>{
 const i=input();i.camera.keyframes=i.camera.keyframes.map(k=>({...k,width:540,height:960,zoom:1.2}));assert.throws(()=>prepareLocalPreview(i),/absolute camera zoom/);
});
