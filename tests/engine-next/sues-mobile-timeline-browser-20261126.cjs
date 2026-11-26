"use strict";
const fs=require("node:fs"),os=require("node:os"),path=require("node:path"),assert=require("node:assert/strict"),{spawn}=require("node:child_process"),{test}=require("node:test");
const {makeDataDir,startServer,seedProject}=require("./helpers");
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<100;i++){try{const v=await fn();if(v)return v;}catch{}await delay(100);}throw Error("timeout");}
test("SUES mobile family palette and native quick size browser smoke",async t=>{
 const dir=makeDataDir(t,seedProject({width:1080,height:1920,media:[],clips:[
 {id:"title",kind:"text",name:"TITLE-test",track:"V2",start:0,in:0,duration:5,props:{text:"TITULO",fontSize:80}},
 {id:"sub",kind:"text",name:"CAP-test",track:"V3",start:0,in:0,duration:5,props:{text:"subtitulo",fontSize:50}},
 {id:"grade",kind:"adjust",name:"CE-Sombra fria",track:"V4",start:0,in:0,duration:5,props:{grade:{temp:-20}}},
 ]}));
 const {base}=await startServer(t,dir);
 const http=await fetch(base+"/index.html");console.log("HTTP",http.status,http.headers.get("content-type"),(await http.text()).slice(0,60));
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),"sues-ux-chrome-"));const chrome=spawn("/opt/sues-qa-browser-20261122/chrome-linux64/chrome",["--headless=new","--disable-dev-shm-usage","--disable-gpu","--no-proxy-server","--no-first-run","--no-default-browser-check","--remote-debugging-port=0","--user-data-dir="+profile,"--window-size=393,852","about:blank"],{stdio:"ignore"});
 t.after(()=>{chrome.kill();});
 const port=await until(()=>{const f=path.join(profile,"DevToolsActivePort");return fs.existsSync(f)&&fs.readFileSync(f,"utf8").split("\n")[0]});
 const page=await until(async()=>{const r=await fetch("http://127.0.0.1:"+port+"/json");return (await r.json()).find(x=>x.type==="page")});
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});t.after(()=>ws.close());let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}};
 function send(method,params={}){return new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))})}
 async function val(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true});if(r.result?.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result?.result?.value;}
 await send("Runtime.enable");await send("Page.enable");await send("Emulation.setDeviceMetricsOverride",{width:393,height:852,deviceScaleFactor:1,mobile:false});
 console.log("NAV",base,JSON.stringify(await send("Page.navigate",{url:base+"/index.html"})));
 try{await until(()=>val('typeof project!=="undefined"&&project.clips.some(c=>c.id==="sub")&&!!document.querySelector(\'.clip[data-id="sub"]\')'));}catch(e){console.log("DEBUG",await val('({url:location.href,title:document.title,ready:document.readyState,project:typeof project==="undefined"?null:project.clips.map(c=>[c.id,c.kind]),body:document.body.innerText.slice(0,500),viewport:innerWidth,clipCount:document.querySelectorAll(".clip").length})'));throw e;}
 const details=await val('Array.from(document.querySelectorAll(".clip[data-sues-family]")).map(e=>[e.dataset.id,e.dataset.suesFamily,getComputedStyle(e).borderColor])');
 assert.ok(details.some(x=>x[0]==="sub"&&x[1]==="ST"&&x[2]==="rgb(255, 255, 255)"),JSON.stringify(details));
 assert.ok(details.some(x=>x[0]==="title"&&x[1]==="T"&&x[2]==="rgb(255, 218, 53)"),JSON.stringify(details));
 await val('selectClip("sub");window.SuesMobileText.syncQuickSize();true');
 const quick=await val('({hidden:document.getElementById("suesQuickFontSize").hidden,value:document.querySelector("#suesQuickFontSize input").value})');assert.equal(quick.hidden,false);assert.equal(quick.value,"50");
 await val('document.querySelector("#suesQuickFontSize button:last-child").click();true');
 assert.equal(await val('getClip("sub").props.fontSize'),51);
 assert.equal(await val('getClip("title").props.fontSize'),80);
});
