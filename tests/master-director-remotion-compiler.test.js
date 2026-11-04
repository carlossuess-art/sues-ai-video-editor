import test from 'node:test';
import assert from 'node:assert/strict';
import {compileMasterDirectorRemotion} from '../src/master-director-remotion-compiler.js';
const graph=()=>({schema:'sues-layer-graph/v1',sourceSha256:'a'.repeat(64),planFingerprint:'b'.repeat(64),canvas:{width:1080,height:1920},fps:30,durationFrames:90,nodes:[{id:'text-1',renderer:'remotion',track:'graphics',effect:'text',startFrame:3,endFrame:60,visual:{rect:{x:12,y:45,width:300,height:120},zIndex:4,opacity:0.8,typography:{family:'Montserrat',sizePx:80,weight:700,color:'#ffffff'},keyframes:[{atFrame:0,x:0,easing:'linear'},{atFrame:20,x:30,easing:'linear'}]},sourceParameters:{text:'Hola',visual:{}}}]});
test('preserves spatial and temporal attributes for supported text',()=>{
 const g=graph();g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);const r=compileMasterDirectorRemotion(g,{verifiedFontFamilies:['Montserrat']});
 assert.equal(r.status,'READY_FOR_REMOTION_RENDER');assert.equal(r.composition.layers[0].startFrame,3);
 assert.deepEqual(r.composition.layers[0].visual,g.nodes[0].visual);assert.equal(r.composition.layers[0].text,'Hola');
});
test('refuses masks, unsupported effects, unverified fonts and nonlinear easing rather than flattening them',()=>{
 for(const mutate of [g=>g.nodes[0].visual.mask={proofId:'test'},g=>g.nodes[0].effect='subject-occlusion',g=>g.nodes[0].visual.typography.family='missing',g=>g.nodes[0].visual.keyframes[0].easing='spring',g=>g.nodes[0].sourceParameters.shadow=true]){
  const g=graph();g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);mutate(g);const r=compileMasterDirectorRemotion(g,{verifiedFontFamilies:['Montserrat']});
  assert.equal(r.status,'BLOCKED');assert.equal(r.composition,null);assert.ok(r.issues.length);
 }
});
