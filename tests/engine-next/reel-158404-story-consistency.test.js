import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {reconcileReel158404StorySources as reconcile} from '../../src/engine-next/reel-158404-story-consistency.js';
const ledger=JSON.parse(readFileSync(new URL('../../docs/engine-next/REEL_158404_ENGINE_GAP_LEDGER.json',import.meta.url)));
const source=ledger.sourceSha256;
function sameStory(){
 const scenes=[];for(let i=1;i<=7;i++){
  const id='scene-'+String(i).padStart(2,'0'),shots=ledger.operations.filter(x=>x.sceneId===id&&x.operationId.startsWith('shot-'));
  scenes.push({id,start:shots[0].start,end:shots.at(-1).end});
 }
 return {schema:'sues-master-story/v1',sourceSha256:source,timeline:{fps:30,duration:73.753467,fingerprint:'verified-original-timeline'},
  narrative:{scenes},resources:ledger.resources.map(r=>({...r})),
  operations:ledger.operations.map(o=>({id:o.operationId,sceneId:o.sceneId,track:o.track,effect:o.effect,start:o.start,end:o.end}))};
}
test('all 49 operations reconcile when every source time and media fingerprint is identical; no artistic auto-approval',()=>{
 const s=sameStory();const before=structuredClone(s);const result=reconcile(ledger,s);
 assert.deepEqual(s,before);assert.equal(result.status,'STRUCTURALLY_MATCHING_STILL_UNAPPROVED');
 assert.equal(result.matchingOperationIds,49);assert.equal(result.operationsWithIdenticalTiming,49);
 assert.deepEqual(result.timingConflicts,[]);assert.deepEqual(result.assetConflicts,[]);
 assert.equal(result.automaticMergeAllowed,false);assert.equal(result.creativeApproved,false);
});
test('blocks all 11 speech-sensitive title timing conflicts and 1 altered B02 source asset without losing operations',()=>{
 const s=sameStory();const titles=s.operations.filter(o=>o.id.startsWith('title-'));
 assert.equal(titles.length,11);
 for(const x of titles)x.start=Number((x.start-.2).toFixed(3));
 s.resources.find(r=>r.id==='B02').assetId='a'.repeat(64);
 const r=reconcile(ledger,s);
 assert.equal(r.status,'REVIEW_REQUIRED_NOT_MERGED');assert.equal(r.matchingOperationIds,49);
 assert.equal(r.operationsWithIdenticalTiming,38);assert.equal(r.timingConflicts.length,11);
 assert.ok(r.timingConflicts.every(x=>x.requiresAuthenticSpeechReview&&!x.allowAutomaticMerge));
 assert.equal(r.assetConflicts.length,1);assert.equal(r.assetConflicts[0].resourceId,'B02');
 assert.equal(r.automaticMergeAllowed,false);assert.equal(r.changesAppliedToNativeProject,false);
});
test('fails closed on duplicate, missing, moved operation or resource, never guessing a mapping',()=>{
 const changes=[
 x=>x.operations.pop(), x=>x.operations[0].id=x.operations[1].id,
 x=>x.operations[1].sceneId='scene-02',x=>x.operations[5].track='music',
 x=>x.resources[0].source='generate',x=>x.narrative.scenes.reverse(),
 x=>x.timeline.duration=73.766667,
 ];
 for(const alter of changes){const s=sameStory();alter(s);assert.throws(()=>reconcile(ledger,s));}
});
