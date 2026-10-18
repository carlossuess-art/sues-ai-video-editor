// Authenticated HTTP upload -> CALMA -> adjustments -> worker -> private MP4.
// Uses only existing analysis; no paid API or new vision inference.
import {resolve,join} from 'node:path';
import {readFileSync,writeFileSync,createReadStream,statSync,mkdirSync} from 'node:fs';
import {createEditorServer} from '../../src/editor-server.js';
import {fileSha256} from '../../src/local-pipeline.js';
const [config,video,directory,mode]=process.argv.slice(2);
if(!config||!video||!directory)throw new Error('Usage: node scripts/app/smoke_upload_real.mjs project.json video.mp4 NEW_DIRECTORY');
const dir=resolve(directory);mkdirSync(dir,{recursive:false,mode:0o700});
// Prove that the app no longer depends on a preloaded source.
const base=JSON.parse(readFileSync(config,'utf8'));for(const k of Object.keys(base))if(k.endsWith('Path')||k==='fontDirectory')base[k]=resolve(resolve(config,'..'),base[k]);
const analysis=mode==='--restore-analysis'?{sourceSha256:base.source.sha256,transcript:JSON.parse(readFileSync(base.transcriptPath)),camera:JSON.parse(readFileSync(base.cameraPath)),vision:JSON.parse(readFileSync(base.visionPath))}:null;
base.sourcePath=join(dir,'not-preloaded.mp4');if(analysis)for(const key of ['transcriptPath','cameraPath','fontDirectory'])base[key]=join(dir,'missing-'+key);writeFileSync(join(dir,'input.json'),JSON.stringify(base),{mode:0o600});
const before=fileSha256(video),app=createEditorServer({directory:join(dir,'jobs'),profiles:{calma:join(dir,'input.json')}});
try{
 const url=(await app.listen()).split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),cookie=session.headers.get('set-cookie').split(';')[0];
 const headers={Cookie:cookie,'X-Sues-Request':'editor'};
 const api=async(path,method='GET',body)=>{const r=await fetch(url+'/api/'+path,{method,headers:{...headers,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const result=await r.json();if(!r.ok)throw new Error(JSON.stringify(result));return result;};
 if((await api('profiles'))[0].ready)throw new Error('Expected non-preloaded source');
 const upload=await fetch(url+'/api/uploads',{method:'POST',headers:{...headers,'Content-Type':'video/mp4','Content-Length':String(statSync(video).size)},body:createReadStream(video),duplex:'half'});
 let media=await upload.json();if(upload.status!==201)throw new Error('Upload failed: '+JSON.stringify(media));if(analysis){if(media.state!=='WAITING_ASSETS')throw new Error('Expected missing assets');media=await api('uploads/'+media.id+'/analysis','POST',analysis);}if(media.state!=='READY')throw new Error('Analysis not ready');
 let job=await api('jobs','POST',{profileId:media.profileId});job=await api('jobs/'+job.id,'PATCH',{settings:{zoomIntensity:.75,motions:true}});const initialFingerprint=job.fingerprint;
 job=await api('jobs/'+job.id+'/render','POST',{});await api('jobs/'+job.id+'/render','POST',{});console.log(JSON.stringify({stage:'rendering',id:job.id,uploadBytes:media.bytes}));
 const deadline=Date.now()+20*60*1000;let last;
 while(Date.now()<deadline){job=await api('jobs/'+job.id);if(job.state!==last){console.log(JSON.stringify({state:job.state,progress:job.progress}));last=job.state;}if(['DONE','FAILED','PUBLISH_FAILED','CANCELLED'].includes(job.state))break;await new Promise(r=>setTimeout(r,1000));}
 if(job.state!=='DONE'||job.attempt!==1||job.fingerprint!==initialFingerprint)throw new Error('Invalid final job: '+JSON.stringify(job));
 const audit=await api('jobs/'+job.id+'/audit');if(!audit.sourcePreserved||audit.fullDecode!=='pass'||!audit.audioPresent||fileSha256(video)!==before)throw new Error('Invalid output or changed original');
 const r=await fetch(url+'/api/jobs/'+job.id+'/media',{headers:{...headers,Range:'bytes=0-1023'}}),bytes=Buffer.from(await r.arrayBuffer());if(r.status!==206||bytes.length!==1024||bytes.toString('ascii',4,8)!=='ftyp')throw new Error('Range failed');
 const result={version:'1.0',state:job.state,upload:{bytes:media.bytes,sourcePreloaded:false,matchedAnalysis:true,analysisRestored:!!analysis,packagedFonts:!!analysis},summary:job.summary,renderAttempts:job.attempt,range:{status:r.status,bytes:bytes.length},audit,video:await app.jobs.media(job.id),externalCostUSD:0,humanAcceptance:false};
 writeFileSync(join(dir,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({state:job.state,result:join(dir,'result.json')}));
}finally{await app.close();}
