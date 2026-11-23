"use strict";
const fs=require("fs"),wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const tabs=await(await fetch("http://127.0.0.1:18172/json/list")).json();
 const t=tabs.find(x=>x.type==="page"&&x.url.endsWith("/q03-export-qa/qa.html"));
 if(!t)throw Error("preview QA page absent");
 const ws=new WebSocket(t.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{ws.onopen=ok;ws.onerror=fail});
 let seq=0;const pending=new Map();
 ws.onmessage=e=>{const d=JSON.parse(e.data),p=pending.get(d.id);if(p){pending.delete(d.id);d.error?p.fail(Error(JSON.stringify(d.error))):p.ok(d.result)}};
 const rpc=(method,params)=>new Promise((ok,fail)=>{const id=++seq;pending.set(id,{ok,fail});ws.send(JSON.stringify({id,method,params}))});
 const ev=async expression=>{const a=await rpc("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});if(a.exceptionDetails)throw Error(JSON.stringify(a.exceptionDetails));return a.result?.value};
 await rpc("Runtime.enable",{});
 let ready=false;
 for(let k=0;k<100;k++){ready=await ev("document.getElementById('preview').readyState>=1 && !!document.getElementById('download').href");if(ready)break;await wait(300)}
 const obj=await ev("({loaded:document.getElementById('preview').readyState>=1,source:document.getElementById('preview').currentSrc,videoW:document.getElementById('preview').videoWidth,videoH:document.getElementById('preview').videoHeight,duration:document.getElementById('preview').duration,downloadHref:document.getElementById('download').href,downloadHidden:document.getElementById('download').hidden,label:document.getElementById('quickInfo').textContent,project:document.getElementById('project').textContent,quickDisabled:document.getElementById('quick').disabled,jsFingerprint:projectFingerprint})");
 if(obj.videoW!==540||obj.videoH!==960||!obj.source.includes("preview_rev30_540x960_15fps")||obj.downloadHidden||!obj.downloadHref.includes("3fb17db578c8")||obj.quickDisabled)throw Error("Incorrect preview or HD separation: "+JSON.stringify(obj));
 const playback=await ev("(async()=>{const v=document.getElementById('preview');v.muted=true;await v.play();await new Promise(r=>setTimeout(r,1250));const o={paused:v.paused,time:v.currentTime};v.pause();return o})()");
 if(playback.paused||playback.time<0.1)throw Error("Preview video did not advance: "+JSON.stringify(playback));
 const out={pass:true,video:obj,playback};
 fs.writeFileSync("/opt/sues-secure-headless-qa-20261122/q03-integrated-stage-20261122/data/analysis/q03-light-player-browser-verified.json",JSON.stringify(out,null,2));
 console.log("LIGHT_PREVIEW_BROWSER_PASS",JSON.stringify(out).slice(0,1700));ws.close();
})().catch(e=>{console.error("BROWSER_CHECK_FAILED",String(e.stack||e));process.exitCode=3});
