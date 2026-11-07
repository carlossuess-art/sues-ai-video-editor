import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {auditFilmBriefProvenance} from '../src/master-director-brief-provenance.js';
const sha=s=>createHash('sha256').update(s).digest('hex');
const text='## Escena 01\n- Plano Carlos\n- Texto EXACTO';
const annex={schema:'sues-master-film-brief-translation/v1',sourceBriefSha256:sha(text),
 translationCoverage:{lostLines:0},allSourceLines:text.split('\n').map((text,i)=>({line:i+1,text}))};
test('identical bytes are distinguished from extra final newline',()=>{
 assert.equal(auditFilmBriefProvenance({rawText:text,annex}).status,'IDENTICAL_BYTES');
 const result=auditFilmBriefProvenance({rawText:text+'\n',annex});
 assert.equal(result.status,'FORMAT_ONLY_DIFFERENCE');
 assert.equal(result.editoriallyEqual,true);
 assert.equal(result.exact,false);
 assert.equal(result.requiresExactHashForExecution,true);
 assert.equal(result.approved,false);
 assert.equal(result.canExecute,false);
});
test('CRLF and terminal newlines are formatting-only; words and whitespace within lines are not',()=>{
 assert.equal(auditFilmBriefProvenance({rawText:text.replaceAll('\n','\r\n')+'\r\n',annex}).status,'FORMAT_ONLY_DIFFERENCE');
 assert.equal(auditFilmBriefProvenance({rawText:text.replace('EXACTO','DISTINTO'),annex}).status,'CONTENT_CHANGED');
 assert.equal(auditFilmBriefProvenance({rawText:text.replace('Carlos',' Carlos'),annex}).status,'CONTENT_CHANGED');
 assert.equal(auditFilmBriefProvenance({rawText:'',annex}).status,'CONTENT_CHANGED');
});
test('tampered annex and invalid data fail closed',()=>{
 assert.equal(auditFilmBriefProvenance({rawText:text,annex:{...annex,sourceBriefSha256:'f'.repeat(64)}}).code,'ANNEX_TEXT_HASH_INCONSISTENT');
 assert.equal(auditFilmBriefProvenance({rawText:text,annex:{...annex,translationCoverage:{lostLines:1}}}).code,'INVALID_PROVENANCE_INPUT');
 assert.equal(auditFilmBriefProvenance({rawText:text,annex:{...annex,allSourceLines:[{line:8,text:'bad'}]}}).code,'INVALID_PROVENANCE_INPUT');
});
