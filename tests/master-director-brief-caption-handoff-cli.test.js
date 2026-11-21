import test from 'node:test';import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {translateFilmDirectorBrief} from '../src/master-director-brief-translation.js';
import {draftFilmDirectorCaptions} from '../src/master-director-brief-caption-draft.js';
const sha=s=>createHash('sha256').update(s).digest('hex');
const O='b'.repeat(64),H='a'.repeat(64),T='timeline';
const text='# Reel\n> NO APROBADO / NO EJECUTAR '+O+
 '\nSubtítulos: x=90–990, y=1470–1660\n'+
 '### Escena 01 · HOOK · 00:00–00:02\n- `0–2 s`: base **CARLOS**; subtítulos abajo.';
const call=a=>spawnSync(process.execPath,['scripts/app/audit_master_film_caption_layers.mjs',...a],{encoding:'utf8'});
test('private CLI prepares immutable, non-authorizing caption handoff',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sues-film-captions-'));
 try{
  const annex=translateFilmDirectorBrief({text,sourceSha256:H,originalSha256:O,timelineFingerprint:T,duration:2});
  const draft=draftFilmDirectorCaptions(annex,{language:'es',sourceDuration:2,words:[
   {text:'Hola',start:0.2,end:0.5,confidence:1},{text:'Carlos',start:0.5,end:1,confidence:1}]});
  const a=join(dir,'annex.json'),d=join(dir,'draft.json'),out=join(dir,'handoff.json');
  writeFileSync(a,JSON.stringify(annex));writeFileSync(d,JSON.stringify(draft));
  const args=['--annex',a,'--caption-draft',d,'--out',out],run=call(args);
  assert.equal(run.status,0,run.stderr);
  const receipt=JSON.parse(run.stdout),body=JSON.parse(readFileSync(out,'utf8'));
  assert.equal(receipt.candidateCount,2);assert.equal(body.captionLayerCandidates.candidates[1].text,'Hola Carlos');
  assert.equal(receipt.approved,false);assert.equal(receipt.canExecute,false);
  assert.equal(call(args).status,5,'no overwriting a previous evidence receipt');
  const tampered=structuredClone(draft);tampered.sourceSha256='f'.repeat(64);
  writeFileSync(d,JSON.stringify(tampered));
  assert.equal(call([...args.slice(0,-1),join(dir,'tampered.json')]).status,4);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
