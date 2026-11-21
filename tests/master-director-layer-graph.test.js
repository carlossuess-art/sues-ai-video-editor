import test from 'node:test';
import assert from 'node:assert/strict';
import {masterDirectorFingerprint} from '../src/master-director-gate.js';
import {buildMasterDirectorLayerGraph} from '../src/master-director-layer-graph.js';
const source='a'.repeat(64),master='b'.repeat(64),resource='c'.repeat(64);
const visual=()=>({rect:{x:80,y:100,width:640,height:1080},
 zIndex:2,opacity:1,stack:'behind-subject',mask:{proofId:'mask-1'},
 keyframes:[{atFrame:0,opacity:0},{atFrame:12,opacity:1,easing:'ease-out'},
  {atFrame:60,opacity:1},{atFrame:90,opacity:0,easing:'ease-in'}]});
const plan=()=>({
 schema:'sues-master-director/v1',
 source:{sha256:source,type:'original',editable:true,flattened:false},
 timeline:{fingerprint:'edit-abc',timeSpace:'edit-timeline',fps:30,duration:8},
 rules:{version:'rules-v1',precedence:['safety-and-rights','explicit-user-approval','locked-masters','project','profile','scene'],
  unresolvedConflicts:[],lockedMasters:[{id:'tapiz',sha256:master}]},
 scenes:[{id:'s1',start:0,end:8,purpose:'Metáfora de la liberación'}],
 operations:[{
  id:'mask-overlay-1',sceneId:'s1',start:2,end:5,track:'broll',
  renderer:'remotion',effect:'subject-occlusion',
  resourceId:resource,resourceSha256:resource,
  parameters:{visual:visual()},reason:'Representar la carga detrás del sujeto',
  dependsOn:[],requiredQA:['rendered-frame','motion-playback']
 }]
});
const registry=p=>({
 sourceSha256:source,timelineFingerprint:'edit-abc',approvedRuleVersion:'rules-v1',
 masterHashes:{tapiz:master},rendererCapabilities:{remotion:['subject-occlusion','text-behind-subject'],native:['caption-edit']},
 licensedAssets:{[resource]:{sha256:resource,rightsVerified:true,commercialUseAllowed:true}},
 approvedPlanFingerprint:masterDirectorFingerprint(p),canvas:{width:1080,height:1920},
 maskEvidence:{'mask-1':{verified:true,sourceSha256:source,start:0,end:8}}
});
test('the layer graph records source, masking, exact keyframes and semantics without flattening',()=>{
 const p=plan(),r=registry(p),out=buildMasterDirectorLayerGraph(p,r);
 assert.equal(out.status,'STRUCTURE_READY_NOT_RENDERED',JSON.stringify(out.issues));
 assert.equal(out.graph.nodes.length,1);
 assert.equal(out.graph.nodes[0].startFrame,60);assert.equal(out.graph.nodes[0].endFrame,150);
 assert.equal(out.graph.nodes[0].visual.zIndex,2);
 assert.equal(out.graph.nodes[0].visual.keyframes.length,4);
 assert.equal(out.graph.nodes[0].editability,'parameterized-layer');
 assert.equal(out.graph.editableInWebEditor,false);
 assert.equal(out.graph.rendered,false);
});
test('a declared subject mask without actual verified evidence cannot enter a layer graph',()=>{
 const p=plan(),r=registry(p);delete r.maskEvidence['mask-1'];
 const out=buildMasterDirectorLayerGraph(p,r);
 assert.equal(out.status,'BLOCKED');
 assert.ok(out.issues.some(x=>x.code==='SUBJECT_MASK_NOT_VERIFIED'));
});
test('a masked overlay cannot escape canvas or omit its spatial placement',()=>{
 const p=plan();p.operations[0].parameters.visual.rect.x=700;
 const out=buildMasterDirectorLayerGraph(p,registry(p));
 assert.ok(out.issues.some(x=>x.code==='LAYER_RECT_OUT_OF_CANVAS'));
});
test('text graphics require measurable font, weight, size and color',()=>{
 const p=plan();p.operations[0].effect='text-behind-subject';
 p.operations[0].parameters.text='LIBERTAD';
 const out=buildMasterDirectorLayerGraph(p,registry(p));
 assert.ok(out.issues.some(x=>x.code==='TYPOGRAPHY_PARAMETERS_MISSING'));
 p.operations[0].parameters.visual.typography={family:'Inter',sizePx:90,weight:800,color:'#FFFFFF'};
 assert.equal(buildMasterDirectorLayerGraph(p,registry(p)).status,'STRUCTURE_READY_NOT_RENDERED');
});
test('invalid animation keyframes are rejected instead of silently fixed',()=>{
 const p=plan();p.operations[0].parameters.visual.keyframes[1].atFrame=100;
 assert.ok(buildMasterDirectorLayerGraph(p,registry(p)).issues.some(x=>x.code==='LAYER_KEYFRAMES_INVALID'));
});
test('same z-index concurrent layers must be given distinct order',()=>{
 const p=plan();p.operations.push({...structuredClone(p.operations[0]),id:'mask-overlay-2',start:3,end:6});
 const out=buildMasterDirectorLayerGraph(p,registry(p));
 assert.ok(out.issues.some(x=>x.code==='LAYER_ORDER_AMBIGUOUS'));
});
test('native controls are preserved but are not falsely labelled full spatial editing',()=>{
 const p=plan();p.operations[0].renderer='native';
 p.operations[0].effect='caption-edit';
 p.operations[0].track='captions';
 p.operations[0].parameters={captionId:'seg-001',text:'Nueva palabra'};
 p.operations[0].resourceId=undefined;
 const out=buildMasterDirectorLayerGraph(p,registry(p));
 assert.equal(out.status,'STRUCTURE_READY_NOT_RENDERED');
 assert.equal(out.graph.nodes[0].editability,'native-controls-only');
});
test('a plan without recorded approval is not treated as editable or renderable',()=>{
 const p=plan(),r=registry(p);delete r.approvedPlanFingerprint;
 assert.equal(buildMasterDirectorLayerGraph(p,r).status,'AWAITING_PLAN_APPROVAL');
});
