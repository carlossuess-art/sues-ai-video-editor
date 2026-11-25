// TAV-01 native MCP plan guard, generated from the canonical Director helper.
// Structural check only: never grants a creative decision or a ledger approval.
"use strict";
const {createHash}=require("node:crypto");
const hash=x=>createHash("sha256").update(JSON.stringify(x)).digest("hex");
const valid=x=>typeof x==="string"&&x.trim().length>0;
const note=(issues,code,subject)=>issues.push({code,subject});
// TAV-01: scene-boundary A/V pairs; host evidence must be tied to the actual story.
function reviewSceneTransitions(story, evidence = {}) {
 const issues=[],scenes=story?.narrative?.scenes??[],ops=story?.operations??[];
 if(!Array.isArray(scenes)||!Array.isArray(ops))return [{code:'SCENE_TRANSITION_INPUT_INVALID',subject:'story'}];
 const frame=1/(story?.timeline?.fps||30),eps=1e-6,fp=hash(story);
 const pairs=Array.isArray(evidence.pairs)?evidence.pairs:[];
 const usedVisual=new Set(),usedSound=new Set();
 for(let i=0;i<scenes.length-1;i++){
  const a=scenes[i],b=scenes[i+1],at=a?.end,key=(a?.id??'unknown')+':'+(b?.id??'unknown');
  const candidates=pairs.filter(p=>p?.fromSceneId===a?.id&&p?.toSceneId===b?.id);
  const p=candidates[0],v=ops.find(o=>o?.id===p?.visualOperationId),s=ops.find(o=>o?.id===p?.sfxOperationId);
  const near=o=>o&&Number.isFinite(o.start)&&Number.isFinite(o.end)&&o.end>o.start&&
   [a?.id,b?.id].includes(o.sceneId)&&o.start<=at+frame+eps&&o.end>=at-frame-eps;
  if(candidates.length!==1||!Number.isFinite(at)||!Number.isFinite(b?.start)||Math.abs(at-b.start)>eps||
    evidence.storyFingerprint!==fp||!Number.isFinite(p?.boundaryTime)||Math.abs(p.boundaryTime-at)>frame+eps||
    v?.track!=='transition'||s?.track!=='sfx'||!valid(s?.resourceRef)||v.id===s.id||
    !near(v)||!near(s)||Math.max(v.start,s.start)>Math.min(v.end,s.end)+frame+eps||
    usedVisual.has(v.id)||usedSound.has(s.id)||!valid(p?.direction)||!valid(p?.emotion)||!valid(p?.syncIntent)){
    note(issues,'SCENE_TRANSITION_AV_PAIR_MISSING',key);continue;
  }
  usedVisual.add(v.id);usedSound.add(s.id);
 }
 return issues;
}


function reviewMobileDirectorContext(context,project,activeId,baseRevision,ops){
 if(!context||!/^p_[A-Za-z0-9_-]{2,96}$/.test(context.projectId??"")||
    activeId!==context.projectId||!Number.isInteger(baseRevision)||
    project.revision!==baseRevision||hash(project)!==context.baseFingerprint)
  throw Error("DIRECTOR_MOBILE_PROJECT_BINDING_STALE");
 const story=context.story,evidence=context.evidence;
 if(story?.schema!=="sues-master-story/v1"||!Array.isArray(story.narrative?.scenes)||
    !story.narrative.scenes.length||!Array.isArray(story.operations)||!evidence||
    story.timeline?.fps!==project.fps||evidence.storyFingerprint!==hash(story))
  throw Error("DIRECTOR_MOBILE_STORY_CONTEXT_REQUIRED");
 if(ops!==undefined&&(!Array.isArray(ops)||!ops.length||hash(ops)!==context.patchFingerprint||
    ops.some(o=>o?.force===true)))
  throw Error("DIRECTOR_MOBILE_PATCH_BINDING_INVALID");
 const issues=reviewSceneTransitions(story,evidence);
 return {status:issues.length?"BLOCKED":"SCENE_TRANSITIONS_READY_NOT_APPROVAL",
  projectId:activeId,baseRevision,storyFingerprint:hash(story),issues};
}
module.exports={reviewMobileDirectorContext};
