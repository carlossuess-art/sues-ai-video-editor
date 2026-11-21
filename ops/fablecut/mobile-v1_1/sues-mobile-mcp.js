/* SUES mobile -> native FableCut MCP contract.
 * SAME project.json schema and fablecut_patch_project, never a second editor model.
 * Operations are declarative, validated by project-ops.js on server.
 * UI-only navigation is NOT included: it needs a separate MCP view bridge. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.SuesMobileMcp=api;})(typeof self!=="undefined"?self:this,function(){
"use strict";
const ACTIONS=Object.freeze({
  move:"updateClip", reorder:"updateClip", scale:"updateClip", volume:"updateClip",
  opacity:"updateClip", text:"updateClip", textStyle:"updateClip", keyframes:"updateClip",
  split:"split", remove:"removeClip", mask:"setMask", animation:"applyPreset"
});
function id(v){if(typeof v!=="string"||!v.trim())throw Error("Clip id required");return v;}
function number(v,k){if(typeof v!=="number"||!Number.isFinite(v))throw Error(k+" must be finite");return v;}
function edits(action,args={}){
  const i=id(args.id);let set,op;
  switch(action){
    case "move": set={start:Math.max(0,number(args.start,"start"))};if(args.track)set.track=String(args.track);break;
    case "reorder":if(!/^V\d+$/.test(args.track)&&!/^A\d+$/.test(args.track))throw Error("track required");set={track:args.track};break;
    case "scale":case "volume":case "opacity":
      {const v=number(args.value,action);if(action==="scale"&&!(v>=0.1&&v<=4))throw Error("scale out of range");
       if(action==="volume"&&!(v>=0&&v<=2))throw Error("volume out of range");
       if(action==="opacity"&&!(v>=0&&v<=1))throw Error("opacity out of range");
       set={props:{[action]:v}};break;}
    case "text":set={props:{text:String(args.text??"")}};break;
    case "textStyle":{
      const obj=args.props;
      if(!obj||typeof obj!=="object"||Array.isArray(obj))throw Error("textStyle props required");
      const fields=new Set(["font","fontSize","color","color2","strokeWidth","strokeColor","bgColor","bgOpacity","textShadow","glow","glowColor","textAnim","align","weight","bold","italic","uppercase","letterSpacing","lineHeight"]);
      for(const [k,v] of Object.entries(obj)){
        if(!fields.has(k))throw Error("Unsupported text property "+k);
        if(typeof v==="number"&&!Number.isFinite(v))throw Error("Nonfinite text property "+k);
      }
      set={props:obj};break;
    }
    case "keyframes":if(!args.channels||typeof args.channels!=="object"||Array.isArray(args.channels))throw Error("keyframes required");set={keyframes:args.channels};break;
    case "split":return [{op:"split",at:number(args.at,"at"),ids:[i]}];
    case "remove":return [{op:"removeClip",id:i}];
    case "mask":if(!args.set||typeof args.set!=="object")throw Error("mask settings required");return [{op:"setMask",id:i,...(args.mask==null?{}:{mask:args.mask}),set:args.set}];
    case "animation":if(!args.preset)throw Error("animation preset required");return [{op:"applyPreset",id:i,preset:args.preset,...(args.length==null?{}:{length:number(args.length,"length")})}];
    default:throw Error("No MCP parity for action: "+action);
  }
  op={op:"updateClip",id:i,set};return [op];
}
return {ACTIONS,edits,tool:"fablecut_patch_project"};
});

