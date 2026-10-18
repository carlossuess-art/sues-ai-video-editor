import {shortCaptionGroups} from './short-captions.js';
import {fitCaptionSize} from './font-kits.js';
import {prepareBackgroundAudio,backgroundAudioFilter} from './audio-mix.js';
import {prepareSemanticRender,semanticZoomFilter} from './semantic-render.js';
import {buildTimeMap,mapCameraToEdit} from './time-map.js';
import {mapWordsToTimeline,segmentWords} from './transcript.js';
import {compileTemplatePolicy} from './template.js';
import {buildCinematicBrollPlan} from './cinematic-style.js';
import {validateSafePlacement,PORTRAIT_SAFE_ZONES} from './vision.js';
const assert=(ok,msg)=>{if(!ok)throw new Error(`Local preview: ${msg}`);};
const finite=Number.isFinite;
export const PREVIEW_LAYOUT=Object.freeze({
  title:{left:120,right:900,top:200,bottom:330},
  caption:{left:120,right:900,top:1190,bottom:1400},
  outro:{left:120,right:900,top:1430,bottom:1530}
});

export function wrapCaption(text,maxChars=26,maxLines=2){
  const words=text.trim().split(/\s+/);
  assert(words.every(w=>w.length<=maxChars),'word exceeds caption line limit');
  if(text.length<=maxChars)return [text];
  if(maxLines===2){
    const splits=words.slice(1).map((_,i)=>[words.slice(0,i+1).join(' '),words.slice(i+1).join(' ')])
      .filter(lines=>lines.every(line=>line.length<=maxChars));
    splits.sort((a,b)=>Math.abs(a[0].length-a[1].length)-Math.abs(b[0].length-b[1].length));
    if(splits.length)return splits[0];
  }
  throw new Error('Local preview: text exceeds caption layout');
}

function validateCamera(camera,width,height){
  assert(camera?.keyframes?.length>0,'camera frames');
  let previous=-1;
  for(const k of camera.keyframes){
    assert(['time','x','y','width','height','zoom'].every(n=>finite(k[n])),'camera finite');
    assert(k.time>previous&&k.time>=0,'camera order');previous=k.time;
    assert(k.x>=0&&k.y>=0&&k.width>=2&&k.height>=2&&k.x+k.width<=width+1e-6&&k.y+k.height<=height+1e-6,'camera bounds');
    assert(Math.abs(k.width/k.height-9/16)<1e-6,'portrait crop');
    const effectiveZoom=Math.min(height,width/(9/16))/k.height;
    assert(effectiveZoom<=1.6+1e-6&&Math.abs(k.zoom-effectiveZoom)<1e-4,'absolute camera zoom exceeds limit or disagrees with crop');
    assert(Math.abs(k.width-camera.keyframes[0].width)<1e-6&&Math.abs(k.height-camera.keyframes[0].height)<1e-6,'variable-size camera needs another renderer');
  }
}

