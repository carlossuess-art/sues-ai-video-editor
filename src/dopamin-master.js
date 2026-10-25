// DOPAMIN editorial composition over the existing renderer. No network/model calls.
import {hierarchyLayout} from './caption-hierarchy.js';
import {fitCaptionSize} from './font-kits.js';
const norm=s=>String(s).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const STOP=new Set('como estas estoy hola tal pequenos comentar tenido grababa sino hacia tiempo poco poquito nada pues que para por del los las con una uno unos unas muy mas aqui alli todo todas todos desde hasta hacer haciendo estar ser sido sido quiero queria tenemos vamos iremos hablando bastante cosas algunas algunos realmente tambien siempre'.split(' '));
const THEMES=[
 {re:/\b(volveremos|regularidad|volvemos|volver)\b/,label:'VOLVEMOS',kind:'return',color:'#FFAB45'},
 {re:/\b(grupo|comunidad|juntos|conectar)\b/,label:'COMUNIDAD',kind:'connection',color:'#FFC86A'},
 {re:/\b(gratis|gratuita|gratuito)\b/,label:'SIN COSTE',kind:'reveal',color:'#FF7A18'},
 {re:/\b(runas|oraculo)\b/,label:'RUNAS',kind:'runes',color:'#FFD18A'},
 {re:/\b(crecimiento|crecer|transformacion|avanzar|mas alla)\b/,label:'CRECIMIENTO',kind:'growth',color:'#FFC86A'},
 {re:/\b(ego)\b/,label:'EGO',kind:'contrast',color:'#F99A61'},
 {re:/\b(miedo)\b/,label:'MIEDO',kind:'contrast',color:'#F99A61'},
 {re:/\b(bloqueo)\b/,label:'BLOQUEO',kind:'contrast',color:'#F99A61'},
 {re:/\b(atentos?|atentas?|escucha|recuerda)\b/,label:'PRESENTE',kind:'attention',color:'#FFD18A'},
 {re:/\b(salir|libertad|libre)\b/,label:'LIBERTAD',kind:'release',color:'#FFC86A'}
];
export function applyDopaminMaster(plan,options){
 if(options.styleId!=='SUES_DOPAMIN'||!options.autoRecipe||!options.motions)return null;
 const reserved=e=>(plan.graphics??[]).some(g=>e.start<g.end&&e.end>g.start)||
   (plan.selectedMedia??[]).some(g=>e.start<g.end&&e.end>g.start)||
   (options.reviewedDepthText?.events??[]).some(g=>e.start<g.end&&e.end>g.start&&norm(e.label)===norm(g.text));
 const cutoff=plan.duration-plan.policy.outro.duration,beats=[];
 for(const c of plan.captions){
  const words=c.text.split(/\s+/),theme=THEMES.find(t=>t.re.test(norm(c.text)));
  const ranked=words.map((text,i)=>({i,text: norm(text)})).filter(x=>x.text.length>=4&&!STOP.has(x.text))
   .sort((a,b)=>(theme?.re.test(b.text)?10:0)-(theme?.re.test(a.text)?10:0)||b.text.length-a.text.length||a.i-b.i);
  const pick=ranked[0];
  if(!Object.hasOwn(options.keywordOverrides,c.id))c.keyword=null;
  if(pick&&(theme||pick.text.length>=7)&&!Object.hasOwn(options.keywordOverrides,c.id)){
   const keyword={displayWordIndex:pick.i,level:theme?'exceptional':'important',
    style:theme?.kind==='contrast'?'fire':theme?'fireMetal':'gold',scale:theme?1.7:1.45,method:'dopamin-editorial-span-v1'};
   if(hierarchyLayout({...c,keyword},plan.policy.captions,plan.layout.caption))c.keyword=keyword;
  }
  if(theme&&c.start>=2&&c.start<cutoff-1.5){
   const previous=beats.at(-1);
   if(previous&&(c.start-previous.start<3.3||previous.kind===theme.kind&&c.start-previous.start<12)){const priority={reveal:10,release:9,contrast:8,attention:7};if((priority[theme.kind]??1)>(priority[previous.kind]??1))beats.pop();else continue;}
   const end=Math.min(cutoff,c.start+1.75,plan.captions.find(n=>n.start>c.start+1.45)?.start??cutoff);
   if(end-c.start<1.2)continue;
   const event={start:c.start,end,label:theme.label,color:theme.color,kind:theme.kind,captionId:c.id,reason:c.text,source:'timestamped-spoken-concept'};
   if(!reserved(event))beats.push(event);
  }
 }
 plan.masterGraphics=beats.slice(0,14);
 // Vary treatment by meaning, rather than a periodic effect counter.
 const type={return:'blur',connection:'warm',reveal:'warm',runes:'blur',growth:'warm',contrast:'radial',attention:'blur',release:'warm'};
 const transitions=[...(plan.globalTransitions??[])];
 for(const b of beats){
  if(transitions.length>=12)break;
  if(transitions.some(t=>Math.abs(t.start-b.start)<4.5))continue;
  transitions.push({type:type[b.kind],start:b.start,end:b.start+.4,duration:.4,reason:b.reason,scope:'entire-composition-including-captions',audio:'coordinated-sfx'});
 }
 plan.globalTransitions=transitions.sort((a,b)=>a.start-b.start);
 plan.dopaminMaster={version:1,method:'offline-editorial-rules-not-multimodal',intensity:1,
  keywordCaptions:plan.captions.filter(c=>c.keyword).length,beats:plan.masterGraphics,
  limitations:['automatic-subject-segmentation-not-available','meaning-rules-are-not-LLM-understanding']};
 return plan.dopaminMaster;
}
export function finishDopaminAudio(plan,options){
 if(!plan.dopaminMaster)return;
 const sfx=plan.soundEffects;
 if(sfx?.enabled&&sfx.gain>0){
  const add=(preset,start,reason,weight=.85)=>{
   if(sfx.events.length>=40||start<0||start+.36>plan.duration||sfx.events.some(e=>Math.abs(e.start-start)<.18))return;
   sfx.events.push({preset,start,duration:{impact:.22,neon:.3,whoosh:.36,draw:.36}[preset],weight,reason,provenance:'original-procedural-sues-v1'});
  };
  for(const b of plan.masterGraphics)add(({reveal:'impact',contrast:'impact',runes:'neon',connection:'neon',growth:'whoosh',release:'whoosh'})[b.kind]??'neon',b.start,'spoken-concept:'+b.reason);
  for(const z of plan.semantic?.zooms??[])add('impact',z.start,'camera-accent',.75);
  let previous=-2;
  for(const c of plan.captions){
   if(!c.keyword||c.start-previous<2.2||c.start>plan.duration-2)continue;
   add(c.keyword.level==='exceptional'?'impact':'neon',c.start,'keyword:'+c.text,.55);previous=c.start;
  }
  sfx.events.sort((a,b)=>a.start-b.start);
 }
 if(plan.audioMix){
  const accents=plan.masterGraphics.filter(b=>['reveal','contrast','attention'].includes(b.kind)).slice(0,4)
   .map(b=>({start:Math.max(0,b.start-.08),end:b.start+.3,reason:b.reason}));
  plan.audioMix.accents=accents;
 }
}
export function musicAccentFilter(accents=[]){
 if(!accents.length)return '';
 if(accents.length>8||accents.some(a=>!Number.isFinite(a.start)||!Number.isFinite(a.end)||a.start<0||a.end<=a.start||a.end-a.start>1))throw Error('Invalid music accents');
 const mute=accents.map(a=>'between(t,'+a.start+','+a.end+')').join('+');
 return "volume='if("+mute+",0,1)':eval=frame,";
}
export function drawMasterGraphics(plan,event,safeText,assColor){
 for(const b of plan.masterGraphics??[]){
  const c=assColor(b.color),y=1420;
  const size=fitCaptionSize([b.label],{...plan.policy.captions,fontRole:'keyword',fontSize:190},780);
  // Foreground lower chest; eyes and top captions remain clear.
  event(3,b.start,b.end,'Outro',`{\\an5\\move(540,${y+70},540,${y},0,220)\\fnMontserrat ExtraBold\\b800\\fs${size}\\bord2\\3c&H121212&\\shad2\\1c${c}&\\fscx78\\fscy78\\t(0,140,\\fscx106\\fscy106)\\t(140,240,\\fscx100\\fscy100)\\fad(60,150)}${safeText(b.label)}`);
  event(2,b.start,b.end,'Outro',`{\\an7\\pos(240,${y+63})\\p1\\bord0\\1c${c}&\\fscx0\\t(0,240,\\fscx100)\\fad(80,160)}m 0 0 l 600 0 600 4 0 4`);
  if(b.kind==='runes'){
   event(3,b.start,b.end,'Outro',`{\\an7\\move(470,1640,470,1570,0,250)\\p1\\bord0\\1c${c}&\\fad(120,180)}m 0 0 l 8 0 8 40 35 12 41 18 8 52 8 92 0 92 m 80 0 l 88 0 88 38 112 18 118 24 88 50 118 72 112 78 88 58 88 92 80 92`);
  }
 }
}

