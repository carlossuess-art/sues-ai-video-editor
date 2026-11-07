// Evidence-preserving extraction from a human Film Director storyboard.
// This is a technical annex, NOT an executable sues-master-story/v1.
// Never guess unverified resources, rights, transitions, font hashes or masks.
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const finite=x=>Number.isFinite(x), blocked=(code)=>({status:'BLOCKED',code,canExecute:false,approved:false});
const time=x=>{
 const parts=x.replace(',','.').split(':');
 if(parts.length>2||parts.some(y=>!/^\d+(?:\.\d+)?$/.test(y)))return NaN;
 return parts.length===2?Number(parts[0])*60+Number(parts[1]):Number(parts[0]);
};
export function translateFilmDirectorBrief({text,sourceSha256,originalSha256,timelineFingerprint,duration,fps=30}={}){
 if(typeof text!=='string'||!text.trim()||Buffer.byteLength(text)>60000||
  !/^[a-f0-9]{64}$/.test(sourceSha256??'')||!/^[a-f0-9]{64}$/.test(originalSha256??'')||
  typeof timelineFingerprint!=='string'||!finite(duration)||duration<=0||fps!==30)
  return blocked('INVALID_BRIEF_TRANSLATION_INPUT');
 if(!text.includes(originalSha256)||!text.includes('NO APROBADO / NO EJECUTAR'))
  return blocked('SOURCE_OR_REVIEW_STATUS_NOT_GROUNDED');
 const sourceLines=text.split(/\r?\n/),header=/^### Escena\s+(\d+)\s*·\s*(.*?)\s*·\s*([\d:,]+)–([\d:,]+)/;
 const sections=[];let section=null;
 sourceLines.forEach((line,i)=>{
  const match=header.exec(line);
  if(match){section={id:`scene-${match[1].padStart(2,'0')}`,name:match[2].trim(),sourceStart:time(match[3]),sourceEnd:time(match[4]),startLine:i+1,lines:[]};sections.push(section);}
  else if(/^##\s/.test(line))section=null;
  if(section)section.lines.push({line:i+1,text:line});
 });
 if(!sections.length||sections.length>300)return blocked('SCENES_UNRECOGNIZED');
 const conditions=[];
 const scenePlan=sections.map((section,i)=>{
  const start=i===0?0:Math.round(section.sourceStart*fps)/fps;
  const end=i===sections.length-1?duration:Math.round(section.sourceEnd*fps)/fps;
  if(!finite(start)||!finite(end)||end<=start||end>duration+.000001||
   i&&Math.abs(section.sourceStart-sections[i-1].sourceEnd)>.021)
   conditions.push({code:'SCENE_TIME_MAP_UNVERIFIED',subject:section.id,sourceLines:[section.startLine]});
  const shots=[];const fields=[];const notes=[];
  for(const entry of section.lines){
   const field=/^\*\*(.+?):\*\*\s*(.*)$/.exec(entry.text);
   if(field)fields.push({sourceLine:entry.line,name:field[1],value:field[2]});
   const shot=/^-\s*`\s*([\d:,]+)\s*[–-]\s*([\d:,]+)\s*s?`:\s*(.*)$/.exec(entry.text);
   if(shot){
    const a=time(shot[1]),b=time(shot[2]),
     base=/\bbase\s+\*\*(CARLOS|B0\d+|M0\d+)\*\*/.exec(shot[3]),
     hint=base?.[1]??null,
     overlays=[...shot[3].matchAll(/\bM0\d+\b/g)].map(m=>m[0]).filter(ref=>ref!==hint);
    const kind=hint?.startsWith('B')?'broll':hint?.startsWith('M')?'motion':'camera';
    const id=`${section.id}-shot-${String(shots.length+1).padStart(2,'0')}`;
    const reasons=[];
    if(!finite(a)||!finite(b)||b<=a||a<section.sourceStart-.01||b>section.sourceEnd+.01)
     reasons.push('SHOT_TIMING_UNVERIFIED');
    if(kind==='broll')reasons.push('MEDIA_ASSET_RIGHTS_AND_TRANSITIONS_UNVERIFIED');
    if(kind==='motion')reasons.push('MOTION_ASSETS_AND_EXECUTION_UNVERIFIED');
    if(kind==='camera')reasons.push('CAMERA_COMPOSITION_NOT_VERIFIED_AT_FRAME');
    if(overlays.length)reasons.push('MOTION_OVERLAY_SUPPORT_AND_ASSETS_UNVERIFIED');
    if(!hint)reasons.push('SHOT_BASE_UNRECOGNIZED');
    shots.push({id,sceneId:section.id,kind,base:hint,resourceHint:hint&&hint!=='CARLOS'?hint:null,
     overlayResourceHints:overlays,
     sourceStart:a,sourceEnd:b,editStart:finite(a)?Math.round(a*fps)/fps:null,
     editEnd:finite(b)?Math.round(b*fps)/fps:null,
     sourceLine:entry.line,verbatim:entry.text,blockingReasons:reasons,approved:false});
    conditions.push(...reasons.map(code=>({code,subject:id,sourceLines:[entry.line]})));
   }else if(entry.text.trim())notes.push({sourceLine:entry.line,verbatim:entry.text});
  }
  // Explicitly described short returns to Carlos can be embedded in a resource
  // paragraph instead of a bullet. Preserve them as independent camera shots.
  for(const entry of section.lines){
   const back=/\b(?:retorno breve|regreso) a c[aá]mara\s+([\d:,]+)\s*[–-]\s*([\d:,]+)\s*s\b/i.exec(entry.text);
   if(!back)continue;
   const a=time(back[1]),b=time(back[2]);
   if(!finite(a)||!finite(b)||b<=a||a<section.sourceStart-.01||b>section.sourceEnd+.01){
    conditions.push({code:'EXPLICIT_CAMERA_RETURN_TIMING_UNVERIFIED',subject:section.id,sourceLines:[entry.line]});continue;
   }
   if(shots.some(x=>Math.abs(x.sourceStart-a)<.001&&Math.abs(x.sourceEnd-b)<.001))continue;
   const id=`${section.id}-shot-${String(shots.length+1).padStart(2,'0')}`;
   shots.push({id,sceneId:section.id,kind:'camera',base:'CARLOS',resourceHint:null,overlayResourceHints:[],
    sourceStart:a,sourceEnd:b,editStart:Math.round(a*fps)/fps,editEnd:Math.round(b*fps)/fps,
    sourceLine:entry.line,verbatim:entry.text,implicitFromExplicitDirection:true,
    blockingReasons:['CAMERA_COMPOSITION_NOT_VERIFIED_AT_FRAME'],approved:false});
   conditions.push({code:'CAMERA_COMPOSITION_NOT_VERIFIED_AT_FRAME',subject:id,sourceLines:[entry.line]});
  }
  if(shots.length===0)conditions.push({code:'SCENE_SHOTS_MISSING',subject:section.id,sourceLines:[section.startLine]});
  const instructions=fields.filter(f=>/Audio\/transcripción|Recurso y máscara|Posición|Animación y audio|Estado/.test(f.name));
  for(const f of instructions){
   if(/Audio\/transcripción/.test(f.name)&&/[¿\[]/.test(f.value))conditions.push({code:'TRANSCRIPT_OR_SPEECH_ALIGNMENT_REVIEW',subject:section.id,sourceLines:[f.sourceLine]});
   if(/Recurso y máscara/.test(f.name)&&/\bB0\d+\b/.test(f.value))conditions.push({code:'BROLL_ASSET_PENDING',subject:section.id,sourceLines:[f.sourceLine]});
   if(/Posición|Animación y audio/.test(f.name))conditions.push({code:'CINEMATIC_LAYER_PARAMETERS_TO_VERIFY',subject:section.id,sourceLines:[f.sourceLine]});
  }
  return {id:section.id,title:section.name,sourceStart:section.sourceStart,sourceEnd:section.sourceEnd,
   editStart:start,editEnd:end,shots,fields,notes,sourceLines:section.lines};
 });
 const ids=new Set(),references=[];
 for(const scene of scenePlan){for(const shot of scene.shots){
  for(const hint of [shot.resourceHint,...shot.overlayResourceHints].filter(Boolean))
   references.push({operationId:shot.id,resourceHint:hint,sourceLine:shot.sourceLine,role:hint===shot.resourceHint?'base':'overlay'});
  ids.add(shot.id);
 }}
 // Enumerate executable intentions explicitly, without pretending that any
 // unverified font, asset, composite or transition is implemented.
 const operationIntents=[];
 const emit=(shot,suffix,track,detail,gate)=>operationIntents.push({
  id:`${shot.id}-${suffix}`,shotId:shot.id,sceneId:shot.sceneId,track,
  sourceStart:shot.sourceStart,sourceEnd:shot.sourceEnd,
  editStart:shot.editStart,editEnd:shot.editEnd,sourceLine:shot.sourceLine,
  detail,blockingReasons:[gate],status:'REQUIRES_VERIFICATION',canExecute:false});
 for(const scene of scenePlan){
  for(const shot of scene.shots){
   emit(shot,'base',shot.kind==='camera'?'camera':shot.kind==='motion'?'graphics':'broll',
    {base:shot.base,resourceHint:shot.resourceHint,originalInstruction:shot.verbatim},
    shot.kind==='camera'?'FRAME_LAYOUT_VERIFY_REQUIRED':shot.kind==='broll'?'LICENSED_MEDIA_AND_RIGHTS_REQUIRED':'MOTION_COMPOSITION_AND_RENDER_SUPPORT_REQUIRED');
   for(const hint of shot.overlayResourceHints)
    emit(shot,`overlay-${hint}`,'graphics',{resourceHint:hint,layering:'above-original-camera'},'MOTION_OVERLAY_ASSET_AND_COMPOSITING_REQUIRED');
   const title=/texto editorial\s+\*\*([^*]+)\*\*/i.exec(shot.verbatim);
   if(title&&title[1].trim().toLowerCase()!=='ninguno')
    emit(shot,'editorial-title','graphics',{text:title[1].trim(),distinctFromCaptions:true},
     'EXACT_TITLE_POSITION_FONT_TIMING_AND_MOTION_VERIFY_REQUIRED');
   if(/S en zona inferior|subtítulos|captions abajo/i.test(shot.verbatim))
    emit(shot,'captions','captions',{speechTiming:'ASR_NOT_FINALLY_APPROVED'},
     'WORD_ACCURATE_PROGRESSIVE_CAPTIONS_AND_SAFEZONE_REQUIRED');
   if(shot.kind==='broll'){
    emit(shot,'transition-in','transition',{relativeTo:'BROLL_ENTRY',policy:'must-specify-enter'},
     'BROLL_ENTRY_TRANSITION_NOT_SPECIFIED');
    emit(shot,'transition-out','transition',{relativeTo:'BROLL_EXIT',policy:'must-specify-exit'},
     'BROLL_EXIT_TRANSITION_NOT_SPECIFIED');
   }
  }
 }
 for(const scene of scenePlan){
  const fields=scene.fields;
  for(const field of fields){
   const kind=field.name.toLowerCase();
   const type=kind.includes('animación y audio')?'sound-and-motion-direction':
    kind.includes('composición por planos')?'shot-layout-direction':
    kind.includes('posición')?'geometry-direction':kind.includes('recurso')?'resource-and-mask-direction':
    kind.includes('audio/transcripción')?'speech-verification-direction':null;
   if(type){operationIntents.push({id:`${scene.id}-${type}`,sceneId:scene.id,track:'editorial-direction',
    sourceLine:field.sourceLine,detail:{verbatim:field.value},status:'REQUIRES_VERIFICATION',
    blockingReasons:['SCENE_SPECIFICATION_REQUIRES_LOSSLESS_TECHNICAL_OPERATION'],canExecute:false});}
  }
 }
 // Explicitly account for EVERY meaningful line that was not already linked
 // to a shot/scene directive; headings and labels stay contextual, while
 // global cinematic directions and the EDL require actual technical mapping.
 const coveredLines=new Set(operationIntents.map(x=>x.sourceLine));
 for(let i=0;i<sourceLines.length;i++){
  const line=sourceLines[i],lineNo=i+1;
  if(!line.trim()||coveredLines.has(lineNo))continue;
  const onlyContext=/^\s*(?:#{1,3}\s|>\s*\*\*Estado|\*\*Estado:|---\s*$)/.test(line);
  const attached=scenePlan.find(scene=>scene.sourceLines.some(entry=>entry.line===lineNo));
  operationIntents.push({id:`line-${String(lineNo).padStart(3,'0')}`,
   sceneId:attached?.id??null,track:onlyContext?'document-context':'editorial-direction',
   sourceLine:lineNo,detail:{verbatim:line},status:'REQUIRES_VERIFICATION',
   blockingReasons:[onlyContext?'DOCUMENT_CONTEXT_MUST_BE_RETAINED':'UNMAPPED_CREATIVE_OR_TECHNICAL_DIRECTIVE'],
   canExecute:false});
 }
 const instructionCoverage={nonemptySourceLines:sourceLines.filter(line=>line.trim()).length,
  linesWithMappedIntent:new Set(operationIntents.map(x=>x.sourceLine)).size,
  unaccountedNonemptyLines:sourceLines.map((line,i)=>line.trim()&&!operationIntents.some(intent=>intent.sourceLine===i+1)?i+1:null).filter(Boolean)};
 const gaps=[];for(let i=1;i<scenePlan.length;i++)if(Math.abs(scenePlan[i].editStart-scenePlan[i-1].editEnd)>1/fps+.000001)gaps.push([scenePlan[i-1].id,scenePlan[i].id]);
 if(gaps.length)conditions.push({code:'SCENE_COVERAGE_GAP',subjects:gaps});
 if(Math.abs(scenePlan[0].editStart)>1e-6||Math.abs(scenePlan.at(-1).editEnd-duration)>1e-6)
  conditions.push({code:'SOURCE_DURATION_REBASE_REQUIRED'});
 // Every source line stays in the annex (including global directions, transitions
 // and the full cut list), with stable line references; nothing is silently dropped.
 const document={schema:'sues-master-film-brief-translation/v1',status:'COMPLETE_TECHNICAL_ANNEX_NOT_IMPORTABLE',
  sourceBriefSha256:sha(text),sourceSha256,originalSha256,timelineFingerprint,fps,duration,
  sourceClock:'original-VFR',workingClock:'verified-CFR30-no-cuts',
  creativeStatus:'PROPOSED_NOT_APPROVED',canExecute:false,approved:false,
  scenes:scenePlan,shotCount:ids.size,resourceReferences:references,operationIntents,instructionCoverage,
  requiredChecks:[...new Set(conditions.map(x=>x.code))],blockingConditions:conditions,
  allSourceLines:sourceLines.map((line,i)=>({line:i+1,text:line})),
  translationCoverage:{sourceLineCount:sourceLines.length,preservedLines:sourceLines.length,
   lostLines:0,originalTextExact:sourceLines.join('\n')===text.replace(/\r\n/g,'\n')},
  exportPolicy:'NO_JSON_MASTER_STORY_UNTIL_ALL_REQUIRED_DIRECTIVES_HAVE_SUPPORTED_OPERATION_AND_TRUSTED_RESOURCES'};
 if(!document.translationCoverage.originalTextExact||instructionCoverage.unaccountedNonemptyLines.length)return blocked('SOURCE_BRIEF_NORMALIZATION_MISMATCH');
 return document;
}
