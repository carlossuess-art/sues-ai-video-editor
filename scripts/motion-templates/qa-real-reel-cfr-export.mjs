#!/usr/bin/env node
/** SUES · User's actual uploaded 2026-11-10 59.896s source, PRIVATE 17s
 * HyperFrames/FableCut QA only. Never deploy, approve or publish a Reel.
 * Required FableCut QA project: original video V1 + original voice A1 +
 * provisional ASR-bound HyperFrames scene V2, single CAS revision.
 */
import {readFileSync,writeFileSync,existsSync,readdirSync,realpathSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const die=(v,msg)=>{if(!v)throw Error(msg)};
const sha=data=>createHash('sha256').update(data).digest('hex');
const [d0,m0]=process.argv.slice(2);
die(typeof d0==='string'&&d0.startsWith('/')&&typeof m0==='string'&&m0.startsWith('/'),
 'Private absolute paths required');
const data=realpathSync(d0),server=realpathSync(m0);
die(data.includes('/fablecut-private-qa/reel-20261110-hf-cfr-qa')&&
 server.endsWith('/mcp-server.js')&&
 existsSync(join(data,'ISOLATED_HF_QA_NOT_PRODUCTION.txt')),
 'NO LIVE FABLECUT PROJECT ACCESS');
const receiptFile=join(data,'qa-real-reel-hf-cfr-export-receipt.json');
die(!existsSync(receiptFile),'Cannot overwrite/export the same QA project twice');
const src=JSON.parse(readFileSync(join(data,'cfr-hf-mcp-qa-receipt.json'),'utf8'));
const doc=JSON.parse(readFileSync(join(data,'project.json'),'utf8'));
die(src.status==='REAL_SOURCE_CFR30_HF_FABLECUT_MCP_COMMIT'&&
 src.productionChanged===false&&src.creativeUserApproval===false&&
 doc.revision===1&&doc.media.length===3&&doc.clips.length===3&&
 doc.clips.map(x=>x.track).join(',')==='V1,A1,V2'&&
 src.derivedCfr17sSha256===sha(readFileSync(join(data,'media','original-cfr-17s.mp4')))&&
 src.hfRenderSha256===sha(readFileSync(join(data,'media','hf-last-reel-motion-QA.mp4'))),
 'Original Reel QA source/final motion changed');
const chrome=process.env.SUES_QA_CHROME;
die(typeof chrome==='string'&&chrome.startsWith('/root/.cache/puppeteer/chrome/')&&
 existsSync(chrome),'Cached Chrome required for bounded private render');
const wrapper=join(data,'chrome-hf-real-qa.sh');
const text='#!/bin/sh\nexec "'+chrome.replaceAll('"','\\"')+
 '" --no-sandbox --disable-dev-shm-usage "$@"\n';
if(existsSync(wrapper))die(readFileSync(wrapper,'utf8')===text,'QA Chrome wrapper changed');
else writeFileSync(wrapper,text,{mode:0o700,flag:'wx'});
const child=spawn(process.execPath,[server],{
 env:{...process.env,FABLECUT_DATA_DIR:data,FABLECUT_PORT:'17947',
  PORT:'17947',HOST:'127.0.0.1',FABLECUT_CHROME:wrapper},
 stdio:['pipe','pipe','pipe']});
let buf='',serial=1,waiting=new Map(),stderr='';
child.stdout.on('data',part=>{
 buf+=part.toString();let idx;while((idx=buf.indexOf('\n'))>=0){
  const line=buf.slice(0,idx);buf=buf.slice(idx+1);
  let packet;try{packet=JSON.parse(line)}catch{continue}
  const obj=waiting.get(packet.id);if(!obj)continue;
  waiting.delete(packet.id);clearTimeout(obj.timer);
  if(packet.error)obj.reject(Error(packet.error.message));else obj.resolve(packet.result);
 }
});
child.stderr.on('data',chunk=>{stderr+=chunk.toString().slice(0,1800)});
child.on('exit',code=>{
 for(const x of waiting.values()){clearTimeout(x.timer);x.reject(Error('MCP exited: '+code))}
 waiting.clear();
});
function rpc(method,params,timeoutMs=10000){
 const id=serial++;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{waiting.delete(id);reject(Error('QA MCP timeout '+method));},timeoutMs);
  waiting.set(id,{resolve,reject,timer});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
 });
}
async function tool(name,args,ms){
 const result=await rpc('tools/call',{name,arguments:args},ms);
 const out=result?.content?.find(x=>x.type==='text')?.text;
 die(typeof out==='string'&&!result.isError,name+' failed: '+String(out).slice(0,320));
 return out;
}
try{
 const hello=await rpc('initialize',{protocolVersion:'2025-11-25',
  capabilities:{},clientInfo:{name:'sues-last-real-reel-private-qa',version:'1.0'}});
 die(hello?.serverInfo?.name==='fablecut','Wrong native editor');
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const status=await tool('fablecut_export',
  {range:'entire',preset:'instagram-reels',where:'headless',wait:true,timeout:360},375000);
 die(!/\bfailed\b|\berror\b|\bcancelled\b|\btimeout\b/i.test(status),
  'FableCut did not complete private render '+status.slice(0,250));
 const outputs=readdirSync(join(data,'exports')).filter(name=>name.endsWith('.mp4'));
 die(outputs.length===1,'Need ONE unambiguous MP4 export');
 const file=join(data,'exports',outputs[0]),bytes=readFileSync(file);
 die(bytes.length>5000&&bytes.length<150e6,'Unexpected QA render size');
 const ff=spawnSync('ffprobe',['-v','error','-show_entries',
  'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration,size',
  '-of','json',file],{encoding:'utf8',timeout:20000});
 die(ff.status===0,'QA render ffprobe failed');
 const media=JSON.parse(ff.stdout),
  video=media.streams.filter(s=>s.codec_type==='video'),
  audio=media.streams.filter(s=>s.codec_type==='audio');
 die(video.length===1&&video[0].codec_name==='h264'&&video[0].width===1080&&
  video[0].height===1920&&video[0].r_frame_rate==='30/1'&&
  Number(video[0].nb_frames)===510&&Math.abs(Number(media.format.duration)-17)<.1,
  '17-second 510-frame original Reel QA render missing');
 const receipt={schema:'sues-private-real-reel-17s-cfr-hf-export/v1',
  status:audio.length===1?'REAL_SOURCE_HF_FABLECUT_VIDEO_AND_AUDIO_EXPORTED':
   'REAL_SOURCE_HF_FABLECUT_VIDEO_EXPORTED_AUDIO_MISSING',
  originalSha256:src.originalSha256,derivedCfr17sSha256:src.derivedCfr17sSha256,hyperframesSha256:src.hfRenderSha256,
  finalMp4Sha256:sha(bytes),outputFile:file,
  originalVideoDuration:59.896067,qaDurationSec:Number(media.format.duration),
  renderedFrames:Number(video[0].nb_frames),fps:30,width:1080,height:1920,
  hasAudio:audio.length===1,audioCodec:audio[0]?.codec_name??null,
  audioChannels:audio[0]?.channels??null,
  sourceTrack:'V1',voiceTrack:'A1',graphicsTrack:'V2',sourceTimeSpace:'raw-to-cfr30 no cuts',
  temporaryProvisionalWordSync:true,asrHumanReviewed:false,
  sourceMediaUnmodified:true,editorProductionModified:false,
  humanCreativeApproval:false,publicationAuthorized:false,
  fullVideoReviewed:false,fullAudioReviewed:false};
 writeFileSync(receiptFile,JSON.stringify(receipt,null,2)+'\n',
  {mode:0o600,flag:'wx'});
 console.log(JSON.stringify({status:receipt.status,videoSha256:receipt.finalMp4Sha256,
  frames:receipt.renderedFrames,audio:receipt.hasAudio,duration:receipt.qaDurationSec,
  originalSha256:receipt.originalSha256,productionModified:false}));
}finally{
 child.stdin.end();
 setTimeout(()=>{if(!child.killed)child.kill('SIGTERM')},500).unref();
}
