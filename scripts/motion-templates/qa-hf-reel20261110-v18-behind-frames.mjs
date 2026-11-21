#!/usr/bin/env node
/** Export the REAL V18 Reel + proposed HyperFrames clip only in isolated QA.
 * No production, publication, creative approvals or real-Reel execution grants.
 * Run under a bounded transient systemd unit with FABLECUT_CHROME wrapper.
 */
import {readFileSync,writeFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const dir='/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/reel-20261110-v18-hf-behind';
const mcp='/srv/sues-fablecut-next/app/mcp-server.js';
const assert=(v,s)=>{if(!v)throw Error(s)};
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
assert(existsSync(join(dir,'ISOLATED_HF_QA_NOT_PRODUCTION.txt'))&&
 !existsSync(join(dir,'qa-hf-v18-behind-frame-qa.json')),'Private export already completed or unsafe');
const proof=read(join(dir,'qa-hf-v18-real-reel-intake.json'));
const project=read(join(dir,'project.json'));
assert(proof.status==='REAL_REEL_SOURCE_SYNCHRONIZED_PRIVATE_FABLECUT_CLONE_PATCHED'&&
 proof.creativeApproved===false&&proof.productionChanged===false&&
 proof.originalClipsPreserved===165&&proof.originalMediaPreserved===49&&
 project.revision===30&&project.clips.length===166&&project.media.length===50&&
 project.inPoint===49.6&&Math.abs(project.outPoint-1639/30)<1e-5,
 'QA CAS reel source or range changed');
const chrome=process.env.SUES_HF_QA_CHROME;
assert(typeof chrome==='string'&&chrome.includes('/.cache/puppeteer/chrome/')&&
 existsSync(chrome),'QA cached Chromium unavailable');
const wrapper=join(dir,'chrome-headless-hf-real-behind-qa.sh');
const wrapperContent='#!/bin/sh\nexec "'+chrome.replaceAll('"','\\"')+'" --no-sandbox --disable-dev-shm-usage "$@"\n';
if(!existsSync(wrapper))writeFileSync(wrapper,wrapperContent,{mode:0o700,flag:'wx'});
else assert(readFileSync(wrapper,'utf8')===wrapperContent,'QA browser wrapper changed');
const child=spawn(process.execPath,[mcp],{
 env:{...process.env,FABLECUT_DATA_DIR:dir,FABLECUT_PORT:'17950',PORT:'17950',
  HOST:'127.0.0.1',FABLECUT_CHROME:wrapper},stdio:['pipe','pipe','pipe']});
let buffer='',serial=1,pending=new Map(),stderr='';
child.stdout.on('data',b=>{buffer+=b.toString();let i;while((i=buffer.indexOf('\n'))>=0){
 const line=buffer.slice(0,i);buffer=buffer.slice(i+1);let doc;try{doc=JSON.parse(line)}catch{continue}
 const x=pending.get(doc.id);if(!x)continue;pending.delete(doc.id);clearTimeout(x.timer);
 if(doc.error)x.reject(Error(String(doc.error.message)));else x.resolve(doc.result);
}});
child.stderr.on('data',b=>{stderr+=b.toString().slice(0,900)});
child.on('exit',code=>{for(const x of pending.values()){clearTimeout(x.timer);x.reject(Error('QA FableCut server exited '+code))}pending.clear()});
function rpc(method,params,ms=25000){const id=serial++;return new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>{pending.delete(id);reject(Error('MCP QA timeout '+method))},ms);
 pending.set(id,{resolve,reject,timer});
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
})}
async function call(name,args={},ms=240000){
 const r=await rpc('tools/call',{name,arguments:args},ms),s=r?.content?.find(x=>x.type==='text')?.text;
 assert(typeof s==='string'&&!r.isError,'FableCut QA error '+name+': '+String(s).slice(0,340));
 return s;
}
try{
 const hello=await rpc('initialize',{protocolVersion:'2025-11-25',
  capabilities:{},clientInfo:{name:'sues-real-reel-v18-behind-qa-frame',version:'1'}});
 assert(hello.serverInfo?.name==='fablecut','Wrong MCP');
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const seen=[];
 for(const sample of [{time:50.00,id:'f1500'},{time:53.30,id:'f1533'}]){
  const result=await rpc('tools/call',{name:'fablecut_frame',
   arguments:{time:sample.time,where:'headless',timeout:105}},130000);
  assert(!result?.isError,'FableCut screenshot error '+String(result?.content?.[0]?.text));
  const info=result?.content?.find(x=>x.type==='text')?.text??'';
  const img=result?.content?.find(x=>x.type==='image');
  assert(img&&typeof img.data==='string'&&img.data.length>100&&
   (img.mimeType==='image/png'||img.mimeType==='image/jpeg'),
   'No authentic FableCut composited frame');
  const bytes=Buffer.from(img.data,'base64'),suffix=img.mimeType==='image/jpeg'?'.jpg':'.png';
  const file=join(dir,'qa-hf-v18-behind-'+sample.id+suffix);
  writeFileSync(file,bytes,{flag:'wx',mode:0o600});
  seen.push({atEditSeconds:sample.time,file,mediaType:img.mimeType,
   bytes:bytes.length,sha256:sha(bytes),description:info.slice(0,1200)});
 }
 writeFileSync(join(dir,'qa-hf-v18-behind-frame-qa.json'),
  JSON.stringify({schema:'sues-fablecut-real-reel-behind-frame-qa/v1',
   status:'TWO_REAL_COMPOSITOR_FRAMES_CAPTURED',
   reelUnapproved:true,originalUntouched:true,visualApproval:false,
   sampledFrames:seen},null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({status:'TWO_REAL_COMPOSITOR_FRAMES_CAPTURED',frames:seen.map(f=>({
  time:f.atEditSeconds,file:f.file,sha:f.sha256,bytes:f.bytes})),
  creativeApproved:false,productionChanged:false}));
}finally{
 child.stdin.end();setTimeout(()=>{if(!child.killed)child.kill('SIGTERM')},500).unref();
}
