import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEngineNextLedger,classifyOperation,ENGINE_NEXT_QA_CRITERIA,ENGINE_NEXT_SOURCES}
  from '../../src/engine-next/engine-capabilities.js';
const story=()=>({
 schema:'sues-master-story/v1',sourceSha256:'a'.repeat(64),
 narrative:{scenes:[{id:'s1',start:0,end:10}]},
 resources:[{id:'child',source:'library',kind:'image',assetId:'b'.repeat(64)}],
 operations:[
  {id:'camera',sceneId:'s1',track:'camera',effect:'original-camera-visual',start:0,end:4,parameters:{}},
  {id:'b02',sceneId:'s1',track:'broll',effect:'mask-behind-carlos-child-visible',start:4,end:8,resourceRef:'child',parameters:{requiresTracking:true}},
  {id:'motion',sceneId:'s1',track:'graphics',effect:'cinematic-motion-full-frame',start:8,end:10,parameters:{}}
 ]});
test('Every approved intent survives gap analysis, not silently downcompiled',()=>{
 const src=story(),x=buildEngineNextLedger(src,{sourceSha256:src.sourceSha256});
 assert.equal(x.operationCount,3);
 assert.deepEqual(x.operations.map(o=>o.operationId),['camera','b02','motion']);
 assert.equal(x.operations[1].status,'temporal-matte-needed');
 assert.equal(x.operations[2].status,'hyperframes-source-needed');
 assert.equal(x.renderStatus,'NO_EXECUTABLE_ENGINE_CERTIFIED');
});
test('Missing scene and resource are hard failures',()=>{
 const a=story();a.operations[1].sceneId='missing';
 assert.throws(()=>buildEngineNextLedger(a),/outside/);
 const b=story();b.operations[1].resourceRef='ghost';
 assert.throws(()=>buildEngineNextLedger(b),/Unknown asset/);
});
test('Identity, duplicates, chronology and unsupported tracks fail closed',()=>{
 const a=story();assert.throws(()=>buildEngineNextLedger(a,{sourceSha256:'0'.repeat(64)}),/Authentic/);
 const b=story();b.operations[1].id='camera';assert.throws(()=>buildEngineNextLedger(b),/Duplicate/);
 const c=story();c.operations[0].start=8;c.operations[0].end=4;
 assert.equal(buildEngineNextLedger(c).operations[0].status,'invalid-contract');
 assert.equal(classifyOperation({id:'x',track:'unknown',effect:'?',start:0,end:1}).status,'unmapped');
});
test('Acceptance criteria cover the actual film-direction failures',()=>{
 assert.ok(ENGINE_NEXT_QA_CRITERIA.includes('semantic-titles-never-before-speech-meaning'));
 assert.ok(ENGINE_NEXT_QA_CRITERIA.includes('child-and-group-visible-behind-subject'));
 assert.ok(ENGINE_NEXT_QA_CRITERIA.includes('same-editable-timeline-for-ui-agent-and-export'));
 assert.equal(ENGINE_NEXT_SOURCES.fablecut.verifiedReal158404,false);
 assert.equal(ENGINE_NEXT_SOURCES.hyperframes.verifiedReal158404,false);
});