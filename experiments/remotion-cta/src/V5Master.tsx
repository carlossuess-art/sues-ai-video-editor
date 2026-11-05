import React from 'react';
import {AbsoluteFill,OffthreadVideo,staticFile} from 'remotion';
import {V4CaptionLayer,CaptionPlanStats} from './V4CaptionLayer';
import {V5SceneLayer} from './V5VisualScenes';
/** Clean rebuild from original video + original audio. No V2B/V3C baked captions reused. */
export const V5Master:React.FC=()=> <AbsoluteFill style={{overflow:'hidden',background:'#0E151C'}}>
 <style>{`@font-face{font-family:V4Montserrat;src:url("${staticFile('fonts/Montserrat-Bold.ttf')}");font-weight:700;}@font-face{font-family:V4Montserrat;src:url("${staticFile('fonts/Montserrat-ExtraBold.ttf')}");font-weight:800 900;}`}</style>
 <OffthreadVideo src={staticFile('v4/clean-base-v4.mp4')} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
 <V5SceneLayer/>
 <V4CaptionLayer/>
 </AbsoluteFill>;
export const V4Metadata=()=>({version:'V5-anthracite-review',fps:30,durationInFrames:2230,source:'clean-original-only',audio:'mux separately from V3C pause-capped soundtrack',captionPlan:CaptionPlanStats(),subtitleReused:false});
