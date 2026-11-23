/** Read-only full-window export QA vs three timestamp-bound real FableCut canvas captures.
 * Usage: node scripts/engine-next/audit-native-range-parity.mjs \
 * /absolute/export.mp4 /absolute/reference-directory /absolute/native-export-job.json /absolute/new-report.json
 * Required refs: native-softedge-10.png, native-softedge-11_5.png, native-softedge-13.png
 */
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
import {parseSsim} from '../../src/engine-next/frame-audit.js';
import {summarizeDecodedFrameHashes} from '../../src/engine-next/export-parity-audit.js';
import {assessNativeRangeParity} from '../../src/engine-next/native-range-parity.js';
const [video,refs,jobFile,out]=process.argv.slice(2);
if(![video,refs,jobFile,out].every(p=>typeof p==='string'&&path.isAbsolute(p)))throw Error('Four absolute paths required');
if(await fs.stat(out).then(()=>true).catch(()=>false))throw Error('Refusing to overwrite audit');
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{encoding:'utf8',timeout:120000,maxBuffer:3000000});if(r.status!==0)throw Error(`${cmd} failed: ${r.stderr?.slice(-500)}`);return r;};
const probe=JSON.parse(run('/usr/bin/ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_frames','-of','json',video]).stdout).streams?.[0];
if(probe?.codec_name!=='h264'||probe.width!==1080||probe.height!==1920||probe.r_frame_rate!=='30/1'||Number(probe.nb_frames)!==120)throw Error('Not a full 120-frame 1080x1920 native export');
const job=JSON.parse(await fs.readFile(jobFile,'utf8'));
if(job.status!=='done'||!job.result?.outputs?.[0]?.report)throw Error('FableCut native export job not completed');
const audioReport=job.result.outputs[0].report;
const hashes=summarizeDecodedFrameHashes(run('/usr/bin/ffmpeg',['-v','error','-i',video,'-map','0:v:0','-f','framemd5','-']).stdout,{expectedFrames:120});
const sha=async p=>createHash('sha256').update(await fs.readFile(p)).digest('hex');
const ssims=[];
for(const [time,suffix] of [[10,'10'],[11.5,'11_5'],[13,'13']]){
 const ref=path.join(refs,`native-softedge-${suffix}.png`);
 const frame=path.join(path.dirname(out),`.native-export-${suffix}-${process.pid}.png`);
 try{
  const info=JSON.parse(run('/usr/bin/ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',ref]).stdout).streams?.[0];if(info?.width!==1080||info?.height!==1920)throw Error('Reference not native 1080x1920');
  run('/usr/bin/ffmpeg',['-v','error','-ss',String(time-9.5),'-i',video,'-frames:v','1','-y',frame]);
  const all=parseSsim(run('/usr/bin/ffmpeg',['-hide_banner','-i',ref,'-i',frame,'-lavfi','[0:v][1:v]ssim','-f','null','-']).stderr).all;
  ssims.push({time,all,nativeFrameSha256:await sha(ref),exportFrameSha256:await sha(frame)});
 }finally{await fs.unlink(frame).catch(()=>{});}
}
const analysis=assessNativeRangeParity({fps:30,frames:120,start:9.5,ssimSamples:ssims,decodedFrameEvidence:hashes,exportAudioReport:audioReport});
const data={...analysis,exportSha256:await sha(video),ssimSamples:ssims,rawExportReport:audioReport};await fs.writeFile(out,JSON.stringify(data,null,2));console.log(JSON.stringify({report:out,analysis,ssims}));
