// Integration check with a user's authorized original and existing analysis.
// Editorial QA labels do not claim to describe the speaker's intended structure.
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {createEditorServer} from '../../src/editor-server.js';
import {loadProject,prepareProject,fileSha256} from '../../src/local-pipeline.js';
import {ELEMENT_FORMATS} from '../../src/elements.js';
import {buildPreviewASS,buildPreviewFilter} from '../../src/local-preview.js';
import {createProjectBackup,verifyProjectBackup} from '../../src/project-backup.js';
const [config,destination]=process.argv.slice(2);if(!destination)throw Error('Usage: PROJECT.json NEW_OUTPUT_DIRECTORY');
const out=resolve(destination);mkdirSync(dirname(out),{recursive:true,mode:0o700});mkdirSync(out,{mode:0o700});
const project=loadProject(resolve(config)),hash=fileSha256(project.sourcePath),checks=[];
let finalSettings;
for(const styleId of ['SUES_CALMA','SUES_DOPAMIN']){
 const base=prepareProject(project,{styleId,profileImages:false,zoomIntensity:0});
 const first=base.plan.captions.find(c=>c.start>=2&&c.end<=base.plan.duration-5),last=first&&base.plan.captions.find(c=>c.start>=first.start&&c.end-first.start>=2&&c.end-first.start<=4);
 if(!first||!last)throw Error('No existing range suitable for QA');
 for(const format of ELEMENT_FORMATS){
  const elements={format,items:[{captionId:first.id,endCaptionId:last.id,label:'Idea principal',...(['COMPARE','Q&A'].includes(format)?{secondary:'Otra perspectiva'}:{}),...(format==='RANKING'?{number:5}:{})}]};
  const settings={styleId,profileImages:false,zoomIntensity:0,elements,sfxEnabled:true},prepared=prepareProject(project,settings);
  if(prepared.director.audit.omittedWords||prepared.plan.captions.map(c=>c.text).join('|')!==base.plan.captions.map(c=>c.text).join('|'))throw Error('Speech changed');
  checks.push({styleId,format,sourceWords:prepared.director.audit.sourceWords,mappedWords:prepared.director.audit.mappedWords,start:prepared.plan.elements[0].start,end:prepared.plan.elements[0].end});
  if(styleId==='SUES_DOPAMIN'&&format==='COMPARE')finalSettings=settings;
 }
}
const app=createEditorServer({directory:join(out,'jobs'),profiles:{qa:resolve(config)}});
try{
 const url=(await app.listen()).split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json','X-Sues-Request':'editor'};
 const api=async(path,method='GET',body)=>{const r=await fetch(url+'/api/'+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})}),data=await r.json();if(!r.ok)throw Error(JSON.stringify(data));return data;};
 let job=await api('jobs','POST',{profileId:'qa',settings:finalSettings});
 const prepared=prepareProject(project,finalSettings),portable=join(out,'portable');await createProjectBackup(project,prepared,portable);verifyProjectBackup(portable);
 const restored=prepareProject(loadProject(join(portable,'project.json')),JSON.parse(readFileSync(join(portable,'settings.json'))));
 if(buildPreviewASS(restored.plan)!==buildPreviewASS(prepared.plan)||buildPreviewFilter(restored.plan)!==buildPreviewFilter(prepared.plan))throw Error('Backup restoration changes render');
 await api('jobs/'+job.id,'PATCH',{settings:{}});await api('jobs/'+job.id+'/undo','POST',{});
 if((await api('jobs/'+job.id)).fingerprint!==job.fingerprint)throw Error('Undo mismatch');
 await api('jobs/'+job.id+'/render','POST',{});await api('jobs/'+job.id+'/render','POST',{});
 console.log(JSON.stringify({stage:'rendering',checks:checks.length}));
 const deadline=Date.now()+15*60*1000;
 while(Date.now()<deadline){job=await api('jobs/'+job.id);if(['DONE','FAILED','PUBLISH_FAILED','CANCELLED'].includes(job.state))break;await new Promise(r=>setTimeout(r,1000));}
 if(job.state!=='DONE'||job.attempt!==1)throw Error('Render failed '+job.state+' '+job.error);
 const audit=await api('jobs/'+job.id+'/audit'),range=await fetch(url+'/api/jobs/'+job.id+'/media',{headers:{...headers,Range:'bytes=0-1023'}});
 if(audit.fullDecode!=='pass'||!audit.sourcePreserved||fileSha256(project.sourcePath)!==hash||range.status!==206||(await range.arrayBuffer()).byteLength!==1024)throw Error('Integrity/range check failed');
 const video=await app.jobs.media(job.id),result={version:'1.0',source:'authorized-original-with-existing-analysis',checks,rendered:'DOPAMIN+ELEMENTS/COMPARE',editorialCopy:'QA-only-not-an-interpretation-of-the-speech',state:job.state,renderAttempts:job.attempt,sourcePreserved:true,fullDecode:'pass',range:206,backupASSAndFilterMatch:true,undoRestoresFingerprint:true,summary:job.summary,videoSha256:fileSha256(video),video,externalCostUSD:0,humanAcceptance:false,browserQA:false};
 writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({stage:'DONE',result:join(out,'result.json')}));
}finally{await app.close();}
