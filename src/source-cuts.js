import {validateTranscript,mapWordsToTimeline} from './transcript.js';
const norm=s=>String(s).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const round=n=>Math.round(n*1000)/1000;
export function validateCuts(duration,cuts=[]){
 if(!Number.isFinite(duration)||duration<=0||!Array.isArray(cuts))throw Error('Duración o cortes inválidos');
 let previous=0;
 return cuts.map((c,i)=>{if(!c||![c.start,c.end].every(Number.isFinite)||c.start<0||c.end<=c.start||c.end>duration||c.start<previous-1e-7)throw Error('Corte inválido o solapado '+i);previous=c.end;return {start:c.start,end:c.end};});
}
export function keptSegments(duration,cuts=[]){
 let cursor=0;const result=[];
 for(const c of validateCuts(duration,cuts)){if(c.start>cursor+1e-6)result.push({in:cursor,out:c.start});cursor=c.end;}
 if(cursor<duration-1e-6)result.push({in:cursor,out:duration});
 if(!result.length)throw Error('No se puede eliminar el vídeo entero');
 return result;
}
export function locateSpokenPhrase(transcript,phrase,{padding=.08}={}){
 validateTranscript(transcript);
 if(typeof phrase!=='string'||!norm(phrase)||phrase.length>240||!Number.isFinite(padding)||padding<0||padding>.5)throw Error('Frase inválida');
 const tokens=norm(phrase).split(' '),words=transcript.words,matches=[];
 for(let i=0;i<=words.length-tokens.length;i++)if(tokens.every((w,j)=>norm(words[i+j].text)===w)){
  const selected=words.slice(i,i+tokens.length);if(selected.some(w=>w.timingUncertain))continue;
  const first=selected[0],last=selected.at(-1);
  matches.push({start:round(Math.max(words[i-1]?.end??0,first.start-padding)),end:round(Math.min(words[i+tokens.length]?.start??transcript.sourceDuration,last.end+padding)),sourceWordStart:i,sourceWordEnd:i+tokens.length-1,text:selected.map(w=>w.text).join(' ')});
 }
 return {matches,ambiguous:matches.length!==1,requiresConfirmation:true};
}
export function proposeSilenceCuts(transcript,{minimumPause=.55,retain=.5,includeEdges=false}={}){
 validateTranscript(transcript);
 if(!Number.isFinite(minimumPause)||minimumPause<.2||minimumPause>10||!Number.isFinite(retain)||retain<0||retain>2)throw Error('Umbrales inválidos');
 const words=transcript.words,cuts=[];
 const add=(a,b)=>{if(b-a>minimumPause&&b-a>retain){const margin=retain/2;const start=Math.ceil((a+margin)*30)/30,end=Math.floor((b-margin)*30)/30;if(end-start>=.12)cuts.push({start,end});}};
 if(includeEdges)add(0,words[0].start);
 for(let i=1;i<words.length;i++)if(!words[i-1].timingUncertain&&!words[i].timingUncertain)add(words[i-1].end,words[i].start);
 if(includeEdges)add(words.at(-1).end,transcript.sourceDuration);
 return {enabled:false,proposals:validateCuts(transcript.sourceDuration,cuts),requiresConfirmation:true,warning:'Candidatos basados en timestamps de palabras; revisar respiraciones y pausas expresivas.'};
}
export function previewCuts(transcript,cuts){
 const segments=keptSegments(transcript.sourceDuration,cuts),mapped=mapWordsToTimeline(transcript,segments);
 return {segments,words:mapped.words,duration:round(mapped.duration),originalDuration:transcript.sourceDuration,removedSeconds:round(transcript.sourceDuration-mapped.duration),requiresConfirmation:true,invalidatesExistingEditPlan:true};
}
export function interpretCutInstruction(transcript,instruction){
 if(typeof instruction!=='string'||instruction.length>500)throw Error('Instrucción inválida');
 const s=instruction.trim();let m;
 if((m=/^(?:elimina|quita|borra|recorta)(?: la parte)? (?:donde |en la que )?digo\s+[«“"']?(.+?)[»”"']?\.?$/i.exec(s)))return {kind:'spoken-phrase',...locateSpokenPhrase(transcript,m[1].replace(/[»”"']$/,''))};
 if((m=/^(?:elimina|quita|borra|recorta) (?:los |las )?(primeros|primeras|ultimos|ultimas)\s+(\d+(?:[.,]\d+)?)\s+segundos?\.?$/i.exec(s))){
  const n=Number(m[2].replace(',','.'));if(!Number.isFinite(n)||n<=0||n>=transcript.sourceDuration)throw Error('Duración inválida');
  return {kind:'time-range',matches:[m[1].startsWith('primer')?{start:0,end:n}:{start:round(transcript.sourceDuration-n),end:transcript.sourceDuration}],ambiguous:false,requiresConfirmation:true};
 }
 return {kind:'unsupported',matches:[],requiresConfirmation:true,reason:'No se reconoce la instrucción; no se modifica el vídeo.'};
}


