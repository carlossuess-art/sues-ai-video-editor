import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateV1,qualitativeGate} from '../src/e2e-acceptance.js';
import {readFileSync} from 'node:fs';

const manifest=()=>JSON.parse(readFileSync(new URL('../examples/e2e/acceptance.sample.json',import.meta.url)));
test('complete V1 manifest passes hard gate',()=>assert.equal(evaluateV1(manifest()).pass,true));
test('missing safety validation fails',()=>{
 const m=manifest();m.validations=m.validations.filter(x=>x.id!=='no-secret-leak');
 assert.deepEqual(evaluateV1(m).failed,['no-secret-leak']);
});
test('qualitative V1 allows at most three minor changes and zero major',()=>{
 assert.equal(qualitativeGate({majorChanges:0,minorChanges:3}).pass,true);
 assert.equal(qualitativeGate({majorChanges:1,minorChanges:0}).pass,false);
});
