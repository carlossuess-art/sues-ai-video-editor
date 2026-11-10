// Private operator entrypoint. One canonical story, one exact creative decision,
// one MCP batch, one render. No production, no provider generation or auto-publish.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {execFileSync,spawn} from 'node:child_process';
import {MasterDirectorProjectStore} from '../../src/master-director-project-store.js';
import {DirectorApprovalLedger} from '../../src/engine-next/fablecut-director-approval-ledger.js';
import {createApprovedBatchService} from '../../src/engine-next/fablecut-approved-batch.js';
import {prepareStoryBatch,applyCommandBatch,projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';
const [mode,dir,storyFile,confirmation]=process.argv.slice(2);
const root=fs.realpathSync('/srv/sues-fablecut-next/data/automation-v1'),out=fs.realpathSync(dir);
if(path.dirname(out)!==root||!/^test-project-[a-zA-Z0-9_-]+$/.test(path.basename(out)))throw Error('PRIVATE_CLONE_REQUIRED');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),write=(f,x)=>fs.writeFileSync(f,JSON.stringify(x,null,2),{mode:0o600,flag:'wx'});
const hash=f=>execFileSync('sha256sum',[f],{encoding:'utf8'}).split(' ')[0];
const configPath=path.join(out,'host.json');
if(fs.lstatSync(configPath).isSymbolicLink()||(fs.statSync(configPath).mode&0o077)!==0)throw Error('PRIVATE_HOST_CONFIG_REQUIRED');
const h=read(configPath),engine='/srv/sues-fablecut-next/app',native=createRequire(import.meta.url)(engine+'/project-ops.js');
if(h.schema!=='sues-private-story-host/v1'||!['technical-qa','private-reviewed'].includes(h.scope)||!h.registry||!Array.isArray(h.rulebook))throw Error('INVALID_HOST_CONFIG');
const dataRoot=fs.realpathSync('/srv/sues-fablecut-next/data');
const safeFile=f=>{const v=fs.realpathSync(f);if(!v.startsWith(dataRoot+path.sep)||!fs.statSync(v).isFile())throw Error('UNTRUSTED_MEDIA_PATH');return v};
const source=safeFile(h.sourceFile);if(hash(source)!==h.sourceSha256)throw Error('SOURCE_SHA_MISMATCH');
const call=(name,args)=>{const input=JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})+'\n';const raw=execFileSync('node',[engine+'/mcp-server.js'],{input,encoding:'utf8',env:{...process.env,FABLECUT_DATA_DIR:out,FABLECUT_PORT:'7797'},timeout:30000,maxBuffer:16*1024*1024});const r=raw.trim().split('\n').map(JSON.parse).find(x=>x.id===1);if(r?.result?.isError||!r?.result?.content?.[0]?.text)throw Error(r?.result?.content?.[0]?.text??'MCP_RESPONSE_INVALID');return r.result.content[0].text};
const projectId='p_'+createHash('sha256').update(out).digest('hex').slice(0,24);
const readProject=async()=>({projectId,data:JSON.parse(call('fablecut_get_project',{}))});
const before=(await readProject()).data;
const sourceMedia=before.media.find(m=>m.kind==='video'&&/^\/media\/[A-Za-z0-9_.-]+$/.test(m.src??'')&&fs.existsSync(out+m.src)&&safeFile(out+m.src)===source);
 if(!sourceMedia||!before.clips.some(c=>c.mediaId===sourceMedia.id&&c.kind==='video'))throw Error('SOURCE_NOT_BOUND_TO_NATIVE_PROJECT');
 const duration=Math.max(...before.clips.map(c=>c.start+c.duration));
