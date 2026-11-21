import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {fontsLoaded, fontsReady} from './lib/fonts';
import {BEATS, BEAT_GAP_FRAMES, H, TAIL_HOLD_FRAMES, W} from './promoPlan';

const PALETTE = {
  base: '#0F1226',
  deep: '#070916',
  indigo: '#4F46E5',
  indigoSoft: '#A5B4FC',
  violet: '#7C3AED',
  violetSoft: '#C4B5FD',
  white: '#FFFFFF',
  slateText: '#CBD5E1',
  mutedText: '#94A3B8',
  amber: '#F59E0B',
  amberDark: '#0F1226',
} as const;

const FONT_HEADLINE = '"Archivo Black", sans-serif';
const FONT_BODY = '"Inter", sans-serif';

// Real pixel dimensions of public/assets/tool-screenshot.png (1920x927).
const SCREENSHOT_W = 1920;
const SCREENSHOT_H = 927;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

const remap = (
  value: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number,
  easeFn?: (t: number) => number,
): number => {
  if (inEnd === inStart) {
    return outEnd;
  }
  const raw = clamp01((value - inStart) / (inEnd - inStart));
  const eased = easeFn ? easeFn(raw) : raw;
  return outStart + (outEnd - outStart) * eased;
};

const remapStops = (
  value: number,
  inStops: readonly number[],
  outStops: readonly number[],
  easeFn?: (t: number) => number,
): number => {
  if (value <= inStops[0]) {
    return outStops[0];
  }
  const last = inStops.length - 1;
  if (value >= inStops[last]) {
    return outStops[last];
  }
  for (let i = 0; i < last; i++) {
    if (value >= inStops[i] && value <= inStops[i + 1]) {
      return remap(value, inStops[i], inStops[i + 1], outStops[i], outStops[i + 1], easeFn);
    }
  }
  return outStops[last];
};

const popIn = (
  localFrame: number,
  fps: number,
  delayFrames: number,
  config?: {damping?: number; stiffness?: number; mass?: number},
): {opacity: number; scale: number} => {
  const progress = spring({
    frame: Math.max(0, localFrame - delayFrames),
    fps,
    config: {
      damping: config?.damping ?? 16,
      stiffness: config?.stiffness ?? 190,
      mass: config?.mass ?? 0.85,
    },
  });
  const active = localFrame >= delayFrames ? progress : 0;
  return {
    opacity: clamp01(active * 1.18),
    scale: 0.9 + 0.1 * active,
  };
};

const beatCrossfade = (
  frame: number,
  startFrame: number,
  endFrame: number,
  isFirst: boolean,
  isLast: boolean,
): number => {
  const fadeInLen = isFirst ? 0 : BEAT_GAP_FRAMES;
  const fadeOutLen = isLast ? 0 : BEAT_GAP_FRAMES;
  const visualStart = isFirst ? startFrame : startFrame - BEAT_GAP_FRAMES;
  const visualEnd = isLast ? endFrame + TAIL_HOLD_FRAMES : endFrame + BEAT_GAP_FRAMES;

  if (frame < visualStart || frame > visualEnd) {
    return 0;
  }

  let alpha = 1;
  if (fadeInLen > 0 && frame < startFrame) {
    alpha = Math.min(alpha, remap(frame, visualStart, startFrame, 0, 1, Easing.out(Easing.cubic)));
  }
  if (fadeOutLen > 0 && frame > endFrame) {
    alpha = Math.min(alpha, remap(frame, endFrame, visualEnd, 1, 0, Easing.in(Easing.cubic)));
  }
  return alpha;
};

const AmbientBackdrop: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin(frame * 0.015) * 18;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.base,
        backgroundImage: `radial-gradient(circle at 50% ${32 + drift * 0.08}%, rgba(79, 70, 229, 0.22) 0%, rgba(124, 58, 237, 0.1) 36%, rgba(15, 18, 38, 0.96) 72%, ${PALETTE.deep} 100%)`,
      }}
    />
  );
};

