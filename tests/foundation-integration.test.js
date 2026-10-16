import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareFoundationPlan} from '../src/foundation-integration.js';
const read=p=>JSON.parse(readFileSync(new URL(`../examples/${p}`,import.meta.url)));
const input=()=>({template:read('templates/sues-calma.template.json'),brand:read('brand-kit.sues.json'),catalog:read('motions/catalog.sample.json'),director:read('director/sues-calma.sample.json'),duration:38.31});
test('real foundation examples interoperate without claiming render readiness',()=>{
 const p=prepareFoundationPlan(input());assert.equal(p.events.length,5);
 assert.ok(p.policy.motions.includes('BLURRED_RESOURCE_01'));
 assert.deepEqual(p.unresolvedMotions,[]);assert.equal(p.renderReady,false);
 assert.equal(p.camera.framingZoom,1.4);assert.ok(Math.abs(p.camera.maxSemanticScale-1.6/1.4)<1e-9);
});
test('composition and semantic zoom budgets cannot silently compound beyond cap',()=>{
 const x=input();x.director.decisions[1].params.scale=1.18;
 assert.throws(()=>prepareFoundationPlan(x),/combined zoom/);
 assert.doesNotThrow(()=>prepareFoundationPlan({...x,profile:'conservative'}));
});
test('unknown motion, missing brand colour and out-of-range times fail before rendering',()=>{
 const x=input();x.director.decisions[2].params.motionId='UNREGISTERED_01';
 assert.throws(()=>prepareFoundationPlan(x),/motion no permitido/);
 const y=input();delete y.brand.colors.accent;assert.throws(()=>prepareFoundationPlan(y),/color accent/);
 assert.throws(()=>prepareFoundationPlan({...input(),duration:35}),/beyond source/);
});
test('all four shipped templates resolve only registered motions',()=>{
 for(const id of ['calma','impacto','explica','historia']){
  const x=input();x.template=read(`templates/sues-${id}.template.json`);x.director={version:'1.0',templateId:x.template.id,decisions:[]};
  const p=prepareFoundationPlan(x);assert.equal(p.policy.motions.length, id==='calma'?4:3);
 }
});