if(before.fps!==30||before.width!==h.registry.canvas?.width||before.height!==h.registry.canvas?.height||Math.abs(duration-h.duration)>1e-6)throw Error('NATIVE_PROJECT_GEOMETRY_CHANGED');
const resolveAsset=id=>{const a=h.assets?.[id],rights=h.registry.licensedAssets?.[id];if(!a||rights?.rightsVerified!==true||rights?.commercialUseAllowed!==true||rights.sha256!==a.sha256)return null;const file=safeFile(a.file);if(hash(file)!==a.sha256||!/^\/media\/[A-Za-z0-9_.-]+$/.test(a.src)||fs.statSync(file).size!==a.size)throw Error('ASSET_BYTES_CHANGED');return {...a,id,file,verifiedPhysical:true,rightsVerified:true}};
const stageAssets=async assets=>{for(const a of assets){const f=path.join(out,a.src.slice(1));if(fs.existsSync(f)){if(hash(safeFile(f))!==a.sha256)throw Error('ASSET_COLLISION');continue}fs.symlinkSync(a.file,f);if(hash(safeFile(f))!==a.sha256)throw Error('STAGED_HASH_MISMATCH')}};
const registry={...h.registry,projectFingerprint:h.nativeFingerprint,nativeTrackRoles:h.nativeTrackRoles,nativeMediaBindings:h.nativeMediaBindings??{}};
const store=new MasterDirectorProjectStore(out,async story=>({sourceSha256:h.sourceSha256,timelineFingerprint:h.timelineFingerprint,duration:h.duration,registry,rulebook:h.rulebook,nativePreflight:async(_plan,r)=>{
 const p=(await readProject()).data;
 const plan=await prepareStoryBatch(story,{registry:{...r,unresolvedRuleConflicts:[]},project:p,bindings:h.bindings,authorize:async()=>true});
 if(plan.status!=='PREPARED_NOT_EXECUTED')return plan;
 try{const result=applyCommandBatch(p,plan.request,{native,resolveAsset});if(result.assets.some(a=>!a.rightsVerified))throw Error('RESOURCE_RIGHTS_UNVERIFIED');return {status:'READY_FOR_EDITOR_PREVIEW'}}catch(e){return {status:'BLOCKED',issues:[{code:e.message,operationId:e.operationId??'plan'}]}}
}}));
const ledger=new DirectorApprovalLedger({directory:out+'/approvals'});
const service=createApprovedBatchService({ledger,resolveContext:async()=>({nativeProjectId:projectId,privateClone:true,store,nativeFingerprint:h.nativeFingerprint,nativeTrackRoles:h.nativeTrackRoles,nativeMediaBindings:h.nativeMediaBindings??{},bindings:h.bindings}),readProject,native,resolveAsset,stageAssets,invokeMcp:async(n,a)=>call(n,a)});
if(mode==='run'){
 // One explicit confirmation starts both stages; a failed render never replays edits.
 execFileSync(process.execPath,[process.argv[1],'execute',out,storyFile,confirmation],{stdio:'inherit',timeout:120000});
 execFileSync(process.execPath,[process.argv[1],'render',out],{stdio:'inherit',timeout:1300000});
}else if(mode==='prepare'){
 if(projectFingerprint(before)!==h.nativeFingerprint)throw Error('NATIVE_BINDING_STALE');
 const story=read(storyFile),{revision}=store.saveDraft(story),head=store.current().revision;
 if(head&&head!==revision)throw Error('EXISTING_REVIEW_HEAD_USE_NEW_CLONE');
 store.setCurrent(revision,head);
 const review=await store.review(revision);write(out+'/story-review.json',review);
 console.log(JSON.stringify({status:review.status,revision,fingerprint:review.fingerprint,issues:review.issues??[],operationCount:story.operations.length,scope:h.scope}));
 if(review.status!=='READY_FOR_CHOICE')process.exitCode=2;
}else if(mode==='execute'){
 const review=read(out+'/story-review.json'),revision=review.revision,story=store.readDraft(revision);
 if(confirmation!==review.fingerprint||review.status!=='READY_FOR_CHOICE'||store.current().revision!==revision)throw Error('EXACT_REVIEW_CONFIRMATION_REQUIRED');
 if(h.scope==='technical-qa'&&storyFile!=='technical-qa')throw Error('QA_SCOPE_REQUIRED');
 if(h.scope==='private-reviewed'&&storyFile!=='human-approved')throw Error('HUMAN_APPROVAL_REQUIRED');
 if(fs.existsSync(out+'/execution.json'))throw Error('ALREADY_EXECUTED');
 const decision=await store.decide(revision,confirmation,'approve');if(!decision.decisionId)throw Error('DECISION_BLOCKED');
 const input={actor:h.scope==='technical-qa'?'qa-operator':'sues-approved-operator',projectId,storyRevision:revision,decisionId:decision.decisionId};
 const grant=await service.issue(input,{verifiedHumanSession:true});if(grant.status!=='APPROVAL_ISSUED_NOT_EXECUTED')throw Error(JSON.stringify(grant));
 const result=await service.execute({...input,approvalId:grant.approvalId});
 if(result.receipts?.length!==story.operations.length||!result.receiptPersisted)throw Error('INCOMPLETE_OPERATION_RECEIPTS_DO_NOT_RETRY');
 const receipt={schema:'sues-private-story-execution/v1',scope:h.scope,storyRevision:revision,decisionId:decision.decisionId,approvalId:grant.approvalId,projectFingerprint:projectFingerprint((await readProject()).data),result};
 write(out+'/execution.json',receipt);
 console.log(JSON.stringify({status:'EXECUTED_NOT_RENDERED',scope:h.scope,revision:result.revision,operations:result.receipts.length}));
}else if(mode==='render'){
 const receipt=read(out+'/execution.json');if(fs.existsSync(out+'/render-proof.json'))throw Error('ALREADY_RENDERED');if(receipt.projectFingerprint!==projectFingerprint(before))throw Error('PROJECT_CHANGED_AFTER_EXECUTION');
 if(before.inPoint!==0||Math.abs(before.outPoint-h.duration)>1e-6)throw Error('FULL_EXPORT_RANGE_UNVERIFIED');
 const port=7797,base='http://127.0.0.1:'+port;
 // Reject an existing listener; own the entire temporary server lifetime.
 try{await fetch(base,{signal:AbortSignal.timeout(500)});throw Error('PRIVATE_QA_PORT_BUSY')}catch(e){if(e.message==='PRIVATE_QA_PORT_BUSY')throw e}
 const qaApp='/srv/sues-fablecut-next/qa-export-app-20261109';
 const log=fs.openSync(out+'/render-server.log','a',0o600);
 const server=spawn('node',['server.js'],{cwd:qaApp,env:{...process.env,HOST:'127.0.0.1',PORT:String(port),FABLECUT_DATA_DIR:out,FABLECUT_NO_FS_WATCH:'1'},stdio:['ignore',log,log]});fs.closeSync(log);
 let browser;
 try{
  for(let i=0;i<40;i++){try{if((await fetch(base+'/api/project',{signal:AbortSignal.timeout(1000)})).ok)break}catch{}if(i===39)throw Error('SERVER_NOT_READY');await new Promise(r=>setTimeout(r,250))}
  const p=await (await fetch(base+'/api/project')).json();if(projectFingerprint(p)!==receipt.projectFingerprint)throw Error('RENDER_PROJECT_MISMATCH');
  const require=createRequire(import.meta.url),puppeteer=require('/opt/sues-video-setup/hyperframes-engine-next/node_modules/puppeteer-core');
  browser=await puppeteer.launch({headless:true,executablePath:'/root/.cache/puppeteer/chrome/linux-155.0.8059.84/chrome-linux64/chrome',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>state.connected===true,{timeout:60000});
  const exportsDir=out+'/exports',previous=new Set(fs.existsSync(exportsDir)?fs.readdirSync(exportsDir):[]);
  const ticket=await (await fetch(base+'/api/export/request',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({range:'in-out',delivery:{width:1080,height:1920,fps:30,video:{codec:'h264',crf:19},audio:{codec:'aac'}}})})).json();if(!ticket.id)throw Error('EXPORT_REQUEST_FAILED '+JSON.stringify(ticket));
  let job;const until=Date.now()+20*60*1000;
  while(Date.now()<until){job=await (await fetch(base+'/api/export/job?id='+ticket.id)).json();if(['done','failed','cancelled'].includes(job.status))break;await new Promise(r=>setTimeout(r,1500))}
  if(job?.status!=='done'||errors.length)throw Error('EXPORT_FAILED '+JSON.stringify({status:job?.status,errors}));
  const files=fs.readdirSync(exportsDir).filter(f=>f.endsWith('.mp4')&&!previous.has(f));if(files.length!==1)throw Error('EXPORT_FILE_AMBIGUOUS');
  const file=path.join(exportsDir,files[0]);if(!fs.statSync(file).isFile()||fs.statSync(file).size<1000)throw Error('EMPTY_EXPORT');const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
  const v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  if(v?.width!==1080||v.height!==1920||v.r_frame_rate!=='30/1'||Number(v.nb_read_frames)!==Math.round(h.duration*30)||!a||Math.abs(Number(v.duration)-Number(a.duration))>.05)throw Error('EXPORT_TECHNICAL_QA_FAILED');
  execFileSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{timeout:120000});
  const audioStats=await new Promise((resolve,reject)=>{const proc=spawn('ffmpeg',['-hide_banner','-nostats','-i',file,'-vn','-af','volumedetect','-f','null','-'],{stdio:['ignore','ignore','pipe']});let data='';proc.stderr.on('data',b=>data+=b);proc.on('error',reject);proc.on('close',code=>{if(code)reject(Error('AUDIO_ANALYSIS_FAILED'));else{const peak=Number(data.match(/max_volume: (-?[\d.]+) dB/)?.[1]),mean=Number(data.match(/mean_volume: (-?[\d.]+) dB/)?.[1]);if(!Number.isFinite(peak)||!Number.isFinite(mean)||mean< -55)reject(Error('SILENT_OR_UNVERIFIED_AUDIO'));else resolve({peakDb:peak,meanDb:mean})}})});
  const story=store.readDraft(receipt.storyRevision),operationAudit=story.operations.map(o=>({operationId:o.id,start:o.start,end:o.end,requiredQA:o.requiredQA,execution:receipt.result.receipts.find(r=>r.operationId===o.id)?.status??'MISSING',visualOrAudioReview:'PENDING_HUMAN_OR_SEMANTIC_SUPERVISOR'}));
  if(operationAudit.some(o=>o.execution==='MISSING'))throw Error('MISSING_OPERATION_RECEIPT');
  if(projectFingerprint((await readProject()).data)!==receipt.projectFingerprint)throw Error('PROJECT_CHANGED_DURING_RENDER');
  write(out+'/render-proof.json',{schema:'sues-private-story-render/v1',status:'TECHNICAL_QA_PASS_NOT_ARTISTIC_APPROVAL',scope:h.scope,storyRevision:receipt.storyRevision,decisionId:receipt.decisionId,job:ticket.id,file,sha256:hash(file),probe,audioStats,operationAudit,operationCount:receipt.result.receipts.length});
  console.log(JSON.stringify({status:'TECHNICAL_QA_PASS_NOT_ARTISTIC_APPROVAL',file,frames:v.nb_read_frames,duration:v.duration,scope:h.scope}));
 }finally{await browser?.close();server.kill('SIGTERM')}
}else throw Error('Use prepare | run | execute | render');
