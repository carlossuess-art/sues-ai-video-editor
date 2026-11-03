import React from 'react';
import {Composition} from 'remotion';
import plan from './plan.json';
import {CtaVideo, type CtaAssets} from './CtaVideo';

export const RemotionRoot: React.FC = () => (
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
);