// Beat 1: Hook — still frame + slow continuous zoom in, elements pop in place.
const BeatOneHook: React.FC<{localFrame: number; duration: number; fps: number}> = ({
  localFrame,
  duration,
  fps,
}) => {
  const cameraScale = remap(localFrame, 0, duration, 1.0, 1.065, Easing.inOut(Easing.quad));
  const headlinePop = popIn(localFrame, fps, 1, {damping: 18, stiffness: 210, mass: 0.8});
  const subHeadPop = popIn(localFrame, fps, 8, {damping: 18, stiffness: 200, mass: 0.8});

  const dividerWidth = remap(localFrame, 70, 86, 0, 180, Easing.out(Easing.cubic));
  const lineTwoFirst = popIn(localFrame, fps, 76, {damping: 17, stiffness: 210, mass: 0.8});
  const lineTwoSecond = popIn(localFrame, fps, 84, {damping: 16, stiffness: 210, mass: 0.8});

  // Gentle emphasis pulse when "Sekarang, hitungan menit." lands in narration (~4.3s).
  const punchBoost =
    localFrame >= 124 && localFrame <= 156
      ? 1 + 0.03 * Math.sin(remap(localFrame, 124, 156, 0, Math.PI))
      : 1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 84px',
        transform: `scale(${cameraScale})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            opacity: headlinePop.opacity,
            transform: `scale(${headlinePop.scale})`,
            fontFamily: FONT_HEADLINE,
            fontWeight: 400,
            fontSize: 124,
            lineHeight: 1.04,
            letterSpacing: '-0.02em',
            color: PALETTE.white,
          }}
        >
          100 gambar
        </div>

        <div
          style={{
            marginTop: 14,
            opacity: subHeadPop.opacity,
            transform: `scale(${subHeadPop.scale})`,
            fontFamily: FONT_HEADLINE,
            fontWeight: 400,
            fontSize: 82,
            lineHeight: 1.12,
            letterSpacing: '-0.015em',
            color: PALETTE.indigoSoft,
          }}
        >
          dari 1 naskah?
        </div>

        <div
          style={{
            marginTop: 64,
            marginBottom: 60,
            width: dividerWidth,
            height: 6,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${PALETTE.indigo}, ${PALETTE.violet})`,
            opacity: dividerWidth > 1 ? 1 : 0,
          }}
        />

        <div
          style={{
            opacity: lineTwoFirst.opacity,
            transform: `scale(${lineTwoFirst.scale})`,
            fontFamily: FONT_BODY,
            fontWeight: 800,
            fontSize: 54,
            lineHeight: 1.25,
            color: PALETTE.mutedText,
          }}
        >
          Dulu seharian.
        </div>

        <div
          style={{
            marginTop: 18,
            opacity: lineTwoSecond.opacity,
            transform: `scale(${lineTwoSecond.scale * punchBoost})`,
            fontFamily: FONT_HEADLINE,
            fontWeight: 400,
            fontSize: 64,
            lineHeight: 1.2,
            color: PALETTE.white,
          }}
        >
          Sekarang,{' '}
          <span
            style={{
              display: 'inline-block',
              color: PALETTE.white,
              backgroundColor: 'rgba(79, 70, 229, 0.36)',
              borderBottom: `5px solid ${PALETTE.violet}`,
              padding: '4px 18px 8px',
              borderRadius: 14,
            }}
          >
            hitungan menit.
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Beat 2: Square cover centered with continuous slow zoom + product name + value line.
const BeatTwoProduct: React.FC<{localFrame: number; duration: number; fps: number}> = ({
  localFrame,
  duration,
  fps,
}) => {
  const titlePop = popIn(localFrame, fps, 3, {damping: 17, stiffness: 200, mass: 0.85});
  const coverAnim = popIn(localFrame, fps, 10, {damping: 18, stiffness: 170, mass: 0.9});
  const taglinePop = popIn(localFrame, fps, 52, {damping: 17, stiffness: 190, mass: 0.85});

  const coverInnerZoom = remap(localFrame, 0, duration, 1.0, 1.09, Easing.inOut(Easing.quad));
  const frameZoom = remap(localFrame, 0, duration, 1.0, 1.03, Easing.inOut(Easing.quad));

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '120px 76px',
        transform: `scale(${frameZoom})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            opacity: titlePop.opacity,
            transform: `scale(${titlePop.scale})`,
            marginBottom: 44,
          }}
        >
          <div
            style={{
              fontFamily: FONT_HEADLINE,
              fontWeight: 400,
              fontSize: 66,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: PALETTE.white,
            }}
          >
            StoryFrame AI
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: FONT_BODY,
              fontWeight: 800,
              fontSize: 36,
              lineHeight: 1.25,
              color: PALETTE.violetSoft,
            }}
          >
            — Bulk Studio Pro
          </div>
        </div>

        <div
          style={{
            opacity: coverAnim.opacity,
            transform: `scale(${coverAnim.scale})`,
            width: 780,
            height: 780,
            borderRadius: 30,
            overflow: 'hidden',
            border: '2px solid rgba(124, 58, 237, 0.55)',
            boxShadow: '0 32px 90px rgba(7, 9, 22, 0.82), 0 0 42px rgba(79, 70, 229, 0.24)',
            backgroundColor: PALETTE.deep,
          }}
        >
          <Img
            src={staticFile('assets/cover.jpg')}
            style={{
              width: 780,
              height: 780,
              objectFit: 'cover',
              transform: `scale(${coverInnerZoom})`,
              transformOrigin: '50% 50%',
            }}
          />
        </div>

        <div
          style={{
            marginTop: 54,
            maxWidth: 920,
            opacity: taglinePop.opacity,
            transform: `scale(${taglinePop.scale})`,
            fontFamily: FONT_BODY,
            fontWeight: 800,
            fontSize: 44,
            lineHeight: 1.35,
            color: PALETTE.white,
          }}
        >
          Tempel master prompt ke Gemini,
          <br />
          <span style={{color: PALETTE.indigoSoft}}>tool-nya langsung jadi.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Beat 3: Full-bleed tool screenshot with continuous Ken Burns across real 1920x927 dimensions.
// Trajectory: Scene grid (top area) -> "Generate Semua" button -> "Download ZIP" & storyboard.txt.
const BeatThreeToolDemo: React.FC<{localFrame: number; duration: number; fps: number}> = ({
  localFrame,
  duration,
  fps,
}) => {
  const progress = clamp01(localFrame / Math.max(1, duration));

  // Minimum scale to cover 1080x1920 full-bleed without any edge gap.
  const minCoverScale = Math.max(W / SCREENSHOT_W, H / SCREENSHOT_H);
  const s0 = Math.max(minCoverScale * 1.025, 2.12);
  const s1 = Math.max(minCoverScale * 1.13, 2.34);
  const s2 = Math.max(minCoverScale * 1.2, 2.48);

  const stops = [0, 0.48, 1] as const;
  const easeSmooth = Easing.inOut(Easing.cubic);

  const scale = remapStops(progress, stops, [s0, s1, s2], easeSmooth);
  // Source focus coordinates (px in 1920x927):
  //   Start (t=0):    scene grid #001-#002 + top toolbar (x=640, y=470)
  //   Mid   (t=0.48): "Generate Semua" button (x=964, y=172 -> framed in upper third via focusY=415)
  //   End   (t=1.00): "Download ZIP" + storyboard.txt + scene #003 (x=1650, y=390)
  const focusX = remapStops(progress, stops, [640, 965, 1650], easeSmooth);
  const focusY = remapStops(progress, stops, [470, 415, 390], easeSmooth);

  const scaledW = SCREENSHOT_W * scale;
  const scaledH = SCREENSHOT_H * scale;

  const tx = Math.min(0, Math.max(W - scaledW, W / 2 - focusX * scale));
  const ty = Math.min(0, Math.max(H - scaledH, H / 2 - focusY * scale));

  // First chip stays 100% solid through midpoint (localFrame 160) until narration pivots (~186).
  const chipSwitchFrame = 186;
  const chip1Enter = popIn(localFrame, fps, 4, {damping: 18, stiffness: 200, mass: 0.85});
  const chip1FadeOut = remap(localFrame, chipSwitchFrame - 6, chipSwitchFrame + 6, 1, 0, Easing.inOut(Easing.quad));
  const chip1Opacity = chip1Enter.opacity * chip1FadeOut;

  const chip2Enter = popIn(localFrame, fps, chipSwitchFrame + 2, {
    damping: 17,
    stiffness: 200,
    mass: 0.85,
  });

  const chipBaseStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 132,
    left: '50%',
    maxWidth: 968,
    width: 'max-content',
    padding: '28px 46px',
    borderRadius: 999,
    backgroundColor: 'rgba(15, 18, 38, 0.94)',
    border: '2px solid rgba(124, 58, 237, 0.65)',
    boxShadow: '0 22px 60px rgba(7, 9, 22, 0.82)',
    fontFamily: FONT_BODY,
    fontWeight: 800,
    fontSize: 32,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    color: PALETTE.white,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: PALETTE.deep}}>
      <Img
        src={staticFile('assets/tool-screenshot.png')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: SCREENSHOT_W,
          height: SCREENSHOT_H,
          maxWidth: 'none',
          maxHeight: 'none',
          transformOrigin: '0 0',
          transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
        }}
      />

      {/* Subtle top & bottom dark scrim for crisp contrast on the bottom chip */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(15,18,38,0.45) 0%, rgba(15,18,38,0) 14%, rgba(15,18,38,0) 68%, rgba(15,18,38,0.92) 100%)',
        }}
      />

      {chip1Opacity > 0.005 && (
        <div
          style={{
            ...chipBaseStyle,
            opacity: chip1Opacity,
            transform: `translateX(-50%) scale(${chip1Enter.scale})`,
          }}
        >
          Tempel naskah <span style={{color: PALETTE.violetSoft}}>•</span> Pilih gaya{' '}
          <span style={{color: PALETTE.violetSoft}}>•</span>{' '}
          <span style={{color: PALETTE.indigoSoft}}>Generate Semua</span>
        </div>
      )}

      {chip2Enter.opacity > 0.005 && (
        <div
          style={{
            ...chipBaseStyle,
            opacity: chip2Enter.opacity,
            transform: `translateX(-50%) scale(${chip2Enter.scale})`,
          }}
        >
          Karakter konsisten <span style={{color: PALETTE.violetSoft}}>•</span>{' '}
          <span style={{color: PALETTE.indigoSoft}}>Ekspor ZIP + storyboard.txt</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Beat 4: Audience statement with sequential word pop-in in place.
const BeatFourAudience: React.FC<{localFrame: number; duration: number; fps: number}> = ({
  localFrame,
  duration,
  fps,
}) => {
  const cameraScale = remap(localFrame, 0, duration, 1.0, 1.055, Easing.inOut(Easing.quad));
  const dividerWidth = remap(localFrame, 38, 54, 0, 160, Easing.out(Easing.cubic));

  const audienceWords: readonly {text: string; delay: number; accent?: boolean}[] = [
    {text: 'YouTuber,', delay: 10, accent: true},
    {text: 'kreator,', delay: 20, accent: true},
    {text: 'dan editor —', delay: 30},
  ];

  const benefitWords: readonly {text: string; delay: number; highlight?: boolean}[] = [
    {text: 'yang', delay: 44},
    {text: 'mau', delay: 48},
    {text: 'produksi', delay: 52},
    {text: 'video', delay: 57},
    {text: 'lebih', delay: 62, highlight: true},
    {text: 'cepat.', delay: 67, highlight: true},
  ];

  const kickerAnim = popIn(localFrame, fps, 3, {damping: 18, stiffness: 210, mass: 0.8});
  const fastEmphasis =
    localFrame >= 106 && localFrame <= 144
      ? 1 + 0.035 * Math.sin(remap(localFrame, 106, 144, 0, Math.PI))
      : 1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 84px',
        transform: `scale(${cameraScale})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            opacity: kickerAnim.opacity,
            transform: `scale(${kickerAnim.scale})`,
            fontFamily: FONT_BODY,
            fontWeight: 800,
            fontSize: 48,
            lineHeight: 1.2,
            color: PALETTE.indigoSoft,
            marginBottom: 22,
          }}
        >
          Buat
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {audienceWords.map((item) => {
            const anim = popIn(localFrame, fps, item.delay, {
              damping: 16,
              stiffness: 220,
              mass: 0.8,
            });
            return (
              <div
                key={item.text}
                style={{
                  opacity: anim.opacity,
                  transform: `scale(${anim.scale})`,
                  fontFamily: FONT_HEADLINE,
                  fontWeight: 400,
                  fontSize: 88,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  color: item.accent ? PALETTE.white : PALETTE.violetSoft,
                }}
              >
                {item.text}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 56,
            marginBottom: 52,
            width: dividerWidth,
            height: 6,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${PALETTE.indigo}, ${PALETTE.violet})`,
            opacity: dividerWidth > 1 ? 1 : 0,
          }}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            columnGap: 18,
            rowGap: 14,
            maxWidth: 880,
          }}
        >
          {benefitWords.map((word) => {
            const anim = popIn(localFrame, fps, word.delay, {
              damping: 17,
              stiffness: 210,
              mass: 0.8,
            });
            return (
              <span
                key={word.text}
                style={{
                  display: 'inline-block',
                  opacity: anim.opacity,
                  transform: `scale(${anim.scale * (word.highlight ? fastEmphasis : 1)})`,
                  fontFamily: word.highlight ? FONT_HEADLINE : FONT_BODY,
                  fontWeight: word.highlight ? 400 : 800,
                  fontSize: word.highlight ? 62 : 56,
                  lineHeight: 1.25,
                  color: word.highlight ? PALETTE.white : PALETTE.slateText,
                  borderBottom: word.highlight ? `5px solid ${PALETTE.indigo}` : 'none',
                  paddingBottom: word.highlight ? 4 : 0,
                }}
              >
                {word.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Beat 5: CTA — product name + big warm amber "Cek link di bio." with 0.5s still tail hold.
const BeatFiveCta: React.FC<{localFrame: number; activeDuration: number; fps: number}> = ({
  localFrame,
  activeDuration,
  fps,
}) => {
  // Clamp motion at activeDuration so the final 15-frame (0.5s) tail holds rock-steady.
  const settledFrame = Math.min(localFrame, activeDuration);
  const cameraScale = remap(settledFrame, 0, activeDuration, 1.0, 1.035, Easing.out(Easing.quad));

  // Snappy entrance so Beat 5 is already bold and legible within the first few frames.
  const brandPop = popIn(settledFrame + 4, fps, 0, {damping: 16, stiffness: 260, mass: 0.7});
  const ctaPop = popIn(settledFrame + 3, fps, 0, {damping: 15, stiffness: 270, mass: 0.7});

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 76px',
        transform: `scale(${cameraScale})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            opacity: brandPop.opacity,
            transform: `scale(${brandPop.scale})`,
            width: 210,
            height: 210,
            borderRadius: 28,
            overflow: 'hidden',
            border: '2px solid rgba(124, 58, 237, 0.55)',
            boxShadow: '0 22px 60px rgba(7, 9, 22, 0.78)',
            marginBottom: 42,
          }}
        >
          <Img
            src={staticFile('assets/cover.jpg')}
            style={{width: 210, height: 210, objectFit: 'cover'}}
          />
        </div>

        <div
          style={{
            opacity: brandPop.opacity,
            transform: `scale(${brandPop.scale})`,
            fontFamily: FONT_HEADLINE,
            fontWeight: 400,
            fontSize: 74,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: PALETTE.white,
          }}
        >
          StoryFrame AI
        </div>

        <div
          style={{
            marginTop: 12,
            opacity: brandPop.opacity,
            transform: `scale(${brandPop.scale})`,
            fontFamily: FONT_BODY,
            fontWeight: 800,
            fontSize: 38,
            lineHeight: 1.25,
            color: PALETTE.violetSoft,
          }}
        >
          Bulk Studio Pro
        </div>

        <div
          style={{
            marginTop: 72,
            opacity: ctaPop.opacity,
            transform: `scale(${ctaPop.scale})`,
            backgroundColor: PALETTE.amber,
            color: PALETTE.amberDark,
            padding: '38px 66px',
            borderRadius: 26,
            boxShadow: '0 24px 64px rgba(245, 158, 11, 0.34)',
            fontFamily: FONT_HEADLINE,
            fontWeight: 400,
            fontSize: 66,
            lineHeight: 1.1,
            letterSpacing: '-0.015em',
          }}
        >
          Cek link di bio.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PromoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [ready, setReady] = useState(fontsLoaded);

  useEffect(() => {
    if (ready) {
      return;
    }
    let mounted = true;
    void fontsReady.then(() => {
      if (mounted) {
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [ready]);

  const [beat1, beat2, beat3, beat4, beat5] = BEATS;

  const alpha1 = beatCrossfade(frame, beat1.startFrame, beat1.endFrame, true, false);
  const alpha2 = beatCrossfade(frame, beat2.startFrame, beat2.endFrame, false, false);
  const alpha3 = beatCrossfade(frame, beat3.startFrame, beat3.endFrame, false, false);
  const alpha4 = beatCrossfade(frame, beat4.startFrame, beat4.endFrame, false, false);
  const alpha5 = beatCrossfade(frame, beat5.startFrame, beat5.endFrame, false, true);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.base,
        overflow: 'hidden',
        opacity: ready ? 1 : 0,
      }}
    >
      <AmbientBackdrop frame={frame} />

      {alpha1 > 0.001 && (
        <AbsoluteFill style={{opacity: alpha1}}>
          <BeatOneHook
            localFrame={Math.max(0, frame - beat1.startFrame)}
            duration={beat1.durationFrames}
            fps={fps}
          />
        </AbsoluteFill>
      )}

      {alpha2 > 0.001 && (
        <AbsoluteFill style={{opacity: alpha2}}>
          <BeatTwoProduct
            localFrame={Math.max(0, frame - beat2.startFrame)}
            duration={beat2.durationFrames}
            fps={fps}
          />
        </AbsoluteFill>
      )}

      {alpha3 > 0.001 && (
        <AbsoluteFill style={{opacity: alpha3}}>
          <BeatThreeToolDemo
            localFrame={Math.max(0, frame - beat3.startFrame)}
            duration={beat3.durationFrames}
            fps={fps}
          />
        </AbsoluteFill>
      )}

      {alpha4 > 0.001 && (
        <AbsoluteFill style={{opacity: alpha4}}>
          <BeatFourAudience
            localFrame={Math.max(0, frame - beat4.startFrame)}
            duration={beat4.durationFrames}
            fps={fps}
          />
        </AbsoluteFill>
      )}

      {alpha5 > 0.001 && (
        <AbsoluteFill style={{opacity: alpha5}}>
          <BeatFiveCta
            localFrame={Math.max(0, frame - beat5.startFrame)}
            activeDuration={beat5.durationFrames}
            fps={fps}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
