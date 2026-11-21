export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const BEAT_GAP_FRAMES = 5;
export const TAIL_HOLD_FRAMES = 15;

export type BeatId = 'beat-1' | 'beat-2' | 'beat-3' | 'beat-4' | 'beat-5';

export interface BeatSpec {
  readonly id: BeatId;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly durationFrames: number;
  readonly durationSec: number;
  readonly midFrame: number;
}

const NARRATION_DURATIONS_SEC: readonly {readonly id: BeatId; readonly sec: number}[] = [
  {id: 'beat-1', sec: 6.4},
  {id: 'beat-2', sec: 6.72},
  {id: 'beat-3', sec: 10.64},
  {id: 'beat-4', sec: 5.4},
  {id: 'beat-5', sec: 1.48},
];

const buildBeats = (): readonly BeatSpec[] => {
  const result: BeatSpec[] = [];
  let cursor = 0;

  for (let i = 0; i < NARRATION_DURATIONS_SEC.length; i++) {
    const {id, sec} = NARRATION_DURATIONS_SEC[i];
    const durationFrames = Math.ceil(sec * FPS);
    const startFrame = cursor;
    const endFrame = startFrame + durationFrames;
    const midFrame = Math.floor((startFrame + endFrame) / 2);

    result.push({
      id,
      startFrame,
      endFrame,
      durationFrames,
      durationSec: sec,
      midFrame,
    });

    cursor = endFrame + (i < NARRATION_DURATIONS_SEC.length - 1 ? BEAT_GAP_FRAMES : 0);
  }

  return result;
};

export const BEATS: readonly BeatSpec[] = buildBeats();

export const TOTAL_FRAMES =
  BEATS.reduce((acc, beat) => acc + beat.durationFrames, 0) +
  (BEATS.length - 1) * BEAT_GAP_FRAMES +
  TAIL_HOLD_FRAMES;
