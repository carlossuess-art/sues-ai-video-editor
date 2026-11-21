import test from 'node:test';
import assert from 'node:assert/strict';
import {masterDirectorFingerprint} from '../src/master-director-gate.js';
import {bridgeMasterDirectorToNative} from '../src/master-director-native-bridge.js';
const src='a'.repeat(64),master='b'.repeat(64),video='c'.repeat(64),sfx='d'.repeat(64);
const plan=()=>({
 schema:'sues-master-director/v1',
 source:{sha256:src,type:'original',editable:true,flattened:false},
 timeline:{fingerprint:'edit-001',timeSpace:'edit-timeline',fps:30,duration:12},
 rules:{version:'approved-v1',precedence:['safety-and-rights','explicit-user-approval','locked-masters','project','profile','scene'],
 unresolvedConflicts:[],lockedMasters:[{id:'tapiz',sha256:master}]},
 scenes:[{id:'intro',start:0,end:6,purpose:'Crear inquietud'},
         {id:'cierre',start:6,end:12,purpose:'Liberar la tensión'}],
 creativeContext:{centralMessage:'La liberación',motifs:[]},
 operations:[{id:'v1',sceneId:'intro',start:3,end:6,renderer:'native',
   effect:'broll-fullframe',track:'broll',reason:'Mostrar metáfora clara de transformación',
   resourceId:video,resourceSha256:video,parameters:{sourceIn:0},
   dependsOn:[],requiredQA:['rendered-frame','motion-playback']}]
});
const registry=(p=plan())=>({
 sourceSha256:src,timelineFingerprint:'edit-001',approvedRuleVersion:'approved-v1',
 masterHashes:{tapiz:master},rendererCapabilities:{
  native:['broll-fullframe','sfx-one-shot','caption-edit','caption-hide','caption-emphasis','zoom-native',
  'transition-native','card-grid-native','motion-catalog-native','music-full-video','image-native-auto']
 },licensedAssets:{
  [video]:{sha256:video,rightsVerified:true,commercialUseAllowed:true,kind:'video'},
  [sfx]:{sha256:sfx,rightsVerified:true,commercialUseAllowed:true,kind:'sfx',duration:.7}
 },approvedPlanFingerprint:masterDirectorFingerprint(p)
});
const catalogue=()=>({
 schema:'sues-edit-plan/v1',sourceSha256:src,timelineFingerprint:'edit-001',duration:12,timeSpace:'edit-timeline',
 captions:[{id:'seg-001',start:2,end:4,text:'Mensaje'}],motionResources:[{id:'NUMBER_BADGE_GOLD_01'}]
});
test('master-approved native B-roll remains exact and retains operation ID mapping',()=>{
 const p=plan(),r=registry(p),out=bridgeMasterDirectorToNative(p,r,catalogue());
 assert.equal(out.status,'READY_FOR_NATIVE_REVIEW');
 assert.equal(out.canApply,false);assert.equal(out.plan.operations.length,1);
 assert.deepEqual(out.plan.operations[0],{type:'broll',resourceId:video,start:3,end:6,
  reason:'Mostrar metáfora clara de transformación',sourceIn:0});
 assert.equal(out.operationMapping[0].masterOperationId,'v1');
});
test('the plan cannot reach the native importer before per-video approval',()=>{
 const p=plan(),r=registry(p);delete r.approvedPlanFingerprint;
 assert.equal(bridgeMasterDirectorToNative(p,r,catalogue()).status,'AWAITING_PLAN_APPROVAL');
});
test('behind-subject Remotion masks cannot become full-frame B-roll',()=>{
 const p=plan();p.operations[0].renderer='remotion';p.operations[0].effect='subject-occlusion';
 const r=registry(p);r.rendererCapabilities.remotion=['subject-occlusion'];
 const out=bridgeMasterDirectorToNative(p,r,catalogue());
 assert.equal(out.status,'NEEDS_ENGINE_OR_RESOURCE_WORK');
 assert.equal(out.plan,null);
 assert.ok(out.issues.some(e=>e.code==='ENGINE_ADAPTER_REQUIRED'));
});
test('extra geometric and typography parameters cannot be silently omitted',()=>{
 const p=plan();p.operations[0].parameters={sourceIn:0,x:100,y:220,fontPx:80};
 const out=bridgeMasterDirectorToNative(p,registry(p),catalogue());
 assert.equal(out.plan,null);
 assert.ok(out.issues.some(e=>e.code==='NO_LOSSLESS_NATIVE_MAPPING'));
});
test('different video SHA or timeline revision invalidates the native bridge',()=>{
 const p=plan(),r=registry(p),c=catalogue();c.timelineFingerprint='other';
 assert.equal(bridgeMasterDirectorToNative(p,r,c).plan,null);
 p.operations[0].resourceSha256='e'.repeat(64);
 assert.equal(bridgeMasterDirectorToNative(p,registry(p),catalogue()).plan,null);
});
test('every unsupported operation blocks the WHOLE plan, not only itself',()=>{
 const p=plan();p.operations.push({...p.operations[0],id:'v2',sceneId:'cierre',start:7,end:8,
  effect:'unsupported-graphed-neon',track:'graphics',parameters:{x:20}});
 const r=registry(p);r.rendererCapabilities.native.push('unsupported-graphed-neon');
 const out=bridgeMasterDirectorToNative(p,r,catalogue());
 assert.equal(out.status,'NEEDS_ENGINE_OR_RESOURCE_WORK');assert.equal(out.plan,null);
 assert.equal(out.operationMapping.length,1);
});
test('SFX timestamps must reflect intrinsic asset duration, not fake shortening',()=>{
 const p=plan();p.operations=[{...p.operations[0],id:'sound',effect:'sfx-one-shot',track:'sfx',
 resourceId:sfx,resourceSha256:sfx,start:4,end:4.3,parameters:{gain:.3}}];
 const out=bridgeMasterDirectorToNative(p,registry(p),catalogue());
 assert.ok(out.issues.some(e=>e.code==='NO_LOSSLESS_NATIVE_MAPPING'));
 p.operations[0].end=4.7;
 const ok=bridgeMasterDirectorToNative(p,registry(p),catalogue());
 assert.equal(ok.status,'READY_FOR_NATIVE_REVIEW');
 assert.deepEqual(ok.plan.operations[0],{type:'sfx',resourceId:sfx,start:4,gain:.3});
});
test('a stale caption reference cannot be fabricated',()=>{
 const p=plan();p.operations=[{...p.operations[0],track:'captions',effect:'caption-edit',
 resourceId:undefined,resourceSha256:undefined,parameters:{captionId:'invented',text:'No existe'}}];
 assert.equal(bridgeMasterDirectorToNative(p,registry(p),catalogue()).plan,null);
});
test('native transition only accepts real 0.4 second duration',()=>{
 const p=plan();p.operations=[{...p.operations[0],track:'transition',effect:'transition-native',
 resourceId:undefined,resourceSha256:undefined,start:4,end:4.5,parameters:{kind:'blur'}}];
 assert.equal(bridgeMasterDirectorToNative(p,registry(p),catalogue()).plan,null);
 p.operations[0].end=4.4;
 assert.equal(bridgeMasterDirectorToNative(p,registry(p),catalogue()).status,'READY_FOR_NATIVE_REVIEW');
});
test('two edits cannot silently cross the 200-op native import limit',()=>{
 const p=plan();p.operations=Array.from({length:201},(_,i)=>({
 ...p.operations[0],id:'v'+i,sceneId:i%2?'cierre':'intro',start:i%2?7:3,end:i%2?10:6
 }));
 const out=bridgeMasterDirectorToNative(p,registry(p),catalogue());
 assert.equal(out.status,'NEEDS_ENGINE_OR_RESOURCE_WORK');assert.equal(out.plan,null);
});

