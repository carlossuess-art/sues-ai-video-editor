// SUES MASTER DIRECTOR: bounded story contract, not a renderer or an asset generator.
export const STORY_SCHEMA='sues-master-story/v1';
export const TRACKS=['camera','subject','broll','graphics','captions','music','sfx','voice','transition'];
const QA=['rendered-frame','motion-playback','audio-playback','time-sync','narrative-review'];
const REQUIRED={broll:['rendered-frame','motion-playback','narrative-review'],
 graphics:['rendered-frame','motion-playback','narrative-review'],
 sfx:['audio-playback','time-sync'],music:['audio-playback','time-sync'],voice:['audio-playback','time-sync'],
 camera:['rendered-frame','time-sync'],subject:['rendered-frame','motion-playback'],
 captions:['rendered-frame','time-sync'],transition:['rendered-frame','motion-playback']};
const PRECEDENCE=['safety-and-rights','explicit-user-approval','locked-masters','project','profile','scene'];
const SHA=/^[a-f0-9]{64}$/;
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(x);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const phrase=x=>typeof x==='string'&&x.trim().length>=5;
const issue=(list,code,subject='story')=>list.push({code,subject});
const unique=a=>Array.isArray(a)&&new Set(a).size===a.length;
export function inspectMasterDirectorStory(story,registry={}){
 const issues=[],assetRequests=[],resolved={};
 if(!obj(story)||story.schema!==STORY_SCHEMA){
  issue(issues,'INVALID_STORY_SCHEMA');return {status:'BLOCKED',issues,assetRequests};
 }
 if(!SHA.test(story.sourceSha256??'')||registry.sourceSha256!==story.sourceSha256)
  issue(issues,'SOURCE_NOT_VERIFIED');
 const t=story.timeline??{};
 if(!id(t.fingerprint)||registry.timelineFingerprint!==t.fingerprint||
    t.timeSpace!=='edit-timeline'||t.fps!==30||
    !Number.isFinite(t.duration)||t.duration<=0||t.duration>3600)
  issue(issues,'TIMELINE_NOT_VERIFIED');
 const mode=story.visual?.mode;
 if(!['brand-sues','reference-exact'].includes(mode))issue(issues,'VISUAL_MODE_UNKNOWN');
 if(mode==='reference-exact'&&(!id(story.visual.referenceId)||
    !registry.approvedReferenceIds?.includes(story.visual.referenceId)))
  issue(issues,'REFERENCE_NOT_AUTHORIZED');
 const masters=registry.lockedMastersByMode?.[mode];
 if(!Array.isArray(masters)||!masters.length||masters.some(m=>!id(m?.id)||
    !SHA.test(m?.sha256??'')||registry.masterHashes?.[m.id]!==m.sha256))
  issue(issues,'MASTERS_NOT_VERIFIED');
 if(!id(registry.approvedRuleVersion))issue(issues,'RULE_VERSION_NOT_VERIFIED');
 if(!Array.isArray(registry.unresolvedRuleConflicts))
  issue(issues,'RULE_CONFLICT_AUDIT_MISSING');
 else if(registry.unresolvedRuleConflicts.length)
  issue(issues,'UNRESOLVED_RULE_CONFLICTS');
 const n=story.narrative??{};
 if(!phrase(n.centralMessage)||!phrase(n.intendedExperience))issue(issues,'NARRATIVE_INTENT_MISSING');
 const scenes=Array.isArray(n.scenes)?n.scenes:[],byScene=new Map();let cursor=0;
 if(!scenes.length||scenes.length>300)issue(issues,'SCENES_MISSING');
 for(const s of scenes){
  if(!id(s?.id)||byScene.has(s.id)){issue(issues,'SCENE_ID_INVALID',s?.id??'unknown');continue}
  byScene.set(s.id,s);
  if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||
     Math.abs(s.start-cursor)>1e-6||s.end>t.duration+1e-6||!phrase(s.purpose))
    issue(issues,'SCENE_TIMING_INVALID',s.id);
  if(Number.isFinite(s.end))cursor=s.end;
 }
 if(!Number.isFinite(t.duration)||Math.abs(cursor-t.duration)>1e-6)
  issue(issues,'SCENE_COVERAGE_INCOMPLETE');
 const motifs=Array.isArray(n.motifs)?n.motifs:[],byMotif=new Map();
 for(const m of motifs){
  if(!id(m?.id)||byMotif.has(m.id)){issue(issues,'MOTIF_ID_INVALID',m?.id??'unknown');continue}
  byMotif.set(m.id,m);
  const a=byScene.get(m.setupSceneId),b=byScene.get(m.payoffSceneId);
  if(!a||!b||a.start>=b.start||!phrase(m.meaning))issue(issues,'MOTIF_ARC_INVALID',m.id);
 }
 const resources=Array.isArray(story.resources)?story.resources:[],byResource=new Map();
 for(const r of resources){
  if(!id(r?.id)||byResource.has(r.id)){issue(issues,'RESOURCE_ID_INVALID',r?.id??'unknown');continue}
  byResource.set(r.id,r);
  if(r.source==='library'){
   const a=registry.licensedAssets?.[r.assetId];
   if(!id(r.assetId)||!SHA.test(r.expectedSha256??'')||!a||
      a.sha256!==r.expectedSha256||a.rightsVerified!==true||a.commercialUseAllowed!==true)
    issue(issues,'LIBRARY_ASSET_UNVERIFIED',r.id);
   else resolved[r.id]={assetId:r.assetId,sha256:a.sha256};
  }else if(r.source==='generate'){
   if(!['image','video','motion','sfx','music','graphic'].includes(r.kind)||!phrase(r.creationBrief))
    issue(issues,'CREATION_BRIEF_INVALID',r.id);
   const g=registry.generatedAssets?.[r.id],a=g&&registry.licensedAssets?.[g.assetId];
   if(!g||!a||a.sha256!==g.sha256||!SHA.test(a.sha256??'')||
      a.rightsVerified!==true||a.commercialUseAllowed!==true)
    assetRequests.push({id:r.id,kind:r.kind,creationBrief:r.creationBrief,
      narrativePurpose:r.narrativePurpose??'',status:'CREATION_OR_VERIFICATION_REQUIRED'});
   else resolved[r.id]={assetId:g.assetId,sha256:a.sha256};
  }else issue(issues,'RESOURCE_SOURCE_INVALID',r.id);
 }
 const operations=Array.isArray(story.operations)?story.operations:[],byOp=new Map();
 if(!operations.length||operations.length>1500)issue(issues,'OPERATIONS_MISSING');
 for(const o of operations){
  if(!id(o?.id)||byOp.has(o.id)){issue(issues,'OPERATION_ID_INVALID',o?.id??'unknown');continue}
  byOp.set(o.id,o);
  const s=byScene.get(o.sceneId);
  if(!s||!Number.isFinite(o.start)||!Number.isFinite(o.end)||o.end<=o.start||
     o.start<s.start-1e-6||o.end>s.end+1e-6)
   issue(issues,'OPERATION_OUTSIDE_SCENE',o.id);
  if(!TRACKS.includes(o.track)||!id(o.effect)||!id(o.renderer)||
     !registry.rendererCapabilities?.[o.renderer]?.includes(o.effect))
   issue(issues,'CAPABILITY_UNVERIFIED',o.id);
  if(!phrase(o.reason))issue(issues,'REASON_MISSING',o.id);
  if(!obj(o.parameters))issue(issues,'PARAMETERS_MISSING',o.id);
  if(!Array.isArray(o.dependsOn)||!o.dependsOn.every(id)||!unique(o.dependsOn))
   issue(issues,'DEPENDENCIES_INVALID',o.id);
  if(!Array.isArray(o.requiredQA)||!o.requiredQA.length||!unique(o.requiredQA)||
     !o.requiredQA.every(k=>QA.includes(k))||
     !(REQUIRED[o.track]??[]).every(k=>o.requiredQA.includes(k)))
   issue(issues,'QA_INSUFFICIENT',o.id);
  // A media or audio operation can never pass as executable without a real asset.
  if(['broll','music','sfx'].includes(o.track)&&o.resourceRef===undefined)
   issue(issues,'MEDIA_ASSET_REQUIRED',o.id);
  if(o.resourceRef!==undefined&&!byResource.has(o.resourceRef))
   issue(issues,'UNKNOWN_RESOURCE',o.id);
  if(o.motifId!==undefined&&!byMotif.has(o.motifId))
   issue(issues,'UNKNOWN_MOTIF',o.id);
  if(o.speechAnchor!==undefined){
   const a=o.speechAnchor,w=registry.wordAnchors?.[a?.wordId];
   const at=w&&Number.isFinite(w.time)&&Number.isInteger(a?.offsetFrames)?
     w.time+a.offsetFrames/t.fps:NaN;
   if(!id(a?.wordId)||!w||!Number.isInteger(a.offsetFrames)||Math.abs(a.offsetFrames)>90||
      !Number.isFinite(at)||at<o.start-1/t.fps||at>o.end+1/t.fps)
    issue(issues,'SPEECH_ANCHOR_UNVERIFIED',o.id);
  }
 }
 for(const m of byMotif.values()){
  const use=operations.filter(o=>o?.motifId===m.id);
  if(!use.some(o=>o.sceneId===m.setupSceneId)||!use.some(o=>o.sceneId===m.payoffSceneId))
   issue(issues,'MOTIF_NOT_EXECUTED_BOTH_SIDES',m.id);
 }
 const seen=new Set(),path=new Set();
 function visit(k){
  if(seen.has(k))return;
  if(path.has(k)){issue(issues,'DEPENDENCY_CYCLE',k);return}
  path.add(k);
  for(const dep of byOp.get(k)?.dependsOn??[]){
   if(!byOp.has(dep))issue(issues,'DEPENDENCY_MISSING',k);else visit(dep);
  }
  path.delete(k);seen.add(k);
 }
 for(const k of byOp.keys())visit(k);
 return {status:issues.length?'BLOCKED':assetRequests.length?'NEEDS_RESOURCES':'READY_FOR_PLAN_REVIEW',
   issues,assetRequests,resolvedAssets:resolved,lockedMasters:masters??[]};
}
export function compileMasterDirectorStory(story,registry={}){
 const r=inspectMasterDirectorStory(story,registry);
 if(r.status!=='READY_FOR_PLAN_REVIEW')return {...r,plan:null};
 const plan={
  schema:'sues-master-director/v1',
  source:{sha256:story.sourceSha256,type:'original',editable:true,flattened:false},
  timeline:{...story.timeline},
  rules:{version:registry.approvedRuleVersion,precedence:[...PRECEDENCE],
   unresolvedConflicts:[],lockedMasters:r.lockedMasters.map(m=>({id:m.id,sha256:m.sha256}))},
  creativeContext:{visualMode:story.visual.mode,referenceId:story.visual.referenceId??null,
   centralMessage:story.narrative.centralMessage,intendedExperience:story.narrative.intendedExperience,
   motifs:story.narrative.motifs??[]},
  scenes:story.narrative.scenes.map(s=>({...s})),
  operations:story.operations.map(o=>({
   id:o.id,sceneId:o.sceneId,start:o.start,end:o.end,renderer:o.renderer,effect:o.effect,
   reason:o.reason,dependsOn:[...o.dependsOn],requiredQA:[...o.requiredQA],track:o.track,
   parameters:{...o.parameters},
   ...(o.resourceRef!==undefined?{resourceId:r.resolvedAssets[o.resourceRef].assetId,
    resourceSha256:r.resolvedAssets[o.resourceRef].sha256,creativeResourceRef:o.resourceRef}:{}),
   ...(o.motifId!==undefined?{motifId:o.motifId}:{}),
   ...(o.speechAnchor!==undefined?{speechAnchor:{...o.speechAnchor}}:{})
  }))
 };
 return {status:'READY_FOR_PLAN_REVIEW',issues:[],assetRequests:[],plan};
}