/** Frame-aligned source cut validation. Cuts through words are explicitly rejected
 * when preserveSpeech=true. A final original is never modified. */
export function normalizeSourceCuts(transcript,cuts,{preserveSpeech=true}={}){
 validateTranscript(transcript);
 if(!Array.isArray(cuts)||cuts.length>60)throw Error('Máximo 60 cortes por vídeo');
 validateCuts(transcript.sourceDuration,cuts);
 const frames=cuts.map(c=>({start:Math.round(c.start*30)/30,end:c.end===transcript.sourceDuration?transcript.sourceDuration:Math.min(transcript.sourceDuration,Math.round(c.end*30)/30)}));
 validateCuts(transcript.sourceDuration,frames);
 keptSegments(transcript.sourceDuration,frames);
 if(frames.some(c=>c.end-c.start<1/30-1e-8))throw Error('Corte inferior a un fotograma');
 if(preserveSpeech){
  for(const cut of frames)if(transcript.words.some(w=>!w.timingUncertain&&w.end>cut.start+0.006&&w.start<cut.end-0.006))throw Error('El corte invade una palabra. Ajusta los límites o usa un corte manual confirmado.');
 }
 return frames;
}
export function proposedSourceReview(transcript){
 validateTranscript(transcript);
 const silences=proposeSilenceCuts(transcript,{minimumPause:.65,retain:.5}).proposals.map((r,i)=>({id:`sil-${i}`,type:'silence',start:r.start,end:r.end,reason:'Pausa larga · conservar aproximadamente 0,5 s',selected:false}));
 const fillers=new Set(['eh','em','mmm','hmm','este']);
 const spoken=[];
 for(const [i,w]of transcript.words.entries()){
  if(w.timingUncertain||w.confidence!==undefined&&w.confidence<.8)continue;
  if(!fillers.has(norm(w.text)))continue;
  const left=transcript.words[i-1],right=transcript.words[i+1];
  if(!left||!right||left.timingUncertain||right.timingUncertain||w.end-w.start>.85)continue;
  const start=Math.ceil(Math.max(left.end,w.start-.04)*30)/30;
  const end=Math.floor(Math.min(right.start,w.end+.04)*30)/30;
  if(end-start<1/30)continue;
  spoken.push({id:`speech-${i}`,type:'speech',start,end,reason:`Posible muletilla «${w.text}» · revisar escuchando`,selected:false});
 }
 // Only exact nearby phrase repetitions are suggested. The user must approve.
 const words=transcript.words.map(w=>norm(w.text));
 const seen=new Set();
 for(let i=0;i<words.length-5&&spoken.length<50;i++){
  let best=null;
  for(let j=i+3;j<=Math.min(i+18,words.length-3);j++){
   if(transcript.words[j].start-transcript.words[i].start>12)break;
   for(let len=Math.min(8,j-i,words.length-j);len>=3;len--){
    if(words.slice(i,i+len).join(' ')!==words.slice(j,j+len).join(' '))continue;
    if(words.slice(i,i+len).join(' ').length<13)continue;
    if(transcript.words.slice(i,i+len).some(w=>w.timingUncertain)||transcript.words.slice(j,j+len).some(w=>w.timingUncertain))continue;
    best={j,len};break;
   }
   if(best)break;
  }
  if(!best)continue;
  const key=i+'-'+(i+best.len);
  if(seen.has(key))continue;seen.add(key);
  const start=Math.floor(transcript.words[i].start*30)/30;
  const end=Math.ceil(transcript.words[i+best.len-1].end*30)/30;
  if(end>start&&end<=transcript.words[best.j].start-.05){
   const quote=transcript.words.slice(i,i+best.len).map(w=>w.text).join(' ');
   spoken.push({id:`repeat-${i}`,type:'speech',start,end,reason:`Posible frase repetida «${quote}». Escucha antes de quitarla.`,selected:false});
   i+=best.len-1;
  }
 }
 return {sourceDuration:transcript.sourceDuration,retainSilenceSeconds:.5,silences,spoken:spoken.slice(0,50),requiresConfirmation:true,automaticDeletion:false};
}
