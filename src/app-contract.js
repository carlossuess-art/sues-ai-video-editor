const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const num=x=>typeof x==='number'&&Number.isFinite(x);

export const APP_JOB_STATES=Object.freeze([
  'DRAFT','UPLOADED','ANALYZING','PLANNED','PREVIEW_READY',
  'ADJUSTING','QUEUED','RENDERING','PUBLISHING','PUBLISH_FAILED','DONE','FAILED','CANCELLED'
]);

export function validateCreateEditRequest(r){
  assert(r&&r.version==='1.0','App: versión');
  assert(typeof r.sourceRef==='string'&&r.sourceRef.length>0,'App: sourceRef');
  assert(['SUES_CALMA','SUES_IMPACTO','SUES_EXPLICA','SUES_HISTORIA'].includes(r.templateId),'App: templateId');
  assert(r.campaignMode===undefined||typeof r.campaignMode==='boolean','App: campaignMode');
  if(r.campaignMode){
    assert(typeof r.geoBanner?.location==='string'&&r.geoBanner.location.length>0,'App: geoBanner location');
  }
  return true;
}

export function validateAdjustment(a){
  assert(a&&typeof a.type==='string','Adjustment: type');
  assert(['replace-caption','change-caption-style','move-overlay','toggle-motion','change-look','change-zoom','trim'].includes(a.type),'Adjustment: type no permitido');
  assert(typeof a.targetId==='string'&&a.targetId.length>0,'Adjustment: targetId');
  if(a.type==='change-zoom') assert(num(a.value)&&a.value>=1&&a.value<=1.6,'Adjustment: zoom');
  return true;
}

export function canTransition(from,to){
  const allowed={
    DRAFT:['UPLOADED','CANCELLED'],
    UPLOADED:['ANALYZING','CANCELLED','FAILED'],
    ANALYZING:['PLANNED','FAILED'],
    PLANNED:['PREVIEW_READY','FAILED'],
    PREVIEW_READY:['ADJUSTING','QUEUED','RENDERING','CANCELLED'],
    ADJUSTING:['PREVIEW_READY','RENDERING','CANCELLED','FAILED'],
    QUEUED:['RENDERING','FAILED','CANCELLED'],
    RENDERING:['PUBLISHING','DONE','FAILED','CANCELLED'],
    PUBLISHING:['DONE','PUBLISH_FAILED'],
    PUBLISH_FAILED:['PUBLISHING','CANCELLED'],
    FAILED:['ANALYZING','QUEUED','RENDERING','CANCELLED'],
    DONE:[],CANCELLED:[]
  };
  return allowed[from]?.includes(to)??false;
}

export function validateJobSnapshot(job){
  assert(job&&APP_JOB_STATES.includes(job.state),'Job: state');
  assert(typeof job.id==='string'&&job.id.length>0,'Job: id');
  assert(typeof job.createdAt==='string','Job: createdAt');
  assert(Array.isArray(job.history)&&job.history.length>0,'Job: history');
  return true;
}
