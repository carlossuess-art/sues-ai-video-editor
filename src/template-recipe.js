// Editorial rules over timestamped speech, not an LLM or periodic effect clock.
const normal=t=>t.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
export function buildTemplateRecipe(plan,settings){
 const result={version:'sues-template-recipe-v1',cards:[],transitions:[],selected:[],rejected:[],method:'explicit-template-with-local-speech-rules-not-llm'};
 if(!settings.autoRecipe||!settings.motions)return result;
 // Explicit manual layouts remain authoritative. Do not erase an imported plan.
 if(settings.graphicCards.length||settings.motionChoices.length||settings.highlightCaptions.length||settings.elements||settings.imageEvents.length){result.rejected.push({reason:'manual-composition-preserved'});return result;}
 const dynamic=settings.styleId==='SUES_DOPAMIN',cutoff=plan.duration-plan.policy.outro.duration;
 const maximum=Math.min(3,Math.floor(plan.duration/(dynamic?18:36))),candidates=[];
 if(!maximum)return result;
 for(let i=0;i<plan.captions.length;i++){
  const first=plan.captions[i];if(first.start<2||first.end>cutoff)continue;
  const cue=normal(first.text),secret=/\b(secreto|recuerda|verdad)\b/.test(cue),meaning=/\b(miedo|calma|sentir|silencio|respira|detenerte|libertad|avanzar|reconocer|transformacion|patrones)\b/.test(cue);
  if(!secret&&!meaning)continue;
  let last=i;while(last+1<plan.captions.length&&!/[.!?…]$/.test(plan.captions[last].text)&&last-i<2&&plan.captions[last+1].end-first.start<=5.4)last++;
  const covered=plan.captions.slice(i,last+1);if(covered.some(c=>c.text.length>26)||covered.at(-1).end>cutoff||covered.at(-1).end-first.start<1.3)continue;
  const end=Math.min(cutoff,covered.at(-1).end+.3,plan.captions[last+1]?.start??cutoff);
  if(end-first.start<1.5||end-first.start>6)continue;
  const card={captionId:first.id,endCaptionId:covered.at(-1).id,type:secret?'secret':'grid',...(secret?{}:{heading:first.text,...(covered.length>1?{bodyLines:covered.slice(1).map(c=>c.text)}:{})})};
  // Secret uses one caption; don't make later spoken words disappear into a seal.
  if(secret&&last!==i)continue;
  candidates.push({card,start:first.start,end,score:(secret?3:1)+(covered.length>1?1:0),text:covered.map(c=>c.text).join(' '),reason:secret?'spoken-revelation-cue':'spoken-reflection-cue'});
 }
 candidates.sort((a,b)=>b.score-a.score||a.start-b.start);
 for(const c of candidates){
  if(result.selected.some(e=>c.start<e.end+3&&c.end>e.start-3))continue;
  if((plan.selectedMedia??[]).some(e=>c.start<e.end&&c.end>e.start))continue;
  result.cards.push(c.card);result.selected.push(c);
  if(result.cards.length>=maximum)break;
 }
 result.cards.sort((a,b)=>plan.captions.find(c=>c.id===a.captionId).start-plan.captions.find(c=>c.id===b.captionId).start);
 // A single warm cue marks the return from each selected argument. No fixed timer.
 if(dynamic&&!settings.transitions.length)for(const c of result.selected){const start=c.end-.2;if(start+.4<=cutoff)result.transitions.push({type:'warm',start});}
 return result;
}
export function editionCounts(plan){
 const zooms=plan.semantic?.zooms?.length??0;
 return {captions:plan.captions.length,zoomCycles:zooms,zoomIns:zooms,zoomOuts:zooms,motions:(plan.semantic?.motions?.length??0)+(plan.masterGraphics?.length??0),cards:plan.graphics?.length??0,transitions:plan.globalTransitions?.length??0,images:plan.illustrations?.length??0,soundEffects:(plan.soundEffects?.events?.length??0)+(plan.customSfx?.events?.length??0),cuts:plan.segments?.length?Math.max(0,plan.segments.length-1):0};
}
