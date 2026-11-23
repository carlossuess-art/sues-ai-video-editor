"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const ops=require("./stage/sues-mobile-mcp");
const {makeDataDir,seedProject,readProject,startMcp}=require("./stage/test/helpers");
const fixture=()=>seedProject({
media:[{id:"m1",name:"test",kind:"video",src:"/media/test.mp4",duration:40}],
clips:[
 {id:"v1",kind:"video",mediaId:"m1",track:"V1",start:0,in:0,duration:6,props:{volume:1,scale:1}},
 {id:"t1",kind:"text",track:"V2",start:0,in:0,duration:6,props:{text:"Hola",scale:1}}
]});
async function boot(t){
 const dir=makeDataDir(t,fixture()),mcp=startMcp(t,dir);
 await mcp.request("initialize",{protocolVersion:"2025-11-25"});
 return {dir,patch:async(a,b)=>mcp.callTool("fablecut_patch_project",{ops:ops.edits(a,b)}),clip:id=>readProject(dir).clips.find(c=>c.id===id)};
}
test("native MCP accepts mobile move, layer order, scale and volume",async t=>{
 const h=await boot(t);
 for(const [a,p] of [
 ["move",{id:"v1",start:2,track:"V2"}],
 ["scale",{id:"v1",value:1.4}],
 ["volume",{id:"v1",value:0.5}],
 ["opacity",{id:"v1",value:0.75}],
 ["reorder",{id:"v1",track:"V1"}]
 ]){const r=await h.patch(a,p);assert.equal(r.isError,false,a+" "+r.text);}
 const c=h.clip("v1");
 assert.equal(c.start,2);assert.equal(c.duration,6);
 assert.equal(c.track,"V1");assert.equal(c.props.scale,1.4);
 assert.equal(c.props.volume,0.5);assert.equal(c.props.opacity,0.75);
});
test("native MCP accepts mobile text, animation and keyframes",async t=>{
 const h=await boot(t);
 for(const [a,p] of [
 ["text",{id:"t1",text:"Nuevo título"}],
 ["textStyle",{id:"t1",props:{font:"Montserrat",fontSize:72,glow:30,textAnim:"word-pop"}}],
 ["animation",{id:"t1",preset:"pop-in",length:0.5}],
 ["keyframes",{id:"t1",channels:{scale:[{t:0,v:1},{t:1,v:1.5}]}}]
 ]){const r=await h.patch(a,p);assert.equal(r.isError,false,a+" "+r.text);}
 const c=h.clip("t1");assert.equal(c.props.text,"Nuevo título");
 assert.equal(c.props.font,"Montserrat");assert.equal(c.props.textAnim,"word-pop");
 assert.equal(c.keyframes.scale.length,2);
});
test("native MCP split changes fragment duration, never original by moving body",async t=>{
 const h=await boot(t);
 let r=await h.patch("split",{id:"v1",at:2});
 assert.equal(r.isError,false,r.text);
 const doc=readProject(h.dir);
 const left=doc.clips.find(c=>c.id==="v1");
 assert.equal(left.duration,2);
 assert.ok(doc.clips.some(c=>c.id!=="v1"&&c.kind==="video"&&c.start===2&&c.duration===4));
});
test("MCP contract rejects unknown actions and unsafe values",()=>{
 assert.throws(()=>ops.edits("deleteEverything",{id:"v1"}),/No MCP parity/);
 assert.throws(()=>ops.edits("scale",{id:"v1",value:10}),/range/);
 assert.throws(()=>ops.edits("move",{id:"v1",start:NaN}),/finite/);
});

