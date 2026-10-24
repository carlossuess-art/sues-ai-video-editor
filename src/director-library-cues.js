import {validateTranscript} from './transcript.js';
import {loadPrivateLibraryIndex,searchPrivateLibrary} from './private-library-search.js';

// Deterministic, review-only staging for Director IA. No provider calls or auto insertion.
// A generic word ('tiempo', 'luz', etc.) alone cannot justify a full-frame B-roll.
// These guards reduce false suggestions; they do NOT certify footage relevance.
const BROAD_VISUAL_WORDS=new Set(['tiempo','luz','camino','calma','vida','cambio','persona','gente',
 'grupo','momento','meses','dia','dias','hoy','manana','ahora','actividad','actividades',
 'movimiento','hacer','nuevo','nueva','mucho','muchos','poco','cosas']);
const qualifiesVideoCandidate=(evidence)=>{
 const direct=evidence?.exactTerms??[];
 return direct.some(term=>!BROAD_VISUAL_WORDS.has(term))||direct.length>=2;
};
export function proposeLibraryCues(jobsDirectory,transcript,{limit=6}={}){
 validateTranscript(transcript);
 if(!Number.isInteger(limit)||limit<1||limit>8)throw Error('Límite de sugerencias no válido');
 // One bounded disk read per request, not another 309-entry JSON parse per phrase.
 const index=loadPrivateLibraryIndex(jobsDirectory);
 const cues=[],words=transcript.words,closing=Math.max(0,transcript.sourceDuration-3);
 let i=0,scans=0;
 while(i<words.length&&cues.length<limit&&scans<120){
  const startIndex=i;let endIndex=i;
  while(endIndex+1<words.length&&endIndex-startIndex<8&&
   !/[.!?…]$/.test(words[endIndex].text)&&
   words[endIndex+1].start-words[endIndex].end<=1.1)endIndex++;
  i=endIndex+1;scans++;
  const slice=words.slice(startIndex,endIndex+1);
  const start=slice[0].start,end=slice.at(-1).end,text=slice.map(w=>w.text).join(' ');
  if(start<1||start>=closing||end-start<.4||text.length>250)continue;
  const search=searchPrivateLibrary(jobsDirectory,text,{limit:8,index});
  const candidates=search.results
   .filter(r=>r.availability==='private-operational'&&['video','overlay','image'].includes(r.kind))
   .filter(r=>r.kind!=='video'||qualifiesVideoCandidate(r.lexicalEvidence))
   .slice(0,3)
   .map(({id,title,kind,score,creativeApproval,lexicalEvidence})=>({assetId:id,title,kind,score,
     catalogueApproval:creativeApproval,needsHumanReview:true,
     evidence:{type:'catalogue-lexical-match',exactTerms:lexicalEvidence?.exactTerms??[],
      expandedTerms:lexicalEvidence?.expandedTerms??[],visualContentVerified:false}}));
  if(!candidates.length)continue;
  // Evidence time comes from exact transcript words; this never schedules a visual event.
  cues.push({start,end,transcriptQuote:text,sourceWordIndexes:slice.map((_,j)=>startIndex+j),
   candidates,decision:'suggestion-only'});
 }
 return {schema:'sues-director-library-cues/v1',timeSpace:'original-seconds',
  sourceIndexOnly:true,approvedToAutoPublish:false,method:'conservative transcript-to-catalogue lexical matching; generic-only B-roll suppressed, not full semantic vision',
  cues,warning:'Verificar significado visual, licencia, encuadre, zonas seguras y aprobación antes de cualquier inserción.'};
}
