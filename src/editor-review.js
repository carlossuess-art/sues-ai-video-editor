export function editorReview(plan,director,settings){
 const events=[
  ...(plan.semantic?.zooms??[]).map(e=>({type:'zoom',start:e.start,end:e.end,reason:e.reason,sourceWordIndexes:e.evidence?.sourceWordIndexes??[],verification:e.evidence?.method??'editorial'})),
  ...(plan.semantic?.motions??[]).map(e=>({type:e.params.motionId==='QUOTE_CARD_01'?'quote':e.params.motionId,start:e.start,end:e.end,text:e.lines.join(' '),reason:e.reason,box:e.box,audio:e.audio,placement:e.placement,sourceWordIndexes:e.evidence?.sourceWordIndexes??[],verification:e.evidence?.method??'editorial'})),
  ...(plan.graphics??[]).map(e=>({type:e.type,start:e.start,end:e.end,text:e.text,left:e.left,right:e.right,heading:e.heading,bodyLines:e.bodyLines,lead:e.lead,icons:e.icons,endCaptionId:e.endCaptionId,voiceCues:e.voiceCues,replacedCaptionIds:e.replacedCaptionIds,graphicCopyOrigin:'explicit-editor-choice-when-present',reason:e.reason,sourceWordIndexes:e.wordIndexes,verification:e.textOrigin})),
  ...(plan.globalTransitions??[]).map(e=>({type:e.type,start:e.start,end:e.end,reason:e.reason,verification:'explicit-editor-choice'})),
  ...(plan.finishFade?[{type:'closing-fade',start:plan.finishFade.start,end:plan.duration,reason:plan.finishFade.reason,verification:'after-last-caption'}]:[]),
  ...(plan.soundEffects?.events??[]).map(e=>({type:'sound-effect',start:e.start,end:e.start+e.duration,preset:e.preset,reason:e.reason,verification:e.provenance})),
  ...(plan.illustrations??[]).map(e=>({type:'image',start:e.start,end:e.end,assetId:e.assetId,rights:e.rights,box:e.box,mask:e.mask,placement:e.placement??{strategy:'explicit-profile-box'},verification:'sha256-bound-to-source'}))
 ].sort((a,b)=>a.start-b.start||a.end-b.end);
 return {version:'1.0',duration:plan.duration,method:director.audit.method,sourceWords:director.audit.sourceWords,mappedWords:director.audit.mappedWords,omittedWords:director.audit.omittedWords,
  captions:plan.captions.map(c=>({id:c.id,start:c.start,end:c.end,text:c.text,source:c.source,timingUncertain:c.timingUncertain,keyword:c.keyword??null})),
  events,rejections:director.audit.rejections,uncertainWordIndexes:director.audit.uncertainWordIndexes,
  music:plan.audioMix?{assetId:plan.audioMix.assetId,gain:plan.audioMix.gain,ducking:plan.audioMix.duckEnabled,rights:plan.audioMix.rights}:null,
  font:{family:plan.policy.captions.font,identity:plan.policy.captions.fontIdentity??'configured-font'},settings,
  soundEffects:plan.soundEffects??null,originalVoice:true,externalCostUSD:0,humanAcceptance:false};
}
