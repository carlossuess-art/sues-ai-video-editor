// Reviewed raster mattes for resources behind a source-bound visible subject.
// No detector, downloaded weights, or remote inference runs in the renderer.
const assert=(ok,msg)=>{if(!ok)throw Error('Subject layers: '+msg);};
const finite=Number.isFinite,sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const overlap=(a,b)=>a.start<b.end&&a.end>b.start;
export function prepareSubjectLayers(data,plan){
 if(!data)return [];
 assert(data.version==='1.0'&&data.sourceSha256===plan.source.sha256,'source binding/version');
 assert(plan.source.width===1080&&plan.source.height===1920&&plan.timeMap.spans.length===1&&plan.timeMap.spans[0].sourceIn===0&&plan.camera.keyframes.every(k=>k.x===0&&k.y===0&&k.width===1080&&k.height===1920),'reviewed full-frame source required; cuts/crop unsupported');
 const m=data.matte;
 assert(m&&typeof m.localFile==='string'&&m.localFile.startsWith('/')&&sha(m.sha256),'verified local matte required');
 assert(['guided-grabcut-v1','manual-rotoscope-raster-v1'].includes(m.method)&&['full-visible-subject','upper-body'].includes(m.scope)&&m.reviewStatus==='reviewed','reviewed contour provenance required');
 assert(m.width===1080&&m.height===1920&&m.fps===30&&finite(m.duration)&&Math.abs(m.duration-plan.duration)<1/30,'matte geometry/timing');
 assert(Array.isArray(m.reviewedRanges)&&m.reviewedRanges.length>=1&&m.reviewedRanges.length<=12&&m.reviewedRanges.every(r=>finite(r.start)&&finite(r.end)&&r.start>=0&&r.end>r.start&&r.end<=plan.duration),'reviewed temporal ranges');
 assert(Array.isArray(data.events)&&data.events.length<=6,'at most six events');
 const region=m.scope==='upper-body'?m.reviewedRegion:{top:0,bottom:1920};
 assert(region&&[region.top,region.bottom].every(finite)&&region.top>=0&&region.bottom<=1920&&region.bottom>region.top,'reviewed region required');
 const ids=new Set(),events=[];
 for(const e of data.events){
  assert(e&&typeof e.assetId==='string'&&/^[a-z0-9-]{1,80}$/.test(e.assetId)&&!ids.has(e.assetId),'asset identity');ids.add(e.assetId);
  assert(['owned','licensed'].includes(e.rights)&&sha(e.sha256)&&typeof e.localFile==='string'&&e.localFile.startsWith('/'),'resource provenance');
  assert([e.start,e.end,e.opacity,e.fadeSeconds].every(finite)&&e.start>=0&&e.end>e.start&&e.end<=plan.duration-plan.policy.outro.duration&&e.end-e.start<=8&&e.opacity>0&&e.opacity<=1&&e.fadeSeconds>=.1&&e.fadeSeconds<=Math.min(.5,(e.end-e.start)/3)&&(e.motion===undefined||e.motion==='vertical-drift'),'event bounds');
  assert(m.reviewedRanges.some(r=>r.start<=e.start&&r.end>=e.end),'event outside reviewed matte range');
  const b=e.box;assert(b&&['left','right','top','bottom'].every(k=>Number.isInteger(b[k]))&&b.left>=0&&b.right<=1080&&b.top>=0&&b.bottom<=Math.min(plan.layout.caption.top,region.bottom)&&b.top>=region.top&&b.right>b.left&&b.bottom>b.top,'resource box must protect captions');
  assert(![...events,...(plan.semantic?.zooms??[]),...(plan.semantic?.trajectory?.activeRanges??[]),...(plan.semantic?.motions??[]),...(plan.graphics??[]),...(plan.elements??[]),...(plan.depthText??[]),...(plan.illustrations??[]),...(plan.selectedMedia??[])].some(o=>overlap(e,o)),'event overlaps camera or another resource');
  events.push({...structuredClone(e),matte:structuredClone(m),sourceSha256:data.sourceSha256,scope:'behind-reviewed-visible-subject',automaticPersonDetection:false});
 }
 return events;
}
export function subjectLayerFilters(events=[],base,inputStart){
 const filters=[];
 for(const [i,e]of events.entries()){
  const image=inputStart+i*2,mask=image+1,b=e.box,w=b.right-b.left,h=b.bottom-b.top,d=e.end-e.start;
  const sizing=e.motion==='vertical-drift'?`scale=${w}:${h+120}:force_original_aspect_ratio=increase,crop=${w}:${h}:x=0:y='mod(t*40,120)'`:`scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;
  filters.push(`[${image}:v]${sizing},setsar=1,format=rgba,pad=1080:1920:${b.left}:${b.top}:color=0x00000000,trim=duration=${d},setpts=PTS-STARTPTS,fade=t=in:st=0:d=${e.fadeSeconds}:alpha=1,fade=t=out:st=${d-e.fadeSeconds}:d=${e.fadeSeconds}:alpha=1,setpts=PTS+${e.start}/TB,split=2[depth-rgb${i}][depth-alpha-in${i}]`);
  filters.push(`[depth-alpha-in${i}]alphaextract,lut=y='val*${e.opacity}'[depth-alpha${i}]`);
  filters.push(`[${mask}:v]fps=30,format=gray,negate[depth-inverse${i}]`);
  filters.push(`[depth-alpha${i}][depth-inverse${i}]blend=all_expr='A*B/255':shortest=1[depth-hole${i}]`);
  filters.push(`[depth-rgb${i}][depth-hole${i}]alphamerge[depth-resource${i}]`);
  filters.push(`[${base}][depth-resource${i}]overlay=eof_action=pass:repeatlast=0:enable='gte(t,${e.start})*lt(t,${e.end})'[subject-composed${i}]`);base=`subject-composed${i}`;
 }
 return {filters,base};
}