/**
 * SUES motion template v3: rectangular card rounds WHEN the first word enters.
 * Each word has its own timing. The whole group zooms and moves offscreen.
 * No unrelated orb or waveform. No FableCut native execution is claimed.
 */
export const HOOK_DROP_CARD_ID='TPL_HOOK_DROP_CARD';
export const FPS=30;
export const FRAME_COUNT=70;
export const EVENTS=Object.freeze({openStart:0,openEnd:7,firstWord:8,cornerEnd:19,revealEnd:32,holdEnd:51,exitEnd:69});
export const PALETTE=Object.freeze({background:'#111215',card:'#242527',edge:'#B88C32',highlight:'#FFF9B0',text:'#FFFFFF'});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const p=(frame,start,end)=>clamp((frame-start)/(end-start));
const easeOut=t=>1-(1-t)**3;
const easeInOut=t=>t<.5?4*t**3:1-(-2*t+2)**3/2;
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function paramsOf(args={}){
 const lines=[args.line1??'¿Y SI TE',args.line2??'ESCUCHARAS?'];
 if(lines.some(s=>typeof s!=='string'||!s.trim()||[...s].length>36))throw Error('lines must have 1–36 characters');
 const palette={...PALETTE,...(args.palette??{})};
 for(const [k,v] of Object.entries(palette))if(typeof v!=='string'||!/^#[0-9a-fA-F]{6}$/.test(v))throw Error('invalid color '+k);
 const words=lines.flatMap((line,lineIndex)=>line.trim().split(/\s+/u).map((txt,i)=>({id:'motion-word-'+lineIndex+'-'+i,lineIndex,text:txt})));
 if(words.length>18)throw Error('too many words to reveal clearly');
 const {wordStartFrames,wordIds}=args;
 if(wordStartFrames!==undefined&&(!Array.isArray(wordStartFrames)||wordStartFrames.length!==words.length||wordStartFrames.some((v,i)=>!Number.isInteger(v)||v<0||v>EVENTS.holdEnd-7||(i>0&&v<=wordStartFrames[i-1]))))throw Error('invalid wordStartFrames');
 if(wordIds!==undefined&&(!Array.isArray(wordIds)||wordIds.length!==words.length||wordIds.some(v=>typeof v!=='string'||!v.trim())))throw Error('invalid wordIds');
 const starts=wordStartFrames??words.map((_,i)=>Math.round(EVENTS.firstWord+(EVENTS.revealEnd-EVENTS.firstWord-6)*(i/Math.max(1,words.length-1))));
 return {lines,palette,words:words.map((w,i)=>({...w,start:starts[i],end:Math.min(EVENTS.holdEnd,starts[i]+6),wordId:wordIds?.[i]??null})),hasAnchors:Boolean(wordIds&&wordStartFrames)};
}
export function sampleHookDropCard(frame,args={}){
 if(!Number.isInteger(frame)||frame<0||frame>=FRAME_COUNT)throw RangeError('frame must be integer from 0 to 69');
 const {lines,palette,words,hasAnchors}=paramsOf(args),e=EVENTS;
 const open=easeOut(p(frame,e.openStart,e.openEnd));
 const cornerRadius=lerp(0,62,easeOut(p(frame,words[0].start,words[0].start+11)));
 const exit=easeInOut(p(frame,e.holdEnd,e.exitEnd));
 const wordStates=words.map(w=>{const amount=easeOut(p(frame,w.start,w.end));return {...w,opacity:amount,blur:Math.round((1-amount)*1600)/100,dy:(1-amount)*18};});
 return {id:HOOK_DROP_CARD_ID,version:'3.0',frame,fps:FPS,time:frame/FPS,width:1080,height:1920,
  card:{x:130,cy:830,w:820,h:8+530*open,rx:cornerRadius},text:{lines,words:wordStates},
  camera:{scale:lerp(1,4.5,exit),dy:lerp(0,-1950,exit)},
  transition:{incomingLayer:'provided-by-next-scene',exitProgress:exit,outgoingOffscreen:frame===e.exitEnd},
  palette,phase:frame<e.openEnd?'open':frame<e.revealEnd?'word-reveal':frame<e.holdEnd?'hold':'zoom-out',
  decorativeSphere:false,decorativeWave:false,captions:'delegate-to-existing-editor',
  speechSync:hasAnchors?'external-word-id-anchors':'demo-timing-only',executableInFableCut:false};
}
export function renderHookDropCardSvg(frame,args={}){
 const s=sampleHookDropCard(frame,args),c=s.card,col=s.palette,top=c.cy-c.h/2;
 const cam='translate(0 '+s.camera.dy+') translate(540 960) scale('+s.camera.scale+') translate(-540 -960)';
 const filters=s.text.words.map((w,i)=>'<filter id="blur-word-'+i+'" x="-35%" y="-75%" width="170%" height="250%"><feGaussianBlur stdDeviation="'+w.blur+'"/></filter>').join('');
 const line=(ix,y)=>{
  const items=s.text.words.map((w,i)=>({...w,globalIndex:i})).filter(w=>w.lineIndex===ix);
  const n=[...s.text.lines[ix]].length;
  const size=ix===0?Math.min(84,Math.floor(84*20/Math.max(20,n))):Math.min(95,Math.floor(95*15/Math.max(15,n)));
  const spans=items.map((w,j)=>'<tspan id="'+w.id+'" opacity="'+w.opacity+'" filter="url(#blur-word-'+w.globalIndex+')">'+(j?' ':'')+safe(w.text)+'</tspan>').join('');
  return '<text id="line-'+ix+'" x="540" y="'+y+'" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="'+size+'" font-weight="'+(ix===0?800:900)+'" fill="'+(ix===0?col.text:col.highlight)+'">'+spans+'</text>';
 };
 return ['<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">',
 '<defs>',
 '<radialGradient id="bg"><stop stop-color="#28292B"/><stop offset="100%" stop-color="'+col.background+'"/></radialGradient>',
 '<pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0 H0 V48" fill="none" stroke="#FFF" stroke-opacity=".055"/></pattern>',
 '<linearGradient id="card-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+col.card+'"/><stop offset="100%" stop-color="#151619"/></linearGradient>',
 '<filter id="card-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="21" stdDeviation="18" flood-color="#000" flood-opacity=".55"/></filter>',filters,
 '<clipPath id="card-clip"><rect x="'+c.x+'" y="'+top+'" width="'+c.w+'" height="'+c.h+'" rx="'+c.rx+'"/></clipPath>',
 '</defs>',
 '<rect width="1080" height="1920" fill="url(#bg)"/><rect width="1080" height="1920" fill="url(#grid)"/>',
 '<g id="camera" transform="'+cam+'">',
 '<rect id="card" x="'+c.x+'" y="'+top+'" width="'+c.w+'" height="'+c.h+'" rx="'+c.rx+'" fill="url(#card-fill)" stroke="'+col.edge+'" stroke-width="4" filter="url(#card-shadow)"/>',
 '<g id="content" clip-path="url(#card-clip)">',line(0,768),line(1,902),'</g>',
 '</g></svg>'].join('');
}
