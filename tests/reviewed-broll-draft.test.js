import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {parseExternalPlan} from '../src/external-edit-plan.js';
const app=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const fragment=/\/\* BEGIN REVIEWED_BROLL_DRAFT \*\/([\s\S]*?)\/\* END REVIEWED_BROLL_DRAFT \*\//.exec(app);
assert.ok(fragment,'UI helper is present and testable');
const make=runInNewContext(fragment[1]+'\nbuildSuggestedBrollDraft',{});
const sha='d'.repeat(64),video='a'.repeat(64);
const catalog={schema:'sues-edit-plan/v1',sourceSha256:sha,assets:[{id:video,kind:'video',duration:6.4}]};
const cue={decision:'contextual-review-only',start:9.16,end:12.54,narrative:{reason:'sobrecarga y cambio personal'}};
const candidate={kind:'video',assetId:video,needsHumanReview:true,evidence:{visualContentVerified:false,
 suggestedSourceRange:{startSec:1.51,endSec:4.89,source:'full-timeline-cut-black-analysis',appliedToVideo:false}}};
const plain=()=>JSON.parse(make(cue,candidate,catalog,''));
test('explicit scene selection creates a genuine reviewable B-roll draft bound to correct original',()=>{
 const doc=plain(),parsed=parseExternalPlan(JSON.stringify(doc));
 assert.equal(parsed.schema,'sues-edit-plan/v1');
 assert.equal(parsed.sourceSha256,sha);
 assert.deepEqual(JSON.parse(JSON.stringify(parsed.operations)),[{type:'broll',resourceId:video,start:9.16,end:12.54,sourceIn:1.51,reason:'Metáfora narrativa: sobrecarga y cambio personal'}]);
 assert.match(app,/Preparar este B-roll para revisar/);
 assert.match(app,/external-draft','POST'/);
 assert.match(app,/invalidateExternal\(\)/);
 assert.match(app,/Comprobar plan/);
});
test('does not overwrite a non-compatible draft or overlap existing B-roll',()=>{
 const first=JSON.stringify(plain());
 assert.throws(()=>make(cue,candidate,catalog,first),/solapado/);
 assert.throws(()=>make(cue,candidate,catalog,JSON.stringify({...plain(),sourceSha256:'f'.repeat(64)})),/compatible/);
 assert.throws(()=>make(cue,candidate,catalog,'Plan viejo sin JSON'),/no JSON/);
 assert.throws(()=>make(cue,candidate,{...catalog,assets:[]},''),/no existen/);
});
test('rejects unknown timing, unreviewed candidate or a malicious source suggestion',()=>{
 assert.throws(()=>make(cue,{...candidate,needsHumanReview:false},catalog,''),/revisión/);
 assert.throws(()=>make(cue,{...candidate,evidence:{...candidate.evidence,suggestedSourceRange:{...candidate.evidence.suggestedSourceRange,startSec:4.5}}},catalog,''),/tramo/);
 assert.throws(()=>make(cue,candidate,{...catalog,assets:[{id:video,kind:'video',duration:2}]},''),/no existen/);
 assert.throws(()=>make({...cue,decision:'suggestion-only'},candidate,catalog,''),/revisión/);
 assert.throws(()=>make(cue,{...candidate,evidence:{...candidate.evidence,visualContentVerified:true}},catalog,''),/revisión/);
});
test('keeps existing operations, allows five B-rolls and refuses more than 50',()=>{
 const old={schema:catalog.schema,sourceSha256:sha,operations:[{type:'music',resourceId:'sfx'}]};
 const text=make(cue,candidate,catalog,JSON.stringify(old)),after=parseExternalPlan(text);
 assert.equal(after.operations.length,2);
 assert.equal(old.operations.length,1);
 const four={...old,operations:Array.from({length:4},(_,i)=>({type:'broll',start:14+i*4,end:17+i*4}))};
 assert.equal(JSON.parse(make(cue,candidate,catalog,JSON.stringify(four))).operations.length,5);
 const fifty={...old,operations:Array.from({length:50},(_,i)=>({type:'broll',start:14+i*4,end:17+i*4}))};
 assert.throws(()=>make(cue,candidate,catalog,JSON.stringify(fifty)),/50 B-rolls/);
});
