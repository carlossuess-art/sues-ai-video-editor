import test from 'node:test';
import assert from 'node:assert/strict';
import {assertStoryOperationCoverage,buildNativeSupervisorGraph,partitionNativeSupervisorGraph,buildNativeSupervisorIndex,validateNativeSupervisorReview} from '../../src/engine-next/fablecut-native-supervisor.js';
const sha=c=>c.repeat(64),status='MCP_COMMITTED_READBACK_VERIFIED_NOT_RENDERED';
function fixture(){
 const story={schema:'sues-master-story/v1',sourceSha256:sha('a'),timeline:{fps:30,fingerprint:'timeline-1',duration:2},operations:[{id:'title1',track:'graphics',renderer:'native',start:0,end:1,requiredQA:['rendered-frame','motion-playback','narrative-review']},{id:'sfx1',track:'sfx',renderer:'native',start:1,end:2,requiredQA:['audio-playback','time-sync']}]};
 const binding={scope:'private-reviewed',storyRevision:sha('b'),decisionId:sha('c'),planFingerprint:sha('d'),projectFingerprint:sha('e'),sourceSha256:story.sourceSha256,timelineFingerprint:story.timeline.fingerprint};
 const execution={schema:'sues-private-story-execution/v1',...binding,result:{receiptPersisted:true,receipts:story.operations.map(o=>({operationId:o.id,status}))}};
 const render={schema:'sues-private-story-render/v1',status:'TECHNICAL_QA_PASS_NOT_ARTISTIC_APPROVAL',...binding,sha256:sha('f'),renderCopyParity:true,operationCount:2,probe:{streams:[{codec_type:'video',codec_name:'h264',width:1080,height:1920,r_frame_rate:'30/1',nb_read_frames:'60',duration:'2.000'},{codec_type:'audio',codec_name:'aac',duration:'2.000'}]},audioStats:{peakDb:-2,meanDb:-20},operationAudit:story.operations.map(o=>({operationId:o.id,start:o.start,end:o.end,requiredQA:o.requiredQA,execution:status}))};
 return {story,execution,render,projectFingerprint:binding.projectFingerprint,outputSha256:render.sha256};
}
function inspection(graph,key='inspection-ABC123'){
 const frames=new Map();const mark=(f,id)=>{if(!frames.has(f))frames.set(f,new Set());if(id)frames.get(f).add(id)};
 for(let f=0;f<graph.durationFrames;f+=30)mark(f);mark(graph.durationFrames-1);
 for(const n of graph.nodes)for(const f of [n.startFrame,Math.floor((n.startFrame+n.endFrame-1)/2),n.endFrame-1])mark(f,n.id);
 const samples=[...frames.keys()].sort((a,b)=>a-b).map((f,i)=>({frame:f,file:'frame-'+String(i+1).padStart(4,'0')+'.png',operationIds:[...frames.get(f)]}));
 return {inspectionId:key,report:{schema:'sues-master-supervisor-evidence/v1',status:'SAMPLES_REQUIRE_REVIEW',final:false,planFingerprint:graph.planFingerprint,outputSha256:graph.outputSha256,fps:30,durationFrames:graph.durationFrames,samples,files:['audio.wav',...samples.map(s=>s.file)].map(name=>({name,sha256:sha('a'),bytes:10}))}};
}
function index(){const g=buildNativeSupervisorGraph(fixture());return buildNativeSupervisorIndex(g,[inspection(g)]);}
function review(i){
 const evidenceFor=(o,q)=>q==='rendered-frame'?[Object.keys(i.evidence).find(k=>i.evidence[k].operationIds.includes(o.id))]:q==='audio-playback'?[Object.keys(i.evidence).find(k=>i.evidence[k].kind==='audio')]:['render'];
 return {schema:'sues-fablecut-two-pass-review/v1',outputSha256:i.outputSha256,planFingerprint:i.planFingerprint,storyRevision:i.storyRevision,decisionId:i.decisionId,sourceSha256:i.sourceSha256,timelineFingerprint:i.timelineFingerprint,projectFingerprint:i.projectFingerprint,passes:[1,2].map(n=>({id:'pass'+n,reviewer:'fixture reviewer',reviewedAt:'2026-11-11T08:00:0'+n+'Z',fullPlaybackReviewed:true,operations:i.operations.map(o=>({operationId:o.id,checks:o.requiredQA.map(q=>({check:q,status:'PASS',observation:'Fixture only: '+q,evidence:evidenceFor(o,q)}))})),globalChecks:i.globalChecks.map(q=>({check:q,status:'PASS',observation:'Fixture only: '+q,evidence:['render']}))}))};
}
test('exact coverage permits reordering but refuses duplicate, foreign or missing operations',()=>{
 const o=[{id:'one'},{id:'two'}];assert.equal(assertStoryOperationCoverage(o,[{operationId:'two'},{operationId:'one'}]),true);
 for(const r of [[{operationId:'one'},{operationId:'one'}],[{operationId:'one'},{operationId:'three'}],[{operationId:'one'}]])assert.throws(()=>assertStoryOperationCoverage(o,r),/COVERAGE_MISMATCH/);
 assert.throws(()=>assertStoryOperationCoverage([{id:'one'},{id:'one'}],[{operationId:'one'},{operationId:'one'}]),/COVERAGE_MISMATCH/);
});
test('native supervisor graph binds exact source, story, decision, project, render and operations',()=>{
 const g=buildNativeSupervisorGraph(fixture());assert.equal(g.durationFrames,60);assert.deepEqual(g.nodes.map(x=>[x.id,x.startFrame,x.endFrame]),[['title1',0,30],['sfx1',30,60]]);
 for(const key of ['storyRevision','decisionId','planFingerprint','projectFingerprint','sourceSha256','timelineFingerprint']){const f=fixture();f.render[key]='stale';assert.throws(()=>buildNativeSupervisorGraph(f),/BINDING_MISMATCH/)}
});
test('blocks wrong render SHA, duplicate receipt, changed timing, missing parity and codec mismatch',()=>{
 let f=fixture();f.outputSha256=sha('0');assert.throws(()=>buildNativeSupervisorGraph(f),/BINDING_MISMATCH/);
 f=fixture();f.execution.result.receipts[1].operationId='title1';assert.throws(()=>buildNativeSupervisorGraph(f),/COVERAGE_MISMATCH/);
 f=fixture();f.render.operationAudit[0].start=.1;assert.throws(()=>buildNativeSupervisorGraph(f),/OPERATION_MISMATCH/);
 f=fixture();f.render.renderCopyParity=false;assert.throws(()=>buildNativeSupervisorGraph(f),/BINDING_MISMATCH/);
 f=fixture();f.render.probe.streams[0].codec_name='vp9';assert.throws(()=>buildNativeSupervisorGraph(f),/MEDIA_PROOF_INVALID/);
});
test('partition respects extractor sample budget and preserves every operation',()=>{
 const g=buildNativeSupervisorGraph(fixture());g.durationFrames=3600;g.nodes=Array.from({length:100},(_,i)=>({id:'o'+i,startFrame:i*30+1,endFrame:i*30+29}));
 const parts=partitionNativeSupervisorGraph(g);assert.ok(parts.length>1);assert.deepEqual(parts.flatMap(p=>p.nodes.map(n=>n.id)),g.nodes.map(n=>n.id));
 for(const p of parts)assert.ok(inspection(p).report.samples.length<=180);
});
test('evidence manifest must include actual boundary and midpoint samples for every operation',()=>{
 const g=buildNativeSupervisorGraph(fixture()),r=inspection(g);assert.equal(buildNativeSupervisorIndex(g,[r]).operations.length,2);
 const sample=r.report.samples.find(s=>s.frame===14);sample.operationIds=[];assert.throws(()=>buildNativeSupervisorIndex(g,[r]),/OPERATION_EVIDENCE_MISSING/);
});
test('foreign evidence output hash and missing audio block review index',()=>{
 const g=buildNativeSupervisorGraph(fixture());let r=inspection(g);r.report.outputSha256=sha('0');assert.throws(()=>buildNativeSupervisorIndex(g,[r]),/EVIDENCE_BINDING/);
 r=inspection(g);r.report.files=r.report.files.filter(f=>f.name!=='audio.wav');assert.throws(()=>buildNativeSupervisorIndex(g,[r]),/AUDIO_EVIDENCE_MISSING/);
});
test('complete two-pass report never grants creative approval or publication',()=>{
 const i=index(),r=validateNativeSupervisorReview(i,review(i));assert.equal(r.status,'TWO_REVIEWS_RECORDED_NOT_CREATIVE_APPROVAL');assert.equal(r.creativeApproval,false);assert.equal(r.publicationAuthorized,false);assert.equal(r.final,false);
});
test('one pass, duplicate passes, wrong hash and incomplete operation coverage are blocked',()=>{
 const i=index();let r=review(i);r.passes.pop();assert.throws(()=>validateNativeSupervisorReview(i,r),/REVIEW_BINDING/);
 r=review(i);r.passes[1].id=r.passes[0].id;assert.throws(()=>validateNativeSupervisorReview(i,r),/INDEPENDENT_PASS/);
 r=review(i);r.outputSha256=sha('0');assert.throws(()=>validateNativeSupervisorReview(i,r),/REVIEW_BINDING/);
 r=review(i);r.passes[1].operations.pop();assert.throws(()=>validateNativeSupervisorReview(i,r),/OPERATION_COVERAGE/);
});
test('missing QA, foreign frame, missing audio and incomplete global checks are blocked',()=>{
 const i=index();let r=review(i);r.passes[0].operations[0].checks.pop();assert.throws(()=>validateNativeSupervisorReview(i,r),/REQUIRED_QA_COVERAGE/);
 r=review(i);r.passes[0].operations[0].checks[0].evidence=['render'];assert.throws(()=>validateNativeSupervisorReview(i,r),/FRAME_EVIDENCE_REQUIRED/);
 r=review(i);r.passes[0].operations[1].checks[0].evidence=['render'];assert.throws(()=>validateNativeSupervisorReview(i,r),/AUDIO_EVIDENCE_REQUIRED/);
 r=review(i);r.passes[0].globalChecks.pop();assert.throws(()=>validateNativeSupervisorReview(i,r),/GLOBAL_QA_COVERAGE/);
});
test('failed subjective check yields an operation-specific correction, no creative edit',()=>{
 const i=index(),r=review(i);const c=r.passes[0].operations[0].checks[0];c.status='FAIL';c.observation='Fixture: rectangular edge visible';c.correction='Review the feather boundary';
 const result=validateNativeSupervisorReview(i,r);assert.equal(result.status,'QA_BLOCKED_CORRECTION_REQUIRED');assert.equal(result.issues[0].operationId,'title1');assert.equal(result.publicationAuthorized,false);
 delete c.correction;assert.throws(()=>validateNativeSupervisorReview(i,r),/CORRECTION_REQUIRED/);
});
test('technical QA fixtures can never be promoted to creative reviewed production',()=>{
 const i=index();i.scope='technical-qa';assert.equal(validateNativeSupervisorReview(i,review(i)).status,'TECHNICAL_FIXTURE_REVIEW_RECORDED');
});
