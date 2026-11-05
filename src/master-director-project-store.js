// Append-only project drafts and decision receipts; never runs a render.
// The caller supplies current editor facts and server-owned policy; request bodies
// cannot assert resources, rules, budget, or user approvals.
import {createHash,randomBytes} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,readdirSync,lstatSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {prepareMasterDirectorSession} from './master-director-orchestration.js';
import {buildMasterDirectorReview} from './master-director-workflow.js';
import {masterDirectorFingerprint} from './master-director-gate.js';
import {buildMasterDirectorLayerGraph} from './master-director-layer-graph.js';
import {compileMasterDirectorRemotion} from './master-director-remotion-compiler.js';
import {reviewMasterDirectorHybridGraph} from './master-director-hybrid-review.js';
const sha=x=>createHash('sha256').update(x).digest('hex');
const HASH=/^[a-f0-9]{64}$/;
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
// The story compiler selects specific fields. Keep the immutable draft intact and
// block review whenever unknown envelope fields would otherwise disappear.
function unrepresentedStoryFields(story){
 const issues=[];
 const check=(value,allowed,subject)=>{
  if(!obj(value))return;
  for(const key of Object.keys(value))
   if(!allowed.includes(key))issues.push({code:'STORY_FIELD_NOT_REPRESENTED',subject:subject+'.'+key});
 };
 check(story,['schema','sourceSha256','timeline','visual','narrative','resources','operations'],'story');
 check(story.visual,['mode','referenceId'],'visual');
 check(story.narrative,['centralMessage','intendedExperience','scenes','motifs','arc'],'narrative');
 for(const [i,r] of (Array.isArray(story.resources)?story.resources:[]).entries())
  check(r,['id','source','assetId','expectedSha256','kind','creationBrief','narrativePurpose'],'resources['+i+']');
 for(const [i,o] of (Array.isArray(story.operations)?story.operations:[]).entries())
  check(o,['id','sceneId','start','end','track','renderer','effect','reason','parameters','dependsOn','requiredQA','resourceRef','motifId','speechAnchor'],'operations['+i+']');
 return issues;
}
// Compare the creative instructions that must survive story compilation.
// The original immutable draft remains authoritative for resource descriptions.
function auditStoryTranslation(story,plan){
 const issues=[],ops=Array.isArray(story.operations)?story.operations:[];
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const fields=[
  ['sourceSha256',story.sourceSha256,plan.source?.sha256],
  ['timeline',story.timeline,plan.timeline],
  ['visual.mode',story.visual?.mode,plan.creativeContext?.visualMode],
  ['visual.referenceId',story.visual?.referenceId??null,plan.creativeContext?.referenceId??null],
  ['narrative.centralMessage',story.narrative?.centralMessage,plan.creativeContext?.centralMessage],
  ['narrative.intendedExperience',story.narrative?.intendedExperience,plan.creativeContext?.intendedExperience],
  ['narrative.scenes',story.narrative?.scenes,plan.scenes],
  ['narrative.motifs',story.narrative?.motifs??[],plan.creativeContext?.motifs],
  ['narrative.arc',story.narrative?.arc??[],plan.creativeContext?.arc]
 ];
 for(const [subject,source,target] of fields)
  if(!equal(source,target))issues.push({code:'STORY_FIELD_TRANSLATION_CHANGED',subject});
 const compiled=Array.isArray(plan.operations)?plan.operations:[];
 if(ops.length!==compiled.length)return [{code:'STORY_OPERATION_COUNT_CHANGED',subject:'operations'}];
 for(let i=0;i<ops.length;i++){
  const source=ops[i],target=compiled[i];
  for(const key of ['id','sceneId','start','end','track','renderer','effect','reason','parameters','dependsOn','requiredQA','motifId','speechAnchor']){
   if(JSON.stringify(source?.[key])!==JSON.stringify(target?.[key]))
    issues.push({code:'STORY_OPERATION_FIELD_CHANGED',subject:'operations['+i+'].'+key});
  }
  if(source?.resourceRef!==undefined&&source.resourceRef!==target?.creativeResourceRef)
   issues.push({code:'STORY_RESOURCE_REFERENCE_CHANGED',subject:'operations['+i+'].resourceRef'});
 }
 return issues;
}
// Canonical hash over server-owned evidence: any substantive change invalidates
// the earlier decision. Sorting prevents false invalidation from key order.
const canonical=x=>Array.isArray(x)?x.map(canonical):obj(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;

const filename=(root,hash)=>{if(!HASH.test(hash??''))throw Error('Invalid revision');return join(root,hash+'.json');};
function immutable(root,value){
 mkdirSync(root,{recursive:true,mode:0o700});
 const bytes=JSON.stringify(value),hash=sha(bytes),path=filename(root,hash);
 try{writeFileSync(path,bytes,{mode:0o600,flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e; if(readFileSync(path,'utf8')!==bytes)throw Error('Revision collision');}
 return hash;
}
function load(root,hash){
 const bytes=readFileSync(filename(root,hash),'utf8');
 if(sha(bytes)!==hash)throw Error('Revision integrity failure');
 return JSON.parse(bytes);
}
export class MasterDirectorProjectStore{
 constructor(jobDirectory,contextProvider){this.root=join(jobDirectory,'master-director');this.contextProvider=contextProvider;}
 saveDraft(story){
  if(!obj(story)||story.schema!=='sues-master-story/v1')throw Error('Invalid story schema');
  const text=JSON.stringify(story);if(Buffer.byteLength(text)>60000)throw Error('Story too large');
  return {revision:immutable(join(this.root,'drafts'),story),rendered:false};
 }
 readDraft(revision){return load(join(this.root,'drafts'),revision);}
 listDrafts(){
  const root=join(this.root,'drafts');if(!existsSync(root))return [];
  const names=readdirSync(root);if(names.length>1000)throw Error('Too many story revisions');
  return names.filter(n=>/^[a-f0-9]{64}\.json$/.test(n)).map(n=>{
   const path=join(root,n),st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink())throw Error('Invalid story revision');
   const revision=n.slice(0,64),story=load(root,revision);
   return {revision,updatedAt:new Date(st.mtimeMs).toISOString(),title:story.narrative?.centralMessage??''};
  }).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.revision.localeCompare(b.revision));
 }

 editVisual(revision,operationId,visual){
  if(typeof operationId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(operationId)||
     !obj(visual)||Object.keys(visual).some(k=>!['rect','zIndex','opacity','typography','keyframes','mask','stack'].includes(k)))
   throw Error('Invalid visual edit');
  const story=this.readDraft(revision),matches=Array.isArray(story.operations)?story.operations.filter(o=>o?.id===operationId):[];
  if(matches.length!==1||matches[0].renderer!=='remotion'||!obj(matches[0].parameters)||!obj(matches[0].parameters.visual))
   throw Error('Editable visual operation not found');
  matches[0].parameters.visual=structuredClone(visual);
  const next=this.saveDraft(story);
  return {...next,parentRevision:revision,requiresNewReview:true};
 }

 editOperation(revision,operationId,patch){
  if(typeof operationId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(operationId)||!obj(patch)||
     !Object.keys(patch).length||Object.keys(patch).some(k=>!['start','end','parameters'].includes(k)))
   throw Error('Invalid operation edit');
  const story=this.readDraft(revision),matches=Array.isArray(story.operations)?story.operations.filter(o=>o?.id===operationId):[];
  if(matches.length!==1||matches[0].renderer!=='remotion')throw Error('Editable operation not found');
  const op=matches[0],start=Object.hasOwn(patch,'start')?patch.start:op.start,end=Object.hasOwn(patch,'end')?patch.end:op.end;
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||!Number.isFinite(story.timeline?.duration)||end>story.timeline.duration)
   throw Error('Invalid operation timing');
  if(Object.hasOwn(patch,'parameters')&&(!obj(patch.parameters)||Buffer.byteLength(JSON.stringify(patch.parameters))>24000))throw Error('Invalid operation parameters');
  op.start=start;op.end=end;if(Object.hasOwn(patch,'parameters'))op.parameters=structuredClone(patch.parameters);
  const next=this.saveDraft(story);return {...next,parentRevision:revision,requiresNewReview:true};
 }
 async prepare(revision){
  const story=this.readDraft(revision);
  const unrepresented=unrepresentedStoryFields(story);
  if(unrepresented.length)
   return {response:{status:'BLOCKED',revision,issues:unrepresented,canExecute:false}};
  const context=await this.contextProvider(story);
  if(Array.isArray(context?.blockedIssues)&&context.blockedIssues.length)
   return {response:{status:'BLOCKED',revision,issues:context.blockedIssues,canExecute:false}};
  if(!context||!obj(context.registry)||!Array.isArray(context.rulebook))
   return {response:{status:'BLOCKED',revision,issues:[{code:'TRUSTED_SERVER_CONTEXT_UNAVAILABLE'}],canExecute:false}};
  if(story.sourceSha256!==context.sourceSha256||story.timeline?.fingerprint!==context.timelineFingerprint||
     !Number.isFinite(context.duration)||story.timeline?.duration!==context.duration)
   return {response:{status:'BLOCKED',revision,issues:[{code:'PROJECT_VERSION_CHANGED'}],canExecute:false}};
  const registry={...context.registry,sourceSha256:context.sourceSha256,timelineFingerprint:context.timelineFingerprint};
  delete registry.approvedPlanFingerprint;delete registry.planChoice;delete registry.qaPasses;
  const result=prepareMasterDirectorSession({story,registry,rulebook:context.rulebook});
  if(!result.plan)return {response:{...result,revision,canExecute:false}};
  const translationIssues=auditStoryTranslation(story,result.plan);
  if(translationIssues.length)return {response:{status:'BLOCKED',revision,issues:translationIssues,canExecute:false}};
  // Bind approval to every byte of the immutable source story, including metadata
  // not required by a specific renderer, without trusting it as authorization.
  result.plan.storyRevision=revision;
  result.plan.trustedContextFingerprint=sha(JSON.stringify(canonical({registry,rulebook:context.rulebook})));
  // Offline capability preflight uses a temporary fingerprint only to inspect
  // structure; it does not record an approval, execute a job or authorize costs.
  const inspectionRegistry={...registry,approvedPlanFingerprint:masterDirectorFingerprint(result.plan)};
  const structural=buildMasterDirectorLayerGraph(result.plan,inspectionRegistry);
  if(structural.status!=='STRUCTURE_READY_NOT_RENDERED')
   return {response:{status:'BLOCKED',revision,issues:structural.issues??[],canExecute:false}};
  const remotionNodes=structural.graph.nodes.filter(node=>node.renderer==='remotion');
  if(remotionNodes.length){
   const staged=compileMasterDirectorRemotion({...structural.graph,nodes:remotionNodes},{
    verifiedFonts:registry.verifiedFonts??{},verifiedAssets:registry.licensedAssets??{},
    verifiedMasks:registry.maskEvidence??{}});
   if(staged.status!=='READY_FOR_REMOTION_STAGING')
    return {response:{status:'BLOCKED',revision,issues:staged.issues??[],canExecute:false}};
  }
  if(result.plan.operations.some(op=>op.renderer==='native')){
   if(typeof context.nativePreflight!=='function')
    return {response:{status:'BLOCKED',revision,issues:[{code:'NATIVE_PREFLIGHT_UNAVAILABLE'}],canExecute:false}};
   const checked=await context.nativePreflight(result.plan,inspectionRegistry);
   const mixed=result.plan.operations.some(op=>op.renderer==='remotion');
   const expected=mixed?'HYBRID_NATIVE_PART_REVIEWED_NOT_EXECUTABLE':'READY_FOR_EDITOR_PREVIEW';
   if(checked?.status!==expected)
    return {response:{status:'BLOCKED',revision,issues:checked?.issues?.length?checked.issues:[{code:'NATIVE_PREFLIGHT_REJECTED'}],canExecute:false}};
   // Mask proof applies to the original, not automatically to the derived
   // native child in a mixed handoff. Do not solicit approval for an impossible handoff.
   if(mixed&&structural.graph.nodes.some(n=>n.renderer==='remotion'&&n.visual?.mask))
    return {response:{status:'BLOCKED',revision,issues:[{code:'HYBRID_MASK_NEEDS_DERIVED_SOURCE_PROOF'}],canExecute:false}};
  }
  const view=buildMasterDirectorReview(result.plan,registry);
  return {response:{...view,revision,canExecute:false,projectFingerprint:context.timelineFingerprint},plan:result.plan,registry};
 }
 async review(revision){return (await this.prepare(revision)).response;}
 async approved(revision,decisionId){
  const receipt=load(join(this.root,'decisions'),decisionId),prepared=await this.prepare(revision),view=prepared.response;
  if(receipt.revision!==revision||!['approve','autonomous'].includes(receipt.mode)||
     view.status!=='READY_FOR_CHOICE'||receipt.fingerprint!==view.fingerprint||receipt.projectFingerprint!==view.projectFingerprint)
   return null;
  return {plan:prepared.plan,registry:{...prepared.registry,approvedPlanFingerprint:view.fingerprint},view,mode:receipt.mode};
 }
 async layers(revision,decisionId){
  const approved=await this.approved(revision,decisionId);
  if(!approved)return {status:'BLOCKED',issues:[{code:'APPROVAL_OR_PROJECT_CHANGED'}],graph:null};
  const {plan,registry}=approved;
  const result=buildMasterDirectorLayerGraph(plan,registry);
  if(!result.graph)return {...result,revision,canExecute:false};
  const graphRevision=immutable(join(this.root,'layer-graphs'),result.graph);
  // Immutable provenance is linked to the original draft and graph; it is an
  // expected mapping, not proof that any renderer executed an operation.
  const story=this.readDraft(revision),originals=new Map(story.operations.map(o=>[o.id,o]));
  const trace={schema:'sues-master-trace/v1',status:'PLANNED_NOT_EXECUTED',storyRevision:revision,
   graphRevision,planFingerprint:result.graph.planFingerprint,timelineFingerprint:result.graph.timelineFingerprint,
   operations:result.graph.nodes.map(node=>({operationId:node.id,renderer:node.renderer,
    graphNodeId:node.id,startFrame:node.startFrame,endFrame:node.endFrame,
    original:structuredClone(originals.get(node.id)),dependencies:[...node.dependencies],
    resource:node.resource,requiredQA:[...node.requiredQA]}))};
  const manifestRevision=immutable(join(this.root,'traces'),trace);
  const remotion=compileMasterDirectorRemotion(result.graph,{verifiedFonts:registry.verifiedFonts??{},verifiedAssets:registry.licensedAssets??{},verifiedMasks:registry.maskEvidence??{}});
  const hybrid=result.graph.nodes.some(n=>n.renderer==='native')&&result.graph.nodes.some(n=>n.renderer==='remotion')?
   reviewMasterDirectorHybridGraph(result.graph,{verifiedFonts:registry.verifiedFonts??{},verifiedAssets:registry.licensedAssets??{},verifiedMasks:registry.maskEvidence??{}}):null;
  // Remotion-only preview remains deliberately BLOCKED for mixed plans: never drop native operations.
  return {...result,revision,graphRevision,manifestRevision,remotion,...(hybrid?{hybrid}:{}),canExecute:false};
 }
 async trace(revision,decisionId,manifestRevision){
  const layers=await this.layers(revision,decisionId);
  if(layers.status!=='STRUCTURE_READY_NOT_RENDERED'||layers.manifestRevision!==manifestRevision)
   return {status:'BLOCKED',issues:[{code:'TRACE_OR_APPROVAL_CHANGED'}]};
  return {status:'PLANNED_NOT_EXECUTED',manifest:load(join(this.root,'traces'),manifestRevision)};
 }
 async decide(revision,fingerprint,mode){
  if(!HASH.test(fingerprint??'')||!['review','approve','autonomous'].includes(mode))throw Error('Invalid decision');
  const result=await this.review(revision);
  if(result.status!=='READY_FOR_CHOICE'||result.fingerprint!==fingerprint)
   return {status:'BLOCKED',issues:[{code:'PLAN_OR_PROJECT_CHANGED'}],canExecute:false};
  const receipt={schema:'sues-master-decision/v1',revision,fingerprint,mode,projectFingerprint:result.projectFingerprint,
    createdAt:new Date().toISOString(),nonce:randomBytes(16).toString('hex')};
  const decisionId=immutable(join(this.root,'decisions'),receipt);
  return {status:mode==='review'?'REVIEW_REQUESTED':'DECISION_RECORDED',decisionId,revision,fingerprint,mode,
    canExecute:false,reason:'Execution requires a trusted backend capability and an explicit cost check.'};
 }
}
