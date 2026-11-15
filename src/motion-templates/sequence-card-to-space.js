/**
 * SUES prototype: an approved card zoom passes into a semantically meaningful
 * second scene. Parting rails create room for words, individually animated.
 * No fabricated speech, arbitrary sphere, waveform or native deployment.
 */
import {renderHookDropCardSvg,FRAME_COUNT as CARD_FRAMES,FPS} from './hook-drop-card-engine.js';
export const SEQUENCE_ID='SUES_CARD_TO_SPACE_DEMO';
export const SEQUENCE_FRAMES=151;
export const SPACE_EVENTS=Object.freeze({bridgeStart:55,cardGone:CARD_FRAMES-1,railsStart:59,railsEnd:91,firstWords:81,secondWords:104,settle:123,end:150});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const progress=(f,a,b)=>clamp((f-a)/(b-a));
const out=t=>1-(1-t)**3;
const inOut=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const lerp=(a,b,t)=>a+(b-a)*t;
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const glyphWeight=c=>/[iIl1!.,:;]/.test(c)?0.34:/[MWmOQ]/.test(c)?0.85:/[íÍáÁóÓ]/.test(c)?0.68:0.64;
const textWidth=(w,size)=>[...w].reduce((a,c)=>a+size*glyphWeight(c),0);
const palette={warm:'#FFF9B0',white:'#FFFFFF',line:'#B88C32'};
function config(args={}){
 const lines=[args.followLine1??'HAZ ESPACIO',args.followLine2??'PARA ESCUCHARTE'];
 if(lines.some(v=>typeof v!=='string'||!v.trim()||[...v].length>32))throw Error('following lines must have 1–32 characters');
 const chunks=lines.map((v,index)=>v.trim().split(/\s+/u).map((word,j)=>({word,id:'follow-word-'+index+'-'+j})));
 if(chunks.some(arr=>arr.length>6))throw Error('too many words on one line');
 const count=chunks.flat().length;
 const hasTimes=args.followWordStartFrames!==undefined;
 const hasIds=args.followWordIds!==undefined;
 if(hasTimes!==hasIds)throw Error('follow word starts and IDs must be provided together');
 if(hasTimes){
  const starts=args.followWordStartFrames,ids=args.followWordIds;
  if(!Array.isArray(starts)||starts.length!==count||starts.some((n,i)=>!Number.isInteger(n)||n<SPACE_EVENTS.firstWords||n>SPACE_EVENTS.end-7||(i>0&&n<=starts[i-1])))throw Error('invalid followWordStartFrames');
  if(!Array.isArray(ids)||ids.length!==count||ids.some(v=>typeof v!=='string'||!v.trim())||new Set(ids).size!==ids.length)throw Error('invalid followWordIds');
 }
 return {lines,chunks,followWordStartFrames:args.followWordStartFrames,followWordIds:args.followWordIds,hasAnchors:hasTimes};
}
export function sampleCardToSpace(frame,args={}){
 if(!Number.isInteger(frame)||frame<0||frame>=SEQUENCE_FRAMES)throw RangeError('frame outside 0..150');
 const {lines,chunks,followWordStartFrames,followWordIds,hasAnchors}=config(args),e=SPACE_EVENTS;
 const rise=out(progress(frame,e.railsStart,e.railsStart+13));
 const spread=inOut(progress(frame,e.railsStart+5,e.railsEnd));
 const railsOpacity=out(progress(frame,e.railsStart,e.railsStart+7));
 const railY=lerp(1540,895,rise),railHalfGap=lerp(20,426,spread);
 let serialIndex=0;
 const labels=chunks.map((group,line)=>group.map((w,i)=>{
  const first=line===0?e.firstWords:e.secondWords;
  const idx=serialIndex++;
  const start=hasAnchors?followWordStartFrames[idx]:first+i*8;
  const fade=out(progress(frame,start,start+7));
  return {...w,line,start,wordId:hasAnchors?followWordIds[idx]:null,opacity:fade,blur:7*(1-fade),dy:24*(1-fade)};
 })).flat();
 const stage=frame<e.bridgeStart?'card':frame<e.cardGone?'bridge':frame<e.railsEnd?'opening-space':frame<e.settle?'reading':'hold';
 return {id:SEQUENCE_ID,frame,fps:FPS,cardFrame:Math.min(frame,CARD_FRAMES-1),stage,
  rails:{leftX:540-railHalfGap,rightX:540+railHalfGap,y:railY,height:210,opacity:railsOpacity},
  lines,words:labels,captionPolicy:'use-existing-editor',speechSync:hasAnchors?'external-word-id-anchors':'demo-no-transcript',
  secondSceneAlpha:railsOpacity,endsReadyForNextScene:frame===e.end,executableInFableCut:false};
}
export function renderCardToSpaceSvg(frame,args={}){
 const s=sampleCardToSpace(frame,args),card=renderHookDropCardSvg(s.cardFrame,args);
 const textGroups=[0,1].map(line=>{
  const group=s.words.filter(w=>w.line===line),measure=[...s.lines[line]].length;
  const base=line===0?Math.min(94,Math.floor(94*14/Math.max(14,measure))):Math.min(66,Math.floor(66*18/Math.max(18,measure)));
  const original=group.map(w=>textWidth(w.word,base)),gap=84; // keep words visually separate across SVG/HTML renderers
  const total=original.reduce((a,b)=>a+b,0)+gap*(group.length-1),fit=Math.min(1,785/Math.max(1,total));
  const widths=original.map(w=>w*fit),fontSize=base*fit;
  const sum=widths.reduce((a,b)=>a+b,0)+gap*(group.length-1);
  let x=540-sum/2;
  return group.map((w,j)=>{
   const width=widths[j],center=x+width/2;x+=width+gap;
   return '<text id="'+w.id+'" x="'+center+'" y="'+(line===0?900:1018)+'" text-anchor="middle" textLength="'+width+'" lengthAdjust="spacingAndGlyphs" font-family="Montserrat,Arial,sans-serif" font-weight="'+(line===0?900:700)+'" font-size="'+fontSize+'" fill="'+(line===0?palette.warm:palette.white)+'" filter="url(#space-word-'+w.id+')" opacity="'+w.opacity+'">'+safe(w.word)+'</text>';
  }).join('');
 });
 const filters=s.words.map(w=>'<filter id="space-word-'+w.id+'" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="'+w.blur+'"/></filter>').join('');
 const r=s.rails;
 const stage2=['<g id="follow-scene" opacity="'+s.secondSceneAlpha+'"><defs>'+filters+'</defs>',
 '<g id="parting-rails" stroke="'+palette.line+'" stroke-width="5" stroke-linecap="round" opacity="'+r.opacity+'">',
 '<path id="rail-left" d="M'+r.leftX+' '+(r.y-r.height/2)+' V'+(r.y+r.height/2)+'"/>',
 '<path id="rail-right" d="M'+r.rightX+' '+(r.y-r.height/2)+' V'+(r.y+r.height/2)+'"/>',
 '</g><g id="follow-words">'+textGroups.join('')+'</g></g>'].join('');
 return card.replace('</svg>',stage2+'</svg>');
}