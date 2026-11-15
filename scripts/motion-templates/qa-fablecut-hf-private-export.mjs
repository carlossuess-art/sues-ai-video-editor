#!/usr/bin/env node
/**
 * QA-only export test of *already imported* native HyperFrames media in a
 * separated FableCut MCP data directory. Does not touch the active editor.
 *
 * node qa-fablecut-hf-private-export.mjs ISOLATED_DATA_DIR NATIVE_HF_PROOF_JSON
 *  FABLECUT_MCP_SERVER_JS
 *
 * Must run in a bounded transient service to contain Chrome/ffmpeg resources.
 * The result is a technical bridge test, NOT a user Reel or publication.
 */
import {readFileSync,writeFileSync,existsSync,statSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const require0=(condition,msg)=>{if(!condition)throw Error(msg);};
const sha=x=>createHash('sha256').update(x).digest('hex');
const argv=process.argv.slice(2);require0(argv.length===3,'Expected PRIVATE_DATA_DIR NATIVE_PROOF MCP_SERVER');
const [qaDir,proofPath,serverJs]=argv.map(s=>resolve(s));
const marker=join(qaDir,'ISOLATED_HF_QA_NOT_PRODUCTION.txt');
require0(qaDir.includes('/fablecut-private-qa/')&&existsSync(marker),'QA sentinel missing: production blocked');
require0(!existsSync(join(qaDir,'hf-private-export-qa-receipt.json')),'Refuse to overwrite export receipt');
require0(existsSync(serverJs)&&serverJs.endsWith('/mcp-server.js'),'FableCut MCP server missing');
const proof=JSON.parse(readFileSync(proofPath,'utf8'));
require0(proof.status==='TECHNICAL_RENDER_AND_FRAME_ALIGNMENT_VERIFIED'&&!proof.productionChanged,'Not a verified HF native media receipt');
const intake=JSON.parse(readFileSync(join(qaDir,'hf-intake-qa-receipt.json'),'utf8'));
const doc=JSON.parse(readFileSync(join(qaDir,'project.json'),'utf8'));
require0(intake.state==='ISOLATED_NATIVE_MEDIA_IMPORTED_IN_QA_ONLY'&&
 intake.nativeMp4Sha256===proof.renderedFile.sha256&&intake.sourceFingerprint===proof.sourceFingerprint,
 'FableCut import receipt does not match HyperFrames');
require0(doc.clips.length===1&&doc.media.length===1&&doc.width===1080&&doc.height===1920&&doc.fps===30,'FableCut QA project changed');
require0(doc.clips[0].id===intake.clipId&&doc.clips[0].mediaId===intake.mediaId,'FableCut QA clip changed');
require0(sha(readFileSync(join(qaDir,'media',doc.media[0].name)))===proof.renderedFile.sha256,
 'Imported HF media bytes changed');
const child=spawn(process.execPath,[serverJs],{
 env:{...process.env,FABLECUT_DATA_DIR:qaDir,FABLECUT_PORT:'17942',PORT:'17942',HOST:'127.0.0.1'},
 stdio:['pipe','pipe','pipe']});
let serial=1,buf='',pending=new Map(),stderr='';
child.stdout.on('data',b=>{
 buf+=b.toString();let pos;while((pos=buf.indexOf('\n'))>=0){
  const line=buf.slice(0,pos);buf=buf.slice(pos+1);let result;
  try{result=JSON.parse(line)}catch{continue}
  const x=pending.get(result.id);if(!x)continue;
  pending.delete(result.id);clearTimeout(x.timer);
  if(result.error)x.reject(Error(result.error.message));else x.resolve(result.result);
 }
});
child.stderr.on('data',d=>{stderr+=d.toString().slice(0,1500)});
child.on('exit',code=>{for(const v of pending.values()){clearTimeout(v.timer);v.reject(Error('MCP unexpectedly exited '+code))}pending.clear()});
function rpc(method,params,timeoutMs=10000){
 const id=serial++;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{pending.delete(id);reject(Error('MCP timeout: '+method));},timeoutMs);
  pending.set(id,{resolve,reject,timer});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
 });
}
async function tool(name,args={},ms=120000){
 const r=await rpc('tools/call',{name,arguments:args},ms);
 const block=r.content?.find(x=>x.type==='text')?.text;
 require0(typeof block==='string','No MCP tool text response');
 if(r.isError)throw Error(name+' failed: '+block.slice(0,300));
 return block;
}
try{
 const hello=await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},
  clientInfo:{name:'sues-fablecut-native-hf-export-qa',version:'1.0'}});
 require0(hello.serverInfo?.name==='fablecut','Wrong MCP service');
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const result=await tool('fablecut_export',{range:'entire',preset:'instagram-reels',
  where:'headless',wait:true,timeout:125},160000);
 // The FableCut CLI can return an ordinary 'failed' or 'pending' job as a
 // text response. Never conflate it with a completed export.
 require0(!/\bfailed\b|\berror\b|\bcancelled\b|\btimeout\b/i.test(result),'FableCut export did not complete: '+result.slice(0,300));
 const files=readdirSync(join(qaDir,'exports')).filter(f=>f.toLowerCase().endsWith('.mp4'));
 require0(files.length===1,'Expected exactly one isolated FableCut MP4 export, found '+files.length+'; '+result.slice(0,350));
 const path=join(qaDir,'exports',files[0]),output=readFileSync(path),hash=sha(output);
 require0(output.length>5000&&output.length<128*1024*1024,'FableCut QA output size unexpected');
 const ff=spawnSync('ffprobe',['-v','error','-show_entries',
  'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames:format=duration,size','-of','json',path],
  {encoding:'utf8',timeout:25000});
 require0(ff.status===0,'ffprobe of FableCut result failed');
 const info=JSON.parse(ff.stdout),stream=info.streams?.find(x=>x.codec_type==='video');
 require0(stream?.width===1080&&stream?.height===1920,'FableCut QA export dimensions unexpected');
 require0(Math.abs(Number(info.format.duration)-proof.renderedFile.durationSec)<.20,'FableCut QA duration differs');
 const record={schema:'sues-hyperframes-to-fablecut-private-export/v1',
  status:'PRIVATE_HYPERFRAMES_FABLECUT_EXPORT_TECHNICALLY_RENDERED',
  dataDir:qaDir,sourceFingerprint:proof.sourceFingerprint,
  hyperframesNativeSha256:proof.renderedFile.sha256,
  fablecutExportSha256:hash,exportFile:path,exportBytes:output.length,
  fablecutCodec:stream.codec_name,dimensions:[stream.width,stream.height],
  fps:stream.r_frame_rate,frames:stream.nb_frames??null,
  durationSec:Number(info.format.duration),
  fablecutMcpResult:result.slice(0,800),ingestedClipId:intake.clipId,
  internalHFAnimationsEditableOnlyInHyperFrames:true,hasAlphaChannel:false,
  pixelComparisonWithHyperFrames:'PENDING',
  creativeApproved:false,productionChanged:false,publicationAuthorized:false};
 writeFileSync(join(qaDir,'hf-private-export-qa-receipt.json'),JSON.stringify(record,null,2)+'\n',
  {mode:0o600,flag:'wx'});
 console.log(JSON.stringify({status:record.status,sha256:hash,frames:record.frames,
  codec:record.fablecutCodec,durationSec:record.durationSec,output:files[0],productionChanged:false}));
}finally{
 child.stdin.end();setTimeout(()=>{if(!child.killed)child.kill('SIGTERM')},500).unref();
}
