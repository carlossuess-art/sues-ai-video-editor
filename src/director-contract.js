const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const num=x=>typeof x==='number'&&Number.isFinite(x);

export const DECISION_TYPES=Object.freeze([
  'cut','zoom','reframe','caption-emphasis','motion','transition','look','audio-cue','outro'
]);

export function validateDirectorPlan(plan){
  assert(plan&&plan.version==='1.0','Director: versión');
  assert(typeof plan.templateId==='string'&&plan.templateId.length>0,'Director: templateId');
  assert(Array.isArray(plan.decisions),'Director: decisions');
  let previous=-Infinity;
  for(const d of plan.decisions){
    assert(DECISION_TYPES.includes(d.type),`Director: tipo ${d.type}`);
    assert(num(d.start)&&d.start>=0,'Director: start');
    assert(num(d.end)&&d.end>d.start,'Director: end');
    assert(d.start>=previous-1e-6,'Director: decisiones desordenadas');
    previous=d.start;
    assert(typeof d.reason==='string'&&d.reason.length>=3,'Director: reason obligatorio');
    assert(typeof d.rule==='string'&&d.rule.length>=3,'Director: rule obligatorio');
    assert(d.confidence===undefined||(num(d.confidence)&&d.confidence>=0&&d.confidence<=1),'Director: confidence');
    if(d.type==='zoom'){
      assert(num(d.params?.scale)&&d.params.scale>=1&&d.params.scale<=1.6,'Director: zoom scale');
      assert(['emphasis','revelation','emotional-turn','clarity'].includes(d.params.reason),'Director: zoom reason');
    }
    if(d.type==='motion'){
      assert(typeof d.params?.motionId==='string'&&d.params.motionId.length>0,'Director: motionId');
    }
  }
  return true;
}

export function enforceDirectorPolicy(plan,policy){
  validateDirectorPlan(plan);
  assert(plan.templateId===policy.templateId,'Director: template mismatch');
  for(const d of plan.decisions){
    if(d.type==='zoom'){
      assert(policy.constraints?.semanticZoomOnly===true,'Director: plantilla permite zoom no semántico');
      assert(policy.camera.zoomReasons.includes(d.params.reason),'Director: motivo de zoom no permitido');
      assert(d.params.scale>=policy.camera.baseZoom&&d.params.scale<=policy.camera.maxZoom,'Director: zoom fuera de plantilla');
    }
    if(d.type==='motion') assert(policy.motions.includes(d.params.motionId),'Director: motion no permitido');
    if(d.type==='transition') assert(policy.transitions.includes(d.params.transition),'Director: transición no permitida');
  }
  return true;
}

export function compileDirectorEvents(plan,policy){
  enforceDirectorPolicy(plan,policy);
  return plan.decisions.map((d,index)=>({
    id:`decision-${String(index+1).padStart(3,'0')}`,
    ...structuredClone(d),
    templateId:policy.templateId
  }));
}
