/** Offline first-frame preview/export comparison; no production writes.
 * node scripts/engine-next/audit-native-export-parity.mjs /absolute/export.mp4 /absolute/native-0.png /absolute/new-report.json 15
 */
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {parseSsim} from '../../src/engine-next/frame-audit.js';
import {checkExportParityEvidence,summarizeDecodedFrameHashes} from '../../src/engine-next/export-parity-audit.js';
const [video,reference,out,framesStr]=process.argv.slice(2),frames=Number(framesStr);
if(![video,reference,out].every(s=>typeof s==='string'&&path.isAbsolute(s))||!Number.isInteger(frames)||frames<1)throw Error('Absolute input and output paths, positive integer frame count required');
if(await fs.stat(out).then(()=>true).catch(()=>false))throw Error('Report already exists');
const run=(program,args)=>{const p=spawnSync(program,args,{encoding:'utf8',timeout:70000,maxBuffer:1500000});if(p.status!==0)throw Error(`${program} error: ${p.stderr?.slice(-300)}`);return p;};
const info=JSON.parse(run('/usr/bin/ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_frames','-of','json',video]).stdout).streams?.[0];
const ref=JSON.parse(run('/usr/bin/ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',reference]).stdout).streams?.[0];
if(ref?.width!==1080||ref?.height!==1920)throw Error('Native still is not full-resolution');
const extract=path.join(path.dirname(out),'.export-parity-first-'+process.pid+'.png');
try{
 run('/usr/bin/ffmpeg',['-hide_banner','-v','error','-i',video,'-frames:v','1','-y',extract]);
 const ssim=parseSsim(run('/usr/bin/ffmpeg',['-hide_banner','-i',reference,'-i',extract,'-lavfi','[0:v][1:v]ssim','-f','null','-']).stderr);
 const evidence=checkExportParityEvidence({video:info,ssim,expectedFrames:frames});
 const hashes=run('/usr/bin/ffmpeg',['-hide_banner','-v','error','-i',video,'-map','0:v:0','-f','framemd5','-']).stdout;
 const decodedFrameEvidence=summarizeDecodedFrameHashes(hashes,{expectedFrames:frames});
 const sha=async p=>createHash('sha256').update(await fs.readFile(p)).digest('hex');
 const report={...evidence,decodedFrameEvidence,exportSha256:await sha(video),nativeFrameSha256:await sha(reference),comparedFrameSha256:await sha(extract)};
 await fs.writeFile(out,JSON.stringify(report,null,2));console.log(JSON.stringify({report:out,...report}));
}finally{await fs.unlink(extract).catch(()=>{});}