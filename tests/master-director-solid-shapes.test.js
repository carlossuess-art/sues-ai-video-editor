import test from 'node:test';
import assert from 'node:assert/strict';
import {compileMasterDirectorRemotion} from '../src/master-director-remotion-compiler.js';
const graph=()=>({schema:'sues-layer-graph/v1',sourceSha256:'a'.repeat(64),planFingerprint:'b'.repeat(64),canvas:{width:1080,height:1920},fps:30,durationFrames:90,nodes:[{
 id:'shape-m01-left',sceneId:'scene-03',renderer:'remotion',track:'graphics',effect:'solid-rect',startFrame:0,endFrame:60,
 visual:{rect:{x:95,y:770,width:400,height:350},zIndex:5,opacity:1,keyframes:[{atFrame:0,x:-200,easing:'ease-out'},{atFrame:15,x:0,easing:'linear'}]},
 sourceParameters:{fill:'#303038',cornerRadius:18,visual:null}
}]});
test('a verified procedural visual block retains exact fill, geometry, easing, temporal range and z order',()=>{
 const g=graph();g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);
 const r=compileMasterDirectorRemotion(g);assert.equal(r.status,'READY_FOR_REMOTION_STAGING');
 const [shape]=r.composition.layers;assert.equal(shape.kind,'shape');assert.equal(shape.fill,'#303038');assert.equal(shape.cornerRadius,18);
 assert.deepEqual(shape.visual,g.nodes[0].visual);assert.equal(shape.startFrame,0);assert.equal(shape.endFrame,60);
});
test('shape primitive rejects unrecognized effects, colors, extra properties, masks and typed dimensions',()=>{
 for(const change of [
  n=>n.effect='advanced-metal-material',n=>n.sourceParameters.fill='not-a-color',
  n=>n.sourceParameters.cornerRadius=500,n=>n.sourceParameters.shadow={blur:99},
  n=>n.visual.mask={proofId:'not-real',mode:'alpha-keep'},n=>n.visual.typography={family:'NoFont'},
  n=>n.renderer='native',n=>n.track='broll'
 ]){
  const g=graph();g.nodes[0].sourceParameters.visual=structuredClone(g.nodes[0].visual);change(g.nodes[0]);
  assert.equal(compileMasterDirectorRemotion(g).status,'BLOCKED');
 }
});
