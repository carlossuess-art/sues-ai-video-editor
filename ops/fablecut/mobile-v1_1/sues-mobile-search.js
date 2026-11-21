/* SUES mobile tool lookup opens original Inspector controls (no duplicate editors). */
(()=>{
"use strict";
const dir=window.SuesToolDirectory,shell=window.SuesMobileShell;
const app=document.getElementById("app"),dock=document.getElementById("suesMobileDock");
const inspector=document.getElementById("inspector"),aside=inspector?.closest("aside");
if(!dir||!shell||!app||!dock||!inspector||!aside)return;
let active=null;
const b=document.createElement("button");
b.type="button";b.textContent="⌕ Buscar";b.dataset.mobileAction="search";
b.setAttribute("aria-label","Buscar herramientas");
dock.insertBefore(b,dock.querySelector('[data-mobile-action="close"]'));
const box=document.createElement("section");box.id="suesToolSearch";box.hidden=true;
const input=document.createElement("input");input.type="search";
input.placeholder="¿Qué herramienta buscas?";input.setAttribute("aria-label","Buscar herramientas");
const results=document.createElement("div");results.id="suesToolResults";
const status=document.createElement("p");status.id="suesToolStatus";status.setAttribute("role","status");
box.append(input,results,status);app.appendChild(box);
const rail=document.createElement("nav");rail.id="suesToolRail";
rail.setAttribute("aria-label","Herramientas de la capa");aside.insertBefore(rail,inspector);
function close(){box.hidden=true;}
function paint(){
 results.replaceChildren();
 for(const t of dir.search(input.value)){
   const it=document.createElement("button");it.type="button";it.textContent=t.name;
   it.addEventListener("click",()=>{navigate(t.id);close();});
   results.appendChild(it);
 }
 status.textContent=results.children.length?"":"No se ha encontrado esa herramienta";
}
function open(){box.hidden=false;input.value="";paint();input.focus();}
input.addEventListener("input",paint);
input.addEventListener("keydown",e=>{if(e.key==="Escape"){close();b.focus();}});
b.addEventListener("click",()=>box.hidden?open():close());
function target(t){
 if(t.kind==="inspector")return inspector.querySelector('[data-k="'+t.field+'"]');
 if(t.kind==="section")return [...inspector.querySelectorAll(".insp-section")].find(e=>
 (e.querySelector("h3")?.textContent||"").toLowerCase().includes(t.heading))||null;
 if(t.kind==="button")return document.querySelector(t.selector);
 return null;
}

function focusTool(){
 const t=dir.get(active);if(!t)return;
 for(const el of rail.querySelectorAll("button"))el.setAttribute("aria-pressed",String(el.dataset.tool===active));
 const el=target(t);
 if(t.kind==="tab"){status.textContent="";return;}
 if(!el){status.textContent="Selecciona una capa compatible para utilizar "+t.name;return;}
 status.textContent="";
 el.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"});
 const row=el.closest(".insp-row")||el;
 for(const old of inspector.querySelectorAll(".sues-focused-control"))old.classList.remove("sues-focused-control");
 row.classList.add("sues-focused-control");
}
function navigate(id){
 const t=dir.get(id);if(!t)return false;
 active=id;
 if(t.kind==="button"){
   if(app.dataset.mobilePanel)shell.open("close");
 }else{
   if(app.dataset.mobilePanel!=="tools")shell.open("tools");
   if(t.kind==="tab")document.querySelector('.inspector [data-side="'+t.tab+'"]')?.click();
   else document.querySelector('.inspector [data-side="inspector"]')?.click();
 }
 focusTool();return true;
}
for(const id of ["scale","mask","volume","opacity","speed","rotation","fontSize","color"]){
 const t=dir.get(id),b=document.createElement("button");b.type="button";
 b.textContent=t.name;b.dataset.tool=t.id;b.setAttribute("aria-pressed","false");
 b.addEventListener("click",()=>navigate(t.id));rail.appendChild(b);
}
new MutationObserver(()=>{if(active&&dir.get(active)?.kind!=="tab")focusTool();})
 .observe(inspector,{childList:true,subtree:false});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!box.hidden)close();});
window.SuesToolSearch={navigate,open,search:q=>dir.search(q).map(t=>t.id)};
})();

