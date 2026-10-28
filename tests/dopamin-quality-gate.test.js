import test from 'node:test';
import assert from 'node:assert/strict';
import {dopaminQualityGate as gate} from '../src/dopamin-quality-gate.js';
const event=(start,end=start+1)=>({start,end});
const short=(style='SUES_DOPAMIN')=>({duration:18,policy:{templateId:style},selectedMedia:[event(1,3),event(8,10),event(15,17)],soundEffects:{enabled:true,gain:.3,events:[{start:.95,weight:1}]}});
test('semantic coverage and synchronized active hook SFX are mandatory at every duration',()=>{
 assert.equal(gate(short()).pass,true);
 for(const soundEffects of [null,{enabled:false,gain:.3,events:[{start:1}]},{enabled:true,gain:0,events:[{start:1}]},{enabled:true,gain:.3,events:[{start:2}]}])assert.equal(gate({...short(),soundEffects}).pass,false);
 assert.equal(gate({...short(),soundEffects:null,customSfx:{events:[{start:1,gain:.3}]}}).pass,true);
 assert.equal(gate({...short(),soundEffects:null,customSfx:{events:[{start:1,gain:0}]}}).pass,false);
});
test('zoom flash blur ordinary captions and empty transitions cannot satisfy support',()=>{
 const p={...short(),selectedMedia:[],semantic:{zooms:[event(0,18)]},ambientOverlays:[event(0,18)],globalTransitions:[event(0,18)],captions:[event(0,18)],foregroundEffects:{events:[{...event(0,18),type:'background-blur'}]}};
 const result=gate(p);assert.equal(result.pass,false);assert.equal(result.maxGap,18);assert.equal(result.counts.visualChanges,0);
});
test('coverage includes leading and trailing gaps, overlap union, and exact limits',()=>{
 const p={...short(),duration:20,selectedMedia:[event(1,3),event(2,4),event(10,14)]};
 assert.equal(gate(p).pass,true);
 assert.equal(gate({...p,duration:20.01}).pass,false);
 assert.equal(gate({...p,selectedMedia:[event(7,14)]}).pass,false);
 assert.equal(gate({...p,selectedMedia:[event(1,21)]}).pass,false);
});
test('CALMA uses eight seconds and the same hook requirement',()=>{
 const p={...short('SUES_CALMA'),duration:23,selectedMedia:[event(1,3),event(11,15)]};
 assert.equal(gate(p).pass,true);assert.equal(gate({...p,duration:23.01}).pass,false);
 assert.equal(gate({...p,soundEffects:null}).pass,false);
});
test('60–75s DOPAMIN density cannot be padded with transitions or zooms',()=>{
 const p={duration:71,policy:{templateId:'SUES_DOPAMIN'},selectedMedia:[2,14,26,38,50].map(x=>event(x,x+2.5)),semantic:{motions:[event(8,10),event(44,46)],zooms:[event(0,71)]},foregroundEffects:{events:[{...event(32,34),type:'behind-video'}]},globalTransitions:Array.from({length:24},(_,i)=>event(.2+i*3,.6+i*3))};
 assert.equal(gate(p).pass,false);
 const fixed={...p,illustrations:Array.from({length:24},(_,i)=>event(.2+i*2.9,.9+i*2.9)),soundEffects:{enabled:true,gain:.3,events:[{start:.2}]}};
 assert.equal(gate(fixed).pass,true);
 assert.equal(gate({...fixed,selectedMedia:p.selectedMedia.slice(0,4)}).pass,false);
});
