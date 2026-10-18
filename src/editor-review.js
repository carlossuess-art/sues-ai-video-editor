export function editorReview(plan,director,settings){
 const events=[
  ...(plan.semantic?.zooms??[]).map(e=>({type:'zoom',start:e.start,end:e.end,reason:e.reason,sourceWordIndexes:e.evidence?.sourceWordIndexes??[],verification:e.evidence?.method??'editorial'})),
  ...(plan.semantic?.motions??[]).map(e=>({type:'quote',start:e.start,end:e.end,text:e.lines.join(' '),reason:e.reason,sourceWordIndexes:e.evidence?.sourceWordIndexes??[],verification:e.evidence?.method??'editorial'})),
  ...(plan.graphics??[]).map(e=>({type:e.type,start:e.start,end:e.end,text:e.text,left:e.left,right:e.right,reason:e.reason,sourceWordIndexes:e.wordIndexes,verification:e.textOrigin})),
  ...(plan.globalTransitions??[]).map(e=>({type:e.type,start:e.start,end:e.end,reason:e.reason,verification:'explicit-editor-choice'})),
  ...(plan.illustrations??[]).map(e=>({type:'image',start:e.start,end:e.end,assetId:e.assetId,rights:e.rights,verification:'sha256-bound-to-source'}))
 ].sort((a,b)=>a.start-b.start||a.end-b.end);
 return {version:'1.0',duration:plan.duration,method:director.audit.method,sourceWords:director.audit.sourceWords,mappedWords:director.audit.mappedWords,omittedWords:director.audit.omittedWords,
  captions:plan.captions.map(c=>({id:c.id,start:c.start,end:c.end,text:c.text,source:c.source,timingUncertain:c.timingUncertain,keyword:c.keyword??null})),
  events,rejections:director.audit.rejections,uncertainWordIndexes:director.audit.uncertainWordIndexes,
  music:plan.audioMix?{assetId:plan.audioMix.assetId,gain:plan.audioMix.gain,ducking:plan.audioMix.duckEnabled,rights:plan.audioMix.rights}:null,
  font:{family:plan.policy.captions.font,identity:plan.policy.captions.fontIdentity??'configured-font'},settings,
  originalVoice:true,externalCostUSD:0,humanAcceptance:false};
}
