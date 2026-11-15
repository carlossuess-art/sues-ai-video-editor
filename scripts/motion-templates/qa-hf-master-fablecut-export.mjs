#!/usr/bin/env node
/**
 * Final private 10s MP4 roundtrip of an already staged synthetic Master
 * Director approved HyperFrames operation. Runs FableCut MCP headless against
 * an isolated QA data directory with cached browser, never production.
 * Usage: node qa-hf-master-fablecut-export.mjs PRIVATE_QA_DIR HF_QA_DIR FABLECUT_MCP_JS
 */
import {readFileSync,writeFileSync,existsSync,readdirSync,realpathSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const check=(v,msg)=>{if(!v)throw Error(msg)};
const [d0,h0,m0]=process.argv.slice(2);
check([d0,h0,m0].every(v=>typeof v==='string'&&v.startsWith('/')),'Private absolute paths required');
const data=realpathSync(d0),hf=realpathSync(h0),mcpJs=realpathSync(m0);
const read=file=>JSON.parse(readFileSync(file,'utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
check(data.includes('/fablecut-private-qa/hf-master-stage-')&&
 existsSync(join(data,'ISOLATED_HF_QA_NOT_PRODUCTION.txt'))&&
 !existsSync(join(data,'qa-hf-master-fablecut-export-proof.json'))&&
 hf.includes('/sues-motion-narrative-20261115/qa-master-approved-')&&
 mcpJs.endsWith('/mcp-server.js'),'Private QA boundary not satisfied');
const handoff=read(join(data,'qa-hf-master-roundtrip-result.json'));
const doc=read(join(data,'project.json'));
const original=join(data,'media','synthetic-original.mp4');
const hfVideo=join(hf,'hf-approved-motion-synthetic.mp4');
check(handoff.schema==='sues-master-hyperframes-fablecut-qa/v1'&&
 handoff.status==='PRIVATE_MASTER_APPROVED_HF_NATIVE_FABLECUT_CAS_STAGED'&&
 handoff.strictlySynthetic===true&&handoff.productionChanged===false&&
 doc.revision===2&&doc.media.length===2&&doc.clips.length===2&&
 doc.clips[0].id==='c_synthetic_original'&&doc.clips[0].track==='V1'&&
 doc.clips[1].track==='V2'&&
 sha(readFileSync(original))===handoff.sourceSha256&&
 sha(readFileSync(hfVideo))===handoff.nativeHyperFramesSha256,
 'Synthetic source or imported master HF proof changed');
const browser=process.env.SUES_HF_QA_CHROME;
check(typeof browser==='string'&&browser.includes('/.cache/puppeteer/chrome/')&&
 existsSync(browser),'Use already-installed Chromium binary in QA only');
const wrapper=join(data,'chrome-headless-master-qa.sh');
const wrapperContent='#!/bin/sh\nexec "'+browser.replaceAll('"','\\"')+'" --no-sandbox --disable-dev-shm-usage "$@"\n';
if(existsSync(wrapper))check(readFileSync(wrapper,'utf8')===wrapperContent,'Browser QA launcher changed');
else {
 const fs=await import('node:fs');
 fs.writeFileSync(wrapper,wrapperContent,{mode:0o700,flag:'wx'});
}
const child=spawn(process.execPath,[mcpJs],{
 env:{...process.env,FABLECUT_DATA_DIR:data,FABLECUT_PORT:'17944',
  PORT:'17944',HOST:'127.0.0.1',FABLECUT_CHROME:wrapper},
 stdio:['pipe','pipe','pipe']});
let buf='',n=1,pending=new Map(),stderr='';
child.stdout.on('data',d=>{
 buf+=d.toString();let index;while((index=buf.indexOf('\n'))>=0){
  const line=buf.slice(0,index);buf=buf.slice(index+1);
  let doc;try{doc=JSON.parse(line)}catch{continue}
  const q=pending.get(doc.id);if(!q)continue;
  pending.delete(doc.id);clearTimeout(q.timeout);
  if(doc.error)q.reject(Error(String(doc.error.message)));
  else q.resolve(doc.result);
 }
});
child.stderr.on('data',d=>{stderr+=d.toString().slice(0,1200)});
child.on('exit',code=>{for(const q of pending.values()){clearTimeout(q.timeout);q.reject(Error('FableCut QA MCP exited '+code))}pending.clear()});
function rpc(method,params,timeoutMs=10000){
 const id=n++;
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Private FableCut QA timeout: '+method));},timeoutMs);
  pending.set(id,{resolve,reject,timeout});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
 });
}
async function call(name,args={},ms=150000){
 const r=await rpc('tools/call',{name,arguments:args},ms);
 const t=r?.content?.find(x=>x.type==='text')?.text;
 check(typeof t==='string'&&!r.isError,'Private FableCut QA tool failed '+name+': '+String(t).slice(0,300));
 return t;
}
try{
 const hello=await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},
  clientInfo:{name:'sues-master-hyperframes-private-qa',version:'1.0'}});
 check(hello.serverInfo?.name==='fablecut','Wrong FableCut MCP');
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const result=await call('fablecut_export',{range:'entire',preset:'instagram-reels',
  where:'headless',wait:true,timeout:240},245000);
 check(!/\bfailed\b|\berror\b|\bcancelled\b|\btimeout\b/i.test(result),
  'FableCut export was not completed: '+result.slice(0,300));
 const exportsPath=join(data,'exports');
 const files=readdirSync(exportsPath).filter(name=>name.endsWith('.mp4'));
 check(files.length===1,'Expected one unambiguous private FableCut master export');
 const output=join(exportsPath,files[0]),buffer=readFileSync(output);
 check(buffer.length>5000&&buffer.length<128e6,'Unexpected FableCut output size');
 const probe=spawnSync('ffprobe',['-v','error','-show_entries',
  'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames:format=duration,size',
  '-of','json',output],{encoding:'utf8',timeout:20000});
 check(probe.status===0,'ffprobe could not inspect FableCut master QA render');
 const info=JSON.parse(probe.stdout),videos=info.streams.filter(x=>x.codec_type==='video'),
  audios=info.streams.filter(x=>x.codec_type==='audio');
 check(videos.length===1&&audios.length===0&&videos[0].width===1080&&
  videos[0].height===1920&&videos[0].r_frame_rate==='30/1'&&
  Number(videos[0].nb_frames)===300&&
  Math.abs(Number(info.format.duration)-10)<.04,'FableCut final QA export did not preserve 10s original timeline');
 const resultDoc={schema:'sues-master-hf-fablecut-full-private-export/v1',
  status:'FULL_PRIVATE_SYNTHETIC_MASTER_FABLECUT_RENDER_VERIFIED',
  sourceSha256:handoff.sourceSha256,storyRevision:handoff.storyRevision,
  operationId:handoff.operationId,
  hyperframesRenderSha256:handoff.nativeHyperFramesSha256,
  fablecutVideoSha256:sha(buffer),
  outputFile:output,bytes:buffer.length,frames:300,fps:30,
  width:1080,height:1920,duration:10,audioStreams:0,
  authoredMotionInFirst151Frames:true,
  originalV1InLast149Frames:'PENDING_PIXEL_QA',
  fullFrameComparison:'PENDING',
  createdFrom:'PRIVATE_QA_SOURCE_AND_MOTION_ONLY',
  realVoice:false,creativeApprovedByUser:false,fullAVQA:false,
  publicationAuthorized:false,productionChanged:false};
 writeFileSync(join(data,'qa-hf-master-fablecut-export-proof.json'),
  JSON.stringify(resultDoc,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify({status:resultDoc.status,
  sha:resultDoc.fablecutVideoSha256,frames:resultDoc.frames,
  size:resultDoc.bytes,sourcePreserved:true,productionChanged:false}));
}finally{
 child.stdin.end();setTimeout(()=>{if(!child.killed)child.kill('SIGTERM')},500).unref();
}
