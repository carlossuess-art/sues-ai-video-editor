import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {createEditorServer} from '../src/editor-server.js';
import {translateFilmDirectorBrief} from '../src/master-director-brief-translation.js';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
const H='a'.repeat(64),O='b'.repeat(64),T='timeline-verified';
const text=`# Film Director — Reel 99\n\n> **Estado: NO APROBADO / NO EJECUTAR.** ${O}\n\n### Escena 01 · GANCHO · 00:00–00:03\n**Audio/transcripción provisional:** Hay una frase.\n**Composición por planos (tiempo bruto):**\n- \`0–1,5 s\`: base **CARLOS**.\n- \`1,5–3 s\`: base **B01**; B-roll sin verificar.\n**Recurso y máscara:** B01 pendiente.\n**Animación y audio:** Pendientes.\n\n### Escena 02 · CIERRE · 00:03–00:06\n**Audio/transcripción provisional:** Otra frase.\n- \`3–6 s\`: base **CARLOS**; CTA.\n**Estado:** propuesta.\n`;
test('full Markdown remains exactly traceable through source line ledger and stable shot IDs',()=>{
 const a=translateFilmDirectorBrief({text,sourceSha256:H,originalSha256:O,timelineFingerprint:T,duration:6});
 assert.equal(a.status,'COMPLETE_TECHNICAL_ANNEX_NOT_IMPORTABLE');
 assert.equal(a.canExecute,false);assert.equal(a.approved,false);
 assert.equal(a.scenes.length,2);assert.equal(a.shotCount,3);
 assert.deepEqual(a.scenes.flatMap(x=>x.shots.map(y=>y.id)),['scene-01-shot-01','scene-01-shot-02','scene-02-shot-01']);
 assert.equal(a.resourceReferences.length,1);
 assert.ok(a.operationIntents.length>=8);
 assert.ok(a.operationIntents.some(x=>x.track==='broll'&&x.id==='scene-01-shot-02-base'));
 assert.ok(a.operationIntents.some(x=>x.track==='transition'&&x.id==='scene-01-shot-02-transition-in'));
 assert.ok(a.operationIntents.some(x=>x.track==='transition'&&x.id==='scene-01-shot-02-transition-out'));
 assert.ok(a.operationIntents.every(x=>x.canExecute===false&&x.blockingReasons?.length>=1));
 assert.ok(a.operationIntents.every(x=>x.sourceLine>=1&&x.sourceLine<=a.translationCoverage.preservedLines));
 assert.equal(a.translationCoverage.lostLines,0);
 assert.equal(a.allSourceLines.map(x=>x.text).join('\n'),text);
 assert.ok(a.blockingConditions.some(x=>x.code==='MEDIA_ASSET_RIGHTS_AND_TRANSITIONS_UNVERIFIED'));
 assert.deepEqual(translateFilmDirectorBrief({text,sourceSha256:H,originalSha256:O,timelineFingerprint:T,duration:6}),a);
 assert.equal(translateFilmDirectorBrief({text,sourceSha256:H,originalSha256:H,timelineFingerprint:T,duration:6}).code,'SOURCE_OR_REVIEW_STATUS_NOT_GROUNDED');
});
test('authenticated HTTP translates saved brief, rejects stale source and does not change active Reel',async()=>{
 const f=fixture(),app=createEditorServer({directory:join(f.dir,'jobs'),profiles:f.profiles});
 try{
  const url=(await app.listen()).split('/#')[0],job=app.jobs.create('test');
  const a=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});
  const headers={Cookie:a.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor','Content-Type':'application/json'};
  const cat=await (await fetch(url+'/api/jobs/'+job.id+'/external-catalog',{headers})).json();
  const briefText=text.replaceAll(O,cat.sourceSha256);
  const saved=await fetch(url+'/api/jobs/'+job.id+'/master-source-brief',{method:'POST',headers,
   body:JSON.stringify({text:briefText,expectedRevision:null,expectedSourceSha256:cat.sourceSha256,expectedTimelineFingerprint:cat.timelineFingerprint})});
  assert.equal(saved.status,201);const receipt=await saved.json();
  const endpoint=url+'/api/jobs/'+job.id+'/master-brief-translation?briefRevision='+receipt.revision;
  assert.equal((await fetch(endpoint)).status,401);
  const before=JSON.stringify(app.jobs.get(job.id));
  const response=await fetch(endpoint,{headers});assert.equal(response.status,200);
  const report=await response.json();assert.equal(report.canExecute,false);assert.equal(report.approved,false);
  assert.equal(report.translationCoverage.lostLines,0);
  assert.equal(report.sourceSha256,cat.sourceSha256);
  assert.equal(report.scenes.length,2);
  assert.equal(JSON.stringify(app.jobs.get(job.id)),before);
  assert.equal((await fetch(url+'/api/jobs/'+job.id+'/master-current',{headers}).then(r=>r.json())).revision,null);
  assert.equal((await fetch(url+'/api/jobs/'+job.id+'/master-brief-translation?briefRevision=missing',{headers})).status,400);
  const draft={schema:'sues-master-story/v1',sourceSha256:cat.sourceSha256,
   timeline:{fingerprint:cat.timelineFingerprint,timeSpace:'edit-timeline',fps:30,duration:cat.duration},
   visual:{mode:'brand-sues'},narrative:{centralMessage:'Original que se revisará',
    intendedExperience:'Entender el contexto completo',scenes:report.scenes.map(s=>({
    id:s.id,start:s.editStart,end:s.editEnd,purpose:'Escena sin autorización creativa'}))},
   resources:[],operations:[]};
  const review=await fetch(url+'/api/jobs/'+job.id+'/master-brief-crosswalk',{method:'POST',headers,
   body:JSON.stringify({briefRevision:receipt.revision,expectedRevision:null,
   expectedSourceSha256:cat.sourceSha256,expectedTimelineFingerprint:cat.timelineFingerprint,
   story:draft,links:[]})});
  assert.equal(review.status,422);const blocked=await review.json();
  assert.equal(blocked.code,'TRANSLATION_INTENTS_PENDING');
  assert.ok(blocked.pendingIntents.length>=3);assert.equal(blocked.canExecute,false);
  const wrong=await fetch(url+'/api/jobs/'+job.id+'/master-brief-crosswalk',{method:'POST',headers,
   body:JSON.stringify({briefRevision:receipt.revision,expectedRevision:null,
   expectedSourceSha256:'f'.repeat(64),expectedTimelineFingerprint:cat.timelineFingerprint,
   story:draft,links:[]})});
  assert.equal(wrong.status,409);
  assert.equal((await fetch(url+'/api/jobs/'+job.id+'/master-current',{headers}).then(r=>r.json())).revision,null);
 }finally{await app.close();rmSync(f.dir,{recursive:true,force:true});}
});

