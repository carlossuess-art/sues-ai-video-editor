import {fontFiles} from './font-kits.js';
import {existsSync,readFileSync,writeFileSync,openSync,closeSync,statSync,readSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileSha256,RENDER_SCRIPT} from './local-pipeline.js';
const assert=(ok,message)=>{if(!ok)throw new Error(`Render worker: ${message}`);};
export function bundleDigest(directory){
 const manifest=JSON.parse(readFileSync(join(directory,'manifest.json'),'utf8'));
 const files=['manifest.json','director.json','settings.json','preparation.json','captions.ass','filter.ffscript',...['camera.ffscript','video.ffscript','audio.ffscript'].filter(name=>existsSync(join(directory,name))),...fontFiles(manifest.policy.captions.font).map(f=>'fonts/'+f)];
 return createHash('sha256').update(JSON.stringify(files.map(name=>[name,fileSha256(join(directory,name))]))).digest('hex');
}
export function validateRenderRequest(request){
 assert(request?.version==='1.0'&&request.provider==='local-ffmpeg','request version/provider');
 assert(typeof request.jobId==='string'&&/^[a-f0-9-]{36}$/.test(request.jobId),'job id');
 assert(Number.isInteger(request.attempt)&&request.attempt>0,'attempt');
 for(const key of ['fingerprint','bundleDigest','sourceSha256'])assert(/^[a-f0-9]{64}$/.test(request[key]),key);
 for(const key of ['source','bundle','output','log'])assert(typeof request[key]==='string'&&request[key].startsWith('/')&&!request[key].includes('\0'),key);
 assert(request.output!==request.source,'distinct output');
 assert(Number.isFinite(request.duration)&&request.duration>0,'duration');return true;
}
export function startLocalRender(request,{renderer=RENDER_SCRIPT}={}){
 validateRenderRequest(request);
 assert(bundleDigest(request.bundle)===request.bundleDigest,'bundle changed before launch');
 assert(fileSha256(request.source)===request.sourceSha256,'source changed before launch');
 writeFileSync(join(dirname(request.output),'render-request.json'),JSON.stringify(request,null,2)+'\n',{flag:'wx',mode:0o600});
 const fd=openSync(request.log,'wx',0o600);
 try{return spawn('python3',[renderer,'--source',request.source,'--bundle',request.bundle,'--out',request.output],{detached:true,stdio:['ignore',fd,fd]});}finally{closeSync(fd);}
}
export function validateRenderResult(request){
 validateRenderRequest(request);
 const audit=JSON.parse(readFileSync(request.output.replace(/\.mp4$/,'.audit.json'),'utf8')),stat=statSync(request.output);
 assert(stat.isFile()&&stat.size>8,'output file missing/empty');
 const fd=openSync(request.output,'r'),signature=Buffer.alloc(8);try{assert(readSync(fd,signature,0,8,0)===8&&signature.toString('ascii',4,8)==='ftyp','MP4 signature');}finally{closeSync(fd);}
 assert(audit.version==='1.0'&&audit.sourcePreserved===true&&audit.fullDecode==='pass'&&audit.audioPresent===true,'audit incomplete');
 assert(audit.sourceSha256===request.sourceSha256,'source audit mismatch');
 assert(audit.bytes===stat.size&&audit.outputSha256===fileSha256(request.output),'output checksum/size mismatch');
 assert(audit.video?.codec==='h264'&&audit.video.width===1080&&audit.video.height===1920&&audit.video.fps==='30/1','video contract');
 assert(Number.isFinite(audit.durationEncoded)&&Math.abs(audit.durationEncoded-request.duration)<=1/30+.001,'duration drift');
 assert(bundleDigest(request.bundle)===request.bundleDigest,'bundle changed during render');
 assert(fileSha256(request.source)===request.sourceSha256,'source changed during render');
 return audit;
}
