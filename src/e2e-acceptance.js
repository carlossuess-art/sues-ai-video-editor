const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};

export const V1_REQUIRED_ARTIFACTS=Object.freeze([
  'source','transcript','captions','vision','reframePlan','template','directorPlan','preview','finalMp4'
]);

export function validateAcceptanceManifest(m){
  assert(m&&m.version==='1.0','Acceptance: versión');
  assert(typeof m.jobId==='string'&&m.jobId.length>0,'Acceptance: jobId');
  assert(m.templateId&&typeof m.templateId==='string','Acceptance: templateId');
  assert(m.artifacts&&typeof m.artifacts==='object','Acceptance: artifacts');
  for(const key of V1_REQUIRED_ARTIFACTS) assert(m.artifacts[key]?.status==='ok',`Acceptance: falta ${key}`);
  assert(Array.isArray(m.validations),'Acceptance: validations');
  return true;
}

export function evaluateV1(manifest){
  validateAcceptanceManifest(manifest);
  const requiredChecks=[
    'source-intact','captions-human-reviewed','face-track-stable','safe-zones-ok',
    'preview-reviewed','final-decodes','audio-present','no-secret-leak'
  ];
  const map=new Map(manifest.validations.map(x=>[x.id,x]));
  const failed=[];
  for(const id of requiredChecks){
    const v=map.get(id);
    if(!v||v.status!=='pass') failed.push(id);
  }
  return {pass:failed.length===0,failed};
}

export function qualitativeGate(review){
  assert(review&&Number.isInteger(review.majorChanges)&&review.majorChanges>=0,'Review: majorChanges');
  assert(Number.isInteger(review.minorChanges)&&review.minorChanges>=0,'Review: minorChanges');
  return {
    pass:review.majorChanges===0&&review.minorChanges<=3,
    criterion:'Cambiaría dos o tres cosas, pero el vídeo prácticamente está.'
  };
}
