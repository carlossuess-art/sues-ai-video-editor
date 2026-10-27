import {foregroundEffectFilters} from './foreground-effects.js';
import {subjectLayerFilters} from './subject-layers.js';
import {drawElements} from './elements.js';
import {renderAudioFilters} from './sound-effects.js';
import {technicalPaperFilters} from './technical-paper.js';
import {drawGraphicBlocks,globalTransitionFilters} from './graphic-blocks.js';
import {drawSymbolMotion} from './motion-overlays.js';
import {keywordPreset} from './text-presets.js';
import {illustrationFilters} from './illustrations.js';
import {captionCues,progressiveRuns} from './caption-motion.js';
import {drawMasterGraphics,masterGraphicCoversCaption} from './dopamin-master.js';
import {drawDepthText} from './depth-text.js';
import {hierarchyLayout,METALLIC_GOLD} from './caption-hierarchy.js';
import {shortCaptionGroups} from './short-captions.js';
import {fitCaptionSize,typefaceTags} from './font-kits.js';
import {prepareBackgroundAudio} from './audio-mix.js';
import {prepareSemanticRender,semanticZoomFilter} from './semantic-render.js';
import {buildTimeMap,mapCameraToEdit} from './time-map.js';
import {mapWordsToTimeline,segmentWords} from './transcript.js';
import {compileTemplatePolicy} from './template.js';
import {buildCinematicBrollPlan,buildExplicitBrollPlan} from './cinematic-style.js';
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
  const fit=camera.mode==='full-frame-fit';
  let previous=-1;
  for(const k of camera.keyframes){
    assert(['time','x','y','width','height','zoom'].every(n=>finite(k[n])),'camera finite');
    assert(k.time>previous&&k.time>=0,'camera order');previous=k.time;
    assert(k.x>=0&&k.y>=0&&k.width>=2&&k.height>=2&&k.x+k.width<=width+1e-6&&k.y+k.height<=height+1e-6,'camera bounds');
    if(fit){assert(k.x===0&&k.y===0&&k.width===width&&k.height===height&&k.zoom===1,'full-frame fit must preserve original bounds');continue;}
    assert(Math.abs(k.width/k.height-9/16)<1e-6,'portrait crop');
    const effectiveZoom=Math.min(height,width/(9/16))/k.height;
    assert(effectiveZoom<=1.6+1e-6&&Math.abs(k.zoom-effectiveZoom)<1e-4,'absolute camera zoom exceeds limit or disagrees with crop');
    assert(Math.abs(k.width-camera.keyframes[0].width)<1e-6&&Math.abs(k.height-camera.keyframes[0].height)<1e-6,'variable-size camera needs another renderer');
  }
}

