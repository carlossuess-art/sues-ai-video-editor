/* Executed in the existing FableCut tab, triggered by authenticated MCP via SSE. */
(()=>{
"use strict";
const contract=window.SuesMobileUiCommand;
if(!contract)return;
function execute(input){
 const cmd=contract.normalize(input),app=document.getElementById("app");
 switch(cmd.action){
  case "open_tool":
   if(!window.SuesToolSearch?.navigate(cmd.tool))throw Error("Tool is unavailable");
   return true;
  case "select_clip":
   if(!getClip(cmd.clip))throw Error("Clip not found: "+cmd.clip);
   selectClip(cmd.clip);
   return state.selId===cmd.clip;
  case "seek":
   if(cmd.time>projDur())throw Error("Time beyond timeline");
   setTime(cmd.time);
   return Math.abs(state.time-cmd.time)<.001;
  case "zoom_timeline":
   setZoom(cmd.zoom);
   return Math.abs(state.pps-cmd.zoom)<.01;
  case "open_panel":
   if(!window.SuesMobileShell)throw Error("Mobile panel unavailable");
   if(cmd.panel==="mixer"||cmd.panel==="transcript"){
    if(app.dataset.mobilePanel!=="tools")window.SuesMobileShell.open("tools");
    document.querySelector('.inspector [data-side="'+cmd.panel+'"]')?.click();
   }else if(app.dataset.mobilePanel!==cmd.panel)window.SuesMobileShell.open(cmd.panel);
   return true;
  case "open_text_tab":
   if(!window.SuesMobileText?.select())throw Error("Select a text clip");
   if(app.dataset.mobilePanel!=="tools")window.SuesMobileShell.open("tools");
   window.SuesMobileText.show(cmd.tab);return true;
  case "undo":
   if(!runtime.undo.length)throw Error("No changes to undo");
   window.SuesMobileControls.undo();return true;
  case "redo":
   if(!runtime.redo.length)throw Error("No changes to redo");
   window.SuesMobileControls.redo();return true;
  case "play_pause":
   document.getElementById("btnPlay")?.click();return true;
  case "toggle_keyframe":
   return window.SuesMobileControls.keyframe()===true;
  case "expand_view":
   return window.SuesMobileControls.fullscreen()===true;
  case "close_panel":
   if(app.dataset.mobilePanel)window.SuesMobileShell.open("close");
   return true;
 }
 throw Error("Unsupported UI command");
}
window.SuesMobileRemote={execute};
})();

