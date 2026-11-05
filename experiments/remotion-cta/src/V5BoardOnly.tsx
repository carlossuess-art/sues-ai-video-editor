import React from 'react';
import {AbsoluteFill,Sequence,staticFile} from 'remotion';
import {V5SceneLayer} from './V5VisualScenes';
import {V5CaptionLayer} from './V5CaptionLayer';
// The sequence shifts LOCAL Remotion frames into the unchanged original timeline.
// No source video decoding; graphics & their captions remain separately editable.
export const V5BoardOnly:React.FC<{sourceStartFrame:number}>=({sourceStartFrame})=><AbsoluteFill style={{background:'#0A1119'}}>
 <style>{`@font-face{font-family:V4Montserrat;src:url("${staticFile('fonts/Montserrat-Bold.ttf')}");font-weight:700;}@font-face{font-family:V4Montserrat;src:url("${staticFile('fonts/Montserrat-ExtraBold.ttf')}");font-weight:800 900;}`}</style>
 <Sequence from={-sourceStartFrame} layout="none">
  <V5SceneLayer/>
  <V5CaptionLayer/>
 </Sequence>
 </AbsoluteFill>;
