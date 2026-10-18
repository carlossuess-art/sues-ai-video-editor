// Synthetic AV proof through the authenticated app/worker/private storage.
// This is not a real walking person or a human aesthetic acceptance test.
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createEditorServer} from '../../src/editor-server.js';
import {fileSha256,loadProject,prepareProject} from '../../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../../src/local-preview.js';
import {verifyProjectBackup} from '../../src/project-backup.js';
const out=resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Usage: NEW_OUTPUT_DIRECTORY');mkdirSync(out,{mode:0o700});
const root=resolve(new URL('../..',import.meta.url).pathname),source=join(out,'synthetic-original.mp4'),duration=24;
execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x25323e:s=1080x1920:r=30:d=24','-f','lavfi','-i','sine=frequency=220:sample_rate=48000:duration=24','-vf','drawbox=x=400:y=160:w=280:h=260:color=orange:t=fill','-af','volume=0.08','-c:v','libx264','-threads','2','-preset','ultrafast','-crf','28','-c:a','aac','-shortest',source]);
const phrases=['Elige con calma.','Dejar el ruido.','Nunca puedo cambiar.','Un paso sencillo.','Antes y después.','Vuelve a ti.'];
const words=phrases.flatMap((text,i)=>text.split(' ').map((text,k)=>({text,start:2+i*3+k*.4,end:2+i*3+(k+1)*.4})));
const frame=time=>({time,frameWidth:1080,frameHeight:1920,faces:[{x:400,y:160,width:280,height:260,score:1,leftEye:{x:510,y:250},rightEye:{x:570,y:250}}]});
const values={transcript:{version:'1.0',language:'es',sourceDuration:duration,words},camera:{keyframes:[0,duration].map(time=>({time,x:0,y:0,width:1080,height:1920,zoom:1}))},vision:{frames:[frame(0),frame(duration)]}};
for(const [name,value]of Object.entries(values))writeFileSync(join(out,name+'.json'),JSON.stringify(value));
const config={title:'Biblioteca de motions · prueba sintética',sourcePath:source,source:{duration,width:1080,height:1920,sha256:fileSha256(source)},templatePath:join(root,'examples/templates/sues-calma.template.json'),brandKitPath:join(root,'examples/brand-kit.sues.json'),catalogPath:join(root,'examples/motions/catalog.sample.json'),fontDirectory:join(root,'assets/fonts/inter'),...Object.fromEntries(Object.keys(values).map(k=>[k+'Path',join(out,k+'.json')]))};
writeFileSync(join(out,'project.json'),JSON.stringify(config));const before=fileSha256(source),app=createEditorServer({directory:join(out,'jobs'),profiles:{synthetic:join(out,'project.json')}});
try{
 const url=(await app.listen()).split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'Content-Type':'application/json','X-Sues-Request':'editor'};
 const api=async(path,method='GET',data)=>{const r=await fetch(url+'/api/'+path,{method,headers,...(data?{body:JSON.stringify(data)}:{})});const value=await r.json();if(!r.ok)throw Error(JSON.stringify(value));return value;};
 let job=await api('jobs','POST',{profileId:'synthetic',settings:{zoomIntensity:0}}),plan=(await api('jobs/'+job.id+'/plan')).manifest;
 const captionId=text=>{const c=plan.captions.find(c=>c.text===text);if(!c)throw Error('Missing caption '+text);return c.id;};
 const settings={zoomIntensity:0,motionChoices:['check','cross','strike','number','divider'].map((type,i)=>({captionId:captionId(phrases[i]),type,...(type==='number'?{number:4}:{})})),highlightCaptions:[captionId(phrases[5])]};
 job=await api('jobs/'+job.id,'PATCH',{settings});const fingerprint=job.fingerprint;await api('jobs/'+job.id+'/undo','POST',{});job=await api('jobs/'+job.id,'PATCH',{settings});if(job.fingerprint!==fingerprint)throw Error('Undo mismatch');
 plan=(await api('jobs/'+job.id+'/plan')).manifest;
 const backup=await api('jobs/'+job.id+'/backup','POST',{}),download=await fetch(url+'/api/jobs/'+job.id+'/backup',{headers}),archive=join(out,'project.tar');writeFileSync(archive,Buffer.from(await download.arrayBuffer()));if(fileSha256(archive)!==backup.sha256)throw Error('Backup mismatch');
 const restored=join(out,'restored');mkdirSync(restored);execFileSync('tar',['-xf',archive,'-C',restored]);verifyProjectBackup(restored);const restoredPlan=prepareProject(loadProject(join(restored,'project.json')),JSON.parse(readFileSync(join(restored,'settings.json')))).plan;
 if(buildPreviewASS(plan)!==buildPreviewASS(restoredPlan)||buildPreviewFilter(plan)!==buildPreviewFilter(restoredPlan))throw Error('Restored output mismatch');
 const review=await api('jobs/'+job.id+'/review');if(JSON.stringify(review).includes(out))throw Error('Review leaks path');
 console.log(JSON.stringify({stage:'rendering',motions:plan.semantic.motions.map(m=>m.params.motionId)}));await api('jobs/'+job.id+'/render','POST',{});
 const deadline=Date.now()+15*60*1000;
 while(Date.now()<deadline){job=await api('jobs/'+job.id);if(['DONE','FAILED','PUBLISH_FAILED','CANCELLED'].includes(job.state))break;await new Promise(r=>setTimeout(r,1000));}
 if(job.state!=='DONE'||job.attempt!==1)throw Error('Invalid state '+job.state);
 const audit=await api('jobs/'+job.id+'/audit'),range=await fetch(url+'/api/jobs/'+job.id+'/media',{headers:{...headers,Range:'bytes=0-1023'}});
 if(range.status!==206||(await range.arrayBuffer()).byteLength!==1024||!audit.sourcePreserved||audit.fullDecode!=='pass'||fileSha256(source)!==before)throw Error('Integrity failed');
 const video=await app.jobs.media(job.id),result={kind:'synthetic-AV-not-real-person',state:job.state,summary:job.summary,audit,sourceIntact:true,range:206,renderAttempts:job.attempt,backupRestoredWithIdenticalASSAndFilter:true,events:review.events,video,humanAcceptance:false,SFX:false,bodySegmentation:false,externalCostUSD:0};
 writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({stage:'DONE',result:join(out,'result.json')}));
}finally{await app.close();}
