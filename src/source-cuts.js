import {validateTranscript,mapWordsToTimeline} from './transcript.js';
const norm=s=>String(s).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const round=n=>Math.round(n*1000)/1000;
export function validateCuts(duration,cuts=[]){
 if(!Number.isFinite(duration)||duration<=0||!Array.isArray(cuts))throw Error('Duración o cortes inválidos');
 let previous=0;
 return cuts.map((c,i)=>{if(!c||![c.start,c.end].every(Number.isFinite)||c.start<0||c.end<=c.start||c.end>duration||c.start<previous-1e-7)throw Error('Corte inválido o solapado '+i);previous=c.end;return {start:round(c.start),end:round(c.end)};});
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
export function proposeSilenceCuts(transcript,{minimumPause=.55,retain=.22,includeEdges=false}={}){
 validateTranscript(transcript);
 if(!Number.isFinite(minimumPause)||minimumPause<.2||minimumPause>10||!Number.isFinite(retain)||retain<0||retain>2)throw Error('Umbrales inválidos');
 const words=transcript.words,cuts=[];
 const add=(a,b)=>{if(b-a>minimumPause&&b-a>retain){const margin=(b-a-retain)/2;cuts.push({start:round(a+margin),end:round(b-margin)});}};
 if(includeEdges)add(0,words[0].start);
 for(let i=1;i<words.length;i++)add(words[i-1].end,words[i].start);
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
