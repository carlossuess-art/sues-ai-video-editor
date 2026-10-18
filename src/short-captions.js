// Group only real timestamped words. A zero-duration ASR token stays with an
// adjacent timed word; it never receives an invented per-word time interval.
export function shortCaptionGroups(words,{maxWords=3,maxChars=22,maxDuration=2.4,gapBreak=.65}={}){
 if(![1,2,3].includes(maxWords))throw new Error('Caption groups require 1, 2 or 3 words');
 const units=[];
 for(const word of words){
  const previous=units.at(-1),point=word.end===word.start;
  if(point&&previous&&word.sourceSegmentIndex===previous.at(-1).sourceSegmentIndex&&word.start-previous.at(-1).end<=gapBreak)previous.push(word);
  else units.push([word]);
 }
 const captions=[];let current=[];
 const flush=()=>{
  if(!current.length)return;
  const start=current[0].start,end=Math.max(...current.map(w=>w.end));
  if(end<=start)return; // Retain leading point tokens until a real interval arrives.
  captions.push({id:`seg-${String(captions.length+1).padStart(3,'0')}`,text:current.map(w=>w.text).join(' '),start,end,wordIndexes:current.map(w=>w.sourceWordIndex??null),source:'auto',timingUncertain:current.some(w=>w.timingUncertain===true)});current=[];
 };
 for(const unit of units){
  const proposed=[...current,...unit],previous=current.at(-1);
  if(current.length&&(proposed.length>maxWords||proposed.map(w=>w.text).join(' ').length>maxChars||unit.at(-1).end-current[0].start>maxDuration||unit[0].start-previous.end>gapBreak||unit[0].sourceSegmentIndex!==previous.sourceSegmentIndex))flush();
  current.push(...unit);
  if(/[.!?…:]$/.test(unit.at(-1).text)||current.length>=maxWords)flush();
 }
 flush();if(current.length)throw new Error('Caption has no real timing interval');
 return captions;
}