test('a source camera shot with M01 is preserved as camera plus a real overlay intent',()=>{
 const input=text.replace('base **CARLOS**.', 'base **CARLOS**; gráfico M01.');
 const a=translateFilmDirectorBrief({text:input,sourceSha256:H,originalSha256:O,timelineFingerprint:T,duration:6});
 const camera=a.scenes[0].shots[0];
 assert.equal(camera.kind,'camera');assert.equal(camera.base,'CARLOS');
 assert.deepEqual(camera.overlayResourceHints,['M01']);
 assert.ok(a.operationIntents.some(x=>x.id===camera.id+'-overlay-M01'));
 assert.ok(a.resourceReferences.some(x=>x.role==='overlay'&&x.resourceHint==='M01'));
});

test('preserves a camera return described only inside a resource paragraph',()=>{
 const input=text.replace('**Recurso y máscara:** B01 pendiente.', '**Recurso y máscara:** B01 pendiente; retorno breve a cámara 2,5–3 s.');
 const result=translateFilmDirectorBrief({text:input,sourceSha256:H,originalSha256:O,timelineFingerprint:T,duration:6});
 assert.equal(result.scenes[0].shots.length,3);
 const returned=result.scenes[0].shots.at(-1);
 assert.equal(returned.kind,'camera');assert.equal(returned.base,'CARLOS');
 assert.equal(returned.sourceStart,2.5);assert.equal(returned.sourceEnd,3);
 assert.equal(returned.implicitFromExplicitDirection,true);
 assert.ok(result.operationIntents.some(i=>i.id===returned.id+'-base'));
 assert.equal(result.instructionCoverage.unaccountedNonemptyLines.length,0);
});
