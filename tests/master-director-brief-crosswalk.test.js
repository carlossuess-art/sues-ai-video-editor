import test from 'node:test';
import assert from 'node:assert/strict';
import {translateFilmDirectorBrief} from '../src/master-director-brief-translation.js';
import {auditMasterBriefCrosswalk} from '../src/master-director-brief-crosswalk.js';
const H='a'.repeat(64),O='b'.repeat(64),T='timeline-verified';
const text=`# SUES Film Director\n> NO APROBADO / NO EJECUTAR ${O}\n### Escena 01 · HOOK · 00:00–00:03\n- \`0–3 s\`: base **CARLOS**; texto editorial **HOOK**; S en zona inferior.\n**Animación y audio:** Voz clara, sin recortes.\n`;
const annex=translateFilmDirectorBrief({text,sourceSha256:H,originalSha256:O,timelineFingerprint:T,duration:3});
const empty={schema:'sues-master-story/v1',sourceSha256:H,timeline:{fingerprint:T,timeSpace:'edit-timeline',fps:30,duration:3},
 visual:{mode:'brand-sues'},narrative:{centralMessage:'Presencia original',intendedExperience:'Escucha el mensaje',
 scenes:[{id:'scene-01',start:0,end:3,purpose:'Mostrar voz original'}]},resources:[],operations:[]};
test('source intentions are preserved and cannot be declared complete by an empty story',()=>{
 assert.ok(annex.operationIntents.length>3);
 const result=auditMasterBriefCrosswalk({annex,story:empty,links:[]});
 assert.equal(result.status,'BLOCKED');assert.equal(result.code,'TRANSLATION_INTENTS_PENDING');
 assert.equal(result.pendingIntents.length,annex.operationIntents.length);
 assert.equal(result.approved,false);assert.equal(result.canExecute,false);
});
test('crosswalk rejects spurious approvals, unknown operations, missing scenes or source changes',()=>{
 assert.equal(auditMasterBriefCrosswalk({annex,story:{...empty,sourceSha256:O},links:[]}).code,'STORY_SOURCE_OR_TIMELINE_CHANGED');
 assert.equal(auditMasterBriefCrosswalk({annex,story:{...empty,narrative:{...empty.narrative,scenes:[]}},links:[]}).code,'STORY_SCENE_STRUCTURE_LOST');
 assert.equal(auditMasterBriefCrosswalk({annex,story:empty,links:[{intentId:'invented',status:'mapped',operationIds:['fake']}]}).code,'INVALID_INTENT_MAPPING');
 assert.equal(auditMasterBriefCrosswalk({annex,story:empty,links:[{intentId:annex.operationIntents[0].id,status:'mapped',operationIds:['fake']}]}).code,'INTENT_MAPPED_TO_UNKNOWN_OPERATION');
});
test('fully mapped structured intent still needs the trusted skill plan review before any render',()=>{
 const operations=[],links=[];
 for(const intent of annex.operationIntents){
  const id=`op-${intent.id}`;
  operations.push({id,sceneId:intent.sceneId,
   start:Math.max(0,intent.editStart??0),end:Math.min(3,intent.editEnd??3),
   track:intent.track==='editorial-direction'?'graphics':intent.track,
   renderer:'remotion',effect:'text',reason:'Preservación de instrucciones de ejemplo',
   parameters:{text:'Provisional'},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']});
  links.push({intentId:intent.id,status:'mapped',operationIds:[id]});
 }
 const candidate={...empty,operations};
 const audit=auditMasterBriefCrosswalk({annex,story:candidate,links});
 assert.equal(audit.status,'MAPPED_NEEDS_TRUSTED_REVIEW');
 assert.equal(audit.lostLines,0);assert.equal(audit.storyOperations,operations.length);
 assert.equal(audit.canExecute,false);assert.equal(audit.approved,false);
 // A camera instruction cannot be falsely linked to a graphics operation.
 candidate.operations[0].track='graphics';
 assert.equal(auditMasterBriefCrosswalk({annex,story:candidate,links}).code,'INTENT_OPERATION_SEMANTIC_OR_TIME_MISMATCH');
});
