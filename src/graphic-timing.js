// Shared visual/audio beats. Existing uncertain speech cues remain unchanged.
export function secretRevealTime(g){return g.voiceCues?.title!==null&&g.voiceCues?.title!==undefined?Math.max(g.start+.04,g.voiceCues.title):g.start+Math.min(.7,(g.end-g.start)*.22);}
export function finishFadeFor(plan){
 if(!plan.captions?.length||plan.policy.outro.duration<.4)return null;
 const speechEnd=Math.max(...plan.captions.map(c=>c.end));
 return speechEnd<=plan.duration-.35?{start:plan.duration-.18-2/30,duration:.18,blackHold:2/30,reason:'closing-after-last-caption',speechEnd}:null;
}
