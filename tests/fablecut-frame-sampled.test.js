import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {buildFrameSampledEditableCandidate} from '../src/motion-templates/fablecut-frame-sampled-candidate.js';
import {sampleHookDropCard} from '../src/motion-templates/hook-drop-card-engine.js';
import {sampleCardToSpace,SPACE_EVENTS} from '../src/motion-templates/sequence-card-to-space.js';
const require=createRequire(import.meta.url);
const result=()=>buildFrameSampledEditableCandidate();
const clip=(comp,id)=>comp.clips.find(c=>c.id===id);
const tolerance=(actual,expected,label,allowed=.5)=>assert.ok(
 Math.abs(actual-expected)<=allowed,
 label+': native '+actual+' vs source '+expected
);
test('samples SVG card radius and whole-comp camera once per 30fps frame',()=>{
 const x=result(),card=x.operations[0].comp,scene=x.operations[1].comp;
 const keys=clip(card,'card-outline').props.shapes[0].keys;
 assert.equal(keys.length,20);
 assert.equal(keys[0].radius,0);
 assert.equal(keys.at(-1).radius,62);
 for(const f of [0,1,5,7,8,10,12,15,17,19]){
  tolerance(keys[f].h,sampleHookDropCard(f).card.h,'height f'+f,.0001);
  tolerance(keys[f].radius,sampleHookDropCard(f).card.rx,'radius f'+f,.0001);
 }
 const camera=clip(scene,'nested-card-scene').keyframes;
 assert.equal(camera.scale.length,70);
 assert.equal(camera.y.length,70);
 for(const f of [0,7,8,51,55,60,65,69]){
  tolerance(camera.scale[f].v,sampleHookDropCard(f).camera.scale,'zoom f'+f,.0001);
  tolerance(camera.y[f].v,sampleHookDropCard(f).camera.dy,'shift f'+f,.0001);
 }
 assert.ok(x.incompleteFidelity.length>0);
 assert.equal(x.productionChanged,false);
 assert.equal(x.nativeExecuted,false);
});
test('native rail keys track actual SVG positions and opacities',()=>{
 const x=result(),scene=x.operations[1].comp,start=SPACE_EVENTS.railsStart;
 for(const [id,key] of [['left-rail','leftX'],['right-rail','rightX']]){
  const items=clip(scene,id).props.shapes[0].keys;
  assert.equal(items.length,SPACE_EVENTS.railsEnd-start+1);
  for(const f of [59,61,64,69,76,81,88,91]){
   const at=items[f-start],source=sampleCardToSpace(f).rails;
   tolerance(at.x,source[key]-540,'x f'+f,.0001);
   tolerance(at.y,source.y-960,'y f'+f,.0001);
   tolerance(at.opacity,source.opacity**2,'alpha f'+f,.0001);
  }
 }
});
test('FableCut shape runtime interpolates exact sampled frames, not its default easing', {skip:!process.env.SUES_FABLECUT_PROJECT_OPS},()=>{
 const {dirname,join}=require('node:path');
 const M=require(join(dirname(process.env.SUES_FABLECUT_PROJECT_OPS),'motion.js'));
 const x=result(),card=clip(x.operations[0].comp,'card-outline').props.shapes[0];
 const scene=x.operations[1].comp;
 const shape=M.normalizeShapes([card],true);
 for(const f of [0,4,7,8,12,16,19]){
  const actual=M.shapesAt(shape,f/30)[0],expected=sampleHookDropCard(f).card;
  tolerance(actual.h,expected.h,'actual height f'+f);
  tolerance(actual.radius,expected.rx,'actual radius f'+f);
 }
 const rail=M.normalizeShapes([clip(scene,'left-rail').props.shapes[0]],true);
 for(const f of [59,64,69,76,81,91]){
  const at=M.shapesAt(rail,(f-59)/30)[0],ref=sampleCardToSpace(f).rails;
  tolerance(at.x,ref.leftX-540,'actual rail x f'+f);
  tolerance(at.y,ref.y-960,'actual rail y f'+f);
  tolerance(at.opacity,ref.opacity**2,'actual rail alpha f'+f);
 }
});
test('FableCut real ops accepts unsaved editability of sampled structure', {skip:!process.env.SUES_FABLECUT_PROJECT_OPS},()=>{
 const Ops=require(process.env.SUES_FABLECUT_PROJECT_OPS);
 const {dirname,join}=require('node:path');
 const Comp=require(join(dirname(process.env.SUES_FABLECUT_PROJECT_OPS),'comp.js'));
 const doc={width:1080,height:1920,fps:30,revision:0,tracks:[{id:'V1',kind:'video'}],clips:[],media:[],comps:[]};
 Ops.applyPatch(doc,result().operations);
 Ops.checkProject(doc);
 const flattened=Comp.flatten(doc);
 assert.equal(doc.comps.length,2);
 assert.equal(flattened.filter(x=>x.kind==='text').length,8);
 assert.equal(flattened.filter(x=>x.kind==='shape').length,5);
 assert.equal(doc.media.length,0);
});

test('native text layers sample source word opacity without inventing motion in Y',()=>{
 const x=result(),first=x.operations[0].comp,second=x.operations[1].comp;
 for(const [comp,ids,source,fadeFrames] of [
  [first,['card-word-0','card-word-1','card-word-2','card-word-l2-0'],sampleHookDropCard,6],
  [second,['follow-word-0','follow-word-1','follow-word-l2-0','follow-word-l2-1'],sampleCardToSpace,7]
 ]){
  ids.forEach((id,i)=>{
   const layer=clip(comp,id);
   assert.equal(layer.kind,'text');
   assert.equal(layer.keyframes.y,undefined,'Do not invent upward translation absent in SVG render');
   const keys=layer.keyframes.opacity;
   assert.equal(keys.length,fadeFrames+1);
   const firstFrame=Math.round(layer.start*30);
   for(let j=0;j<=fadeFrames;j++){
    const state=source(firstFrame+j);
    const expected=state.text?.words?.[i]?.opacity??state.words?.[i]?.opacity;
    tolerance(keys[j].v,expected,'word alpha '+id+' '+j,.0001);
   }
   assert.equal(keys[0].v,0);
   assert.equal(keys.at(-1).v,1);
  });
 }
});