export function prepareLocalPreview({template,brand,transcript,camera,source,segments,slots=[],assets=[],mediaBindings={},director,visionFrames=[],catalog=[],backgroundAudio}){
  assert(source&&finite(source.duration)&&Number.isInteger(source.width)&&Number.isInteger(source.height),'source');
  assert(Math.abs(source.duration-transcript.sourceDuration)<.05,'transcript/source duration');
  validateCamera(camera,source.width,source.height);
  const policy=compileTemplatePolicy(template,brand),timeMap=buildTimeMap(segments,source.duration);
  assert(timeMap.spans.slice(0,-1).every(s=>Math.abs((s.editOut-s.editIn)*30-Math.round((s.editOut-s.editIn)*30))<1e-6),'non-final cuts must have a whole number of 30fps frames');
  assert(timeMap.duration>policy.outro.duration,'duration shorter than outro');
  const mapped=mapWordsToTimeline(transcript,segments);
  // Conservative blocks fit shared-kit line limits. No invented karaoke timings.
  const blocks=policy.captions.mode==='short-groups'?shortCaptionGroups(mapped.words,{maxWords:policy.captions.maxWords,maxChars:policy.captions.maxCharsPerLine,maxDuration:policy.captions.maxDuration}):segmentWords(mapped.words,{maxWords:6,maxChars:policy.captions.maxCharsPerLine*policy.captions.maxLines-10,maxDuration:4.5});
  const captions=blocks.map(b=>({...b,lines:wrapCaption(b.text,policy.captions.maxCharsPerLine,policy.captions.maxLines)}));
  for(const [key,box]of Object.entries(PREVIEW_LAYOUT)){
    assert(validateSafePlacement(box,key==='caption'?PORTRAIT_SAFE_ZONES.captions:PORTRAIT_SAFE_ZONES.content),'safe layout');
    assert(box.right<=PORTRAIT_SAFE_ZONES.avoid.right.left,'right UI avoidance');
  }
  const broll=buildCinematicBrollPlan({policy,duration:timeMap.duration,slots,assets});
  assert(assets.every(a=>a.role!=='style-reference'&&a.brollEligible!==false),'reference media cannot become B-roll');
  const selectedMedia=broll.decisions.filter(d=>d.type==='broll').map(d=>{
    const path=Object.hasOwn(mediaBindings,d.sourceRef)?mediaBindings[d.sourceRef]:null;
    assert(typeof path==='string'&&path.length>0,'B-roll requires verified renderer bindings');
    return {...d,localFile:path};
  });
  const semantic=prepareSemanticRender({director,policy,camera,timeMap,visionFrames,catalog,broll,captions,layout:PREVIEW_LAYOUT});
  return {version:'1.0',kind:'local-preview',source,policy,timeMap,camera,semantic,
    cameraSpans:mapCameraToEdit(camera,timeMap),captions,broll,selectedMedia,layout:PREVIEW_LAYOUT,
    audioMix:prepareBackgroundAudio(backgroundAudio,timeMap.duration),duration:timeMap.duration,renderColors:{dark:brand.colors.dark},originalVoice:true,colorTreatment:'identity-natural',
    renderReady:true,productionReady:false,
    pending:['automated-director-selection','real-broll-visual-acceptance','music-and-sfx','full-audiovisual-acceptance','app-e2e']};
}

