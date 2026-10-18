// Private end-to-end proof with actual video, PNG and WAV; no paid analysis.
import {readFileSync,writeFileSync,mkdirSync,createReadStream,createWriteStream,statSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {execFileSync} from 'node:child_process';
import {createEditorServer} from '../../src/editor-server.js';
import {loadProject,prepareProject,fileSha256} from '../../src/local-pipeline.js';
import {buildPreviewASS,buildPreviewFilter} from '../../src/local-preview.js';
import {verifyProjectBackup} from '../../src/project-backup.js';
const [config,video,image,music,output]=process.argv.slice(2);
if(!output)throw new Error('Usage: node scripts/app/smoke_general_real.mjs PROJECT VIDEO IMAGE MUSIC NEW_OUTPUT_DIRECTORY');
const out=resolve(output);mkdirSync(out,{mode:0o700});
const base=JSON.parse(readFileSync(config,'utf8'));for(const k of Object.keys(base))if(k.endsWith('Path')||k==='fontDirectory')base[k]=resolve(dirname(resolve(config)),base[k]);
if(base.backgroundAudio)base.backgroundAudio.localFile=resolve(dirname(resolve(config)),base.backgroundAudio.localFile);
if(base.illustrations)base.illustrations=base.illustrations.map(a=>({...a,localFile:resolve(dirname(resolve(config)),a.localFile)}));
base.sourcePath=join(out,'not-preloaded.mp4');writeFileSync(join(out,'input.json'),JSON.stringify(base),{mode:0o600});
const before=fileSha256(video),app=createEditorServer({directory:join(out,'jobs'),profiles:{calma:join(out,'input.json')}});
try{
 const url=(await app.listen()).split('/#')[0],session=await fetch(url+'/api/session',{method:'POST',headers:{Authorization:'Bearer '+app.token}}),headers={Cookie:session.headers.get('set-cookie').split(';')[0],'X-Sues-Request':'editor'};
 const api=async(path,method='GET',data)=>{const r=await fetch(url+'/api/'+path,{method,headers:{...headers,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});const value=await r.json();if(!r.ok)throw new Error(JSON.stringify(value));return value;};
 const binary=async(path,file,type)=>{const r=await fetch(url+'/api/'+path,{method:'POST',headers:{...headers,'Content-Type':type,'Content-Length':String(statSync(file).size)},body:createReadStream(file),duplex:'half'});const data=await r.json();if(r.status!==201)throw new Error(JSON.stringify(data));return data;};
 const uploaded=await binary('uploads',video,'video/mp4');if(uploaded.state!=='READY')throw new Error('Expected existing matching analysis');
 const pic=await binary('assets?'+new URLSearchParams({kind:'image',rights:'owned',name:'Horizonte original'}),image,'image/png'),bed=await binary('assets?'+new URLSearchParams({kind:'audio',rights:'owned',name:'Ambiente original'}),music,'audio/wav');
 let job=await api('jobs','POST',{profileId:uploaded.profileId}),initial=await api('jobs/'+job.id+'/plan');
 const caption=text=>{const c=initial.manifest.captions.find(c=>c.text===text);if(!c)throw new Error('Reference caption missing: '+text);return c;};
 const keyword=(text,word,style)=>[caption(text).id,{word,level:style==='condensed'?'important':'exceptional',style}];
 const settings={styleId:'SUES_CALMA',zoomIntensity:.75,motions:true,musicAssetId:bed.id,musicGain:.1,duckMusic:true,profileImages:false,imageEvents:[{assetId:pic.id,start:5.2,end:8.4}],keywordOverrides:Object.fromEntries([keyword('reconocer que hay',0,'blue'),keyword('tus ojos,',1,'cyan'),keyword('enseñó a detenerte',2,'condensed'),keyword('y sentir.',1,'green'),keyword('eres culpa,',1,'coral'),keyword('avanzar,',0,'gold')]),graphicCards:[{captionId:caption('has querido ver.').id,type:'grid'},{captionId:caption('silencio,').id,type:'secret'},{captionId:caption('Todos tus temores,').id,type:'compare',left:'Temores',right:'Observar lo que siento'}],transitions:[{captionId:caption('has querido ver.').id,type:'blur'},{captionId:caption('pero dime,').id,type:'radial'},{captionId:caption('te cuenta cosas').id,type:'warm'}]};
 job=await api('jobs/'+job.id,'PATCH',{settings});const fingerprint=job.fingerprint;await api('jobs/'+job.id+'/undo','POST',{});job=await api('jobs/'+job.id,'PATCH',{settings});if(job.fingerprint!==fingerprint)throw new Error('Undo/reapply changed plan');
 const review=await api('jobs/'+job.id+'/review');if(JSON.stringify(review).includes(out))throw new Error('Review exposes filesystem paths');writeFileSync(join(out,'review.json'),JSON.stringify(review,null,2),{mode:0o600});
 const backup=await api('jobs/'+job.id+'/backup','POST',{}),archive=await fetch(url+'/api/jobs/'+job.id+'/backup',{headers}),archivePath=join(out,'SUES_PROYECTO_RECUPERABLE_V5.tar');if(archive.status!==200)throw new Error('Backup download failed');await pipeline(Readable.fromWeb(archive.body),createWriteStream(archivePath,{flags:'wx',mode:0o600}));if(fileSha256(archivePath)!==backup.sha256)throw new Error('Backup checksum mismatch');
 const restored=join(out,'restored');mkdirSync(restored,{mode:0o700});execFileSync('tar',['-xf',archivePath,'-C',restored]);const restoreAudit=verifyProjectBackup(restored),restoreSettings=JSON.parse(readFileSync(join(restored,'settings.json'))),restoredPlan=prepareProject(loadProject(join(restored,'project.json')),restoreSettings).plan,actual=(await api('jobs/'+job.id+'/plan')).manifest;
 if(buildPreviewASS(restoredPlan)!==buildPreviewASS(actual)||buildPreviewFilter(restoredPlan)!==buildPreviewFilter(actual))throw new Error('Restored project changes rendered text/filter');
 const variants=[];for(const styleId of ['SUES_IMPACTO','SUES_EXPLICA','SUES_HISTORIA']){const variant=await api('jobs','POST',{profileId:uploaded.profileId,settings:{styleId}});variants.push({styleId,words:variant.summary.mappedWords,captions:variant.summary.captions});}
 console.log(JSON.stringify({stage:'rendering',id:job.id,backupVerified:true,restoredOutputMatches:true,assetsUploaded:2,variants}));await api('jobs/'+job.id+'/render','POST',{});await api('jobs/'+job.id+'/render','POST',{});
 const deadline=Date.now()+20*60*1000;let state;
 while(Date.now()<deadline){job=await api('jobs/'+job.id);if(job.state!==state){console.log(JSON.stringify({state:job.state,progress:job.progress}));state=job.state;}if(['DONE','FAILED','PUBLISH_FAILED','CANCELLED'].includes(job.state))break;await new Promise(r=>setTimeout(r,1000));}
 if(job.state!=='DONE'||job.attempt!==1)throw new Error('Invalid final state: '+JSON.stringify(job));const audit=await api('jobs/'+job.id+'/audit');if(!audit.sourcePreserved||audit.fullDecode!=='pass'||fileSha256(video)!==before)throw new Error('Source/output integrity failed');
 const range=await fetch(url+'/api/jobs/'+job.id+'/media',{headers:{...headers,Range:'bytes=0-1023'}});if(range.status!==206||(await range.arrayBuffer()).byteLength!==1024)throw new Error('Media Range failed');
 const result={version:'1.0',state:job.state,summary:job.summary,audit,renderAttempts:job.attempt,range:206,resourceUploads:{image:{id:pic.id,bytes:pic.bytes},music:{id:bed.id,bytes:bed.bytes}},backup:{bytes:backup.bytes,sha256:backup.sha256,restoreAudit,ASSAndFilterMatch:true},variants,settingsSource:'explicit integration-test editorial choices; not automatic LLM selection',humanAcceptance:false,externalCostUSD:0,video:await app.jobs.media(job.id),archive:archivePath};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({state:'DONE',result:join(out,'result.json')}));
}finally{await app.close();}
