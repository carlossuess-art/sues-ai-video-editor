import {textAdvance} from './font-kits.js';

// Preserve source intervals. Point tokens share the preceding real cue instead
// of receiving fabricated karaoke timestamps. Manual text always stays static.
export function captionCues(caption,mappedWords){
 const words=mappedWords.filter(w=>caption.wordIndexes.includes(w.sourceWordIndex)),units=[];
 for(const word of words){
  if(units.length&&units.at(-1).end===units.at(-1).start&&word.end>word.start){const last=units.at(-1);last.words.push(word);last.end=word.end;last.timingUncertain=true;}
  else if(word.start===word.end&&units.length){const last=units.at(-1);last.words.push(word);last.timingUncertain=true;}
  else units.push({start:word.start,end:word.end,words:[word],timingUncertain:word.timingUncertain===true});
 }
 return units.map(u=>({start:u.start,end:u.end,wordIndexes:u.words.map(w=>w.sourceWordIndex),timingUncertain:u.timingUncertain}));
}

export function progressiveRuns(caption,rows,policy){
 if(!policy.progressive||caption.source==='manual'||!caption.wordCues?.length)return null;
 // Coalesce a final display interval shorter than 160 ms with its preceding
 // real cue. Raw wordCues remain untouched; no ASR timestamp is rewritten.
 if(caption.end-caption.start<.16)return null;
 const cues=caption.wordCues.map((cue,i,all)=>({...cue,displayStart:caption.end-cue.start<.16&&i?all[i-1].start:cue.start}));
 let offset=0;const result=[];
 for(const row of rows){
  const parts=row.text.split(' ').map(text=>{const index=caption.wordIndexes[offset++],cue=cues.find(c=>c.wordIndexes.includes(index));return {text,index,start:cue?Math.max(caption.start,cue.displayStart):null};});
  if(parts.some(p=>p.start===null))return null;
  if(row.role!=='keyword'){
   // A growing phrase stays centered. Individual reserved word slots would put
   // the first word at the left edge and exaggerate spaces between words.
   const starts=[...new Set(parts.map(p=>p.start))].sort((a,b)=>a-b);
   for(const [i,start]of starts.entries())result.push({...row,text:parts.filter(p=>p.start<=start).map(p=>p.text).join(' '),start,end:starts[i+1]??caption.end,character:false});
   continue;
  }
  const word=parts[0],start=word.start,glyphPolicy={...policy,scaleX:row.scaleX??policy.scaleX},width=textAdvance(word.text,glyphPolicy,row.size);
  if(policy.characterEntrance){
   const chars=[...word.text],budget=Math.min(.32,(caption.end-start)*.4),stagger=Math.min(policy.characterEntrance.staggerMs/1000,budget/Math.max(1,chars.length-1)),settle=Math.min(policy.characterEntrance.settleMs/1000,(caption.end-start)*.3);
   let x=row.x-width/2;
   for(const [i,char]of chars.entries()){
    const advance=textAdvance(char,glyphPolicy,row.size);
    result.push({...row,text:char,x:x+advance/2,start:start+i*stagger,end:caption.end,settle,character:true,sourceWordIndex:word.index});
    x+=advance+(policy.tracking??0);
   }
  }else result.push({...row,text:word.text,start,end:caption.end,character:false,sourceWordIndex:word.index});
 }
 return result;
}
