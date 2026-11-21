import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {translateFilmDirectorBrief} from '../src/master-director-brief-translation.js';
import {draftFilmDirectorCaptions} from '../src/master-director-brief-caption-draft.js';
const H='a'.repeat(64),O='b'.repeat(64),T='verified-timeline';
const source=`# Director Film\n> NO APROBADO / NO EJECUTAR ${O}\n### Escena 01 · GANCHO · 00:00–00:02\n- \`0–1 s\`: base **CARLOS**; S en zona inferior.\n- \`1–2 s\`: base **B01**; S en zona inferior.\n`;
const a=translateFilmDirectorBrief({text:source,sourceSha256:H,originalSha256:O,timelineFingerprint:T,duration:2});
test('progressive ASR draft preserves each real word, accumulates within a short group, and flags boundary risks',()=>{
 const transcript={language:'es',sourceDuration:2,provenance:{wordTimings:'automatic; human review required'},words:[
  {text:'Hay',start:.2,end:.43,confidence:.95},
  {text:'una',start:.45,end:.55,confidence:.91},
  {text:'vida',start:.6,end:1.1,confidence:.55},
  {text:'propia.',start:1.2,end:1.55,confidence:.9}]};
 const result=draftFilmDirectorCaptions(a,transcript);
 assert.equal(result.status,'WORD_CAPTIONS_PREPARED_NOT_APPROVED');
 assert.equal(result.wordCount,4);assert.equal(result.captionCues.length,4);
 assert.deepEqual(result.words.map(w=>w.text),transcript.words.map(w=>w.text));
 assert.equal(result.captionCues[1].text,'Hay una');
 assert.ok(result.risks.some(r=>r.code==='WORD_WITHOUT_FULL_SHOT_COVERAGE'));
 assert.ok(result.risks.some(r=>r.code==='LOW_ASR_CONFIDENCE_REVIEW'));
 assert.equal(result.canExecute,false);assert.equal(result.approved,false);
 assert.deepEqual(draftFilmDirectorCaptions(a,transcript),result);
 assert.equal(draftFilmDirectorCaptions(a,{...transcript,sourceDuration:2.3}).code,'ASR_OR_TIMELINE_UNVERIFIED');
 assert.equal(draftFilmDirectorCaptions(a,{...transcript,words:[{text:'hola',start:0.2,end:2.8}]}).code,'INVALID_ASR_WORD_TIMING');
});
test('private HTTP ASR caption draft is bound to the current saved Reel and never changes its version',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const base=(await app.listen()).split('/#')[0],job=app.jobs.create('test'),path=base+'/api/jobs/'+job.id;
  assert.equal((await fetch(path+'/master-brief-caption-draft?briefRevision='+H)).status,401);
  const login=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const cat=await(await fetch(path+'/external-catalog',{headers})).json();
  const profile=app.jobs.loadProfile(job.profileId);
  const duration=cat.duration;
  const document=source.replaceAll(O,cat.sourceSha256).replaceAll('00:02',String(duration));
  const saved=await fetch(path+'/master-source-brief',{method:'POST',headers,body:JSON.stringify({
   text:document,expectedRevision:null,expectedSourceSha256:cat.sourceSha256,expectedTimelineFingerprint:cat.timelineFingerprint})});
  assert.equal(saved.status,201);const {revision}=await saved.json();
  const before=JSON.stringify(app.jobs.get(job.id));
  const response=await fetch(path+'/master-brief-caption-draft?briefRevision='+revision,{headers});
  const report=await response.json();
  assert.equal(response.status,200);
  assert.equal(report.approved,false);assert.equal(report.canExecute,false);
  assert.equal(report.wordCount,profile.inputs.transcript.words.length);
  assert.equal(report.captionCues.length,report.wordCount);
  assert.equal(JSON.stringify(app.jobs.get(job.id)),before);
  assert.equal((await fetch(path+'/master-brief-caption-draft?briefRevision=invalid',{headers})).status,400);
  assert.equal((await fetch(path+'/master-brief-caption-draft?briefRevision='+H,{headers})).status,404);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});
