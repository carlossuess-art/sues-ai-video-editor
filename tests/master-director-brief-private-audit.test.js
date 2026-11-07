import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const SOURCE='a'.repeat(64),ORIGINAL='b'.repeat(64);
const run=(args)=>spawnSync(process.execPath,['scripts/app/audit_master_film_brief.mjs',...args],{encoding:'utf8'});
test('private Film Director audit reports full line coverage but never authorizes a plan',()=>{
 const d=mkdtempSync(join(tmpdir(),'sues-film-audit-'));
 try{
  const brief=join(d,'source.md'),out=join(d,'audit.json');
  writeFileSync(brief,`# Film Director
> NO APROBADO / NO EJECUTAR ${ORIGINAL}
### Escena 01 · GANCHO · 00:00–00:03
- \`0–1 s\`: base **CARLOS**; subtítulos abajo.
- \`1–3 s\`: base **B01**; B-roll pantalla completa.
`);
  const base=['--brief',brief,'--source-sha',SOURCE,'--original-sha',ORIGINAL,'--fingerprint','timeline-real','--duration','3'];
  const ok=run([...base,'--out',out]);
  assert.equal(ok.status,0,ok.stderr);
  const result=JSON.parse(ok.stdout);
  assert.equal(result.scenes,1);assert.equal(result.shots,2);
  assert.equal(result.preservedLines,5);
  assert.equal(result.status,'AUDITED_NOT_APPROVED_NOT_EXECUTABLE');
  assert.equal(result.canExecute,false);assert.equal(result.approved,false);
  assert.deepEqual(result.resources.map(r=>r.slot),['B01']);
  assert.equal(run([...base,'--out',out]).status,1,'must not overwrite existing evidence');
  assert.equal(run(base.map((arg,i)=>i===5?'f'.repeat(64):arg)).status,3,'wrong original hash blocks');
 }finally{rmSync(d,{recursive:true,force:true});}
});
