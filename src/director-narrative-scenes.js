import {selectCutSafeRange} from './scene-temporal-qa.js';
// Bounded, interpretable local narrative analysis. Not a vision or generative model.
// It only proposes scenes a human sampled and tagged, never applies a render event.
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const intents=[
 {id:'overload',title:'Sobrecarga o dificultad',meaning:'metáfora de peso o bloqueo',
  patterns:[/^ajetread/,/^estres/,/^agobi/,/^saturad/,/^desbord/,/^bloque/,/^opresi/,/^presion/,/^tension/],
  scenes:['industrial-chain-in-water'],roles:['opresion','bloqueo','pesadez'],priority:1},
 {id:'growth',title:'Crecimiento y evolución',meaning:'avance gradual hacia otra etapa',
  patterns:[/^crecimient/,/^transformaci/,/^evoluci/,/^superaci/,/^avanz/],
  scenes:['person-walking-outdoors','mountain-sunrise'],roles:['transformacion','camino','esperanza'],priority:3},
 {id:'renewal',title:'Nuevo comienzo',meaning:'apertura a un nuevo comienzo',
  patterns:[/^renacer/,/^recomenz/,/^amanecer/,/^reinici/,/^renovaci/],
  scenes:['mountain-sunrise'],roles:['nuevo comienzo','amanecer'],priority:2}
];
const negators=new Set(['no','nunca','ni','sin','tampoco','jamas']);
const enough=(words,i)=>!words.slice(Math.max(0,i-4),i).some(w=>negators.has(norm(w.text).replace(/[^a-z]/g,'')));
export function proposeNarrativeScenes(transcript,assets,{limit=6}={}){
 if(!Number.isInteger(limit)||limit<1||limit>8)throw Error('Invalid narrative cue limit');
 const words=transcript.words,closing=Math.max(0,transcript.sourceDuration-3);
 const found=[];
 for(let i=0;i<words.length;i++){
  const term=norm(words[i].text).replace(/[^a-z]/g,'');
  for(const intent of intents){
   if(!intent.patterns.some(p=>p.test(term))||!enough(words,i))continue;
   const low=Math.max(0,i-3),high=Math.min(words.length-1,i+5);
   const segment=words.slice(low,high+1);
   const start=segment[0].start,end=segment.at(-1).end;
   if(start<1||start>=closing||end-start<.4||end>transcript.sourceDuration)continue;
   const candidates=assets.filter(asset=>asset.sceneTags.some(tag=>intent.scenes.includes(tag)))
    .map(asset=>{
     const matched=asset.sceneTags.filter(tag=>intent.scenes.includes(tag));
     const matchedRoles=asset.narrativeRoles.filter(role=>intent.roles.includes(norm(role)));
     // A cut-safe source range is only proposed when a full technical timeline scan exists.
     // Unknown coverage remains review-only, not automatically fit for a cut.
     const proposedRange=asset.temporal
      ?selectCutSafeRange(asset.temporal,Math.min(20,end-start))
      :null;
     const temporallyRejected=asset.temporal&&!proposedRange;
     const score=8+matchedRoles.length*2+(asset.height/asset.width>=1.5?1:0)+(proposedRange?1:0);
     return {...asset,score,matched,matchedRoles,proposedRange,temporallyRejected};
    })
    .filter(x=>!x.temporallyRejected)
    .filter(x=>x.score>=9)
    .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id))
    .slice(0,2)
    .map(({id,title,score,matched,matchedRoles,sampleCount,riskFlags,approvedForProduction,temporal,proposedRange})=>({
     assetId:id,title,kind:'video',score,catalogueApproval:approvedForProduction?'approved':'review-required',
     needsHumanReview:true,
     evidence:{type:'narrative-plus-human-sampled-scene',sceneTags:matched,narrativeRoles:matchedRoles,
      visualSample:{scope:'sampled-frames-only',sampleCount,riskFlags},visualContentVerified:false,
      temporalReview:temporal?{scope:temporal.scope,complete:temporal.complete,sceneCutCount:temporal.sceneCutTimes.length,
       blackIntervalCount:temporal.blackIntervals.length,freezeIntervalCount:temporal.freezeIntervals.length}
       :{scope:'not-inspected',complete:false},
      ...(proposedRange?{suggestedSourceRange:proposedRange}:{})}
    }));
   if(!candidates.length)continue;
   found.push({start,end,transcriptQuote:segment.map(w=>w.text).join(' '),
    sourceWordIndexes:segment.map((_,offset)=>low+offset),decision:'contextual-review-only',
    narrative:{intent:intent.id,label:intent.title,anchor:words[i].text,anchorWordIndex:i,
     reason:intent.meaning,confidence:'tentative-rule-based'},candidates,priority:intent.priority});
  }
 }
 // One strongest cue per narrative intent in a nearby context window. No fixed-time edits.
 const selected=[];
 for(const cue of found.sort((a,b)=>b.priority-a.priority||b.candidates[0].score-a.candidates[0].score||a.start-b.start)){
  if(selected.some(s=>s.narrative.intent===cue.narrative.intent&&Math.abs(s.start-cue.start)<11))continue;
  selected.push(cue);
 }
 return selected.sort((a,b)=>a.start-b.start).slice(0,limit).map(({priority,...cue})=>cue);
}
