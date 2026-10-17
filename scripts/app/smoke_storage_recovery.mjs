import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {createEditorServer} from '../../src/editor-server.js';
const [source,fonts,directory]=process.argv.slice(2);if(!source||!fonts||!directory)throw new Error('Usage: smoke_storage_recovery.mjs SYNTHETIC_SOURCE FONTS NEW_DIRECTORY');
const root=resolve(directory);
execFileSync(process.execPath,['scripts/app/smoke_queue_real.mjs',source,fonts,root],{stdio:'inherit'});
const queue=JSON.parse(readFileSync(join(root,'queue-smoke-result.json'),'utf8'));assert.equal(queue.fixture,'synthetic blue + gated440Hz; not Carlos voice');
// Remove only disposable render directories created by this invocation after archival.
for(const record of queue.records){assert.match(record.id,/^[a-f0-9-]{36}$/);const job=JSON.parse(readFileSync(join(root,'jobs',record.id,'job.json'),'utf8'));assert.equal(job.state,'DONE');assert.ok(job.artifact&&job.auditArtifact);rmSync(join(root,'jobs',record.id,'render-1'),{recursive:true});}
const app=createEditorServer({directory:join(root,'jobs'),profiles:{synthetic:join(root,'project.json')}});
try{
 const launch=await app.listen(),base=launch.split('/#')[0],session=await fetch(base+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),cookie=session.headers.get('set-cookie').split(';')[0];
 const recovered=[];
 for(const record of queue.records){const response=await fetch(base+'/api/jobs/'+record.id+'/media',{headers:{Cookie:cookie,Range:'bytes=0-1023'}});assert.equal(response.status,206);assert.equal((await response.arrayBuffer()).byteLength,1024);const audit=await (await fetch(base+'/api/jobs/'+record.id+'/audit',{headers:{Cookie:cookie}})).json();assert.equal(audit.outputSha256,record.audit.outputSha256);assert.equal(app.jobs.get(record.id).attempt,1);assert.equal(app.jobs.children.size,0);recovered.push({id:record.id,state:app.jobs.get(record.id).state,storageReady:true,renderDirectoryRemoved:true,attempts:1,rangeStatus:206,bytes:audit.bytes,outputSha256:audit.outputSha256});}
 const result={version:'1.0',fixture:queue.fixture,afterServerRestart:true,servedWithoutRuntimeRenderFiles:true,newRenderAttempts:0,externalCostUSD:0,records:recovered,browserVisualQA:false,humanAcceptance:false};writeFileSync(join(root,'storage-recovery-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({recoveryPassed:true,archivedVideos:recovered.length,newRenders:0}));
}finally{await app.close();}
