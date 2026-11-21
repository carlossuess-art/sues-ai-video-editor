"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {makeDataDir,seedProject,startServer,startMcp}=require("./stage/test/helpers");
const {normalize}=require("./stage/sues-mobile-ui-command");
test("UI command validator rejects unknown or unsafe actions",()=>{
 assert.equal(normalize({action:"open_tool",tool:"volume"}).tool,"volume");
 assert.throws(()=>normalize({action:"open_tool",tool:"bogus"}),/Unknown tool/);
 assert.throws(()=>normalize({action:"seek",time:Infinity}),/Non-finite/);
 assert.throws(()=>normalize({action:"zoom_timeline",zoom:10000}),/out of range/);
});
test("MCP UI tool requires authenticated loopback and browser ACK",async t=>{
 const dir=makeDataDir(t,seedProject());
 const server=await startServer(t,dir,{FABLECUT_NO_FS_WATCH:"1"});
 const mcp=startMcp(t,dir,{FABLECUT_PORT:String(server.port)});
 await mcp.request("initialize",{protocolVersion:"2025-11-25"});
 const tools=(await mcp.request("tools/list")).result.tools;
 assert.ok(tools.some(x=>x.name==="fablecut_mobile_ui"));
 const bad=await fetch(server.base+"/api/mobile-ui",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"open_tool",tool:"volume"})});
 assert.equal(bad.status,403,"uncredentialed request blocked");
 const noViewer=await mcp.callTool("fablecut_mobile_ui",{action:"open_tool",tool:"volume"});
 assert.equal(noViewer.isError,true);
 assert.match(noViewer.text,/Open one editor tab/);
 const abort=new AbortController();
 const stream=await fetch(server.base+"/api/events",{signal:abort.signal});
 assert.equal(stream.status,200);
 t.after(()=>abort.abort());
 const messages=[];
 let buf="";
 const processFrame=async frame=>{
   const kind=/event:\s*([^\n]+)/.exec(frame)?.[1];
   if(kind!=="mobile-ui")return;
   const data=JSON.parse(/data:\s*([^\n]+)/.exec(frame)[1]);
   messages.push(data);
   const ack=await fetch(server.base+"/api/mobile-ui/ack",{
     method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({id:data.id,ok:true})});
   assert.equal(ack.status,200);
 };
 const streamTask=(async()=>{
   try{for await(const part of stream.body){
     buf+=Buffer.from(part).toString();
     for(let end;(end=buf.indexOf("\n\n"))>=0;){
       const frame=buf.slice(0,end);buf=buf.slice(end+2);await processFrame(frame);
     }
   }}catch(e){if(!abort.signal.aborted)throw e;}
 })();
 const result=await mcp.callTool("fablecut_mobile_ui",{action:"open_tool",tool:"volume"});
 assert.equal(result.isError,false,result.text);
 assert.equal(messages.length,1);
 assert.equal(messages[0].tool,"volume");
 abort.abort();await streamTask;
});

