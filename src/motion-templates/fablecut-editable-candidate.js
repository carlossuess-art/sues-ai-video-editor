/**
 * Read-only, assetless FableCut COMP CANDIDATE from the SUES motion sample.
 * Native shape radius, word layers and nested comp-camera keys are editable.
 * This is intentionally NOT a lossless rendering-equivalence claim and MUST
 * NOT be applied to any existing Reel or live FableCut project.
 */
import {sampleHookDropCard,FRAME_COUNT as CARD_FRAMES} from './hook-drop-card-engine.js';
import {sampleCardToSpace,SEQUENCE_FRAMES,SPACE_EVENTS} from './sequence-card-to-space.js';
const fps=30,sec=f=>Number((f/fps).toFixed(4));
const grid=()=>{const a=[];for(let x=-540;x<=540;x+=48)a.push({type:'line',name:'grid-v',points:[[x,-960],[x,960]],stroke:'#ffffff0e',strokeWidth:1});for(let y=-960;y<=960;y+=48)a.push({type:'line',name:'grid-h',points:[[-540,y],[540,y]],stroke:'#ffffff0e',strokeWidth:1});return a};
const track=id=>({id,kind:'video'});
const clip=(id,kind,trackId,start,duration,props,extra={})=>({id,kind,track:trackId,start:sec(start),in:0,duration:sec(duration),props,...extra});
const textProps=(value,x,y,size,color,weight=800)=>({text:value,x,y,font:'Montserrat',fontSize:size,color,weight,bold:true,align:'center',opacity:1,textShadow:3,boxW:940,boxH:200});
const linearFade=(lengthFrames,y)=>({opacity:[{t:0,v:0},{t:sec(lengthFrames),v:1,ease:'ease-out'}],y:[{t:0,v:y+18},{t:sec(lengthFrames),v:y,ease:'ease-out'}]});
const measure=(word,size)=>[...word].reduce((a,c)=>a+size*(/[iIl1!.,:;]/.test(c)?.34:/[MWmOQ]/.test(c)?.85:.64),0);
function wordLine(words,y,size,spacing,color,prefix,startAtGlobal,globalEnd,trackPrefix){
 const widths=words.map(w=>measure(w.text,size));const total=widths.reduce((a,b)=>a+b,0)+(words.length-1)*spacing;
 let left=-total/2;return words.map((w,i)=>{
  const x=left+widths[i]/2;left+=widths[i]+spacing;
  return clip(prefix+i,'text',trackPrefix+i,w.start,globalEnd-w.start,textProps(w.text,x,y,size,color),{keyframes:linearFade(6,y)});
 });
}
export function buildFableCutEditableMotionCandidate(){
 const first=sampleHookDropCard(0),second=sampleCardToSpace(0),cardFrames=CARD_FRAMES,duration=SEQUENCE_FRAMES;
 const cardWords=first.text.words;
 if(cardWords.length!==4||second.words.length!==4||fps!==30)throw Error('Template source shape changed; re-audit required');
 const firstLine=wordLine(cardWords.filter(w=>w.lineIndex===0),-192,84,22,'#ffffff','card-word-',0,cardFrames,'CW');
 const secondLine=wordLine(cardWords.filter(w=>w.lineIndex===1),-58,95,22,'#fff9b0','card-word-l2-',0,cardFrames,'CL');
 const sceneOne={
  id:'sues_motion_card',name:'SUES · gancho de tarjeta (editable)',width:1080,height:1920,duration:sec(cardFrames),
  tracks:[track('CARD'),...firstLine.map(c=>track(c.track)),...secondLine.map(c=>track(c.track))],
  clips:[
   clip('card-outline','shape','CARD',0,cardFrames,{x:0,y:-130,opacity:1,shapes:[{type:'rect',name:'card-body',w:820,h:8,radius:0,fill:'#242527',stroke:'#b88c32',strokeWidth:4,keys:[{t:0,h:8,radius:0},{t:sec(7),h:538},{t:sec(8),radius:0},{t:sec(19),radius:62,ease:'ease-out'}]}]}),
   ...firstLine,...secondLine
  ]
 };
 const railStart=SPACE_EVENTS.railsStart,railLength=duration-railStart;
 const makeRail=(id,tid,sign)=>clip(id,'shape',tid,railStart,railLength,{shapes:[{type:'line',name:id,points:[[0,-105],[0,105]],x:sign*20,y:580,opacity:0,stroke:'#b88c32',strokeWidth:5,keys:[{t:0,x:sign*20,y:580,opacity:0},{t:sec(7),opacity:1},{t:sec(13),y:-65},{t:sec(32),x:sign*426,ease:'ease-in-out'}]}]});
 const follow=second.words.map(w=>({...w,text:w.word}));
 const followFirst=wordLine(follow.filter(w=>w.line===0),-60,94,84,'#fff9b0','follow-word-',0,duration,'FW');
 const followSecond=wordLine(follow.filter(w=>w.line===1),58,66,84,'#ffffff','follow-word-l2-',0,duration,'FL');
 const gr=grid(),gridClips=[clip('grid-lines-1','shape','G1',0,duration,{shapes:gr.slice(0,32)}),clip('grid-lines-2','shape','G2',0,duration,{shapes:gr.slice(32)})];
 const composite={
  id:'sues_motion_continuity',name:'SUES · dos escenas enlazadas (editable)',width:1080,height:1920,duration:sec(duration),background:'#111215',
  tracks:[track('G1'),track('G2'),track('CARD_SCENE'),track('RAIL_L'),track('RAIL_R'),...followFirst.map(c=>track(c.track)),...followSecond.map(c=>track(c.track))],
  clips:[...gridClips,clip('nested-card-scene','comp','CARD_SCENE',0,cardFrames,{x:0,y:0,scale:1,opacity:1},{
   compId:sceneOne.id,keyframes:{scale:[{t:0,v:1},{t:sec(51),v:1},{t:sec(69),v:4.5,ease:'ease-in-out'}],y:[{t:0,v:0},{t:sec(51),v:0},{t:sec(69),v:-1950,ease:'ease-in-out'}]}
  }),makeRail('left-rail','RAIL_L',-1),makeRail('right-rail','RAIL_R',1),...followFirst,...followSecond]
 };
 return {
  schema:'sues-fablecut-editable-comp-candidate/v1',
  status:'STRUCTURAL_CANDIDATE_NOT_RENDER_APPROVED',
  source:'SUES_CARD_TO_SPACE_DEMO',
  fps,width:1080,height:1920,durationFrames:duration,
  operations:[{op:'addComp',comp:sceneOne},{op:'addComp',comp:composite},{op:'addClip',clip:clip('sues-motion-qa-only','comp','V1',0,duration,{x:0,y:0,opacity:1,scale:1},{compId:composite.id})}],
  editableParts:['card rectangle/animated corner radius','separate editable text clips','nested scene camera zoom keyframes','individual rail shapes','two text lines','grid as vector line layers'],
  incompleteFidelity:['Gaussian per-word blur/reveal differs from SVG','SVG clipping/mask not yet matched','SVG lighting, gradient and shadow require visual parity QA','exact font metrics/kerning need native render comparison','easing and native comp flatten require frame-level QA'],
  requiresSourceTimeMapping:true,requiresCreativeApproval:true,nativeExecuted:false,productionChanged:false
 };
}
