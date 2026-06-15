import { FixtureId, FixtureTrack, Keyframe, LightState, DEFAULT_LIGHT_STATE } from '../types';

function binarySearchKeyframes(keyframes: Keyframe[], t: number): number {
  let lo = 0, hi = keyframes.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (keyframes[mid].time < t) lo = mid + 1;
    else hi = mid - 1;
  }
  return hi;
}

function mergeState(base: LightState, partial: Partial<LightState>): LightState {
  return { ...base, ...partial };
}

export function interpolateTrack(
  track: FixtureTrack,
  t: number,
): LightState {
  const kfs = track.keyframes;
  if (kfs.length === 0) return { ...DEFAULT_LIGHT_STATE };

  if (t <= kfs[0].time) {
    let state = { ...DEFAULT_LIGHT_STATE };
    for (const k of kfs) {
      if (k.time === kfs[0].time) state = mergeState(state, k.state);
      else break;
    }
    return applyStrobe(state, t);
  }

  if (t >= kfs[kfs.length - 1].time) {
    let state = { ...DEFAULT_LIGHT_STATE };
    for (const k of kfs) state = mergeState(state, k.state);
    return applyStrobe(state, t);
  }

  const idx = binarySearchKeyframes(kfs, t);
  const prev = kfs[idx];
  const next = kfs[idx + 1];
  const span = next.time - prev.time;
  const factor = span === 0 ? 1 : Math.min(1, Math.max(0, (t - prev.time) / span));

  let stateBefore = { ...DEFAULT_LIGHT_STATE };
  for (let i = 0; i <= idx; i++) stateBefore = mergeState(stateBefore, kfs[i].state);
  const stateAfter = mergeState(stateBefore, next.state);

  const result: LightState = {
    pan: lerp(stateBefore.pan, stateAfter.pan, factor, hasProp(kfs[idx + 1].state, 'pan')),
    tilt: lerp(stateBefore.tilt, stateAfter.tilt, factor, hasProp(kfs[idx + 1].state, 'tilt')),
    colorR: Math.round(lerp(stateBefore.colorR, stateAfter.colorR, factor, hasProp(kfs[idx + 1].state, 'colorR'))),
    colorG: Math.round(lerp(stateBefore.colorG, stateAfter.colorG, factor, hasProp(kfs[idx + 1].state, 'colorG'))),
    colorB: Math.round(lerp(stateBefore.colorB, stateAfter.colorB, factor, hasProp(kfs[idx + 1].state, 'colorB'))),
    pattern: factor < 0.5 ? stateBefore.pattern : stateAfter.pattern,
    strobeHz: lerp(stateBefore.strobeHz, stateAfter.strobeHz, factor, hasProp(kfs[idx + 1].state, 'strobeHz')),
    intensity: lerp(stateBefore.intensity, stateAfter.intensity, factor, hasProp(kfs[idx + 1].state, 'intensity')),
  };

  return applyStrobe(result, t);
}

function hasProp(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function lerp(a: number, b: number, f: number, interpolate: boolean): number {
  if (!interpolate) return a;
  return a + (b - a) * f;
}

function applyStrobe(state: LightState, t: number): LightState {
  if (state.strobeHz <= 0) return state;
  const period = 1 / state.strobeHz;
  const phase = (t % period) / period;
  const on = phase < 0.45;
  return { ...state, intensity: on ? state.intensity : 0 };
}

export function interpolateAllTracks(
  tracks: FixtureTrack[],
  t: number,
): Record<FixtureId, LightState> {
  const result = {} as Record<FixtureId, LightState>;
  for (const track of tracks) {
    result[track.fixtureId] = interpolateTrack(track, t);
  }
  return result;
}

export function insertKeyframeSorted(track: FixtureTrack, kf: Keyframe): FixtureTrack {
  const arr = [...track.keyframes];
  let i = 0;
  while (i < arr.length && arr[i].time < kf.time) i++;
  while (i < arr.length && arr[i].time === kf.time && arr[i].fixtureId === kf.fixtureId) {
    arr.splice(i, 1);
  }
  arr.splice(i, 0, kf);
  return { ...track, keyframes: arr };
}

export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
