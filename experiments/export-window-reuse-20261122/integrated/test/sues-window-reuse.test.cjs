"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {windows,diff}=require("../sues-window-reuse.cjs");
const settings={frames:900,fps:30,chunkFrames:180,globalMediaProof:"MEDIA-A",rendererProof:"CODE-A"};
const basic={fps:30,media:[{id:"asset",src:"/media/example.mp4"}],comps:[],tracks:[],
 clips:[
 {id:"v",kind:"video",start:0,duration:30,in:0,mediaId:"asset",props:{scale:1}},
 {id:"t",kind:"text",start:7,duration:1,in:0,props:{text:"ONE"}},
 {id:"a",kind:"audio",start:0,duration:30,in:0,props:{volume:1}}
 ]};
const make=()=>structuredClone(basic);
test("single text edit invalidates only its 6-second window",()=>{
 const before=windows(make(),settings),newer=make();newer.clips[1].props.text="TWO";
 const marks=diff(before,windows(newer,settings));
 assert.deepEqual(marks.map(x=>x.reusable),[true,false,true,true,true]);
});
test("non-rendering name and revision do not invalidate",()=>{
 const before=windows(make(),settings),p=make();p.name="changed";p.revision=31;
 assert(diff(before,windows(p,settings)).every(x=>x.reusable));
});
test("editing audio, comps, media or renderer invalidates all windows",()=>{
 const before=windows(make(),settings);
 for(const update of [p=>{p.clips[2].props.volume=.2;},p=>{p.comps.push({id:"x"})},
 p=>{p.media.push({id:"extra",src:"/media/other.mp4"})}]){
  const p=make();update(p);assert(diff(before,windows(p,settings)).every(x=>!x.reusable));
 }
 for(const change of [{globalMediaProof:"MEDIA-B"},{rendererProof:"CODE-B"}]){
  assert(diff(before,windows(make(),{...settings,...change})).every(x=>!x.reusable));
 }
});
test("unsupported clip, duplicate ID, broken parent and bad frame input fail closed",()=>{
 const a=make();a.clips.push({id:"z",kind:"arbitrary",start:2,duration:2});
 assert.equal(windows(a,settings),null);
 const b=make();b.clips[1].id="v";assert.equal(windows(b,settings),null);
 const c=make();c.clips[1].parent="unknown";assert.equal(windows(c,settings),null);
 assert.equal(windows(make(),{...settings,fps:0}),null);
});
test("master R14 fixture is eligible and text edit retains 9 of 10 windows",()=>{
 const p=path.resolve(__dirname,"../../data/project.json");
 const project=JSON.parse(fs.readFileSync(p,"utf8"));
 const conf={...settings,frames:1667};
 const original=windows(project,conf);assert.equal(original.length,10);
 const changed=structuredClone(project);
 const target=changed.clips.find(c=>c.id==="SC08-QUESTION");
 assert(target);target.props={...target.props,text:"STAGING TEST"};
 const marks=diff(original,windows(changed,conf));
 assert.equal(marks.filter(x=>x.reusable).length,9);
});


test("cyclic parent hierarchy fails closed even if every parent exists",()=>{
 const p=make();p.clips[0].parent="t";p.clips[1].parent="v";
 assert.equal(windows(p,settings),null);
});
test("offscreen dangling parent fails closed before any cache decision",()=>{
 const p=make();p.clips.push({id:"hidden",kind:"shape",start:900,duration:1,parent:"missing"});
 assert.equal(windows(p,settings),null);
});
test("R14 changes to mask, comps, track enablement and audio invalidate safely",()=>{
 const old=windows(JSON.parse(fs.readFileSync(path.resolve(__dirname,"../../data/project.json"),"utf8")),{...settings,frames:1667});
 const src=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../../data/project.json"),"utf8"));
 const mask=structuredClone(src),v=mask.clips.find(x=>x.kind==="video");v.props={...v.props,mask:{shape:"rect",x:0.25}};
 const m=diff(old,windows(mask,{...settings,frames:1667}));
 assert(m.some(x=>!x.reusable));
 const mutators=[
  p=>{p.comps[0].qaMeta={change:"mask"};},
  p=>{p.disabledTracks=["V1"];},
  p=>{p.clips.find(x=>x.kind==="audio").props.volume=0.5;}
 ];
 for(const change of mutators){const p=structuredClone(src);change(p);const w=windows(p,{...settings,frames:1667});assert(diff(old,w).every(x=>!x.reusable));}
});
