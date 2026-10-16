import {resolve,join} from 'node:path';
import {writeFileSync} from 'node:fs';
import {createEditorServer} from '../../src/editor-server.js';
const [config,directory]=process.argv.slice(2);
if(!config||!directory){console.error('Usage: node scripts/app/smoke_real.mjs project.json NEW_JOB_DIRECTORY');process.exit(1);}
const app=createEditorServer({directory:resolve(directory),profiles:{calma:resolve(config)}});
try{
 const launch=await app.listen(),base=launch.split('/#')[0],session=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),cookie=session.headers.get('set-cookie').split(';')[0];
 const request=async(path,method='GET',body)=>{const response=await fetch(base+'/api/'+path,{method,headers:{Cookie:cookie,'X-Sues-Request':'editor','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const value=await response.json();if(!response.ok)throw new Error(JSON.stringify(value));return value;};
 let job=await request('jobs','POST',{profileId:'calma'});const plan=await request('jobs/'+job.id+'/plan');
 job=await request('jobs/'+job.id,'PATCH',{settings:{zoomIntensity:.75,motions:true,captionOverrides:{[plan.manifest.captions[0].id]:plan.manifest.captions[0].text}}});
 const fingerprint=job.fingerprint;
 job=await request('jobs/'+job.id+'/render','POST',{});console.log(JSON.stringify({id:job.id,state:job.state,summary:job.summary}));
 const duplicate=await request('jobs/'+job.id+'/render','POST',{});if(duplicate.attempt!==1)throw new Error('Duplicate render');
 // Wait for this owned worker. Status is verified through HTTP after completion.
 await new Promise((r,j)=>{const child=app.jobs.children.get(job.id);if(!child)return r();child.once('close',code=>code===0?r():j(new Error('Real worker failed')));});
 job=await request('jobs/'+job.id);if(job.state!=='DONE'||job.fingerprint!==fingerprint)throw new Error('Unexpected final state');
 const audit=await request('jobs/'+job.id+'/audit');if(!audit.sourcePreserved||audit.fullDecode!=='pass'||!audit.audioPresent)throw new Error('Invalid render audit');
 const media=await fetch(base+'/api/jobs/'+job.id+'/media',{headers:{Cookie:cookie,Range:'bytes=0-1023'}});const bytes=Buffer.from(await media.arrayBuffer());if(media.status!==206||bytes.length!==1024||bytes.toString('ascii',4,8)!=='ftyp')throw new Error('MP4 range delivery failed');
 const result={version:'1.0',jobId:job.id,state:job.state,summary:job.summary,fingerprint,renderAttempts:job.attempt,range:{status:media.status,bytes:bytes.length},audit,video:app.jobs.media(job.id),browserVisualQA:'not performed: browser cannot reach worker loopback',humanAcceptance:false,externalCostUSD:0};
 writeFileSync(join(resolve(directory),'real-smoke-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}catch(e){console.error(e.message);process.exitCode=1;}finally{await app.close();}
