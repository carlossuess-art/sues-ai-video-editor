/* Mobile touch gestures are adapters to original FableCut editing functions.
   MCP parity: project mutations use native updateClip/split via fablecut_patch_project. */
(()=>{
"use strict";
if(!window.SuesMobileMcp)return;
const monitor=document.getElementById("preview"),time=document.getElementById("timelineScroll");
const clips=document.getElementById("tracksContent"),insp=document.getElementById("inspector");
if(!monitor||!time||!clips||!insp)return;
function touchPair(node,mode){
 const points=new Map();let pinch=null,pan=null;
 const dist=()=>{const a=[...points.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1;};
 const cx=()=>{const a=[...points.values()];return (a[0].x+a[1].x)/2;};
 node.addEventListener("pointerdown",e=>{
   if(e.pointerType!=="touch")return;
   points.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(points.size===1&&mode==="timeline"&&!e.target.closest(".clip")){
     pan={x:e.clientX,left:time.scrollLeft};
   }
   if(points.size===2){
     pan=null;
     const sel=mode==="monitor"?insp.querySelector('[data-k="scale"]'):null;
     pinch={distance:dist(),zoom:mode==="timeline"?state.pps:Number(sel?.value),sel,changed:false};
     if(mode==="monitor"&&!sel)pinch=null;
     e.preventDefault();e.stopImmediatePropagation();
   }
 },true);
 node.addEventListener("pointermove",e=>{
   if(e.pointerType!=="touch"||!points.has(e.pointerId))return;
   points.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pinch&&points.size>=2){
     e.preventDefault();e.stopImmediatePropagation();
     const ratio=dist()/pinch.distance;
     if(!Number.isFinite(ratio)||ratio<=0)return;
     if(mode==="timeline"){setZoom(pinch.zoom*ratio,cx());return;}
     const el=pinch.sel;
     if(!el?.isConnected)return;
     const val=Math.max(Number(el.min)||.1,Math.min(Number(el.max)||4,pinch.zoom*ratio));
     if(!pinch.changed&&Math.abs(val-pinch.zoom)>.01){pushUndo();pinch.changed=true;}
     if(pinch.changed){
       el.value=String(Math.round(val*100)/100);
       el.dispatchEvent(new Event("input",{bubbles:true}));
     }
     return;
   }
   if(pan&&points.size===1&&mode==="timeline"){
     e.preventDefault();e.stopImmediatePropagation();
     time.scrollLeft=Math.max(0,pan.left+(pan.x-e.clientX));
     const r=time.getBoundingClientRect();
     setTime((time.scrollLeft+r.width/2)/state.pps);
   }
 },true);
 const end=e=>{
   if(e.pointerType!=="touch")return;
   points.delete(e.pointerId);
   if(points.size<2)pinch=null;
   if(!points.size)pan=null;
 };
 node.addEventListener("pointerup",end,true);
 node.addEventListener("pointercancel",end,true);
}
touchPair(monitor,"monitor");
touchPair(time,"timeline");

/* Long press allows track reordering; normal horizontal drag moves time.
   Original FableCut handles the actual move, trim, sync, undo and save. */
clips.addEventListener("pointerdown",e=>{
 if(e.pointerType!=="touch"||!matchMedia("(max-width:760px)").matches)return;
 const hit=e.target.closest(".clip");
 if(!hit||e.target.closest(".handle,.vol-hit,.vol-pt,.clip-kf,.fade-grip,.trans-mark"))return;
 const c=getClip(hit.dataset.id);if(!c)return;
 e.preventDefault();e.stopImmediatePropagation();
 selectClip(c.id);
 const p0={x:e.clientX,y:e.clientY,id:e.pointerId},original=e;
 let started=false;
 const begin=()=>{if(started)return;started=true;startClipGesture(original,c,"move",false);};
 const timer=setTimeout(begin,380);
 const onMove=ev=>{
   if(ev.pointerId!==p0.id||started)return;
   const dx=ev.clientX-p0.x,dy=ev.clientY-p0.y;
   if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.2){clearTimeout(timer);begin();}
 };
 const end=ev=>{
   if(ev.pointerId!==p0.id)return;
   clearTimeout(timer);
   document.removeEventListener("pointermove",onMove,true);
   document.removeEventListener("pointerup",end,true);
   document.removeEventListener("pointercancel",end,true);
 };
 document.addEventListener("pointermove",onMove,true);
 document.addEventListener("pointerup",end,true);
 document.addEventListener("pointercancel",end,true);
},true);
window.SuesMobileGestures={usesNativeFableCutEdits:true};
})();

