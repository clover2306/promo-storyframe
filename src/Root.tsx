import React from 'react';
import {Composition} from 'remotion';
import './index.css';
import {PromoVideo} from './PromoVideo';
import {FPS, H, TOTAL_FRAMES, W} from './promoPlan';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Promo"
      component={PromoVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
    />
  );
};