export function selectAutomaticPreviewBrolls(proposal,options,duration){
 if(proposal?.schema!=='sues-director-library-cues/v1')return [];
 const out=[],used=new Set(),cutoff=duration-3;
 for(const cue of proposal.cues??[]){
  if(cue.decision!=='contextual-review-only'||!cue.narrative?.intent||cue.start<2||cue.end>cutoff||cue.end-cue.start<2.5||cue.end-cue.start>6)continue;
  if(out.some(e=>cue.start<e.end+3&&cue.end>e.start-3)||
   (options.zoomEvents??[]).some(e=>cue.start<e.end&&cue.end>e.start)||
   (options.reviewedDepthText?.events??[]).some(e=>cue.start<e.end&&cue.end>e.start))continue;
  const c=cue.candidates.find(c=>{
   const e=c.evidence,r=e?.suggestedSourceRange;
   return c.kind==='video'&&/^[a-f0-9]{64}$/.test(c.assetId)&&!used.has(c.assetId)&&
    e?.type==='narrative-plus-human-sampled-scene'&&e.visualSample?.sampleCount>=4&&
    !e.visualSample.riskFlags.some(f=>['visible-third-party-marking','unrelated-on-screen-text'].includes(f))&&
    e.temporalReview?.complete===true&&r?.source==='full-timeline-cut-black-analysis'&&
    Number.isFinite(r.startSec)&&r.startSec>=0&&Math.abs(r.endSec-r.startSec-(cue.end-cue.start))<.02;
  });
  if(!c)continue;
  used.add(c.assetId);out.push({assetId:c.assetId,start:cue.start,end:cue.end,sourceIn:c.evidence.suggestedSourceRange.startSec,
   reason:('Propuesta automática para revisar: '+cue.narrative.label).slice(0,160)});
  if(out.length>=3)break;
 }
 return out;
}
const spokenTokens=text=>String(text??'').normalize('NFKC').toLocaleLowerCase('es').match(/[\p{L}\p{N}]+/gu)?.join(' ')??'';
// Only an exact, complete spoken phrase can be represented by its visible hero.
// Partial overlap or a paraphrased label must never remove transcript words.
export function masterGraphicCoversCaption(plan,caption){
 const spoken=spokenTokens(caption.text);if(!spoken)return false;
 return (plan.masterGraphics??[]).some(g=>spokenTokens(g.label)===spoken&&
  Number.isFinite(g.start)&&Number.isFinite(g.end)&&g.start<=caption.start+1e-6&&g.end>=caption.end-1e-6);
}
