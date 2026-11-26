from pathlib import Path
import sys
p=Path(sys.argv[1]);f=p/'sues-mobile-text.js';s=f.read_text()
a='function sync(){'
assert s.count(a)==1
s=s.replace(a,'''// Native Inspector adapter; no new text properties or renderer.
const sizeBar=document.createElement("div");sizeBar.id="suesQuickFontSize";sizeBar.hidden=true;
sizeBar.innerHTML='<button type="button" aria-label="Reducir tamaño">−</button><input type="number" inputmode="numeric" aria-label="Tamaño de texto" min="12" max="250" step="1"><button type="button" aria-label="Aumentar tamaño">+</button>';
document.getElementById("monitorStage").before(sizeBar);
const [minus,plus]=sizeBar.querySelectorAll("button"),num=sizeBar.querySelector("input");
let hold=null,timer=null,started=0,numberId=null;
const limit=v=>Math.max(12,Math.min(250,Math.round(v)));
function nativeSize(){const c=selected(),el=inspector.querySelector('[data-k="fontSize"]');return c&&el&&!el.disabled&&!isGroupLocked(c)?{c,el}:null;}
function stopSize(){clearTimeout(timer);timer=null;hold=null;}
function syncQuickSize(){const c=selected(),n=nativeSize();sizeBar.hidden=!c||!matchMedia("(max-width:980px)").matches;if(hold&&(!n||hold!==n.c.id))stopSize();minus.disabled=plus.disabled=num.disabled=!n;if(n&&document.activeElement!==num)num.value=String(Math.round(+n.el.value));}
function applySize(v,id){const n=nativeSize();if(!n||n.c.id!==id||!Number.isFinite(v))return false;v=limit(v);if(v===+n.el.value)return false;n.el.value=String(v);n.el.dispatchEvent(new Event("input",{bubbles:true}));num.value=String(v);return true;}
function beginSize(e,d){if(e.button!==0)return;e.preventDefault();const n=nativeSize();if(!n)return;stopSize();if(state.playing)pause();const id=n.c.id;if(limit(+n.el.value+d)===+n.el.value)return;pushUndo();hold=id;started=performance.now();applySize(+n.el.value+d,id);try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
 const tick=()=>{const v=nativeSize();if(hold!==id||!v||v.c.id!==id){stopSize();return;}const fast=performance.now()-started>1500;if(!applySize(+v.el.value+d*(fast?3:1),id)){stopSize();return;}timer=setTimeout(tick,fast?45:100);};timer=setTimeout(tick,420);}
for(const [b,d] of [[minus,-1],[plus,1]]){b.addEventListener("pointerdown",e=>beginSize(e,d));for(const ev of ["pointerup","pointercancel","lostpointercapture"])b.addEventListener(ev,stopSize);b.addEventListener("click",e=>{if(e.detail!==0)return;const n=nativeSize();if(!n||limit(+n.el.value+d)===+n.el.value)return;if(state.playing)pause();pushUndo();applySize(+n.el.value+d,n.c.id);});}
num.addEventListener("focus",()=>{numberId=selected()?.id||null;});
num.addEventListener("change",()=>{const n=nativeSize();if(n&&n.c.id===numberId&&num.value.trim()&&Number.isFinite(+num.value)&&limit(+num.value)!==+n.el.value){if(state.playing)pause();pushUndo();applySize(+num.value,numberId);}num.blur();syncQuickSize();});
num.addEventListener("blur",()=>{numberId=null;syncQuickSize();});window.addEventListener("blur",stopSize);
function sync(){syncQuickSize();''',1)
a='window.SuesMobileText={show,select:selected,openEditor};';assert s.count(a)==1
f.write_text(s.replace(a,'window.SuesMobileText={show,select:selected,openEditor,syncQuickSize};'))
f=p/'app.js';s=f.read_text();a='syncMaskInspector(c);syncShapeInspector(c);syncInspectorOffClip(c)}'
assert s.count(a)==1
f.write_text(s.replace(a,'syncMaskInspector(c);syncShapeInspector(c);syncInspectorOffClip(c);window.SuesMobileText?.syncQuickSize?.()}'))
print('Quick size patch applied')
