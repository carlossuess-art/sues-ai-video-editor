// Lossless extraction of explicitly written spatial constraints from Film Director prose.
// Does not invent a missing axis, approve visual placement, or replace a cinematic mask.
const ranges=(text,axis)=>[...text.matchAll(new RegExp('\\b'+axis+'\\s*=\\s*(\\d+)\\s*[–-]\\s*(\\d+)','gi'))]
 .map(m=>({start:Number(m[1]),end:Number(m[2]),offset:m.index}));
export function inspectFilmBriefGeometry(annex,{width=1080,height=1920}={}){
 if(annex?.schema!=='sues-master-film-brief-translation/v1'||annex.canExecute!==false||
  !Array.isArray(annex.operationIntents)||annex.translationCoverage?.lostLines!==0||
  !Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)
  return {status:'BLOCKED',code:'UNTRUSTED_BRIEF_GEOMETRY',canExecute:false};
 const placements=[];
 for(const intent of annex.operationIntents){
  if(intent.track!=='editorial-direction')continue;
  const raw=intent.detail?.verbatim;
  if(typeof raw!=='string')continue;
  const xs=ranges(raw,'x'),ys=ranges(raw,'y');
  if(!xs.length&&!ys.length)continue;
  const invalid=[...xs].some(r=>r.start<0||r.end<=r.start||r.end>width)||
   [...ys].some(r=>r.start<0||r.end<=r.start||r.end>height);
  // In the Film Director wording "columnas x=110–500 y x=580–980, y=740–1150",
  // the single explicitly written y interval belongs to BOTH named columns.
  // Do not apply this rule without the exact two-column conjunction.
  const sharedColumnY=xs.length===2&&ys.length===1&&!invalid&&
   /\bcolumnas\b/i.test(raw)&&
   /x\s*=\s*\d+\s*[–-]\s*\d+\s+y\s+x\s*=\s*\d+\s*[–-]\s*\d+/i.test(raw);
  const pairs=!invalid&&xs.length===ys.length?
   xs.map((x,i)=>({x:x.start,y:ys[i].start,width:x.end-x.start,height:ys[i].end-ys[i].start})):
   sharedColumnY?xs.map(x=>({x:x.start,y:ys[0].start,width:x.end-x.start,height:ys[0].end-ys[0].start})):null;
  placements.push({intentId:intent.id,sceneId:intent.sceneId,sourceLine:intent.sourceLine,
   sourceText:raw,axes:{x:xs,y:ys},rectangles:pairs,
   ...(sharedColumnY?{axisBinding:'EXPLICIT_SHARED_Y_FOR_TWO_COLUMNS'}:{}),
   status:invalid?'OUTSIDE_CANVAS_OR_INVALID_RANGE':!pairs?'AXES_AMBIGUOUS_REQUIRES_DIRECTOR':'POSITION_PROPOSED_FRAME_QA_REQUIRED',
   canExecute:false});
 }
 return {schema:'sues-film-brief-geometry-audit/v1',status:'PROPOSED_NOT_VERIFIED',
  canvas:{width,height},placements,invalid:placements.filter(p=>p.status==='OUTSIDE_CANVAS_OR_INVALID_RANGE').length,
  ambiguous:placements.filter(p=>p.status==='AXES_AMBIGUOUS_REQUIRES_DIRECTOR').length,
  proposedRectangles:placements.reduce((n,p)=>n+(p.rectangles?.length??0),0),
  approved:false,canExecute:false};
}
