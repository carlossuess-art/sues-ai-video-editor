import {createHash} from 'node:crypto';
const key=(group,e)=>{const anchor=e.captionId??e.evidence?.captionId;return createHash('sha256').update(JSON.stringify({group,type:e.type??e.params?.motionId,captionId:anchor,sourceId:e.id??e.instanceId,assetId:e.assetId,...(!anchor?{start:e.start,end:e.end,content:e.lines??e.text??e.params?.bindings}:{})})).digest('hex');};
/** Preserve a reversible catalog while filtering only the executable layers.
 * No timing, geometry, masks or original media are fabricated. */
export function applyManualVisualVisibility(plan,hidden=[]){
 const suppressed=new Set(hidden),catalog=[];
 const track=(group,category,events)=>(events??[]).filter(e=>{
  const id=key(group,e),entry={id,group,category:typeof category==='function'?category(e):category,start:e.start,end:e.end,captionId:e.captionId??e.evidence?.captionId,sourceId:e.id,assetId:e.assetId,children:e.instance?.layers?.map(layer=>({...layer,...e.layerTimes?.[layer.id]})),title:e.heading??e.text??e.lines?.join(' ')??e.params?.bindings?.quote??e.params?.bindings?.text??e.params?.motionId??e.type??'Recurso visual',hidden:suppressed.has(id)};
  catalog.push(entry);return !entry.hidden;
 });
 plan.graphics=track('graphics',e=>e.type==='compare'?'graphics':'motions',plan.graphics);
 plan.semantic.motions=track('semantic-motions','motions',plan.semantic.motions);
 if(plan.masterGraphics)plan.masterGraphics=track('master-graphics','motions',plan.masterGraphics);
 if(plan.elements)plan.elements=track('elements','graphics',plan.elements);
 if(plan.depthText)plan.depthText=track('depth-text','motions',plan.depthText);
 if(plan.subjectLayers)plan.subjectLayers=track('subject-layers','broll',plan.subjectLayers);
 plan.illustrations=track('illustrations','images',plan.illustrations);
 if(plan.foregroundEffects){plan.foregroundEffects.events=track('foreground',e=>e.type==='behind-video'?'broll':'motions',plan.foregroundEffects.events);if(!plan.foregroundEffects.events.length)delete plan.foregroundEffects;}
 if(plan.ambientOverlays)plan.ambientOverlays=track('ambient-overlays','effects',plan.ambientOverlays);
 if(plan.globalTransitions)plan.globalTransitions=track('global-transitions','effects',plan.globalTransitions);
 const known=new Set(catalog.map(e=>e.id));
 const unmatched=hidden.filter(id=>!known.has(id));
 // A previous manual decision remains stored even if an automatic suggestion
 // no longer produces that event. Never apply it to a different event by index.
 plan.manualVisuals={events:catalog,unmatchedHiddenIds:unmatched};
 return plan;
}
