"use strict";
// Private, reusable Chrome worker for the EXISTING FableCut compositor.
// Worker jobs must never be broadcast to public /api/events or editor tabs.
const fs=require("fs"),os=require("os"),path=require("path"),crypto=require("crypto");
const {spawn}=require("child_process");
const {findBrowser}=require("./export-jobs");
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function createResidentWorker({port,debugPort,profileDir,qaNoSandbox=false}={}){
  const secret=crypto.randomBytes(32).toString("hex");
  const checkToken=input=>typeof input==="string"&&input.length===secret.length&&crypto.timingSafeEqual(Buffer.from(input),Buffer.from(secret));
  let browser=null,socket=null,launching=null,seq=0;
  const pending=new Map();
  let lost=()=>{};
  const pageUrl="http://127.0.0.1:"+port+"/";
  function rpc(method,params){
    if(!socket||socket.readyState!==WebSocket.OPEN)return Promise.reject(Error("Resident CDP disconnected"));
    const id=++seq;
    return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{pending.delete(id);reject(Error("Resident CDP timeout: "+method))},15000);
      pending.set(id,{resolve,reject,timeout});
      socket.send(JSON.stringify({id,method,params}));
    });
  }
  function clearSocket(err){
    const old=socket;socket=null;
    for(const p of pending.values()){clearTimeout(p.timeout);p.reject(err||Error("Resident CDP closed"))}
    pending.clear();
    try{old?.close()}catch{}
  }
  async function openSocket(){
    for(let i=0;i<120;i++){
      if(!browser||browser.exitCode!==null)throw Error("Resident Chromium exited during startup");
      try{
        const response=await fetch("http://127.0.0.1:"+debugPort+"/json/list",{signal:AbortSignal.timeout(1500)});
        const pages=await response.json();
        const target=pages.find(p=>p.type==="page"&&p.url.startsWith(pageUrl));
        if(target?.webSocketDebuggerUrl){
          const ws=new WebSocket(target.webSocketDebuggerUrl);
          await new Promise((resolve,reject)=>{
            const timeout=setTimeout(()=>reject(Error("Resident CDP socket timeout")),3000);
            ws.onopen=()=>{clearTimeout(timeout);resolve()};
            ws.onerror=()=>{clearTimeout(timeout);reject(Error("Resident CDP socket error"))};
          });
          socket=ws;
          ws.onmessage=event=>{
            let msg;try{msg=JSON.parse(event.data)}catch{return}
            if(!msg.id||!pending.has(msg.id))return;
            const entry=pending.get(msg.id);pending.delete(msg.id);clearTimeout(entry.timeout);
            if(msg.error)entry.reject(Error(JSON.stringify(msg.error)));
            else entry.resolve(msg.result);
          };
          ws.onclose=()=>{if(socket===ws){clearSocket(Error("Resident socket disconnected"));lost()}};
          await rpc("Runtime.enable",{});
          return;
        }
      }catch{}
      await sleep(250);
    }
    throw Error("Resident Chromium failed to expose an isolated compositor page");
  }
  async function boot(){
    if(socket&&socket.readyState===WebSocket.OPEN)return;
    if(launching)return launching;
    launching=(async()=>{
      const chrome=process.env.FABLECUT_CHROME||findBrowser();
      if(!chrome||!fs.existsSync(chrome))throw Error("Resident Chromium executable not installed");
      if(browser&&browser.exitCode===null){try{browser.kill("SIGTERM")}catch{}}
      clearSocket();
      const dir=profileDir||fs.mkdtempSync(path.join(os.tmpdir(),"sues-resident-"));
      fs.mkdirSync(dir,{recursive:true});
      const args=["--headless=new",...(qaNoSandbox?["--no-sandbox","--disable-dev-shm-usage"]:[]),
        "--no-first-run","--no-default-browser-check","--disable-extensions",
        "--disable-background-timer-throttling","--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows","--autoplay-policy=no-user-gesture-required",
        "--remote-debugging-address=127.0.0.1","--remote-debugging-port="+debugPort,
        "--remote-allow-origins=*",
        "--user-data-dir="+dir,pageUrl];
      browser=spawn(chrome,args,{stdio:"ignore",windowsHide:true});
      const proc=browser;
      proc.on("exit",()=>{if(proc===browser){clearSocket(Error("Resident browser exited"));lost()}});
      await openSocket();
      let ready=false;
      for(let i=0;i<120;i++){
        try{
          const reply=await rpc("Runtime.evaluate",{
            expression:"typeof runExportJob === 'function' && !!state.connected && project?.clips?.length >= 0",
            returnByValue:true
          });
          if(reply.result?.value){ready=true;break}
        }catch{}
        await sleep(250);
      }
      if(!ready)throw Error("Resident compositor did not finish initialization");
      const init=await rpc("Runtime.evaluate",{
        expression:"window.__suesResidentToken="+JSON.stringify(secret)+";true",returnByValue:true
      });
      if(init.exceptionDetails||init.result?.value!==true)throw Error("Resident token initialization failed");
    })();
    try{return await launching}finally{launching=null}
  }
  async function dispatch(ticket){
    if(!ticket||!ticket.id)throw Error("Resident ticket missing");
    await boot();
    const result=await rpc("Runtime.evaluate",{
      expression:"(function(){if(state.exporting)throw Error('Resident busy');runExportJob("+JSON.stringify(ticket)+");return true})()",
      returnByValue:true,awaitPromise:false
    });
    if(result.exceptionDetails||result.result?.value!==true)
      throw Error("Resident compositor failed to start export: "+JSON.stringify(result.exceptionDetails||result.result));
  }
  function cancel(){
    if(socket?.readyState===WebSocket.OPEN)
      void rpc("Runtime.evaluate",{expression:"renderCancelled=true;try{exportAbort?.abort()}catch{};true",returnByValue:true}).catch(()=>{});
  }
  async function release(){
    if(!socket||socket.readyState!==WebSocket.OPEN)return false;
    try{
      const result=await rpc("Runtime.evaluate",{
        expression:"(function(){if(state.exporting)return false;if(runtime.__suesDecodeIdleTimer)clearTimeout(runtime.__suesDecodeIdleTimer);runtime.__suesDecodeIdleTimer=null;const d=runtime.__suesResidentDecodePool;if(d){for(const s of d.sources.values())try{s?.close()}catch{};d.sources.clear();d.opening.clear();d.lastUse.clear()}runtime.__suesResidentDecodePool=null;runtime.__suesResidentSourceSession=null;return true})()",
        returnByValue:true
      });
      return result.result?.value===true;
    }catch{return false}
  }
  function shutdown(){
    lost=()=>{};
    clearSocket(Error("Resident shutdown"));
    if(browser&&browser.exitCode===null)try{browser.kill("SIGTERM")}catch{}
    browser=null;
  }
  return {dispatch,cancel,release,shutdown,checkToken,onLost(fn){lost=typeof fn==="function"?fn:()=>{}},status(){return {running:!!browser&&browser.exitCode===null,connected:!!socket&&socket.readyState===WebSocket.OPEN}}};
}
module.exports={createResidentWorker};