export function prepareLocalPreview({template,brand,transcript,camera,source,segments,slots=[],assets=[],mediaBindings={},manualBroll=[],director,visionFrames=[],catalog=[],backgroundAudio,previewLayout=PREVIEW_LAYOUT}){
  assert(source&&finite(source.duration)&&Number.isInteger(source.width)&&Number.isInteger(source.height),'source');
  assert(Math.abs(source.duration-transcript.sourceDuration)<.05,'transcript/source duration');
  validateCamera(camera,source.width,source.height);
  const policy=compileTemplatePolicy(template,brand),timeMap=buildTimeMap(segments,source.duration);
  assert(timeMap.spans.slice(0,-1).every(s=>Math.abs((s.editOut-s.editIn)*30-Math.round((s.editOut-s.editIn)*30))<1e-6),'non-final cuts must have a whole number of 30fps frames');
  assert(timeMap.duration>policy.outro.duration,'duration shorter than outro');
  const mapped=mapWordsToTimeline(transcript,segments);
  // Conservative blocks fit shared-kit line limits. No invented karaoke timings.
  const blocks=policy.captions.mode==='short-groups'?shortCaptionGroups(mapped.words,{maxWords:policy.captions.maxWords,maxChars:policy.captions.maxCharsPerLine,maxDuration:policy.captions.maxDuration}):segmentWords(mapped.words,{maxWords:6,maxChars:policy.captions.maxCharsPerLine*policy.captions.maxLines-10,maxDuration:4.5});
  const captions=blocks.map(b=>({...b,lines:wrapCaption(b.text,policy.captions.maxCharsPerLine,policy.captions.maxLines),wordCues:captionCues(b,mapped.words)}));
  for(const [key,box]of Object.entries(previewLayout)){
    assert(validateSafePlacement(box,key==='caption'&&camera.mode!=='reviewed-region'&&camera.detectionMethod!=='yunet-opencv-cpu'?PORTRAIT_SAFE_ZONES.captions:PORTRAIT_SAFE_ZONES.content),'safe layout');
    assert(box.right<=PORTRAIT_SAFE_ZONES.avoid.right.left,'right UI avoidance');
  }
  const broll=manualBroll.length?buildExplicitBrollPlan({policy,duration:timeMap.duration,events:manualBroll}):buildCinematicBrollPlan({policy,duration:timeMap.duration,slots,assets});
  assert(assets.every(a=>a.role!=='style-reference'&&a.brollEligible!==false),'reference media cannot become B-roll');
  const selectedMedia=broll.decisions.filter(d=>d.type==='broll').map(d=>{
    const path=d.localFile??(Object.hasOwn(mediaBindings,d.sourceRef)?mediaBindings[d.sourceRef]:null);
    assert(typeof path==='string'&&path.length>0,'B-roll requires verified renderer bindings');
    return {...d,localFile:path};
  });
  let semantic;
  const subjectLayout=camera.detectionMethod==='yunet-opencv-cpu'&&previewLayout===PREVIEW_LAYOUT;
  const top={...previewLayout,caption:{left:120,right:900,top:190,bottom:350}};
  const chest={...previewLayout,caption:{left:120,right:900,top:1370,bottom:1510},outro:{left:120,right:900,top:190,bottom:330}};
  const upperStack={...previewLayout,caption:{left:120,right:900,top:190,bottom:350},outro:{left:120,right:900,top:360,bottom:460}};
  const layouts=subjectLayout?(policy.templateId==='SUES_DOPAMIN'?[top,chest,previewLayout,upperStack]:[previewLayout,chest,top,upperStack]):[previewLayout];
  let layoutError;
  for(const candidate of layouts){
    try{for(const box of Object.values(candidate)){assert(validateSafePlacement(box,PORTRAIT_SAFE_ZONES.content)&&box.right<=PORTRAIT_SAFE_ZONES.avoid.right.left,'safe candidate layout');}semantic=prepareSemanticRender({director,policy,camera,timeMap,visionFrames,catalog,broll,captions,layout:candidate,source});previewLayout=candidate;layoutError=null;break;}
    catch(error){layoutError=error;}
  }
  if(layoutError)throw layoutError;
  return {version:'1.0',kind:'local-preview',source,policy,timeMap,camera,semantic,
    cameraSpans:mapCameraToEdit(camera,timeMap),captions,broll,selectedMedia,layout:previewLayout,
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
  if(plan.policy.captions.font==='Montserrat')out=out.replace(',-1,0,0,0,100,100,0,0,1,2,1,5,120,180,0,1',',700,0,0,0,100,100,0,0,1,0,0,5,120,180,0,1');
  const event=(layer,start,end,style,text)=>{out+=`Dialogue: ${layer},${timestamp(start)},${timestamp(end)},${style},,0,0,0,,${text}\n`;};
  drawDepthText(plan,event,safeText,assColor);
  drawMasterGraphics(plan,event,safeText,assColor);
  drawElements(plan,event,safeText,assColor);
  for(const c of plan.captions){
    if(masterGraphicCoversCaption(plan,c))continue;
    const white=assColor((plan.graphics??[]).some(g=>g.type!=='secret'&&c.start>=g.start-1e-6&&c.end<=g.end+1e-6)?plan.renderColors.dark:plan.policy.captions.color);
    const focus=c.source!=='manual'&&(plan.semantic?.motions??[]).find(m=>m.backgroundTreatment&&c.start>=m.start-1e-6&&c.end<=m.end+1e-6&&c.wordIndexes.every(index=>(m.evidence?.sourceWordIndexes??[]).includes(index)));if(focus||(plan.graphics??[]).some(g=>g.replacedCaptionIds?.includes(c.id)||!g.heading&&!g.bodyLines&&g.type!=='compare'&&g.captionId===c.id&&g.text===c.text))continue;
    // A bright stock sky can defeat a white caption even with a soft shadow.
    // The backplate exists only over an active B-roll/caption intersection.
    for(const media of plan.selectedMedia??[]){
      const start=Math.max(c.start,media.start),end=Math.min(c.end,media.end);
      if(end<=start)continue;
      const b=plan.layout.caption,w=b.right-b.left+40,h=b.bottom-b.top,fade=Math.min(80,Math.round((end-start)*150));
      event(0,start,end,'Caption',`{\\an7\\pos(${b.left-20},${b.top})\\p1\\bord0\\shad0\\1c&H191208&\\1a&H38&\\fad(${fade},${fade})}m 18 0 l ${w-18} 0 b ${w} 0 ${w} 0 ${w} 18 l ${w} ${h-18} b ${w} ${h} ${w} ${h} ${w-18} ${h} l 18 ${h} b 0 ${h} 0 ${h} 0 ${h-18} l 0 18 b 0 0 0 0 18 0`);
    }
    const hierarchy=hierarchyLayout(c,plan.policy.captions,plan.layout.caption);
    const p=plan.policy.captions,b=plan.layout.caption,displayLines=p.inlineGroups?[c.text]:c.lines,normalSize=fitCaptionSize(displayLines,p);
    const normalRows=displayLines.map((text,i)=>({text,size:normalSize,x:(b.left+b.right)/2,y:(b.top+b.bottom)/2+(i-(displayLines.length-1)/2)*normalSize*1.1,role:'companion'}));
    const progressive=progressiveRuns(c,hierarchy??normalRows,p);
    if(hierarchy||progressive){
      const p=plan.policy.captions,fade=p.fadeMs??60;
      for(const row of progressive??hierarchy){
        const start=row.start??c.start,end=row.end??c.end,settle=Math.round((row.settle??0)*1000);
        const entrance=row.character?`\\move(${row.x},${row.y+8},${row.x},${row.y},0,${settle})\\frz-3\\t(0,${settle},\\frz0)`:`\\pos(${row.x},${row.y})`;
        const kinetic=plan.dopaminMaster&&!row.character?`\\fscy${row.role==='keyword'?125:88}\\t(0,130,\\fscy100)`:'';
        const style=`${kinetic}${entrance}${typefaceTags(p,row.role==='keyword'?'keyword':'normal',row.italic)}\\fs${row.size}\\fscx${row.scaleX??p.scaleX}\\i${row.italic?1:0}\\fsp${row.character?0:p.tracking}\\fad(${Math.min(fade,Math.round((end-start)*150))},${fade})${p.shadow?'\\bord0\\shad0':''}`;
        const preset=keywordPreset(c.keyword),palette=preset.colors;
        if(p.shadow){
          const s=p.shadow,dx=s.distancePx*Math.cos(s.angleDeg*Math.PI/180),dy=s.distancePx*Math.sin(s.angleDeg*Math.PI/180),alpha=Math.round((1-s.opacity)*255).toString(16).padStart(2,'0').toUpperCase();
          const shifted=row.character?`\\move(${row.x+dx},${row.y+8+dy},${row.x+dx},${row.y+dy},0,${settle})`:`\\pos(${row.x+dx},${row.y+dy})`;
          event(0,start,end,'Caption',`{${style.replace(entrance,shifted)}\\1c&H000000&\\1a&H${alpha}&\\blur${s.blurPx}\\bord0\\shad0}${safeText(row.text)}`);
        }
        if(row.role==='keyword'&&(palette||preset.color!=='#FFFFFF')&&p.glow?.enabled){
          const color={fire:'#FF7A18',fireMetal:'#FF7A18',gold:'#FFD700',green:'#00FF66',cyan:'#00E5FF',blue:'#528CFF',coral:'#FF3333'}[c.keyword.style??'gold']??palette?.[4]??preset.color,alpha=Math.round((1-p.glow.intensity)*255).toString(16).padStart(2,'0').toUpperCase();
          event(0,start,end,'Caption',`{${style}\\1c${assColor(color)}&\\1a&H${alpha}&\\blur${p.glow.assBlurPx}\\bord3\\3c${assColor(color)}&\\3a&H${alpha}&\\shad0}${safeText(row.text)}`);
        }
        if(row.role==='keyword'&&palette){
          // Single outline/shadow base; opaque, mutually exclusive fill bands.
          // No stacked outlines, no dark seams between overlapping glyphs.
          event(1,start,end,'Caption',`{${style}\\1c${assColor(palette[0])}&}${safeText(row.text)}`);
          const top=row.y-row.size*.65,bottom=row.y+row.size*.65;
          for(const [i,color]of palette.entries()){
            const y1=Math.floor(top+(bottom-top)*i/palette.length),y2=Math.floor(top+(bottom-top)*(i+1)/palette.length);
            event(2,start,end,'Caption',`{${style}\\bord0\\shad0\\clip(0,${y1},1080,${y2})\\1c${assColor(color)}&}${safeText(row.text)}`);
          }
        }else event(1,start,end,'Caption',`{${style}\\1c${row.role==='keyword'?assColor(preset.color):white}&}${safeText(row.text)}`);
      }
      continue;
    }
    let wordOffset=0;const content=c.lines.map(line=>line.split(' ').map(word=>{const index=c.wordIndexes[wordOffset++],text=safeText(word);return c.emphasisWordIndexes?.includes(index)?`{\\1c${gold}&}${text}{\\1c${white}&}`:text;}).join(' ')).join('\\N');
    const size=fitCaptionSize(c.lines,p),fade=p.fadeMs??60,entrance=p.entranceMs??180,motion=p.mode==='short-groups'?`${typefaceTags(p)}\\fs${size}\\fscx${p.scaleX}\\fsp${p.tracking}\\fad(${fade},${fade})\\fscy98\\t(0,${entrance},\\fscy100)`:'';
    if(p.shadow){const s=p.shadow,dx=s.distancePx*Math.cos(s.angleDeg*Math.PI/180),dy=s.distancePx*Math.sin(s.angleDeg*Math.PI/180),alpha=Math.round((1-s.opacity)*255).toString(16).padStart(2,'0').toUpperCase();event(0,c.start,c.end,'Caption',`{\\pos(${(b.left+b.right)/2+dx},${(b.top+b.bottom)/2+dy})${motion}\\1c&H000000&\\1a&H${alpha}&\\blur${s.blurPx}\\bord0\\shad0}${c.lines.map(safeText).join('\\N')}`);}
    event(1,c.start,c.end,'Caption',`{\\pos(${(b.left+b.right)/2},${(b.top+b.bottom)/2})${motion}}${content}`);
  }
  drawGraphicBlocks(plan,event,safeText,assColor);
  for(const m of plan.semantic?.motions??[]){
    drawSymbolMotion(m,plan,event,safeText,assColor);
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
      const number=m.instance.layers.find(l=>l.id==='number').content,labelSize=m.fontSize;
      event(3,m.start,m.end,'Outro',`{\\pos(${b.left+50},${cy})\\fs64\\b1\\1c${assColor(plan.policy.captions.accent)}&\\fad(180,200)}${number}`);
      event(3,m.layerTimes.label.start,m.layerTimes.label.end,'Outro',`{\\clip(${b.left+120},${b.top},${b.right},${b.bottom})\\pos(${cx+55},${cy})\\1c${white}&\\fs${labelSize}\\fad(180,200)}${m.lines.map(safeText).join('\\N')}`);
    }
  }
  if(plan.policy.outro.duration<=0)return out;
  const b=plan.layout.outro,start=plan.duration-plan.policy.outro.duration;
  const color=hex=>assColor(hex).slice(4);
  event(0,start,plan.duration,'Outro',`{\\an7\\pos(${b.left},${b.top})\\p1\\bord0\\1c&H${color(plan.renderColors.dark)}&\\1a&H80&\\fad(220,0)}m 0 0 l ${b.right-b.left} 0 ${b.right-b.left} ${b.bottom-b.top} 0 ${b.bottom-b.top}`);
  const parts=plan.policy.outro.text.split(' · '),cx=(b.left+b.right)/2,p=plan.policy.captions;
  if(parts.length===2){
    const title=fitCaptionSize([parts[0]],{...p,fontSize:88},b.right-b.left-80),signature=fitCaptionSize([parts[1].toLocaleUpperCase('es')],{...p,fontRole:'keyword',fontSize:64,tracking:4},b.right-b.left-80);
    event(1,start,plan.duration,'Outro',`{${typefaceTags(p)}\\move(${cx},${b.top+32},${cx},${b.top+24},0,180)\\fs${title}\\1c&HFFFFFF&\\bord0\\shad1\\blur5\\t(0,180,\\blur0)\\fad(160,0)}${safeText(parts[0])}`);
    event(1,start+.12,plan.duration,'Outro',`{${typefaceTags(p,'keyword')}\\pos(${cx},${b.bottom-20})\\fs${signature}\\fsp4\\1c${assColor(plan.policy.captions.accent)}&\\fad(160,0)}${safeText(parts[1].toLocaleUpperCase('es'))}`);
  }else{
    const size=fitCaptionSize([plan.policy.outro.text],{...p,fontSize:86},b.right-b.left-80);
    event(1,start,plan.duration,'Outro',`{${typefaceTags(p)}\\pos(${cx},${(b.top+b.bottom)/2})\\fs${size}\\fad(180,0)}${safeText(plan.policy.outro.text)}`);
  }
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
    const framing=plan.camera.mode==='full-frame-fit'?'scale=1080:1920:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x081219':`crop=w=${width}:h=${height}:x='${x}':y='${y}':exact=1`;
    // Preserve the planned final frame when phone video ends before its audio.
    // Apply the existing fit-mode duration contract to tracked crops as well.
    filters.push(`[${vin}]trim=start=${s.sourceIn}:end=${s.sourceOut},${framing},setpts=PTS-${s.sourceIn}/TB,${plan.camera.mode==='full-frame-fit'?'':'scale=1080:1920:flags=lanczos,'}setsar=1,fps=fps=30:start_time=0,tpad=stop_mode=clone:stop_duration=${s.sourceOut-s.sourceIn},trim=duration=${s.sourceOut-s.sourceIn},format=yuv420p[v${i}]`);
    if(hasAudio)filters.push(`[${ain}]atrim=start=${s.sourceIn}:end=${s.sourceOut},asetpts=PTS-${s.sourceIn}/TB,aresample=48000:async=1:first_pts=0[a${i}]`);
  }
  filters.push(`${spans.map((_,i)=>`[v${i}]${hasAudio?`[a${i}]`:''}`).join('')}concat=n=${n}:v=1:a=${hasAudio?1:0}[base]${hasAudio?'[audio]':''}`);
  let base='base';
  const zoomFilter=semanticZoomFilter(plan.semantic??{zooms:[]});
  if(zoomFilter){filters.push(`[base]${zoomFilter}[semantic-base]`);base='semantic-base';}
  const fg=foregroundEffectFilters(plan.foregroundEffects,base,1+plan.selectedMedia.length+(plan.illustrations?.length??0)+2*(plan.subjectLayers?.length??0)+(plan.ambientOverlays?.length??0));filters.push(...fg.filters);base=fg.base;
  for(const [i,d]of plan.selectedMedia.entries()){
    filters.push(`[${i+1}:v]trim=start=${d.sourceIn}:end=${d.sourceOut},setpts=PTS-${d.sourceIn}/TB,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=fps=30:start_time=0,setpts=PTS+${d.start}/TB[broll${i}]`);
    filters.push(`[${base}][broll${i}]overlay=eof_action=pass:repeatlast=0:enable='gte(t,${d.start})*lt(t,${d.end})'[composed${i}]`);base=`composed${i}`;
  }
  const subject=subjectLayerFilters(plan.subjectLayers??[],base,1+plan.selectedMedia.length+(plan.illustrations?.length??0));filters.push(...subject.filters);base=subject.base;
  const illustrated=illustrationFilters(plan.illustrations??[],base,1+plan.selectedMedia.length);filters.push(...illustrated.filters);base=illustrated.base;
  for(const [i,a] of (plan.ambientOverlays??[]).entries()){
    const input=1+plan.selectedMedia.length+(plan.illustrations?.length??0)+2*(plan.subjectLayers?.length??0)+i;
    const duration=Number((a.end-a.start).toFixed(6)),fade=Math.min(.12,duration/4);
    const alpha=Number(a.intensity.toFixed(4));
    // Feather the top 240px of lower-half imported effects to avoid a horizontal seam.
    // Captions are composed later.
    // This is deliberately NOT subject occlusion/rotoscoping. Require visual review.
    filters.push(`[${input}:v]trim=start=${a.sourceIn}:end=${a.sourceOut},setpts=PTS-STARTPTS,scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1,fps=fps=30,format=rgba,colorkey=0x000000:0.1:0.08,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='alpha(X,Y)*min(1,Y/240)',colorchannelmixer=aa=${alpha},fade=t=in:d=${fade}:alpha=1,fade=t=out:st=${Number((duration-fade).toFixed(6))}:d=${fade}:alpha=1,setpts=PTS+${a.start}/TB[ambient${i}]`);
    filters.push(`[${base}][ambient${i}]overlay=x=0:y=960:eof_action=pass:repeatlast=0:enable='gte(t,${a.start})*lt(t,${a.end})'[ambient-composed${i}]`);
    base=`ambient-composed${i}`;
  }
  for(const [i,m] of (plan.semantic?.motions??[]).filter(m=>m.backgroundTreatment).entries()){
    const r=m.backgroundTreatment,duration=m.end-m.start,fade=Math.min(r.fadeSeconds,duration/3),sigma=r.sigma/4;
    filters.push(`[${base}]split=2[focus-clear${i}][focus-input${i}]`);
    // Keep both split branches on the same timeline. Trimming a late focus input
    // stalls framesync until its first frame and buffers the full-resolution clear
    // branch (hundreds of frames), exhausting the 1 GiB editor container.
    filters.push(`[focus-input${i}]scale=270:480,gblur=sigma=${sigma},scale=1080:1920,eq=brightness=-${r.dim},format=yuva420p,fade=t=in:st=${m.start}:d=${fade}:alpha=1,fade=t=out:st=${m.end-fade}:d=${fade}:alpha=1[focus-layer${i}]`);
    filters.push(`[focus-clear${i}][focus-layer${i}]overlay=eof_action=pass:repeatlast=0:enable='gte(t,${m.start})*lt(t,${m.end})'[focus-composed${i}]`);base=`focus-composed${i}`;
  }
  const paper=technicalPaperFilters(plan.graphics??[],base,plan.globalTransitions??[]);filters.push(...paper.filters);base=paper.base;
  const hasTransitions=!!plan.globalTransitions?.length;filters.push(`[${base}]ass=filename=${assFile}:fontsdir=fonts[${hasTransitions||plan.finishFade?'captioned':'video'}]`);
  if(hasTransitions){const global=globalTransitionFilters(plan.globalTransitions,'captioned');filters.push(...global.filters,`[${global.base}]null[${plan.finishFade?'finish-input':'video'}]`);}
  if(plan.finishFade){const f=plan.finishFade;filters.push(`[${hasTransitions?'finish-input':'captioned'}]fade=t=out:st=${f.start}:d=${f.duration}[video]`);}
  assert(!plan.audioMix||hasAudio,'background music requires original voice track');
  filters.push(...renderAudioFilters(plan,1+plan.selectedMedia.length+(plan.illustrations?.length??0) +2*(plan.subjectLayers?.length??0)+(plan.ambientOverlays?.length??0)+(plan.foregroundEffects?1+plan.foregroundEffects.events.filter(e=>e.type==='behind-video').length:0),{hasAudio}));
  return filters.join(';\n')+'\n';
}

