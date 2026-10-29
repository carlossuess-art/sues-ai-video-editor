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

import {montageMap} from '../src/montage-cuts.js';
test('montage deletion cannot approve a deleted hook SFX and surviving onsets shift to final time',()=>{
 const p={duration:20,policy:{templateId:'SUES_DOPAMIN'},selectedMedia:[0,6,12,18].map(t=>event(t,t+2)),soundEffects:{enabled:true,gain:.2,events:[{start:.1}]},postEdit:montageMap(20,[{start:0,end:5}])};
 const before=JSON.stringify(p),r=gate(p);assert.equal(r.pass,false);assert.equal(r.hookSfx,false);assert.equal(r.duration,15);assert.equal(r.counts.broll,3);assert.equal(JSON.stringify(p),before);
 assert.equal(gate({...p,soundEffects:{enabled:true,gain:.2,events:[{start:6.1}]}}).pass,true);
 assert.equal(gate({...p,soundEffects:null,customSfx:{events:[{start:6.1,gain:.3}]}}).hookSfx,true);
 assert.equal(gate({...p,soundEffects:{enabled:true,gain:.2,events:[{start:4.99,end:6.5}]}}).hookSfx,false,'a surviving sound tail is not a new onset');
});
test('partially retained visuals clip to joins, removed supports cannot fill final gaps',()=>{
 const p={duration:20,policy:{templateId:'SUES_CALMA'},selectedMedia:[event(0,7),event(16,20)],soundEffects:{enabled:true,gain:.2,events:[{start:5} ]},postEdit:montageMap(20,[{start:0,end:5}])};
 const r=gate(p);assert.equal(r.hookSfx,true);assert.equal(r.maxGap,9);assert.deepEqual(r.gaps,[{start:2,end:11}]);assert.equal(r.pass,false);
 const atEnd={...p,postEdit:montageMap(20,[{start:5,end:20}]),soundEffects:{enabled:true,gain:.2,events:[{start:0}]}};assert.equal(gate(atEnd).pass,true);assert.equal(gate(atEnd).duration,5);
});
test('final duration selects density rule and splitting a resource never inflates its count',()=>{
 const p={duration:80,policy:{templateId:'SUES_DOPAMIN'},selectedMedia:[event(0,80)],semantic:{motions:[event(1,75)]},foregroundEffects:{events:[{...event(2,70),type:'behind-video'}]},soundEffects:{enabled:true,gain:.2,events:[{start:0}]},postEdit:montageMap(80,[{start:10,end:12},{start:20,end:22},{start:30,end:32},{start:40,end:42},{start:50,end:52}])};
 const r=gate(p);assert.equal(r.duration,70);assert.equal(r.counts.broll,1);assert.equal(r.counts.motions,1);assert.equal(r.counts.cutouts,1);assert.ok(r.issues.includes('al menos cinco B-rolls'));assert.ok(r.issues.includes('al menos dos motion graphics'));
 const shorter={...p,postEdit:montageMap(80,[{start:55,end:80}])};assert.equal(gate(shorter).duration,55);assert.equal(gate(shorter).pass,true);
});
