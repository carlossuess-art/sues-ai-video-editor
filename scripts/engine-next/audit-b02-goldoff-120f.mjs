/** Read-only native QA: B02 full four-second isolated FableCut gold-off scene.
 * Inputs: native export mp4, dir with three true 1080x1920 FableCut canvas
 * PNGs named B02-goldoff-canvas-10.png, -11_5.png, -13.png,
 * FableCut export job JSON (wrapper or raw), native project JSON, new QA report.
 * Does not confer artistic approval, perform export, or modify any source file.
 */
import fs from 'node:fs/promises';import path from 'node:path';
import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {parseSsim} from '../../src/engine-next/frame-audit.js';
import {summarizeDecodedFrameHashes} from '../../src/engine-next/export-parity-audit.js';
import {checkB02FullWindowInputs} from '../../src/engine-next/native-b02-full-window-gate.js';
const [video,referenceDir,jobFile,projectFile,outFile]=process.argv.slice(2);
const abs=x=>typeof x==='string'&&path.isAbsolute(x);
if(![video,referenceDir,jobFile,projectFile,outFile].every(abs))throw Error('Provide 5 absolute paths: video referenceDir job project newReport');
if(await fs.stat(outFile).then(()=>true).catch(()=>false))throw Error('Refusing to replace existing QA report');
const run=(cmd,args,{timeout=120000}={})=>{
 const r=spawnSync(cmd,args,{encoding:'utf8',timeout,maxBuffer:4000000});
 if(r.status!==0)throw Error('QA command failed: '+(r.stderr||'').slice(-450));return r;
};
const sha=async p=>createHash('sha256').update(await fs.readFile(p)).digest('hex');
const streams=JSON.parse(run('/usr/bin/ffprobe',['-v','error','-count_frames','-show_entries','stream=index,codec_type,codec_name,width,height,nb_read_frames,avg_frame_rate,duration,sample_rate,channels','-of','json',video]).stdout).streams||[];
const v=streams.find(s=>s.codec_type==='video'),audio=streams.find(s=>s.codec_type==='audio');
const hashes=summarizeDecodedFrameHashes(run('/usr/bin/ffmpeg',['-v','error','-i',video,'-map','0:v:0','-f','framemd5','-'],{timeout:300000}).stdout,{expectedFrames:120});
const refs=[];for(const [time,frameIdx,name] of [[10,15,'10'],[11.5,60,'11_5'],[13,105,'13']]){
 const src=path.join(referenceDir,`B02-goldoff-canvas-${name}.png`);
 const meta=JSON.parse(run('/usr/bin/ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',src]).stdout).streams?.[0];
 if(meta?.width!==1080||meta?.height!==1920)throw Error('Reference must be native 1080x1920: '+name);
 const frame=path.join(path.dirname(outFile),`.b02-goldoff-export-index-${frameIdx}-audit-${process.pid}.png`);
 try{
  run('/usr/bin/ffmpeg',['-v','error','-i',video,'-vf',`select=eq(n\\,${frameIdx})`,'-vsync','0','-frames:v','1','-y',frame]);
  const result=run('/usr/bin/ffmpeg',['-hide_banner','-i',src,'-i',frame,'-lavfi','[0:v]format=gbrp[a];[1:v]format=gbrp[b];[a][b]ssim','-f','null','-']);
  refs.push({time,all:parseSsim(result.stderr).all,nativeFrameSha256:await sha(src),exportFrameSha256:await sha(frame),exportFrameIndex:frameIdx});
 }finally{await fs.unlink(frame).catch(()=>{});}
}
const [project,job]=await Promise.all([fs.readFile(projectFile,'utf8').then(JSON.parse),fs.readFile(jobFile,'utf8').then(JSON.parse)]);
const result=checkB02FullWindowInputs({project,job,video:v,audio,hashes,refs});
const report={...result,nativeProjectName:project.name,mp4Sha256:await sha(video),mp4Bytes:(await fs.stat(video)).size,frameHashes:hashes,previewExportSamples:refs,
 privacy:'LOCAL_QA_ONLY',artisticApproval:false,sourceEdited:false,limitations:['All 120 decoded hashes audited but just 3 native program canvases compared','Visual/audio perceptual approval still needs Carlos and full QA pass']};
await fs.writeFile(outFile,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({report:outFile,status:report.status,technicalChecksPassed:report.technicalChecksPassed,mp4Sha256:report.mp4Sha256,frameCount:hashes.decodedFrames,uniqueFrames:hashes.distinctFrames,ssimMin:report.ssimMinimum}));
if(!report.technicalChecksPassed)process.exitCode=2;
