import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {translateFilmDirectorBrief} from '../src/master-director-brief-translation.js';
import {buildMasterBriefRequirements} from '../src/master-director-brief-requirements.js';
const H='a'.repeat(64),O='b'.repeat(64),F='fingerprint-1';
const text=`# Film Director\n> NO APROBADO / NO EJECUTAR · ${O}\n### Escena 01 · HOOK · 00:00–00:02\n- \`0–1 s\`: base **CARLOS**; gráfico M01.\n- \`1–2 s\`: base **B01**.\n`;
test('logical resource slots cannot self-declare verified rights or render authorization',()=>{
 const annex=translateFilmDirectorBrief({text,sourceSha256:H,originalSha256:O,timelineFingerprint:F,duration:2});
 const res=buildMasterBriefRequirements(annex,{assetEvidence:{B01:{assetId:'asset-local',sha256:H,rightsVerified:true,commercialUseAllowed:true}}});
 assert.equal(res.status,'EVIDENCE_REQUIRED');
 assert.equal(res.approved,false);assert.equal(res.canExecute,false);
 assert.equal(res.resourceCount,2);assert.deepEqual(res.resources.map(x=>x.slot),['M01','B01']);
 assert.equal(res.resources.find(x=>x.slot==='B01').candidate.source,'untrusted-proposal');
 assert.ok(res.resources.find(x=>x.slot==='B01').issues.includes('RIGHTS_AND_COMMERCIAL_USE_NOT_VERIFIED'));
 assert.equal(res.sourceLines,annex.allSourceLines.length);assert.equal(res.unaccountedSourceLines,0);
 assert.equal(res.intentCount,annex.operationIntents.length);
 assert.equal(buildMasterBriefRequirements({schema:'fake'}).code,'UNTRUSTED_BRIEF_EVIDENCE');
});
test('authenticated requirements API does not alter active editable Reel',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const url=(await app.listen()).split('/#')[0],job=app.jobs.create('test'),endpoint=url+'/api/jobs/'+job.id;
  assert.equal((await fetch(endpoint+'/master-brief-requirements?briefRevision='+H)).status,401);
  const auth=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:auth.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const cat=await(await fetch(endpoint+'/external-catalog',{headers})).json();
  const source=text.replace(O,cat.sourceSha256);
  const receipt=await fetch(endpoint+'/master-source-brief',{method:'POST',headers,body:JSON.stringify({
   text:source,expectedRevision:null,expectedSourceSha256:cat.sourceSha256,expectedTimelineFingerprint:cat.timelineFingerprint})});
  assert.equal(receipt.status,201);const {revision}=await receipt.json();
  const original=JSON.stringify(app.jobs.get(job.id));
  const get=await fetch(endpoint+'/master-brief-requirements?briefRevision='+revision,{headers});
  assert.equal(get.status,200);const res=await get.json();
  assert.equal(res.resourceCount,2);assert.equal(res.canExecute,false);
  assert.equal(res.approved,false);assert.equal(res.status,'EVIDENCE_REQUIRED');
  assert.equal(JSON.stringify(app.jobs.get(job.id)),original);
  assert.equal((await fetch(endpoint+'/master-brief-requirements?briefRevision='+H,{headers})).status,404);
  assert.equal((await fetch(endpoint+'/master-brief-requirements?briefRevision=bad',{headers})).status,400);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
