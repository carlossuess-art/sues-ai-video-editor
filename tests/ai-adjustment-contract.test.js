import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAiAdjustmentRequest,adjustmentSafetyPolicy} from '../src/ai-adjustment-contract.js';

test('AI adjustment accepts contextual prompt and enforces preview-first',()=>{
  assert.equal(validateAiAdjustmentRequest({
    version:'1.0',jobId:'job-1',prompt:'Baja la música y haz este tramo más reflexivo',
    scope:'current-time',time:12.4,applyMode:'preview-first'
  }),true);
  assert.equal(adjustmentSafetyPolicy().preservePreviousVersion,true);
});

test('AI adjustment rejects direct publish semantics',()=>{
  assert.throws(()=>validateAiAdjustmentRequest({
    version:'1.0',jobId:'job-1',prompt:'cambia esto',scope:'global',applyMode:'direct'
  }));
});
