"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {windows,diff}=require("../sues-window-reuse.cjs");
const R14=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../../data/project.json"),"utf8"));
const config={frames:1667,fps:30,chunkFrames:180,globalMediaProof:"EXACT-MEDIA",rendererProof:"EXACT-RENDERER",compScoped:true};
const calc=(p,c=config)=>windows(p,c);
const changes=(p)=>diff(calc(R14),calc(p)).filter(x=>!x.reusable).map(x=>x.startFrame);
test("R14 title text within comp invalidates only affected 6-second window",()=>{
 const p=structuredClone(R14);const c=p.comps.find(c=>c.id==="comp-SC01-TITLE");
 c.clips.find(x=>x.kind==="text").props.text+=" QA";
 assert.deepEqual(changes(p),[0]);
 const legacy={...config,compScoped:false};
 assert.equal(diff(calc(R14,legacy),calc(p,legacy)).filter(x=>x.reusable).length,0);
});
test("R14 modified animated caption invalidates only own window",()=>{
 const p=structuredClone(R14);const c=p.comps.find(c=>c.id==="comp-V5-SC02-CAP01-0");
 assert(c);c.clips[0].props.x=(c.clips[0].props.x||0)+10;
 assert.deepEqual(changes(p),[0,180]); // caption 5.9 to 6.7s crosses 6s boundary
});
test("root audio edit and compositor/code proof change invalidate all",()=>{
 const p=structuredClone(R14);p.clips.find(c=>c.kind==="audio").props.gain=2;
 assert.equal(changes(p).length,10);
 assert(diff(calc(R14),calc(R14,{...config,rendererProof:"changed"})).every(x=>!x.reusable));
});
test("unreferenced comp change can safely reuse all windows",()=>{
 const p=structuredClone(R14);p.comps.push({id:"unused-qa",width:10,height:10,clips:[],duration:0});
 assert.equal(changes(p).length,0);
});
test("missing comp, nested cycles, or nested audio deny incremental reuse",()=>{
 const base={media:[],clips:[{id:"host",kind:"comp",compId:"first",start:0,duration:2}],
 comps:[{id:"first",clips:[],duration:2,width:100,height:100}]};
 const opts={...config,frames:60,chunkFrames:30};
 assert.equal(windows({...base,comps:[]},opts),null);
 const cyclic=structuredClone(base);cyclic.comps[0].clips.push({id:"child",kind:"comp",compId:"first",start:0,duration:2});
 assert.equal(windows(cyclic,opts),null);
 const audio=structuredClone(base);audio.comps[0].clips.push({id:"snd",kind:"audio",start:0,duration:2});
 assert.equal(windows(audio,opts),null);
});
test("old v1 and opt-in v2 keys are distinct even without composition change",()=>{
 assert(diff(calc(R14,{...config,compScoped:false}),calc(R14)).every(x=>!x.reusable));
});
