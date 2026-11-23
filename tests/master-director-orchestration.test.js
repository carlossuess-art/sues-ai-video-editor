import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareMasterDirectorSession} from '../src/master-director-orchestration.js';
const original='a'.repeat(64),master='b'.repeat(64),asset='c'.repeat(64);
const registry=()=>({
 brandId:'sues',profileId:'DOPAMIN',projectId:'project-01',
 sourceSha256:original,timelineFingerprint:'edit-01',approvedRuleVersion:'approved-rules-v1',
 approvedRuleIds:['pause-approved','tapiz-approved','board-approved'],
 requiredRuleKeys:['speech.pause.max','graphics.background'],
 approvedReferenceIds:['ref-158623'],unresolvedRuleConflicts:[],
 masterHashes:{tapiz01:master},lockedMastersByMode:{
  'brand-sues':[{id:'tapiz01',sha256:master}],
  'reference-exact':[{id:'tapiz01',sha256:master}]
 },
 rendererCapabilities:{remotion:['subject-occlusion']},
 licensedAssets:{'verified-asset':{sha256:asset,rightsVerified:true,commercialUseAllowed:true}},
 wordAnchors:{word07:{time:6.5,text:'libertad'}}
});
const rules=()=>[
 {id:'pause-approved',key:'speech.pause.max',scope:'global',authority:'explicit-user-approval',
  status:'approved',value:.7,supersedes:[]},
 {id:'tapiz-approved',key:'graphics.background',scope:'brand',scopeId:'sues',
  authority:'locked-masters',status:'approved',value:'anthracite-grid',supersedes:[]},
 {id:'board-approved',key:'graphics.background',scope:'reference',scopeId:'ref-158623',
  authority:'explicit-user-approval',status:'approved',value:'light-board',supersedes:['tapiz-approved']}
];
const story=()=>({
 schema:'sues-master-story/v1',sourceSha256:original,
 timeline:{fingerprint:'edit-01',timeSpace:'edit-timeline',fps:30,duration:10},
 visual:{mode:'brand-sues'},
 narrative:{centralMessage:'La libertad frente al miedo',intendedExperience:'Tensión seguida de apertura',
  scenes:[{id:'intro',start:0,end:5,purpose:'Presentar el miedo'},
          {id:'desenlace',start:5,end:10,purpose:'Liberación personal'}],
  motifs:[{id:'cadena',setupSceneId:'intro',payoffSceneId:'desenlace',
   meaning:'La cadena aparece y se rompe'}]},
 resources:[{id:'cadena-recurso',source:'library',assetId:'verified-asset',expectedSha256:asset}],
 operations:[
 {id:'cadena-cerrada',sceneId:'intro',start:2,end:4,track:'broll',
  effect:'subject-occlusion',renderer:'remotion',resourceRef:'cadena-recurso',motifId:'cadena',
  reason:'La cadena representa el miedo',parameters:{layer:1},
  dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']},
 {id:'cadena-rota',sceneId:'desenlace',start:6,end:8,track:'broll',
  effect:'subject-occlusion',renderer:'remotion',resourceRef:'cadena-recurso',motifId:'cadena',
  speechAnchor:{wordId:'word07',offsetFrames:0},reason:'La cadena se rompe en la resolución',
  parameters:{layer:1},dependsOn:['cadena-cerrada'],
  requiredQA:['rendered-frame','motion-playback','narrative-review']}
 ]
});
test('single brain entrypoint requires rulebook, story and plan approval',()=>{
 const r=prepareMasterDirectorSession({story:story(),registry:registry(),rulebook:rules()});
 assert.equal(r.status,'AWAITING_PLAN_APPROVAL');
 assert.equal(r.plan.appliedRuleSnapshot.length,2);
 assert.equal(r.plan.creativeContext.motifs[0].payoffSceneId,'desenlace');
});
test('changing a visual rule value invalidates the plan fingerprint even when ID stays the same',()=>{
 const a=rules(),r=registry(),s=story(),first=prepareMasterDirectorSession({story:s,registry:r,rulebook:a});
 r.approvedPlanFingerprint=first.fingerprint;a[1].value='charcoal-other';
 const second=prepareMasterDirectorSession({story:s,registry:r,rulebook:a});
 assert.equal(second.status,'AWAITING_PLAN_APPROVAL');
 assert.notEqual(first.fingerprint,second.fingerprint);
});
test('a reference background is only applied in an authorized reference mode',()=>{
 const s=story(),r=registry();s.visual={mode:'reference-exact',referenceId:'ref-158623'};
 const x=prepareMasterDirectorSession({story:s,registry:r,rulebook:rules()});
 assert.equal(x.status,'AWAITING_PLAN_APPROVAL');
 assert.equal(x.plan.appliedRuleSnapshot.find(x=>x.key==='graphics.background').value,'light-board');
});
test('an unresolved rule conflict stops execution before scene compilation',()=>{
 const x=rules();x[2].scope='brand';x[2].scopeId='sues';x[2].supersedes=[];
 const r=prepareMasterDirectorSession({story:story(),registry:registry(),rulebook:x});
 assert.equal(r.status,'BLOCKED');assert.equal(r.phase,'rulebook');
});
test('omitting a required rule never yields an empty approved rule set',()=>{
 const r=registry();r.requiredRuleKeys.push('audio.voice.priority');
 const x=prepareMasterDirectorSession({story:story(),registry:r,rulebook:rules()});
 assert.equal(x.status,'BLOCKED');
 assert.ok(x.issues.some(v=>v.code==='REQUIRED_RULE_NOT_APPROVED'));
});
test('a missing ideal resource is returned as a creation request without a renderable plan',()=>{
 const s=story();s.resources=[{id:'cadena-recurso',source:'generate',kind:'video',
  creationBrief:'Create an original chain opening in warm lighting'}];
 const x=prepareMasterDirectorSession({story:s,registry:registry(),rulebook:rules()});
 assert.equal(x.status,'NEEDS_RESOURCES');
 assert.equal(x.plan,null);assert.equal(x.assetRequests.length,1);
});
test('missing trusted approval registry blocks even a plausible creative story',()=>{
 const r=registry();delete r.approvedRuleIds;
 const x=prepareMasterDirectorSession({story:story(),registry:r,rulebook:rules()});
 assert.equal(x.status,'BLOCKED');assert.equal(x.phase,'registry');
});
