#!/usr/bin/env node
/** Export the REAL V18 Reel + proposed HyperFrames clip only in isolated QA.
 * No production, publication, creative approvals or real-Reel execution grants.
 * Run under a bounded transient systemd unit with FABLECUT_CHROME wrapper.
 */
import {readFileSync,writeFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const dir='/opt/sues-video-setup/motion-narrative-review-20261115/fablecut-private-qa/reel-20261110-v18-hf';
const mcp='/srv/sues-fablecut-next/app/mcp-server.js';
const assert=(v,s)=>{if(!v)throw Error(s)};
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
assert(existsSync(join(dir,'ISOLATED_HF_QA_NOT_PRODUCTION.txt'))&&
 !existsSync(join(dir,'qa-hf-v18-preview-export.json')),'Private export already completed or unsafe');
const proof=read(join(dir,'qa-hf-v18-real-reel-intake.json'));
const project=read(join(dir,'project.json'));
assert(proof.status==='REAL_REEL_SOURCE_SYNCHRONIZED_PRIVATE_FABLECUT_CLONE_PATCHED'&&
 proof.creativeApproved===false&&proof.productionChanged===false&&
 proof.originalClipsPreserved===165&&proof.originalMediaPreserved===49&&
 project.revision===24&&project.clips.length===166&&project.media.length===50&&
 project.inPoint===49.6&&Math.abs(project.outPoint-1639/30)<1e-5,
 'QA CAS reel source or range changed');
const chrome=process.env.SUES_HF_QA_CHROME;
assert(typeof chrome==='string'&&chrome.includes('/.cache/puppeteer/chrome/')&&
 existsSync(chrome),'QA cached Chromium unavailable');
const wrapper=join(dir,'chrome-headless-hf-real-qa.sh');
const wrapperContent='#!/bin/sh\nexec "'+chrome.replaceAll('"','\\"')+'" --no-sandbox --disable-dev-shm-usage "$@"\n';
if(!existsSync(wrapper))writeFileSync(wrapper,wrapperContent,{mode:0o700,flag:'wx'});
else assert(readFileSync(wrapper,'utf8')===wrapperContent,'QA browser wrapper changed');
const child=spawn(process.execPath,[mcp],{
 env:{...process.env,FABLECUT_DATA_DIR:dir,FABLECUT_PORT:'17948',PORT:'17948',
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
  capabilities:{},clientInfo:{name:'sues-real-reel-v18-hf-private-preview',version:'1'}});
 assert(hello?.serverInfo?.name==='fablecut','Not FableCut MCP');
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const result=await call('fablecut_export',{range:'in-out',preset:'instagram-reels',
  where:'headless',wait:true,timeout:240},248000);
 assert(!/\bfailed\b|\berror\b|\bcancelled\b|\btimeout\b/i.test(result),
  'FableCut QA export did not finish: '+result.slice(0,250));
 const outdir=join(dir,'exports');
 const mp4=readdirSync(outdir).filter(f=>f.toLowerCase().endsWith('.mp4'));
 // V18 clone contains one existing full-length preview from the source clone.
 // New shorter file must be identified by metadata, never assumed by name.
 const candidates=mp4.map(name=>{
  const filename=join(outdir,name),info=spawnSync('ffprobe',['-v','error',
   '-show_entries','format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames',
   '-of','json',filename],{encoding:'utf8',timeout:15000});
  if(info.status!==0)return null;
  const probe=JSON.parse(info.stdout),v=probe.streams?.find(s=>s.codec_type==='video');
  return {name,filename,duration:Number(probe.format.duration),v,
   hasAudio:probe.streams?.some(s=>s.codec_type==='audio')};
 }).filter(Boolean).filter(x=>x.duration>4.9&&x.duration<5.2);
 assert(candidates.length===1,'Expected one unambiguous 5s V18 private FableCut export');
 const out=candidates[0],data=readFileSync(out.filename);
 assert(data.length>8000&&data.length<128e6&&out.v.width===1080&&out.v.height===1920&&
  out.v.r_frame_rate==='30/1'&&out.v.nb_frames==='151'&&out.hasAudio===true,
  'V18 HF private clip did not preserve 1080x1920/30fps/151f+voice');
 const state=read(join(dir,'project.json'));
 assert(state.clips.some(c=>c.id===proof.clipId&&c.track==='V9')&&
  state.clips.filter(c=>c.id!==proof.clipId).length===165,
  'QA Reels clips missing after export');
 const receipt={schema:'sues-hf-real-reel-v18-private-preview/v1',
  status:'REAL_V18_PRIVATE_5S_HF_PREVIEW_TECHNICALLY_EXPORTED',
  originalSourceSha256:proof.originalFileSha256,
  originalProjectSha256:proof.originalV18ProjectSha256,
  motionSha256:proof.motionSha256,
  exportedMp4Sha256:sha(data),exportFile:out.filename,
  exportedDurationSec:out.duration,frames:151,fps:30,
  dimensions:[1080,1920],audioStreamPresent:true,
  originalClipCount:165,extraQaClipId:proof.clipId,
  graphicsCollisions:proof.existingUpperGraphicsOverlaps,
  creativeQAStatus:'BLOCKED_7_GRAPHIC_OVERLAPS_NEED_REVIEW',
  userCreativeApproval:false,fullAVQA:false,
  published:false,publicationAuthorized:false,productionChanged:false};
 writeFileSync(join(dir,'qa-hf-v18-preview-export.json'),
  JSON.stringify(receipt,null,2)+'\n',{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({status:receipt.status,sha:receipt.exportedMp4Sha256,
  frames:151,voice:true,graphicOverlaps:receipt.graphicsCollisions.length,
  creativeApproval:false,productionChanged:false}));
}finally{child.stdin.end();setTimeout(()=>{if(!child.killed)child.kill('SIGTERM')},500).unref();}
