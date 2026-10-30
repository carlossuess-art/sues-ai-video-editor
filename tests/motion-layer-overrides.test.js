import test from 'node:test';
import assert from 'node:assert/strict';
import {rmSync} from 'node:fs';
import {fixture} from './helpers/editor-fixture.js';
import {loadProject,prepareProject} from '../src/local-pipeline.js';
import {buildPreviewASS} from '../src/local-preview.js';
test('motion graphic has real independent text/background layers with synchronized shifted timing and edited copy',()=>{
 const f=fixture();try{
  const p=loadProject(f.profiles.test),base=prepareProject(p,{styleId:'SUES_DOPAMIN',sfxEnabled:true});
  const m=base.plan.semantic.motions.find(e=>e.params.motionId==='QUOTE_CARD_01');assert.ok(m);
  const edits={[m.id]:{offset:.1,layers:{quote:{offset:.2,text:'ESTA FRASE ES MÍA'}}}};
  const changed=prepareProject(p,{styleId:'SUES_DOPAMIN',sfxEnabled:true,motionLayerOverrides:edits}).plan;
  const c=changed.semantic.motions.find(x=>x.id===m.id);
  assert.equal(c.start,m.start+.1);assert.equal(c.layerTimes.panel.start,m.layerTimes.panel.start+.1);
  assert.ok(Math.abs(c.layerTimes.quote.start-(m.layerTimes.quote.start+.3))<1e-6);
  assert.equal(c.instance.layers.find(l=>l.id==='quote').content,'ESTA FRASE ES MÍA');
  const a=buildPreviewASS(changed);assert.ok(a.includes('ESTA FRASE ES MÍA'));assert.ok(!a.includes('detenerte y sentir.'));
  assert.throws(()=>prepareProject(p,{styleId:'SUES_DOPAMIN',motionLayerOverrides:{[m.id]:{offset:0,layers:{quote:{offset:3}}}}}),/fuera de la composición|motion layer invalid/);
  assert.throws(()=>prepareProject(p,{styleId:'SUES_DOPAMIN',motionLayerOverrides:{[m.id]:{offset:0,layers:{panel:{text:'fraude'}}}}}),/Solo las capas de texto/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
