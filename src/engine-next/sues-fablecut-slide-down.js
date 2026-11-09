/** SUES text animation specification for FableCut integration.
 * This module is inert until a trusted FableCut renderer and catalog explicitly
 * implement its contract. Do not dispatch as an existing MCP effect.
 */
export const SLIDE_DOWN_TEXT=Object.freeze({
 id:'sues-text-slide-down-v1',
 label:'SUES · Deslizar hacia abajo',
 status:'requires-fablecut-native-renderer',
 kind:'text-animation',
 typography:{family:'Inter',weight:700,requiresVerifiedFont:true},
 palette:{primary:'#FFFFFF',accent:'#FF6A32'},
 durationFrames:18,
 fps:30,
 easing:'ease-out-cubic',
 from:{translateYRatio:-0.092,opacity:1},
 to:{translateYRatio:0,opacity:1},
 safeArea:'subject-aware',
 supportsTimelineOffset:true,
 requiresHumanVisualQA:true
});
const clamp=x=>Math.min(1,Math.max(0,x));
export function sampleSlideDown(frame,{height=1920,durationFrames=SLIDE_DOWN_TEXT.durationFrames}={}){
 if(!Number.isFinite(frame)||frame<0||!Number.isFinite(height)||height<=0||!Number.isInteger(durationFrames)||durationFrames<=0)throw RangeError('Invalid animation geometry');
 const t=clamp(frame/durationFrames),e=1-(1-t)**3;
 return {translateYPx:-0.092*height*(1-e),opacity:1,complete:t===1};
}
export function validateSlideDownRuntime({fontAvailable=false,rendererSupportsTextKeyframes=false}={}){
 return {ready:fontAvailable===true&&rendererSupportsTextKeyframes===true,
 missing:[...(!fontAvailable?['verified Inter font']:[]),...(!rendererSupportsTextKeyframes?['native FableCut text keyframe support']:[])]};
}