const assColor=hex=>'&H00'+hex.slice(5,7)+hex.slice(3,5)+hex.slice(1,3);
const safeText=text=>text.replaceAll('\\','＼').replaceAll('{','｛').replaceAll('}','｝').replace(/[\r\n]/g,' ');
const timestamp=time=>{
  const n=Math.round(time*100);return `${Math.floor(n/360000)}:${String(Math.floor(n/6000)%60).padStart(2,'0')}:${String(Math.floor(n/100)%60).padStart(2,'0')}.${String(n%100).padStart(2,'0')}`;
};
export function buildPreviewASS(plan,{fontFamily=plan.policy.captions.font}={}){
  assert(/^[\p{L}\p{N} ._-]+$/u.test(fontFamily),'font name');
  const white=assColor(plan.policy.captions.color),gold=assColor(plan.policy.captions.accent),dark=assColor(plan.renderColors.dark);
  let out=`[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Caption,${fontFamily},${plan.policy.captions.fontSize??56},${white},${gold},&H70000000,&H90000000,-1,0,0,0,100,100,0,0,1,2,1,5,120,180,0,1\nStyle: Outro,${fontFamily},44,${gold},${gold},${dark},${dark},0,0,0,0,100,100,0,0,1,0,0,5,120,180,0,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const event=(layer,start,end,style,text)=>{out+=`Dialogue: ${layer},${timestamp(start)},${timestamp(end)},${style},,0,0,0,,${text}\n`;};
  for(const c of plan.captions){
    const focus=c.source!=='manual'&&(plan.semantic?.motions??[]).find(m=>m.backgroundTreatment&&c.start>=m.start-1e-6&&c.end<=m.end+1e-6&&c.wordIndexes.every(index=>(m.evidence?.sourceWordIndexes??[]).includes(index)));if(focus)continue;
    let wordOffset=0;const content=c.lines.map(line=>line.split(' ').map(word=>{const index=c.wordIndexes[wordOffset++],text=safeText(word);return c.emphasisWordIndexes?.includes(index)?`{\\1c${gold}&}${text}{\\1c${white}&}`:text;}).join(' ')).join('\\N');
    const b=plan.layout.caption,p=plan.policy.captions,size=fitCaptionSize(c.lines,p),fade=p.fadeMs??60,entrance=p.entranceMs??180,motion=p.mode==='short-groups'?`\\fs${size}\\fscx${p.scaleX}\\fsp${p.tracking}\\fad(${fade},${fade})\\fscy98\\t(0,${entrance},\\fscy100)`:'';event(1,c.start,c.end,'Caption',`{\\pos(${(b.left+b.right)/2},${(b.top+b.bottom)/2})${motion}}${content}`);
  }
  for(const m of plan.semantic?.motions??[]){
    const b=m.box,cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2,paint=assColor(plan.renderColors.dark).slice(4);
    const goldCode=assColor(plan.policy.captions.accent).slice(4);
    if(m.params.motionId==='QUOTE_CARD_01'&&m.backgroundTreatment){
      const size=fitCaptionSize(m.lines,{...plan.policy.captions,fontSize:104});
      event(2,m.start,m.end,'Outro',`{\\an7\\pos(${b.left},${b.top})\\p1\\bord0\\1c&H${paint}&\\1a&H35&\\fad(350,350)}m 0 0 l 780 0 780 300 0 300`);
      event(3,m.start,m.end,'Outro',`{\\pos(${cx},${cy})\\fs${size}\\b1\\fad(350,350)}${m.lines.map(safeText).join('\\N')}`);
    }else if(m.params.motionId==='QUOTE_CARD_01'){
      event(2,m.start,m.end,'Outro',`{\\an7\\pos(${b.left},${b.top})\\p1\\bord0\\1c&H${paint}&\\1a&H35&\\fad(200,250)}m 0 0 l 780 0 780 150 0 150`);
      event(3,m.start,m.end,'Outro',`{\\pos(${cx},${cy})\\fs44\\b1\\fad(200,250)}${m.lines.map(safeText).join('\\N')}`);
    }else if(m.params.motionId==='DIVIDER_LINE_01'){
      event(3,m.start,m.end,'Outro',`{\\an7\\pos(${b.left},${cy})\\p1\\bord0\\1c&H${goldCode}&\\fscx0\\t(0,300,\\fscx100)\\fad(100,250)}m 0 0 l 780 0 780 3 0 3`);
    }else if(m.params.motionId==='NUMBER_BADGE_GOLD_01'){
      const number=m.instance.layers.find(l=>l.id==='number').content;
      event(3,m.start,m.end,'Outro',`{\\pos(${b.left+50},${cy})\\fs64\\b1\\fad(180,200)}${number}`);
      event(3,m.layerTimes.label.start,m.layerTimes.label.end,'Outro',`{\\pos(${cx+55},${cy})\\1c${white}&\\fs42\\fad(180,200)}${m.lines.map(safeText).join('\\N')}`);
    }
  }
  const b=plan.layout.outro,start=plan.duration-plan.policy.outro.duration;
  const color=hex=>assColor(hex).slice(4);
  event(0,start,plan.duration,'Outro',`{\\an7\\pos(${b.left},${b.top})\\p1\\bord0\\1c&H${color(plan.renderColors.dark)}&\\1a&H40&\\fad(250,0)}m 0 0 l ${b.right-b.left} 0 ${b.right-b.left} ${b.bottom-b.top} 0 ${b.bottom-b.top}`);
  event(1,start,plan.duration,'Outro',`{\\pos(${(b.left+b.right)/2},${(b.top+b.bottom)/2})\\fad(250,0)}${safeText(plan.policy.outro.text)}`);
  return out;
}

// Piecewise source-time interpolation. Holds endpoints, never bridges a removed span.
export function cameraExpression(camera,field){
  assert(['x','y'].includes(field),'camera expression field');
  const keys=camera.keyframes;let out=String(keys[0][field]);
  for(let i=1;i<keys.length;i++){
    const a=keys[i-1],b=keys[i],delta=b[field]-a[field];
    if(Math.abs(delta)>1e-9)out+=`+(${delta})*clip((t-${a.time})/${b.time-a.time},0,1)`;
  }
  return out;
}

export function buildPreviewFilter(plan,{assFile='captions.ass',hasAudio=true}={}){
  assert(/^[A-Za-z0-9_.-]+$/.test(assFile),'ASS filename must be local basename');
  assert(Array.isArray(plan.selectedMedia),'selected media contract');
  const spans=plan.timeMap.spans,n=spans.length,k=plan.camera.keyframes[0];
  const width=Math.floor(k.width/2)*2,height=Math.floor(k.height/2)*2;
  const x=cameraExpression(plan.camera,'x'),y=cameraExpression(plan.camera,'y');
  const filters=[];
  if(n>1){filters.push(`[0:v]split=${n}${spans.map((_,i)=>`[sv${i}]`).join('')}`);if(hasAudio)filters.push(`[0:a]asplit=${n}${spans.map((_,i)=>`[sa${i}]`).join('')}`);}
  for(const s of spans){
    const i=s.index,vin=n>1?`sv${i}`:'0:v',ain=n>1?`sa${i}`:'0:a';
    filters.push(`[${vin}]trim=start=${s.sourceIn}:end=${s.sourceOut},crop=w=${width}:h=${height}:x='${x}':y='${y}':exact=1,setpts=PTS-${s.sourceIn}/TB,scale=1080:1920:flags=lanczos,setsar=1,fps=fps=30:start_time=0,format=yuv420p[v${i}]`);
    if(hasAudio)filters.push(`[${ain}]atrim=start=${s.sourceIn}:end=${s.sourceOut},asetpts=PTS-${s.sourceIn}/TB,aresample=48000:async=1:first_pts=0[a${i}]`);
  }
  filters.push(`${spans.map((_,i)=>`[v${i}]${hasAudio?`[a${i}]`:''}`).join('')}concat=n=${n}:v=1:a=${hasAudio?1:0}[base]${hasAudio?'[audio]':''}`);
  let base='base';
  const zoomFilter=semanticZoomFilter(plan.semantic??{zooms:[]});
  if(zoomFilter){filters.push(`[base]${zoomFilter}[semantic-base]`);base='semantic-base';}
  for(const [i,d]of plan.selectedMedia.entries()){
    filters.push(`[${i+1}:v]trim=start=${d.sourceIn}:end=${d.sourceOut},setpts=PTS-${d.sourceIn}/TB,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=fps=30:start_time=0,setpts=PTS+${d.start}/TB[broll${i}]`);
    filters.push(`[${base}][broll${i}]overlay=eof_action=pass:repeatlast=0:enable='gte(t,${d.start})*lt(t,${d.end})'[composed${i}]`);base=`composed${i}`;
  }
  for(const [i,m] of (plan.semantic?.motions??[]).filter(m=>m.backgroundTreatment).entries()){
    const r=m.backgroundTreatment,duration=m.end-m.start,fade=Math.min(r.fadeSeconds,duration/3),sigma=r.sigma/4;
    filters.push(`[${base}]split=2[focus-clear${i}][focus-input${i}]`);
    filters.push(`[focus-input${i}]trim=start=${m.start}:end=${m.end},setpts=PTS-STARTPTS,scale=270:480,gblur=sigma=${sigma},scale=1080:1920,eq=brightness=-${r.dim},format=yuva420p,fade=t=in:st=0:d=${fade}:alpha=1,fade=t=out:st=${duration-fade}:d=${fade}:alpha=1,setpts=PTS+${m.start}/TB[focus-layer${i}]`);
    filters.push(`[focus-clear${i}][focus-layer${i}]overlay=eof_action=pass:repeatlast=0:enable='gte(t,${m.start})*lt(t,${m.end})'[focus-composed${i}]`);base=`focus-composed${i}`;
  }
  filters.push(`[${base}]ass=filename=${assFile}:fontsdir=fonts[video]`);
  assert(!plan.audioMix||hasAudio,'background music requires original voice track');
  filters.push(...backgroundAudioFilter(plan.audioMix,1+plan.selectedMedia.length));
  return filters.join(';\n')+'\n';
}
