import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {buildFableCutEditableMotionCandidate} from '../src/motion-templates/fablecut-editable-candidate.js';
const require=createRequire(import.meta.url);
const candidate=()=>buildFableCutEditableMotionCandidate();

test('prepares two genuine nested compositions without modifying the editor',()=>{
 const p=candidate();
 assert.equal(p.status,'STRUCTURAL_CANDIDATE_NOT_RENDER_APPROVED');
 assert.equal(p.operations.length,3);
 assert.deepEqual(p.operations.map(x=>x.op),['addComp','addComp','addClip']);
 assert.equal(p.operations[2].clip.kind,'comp');
 assert.equal(p.operations[2].clip.compId,p.operations[1].comp.id);
 assert.equal(p.productionChanged,false);
 assert.equal(p.nativeExecuted,false);
});
test('preserves shape radius trigger, camera exit and word layers in editable objects',()=>{
 const p=candidate(),card=p.operations[0].comp,scene=p.operations[1].comp;
 const outline=card.clips.find(x=>x.id==='card-outline');
 assert.deepEqual(outline.props.shapes[0].keys.map(k=>k.t),[0,7/30,8/30,19/30].map(v=>Number(v.toFixed(4))));
 assert.equal(outline.props.shapes[0].keys.at(-1).radius,62);
 assert.equal(card.clips.filter(x=>x.kind==='text').length,4);
 assert.equal(scene.clips.filter(x=>x.kind==='text').length,4);
 const camera=scene.clips.find(x=>x.id==='nested-card-scene');
 assert.equal(camera.keyframes.scale.at(-1).v,4.5);
 assert.equal(camera.keyframes.y.at(-1).v,-1950);
 assert.equal(camera.compId,card.id);
 assert.equal(scene.clips.filter(x=>x.kind==='shape').length,4);
});
test('does not silently claim pixel/blur/typography fidelity or authorise editing',()=>{
 const p=candidate();
 assert.equal(p.requiresCreativeApproval,true);
 assert.ok(p.incompleteFidelity.some(x=>x.includes('Gaussian')));
 assert.ok(p.incompleteFidelity.some(x=>x.includes('mask')));
 assert.ok(p.editableParts.length>=5);
});
test('real FableCut project-ops structurally validates both comps in an unsaved in-memory fixture', {skip:!process.env.SUES_FABLECUT_PROJECT_OPS},()=>{
 const Ops=require(process.env.SUES_FABLECUT_PROJECT_OPS);
 const doc={width:1080,height:1920,fps:30,revision:0,tracks:[{id:'V1',kind:'video'}],clips:[],media:[],comps:[]};
 const p=candidate();
 Ops.applyPatch(doc,p.operations);
 Ops.checkProject(doc);
 assert.equal(doc.comps.length,2);
 assert.equal(doc.clips.length,1);
 assert.equal(doc.clips[0].kind,'comp');
 assert.ok(doc.comps[0].clips.some(x=>x.kind==='shape'));
 assert.equal(doc.media.length,0);
 const {dirname,join}=require('node:path');
 const Comp=require(join(dirname(process.env.SUES_FABLECUT_PROJECT_OPS),'comp.js'));
 const flattened=Comp.flatten(doc);
 assert.equal(flattened.filter(c=>c.kind==='text').length,8);
 assert.equal(flattened.filter(c=>c.kind==='shape').length,5);
 assert.equal(flattened.filter(c=>c.kind==='comp').length,1);
 assert.ok(flattened.some(c=>c.id.endsWith('nested-card-scene>card-word-0')));

});
