// Offline, single-use private inventory task. No network, provider calls or media modifications.
import {lstatSync,readFileSync,writeFileSync,openSync,closeSync,fsyncSync,readSync,fstatSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {parseTemporalFFmpeg,round3} from '../src/scene-temporal-qa.js';
const root=resolve(process.argv[2]??'');
if(!root.endsWith('/jobs')||lstatSync(root).isSymbolicLink())throw Error('Expect verified jobs root');
const lib=join(root,'library'),assets=join(root,'assets'),manifest=join(lib,'asset-temporal-audit-v1.json');
if(lstatSync(lib).isSymbolicLink()||lstatSync(assets).isSymbolicLink())throw Error('Unsafe asset root');
const reviewPath=join(lib,'asset-visual-review-v1.json');
if(lstatSync(reviewPath).isSymbolicLink())throw Error('Unsafe visual manifest');
const review=JSON.parse(readFileSync(reviewPath,'utf8'));
if(review.schema!=='sues-asset-visual-review/v1'||!Array.isArray(review.items))throw Error('No reviewed inventory');
const entries=[];
for(const row of review.items){
 const id=row.assetId;
 if(!/^[a-f0-9]{64}$/.test(id)||!Array.isArray(row.sceneTags)||!row.sceneTags.length)continue;
 const file=join(assets,id+'.media'),info=lstatSync(file);
 if(info.isSymbolicLink()||!info.isFile()||info.size>40*1024*1024)throw Error('Untrusted media');
 // Verify content address before FFmpeg inspection.
 const h=createHash('sha256'),fd=openSync(file,'r'),buf=Buffer.alloc(1024*1024);
 try{let n;while((n=readSync(fd,buf,0,buf.length,null))>0)h.update(buf.subarray(0,n));}finally{closeSync(fd);}
 if(h.digest('hex')!==id)throw Error('Asset hash mismatch');
 const probe=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,nb_frames:format=duration','-of','json',file],{encoding:'utf8',timeout:15000,maxBuffer:1024*1024});
 if(probe.status!==0)throw Error('Probe failed');
 const data=JSON.parse(probe.stdout),duration=Number(data.format?.duration);
 if(!Number.isFinite(duration)||duration<1||duration>60)throw Error('Unexpected duration');
 const video=data.streams?.find(x=>x.codec_type==='video');
 const fpsFrames=Number(video?.nb_frames)||Math.round(duration*30);
 const args=['-nostdin','-hide_banner','-loglevel','info','-threads','1','-i',file,
  '-vf',"blackdetect=d=0.3:pix_th=0.07:pic_th=0.96,freezedetect=n=-55dB:d=1.2,select='gt(scene,0.36)',showinfo",
  '-an','-f','null','-'];
 const run=spawnSync('ffmpeg',args,{encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});
 if(run.status!==0)throw Error('Full-duration FFmpeg scan failed');
 const measured=parseTemporalFFmpeg(run.stderr,duration);
 entries.push({assetId:id,sha256:id,scope:'ffmpeg-full-duration-technical',complete:true,
  durationSec:round3(duration),videoFrames:fpsFrames,...measured});
 console.log('AUDITED',id.slice(0,12),'sec',round3(duration),'cuts',measured.sceneCutTimes.length,
  'black',measured.blackIntervals.length,'freeze',measured.freezeIntervals.length);
}
if(entries.length<1)throw Error('No eligible scene assets');
const payload=JSON.stringify({schema:'sues-broll-temporal-audit/v1',entries},null,2)+'\n';
// Exclusive create: safe by default; versioning/backup managed outside this tool.
const fd=openSync(manifest,'wx',0o600);
try{writeFileSync(fd,payload);fsyncSync(fd);}finally{closeSync(fd);}
console.log('AUDIT_MANIFEST',entries.length,manifest);