test('caption timing cannot drift from its measured subtitle',()=>{
 const p=plan();p.operations=[{...p.operations[0],id:'captions-1',track:'captions',effect:'caption-edit',
  resourceId:undefined,resourceSha256:undefined,start:3,end:6,
  parameters:{captionId:'seg-001',text:'Mensaje corregido'}}];
 const rejected=bridgeMasterDirectorToNative(p,registry(p),catalogue());
 assert.equal(rejected.plan,null);
 p.operations[0].start=2;p.operations[0].end=4;
 const accepted=bridgeMasterDirectorToNative(p,registry(p),catalogue());
 assert.equal(accepted.status,'READY_FOR_NATIVE_REVIEW');
});


test('structured formats preserve explicit copy, timing and presenter replacement intent',()=>{
 for(const [format,item] of [['LIST',{captionId:'seg-001',label:'Una idea'}],['RANKING',{captionId:'seg-001',label:'Una idea',number:2}],['COMPARE',{captionId:'seg-001',label:'Primera',secondary:'Segunda'}],['Q&A',{captionId:'seg-001',label:'Pregunta',secondary:'Respuesta'}],['REVEAL',{captionId:'seg-001',label:'Descubrir'}],['FLOW',{captionId:'seg-001',label:'Primer paso'}]]){
  const p=plan();p.operations=[{...p.operations[0],track:'graphics',effect:'elements-native',resourceId:undefined,resourceSha256:undefined,start:2,end:4,parameters:{format,items:[item],coversPresenter:true,replace:false}}];
  const r=registry(p);r.rendererCapabilities.native.push('elements-native');
  const out=bridgeMasterDirectorToNative(p,r,catalogue());assert.equal(out.status,'READY_FOR_NATIVE_REVIEW',format+JSON.stringify(out.issues));
  assert.deepEqual(out.plan.operations[0],{type:'elements',format,items:[item],replace:false});
  p.operations[0].end=4.1;assert.equal(bridgeMasterDirectorToNative(p,registry(p),catalogue()).plan,null);
 }
});
