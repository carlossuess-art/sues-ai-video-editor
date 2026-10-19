import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RENDERED_MOTIONS} from '../src/semantic-render.js';
import {auditMotionCapabilities} from '../src/motion-capabilities.js';
import {inspectMotionEligibility,listRenderSafeMotionAssets} from '../src/motion-preflight.js';

const report=()=>auditMotionCapabilities(
  JSON.parse(readFileSync(new URL('../examples/motions/catalog.sample.json',import.meta.url))),
  RENDERED_MOTIONS
);

test('preflight retains an eligible visual quote',()=>{
  const options={allowedIds:['QUOTE_CARD_01'],semanticReason:'reflection',duration:2,
    bindings:{QUOTE_CARD_01:{quote:'Una cita literal'}}};
  assert.deepEqual(listRenderSafeMotionAssets(report(),options),['QUOTE_CARD_01']);
});

test('preflight rejects undefined and blank dynamic bindings',()=>{
  for(const value of [undefined,null,'','   ']){
    const options={allowedIds:['QUOTE_CARD_01'],semanticReason:'reflection',duration:2,
      bindings:{QUOTE_CARD_01:{quote:value}}};
    const result=inspectMotionEligibility(report(),options).find(x=>x.id==='QUOTE_CARD_01');
    assert.equal(result.eligible,false);
    assert.ok(result.reasons.includes('missing-or-empty-binding:quote'));
  }
});

test('preflight rejects durations beyond the renderer six-second limit',()=>{
  const options={allowedIds:['QUOTE_CARD_01'],semanticReason:'reflection',duration:7,
    bindings:{QUOTE_CARD_01:{quote:'Una cita literal'}}};
  const result=inspectMotionEligibility(report(),options).find(x=>x.id==='QUOTE_CARD_01');
  assert.deepEqual(result.reasons,['duration-above-renderer-limit']);
});

test('preflight never promotes contract-only assets and warns about unbound catalogue audio',()=>{
  const options={allowedIds:['BLURRED_RESOURCE_01','CHECK_GREEN_01'],semanticReason:'correct',duration:1};
  const rows=inspectMotionEligibility(report(),options);
  assert.equal(rows.find(x=>x.id==='BLURRED_RESOURCE_01').eligible,false);
  assert.equal(rows.find(x=>x.id==='CHECK_GREEN_01').eligible,true);
  assert.deepEqual(rows.find(x=>x.id==='CHECK_GREEN_01').warnings,['catalog-audio-unbound']);
});
