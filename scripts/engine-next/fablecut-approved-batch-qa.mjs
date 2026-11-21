// Real MasterDirectorProjectStore + existing persistent ledger + actual MCP.
// Technical QA only, not a human creative approval for any published Reel.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
import {MasterDirectorProjectStore} from '../../src/master-director-project-store.js';
import {DirectorApprovalLedger} from '../../src/engine-next/fablecut-director-approval-ledger.js';
import {createApprovedBatchService} from '../../src/engine-next/fablecut-approved-batch.js';
import {prepareStoryBatch,applyCommandBatch,projectFingerprint} from '../../src/engine-next/fablecut-command-batch.js';
const [engine,source,dest]=process.argv.slice(2),base=fs.realpathSync(source),out=path.resolve(dest);
if(!base.includes('/automation-v1/test-project-')||path.dirname(out)!==path.dirname(base)||fs.existsSync(out))throw Error('Private QA only');
fs.mkdirSync(out,{mode:0o700});fs.mkdirSync(out+'/media');
for(const f of fs.readdirSync(base+'/media'))fs.symlinkSync(fs.realpathSync(base+'/media/'+f),out+'/media/'+f);
fs.copyFileSync(base+'/project.json',out+'/project.json');
const native=createRequire(import.meta.url)(path.join(engine,'project-ops.js')),projectId='p_private_batch_qa';
const call=(name,args)=>{
 const input=JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})+'\n';
 const raw=execFileSync('node',[path.join(engine,'mcp-server.js')],{input,encoding:'utf8',env:{...process.env,FABLECUT_DATA_DIR:out,FABLECUT_PORT:'7786'},timeout:20000});
 const r=raw.trim().split('\n').map(x=>JSON.parse(x)).find(x=>x.id===1);
 if(r?.result?.isError||!r?.result?.content?.[0]?.text)throw Error(r?.result?.content?.[0]?.text??'Invalid MCP response');return r.result.content[0].text;
};
const readProject=async()=>({projectId,data:JSON.parse(call('fablecut_get_project',{}))});
const p=(await readProject()).data,fp=projectFingerprint(p),audio=p.clips.find(c=>c.track==='A2'),visual=p.clips.find(c=>c.track==='V2');
const sha='a'.repeat(64),master='b'.repeat(64),timeline='c'.repeat(64);
const registry={brandId:'sues',profileId:'DOPAMIN',projectId:'qa',approvedRuleVersion:'rules-v1',approvedRuleIds:['r1'],requiredRuleKeys:['brand.background'],approvedReferenceIds:[],masterHashes:{tapiz:master},lockedMastersByMode:{'brand-sues':[{id:'tapiz',sha256:master}]},rendererCapabilities:{native:['fablecut-command-exact-v1']},licensedAssets:{},unresolvedRuleConflicts:[],canvas:{width:1080,height:1920},nativeTrackRoles:{A2:'sfx',V2:'graphics'},projectFingerprint:fp};
const story={schema:'sues-master-story/v1',sourceSha256:sha,timeline:{fingerprint:timeline,timeSpace:'edit-timeline',fps:30,duration:3},visual:{mode:'brand-sues'},narrative:{centralMessage:'Prueba técnica privada',intendedExperience:'Comprobar edición exacta',scenes:[{id:'s1',start:0,end:3,purpose:'Comprobar dos cambios exactos'}]},resources:[],operations:[
 {id:'transform',sceneId:'s1',start:visual.start,end:visual.start+visual.duration,track:'graphics',renderer:'native',effect:'fablecut-command-exact-v1',reason:'Comprobar posición exacta',parameters:{command:{action:'set_transform',clipId:visual.id,x:12}},dependsOn:[],requiredQA:['rendered-frame','motion-playback','narrative-review']},
 {id:'fade',sceneId:'s1',start:visual.start+visual.duration-.2,end:visual.start+visual.duration,track:'graphics',renderer:'native',effect:'fablecut-command-exact-v1',reason:'Comprobar salida exacta',parameters:{command:{action:'transition',clipId:visual.id,side:'out',type:'fade',duration:.2}},dependsOn:['transform'],requiredQA:['rendered-frame','motion-playback','narrative-review']}]};
const resolver=()=>null;
const store=new MasterDirectorProjectStore(out,async s=>({sourceSha256:sha,timelineFingerprint:timeline,duration:3,registry,rulebook:[{id:'r1',key:'brand.background',scope:'global',authority:'explicit-user-approval',status:'approved',value:'anthracite',supersedes:[]}],nativePreflight:async(plan,r)=>{
 const candidate=await prepareStoryBatch(s,{registry:{...r,projectFingerprint:fp,nativeTrackRoles:registry.nativeTrackRoles},project:p,authorize:async()=>true});
 if(candidate.status!=='PREPARED_NOT_EXECUTED')return candidate;
 applyCommandBatch(p,candidate.request,{native,resolveAsset:resolver});return {status:'READY_FOR_EDITOR_PREVIEW'};
}}));
const {revision}=store.saveDraft(story);store.setCurrent(revision,null);
const review=await store.review(revision);if(review.status!=='READY_FOR_CHOICE')throw Error(JSON.stringify(review));
const decision=await store.decide(revision,review.fingerprint,'approve');
const ledger=new DirectorApprovalLedger({directory:out+'/approvals'});
const service=createApprovedBatchService({ledger,resolveContext:async()=>({nativeProjectId:projectId,privateClone:true,store,nativeFingerprint:fp,nativeTrackRoles:registry.nativeTrackRoles}),readProject,native,resolveAsset:resolver,stageAssets:async a=>{if(a.length)throw Error('Unexpected assets')},invokeMcp:async(n,a)=>call(n,a)});
const input={actor:'qa-admin',projectId,storyRevision:revision,decisionId:decision.decisionId};
let denied=0;
for(const attempt of [{...input,decisionId:'0'.repeat(64)},input]){try{await service.issue(attempt);throw Error('unexpected approval')}catch(e){if(e.message==='unexpected approval')throw e;denied++}}
const issued=await service.issue(input,{verifiedHumanSession:true});
if(issued.status!=='APPROVAL_ISSUED_NOT_EXECUTED'||projectFingerprint((await readProject()).data)!==fp)throw Error('Issue changed project');
const result=await service.execute({...input,approvalId:issued.approvalId});
try{await service.execute({...input,approvalId:issued.approvalId});throw Error('unexpected replay')}catch(e){if(e.message==='unexpected replay')throw e;denied++}
const after=(await readProject()).data;
if(after.clips.find(c=>c.id===visual.id).props.x!==12||after.clips.find(c=>c.id===visual.id).transitionOut.duration!==.2)throw Error('Readback wrong');
fs.writeFileSync(out+'/approved-batch-proof.json',JSON.stringify({result,denied,decision,technicalQAOnly:true,originalUnchanged:projectFingerprint(JSON.parse(fs.readFileSync(base+'/project.json')))===fp},null,2));
console.log(JSON.stringify({revision:result.revision,receipts:result.receipts,denied,technicalQAOnly:true}));
