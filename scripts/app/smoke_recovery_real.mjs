// End-to-end recovery with existing private assets. No ASR, inference or providers.
import {mkdirSync,readFileSync,writeFileSync,createReadStream,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createEditorServer} from '../../src/editor-server.js';
import {createProjectBackup} from '../../src/project-backup.js';
import {loadProject,prepareProject,fileSha256} from '../../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../../src/local-preview.js';
import {projectConfig} from '../../src/video-intake.js';

const [config,settingsFile,destination]=process.argv.slice(2);
if(!destination)throw Error('Usage: PROJECT.json SETTINGS.json NEW_OUTPUT_DIRECTORY');
const out=resolve(destination);mkdirSync(out,{mode:0o700});
const project=loadProject(resolve(config)),settings=JSON.parse(readFileSync(settingsFile)),prepared=prepareProject(project,settings),original=fileSha256(project.sourcePath);
const backup=await createProjectBackup(project,prepared,join(out,'portable'));
const archive=join(out,'SUES_PROYECTO_RECUPERABLE.tar');execFileSync('tar',['-cf',archive,'-C',backup.directory,'.']);
const empty=projectConfig(config);empty.sourcePath=join(out,'not-preloaded.mp4');
writeFileSync(join(out,'empty.json'),JSON.stringify(empty),{mode:0o600});
const directory=join(out,'jobs'),profiles={calma:join(out,'empty.json')};
let app,url,headers;
async function start(){app=createEditorServer({directory,profiles:{...profiles}});url=(await app.listen()).split('/#')[0];const login=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}});headers={Cookie:login.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor'};}
async function api(path,method='GET',body){const r=await fetch(url+'/api/'+path,{method,headers:{...headers,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),value=await r.json();if(!r.ok)throw Error(JSON.stringify(value));return value;}
async function restore(){const r=await fetch(url+'/api/recoveries',{method:'POST',headers:{...headers,'Content-Type':'application/x-tar','Content-Length':String(statSync(archive).size)},body:createReadStream(archive),duplex:'half'}),data=await r.json();if(r.status!==201)throw Error(JSON.stringify(data));return data;}
try{
 await start();if((await api('profiles'))[0].ready)throw Error('Expected empty initial profile');
 const restored=await restore(),id=restored.job.id;
 const manifest=(await api('jobs/'+id+'/plan')).manifest;
 if(buildPreviewASS(manifest)!==buildPreviewASS(prepared.plan)||buildPreviewFilter(manifest)!==buildPreviewFilter(prepared.plan))throw Error('Restoration changes ASS/filter');
 if((await restore()).job.id!==id||(await api('jobs')).length!==1)throw Error('Restore retry duplicated job');
 await app.close();await start();
 if((await restore()).job.id!==id)throw Error('Restart lost recovered job');
 console.log(JSON.stringify({stage:'restored',ASSAndFilterMatch:true,retryAndRestart:true,sourcePreserved:fileSha256(project.sourcePath)===original}));
 await api('jobs/'+id+'/render','POST',{});await api('jobs/'+id+'/render','POST',{});
 const deadline=Date.now()+20*60*1000;let job,state;
 while(Date.now()<deadline){job=await api('jobs/'+id);if(job.state!==state){console.log(JSON.stringify({state:job.state,progress:job.progress}));state=job.state;}if(['DONE','FAILED','CANCELLED','PUBLISH_FAILED'].includes(job.state))break;await new Promise(r=>setTimeout(r,1000));}
 if(job.state!=='DONE'||job.attempt!==1)throw Error('Render did not finish once: '+job.state);
 const audit=await api('jobs/'+id+'/audit');if(!audit.sourcePreserved||audit.fullDecode!=='pass'||fileSha256(project.sourcePath)!==original)throw Error('Integrity checks failed');
 const range=await fetch(url+'/api/jobs/'+id+'/media',{headers:{...headers,Range:'bytes=0-1023'}});if(range.status!==206||(await range.arrayBuffer()).byteLength!==1024)throw Error('Range failed');
 const video=await app.jobs.media(id),result={version:'1.0',recovery:'private-portable-tar',state:job.state,sourceSha256:original,sourcePreserved:true,ASSAndFilterMatch:true,retryAndRestart:true,renderAttempts:job.attempt,range:206,archiveSha256:fileSha256(archive),archiveBytes:statSync(archive).size,videoSha256:fileSha256(video),videoBytes:statSync(video).size,summary:job.summary,audit,video,archive,externalCostUSD:0,humanAcceptance:false,browserQA:false};
 writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({stage:'DONE',result:join(out,'result.json')}));
}finally{if(app)await app.close();}
