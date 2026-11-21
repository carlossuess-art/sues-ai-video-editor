/* Local-only, authenticated MCP -> one active FableCut browser tab.
   Only ephemeral UI navigation: editing stays in fablecut_patch_project. */
"use strict";
const crypto=require("node:crypto");
const {getToken}=require("./sues-mobile-token");
const commands=require("./sues-mobile-ui-command");
function create({broadcast,count,readBody,sendJSON}){
 const pending=new Map();
 const loopback=req=>["127.0.0.1","::1","::ffff:127.0.0.1"].includes(req.socket.remoteAddress);
 const authorized=req=>{
   if(!loopback(req))return false;
   const got=String(req.headers["x-sues-mcp-ui"]||"");
   const expected=getToken();
   return got.length===expected.length&&crypto.timingSafeEqual(Buffer.from(got),Buffer.from(expected));
 };
 async function handle(req,res,p){
   if(p!=="/api/mobile-ui"&&p!=="/api/mobile-ui/ack")return false;
   if(req.method!=="POST"){sendJSON(res,405,{error:"POST required"});return true;}
   if(p==="/api/mobile-ui"){
     if(!authorized(req)){sendJSON(res,403,{error:"MCP-only UI route"});return true;}
     if(count()!==1){sendJSON(res,409,{error:count()?"Multiple editor tabs: close extras":"Open one editor tab before MCP UI control"});return true;}
     let cmd;
     try{cmd=commands.normalize(JSON.parse((await readBody(req)).toString("utf8")));}
     catch(e){sendJSON(res,400,{error:e.message});return true;}
     const id=crypto.randomUUID();
     const result=await new Promise(resolve=>{
       const timer=setTimeout(()=>{pending.delete(id);resolve({ok:false,error:"No UI acknowledgement"});},3000);
       pending.set(id,{resolve:value=>{clearTimeout(timer);pending.delete(id);resolve(value);}});
       broadcast("mobile-ui",JSON.stringify({id,...cmd}));
     });
     sendJSON(res,result.ok?200:409,result);return true;
   }
   let data;
   try{data=JSON.parse((await readBody(req)).toString("utf8"));}
   catch{sendJSON(res,400,{error:"Invalid acknowledgement"});return true;}
   const pnd=typeof data.id==="string"?pending.get(data.id):null;
   if(!pnd){sendJSON(res,404,{error:"Unknown or expired command"});return true;}
   pnd.resolve({ok:data.ok===true,...(data.ok===true?{applied:true}:{error:String(data.error||"UI command failed").slice(0,200)})});
   sendJSON(res,200,{received:true});return true;
 }
 return {handle};
}
module.exports={create};

