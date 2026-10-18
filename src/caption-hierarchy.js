import {keywordPreset} from './text-presets.js';
import {fitCaptionSize} from './font-kits.js';
const normalize=text=>text.toLocaleLowerCase('es').replace(/[^\p{L}\p{N}]/gu,'');
const STOP=new Set('a al algo aunque con de del dime el ella en eres es esta este ha has hay la las lo los me mi no o para pero por porque que quien quién se si siempre sin su te todos tras tu tus un una y aún'.split(' '));

// Editorial, deterministic selection. This is not an automatic semantic model.
// One keyword per punctuation-delimited phrase; source timings remain untouched.
export function captionHierarchy(captions,words,policy){
 if(!policy.hierarchy)return captions;
 const weights=policy.hierarchy.keywordWeights??{},exceptional=new Set(policy.hierarchy.exceptionalWords??[]),selected=new Map();let phrase=[];
 const flush=()=>{const ranked=phrase.map((w,i)=>({index:w.sourceWordIndex??w.wordIndex??i,text:normalize(w.text),order:i})).filter(w=>!STOP.has(w.text)&&w.text.length>2).sort((a,b)=>(weights[b.text]??0)-(weights[a.text]??0)||b.text.length-a.text.length||a.order-b.order);if(ranked.length){const best=ranked[0];selected.set(best.index,exceptional.has(best.text)?'exceptional':'important');}phrase=[];};
 for(const [index,word]of words.entries()){phrase.push({...word,sourceWordIndex:index});if(/[,.;:!?]$/.test(word.text))flush();}flush();
 return captions.map(c=>{if(c.source==='manual')return {...c,keyword:null};const hits=c.wordIndexes.filter(i=>selected.has(i));const index=hits.sort((a,b)=>(selected.get(b)==='exceptional')-(selected.get(a)==='exceptional')||(weights[normalize(words[b].text)]??0)-(weights[normalize(words[a].text)]??0))[0];return {...c,keyword:index===undefined?null:{sourceWordIndex:index,level:selected.get(index),method:'editorial-phrase-rules-v1'}};});
}

export function hierarchyLayout(caption,policy,box){
 if(!caption.keyword)return null;
 const parts=caption.text.split(/\s+/),at=caption.keyword.displayWordIndex??caption.wordIndexes.indexOf(caption.keyword.sourceWordIndex);if(at<0||at>=parts.length||caption.keyword.displayWordIndex===undefined&&parts.length!==caption.wordIndexes.length)return null;
 const preset=keywordPreset(caption.keyword);policy={...policy,...(preset.scaleX?{scaleX:preset.scaleX}:{})};
 const before=parts.slice(0,at).join(' '),hero=parts[at],after=parts.slice(at+1).join(' '),three=!!before&&!!after;
 const desired=three?128:144,heroSize=fitCaptionSize([hero],{...policy,fontSize:desired},box.right-box.left);
 // Keep the ratio exactly 2:1, including when width forces a smaller size.
 // Refuse unreadable companions rather than clipping or changing the ratio.
 if(heroSize<128)return null;
 const small=heroSize/2,cx=(box.left+box.right)/2,cy=(box.top+box.bottom)/2;
 const row=(text,size,y,role)=>({text,size,x:cx,y,role,...(role==='keyword'?{scaleX:policy.scaleX,italic:preset.italic??false}:{})});
 if(three)return [row(before,small,cy-75,'companion'),row(hero,heroSize,cy,'keyword'),row(after,small,cy+75,'companion')];
 if(before)return [row(before,small,cy-65,'companion'),row(hero,heroSize,cy+27,'keyword')];
 if(after)return [row(hero,heroSize,cy-27,'keyword'),row(after,small,cy+65,'companion')];
 return [row(hero,heroSize,cy,'keyword')];
}

// Warm gold with a pale reflective ridge and a dark lower seam, not flat yellow.
export const METALLIC_GOLD=Object.freeze(['#876024','#B98A39','#E4BE70','#FFF0C0','#FFFBE8','#BF9346','#795321','#C99F50','#F1D695']);
