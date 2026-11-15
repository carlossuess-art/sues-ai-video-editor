/**
 * SUES isolated motion demonstration, intentionally NOT a sues-master-story/v1 operation.
 * Reconstructs card drop, ball rebound, masked text and group exit for a 30 fps timeline.
 * Reference estimates are adjusted for SUES, not advertised as original keyframes.
 */
export const HOOK_DROP_CARD_ID='TPL_HOOK_DROP_CARD';
export const FPS=30;
export const FRAME_COUNT=51;
export const EVENTS=Object.freeze({openStart:0,openEnd:6,fallStart:6,impact:14,settle:23,textStart:8,textEnd:21,holdEnd:34,exitEnd:50});
export const PALETTE=Object.freeze({background:'#111215',card:'#30250F',edge:'#B88C32',highlight:'#FFF9B0',mid:'#D8B96E',dark:'#835F1D',text:'#FFFFFF'});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const linear=(a,b,t)=>a+(b-a)*t;
const progress=(frame,start,end)=>clamp((frame-start)/(end-start));
const out=t=>1-(1-t)**3;
const inn=t=>t*t*t;
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function paramsOf(args={}){
 const lines=[args.line1??'¿Y SI TE',args.line2??'ESCUCHARAS?'];
 if(lines.some(s=>typeof s!=='string'||!s.trim()||s.length>36))throw Error('lines must have 1–36 characters');
 const palette={...PALETTE,...(args.palette??{})};
 for(const [k,v] of Object.entries(palette))if(typeof v!=='string'||!/^#[0-9a-fA-F]{6}$/.test(v))throw Error('invalid color '+k);
 return {lines,palette};
}
export function sampleHookDropCard(frame,args={}){
 if(!Number.isInteger(frame)||frame<0||frame>=FRAME_COUNT)throw RangeError('frame must be integer from 0 to 50');
 const {lines,palette}=paramsOf(args),e=EVENTS;
 const expand=out(progress(frame,e.openStart,e.openEnd));
 let orbY=160,orbScale=1;
 if(frame>=e.fallStart&&frame<=e.impact)orbY=linear(160,590,inn(progress(frame,e.fallStart,e.impact)));
 else if(frame>e.impact&&frame<e.settle){
  const t=progress(frame,e.impact,e.settle);
  orbY=590-22*Math.sin(Math.PI*t)*Math.exp(-1.25*t);
  orbScale=1+0.09*Math.sin(Math.PI*t)*Math.exp(-1.2*t);
 }else if(frame>=e.settle)orbY=590;
 const read=out(progress(frame,e.textStart,e.textEnd));
 const leave=inn(progress(frame,e.holdEnd,e.exitEnd));
 return {
  id:HOOK_DROP_CARD_ID,frame,fps:FPS,time:frame/FPS,width:1080,height:1920,
  card:{x:138,cy:810,w:804,h:8+480*expand,rx:linear(0,62,out(progress(frame,e.impact,e.settle)))},
  orb:{x:772,y:orbY,r:86*orbScale,visible:frame>=e.fallStart},
  text:{lines,opacity:read,dy:32*(1-read),blur:22*(1-read)},
  camera:{scale:linear(1,2.2,leave),dy:linear(0,-830,leave)},
  palette,
  phase:frame<6?'open':frame<14?'fall':frame<23?'settle':frame<34?'hold':'exit',
  captions:'delegate-to-existing-editor',
  executableInFableCut:false
 };
}
export function renderHookDropCardSvg(frame,args={}){
 const s=sampleHookDropCard(frame,args),p=s.palette,c=s.card,o=s.orb,t=s.text,top=c.cy-c.h/2;
 const textSize=t.lines[1].length>14?71:t.lines[1].length>10?79:92;
 const camera=['translate(0 ',s.camera.dy,') translate(540 960) scale(',s.camera.scale,') translate(-540 -960)'].join('');
 return [
  '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">',
  '<defs>',
  '<radialGradient id="sues-bg"><stop offset="0%" stop-color="#26282B"/><stop offset="100%" stop-color="',p.background,'"/></radialGradient>',
  '<pattern id="sues-grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0 H0 V48" stroke="#FFFFFF" stroke-opacity=".055" fill="none"/></pattern>',
  '<radialGradient id="sues-orb" cx="33%" cy="25%" r="75%"><stop stop-color="',p.highlight,'"/><stop offset="65%" stop-color="',p.mid,'"/><stop offset="100%" stop-color="',p.dark,'"/></radialGradient>',
  '<filter id="focus" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="',t.blur/2,'"/></filter>',
  '<filter id="orb-shadow" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="14" dy="18" stdDeviation="16" flood-color="#000" flood-opacity=".45"/></filter>',
  '<clipPath id="card-mask"><rect x="',c.x,'" y="',top,'" width="',c.w,'" height="',c.h,'" rx="',c.rx,'"/></clipPath>',
  '</defs><rect width="1080" height="1920" fill="url(#sues-bg)"/><rect width="1080" height="1920" fill="url(#sues-grid)"/>',
  '<g id="camera" transform="',camera,'">',
  '<rect id="card" x="',c.x,'" y="',top,'" width="',c.w,'" height="',c.h,'" rx="',c.rx,'" fill="',p.card,'" stroke="',p.edge,'" stroke-width="5"/>',
  '<g id="title" clip-path="url(#card-mask)" opacity="',t.opacity,'" transform="translate(0 ',t.dy,')" filter="url(#focus)">',
  '<text x="212" y="780" fill="',p.text,'" font-family="Montserrat,Arial,sans-serif" font-weight="800" font-size="87">',safe(t.lines[0]),'</text>',
  '<text x="212" y="902" fill="',p.highlight,'" font-family="Montserrat,Arial,sans-serif" font-weight="900" font-size="',textSize,'">',safe(t.lines[1]),'</text>',
  '</g>',
  '<circle id="orb" cx="',o.x,'" cy="',o.y,'" r="',o.r,'" opacity="',o.visible?1:0,'" fill="url(#sues-orb)" filter="url(#orb-shadow)"/>',
  '</g></svg>'
 ].join('');
}