// Separate the visual graph from the voice/audio graph. Late audio sidechains
// must not pull the shared A/V concat ahead and retain full-resolution frames.
export function buildVideoPassFilter(plan,options={}){
 const visual=structuredClone(plan);
 visual.audioMix=null;visual.soundEffects={events:[]};visual.customSfx={events:[]};
 visual.voiceEffects={events:[]};visual.mastering={enabled:false};visual.voiceGain=1;
 return buildPreviewFilter(visual,{...options,hasAudio:false});
}
export function buildAudioPassFilter(plan){
 const spans=plan.timeMap.spans,filters=[];
 if(spans.length>1)filters.push(`[0:a]asplit=${spans.length}${spans.map((_,i)=>`[source-a${i}]`).join('')}`);
 for(const [i,s]of spans.entries())filters.push(`[${spans.length>1?'source-a'+i:'0:a'}]atrim=start=${s.sourceIn}:end=${s.sourceOut},asetpts=PTS-${s.sourceIn}/TB,aresample=48000:async=1:first_pts=0[a${i}]`);
 filters.push(`${spans.map((_,i)=>`[a${i}]`).join('')}concat=n=${spans.length}:v=0:a=1[audio]`);
 const mixed=renderAudioFilters(plan,1,{hasAudio:true});
 filters.push(...(mixed.length?mixed:['[audio]anull[mixed-audio]']));
 return filters.join(';\n')+'\n';
}
