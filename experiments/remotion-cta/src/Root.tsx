import React from 'react';
import {Composition} from 'remotion';
import plan from './plan.json';
import {CtaVideo, type CtaAssets} from './CtaVideo';
import {CtaReal, REAL_FRAMES, REAL_FPS} from './CtaReal';
import {Reference158623Demo} from './SemanticVisualBeat';

export const RemotionRoot: React.FC = () => (
 <>
  <Composition
    id={plan.id}
    component={CtaVideo}
    durationInFrames={plan.totalFrames}
    fps={plan.fps}
    width={plan.width}
    height={plan.height}
    defaultProps={{
      useCarlosCutout: false,
      useNeuralVideo: false,
      useOmImage: false,
      useGalaxyImage: false,
      useInstagramScreenshot: false,
      useLogo: false,
      useVoice: false,
    } satisfies CtaAssets}
  />
  <Composition id="CTA-SUES-REAL" component={CtaReal} durationInFrames={REAL_FRAMES} fps={REAL_FPS} width={1080} height={1920} defaultProps={{hasNewVoice:false}} />
  <Composition id="SUES-VISUAL-GRAMMAR-158623" component={Reference158623Demo} durationInFrames={132} fps={30} width={1080} height={1920} />
 </>
);
