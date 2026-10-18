// Group only real timestamped words. A zero-duration ASR token stays with an
// adjacent timed word; it never receives an invented per-word time interval.
export function shortCaptionGroups(words,{maxWords=3,maxChars=22,maxDuration=2.4,gapBreak=.65}={}){
 if(![1,2,3].includes(maxWords))throw new Error('Caption groups require 1, 2 or 3 words');
 // Recovered display cues have phrase timing, not word alignment. Keep each
 // phrase indivisible instead of manufacturing karaoke or overlapping groups.
 if(words.some(w=>w.phraseId!==undefined)){
  const groups=[],seen=new Set();
  for(const word of words){
   if(typeof word.phraseId!=='string'||!word.phraseId||word.timingUncertain!==true)throw new Error('Phrase timing requires an uncertain phraseId on every word');
   const last=groups.at(-1);
   if(last?.phraseId===word.phraseId){
    if(word.start!==last.start||word.end!==last.end)throw new Error('Phrase words must share their interval');
    last.words.push(word);
   }else{
    if(seen.has(word.phraseId)||word.end<=word.start||(last&&word.start<last.end))throw new Error('Phrase intervals must be positive, contiguous and non-overlapping');
    seen.add(word.phraseId);groups.push({phraseId:word.phraseId,start:word.start,end:word.end,words:[word]});
   }
  }
  return groups.map((g,i)=>{
   const text=g.words.map(w=>w.text).join(' ');
   if(g.words.length>maxWords||text.length>maxChars||g.end-g.start>maxDuration)throw new Error('Recovered phrase cannot be split without word timing; shorten its text or supply reviewed word alignment');
   return {id:`seg-${String(i+1).padStart(3,'0')}`,text,start:g.start,end:g.end,wordIndexes:g.words.map(w=>w.sourceWordIndex??null),source:'auto',timingUncertain:true,timingGranularity:'phrase',phraseId:g.phraseId};
  });
 }
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
  if(/[,.;!?…:]$/.test(unit.at(-1).text)||current.length>=maxWords)flush();
 }
 flush();if(current.length)throw new Error('Caption has no real timing interval');
 return captions;
}
