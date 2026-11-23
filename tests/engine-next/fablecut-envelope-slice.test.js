import test from 'node:test';
import assert from 'node:assert/strict';
import {linearValueAt,sliceLinearEnvelope,linearFadeEnvelope} from '../../src/engine-next/fablecut-envelope-slice.js';
test('scene cut within a fade retains every frame and boundary value',()=>{
 const whole=linearFadeEnvelope(809/30,18/30,18/30),cut=799/30;
 const left=sliceLinearEnvelope(whole,0,cut),right=sliceLinearEnvelope(whole,cut,10/30);
 assert.ok(Math.abs(linearValueAt(left,cut)-linearValueAt(right,0))<1e-10);
 for(let f=0;f<=809;f++){
  const actual=f<=799?linearValueAt(left,f/30):linearValueAt(right,(f-799)/30);
  assert.ok(Math.abs(actual-linearValueAt(whole,f/30))<1e-10);
 }
 assert.ok(linearValueAt(right,0)>0&&linearValueAt(right,0)<1);
});
test('duck attack/hold/release survives arbitrary cuts without a reset',()=>{
 const keys=[{t:0,v:0},{t:1,v:0},{t:1+4/30,v:-6},{t:2,v:-6},{t:2+12/30,v:0},{t:4,v:0}];
 for(const cut of [1.05,1.5,2.2]){
  const a=sliceLinearEnvelope(keys,0,cut),b=sliceLinearEnvelope(keys,cut,4-cut);
  for(let f=0;f<=120;f++){
   const t=f/30,v=t<=cut?linearValueAt(a,t):linearValueAt(b,t-cut);
   assert.ok(Math.abs(v-linearValueAt(keys,t))<1e-10);
  }
 }
});
test('malformed and nonlinear envelopes fail rather than silently changing motion',()=>{
 for(const keys of [[],[{t:0,v:0},{t:0,v:1}],[{t:0,v:NaN}],[{t:0,v:1,ease:'bounce'}]])assert.throws(()=>sliceLinearEnvelope(keys,0,1));
 assert.throws(()=>sliceLinearEnvelope([{t:0,v:1}],-1,1));
 assert.throws(()=>linearFadeEnvelope(1,.8,.8));
});
