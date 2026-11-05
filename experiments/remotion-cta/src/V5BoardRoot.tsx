import React from 'react';
import {Composition} from 'remotion';
import {V5BoardOnly} from './V5BoardOnly';
export const V5BoardRoot=()=> <React.Fragment>
 <Composition id="SUES-158404-V5-BOARD-RULES" component={V5BoardOnly} defaultProps={{sourceStartFrame:231}} width={1080} height={1920} fps={30} durationInFrames={146}/>
 <Composition id="SUES-158404-V5-BOARD-CHOICE" component={V5BoardOnly} defaultProps={{sourceStartFrame:1002}} width={1080} height={1920} fps={30} durationInFrames={236}/>
 </React.Fragment>;
