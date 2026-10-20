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
const inspect=(id,reason,bindings,duration=2)=>inspectMotionEligibility(report(),{
  allowedIds:[id],semanticReason:reason,duration,bindings:{[id]:bindings}
}).find(item=>item.id===id);

test('rejects invalid badge numbers while preserving valid 1 to 99',()=>{
  for(const bad of ['0','00','01','100','2.5','-1','X'])
    assert.ok(inspect('NUMBER_BADGE_GOLD_01','steps',{number:bad,label:'Paso'}).reasons.includes('invalid-badge-number'));
  for(const good of ['1','99',2])
    assert.equal(inspect('NUMBER_BADGE_GOLD_01','steps',{number:good,label:'Paso'}).eligible,true);
});

test('rejects control characters, overlong and non-string captions',()=>{
  for(const bad of ['Hola'+String.fromCharCode(10)+'Mundo','Hola'+String.fromCharCode(127)+'Mundo','A'.repeat(53),42])
    assert.ok(inspect('QUOTE_CARD_01','reflection',{quote:bad}).reasons.includes('invalid-renderer-text:quote'));
});

test('rejects unwrappable captions including overlong single words',()=>{
  for(const bad of ['A'.repeat(27),('A'.repeat(16)+' ').repeat(3).trim()])
    assert.ok(inspect('STRIKE_TEXT_01','wrong',{text:bad}).reasons.includes('unwrappable-renderer-text:text'));
});

test('accepts valid two-line caption and preserves audio warning',()=>{
  assert.equal(inspect('QUOTE_CARD_01','reflection',{quote:'A'.repeat(25)+' '+'B'.repeat(25)}).eligible,true);
  assert.deepEqual(inspect('CHECK_GREEN_01','correct',{}).warnings,['catalog-audio-unbound']);
});

test('retains missing binding and duration checks',()=>{
  assert.ok(inspect('QUOTE_CARD_01','reflection',{quote:' '}).reasons.includes('missing-or-empty-binding:quote'));
  assert.ok(inspect('QUOTE_CARD_01','reflection',{quote:'Bien'},7).reasons.includes('duration-above-renderer-limit'));
  assert.deepEqual(listRenderSafeMotionAssets(report(),{
    allowedIds:['QUOTE_CARD_01'],semanticReason:'reflection',duration:2,
    bindings:{QUOTE_CARD_01:{quote:'Bien'}}
  }),['QUOTE_CARD_01']);
});
