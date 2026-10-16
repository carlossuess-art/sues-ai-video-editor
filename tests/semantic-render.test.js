import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTemplatePolicy} from '../src/template.js';
import {buildTimeMap} from '../src/time-map.js';
import {prepareSemanticRender,zoomScaleAt,semanticZoomFilter} from '../src/semantic-render.js';
const read=p=>JSON.parse(readFileSync(new URL('../examples/'+p,import.meta.url)));
function input(decisions=[]){return {
 director:{version:'1.0',templateId:'SUES_CALMA',timeSpace:'edit-timeline',decisions},
 policy:compileTemplatePolicy(read('templates/sues-calma.template.json'),read('brand-kit.sues.json')),
 camera:{keyframes:[{time:0,x:0,y:0,width:1080,height:1920,zoom:1},{time:12,x:0,y:0,width:1080,height:1920,zoom:1}]},
 timeMap:buildTimeMap([{in:0,out:12}],12),catalog:read('motions/catalog.sample.json'),broll:{decisions:[]},
 visionFrames:[0,12].map(time=>({time,frameWidth:1080,frameHeight:1920,faces:[{x:400,y:600,width:280,height:400,score:1,leftEye:{x:520,y:768},rightEye:{x:560,y:768}}]}))
};}
const zoom=(start=2,end=6,scale=1.08)=>({type:'zoom',start,end,reason:'giro semántico',rule:'manual-test',params:{reason:'revelation',scale,ramp:1}});
const motion=(id,bindings,start=3,end=5)=>({type:'motion',start,end,reason:'cita semántica',rule:'manual-test',params:{motionId:id,bindings,semanticReason:id==='QUOTE_CARD_01'?'reflection':id==='NUMBER_BADGE_GOLD_01'?'steps':'comparison'}});
test('zoom is identity outside semantic event and has smooth ramps/held plateau',()=>{
 const p=prepareSemanticRender(input([zoom()]));
 for(const t of [0,2,6,8])assert.equal(zoomScaleAt(p.zooms,t),1);
 assert.equal(zoomScaleAt(p.zooms,4),1.08);assert.ok(zoomScaleAt(p.zooms,2.5)>1&&zoomScaleAt(p.zooms,2.5)<1.08);
 assert.ok(p.audit.frames>=360);assert.ok(Math.abs(p.anchors[0].points[0].y-.4)<1e-9);
 assert.ok(semanticZoomFilter(p).includes('sense=source:eval=frame'));
});
test('rejects missing time space, unsupported event type, overlap and unbound eyes',()=>{
 let x=input([zoom()]);delete x.director.timeSpace;assert.throws(()=>prepareSemanticRender(x));
 x=input([{type:'look',start:3,end:4,reason:'look',rule:'rule'}]);assert.throws(()=>prepareSemanticRender(x),/unimplemented/);
 assert.throws(()=>prepareSemanticRender(input([zoom(),zoom(5,8)])),/gap/);
 x=input([zoom()]);x.visionFrames=[];assert.throws(()=>prepareSemanticRender(x));
});
test('rejects combined zoom above 1.60, head clipping and events hidden by B-roll',()=>{
 let x=input([zoom()]);x.camera.keyframes.forEach(k=>k.zoom=1.5);x.director.decisions[0].params.scale=1.12;assert.throws(()=>prepareSemanticRender(x),/combined/);
 x=input([zoom()]);x.visionFrames.forEach(f=>{f.faces[0].y=0;f.faces[0].height=900;});assert.throws(()=>prepareSemanticRender(x),/clips/);
 x=input([zoom()]);x.broll.decisions=[{type:'broll',start:3,end:4}];assert.throws(()=>prepareSemanticRender(x),/hidden/);
});
test('registered quote binds literal text and chooses a safe box; missing binding fails',()=>{
 const p=prepareSemanticRender(input([motion('QUOTE_CARD_01',{quote:'Vuelve a ti.'})]));
 assert.equal(p.motions[0].box.top,200);assert.equal(p.motions[0].instance.layers[1].content,'Vuelve a ti.');
 assert.throws(()=>prepareSemanticRender(input([motion('QUOTE_CARD_01',{})])),/binding/);
 assert.throws(()=>prepareSemanticRender(input([motion('QUOTE_CARD_01',{quote:''})])),/motion text/);
});
test('number and divider renderers bind and motion layers scale to event duration',()=>{
 const p=prepareSemanticRender(input([motion('NUMBER_BADGE_GOLD_01',{number:'2',label:'Dos pasos'},2,4),motion('DIVIDER_LINE_01',{},5,7)]));
 assert.ok(p.motions[0].layerTimes.label.start>2);assert.equal(p.motions[1].lines[0],'');
 assert.throws(()=>prepareSemanticRender(input([motion('NUMBER_BADGE_GOLD_01',{number:'0',label:'Cero'})])),/badge number/);
});
test('anchor spans retain distinct source endpoints on both sides of an edit cut',()=>{
 const x=input([zoom()]);x.timeMap=buildTimeMap([{in:0,out:4},{in:8,out:16}],16);x.camera.keyframes.at(-1).time=16;x.visionFrames.at(-1).time=16;
 const p=prepareSemanticRender(x);assert.equal(p.anchors[0].points.at(-1).sourceTime,4);assert.equal(p.anchors[1].points[0].sourceTime,8);
 assert.ok(semanticZoomFilter(p).includes('if(lt((on/30),4)'));
});
test('motion trigger semantics are enforced instead of accepting arbitrary reasons',()=>{
 const x=input([motion('QUOTE_CARD_01',{quote:'Texto'})]);x.director.decisions[0].params.semanticReason='wrong';assert.throws(()=>prepareSemanticRender(x),/semantic reason/);
});
test('active captions and outro cannot cover a projected face during semantic render',()=>{
 const x=input([zoom()]);x.captions=[{start:1,end:2}];x.layout={caption:{left:400,right:680,top:600,bottom:1000},outro:{left:100,right:900,top:1430,bottom:1530}};
 assert.throws(()=>prepareSemanticRender(x),/overlaps caption/);
});
