import React from 'react';
import {Composition} from 'remotion';
import {FullVideo,FPS,TOTAL} from './FullVideo';
import {Reference158623Demo} from './SemanticVisualBeat';
import {V3GraphicRoot} from './V3GraphicScenes';
export const RemotionRoot=()=> <><Composition id="SUES-158404-FULL-DRAFT" component={FullVideo} width={1080} height={1920} fps={FPS} durationInFrames={TOTAL}/><Composition id="SUES-VISUAL-GRAMMAR-158623" component={Reference158623Demo} width={1080} height={1920} fps={30} durationInFrames={132}/><V3GraphicRoot/></>;