import {
  DMXExportConfig,
  DEFAULT_DMX_EXPORT_CONFIG,
  FixtureId,
  LightShow,
} from '../types';
import { interpolateTrack } from './interpolation';

function angleTo16bit(angle: number, min: number, max: number): [number, number] {
  const normalized = Math.max(0, Math.min(1, (angle - min) / (max - min)));
  const value = Math.round(normalized * 65535);
  return [value >> 8, value & 0xff];
}

function clampU8(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function buildDMXFrame(
  show: LightShow,
  t: number,
  config: DMXExportConfig = DEFAULT_DMX_EXPORT_CONFIG,
): number[] {
  const universe = new Array<number>(512).fill(0);

  for (const track of show.tracks) {
    const state = interpolateTrack(track, t);
    const startAddr = config.startAddress[track.fixtureId as FixtureId];
    const map = config.channelMap;

    const [panCoarse, panFine] = angleTo16bit(state.pan, -180, 180);
    const [tiltCoarse, tiltFine] = angleTo16bit(state.tilt, -90, 90);

    universe[startAddr + map.pan - 1] = panCoarse;
    universe[startAddr + map.panFine - 1] = panFine;
    universe[startAddr + map.tilt - 1] = tiltCoarse;
    universe[startAddr + map.tiltFine - 1] = tiltFine;
    universe[startAddr + map.intensity - 1] = clampU8((state.intensity / 100) * 255);
    universe[startAddr + map.strobe - 1] =
      state.strobeHz <= 0 ? 0 : clampU8(10 + (state.strobeHz / 30) * 245);
    universe[startAddr + map.colorR - 1] = clampU8(state.colorR);
    universe[startAddr + map.colorG - 1] = clampU8(state.colorG);
    universe[startAddr + map.colorB - 1] = clampU8(state.colorB);
    universe[startAddr + map.pattern - 1] = clampU8(state.pattern * 32);
  }

  return universe;
}

export function exportDMXToCSV(
  show: LightShow,
  config: Partial<DMXExportConfig> = {},
): string {
  const fullConfig: DMXExportConfig = { ...DEFAULT_DMX_EXPORT_CONFIG, ...config };
  const fps = fullConfig.frameRate;
  const duration = Math.max(show.duration, computeShowDuration(show));
  const totalFrames = Math.ceil(duration * fps);

  const headers = ['Time(sec)', 'Universe'];
  for (let i = 1; i <= 512; i++) headers.push(`Channel_${i}`);

  const lines: string[] = [headers.join(',')];

  for (let f = 0; f <= totalFrames; f++) {
    const t = f / fps;
    const universe = buildDMXFrame(show, t, fullConfig);
    const row = [t.toFixed(3), '1', ...universe.map(String)];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

function computeShowDuration(show: LightShow): number {
  let max = 60;
  for (const track of show.tracks) {
    for (const kf of track.keyframes) {
      if (kf.time > max) max = kf.time;
    }
  }
  return max + 2;
}

export function downloadCSV(csvContent: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
