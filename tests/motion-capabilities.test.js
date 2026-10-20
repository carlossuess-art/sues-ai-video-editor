import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RENDERED_MOTIONS} from '../src/semantic-render.js';
import {auditMotionCapabilities,listEligibleMotionAssets} from '../src/motion-capabilities.js';
const catalog=()=>JSON.parse(readFileSync(new URL('../examples/motions/catalog.sample.json',import.meta.url)));

test('inventory distinguishes six renderers from two contract-only assets without claiming catalogue audio',()=>{
  const report=auditMotionCapabilities(catalog(),RENDERED_MOTIONS);
  assert.equal(report.length,8);
  assert.deepEqual(report.filter(x=>x.renderStatus==='contract-only').map(x=>x.id),['BLURRED_RESOURCE_01','COMPARE_YES_NO_01']);
  assert.equal(report.filter(x=>x.renderStatus==='implemented').length,6);
  assert.equal(report.find(x=>x.id==='CHECK_GREEN_01').audioStatus,'unbound-catalog-audio');
  assert.equal(report.find(x=>x.id==='QUOTE_CARD_01').audioStatus,'no-catalog-audio');
  assert.deepEqual(report.find(x=>x.id==='NUMBER_BADGE_GOLD_01').requiredBindings,['number','label']);
});

test('eligible candidates require implemented renderer, template permission, semantic evidence and bindings',()=>{
  const report=auditMotionCapabilities(catalog(),RENDERED_MOTIONS);
  const allowedIds=['QUOTE_CARD_01','NUMBER_BADGE_GOLD_01','BLURRED_RESOURCE_01'];
  assert.deepEqual(listEligibleMotionAssets(report,{allowedIds,semanticReason:'reflection',duration:2,bindings:{QUOTE_CARD_01:{quote:'Una cita literal'}}}),['QUOTE_CARD_01']);
  assert.deepEqual(listEligibleMotionAssets(report,{allowedIds,semanticReason:'reflection',duration:2}),[]);
  assert.deepEqual(listEligibleMotionAssets(report,{allowedIds,semanticReason:'steps',duration:.7,bindings:{NUMBER_BADGE_GOLD_01:{number:'2',label:'Paso'}}}),[]);
  assert.deepEqual(listEligibleMotionAssets(report,{allowedIds,semanticReason:'steps',duration:1,bindings:{NUMBER_BADGE_GOLD_01:{number:'2',label:'Paso'}}}),['NUMBER_BADGE_GOLD_01']);
  assert.deepEqual(listEligibleMotionAssets(report,{allowedIds,semanticReason:'visual-proof',duration:4,bindings:{BLURRED_RESOURCE_01:{resource:'a','resource-title':'b'}}}),[]);
});

test('catalogue corruption and unsupported renderers fail closed',()=>{
  const items=catalog();
  assert.throws(()=>auditMotionCapabilities([...items,items[0]],RENDERED_MOTIONS),/duplicado/);
  assert.throws(()=>auditMotionCapabilities(items,['INVENTED_01']),/missing from catalogue/);
  assert.throws(()=>auditMotionCapabilities(items,['QUOTE_CARD_01','QUOTE_CARD_01']),/unique renderer/);
  const report=auditMotionCapabilities(items,RENDERED_MOTIONS);
  assert.throws(()=>listEligibleMotionAssets(report,{allowedIds:['QUOTE_CARD_01'],semanticReason:'reflection',duration:0}),/positive duration/);
  assert.throws(()=>listEligibleMotionAssets(report,{allowedIds:['QUOTE_CARD_01','QUOTE_CARD_01'],semanticReason:'reflection',duration:2}),/unique allowed/);
});
