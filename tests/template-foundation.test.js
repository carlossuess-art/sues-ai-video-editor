import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_BRAND_KIT,validateBrandKit} from '../src/brand-kit.js';
import {validateTemplate,compileTemplatePolicy} from '../src/template.js';
import {readFileSync} from 'node:fs';

const template=()=>JSON.parse(readFileSync(new URL('../examples/templates/sues-calma.template.json',import.meta.url)));
test('brand kit v1 validates',()=>assert.equal(validateBrandKit(DEFAULT_BRAND_KIT),true));
test('SUES CALMA template compiles to deterministic policy',()=>{
  const t=template();assert.equal(validateTemplate(t,DEFAULT_BRAND_KIT),true);
  const p=compileTemplatePolicy(t,DEFAULT_BRAND_KIT);
  assert.equal(p.templateId,'SUES_CALMA');assert.equal(p.constraints.semanticZoomOnly,true);
});
test('template rejects periodic zoom policy',()=>{
  const t=template();t.constraints.semanticZoomOnly=false;
  assert.throws(()=>validateTemplate(t,DEFAULT_BRAND_KIT));
});
