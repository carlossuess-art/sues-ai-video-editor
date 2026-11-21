/* Real FableCut undo, redo and keyframe controls exposed in mobile transport. */
(()=>{
"use strict";
const bar=document.querySelector(".transport");
if(!bar||document.getElementById("suesMobileActions"))return;
const box=document.createElement("div");box.id="suesMobileActions";
function add(label,title,fn){
 const b=document.createElement("button");b.type="button";
 b.textContent=label;b.title=title;b.setAttribute("aria-label",title);
 b.addEventListener("click",fn);box.appendChild(b);return b;
}
const nativeUndo=()=>undo(),nativeRedo=()=>redo();
function keyframe(){
 const c=getClip(state.selId);
 if(!c){toast("Selecciona un clip");return false;}
 if(isGroupLocked(c)){toastLocked();return false;}
 const chosen=document.querySelector('#suesToolRail button[aria-pressed="true"]')?.dataset.tool;
 const k=ANIMATABLE.includes(chosen)?chosen:(c.kind==="audio"?"volume":"scale");
 if(!playheadOverClip(c)){toast("Mueve el cursor sobre este clip");return false;}
 pushUndo();
 const ok=toggleKfAtPlayhead(c,k);
 if(ok){scheduleSave();renderInspector();state.dirtyTimeline=true;}
 return ok;
}
function fullscreen(){
 document.getElementById("app")?.classList.toggle("sues-theatre");
 return true;
}
add("↶","Deshacer",nativeUndo);
add("◆","Añadir o quitar keyframe",keyframe);
add("↷","Rehacer",nativeRedo);
add("⛶","Vista ampliada",fullscreen);
bar.insertBefore(box,bar.querySelector(".transport-btns"));
window.SuesMobileControls={undo:nativeUndo,redo:nativeRedo,keyframe,fullscreen};
})();

