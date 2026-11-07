// Fail-closed bridge between the Film Director technical annex and a separately
// authored sues-master-story/v1. No guessed visual effects or assets are inserted.
// A successful mapping is only structural review; it does not grant render rights.
import {createHash} from 'node:crypto';
import {checkFilmBriefIntentMapping} from './master-director-brief-semantic.js';
const hash=x=>createHash('sha256').update(x).digest('hex');
const blocked=(code,details={})=>({status:'BLOCKED',code,...details,approved:false,canExecute:false});
export function auditMasterBriefCrosswalk({annex,story,links}={}){
 if(annex?.schema!=='sues-master-film-brief-translation/v1'||
    annex.status!=='COMPLETE_TECHNICAL_ANNEX_NOT_IMPORTABLE'||
    annex.canExecute!==false||annex.approved!==false||
    annex.translationCoverage?.lostLines!==0||
    !Array.isArray(annex.operationIntents)||!Array.isArray(annex.scenes)||
    !Array.isArray(annex.allSourceLines)||annex.instructionCoverage?.unaccountedNonemptyLines?.length!==0||
    annex.translationCoverage.preservedLines!==annex.allSourceLines.length)
  return blocked('UNTRUSTED_OR_INCOMPLETE_ANNEX');
 if(story?.schema!=='sues-master-story/v1'||
    story.sourceSha256!==annex.sourceSha256||story.timeline?.fingerprint!==annex.timelineFingerprint||
    story.timeline?.fps!==annex.fps||story.timeline?.timeSpace!=='edit-timeline'||
    Math.abs(story.timeline?.duration-annex.duration)>1e-6)
  return blocked('STORY_SOURCE_OR_TIMELINE_CHANGED');
 if(!Array.isArray(story.narrative?.scenes)||
    story.narrative.scenes.length!==annex.scenes.length||
    !annex.scenes.every((scene,i)=>{
      const target=story.narrative.scenes[i];
      return target?.id===scene.id&&Math.abs(target.start-scene.editStart)<1e-6&&
       Math.abs(target.end-scene.editEnd)<1e-6;
    }))return blocked('STORY_SCENE_STRUCTURE_LOST');
 if(!Array.isArray(story.operations)||!Array.isArray(links)||story.operations.length>1500||links.length>1500)
  return blocked('TRANSLATION_OPERATION_MAPPING_REQUIRED');
 const ids=new Set();
 for(const op of story.operations){
  if(!op||typeof op.id!=='string'||ids.has(op.id))return blocked('STORY_OPERATION_ID_INVALID');
  ids.add(op.id);
 }
 const required=new Set(annex.operationIntents.map(item=>item.id));
 if(required.size!==annex.operationIntents.length)return blocked('ANNEX_INTENT_DUPLICATE');
 const mapped=new Set(),usedOps=new Set(),pending=[],intentById=new Map(annex.operationIntents.map(x=>[x.id,x]));
 for(const link of links){
  if(!link||typeof link.intentId!=='string'||!required.has(link.intentId)||mapped.has(link.intentId)||
   !['mapped','blocked','context'].includes(link.status)||
   !Array.isArray(link.operationIds)||link.operationIds.some(id=>typeof id!=='string')||
   (link.status==='mapped'&&!link.operationIds.length)||
   (link.status!=='mapped'&&link.operationIds.length)||
   (link.status==='context'&&intentById.get(link.intentId)?.track!=='document-context'))return blocked('INVALID_INTENT_MAPPING');
  mapped.add(link.intentId);
  if(link.status==='blocked'){
   if(typeof link.reason!=='string'||link.reason.trim().length<5)return blocked('UNJUSTIFIED_BLOCKED_INTENT');
   pending.push({intentId:link.intentId,reason:link.reason});
  }else if(link.status==='context'){
   if(typeof link.reason!=='string'||link.reason.trim().length<5)return blocked('UNJUSTIFIED_CONTEXT_INTENT');
  }else for(const id of link.operationIds){
   if(!ids.has(id))return blocked('INTENT_MAPPED_TO_UNKNOWN_OPERATION',{intentId:link.intentId,operationId:id});
   const operation=story.operations.find(op=>op.id===id),intent=intentById.get(link.intentId);
   if(intent.sceneId&&operation.sceneId!==intent.sceneId||
      intent.track!=='editorial-direction'&&operation.track!==intent.track||
      Number.isFinite(intent.editStart)&&(operation.start<intent.editStart-1/30-1e-6||
       operation.end>intent.editEnd+1/30+1e-6))
    return blocked('INTENT_OPERATION_SEMANTIC_OR_TIME_MISMATCH',{intentId:link.intentId,operationId:id});
   const semanticIssue=checkFilmBriefIntentMapping(intent,operation,story);
   if(semanticIssue)return blocked(semanticIssue,{intentId:link.intentId,operationId:id});
   usedOps.add(id);
  }
 }
 for(const id of required)if(!mapped.has(id))pending.push({intentId:id,reason:'Elaboración técnica de esta intención pendiente'});
 const orphan=story.operations.filter(op=>!usedOps.has(op.id)).map(op=>op.id);
 if(orphan.length)return blocked('UNTRACED_EXECUTABLE_OPERATION',{orphanOperations:orphan});
 if(pending.length)return blocked('TRANSLATION_INTENTS_PENDING',{
  pendingIntents:pending,mappedIntents:mapped.size-pending.length,
  totalIntents:required.size,sourceBriefSha256:annex.sourceBriefSha256,
  sourceOriginalSha256:annex.originalSha256});
 const audit={schema:'sues-master-brief-crosswalk/v1',status:'MAPPED_NEEDS_TRUSTED_REVIEW',
  planSha256:hash(JSON.stringify(story)),sourceBriefSha256:annex.sourceBriefSha256,
  mappedIntents:required.size,storyOperations:story.operations.length,
  lostLines:0,creativeApproved:false,approved:false,canExecute:false,
  next:'NORMAL_STORY_REVIEW_WITH_SERVER_OWNED_CAPABILITIES_RESOURCES_RIGHTS_AND_FINGERPRINT'};
 return audit;
}
