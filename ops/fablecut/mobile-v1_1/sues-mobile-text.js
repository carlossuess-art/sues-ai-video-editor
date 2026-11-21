/* SUES mobile text tabs route to existing editable FableCut Inspector controls. */
(()=>{
"use strict";
const inspector=document.getElementById("inspector"),aside=inspector?.closest("aside");
if(!inspector||!aside)return;
const tabs=document.createElement("nav");tabs.id="suesTextTabs";
tabs.setAttribute("aria-label","Edición de texto");
aside.insertBefore(tabs,inspector);
const panel=document.createElement("div");panel.id="suesTextGallery";panel.hidden=true;
aside.insertBefore(panel,inspector);
let current="Texto";
const names=["Texto","Plantillas","Fuentes","Estilos","Efectos","Animaciones","Burbujas","Predefinidos"];
const buttons=new Map();
for(const name of names){
 const b=document.createElement("button");b.type="button";b.textContent=name;
 if(name==="Burbujas"){b.disabled=true;b.title="Pendiente de motor de burbujas verificable por MCP";}
 b.addEventListener("click",()=>show(name));
 tabs.appendChild(b);buttons.set(name,b);
}
function selected(){const c=getClip(state.selId);return c?.kind==="text"?c:null;}
function locate(selector){
 const el=inspector.querySelector(selector);if(!el)return false;
 el.scrollIntoView({block:"nearest",behavior:"instant"});return true;
}
function button(name,fn){
 const b=document.createElement("button");b.type="button";b.textContent=name;
 b.addEventListener("click",fn);panel.appendChild(b);return b;
}
function applyStyle(name){
 const c=selected();if(!c||isGroupLocked(c))return;
 const currentAnimation=c.props.textAnim;
 pushUndo();applyTitleStyle(c,name,{keepTransform:true});
 c.props.textAnim=currentAnimation||"none";
 scheduleSave();state.dirtyTimeline=true;renderInspector();
}
function changeField(k,value){
 const el=inspector.querySelector('[data-k="'+k+'"]');if(!el)return;
 el.value=String(value);el.dispatchEvent(new Event("input",{bubbles:true}));
}
function focusSection(label){
 const s=[...inspector.querySelectorAll(".insp-section")].find(x=>x.querySelector("h3")?.textContent.toLowerCase().includes(label));
 if(s)s.scrollIntoView({block:"nearest"});
}

function show(name){
 const c=selected();if(!c)return;
 current=name;
 for(const [n,b] of buttons)b.setAttribute("aria-pressed",String(n===name));
 panel.replaceChildren();panel.hidden=false;
 if(name==="Texto"){panel.hidden=true;locate('[data-k="text"]');return;}
 if(name==="Plantillas"){
  for(const [id,style] of Object.entries(TITLE_STYLES)){
   const b=button(style.label,()=>applyStyle(id));
   b.style.fontFamily='"'+(style.props.font||"inherit")+'",sans-serif';
  }
  return;
 }
 if(name==="Fuentes"){
  const sel=inspector.querySelector('[data-k="font"]');
  if(!sel)return;
  for(const opt of [...sel.options].filter(o=>o.value).slice(0,50)){
   const b=button(opt.value,()=>changeField("font",opt.value));
   b.style.fontFamily='"'+opt.value+'",sans-serif';
  }
  return;
 }
 if(name==="Estilos"||name==="Efectos"){
  focusSection("text style");
  const keys=name==="Estilos"?[["Trazo","strokeWidth"],["Color","color"],["Fondo","bgOpacity"]]:
   [["Brillo","glow"],["Sombra","textShadow"],["Contorno","strokeWidth"]];
  for(const [n,k] of keys)button(n,()=>locate('[data-k="'+k+'"]'));
  return;
 }
 if(name==="Animaciones"){
  for(const [label,anchor] of [["Entrada","in"],["Salida","out"],["Bucle","whole"]]){
   button(label,()=>{
     panel.replaceChildren();
     const sel=inspector.querySelector('[data-preset="'+anchor+'"]');
     if(!sel)return;
     for(const opt of [...sel.options].filter(o=>o.value)){
       button(opt.textContent,()=>{
         sel.value=opt.value;sel.dispatchEvent(new Event("change",{bubbles:true}));
       });
     }
   });
  }
  for(const name of ["none","word-pop","typewriter","word-slide","karaoke","highlight"]){
   button("Texto: "+name,()=>changeField("textAnim",name));
  }
  return;
 }
 if(name==="Predefinidos"){
  const sel=inspector.querySelector('[data-preset="in"]');
  if(sel)for(const opt of [...sel.options].filter(o=>o.value))button(opt.textContent,()=>{
   sel.value=opt.value;sel.dispatchEvent(new Event("change",{bubbles:true}));
  });
 }
}
function sync(){
 const on=!!selected()&&matchMedia("(max-width:760px)").matches;
 tabs.style.display=on?"flex":"none";
 if(!on){panel.hidden=true;return;}
 for(const [n,b] of buttons)b.setAttribute("aria-pressed",String(n===current));
}
new MutationObserver(sync).observe(inspector,{childList:true,subtree:false});
sync();
window.addEventListener("resize",sync);
window.SuesMobileText={show,select:selected};
})();

