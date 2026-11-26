"use strict";
const fs=require("node:fs"),os=require("node:os"),path=require("node:path"),assert=require("node:assert/strict"),{spawn,execFileSync}=require("node:child_process"),{test}=require("node:test");
const {makeDataDir,startServer,seedProject,startMcp,readProject}=require("./helpers");
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,attempts=100){for(let i=0;i<attempts;i++){try{const v=await fn();if(v)return v;}catch{}await delay(100);}throw Error("timeout");}
test("SUES mobile family filter and native text controls",async t=>{
 const withFilmstrip = process.env.SUES_QA_FILMSTRIP === "1";
 const withVoiceover = process.env.SUES_QA_VOICE === "1";
 const media = withFilmstrip ? [{id:"source",kind:"video",src:"/media/source.mp4",duration:2,width:180,height:320,fps:15}] : [];
 const videoClips = withFilmstrip ? [{id:"original",name:"Vídeo principal",mediaId:"source",kind:"video",track:"V1",start:0,in:.2,duration:1,props:{}}] : [];
 const dir=makeDataDir(t,seedProject({width:540,height:960,fps:15,media,clips:[
 ...videoClips,
 {id:"title",kind:"text",name:"TITLE-test",track:"V2",start:0,in:0,duration:1,props:{text:"TITULO",fontSize:80}},
 {id:"sub",kind:"text",name:"CAP-test",track:"V3",start:0,in:0,duration:1,props:{text:"subtitulo",fontSize:50}},
 {id:"ellipse",kind:"shape",name:"Elementos de prueba",track:"V5",start:0,in:0,duration:1,props:{shapes:[{type:"ellipse",w:300,h:300,fill:"#ffffff"}]}},
 {id:"grade",kind:"adjust",name:"CE-Sombra fria",track:"V4",start:0,in:0,duration:1,props:{grade:{temp:-20}}},
 ]}));
 if (withFilmstrip) {
   fs.mkdirSync(path.join(dir,"media"));
   execFileSync("ffmpeg",["-v","error","-f","lavfi","-i","testsrc2=size=180x320:rate=15",
     "-t","2","-c:v","libx264","-pix_fmt","yuv420p",path.join(dir,"media","source.mp4")]);
 }
 const {base,port:serverPort}=await startServer(t,dir);
 const http=await fetch(base+"/index.html");console.log("HTTP",http.status,http.headers.get("content-type"),(await http.text()).slice(0,60));
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),"sues-ux-chrome-"));const chrome=spawn("/opt/sues-qa-browser-20261122/chrome-linux64/chrome",["--headless=new","--disable-dev-shm-usage","--disable-gpu","--no-proxy-server","--no-first-run","--no-default-browser-check","--remote-debugging-port=0","--user-data-dir="+profile,"--window-size=393,852",...(withVoiceover?["--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"]:[]),"about:blank"],{stdio:"ignore"});
 t.after(()=>{chrome.kill();});
 const port=await until(()=>{const f=path.join(profile,"DevToolsActivePort");return fs.existsSync(f)&&fs.readFileSync(f,"utf8").split("\n")[0]});
 const page=await until(async()=>{const r=await fetch("http://127.0.0.1:"+port+"/json");return (await r.json()).find(x=>x.type==="page")});
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});t.after(()=>ws.close());let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}};
 function send(method,params={}){return new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))})}
 async function val(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true});if(r.result?.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result?.result?.value;}
 await send("Runtime.enable");await send("Page.enable");await send("Emulation.setDeviceMetricsOverride",{width:393,height:852,deviceScaleFactor:1,mobile:false});
 console.log("NAV",base,JSON.stringify(await send("Page.navigate",{url:base+"/index.html"})));
 try{await until(()=>val('typeof project!=="undefined"&&project.clips.some(c=>c.id==="sub")&&!!document.querySelector(\'.clip[data-id="sub"]\')'));}catch(e){console.log("DEBUG",await val('({url:location.href,title:document.title,ready:document.readyState,project:typeof project==="undefined"?null:project.clips.map(c=>[c.id,c.kind]),body:document.body.innerText.slice(0,500),viewport:innerWidth,clipCount:document.querySelectorAll(".clip").length})'));throw e;}
 if (withFilmstrip) {
   await val('state.pps=60;rebuildClips();true');
   const readStrip = `Array.from(document.querySelectorAll('.clip[data-id="original"] .sues-filmstrip-batch'))
     .filter(image=>image.complete && image.naturalWidth>0).map(image=>image.dataset.url)`;
   const normal = await until(async ()=>{
     const images = await val(readStrip);
     return images.length === 1 && images;
   });
   assert.equal(new URL(normal[0],base).searchParams.get("t"),"0.200000");
   await val('state.pps=240;rebuildClips();true');
   const enlarged = await until(async ()=>{
     const images = await val(readStrip);
     return images.length === 4 && images;
   });
   const sourceTimes = enlarged.map(url=>new URL(url,base).searchParams.get("t"));
   assert.deepEqual(sourceTimes,["0.200000","0.466667","0.733333","1.000000"]);
   const frame = await fetch(new URL(enlarged[1],base));
   assert.equal(frame.status,200);
   assert.equal(frame.headers.get("x-fablecut-frame-times"),"0.466667");
   console.log("Filmstrip uses real frames",sourceTimes.join(","));
   await val('state.pps=60;rebuildClips();true');
 }
 const details=await val('Array.from(document.querySelectorAll(".clip[data-sues-family]")).map(e=>[e.dataset.id,e.dataset.suesFamily,getComputedStyle(e).borderColor])');
 assert.ok(details.some(x=>x[0]==="sub"&&x[1]==="ST"&&x[2]==="rgb(255, 255, 255)"),JSON.stringify(details));
 assert.ok(details.some(x=>x[0]==="title"&&x[1]==="T"&&x[2]==="rgb(255, 218, 53)"),JSON.stringify(details));
 await val('selectClip("sub");window.SuesMobileText.syncQuickSize();true');
 const quick=await val('({hidden:document.getElementById("suesQuickFontSize").hidden,value:document.querySelector("#suesQuickFontSize input").value})');assert.equal(quick.hidden,false);assert.equal(quick.value,"50");
 await val('document.querySelector("#suesQuickFontSize button:last-child").click();true');
 assert.equal(await val('getClip("sub").props.fontSize'),51);
 assert.equal(await val('getClip("title").props.fontSize'),80);
 const selection = await val(`(() => {
   const track = document.querySelector('.track-head[data-sues-family="ST"] .track-id');
   const before = state.time;
   track.click();
   const first = [track.getAttribute("aria-pressed"), state.time === before, state.selId];
   selectClip("title");
   const protectedSelection = state.selId;
   const other = document.querySelector('.clip[data-id="title"]');
   const interactive = getComputedStyle(other).pointerEvents;
   track.click();
   const second = track.getAttribute("aria-pressed");
   selectClip("title");
   return {first, protectedSelection, interactive, second, selected:state.selId};
 })()`);
 assert.deepEqual(selection, {first:["true", true, "sub"],protectedSelection:"sub",interactive:"none",second:"false",selected:"title"});

 const visiblePixels = await val(`(() => {
   const c=getClip("ellipse"), W=els.preview.width, H=els.preview.height;
   const b=clipBounds(c,evalProps(c,state.time),W,H);
   return [suesVisiblePixel(c,{x:b.cx,y:b.cy},W,H,state.time),
     suesVisiblePixel(c,{x:b.cx+b.hw*.9,y:b.cy+b.hh*.9},W,H,state.time)];
 })()`);
 assert.deepEqual(visiblePixels, [true,false]);

 const dragTextHandle = async (index, dx, dy) => {
   const point = await val(`(() => {
     const c = getClip(state.selId), W = els.preview.width, H = els.preview.height;
     const box = clipBounds(c,evalProps(c,state.time),W,H);
     const handle = suesTextHandles(box,W,H)[${index}];
     const bounds = els.preview.getBoundingClientRect();
     return {x:bounds.left+handle.x*bounds.width/W,y:bounds.top+handle.y*bounds.height/H};
   })()`);
   await send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[point]});
   await send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:point.x+dx,y:point.y+dy}]});
   await send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
   return val('({...getClip("title").props})');
 };
 await send("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:1});
 const xScale = await dragTextHandle(7, 12, 0);
 assert.ok(xScale.textScaleX > 1, JSON.stringify(xScale));
 assert.equal(xScale.textScaleY ?? 1, 1);
 const yScale = await dragTextHandle(5, 0, 12);
 assert.equal(yScale.textScaleX,xScale.textScaleX);
 assert.ok(yScale.textScaleY > 1);
 const uniform = await dragTextHandle(2, 10, 10);
 assert.ok(uniform.textScaleX > yScale.textScaleX && uniform.textScaleY > yScale.textScaleY);
 assert.ok(Math.abs(uniform.textScaleX/uniform.textScaleY-yScale.textScaleX/yScale.textScaleY) < .001);
 await val('undo();true');
 assert.equal(await val('getClip("title").props.textScaleX'),yScale.textScaleX);
 await val('redo();true');
 assert.equal(await val('getClip("title").props.textScaleY'),uniform.textScaleY);
 assert.equal(uniform.fontSize, 80);
 assert.equal(await val('getClip("title").start'),0);
 await delay(700);
 await send("Page.reload");
 await until(()=>val(`typeof getClip !== "undefined" && getClip("title")?.props?.textScaleX > 1`));
 assert.equal(await val('getClip("title").props.textScaleY'),uniform.textScaleY);

 if (withVoiceover) {
   await val(`(() => {
     setTime(.2);
     window.SuesMobileContext.setContextMode("add");
     [...document.querySelectorAll("button")].find(el=>el.textContent.trim()==="Audio"&&el.getBoundingClientRect().width>0).click();
     [...document.querySelectorAll("button")].find(el=>el.textContent.includes("Grabar voz superpuesta")&&el.getBoundingClientRect().width>0).click();
     return true;
   })()`);
   const started = await until(()=>val('state.playing&&state.time>.52'));
   assert.equal(started,true);
   await val(`(() => {
     const button=[...document.querySelectorAll("button")].find(el=>el.textContent.includes("Detener grabación")&&el.getBoundingClientRect().width>0);
     if(button)button.click();
     return true;
   })()`);
   const voice = await until(()=>val('project.clips.find(c=>c.kind==="audio"&&c.name.startsWith("Voz superpuesta"))'));
   assert.ok(Math.abs(voice.start - .2) < .001, JSON.stringify(voice));
   assert.ok(voice.duration >= .1 && voice.duration <= .8);
   assert.equal(await val(`suesClipFamily(getClip(${JSON.stringify(voice.id)}))`),"VS");
   await until(()=>val(`!!wavePeaksFor(getClip(${JSON.stringify(voice.id)}))`));
   await until(()=>readProject(dir).clips.some(c=>c.id===voice.id));
   assert.equal(readProject(dir).media.find(item=>item.id==="source").src,"/media/source.mp4");
   console.log("Voiceover",JSON.stringify({start:voice.start,duration:voice.duration,track:voice.track}));
 }

 const mcp = startMcp(t,dir,{FABLECUT_PORT:String(serverPort)});
 await mcp.request("initialize",{protocolVersion:"2025-11-25"});
 const revision = readProject(dir).revision;
 const update = await mcp.callTool("fablecut_patch_project",{
   baseRevision:revision,
   ops:[{op:"updateClip",id:"title",set:{props:{textScaleY:1.42}}}]
 });
 assert.equal(update.isError,false,update.text);
 assert.equal(readProject(dir).clips.find(c=>c.id==="title").props.textScaleY,1.42);
 await send("Page.reload");
 await until(()=>val('typeof getClip!=="undefined"&&getClip("title")?.props.textScaleY===1.42'));

 const queued = await fetch(base+"/api/export/request",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({where:"tab",range:"entire"})
 });
 const ticket = await queued.json();
 assert.equal(queued.status,200,JSON.stringify(ticket));
 const result = await until(async ()=>{
   const job = await fetch(base+"/api/export/job?id="+ticket.id).then(r=>r.json());
   if(["done","failed","error","cancelled"].includes(job.status)) return job;
 },450);
 assert.equal(result.status,"done",JSON.stringify(result));
 const download = await fetch(new URL(result.src,base));
 assert.equal(download.status,200);
 const output = path.join(profile,"timeline-qa.mp4");
 fs.writeFileSync(output,Buffer.from(await download.arrayBuffer()));
 const streams = JSON.parse(execFileSync("ffprobe",["-v","error","-show_entries",
   "stream=codec_name,width,height,nb_frames,duration","-of","json",output],{encoding:"utf8"})).streams;
 if (withVoiceover) assert.ok(streams.some(stream=>stream.codec_name==="aac"),JSON.stringify(streams));
 const video = streams.find(stream=>stream.codec_name==="h264");
 assert.ok(video,JSON.stringify(streams));
 assert.equal(video.width,540);
 assert.equal(video.height,960);
 assert.equal(+video.nb_frames,15);
 assert.ok(Math.abs(+video.duration-1)<.07);
 execFileSync("ffmpeg",["-v","error","-i",output,"-f","null","-"]);
 if(process.env.SUES_QA_ARTIFACT_DIR){
   fs.copyFileSync(output,path.join(process.env.SUES_QA_ARTIFACT_DIR,"timeline-qa.mp4"));
 }
 console.log("Export verified",JSON.stringify(streams));
});
