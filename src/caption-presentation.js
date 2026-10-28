const tokens=s=>String(s??'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('es').match(/[\p{L}\p{N}]+/gu)??[];
const contains=(copy,text)=>text.length>0&&copy.some((_,i)=>text.every((t,j)=>copy[i+j]===t));
/** Conservative text hierarchy: literal replacement only; different information stays visible.
 * Coordinates are in the same portrait safe content region as the installed scene renderers. */
export function captionPresentation(plan,caption){
 const overlap=e=>e.start<caption.end&&e.end>caption.start;
 const active=(plan.graphics??[]).filter(overlap);
 const behind=(plan.foregroundEffects?.events??[]).filter(e=>e.type==='behind-text'&&overlap(e));
 for(const g of [...active,...behind]){
  const copy=g.type==='behind-text'?g.lines:g.type==='compare'?[g.left,g.right]:[g.heading,...(g.bodyLines??[]),g.lead,...(g.heading||g.bodyLines?[]:[g.text])];
  if(caption.source!=='manual'&&g.start<=caption.start+1e-6&&g.end>=caption.end-1e-6&&contains(tokens(copy.join(' ')),tokens(caption.text)))return {action:'replace',reason:'literal-content-present-in-main-graphic'};
 }
 if(active.length||behind.length)return {action:'relocate',reason:'preserve-different-spoken-information',box:{left:120,right:900,top:active.some(g=>g.type==='compare')?170:1440,bottom:active.some(g=>g.type==='compare')?330:1640}};
 return {action:'preserve',box:plan.layout.caption};
}
