/**
 * SUES Motion · FableCut frame-sampled editable candidate.
 *
 * Preserve the SVG engine's exact scalar motion on every 30fps frame by
 * translating sample values into LINEAR native keyframes. Shape keys remain
 * editable; composite camera keys remain editable. This fixes mismatch
 * caused by unrelated easing defaults, but does NOT prove visual parity:
 * FableCut still lacks verified per-word SVG Gaussian blur and card text mask.
 *
 * QA only. No writes to FableCut jobs/projects, no media generated, no publish.
 */
import {buildFableCutEditableMotionCandidate} from './fablecut-editable-candidate.js';
import {sampleHookDropCard,FRAME_COUNT as CARD_FRAMES,FPS} from './hook-drop-card-engine.js';
import {sampleCardToSpace,SEQUENCE_FRAMES,SPACE_EVENTS} from './sequence-card-to-space.js';
const seconds=n=>Number((n/FPS).toFixed(4));
const r4=n=>Number(Number(n).toFixed(4));
const nativeTimeKey=(frame,initialFrame,data)=>({t:seconds(frame-initialFrame),...data,ease:'linear'});
const samples=(first,last,fn)=>Array.from({length:last-first+1},(_,i)=>fn(first+i));
function compById(candidate,id){
 const found=candidate.operations.filter(x=>x.op==='addComp').map(x=>x.comp).find(x=>x.id===id);
 if(!found)throw Error('Missing comp '+id);
 return found;
}
function uniqueClip(comp,id){
 const list=comp.clips.filter(c=>c.id===id);
 if(list.length!==1)throw Error('Expected one clip '+id);
 return list[0];
}
export function buildFrameSampledEditableCandidate(){
 const candidate=buildFableCutEditableMotionCandidate();
 const cardComp=compById(candidate,'sues_motion_card');
 const scene=compById(candidate,'sues_motion_continuity');
 const card=uniqueClip(cardComp,'card-outline').props.shapes[0];
 const lastCard=sampleHookDropCard(CARD_FRAMES-1);
 if(CARD_FRAMES!==70||SEQUENCE_FRAMES!==151||SPACE_EVENTS.railsStart!==59||Math.abs(lastCard.camera.scale-4.5)>1e-8){
  throw Error('Source motion changed: review keyframe ranges before generating native comps');
 }
 // Height 0..7 and radius 8..19: exact SVG values per frame.
 card.keys=samples(0,19,f=>{
  const src=sampleHookDropCard(f).card;
  return nativeTimeKey(f,0,{h:r4(src.h),radius:r4(src.rx)});
 });
 // Nested comp camera: source camera starts transitioning at F51.
 const nested=uniqueClip(scene,'nested-card-scene');
 nested.keyframes={
  scale:samples(0,CARD_FRAMES-1,f=>nativeTimeKey(f,0,{v:r4(sampleHookDropCard(f).camera.scale)})),
  y:samples(0,CARD_FRAMES-1,f=>nativeTimeKey(f,0,{v:r4(sampleHookDropCard(f).camera.dy)}))
 };
 for(const [id,channel] of [['left-rail','leftX'],['right-rail','rightX']]){
  const shape=uniqueClip(scene,id).props.shapes[0];
  shape.keys=samples(SPACE_EVENTS.railsStart,SPACE_EVENTS.railsEnd,f=>{
   const source=sampleCardToSpace(f),src=source.rails;
   return nativeTimeKey(f,SPACE_EVENTS.railsStart,{
    x:r4(src[channel]-540),y:r4(src.y-960),opacity:r4(src.opacity*source.secondSceneAlpha)
   });
  });
 }
 // The original SVG has no vertical word displacement in its rendered <text>
 // elements. Remove the former candidate's invented Y animation; retain only
 // opacity envelopes sampled exactly at the source word's local frame times.
 const cardWordIds=['card-word-0','card-word-1','card-word-2','card-word-l2-0'];
 const followWordIds=['follow-word-0','follow-word-1','follow-word-l2-0','follow-word-l2-1'];
 for(const [comp,ids,engine,last,fadeFrames] of [
  [cardComp,cardWordIds,sampleHookDropCard,CARD_FRAMES-1,6],
  [scene,followWordIds,sampleCardToSpace,SEQUENCE_FRAMES-1,7]
 ]){
  for(let i=0;i<ids.length;i++){
   const text=uniqueClip(comp,ids[i]);
   const start=Math.round(text.start*FPS);
   if(!Number.isInteger(start)||start<0||start+fadeFrames>last)throw Error('Word timing changed: revisit keyframe window');
   text.keyframes={
    opacity:samples(start,start+fadeFrames,f=>nativeTimeKey(f,start,{
     v:r4(engine(f).text?.words?.[i]?.opacity??engine(f).words?.[i]?.opacity)
    }))
   };
  }
 }
 return {...candidate,schema:'sues-fablecut-frame-sampled-candidate/v1',
  status:'NUMERIC_FRAME_SAMPLES_CHECKABLE_NOT_RENDER_APPROVED',
  sampledChannels:['card.height','card.cornerRadius','nestedComp.scale','nestedComp.y',
   'leftRail.x','leftRail.y','leftRail.opacity','rightRail.x','rightRail.y','rightRail.opacity',
   'cardWords.opacity','followWords.opacity'],
  fpsVerified:FSPolicy(),
  nativeExecuted:false,productionChanged:false,
  incompleteFidelity:[...candidate.incompleteFidelity,
   'Value sampling does not verify FableCut compositing order, canvas coordinates or text baseline',
   'Blur-to-sharp text reveal is not natively mapped; opacity-only fallback is intentionally visible and requires approval',
   'Keyframes are exact at source frame times but in-between displays have not been compared in Chromium']
 };
}
function FSPolicy(){return {fps:FPS,cardFrames:CARD_FRAMES,sequenceFrames:SEQUENCE_FRAMES,
 interpolation:'linear to per-frame samples',scope:'review-only'};}
