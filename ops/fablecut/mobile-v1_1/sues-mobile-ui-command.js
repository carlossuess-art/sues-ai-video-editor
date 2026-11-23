/* Validated ephemeral UI commands. Project edits go through fablecut_patch_project. */
(function(root,factory){const a=factory(typeof module==="object"&&module.exports?require("./sues-mobile-catalog"):root.SuesToolDirectory);if(typeof module==="object"&&module.exports)module.exports=a;else root.SuesMobileUiCommand=a;})(typeof self!=="undefined"?self:this,function(dir){
"use strict";
const ACTIONS=Object.freeze(["open_tool","select_clip","seek","zoom_timeline","open_panel","close_panel","undo","redo","play_pause","toggle_keyframe","expand_view","open_text_tab"]);
function normalize(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("UI command object required");
 const action=String(input.action||"");
 if(!ACTIONS.includes(action))throw Error("Unsupported UI action "+action);
 const result={action};
 if(action==="open_tool"){
  if(!dir.get(input.tool))throw Error("Unknown tool "+input.tool);
  result.tool=String(input.tool);
 }else if(action==="select_clip"){
  if(typeof input.clip!=="string"||!/^[-_a-zA-Z0-9.]{1,120}$/.test(input.clip))throw Error("Invalid clip id");
  result.clip=input.clip;
 }else if(action==="seek"||action==="zoom_timeline"){
  const n=action==="seek"?input.time:input.zoom;
  if(typeof n!=="number"||!Number.isFinite(n))throw Error("Non-finite "+action);
  if(action==="seek"){if(n<0||n>1e6)throw Error("Seek time out of range");result.time=n;}
  else{if(n<1||n>300)throw Error("Zoom out of range");result.zoom=n;}
 }else if(action==="open_text_tab"){
  if(!["Texto","Plantillas","Fuentes","Estilos","Efectos","Animaciones","Predefinidos"].includes(input.tab))throw Error("Unsupported text tab");
  result.tab=input.tab;
 }else if(action==="open_panel"){
  if(!["media","tools","mixer","transcript"].includes(input.panel))throw Error("Invalid panel");
  result.panel=input.panel;
 }
 return result;
}
return {ACTIONS,normalize};
});

