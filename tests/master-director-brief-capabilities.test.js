import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {translateFilmDirectorBrief} from '../src/master-director-brief-translation.js';
import {auditFilmBriefCapabilities} from '../src/master-director-brief-capabilities.js';
const H='a'.repeat(64),O='b'.repeat(64),T='timeline-a';
const text=`# Film Director\n> NO APROBADO / NO EJECUTAR ${O}\n### Escena 01 · GANCHO · 00:00–00:04\n- \`0–1 s\`: base **CARLOS**; gráfico M01; texto editorial **VIDA**; S en zona inferior.\n- \`1–2 s\`: base **B01**; voz continúa; texto editorial **MIEDO**; S en zona inferior.\n- \`2–4 s\`: base **M02**; motion de alto nivel; texto editorial **AMOR**; S en zona inferior.\n`;
test('actual strict renderer capabilities are separated from visual storytelling demands',()=>{
 const annex=translateFilmDirectorBrief({text,originalSha256:O,sourceSha256:H,timelineFingerprint:T,duration:4});
 const audit=auditFilmBriefCapabilities(annex);
 assert.equal(audit.status,'BLOCKED_PENDING_EXECUTABLE_EQUIVALENCE');
 assert.equal(audit.sourceLineLoss,0);assert.equal(audit.canExecute,false);assert.equal(audit.approved,false);
 assert.ok(audit.intents.find(x=>x.track==='broll').suggestedCapability==='remotion:broll:video-exact');
 assert.ok(audit.intents.find(x=>x.track==='transition').blockers.includes('DIRECTOR_MUST_SPECIFY_IN_OUT_TRANSITION_KIND_DURATION_AND_CURVE'));
 assert.ok(audit.intents.find(x=>x.track==='captions').blockers.includes('VERIFIED_WORD_BY_WORD_TRANSCRIPT'));
 assert.ok(audit.intents.find(x=>x.intentId.endsWith('editorial-title')).suggestedCapability==='remotion:graphics:text');
 assert.ok(audit.intents.find(x=>x.intentId.includes('overlay-M')).model==='CINEMATIC_COMPOSITION_NOT_PROVEN_REPRESENTABLE');
 assert.ok(audit.resourceSlots.some(x=>x.slot==='B01'&&x.verified===false));
 assert.equal(auditFilmBriefCapabilities({schema:'unknown'}).code,'INVALID_SOURCE_TECHNICAL_ANNEX');
});
test('private HTTP capability audit is read-only and rejects stale or unauthorized calls',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const base=(await app.listen()).split('/#')[0],job=app.jobs.create('test'),path=base+'/api/jobs/'+job.id;
  assert.equal((await fetch(path+'/master-brief-capabilities?briefRevision='+H)).status,401);
  const login=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const cat=await(await fetch(path+'/external-catalog',{headers})).json();
  const receipt=await fetch(path+'/master-source-brief',{method:'POST',headers,body:JSON.stringify({
   text:text.replace(O,cat.sourceSha256),expectedRevision:null,expectedSourceSha256:cat.sourceSha256,
   expectedTimelineFingerprint:cat.timelineFingerprint})});
  assert.equal(receipt.status,201);const {revision}=await receipt.json();
  const before=JSON.stringify(app.jobs.get(job.id));
  const r=await fetch(path+'/master-brief-capabilities?briefRevision='+revision,{headers});
  assert.equal(r.status,200);const report=await r.json();
  assert.equal(report.status,'BLOCKED_PENDING_EXECUTABLE_EQUIVALENCE');
  assert.equal(report.sourceSha256,cat.sourceSha256);assert.equal(report.canExecute,false);
  assert.ok(report.intents.length>5);assert.equal(JSON.stringify(app.jobs.get(job.id)),before);
  assert.equal((await fetch(path+'/master-brief-capabilities?briefRevision='+H,{headers})).status,404);
  assert.equal((await fetch(path+'/master-brief-capabilities?briefRevision=bad',{headers})).status,400);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('capability audit fails closed for missing, malformed and duplicated technical evidence',()=>{
 const annex=translateFilmDirectorBrief({text,originalSha256:O,sourceSha256:H,timelineFingerprint:T,duration:4});
 const invalid=[
  {...annex,resourceReferences:undefined},
  {...annex,resourceReferences:[{resourceHint:'../untrusted'}]},
  {...annex,operationIntents:[...annex.operationIntents,annex.operationIntents[0]]},
  {...annex,operationIntents:[...annex.operationIntents,{...annex.operationIntents[0],id:null}]},
  {...annex,instructionCoverage:{unaccountedNonemptyLines:null}},
 ];
 for(const candidate of invalid){
  const audit=auditFilmBriefCapabilities(candidate);
  assert.equal(audit.status,'BLOCKED');
  assert.equal(audit.code,'INVALID_SOURCE_TECHNICAL_ANNEX');
  assert.equal(audit.approved,false);
  assert.equal(audit.canExecute,false);
 }
});
