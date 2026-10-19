const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};

export const AI_ADJUSTMENT_SCOPES=Object.freeze([
  'global','current-time','selection','captions','music','sfx','visuals','camera','look','mix'
]);

export function validateAiAdjustmentRequest(r){
  assert(r&&r.version==='1.0','AI adjustment: versión');
  assert(typeof r.jobId==='string'&&r.jobId.length>0,'AI adjustment: jobId');
  assert(typeof r.prompt==='string'&&r.prompt.trim().length>=3&&r.prompt.length<=1200,'AI adjustment: prompt');
  assert(AI_ADJUSTMENT_SCOPES.includes(r.scope),'AI adjustment: scope');
  if(r.scope==='current-time'){
    assert(Number.isFinite(r.time)&&r.time>=0,'AI adjustment: time');
  }
  if(r.scope==='selection'){
    assert(Number.isFinite(r.start)&&Number.isFinite(r.end)&&r.start>=0&&r.end>r.start,'AI adjustment: selection');
  }
  assert(r.applyMode==='preview-first','AI adjustment: preview-first obligatorio');
  return true;
}

export function adjustmentSafetyPolicy(){
  return Object.freeze({
    applyMode:'preview-first',
    destructive:false,
    preservePreviousVersion:true,
    requireStructuredPlan:true,
    allowedTargets:['captions','music','sfx','visuals','camera','look','mix','timing'],
    forbidden:['delete-original','overwrite-source','publish-without-preview']
  });
}
