import test from 'node:test';
import assert from 'node:assert/strict';
import {dopaminQualityGate} from '../src/dopamin-quality-gate.js';
const event=(start,end=start+1)=>({start,end});
test('short DOPAMIN needs all requested visual components and a distributed rhythm',()=>{
 const plan={duration:71,policy:{templateId:'SUES_DOPAMIN'},selectedMedia:[2,14,26,38,50].map(x=>event(x,x+2.5)),semantic:{motions:[event(8,10),event(44,46)],zooms:[]},foregroundEffects:{events:[{...event(32,34),type:'behind-video'}]},globalTransitions:Array.from({length:24},(_,i)=>event(.2+i*3,.6+i*3))};
 assert.equal(dopaminQualityGate(plan).pass,true);
 for(const change of [{selectedMedia:plan.selectedMedia.slice(0,4)},{semantic:{motions:[event(8,10)]}},{foregroundEffects:{events:[]}},{globalTransitions:[]}])assert.equal(dopaminQualityGate({...plan,...change}).pass,false);
 assert.equal(dopaminQualityGate({...plan,policy:{templateId:'SUES_CALMA'}}).applicable,false);
});
