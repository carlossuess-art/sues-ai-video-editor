import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveMasterDirectorRules} from '../src/master-director-rulebook.js';
const rules=()=>[
 {id:'pause-old',key:'speech.pause.max',scope:'global',authority:'explicit-user-approval',
  status:'historical',value:.5,supersedes:[]},
 {id:'pause-new',key:'speech.pause.max',scope:'global',authority:'explicit-user-approval',
  status:'approved',value:.7,supersedes:['pause-old']},
 {id:'tapiz-brand',key:'graphics.background',scope:'brand',scopeId:'sues',
  authority:'locked-masters',status:'approved',value:'anthracite-grid',supersedes:[]},
 {id:'board-reference',key:'graphics.background',scope:'reference',scopeId:'reference-158623',
  authority:'explicit-user-approval',status:'approved',value:'light-board',supersedes:['tapiz-brand']}
];
const ctx=()=>({brandId:'sues',visualMode:'brand-sues',
 authorizedReferenceIds:['reference-158623'],referenceId:null});
const auth=['pause-new','tapiz-brand','board-reference'];
test('historical pause 0.5 is ignored; the newer 0.7 approved value is retained',()=>{
 const r=resolveMasterDirectorRules(rules(),ctx(),auth);
 assert.equal(r.status,'READY');
 assert.equal(r.selectedRules.find(x=>x.key==='speech.pause.max').value,.7);
});
test('brand mode cannot import a white reference background automatically',()=>{
 const r=resolveMasterDirectorRules(rules(),ctx(),auth);
 assert.equal(r.selectedRules.find(x=>x.key==='graphics.background').value,'anthracite-grid');
});
test('explicit, authorized reference supersession is scoped to replica mode',()=>{
 const r=resolveMasterDirectorRules(rules(),{...ctx(),visualMode:'reference-exact',referenceId:'reference-158623'},auth);
 assert.equal(r.status,'READY');
 assert.equal(r.selectedRules.find(x=>x.key==='graphics.background').value,'light-board');
});
test('a reference cannot silently override brand without a supersession approval',()=>{
 const x=rules();x[3].supersedes=[];
 const r=resolveMasterDirectorRules(x,{...ctx(),visualMode:'reference-exact',referenceId:'reference-158623'},auth);
 assert.equal(r.status,'BLOCKED');assert.deepEqual(r.unresolvedRuleConflicts,['graphics.background']);
});
test('two same-key approved values do not resolve merely because one is later',()=>{
 const x=rules();x.push({id:'pause-other',key:'speech.pause.max',scope:'global',
  authority:'explicit-user-approval',status:'approved',value:.8,supersedes:[]});
 const r=resolveMasterDirectorRules(x,ctx(),[...auth,'pause-other']);
 assert.deepEqual(r.unresolvedRuleConflicts,['speech.pause.max']);
});
test('an untrusted approval record cannot enable a conflicting rule',()=>{
 const r=resolveMasterDirectorRules(rules(),ctx(),['pause-new','tapiz-brand']);
 assert.equal(r.status,'BLOCKED');
 assert.ok(r.issues.some(x=>x.code==='APPROVAL_NOT_AUTHENTICATED'));
});
test('no rule may supersede a safety and rights prohibition',()=>{
 const x=rules();x.push({id:'rights',key:'asset.rights',scope:'global',authority:'safety-and-rights',
  status:'approved',value:'commercial-license-required',supersedes:[]});
 x.push({id:'scene-override',key:'asset.rights',scope:'global',authority:'explicit-user-approval',
  status:'approved',value:'license-unverified-is-ok',supersedes:['rights']});
 const r=resolveMasterDirectorRules(x,ctx(),[...auth,'rights','scene-override']);
 assert.equal(r.status,'BLOCKED');assert.deepEqual(r.unresolvedRuleConflicts,['asset.rights']);
});
test('invalid mode or duplicate IDs always blocks the rulebook',()=>{
 const x=rules();x.push({...x[1]});
 const r=resolveMasterDirectorRules(x,{...ctx(),visualMode:'random'},auth);
 assert.ok(r.issues.some(q=>q.code==='RULE_ID_DUPLICATE_OR_INVALID'));
 assert.ok(r.issues.some(q=>q.code==='VISUAL_MODE_INVALID'));
});
test('disabled draft rules do not become defaults',()=>{
 const x=rules();x.push({id:'glow-draft',key:'graphics.glow',scope:'global',
  authority:'profile',status:'draft',value:'neon-everywhere',supersedes:[]});
 const r=resolveMasterDirectorRules(x,ctx(),auth);
 assert.equal(r.status,'READY');assert.ok(!r.selectedRules.some(q=>q.key==='graphics.glow'));
});
