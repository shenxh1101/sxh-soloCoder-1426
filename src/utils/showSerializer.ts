import { FixtureId, FixtureTrack, LightShow, DEFAULT_LIGHT_STATE, FIXTURE_IDS } from '../types';
import { uuid } from './interpolation';

export function createEmptyShow(name = '未命名方案'): LightShow {
  const now = Date.now();
  const tracks: FixtureTrack[] = FIXTURE_IDS.map((id) => ({
    fixtureId: id,
    keyframes: [
      {
        id: uuid(),
        time: 0,
        fixtureId: id,
        state: { ...DEFAULT_LIGHT_STATE },
      },
    ],
  }));
  return {
    id: uuid(),
    name,
    createdAt: now,
    updatedAt: now,
    duration: 120,
    tracks,
  };
}

export function createDemoShow(): LightShow {
  const show = createEmptyShow('演示方案 - 开场秀');
  show.duration = 60;

  const colors = [
    { r: 255, g: 0, b: 100 },
    { r: 0, g: 200, b: 255 },
    { r: 255, g: 200, b: 0 },
    { r: 150, g: 0, b: 255 },
    { r: 0, g: 255, b: 150 },
  ];

  FIXTURE_IDS.forEach((fid, idx) => {
    const track = show.tracks[idx];
    track.keyframes = [];

    for (let t = 0; t <= 50; t += 5) {
      const colorIdx = Math.floor(t / 10) % colors.length;
      const color = colors[colorIdx];
      const pan = Math.sin((t + idx * 3) * 0.2) * 60;
      const tilt = -30 + Math.cos((t + idx * 2) * 0.15) * 30;
      const strobe = t % 10 === 0 && t > 0 ? 12 : 0;
      track.keyframes.push({
        id: uuid(),
        time: t,
        fixtureId: fid,
        state: {
          pan,
          tilt,
          colorR: color.r,
          colorG: color.g,
          colorB: color.b,
          strobeHz: strobe,
          pattern: t % 20 === 0 ? ((idx + Math.floor(t / 20)) % 7) + 1 : 0,
          intensity: 100,
        },
      });
    }
  });

  return show;
}

export function serializeShow(show: LightShow): string {
  return JSON.stringify(show, null, 2);
}

export function deserializeShow(json: string): LightShow | null {
  try {
    const data = JSON.parse(json) as LightShow;
    if (!data.id || !data.tracks || !Array.isArray(data.tracks)) return null;
    for (const t of data.tracks) {
      if (!FIXTURE_IDS.includes(t.fixtureId as FixtureId)) return null;
      if (!Array.isArray(t.keyframes)) return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const SHOWS_STORAGE_KEY = 'stage_light_shows_v1';
const ACTIVE_SHOW_KEY = 'stage_light_active_show_v1';

export function loadShowsFromStorage(): LightShow[] {
  try {
    const raw = localStorage.getItem(SHOWS_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as LightShow[];
    return Array.isArray(data) ? data.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function saveShowsToStorage(shows: LightShow[]): void {
  try {
    localStorage.setItem(SHOWS_STORAGE_KEY, JSON.stringify(shows));
  } catch {
    console.warn('Failed to save shows to localStorage');
  }
}

export function loadActiveShowId(): string | null {
  return localStorage.getItem(ACTIVE_SHOW_KEY);
}

export function saveActiveShowId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_SHOW_KEY, id);
  else localStorage.removeItem(ACTIVE_SHOW_KEY);
}
