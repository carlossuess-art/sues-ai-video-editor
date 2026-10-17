import {parseRenderProgress} from '../../src/render-progress.js';
import {resolve,join} from 'node:path';
import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createEditorServer} from '../../src/editor-server.js';
import {fileSha256} from '../../src/local-pipeline.js';
const [sourcePath,fontDirectory,outputDirectory]=process.argv.slice(2);
if(!sourcePath||!fontDirectory||!outputDirectory)throw new Error('Usage: smoke_queue_real.mjs SYNTHETIC_SOURCE FONT_DIRECTORY NEW_OUTPUT_DIRECTORY');
const root=resolve(outputDirectory);if(existsSync(root))throw new Error('Output directory must be new');mkdirSync(root,{recursive:true});
const source=resolve(sourcePath),info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',source],{encoding:'utf8'})),duration=Number(info.format.duration),video=info.streams.find(s=>s.codec_type==='video');
assert.ok(duration>=8&&duration<=20&&video.width===1080&&video.height===1920,'Use a short 1080x1920 synthetic fixture');
const write=(name,value)=>{const path=join(root,name);writeFileSync(path,JSON.stringify(value,null,2)+'\n');return path;};
const transcriptPath=write('transcript.json',{version:'1.0',language:'es',sourceDuration:duration,words:[{text:'Prueba',start:2,end:3},{text:'de',start:3,end:4},{text:'cola',start:4,end:5},{text:'persistente.',start:5,end:6}]}),cameraPath=write('camera.json',{keyframes:[0,duration].map(time=>({time,x:0,y:0,width:1080,height:1920,zoom:1}))}),visionPath=write('vision.json',{frames:[]});
const projectPath=write('project.json',{title:'Smoke cola sintética',sourcePath:source,source:{duration,width:1080,height:1920,sha256:fileSha256(source)},fontDirectory:resolve(fontDirectory),transcriptPath,cameraPath,visionPath,templatePath:resolve('examples/templates/sues-calma.template.json'),brandKitPath:resolve('examples/brand-kit.sues.json'),catalogPath:resolve('examples/motions/catalog.sample.json')});
const app=createEditorServer({directory:join(root,'jobs'),profiles:{synthetic:projectPath}});
try{
 const launch=await app.listen(),url=launch.split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),cookie=session.headers.get('set-cookie').split(';')[0];
 const call=async(path,method='GET',body)=>{const response=await fetch(url+'/api/'+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json','X-Sues-Request':'editor'},...(body?{body:JSON.stringify(body)}:{})});const value=await response.json();assert.ok(response.ok,JSON.stringify(value));return value;};
 const a=await call('jobs','POST',{profileId:'synthetic'}),b=await call('jobs','POST',{profileId:'synthetic'});
 assert.equal((await call('jobs/'+a.id+'/render','POST',{})).state,'RENDERING');
 const queued=await call('jobs/'+b.id+'/render','POST',{});assert.equal(queued.state,'QUEUED');assert.equal(queued.queuePosition,1);assert.equal((await call('jobs/'+b.id+'/render','POST',{})).attempt,0);
 console.log(JSON.stringify({first:a.id,second:b.id,secondState:queued.state}));
 const deadline=Date.now()+180000,observed=[];let jobs;
 do{jobs=await call('jobs');for(const j of jobs)observed.push({id:j.id,state:j.state,progress:j.progress});assert.ok(!jobs.some(j=>j.state==='FAILED'),JSON.stringify(jobs));if(jobs.every(j=>j.state==='DONE'))break;assert.ok(Date.now()<deadline,'Queue timeout');await new Promise(r=>setTimeout(r,500));}while(true);
 const records=[];for(const job of jobs){const audit=await call('jobs/'+job.id+'/audit');assert.equal(audit.fullDecode,'pass');assert.equal(audit.sourcePreserved,true);assert.equal(job.attempt,1);const response=await fetch(url+'/api/jobs/'+job.id+'/media',{headers:{Cookie:cookie,Range:'bytes=0-1023'}});assert.equal(response.status,206);assert.equal((await response.arrayBuffer()).byteLength,1024);const encoderReport=parseRenderProgress(readFileSync(join(root,'jobs',job.id,'render-1','ffmpeg-progress.txt'),'utf8'),duration);assert.equal(encoderReport.stage,'verifying');assert.equal(encoderReport.percent,99);assert.equal(job.progress.percent,100);records.push({encoderReport,observedProgress:observed.filter(o=>o.id===job.id),id:job.id,state:job.state,attempts:job.attempt,queueOrder:app.jobs.get(job.id).queueOrder,history:job.history,audit,rangeStatus:206});}
 const first=records.find(j=>j.id===a.id),second=records.find(j=>j.id===b.id);assert.ok(first.history.find(h=>h.state==='DONE').at<=second.history.find(h=>h.state==='RENDERING').at);
 const result={version:'1.0',fixture:'synthetic blue + gated440Hz; not Carlos voice',externalCostUSD:0,serial:true,duplicateSubmission:'no extra render',records,browserVisualQA:false,humanAcceptance:false};write('queue-smoke-result.json',result);console.log(JSON.stringify({pass:true,jobs:records.map(j=>({id:j.id,state:j.state,bytes:j.audit.bytes})),sourcePreserved:true}));
}finally{await app.close();}
