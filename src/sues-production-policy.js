import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const file=new URL('../config/sues-production-policy.json',import.meta.url);
export const SUES_PRODUCTION_POLICY=Object.freeze(JSON.parse(readFileSync(file,'utf8')));
export const policyFingerprint=createHash('sha256').update(readFileSync(file)).digest('hex');
const wordRE=/[\p{L}\p{N}]+/gu;
export const normalizedWords=text=>(String(text??'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('es').match(wordRE)??[]);
const norm=text=>normalizedWords(text).join(' ');
const validFrame=n=>Number.isInteger(n)&&n>=0;
const overlap=(a,b)=>a.startFrame<b.endFrame&&b.startFrame<a.endFrame;
const matches=(text,word)=>normalizedWords(text).includes(norm(word));
const range=(r)=>r&&validFrame(r.startFrame)&&validFrame(r.endFrame)&&r.endFrame>r.startFrame;
export function keywordCandidates(words){
 if(!Array.isArray(words)||!words.length||words.some(w=>!w||typeof w.wordId!=='string'||!w.wordId||!range(w)||typeof w.text!=='string'||!norm(w.text))||new Set(words.map(w=>w.wordId)).size!==words.length)throw Error('KEYWORD_TRANSCRIPT_UNVERIFIED');
 const terms=new Map();
 for(const [i,w] of words.entries()){
  const key=norm(w.text);if(!terms.has(key))terms.set(key,{key,label:w.text,occurrences:[]});
  terms.get(key).occurrences.push({wordId:w.wordId,startFrame:w.startFrame,endFrame:w.endFrame,context:words.slice(Math.max(0,i-3),i+4).map(v=>v.text).join(' ')});
 }
 return [...terms.values()];
}
export function resolveKeywordSelection(words,{selectedTerms=[],selectedWordIds=[],deselectedWordIds=[]}={}){
 const candidates=keywordCandidates(words),known=new Set(words.map(w=>w.wordId)),terms=new Set(candidates.map(c=>c.key));
 if(!Array.isArray(selectedTerms)||!Array.isArray(selectedWordIds)||!Array.isArray(deselectedWordIds)||selectedTerms.some(t=>typeof t!=='string'||!terms.has(norm(t)))||[...selectedWordIds,...deselectedWordIds].some(id=>!known.has(id)))throw Error('KEYWORD_SELECTION_NOT_IN_TRANSCRIPT');
 const selected=new Set(selectedWordIds),chosen=new Set(selectedTerms.map(norm)),excluded=new Set(deselectedWordIds);
 return words.filter(w=>(selected.has(w.wordId)||chosen.has(norm(w.text)))&&!excluded.has(w.wordId)).map(w=>w.wordId);
}
// The output contains the exact caption word text and intervals, not merely a flag.
// A renderer must render each segment with its designated style, or block.
export function resolveCaptionEmphasis({cues,words,selection,heroes}={}){
 if(!Array.isArray(cues)||!cues.length||!Array.isArray(heroes)||heroes.some(h=>!range(h)||typeof h.text!=='string'||!['title','hero-motion'].includes(h.kind)))throw Error('EMPHASIS_TIMELINE_UNVERIFIED');
 const ids=new Set(resolveKeywordSelection(words,selection)),byId=new Map(words.map(w=>[w.wordId,w]));
 const output=[];
 for(const c of cues){
  if(!range(c)||typeof c.id!=='string'||!Array.isArray(c.wordIds)||!c.wordIds.length||c.wordIds.some(id=>!byId.has(id)))throw Error('CAPTION_CUE_INVALID');
  const active=c.wordIds.map(id=>byId.get(id));const exact=active.map(w=>w.text).join(' ');
  if(c.text!==undefined&&c.text!==exact)throw Error('CAPTION_TEXT_CHANGED');
  if(active.some(w=>w.startFrame>c.startFrame))throw Error('CAPTION_WORD_NOT_YET_SPOKEN');
  const relevant=heroes.filter(h=>overlap(c,h)&&active.some(w=>ids.has(w.wordId)&&matches(h.text,w.text)));
  const cuts=[...new Set([c.startFrame,c.endFrame,...relevant.flatMap(h=>[Math.max(c.startFrame,h.startFrame),Math.min(c.endFrame,h.endFrame)])])].sort((a,b)=>a-b);
  for(let i=0;i<cuts.length-1;i++){
   const span={startFrame:cuts[i],endFrame:cuts[i+1]};
   output.push({id:c.id+'-style-'+i,cueId:c.id,...span,text:exact,words:active.map(w=>{
    const suppressed=ids.has(w.wordId)&&relevant.some(h=>overlap(span,h)&&matches(h.text,w.text));
    return {wordId:w.wordId,text:w.text,style:ids.has(w.wordId)&&!suppressed?'gold':'white',suppressed};
   })});
  }
 }
 return output;
}
// Detect unexpected structural changes even in nested compositions. The caller
// supplies the explicit approved changes, not a blanket "replace project".
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
function clipMap(project){
 const rows=new Map();
 for(const c of project.clips??[])add('root',c);
 for(const comp of project.comps??[])for(const c of comp.clips??[])add('comp:'+comp.id,c);
 function add(scope,c){const k=scope+'/'+c.id;if(typeof c.id!=='string'||rows.has(k))throw Error('DUPLICATE_OR_INVALID_CLIP_ID');rows.set(k,c)}
 return rows;
}
export function auditRevisionDelta(before,after,{allowed=[],allowedProjectFields=[],superseded=[]}={}){
 if(!before||!after||!Number.isInteger(before.revision)||after.revision!==before.revision+1)return {ok:false,issues:['REVISION_MISMATCH']};
 const changes=[],issues=[],a=clipMap(before),b=clipMap(after),permission=new Set(allowed),retired=new Set(superseded);
 for(const k of new Set([...a.keys(),...b.keys()])){
  if(same(a.get(k),b.get(k)))continue;
  changes.push(k);
  if(!permission.has(k))issues.push('UNAPPROVED_CLIP_CHANGE:'+k);
 }
 for(const k of retired){const c=b.get(k);if(c&&c.disabled!==true)issues.push('SUPERSEDED_CLIP_STILL_ACTIVE:'+k)}
 for(const k of new Set([...Object.keys(before),...Object.keys(after)])){
  if(['revision','clips','comps',...allowedProjectFields].includes(k))continue;
  if(!same(before[k],after[k]))issues.push('UNAPPROVED_PROJECT_FIELD:'+k);
 }
 // A comp's own properties (canvas, tracks, etc.) must not change just because
 // the caller authorized a clip within it.
 const compMeta=p=>(p.comps??[]).map(({clips,...c})=>c);
 if(!allowedProjectFields.includes('comps')&&!same(compMeta(before),compMeta(after)))issues.push('UNAPPROVED_COMP_STRUCTURE');
 return {ok:issues.length===0,changes,issues};
}
export function favoriteRank(resources,favorites,{query='',type}={}){
 const terms=normalizedWords(query),byId=new Map((favorites?.items??[]).map(x=>[x.id,x]));
 return resources.filter(r=>(!type||r.type===type)&&r.rightsVerified===true&&r.compatible!==false&&terms.every(t=>normalizedWords([r.title,r.name,r.category,...(r.tags??[])].filter(Boolean).join(' ')).includes(t))).map(r=>({...r,favorite:byId.get(r.sha256??r.id)?.favorite===true,uses:byId.get(r.sha256??r.id)?.uses??0})).sort((a,b)=>Number(b.favorite)-Number(a.favorite)||b.uses-a.uses||String(a.id).localeCompare(String(b.id)));
}
