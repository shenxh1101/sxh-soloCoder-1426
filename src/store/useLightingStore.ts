import { create } from 'zustand';
import {
  FixtureId,
  FixtureTrack,
  FIXTURE_IDS,
  Keyframe,
  LightShow,
  LightState,
  DEFAULT_LIGHT_STATE,
} from '../types';
import {
  createDemoShow,
  createEmptyShow,
  deserializeShow,
  downloadJSON,
  loadActiveShowId,
  loadShowsFromStorage,
  saveActiveShowId,
  saveShowsToStorage,
  serializeShow,
} from '../utils/showSerializer';
import { downloadCSV, exportDMXToCSV } from '../utils/dmxExporter';
import { analyzeAudioFile, BeatAnalysisResult } from '../utils/beatAnalyzer';
import { insertKeyframeSorted, interpolateAllTracks, uuid } from '../utils/interpolation';

interface LightingState {
  shows: LightShow[];
  activeShowId: string | null;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  isBlackout: boolean;
  selectedFixtureId: FixtureId | null;
  selectedKeyframeId: string | null;
  previewState: Record<FixtureId, LightState>;
  showBeatModal: boolean;
  showManagerModal: boolean;
  timelineScale: number;
  compareShowId: string | null;
  beatAnalysisResult: BeatAnalysisResult | null;
  pendingAudioFile: File | null;

  activeShow: LightShow | null;
  initStore: () => void;

  createShow: (name?: string) => string;
  duplicateShow: (id: string) => string;
  deleteShow: (id: string) => void;
  renameShow: (id: string, name: string) => void;
  switchShow: (id: string) => void;
  updateShowDuration: (duration: number) => void;
  saveShowToFile: (id: string) => void;
  loadShowFromFile: (file: File) => Promise<string>;

  addKeyframe: (fixtureId: FixtureId, time: number, state: Partial<LightState>) => string;
  deleteKeyframe: (id: string) => void;
  updateKeyframe: (id: string, patch: Partial<Keyframe>) => void;
  moveKeyframe: (id: string, newTime: number) => void;

  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  tick: (deltaSec: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleBlackout: () => void;
  setBlackout: (val: boolean) => void;

  selectFixture: (id: FixtureId | null) => void;
  selectKeyframe: (id: string | null) => void;
  setTimelineScale: (s: number) => void;

  openBeatModal: () => void;
  closeBeatModal: () => void;
  setPendingAudioFile: (f: File | null) => void;
  runBeatAnalysis: (file: File) => Promise<BeatAnalysisResult>;
  applyStrobeKeyframesFromBeats: (beats: number[], fixtureIds: FixtureId[]) => void;
  attachAudioTrack: (name: string, duration: number, beats: number[], bpm: number) => void;

  openManagerModal: () => void;
  closeManagerModal: () => void;
  setCompareShow: (id: string | null) => void;
  updateThumbnail: (showId: string, dataUrl: string) => void;

  exportDMX: (showId: string) => void;

  recomputePreview: () => void;
}

function buildDefaultPreview(): Record<FixtureId, LightState> {
  const p = {} as Record<FixtureId, LightState>;
  FIXTURE_IDS.forEach((id) => (p[id] = { ...DEFAULT_LIGHT_STATE }));
  return p;
}

function persistShows(shows: LightShow[]) {
  saveShowsToStorage(shows);
}

export const useLightingStore = create<LightingState>((set, get) => ({
  shows: [],
  activeShowId: null,
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  isBlackout: false,
  selectedFixtureId: 1,
  selectedKeyframeId: null,
  previewState: buildDefaultPreview(),
  showBeatModal: false,
  showManagerModal: false,
  timelineScale: 40,
  compareShowId: null,
  beatAnalysisResult: null,
  pendingAudioFile: null,

  get activeShow() {
    const s = get();
    return s.shows.find((x) => x.id === s.activeShowId) || null;
  },

  initStore: () => {
    let shows = loadShowsFromStorage();
    let activeId = loadActiveShowId();
    if (shows.length === 0) {
      const demo = createDemoShow();
      const empty = createEmptyShow('空白方案 1');
      shows = [demo, empty];
      activeId = demo.id;
      persistShows(shows);
      saveActiveShowId(activeId);
    }
    if (!activeId || !shows.find((s) => s.id === activeId)) {
      activeId = shows[0]?.id || null;
      if (activeId) saveActiveShowId(activeId);
    }
    set({ shows, activeShowId: activeId });
    get().recomputePreview();
  },

  createShow: (name) => {
    const show = createEmptyShow(name);
    const shows = [...get().shows, show];
    persistShows(shows);
    set({ shows, activeShowId: show.id });
    saveActiveShowId(show.id);
    get().recomputePreview();
    return show.id;
  },

  duplicateShow: (id) => {
    const src = get().shows.find((s) => s.id === id);
    if (!src) return '';
    const copy: LightShow = {
      ...JSON.parse(serializeShow(src)),
      id: uuid(),
      name: `${src.name} (副本)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    for (const t of copy.tracks) {
      for (const k of t.keyframes) k.id = uuid();
    }
    const shows = [...get().shows, copy];
    persistShows(shows);
    set({ shows, activeShowId: copy.id });
    saveActiveShowId(copy.id);
    get().recomputePreview();
    return copy.id;
  },

  deleteShow: (id) => {
    let shows = get().shows.filter((s) => s.id !== id);
    if (shows.length === 0) shows = [createEmptyShow('空白方案')];
    persistShows(shows);
    let activeId = get().activeShowId;
    if (activeId === id) {
      activeId = shows[0].id;
      saveActiveShowId(activeId);
    }
    set({ shows, activeShowId: activeId });
    get().recomputePreview();
  },

  renameShow: (id, name) => {
    const shows = get().shows.map((s) =>
      s.id === id ? { ...s, name, updatedAt: Date.now() } : s,
    );
    persistShows(shows);
    set({ shows });
  },

  switchShow: (id) => {
    set({ activeShowId: id, currentTime: 0, isPlaying: false });
    saveActiveShowId(id);
    get().recomputePreview();
  },

  updateShowDuration: (duration) => {
    const shows = get().shows.map((s) =>
      s.id === get().activeShowId ? { ...s, duration, updatedAt: Date.now() } : s,
    );
    persistShows(shows);
    set({ shows });
  },

  saveShowToFile: (id) => {
    const show = get().shows.find((s) => s.id === id);
    if (!show) return;
    downloadJSON(serializeShow(show), `${show.name.replace(/\s+/g, '_')}.lighting.json`);
  },

  loadShowFromFile: async (file) => {
    const text = await file.text();
    const show = deserializeShow(text);
    if (!show) throw new Error('无效的方案文件');
    show.id = uuid();
    show.updatedAt = Date.now();
    const shows = [...get().shows, show];
    persistShows(shows);
    set({ shows, activeShowId: show.id });
    saveActiveShowId(show.id);
    get().recomputePreview();
    return show.id;
  },

  addKeyframe: (fixtureId, time, state) => {
    const showId = get().activeShowId;
    if (!showId) return '';
    const kfId = uuid();
    const newKf: Keyframe = { id: kfId, time, fixtureId, state };
    const shows = get().shows.map((s) => {
      if (s.id !== showId) return s;
      const tracks = s.tracks.map((t) =>
        t.fixtureId === fixtureId ? insertKeyframeSorted(t, newKf) : t,
      );
      return { ...s, tracks, updatedAt: Date.now() };
    });
    persistShows(shows);
    set({ shows, selectedKeyframeId: kfId });
    get().recomputePreview();
    return kfId;
  },

  deleteKeyframe: (id) => {
    const showId = get().activeShowId;
    if (!showId) return;
    const shows = get().shows.map((s) => {
      if (s.id !== showId) return s;
      const tracks = s.tracks.map((t) => ({
        ...t,
        keyframes: t.keyframes.filter((k) => k.id !== id),
      })) as FixtureTrack[];
      return { ...s, tracks, updatedAt: Date.now() };
    });
    persistShows(shows);
    set({ shows, selectedKeyframeId: get().selectedKeyframeId === id ? null : get().selectedKeyframeId });
    get().recomputePreview();
  },

  updateKeyframe: (id, patch) => {
    const showId = get().activeShowId;
    if (!showId) return;
    const shows = get().shows.map((s) => {
      if (s.id !== showId) return s;
      const tracks = s.tracks.map((t) => ({
        ...t,
        keyframes: t.keyframes.map((k) => {
          if (k.id !== id) return k;
          const merged = { ...k, ...patch };
          if (patch.state) merged.state = { ...k.state, ...patch.state };
          return merged;
        }),
      })) as FixtureTrack[];
      return { ...s, tracks, updatedAt: Date.now() };
    });
    persistShows(shows);
    set({ shows });
    get().recomputePreview();
  },

  moveKeyframe: (id, newTime) => {
    const showId = get().activeShowId;
    if (!showId) return;
    const shows = get().shows.map((s) => {
      if (s.id !== showId) return s;
      const tracks = s.tracks.map((t) => {
        const kf = t.keyframes.find((k) => k.id === id);
        if (!kf) return t;
        const others = t.keyframes.filter((k) => k.id !== id);
        const moved = { ...kf, time: Math.max(0, newTime) };
        return insertKeyframeSorted({ ...t, keyframes: others }, moved);
      }) as FixtureTrack[];
      return { ...s, tracks, updatedAt: Date.now() };
    });
    persistShows(shows);
    set({ shows });
    get().recomputePreview();
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => {
    set({ isPlaying: false, currentTime: 0 });
    get().recomputePreview();
  },

  seek: (time) => {
    set({ currentTime: Math.max(0, time) });
    get().recomputePreview();
  },

  tick: (delta) => {
    const s = get();
    if (!s.isPlaying || !s.activeShow) return;
    const next = s.currentTime + delta * s.playbackSpeed;
    const dur = s.activeShow.duration;
    if (next >= dur) {
      set({ currentTime: dur, isPlaying: false });
    } else {
      set({ currentTime: next });
    }
    get().recomputePreview();
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  toggleBlackout: () => {
    set({ isBlackout: !get().isBlackout });
    get().recomputePreview();
  },
  setBlackout: (val) => {
    set({ isBlackout: val });
    get().recomputePreview();
  },

  selectFixture: (id) => set({ selectedFixtureId: id }),
  selectKeyframe: (id) => set({ selectedKeyframeId: id }),
  setTimelineScale: (s) => set({ timelineScale: Math.max(8, Math.min(200, s)) }),

  openBeatModal: () => set({ showBeatModal: true }),
  closeBeatModal: () => set({ showBeatModal: false, beatAnalysisResult: null, pendingAudioFile: null }),
  setPendingAudioFile: (f) => set({ pendingAudioFile: f }),

  runBeatAnalysis: async (file) => {
    const result = await analyzeAudioFile(file);
    set({ beatAnalysisResult: result });
    return result;
  },

  applyStrobeKeyframesFromBeats: (beats, fixtureIds) => {
    const showId = get().activeShowId;
    if (!showId) return;
    const shows = get().shows.map((s) => {
      if (s.id !== showId) return s;
      const tracks = s.tracks.map((t) => {
        if (!fixtureIds.includes(t.fixtureId)) return t;
        let track = t;
        for (const beatTime of beats) {
          const kfOn: Keyframe = {
            id: uuid(),
            time: beatTime,
            fixtureId: t.fixtureId,
            state: { intensity: 100, strobeHz: 15 },
          };
          const kfOff: Keyframe = {
            id: uuid(),
            time: beatTime + 0.15,
            fixtureId: t.fixtureId,
            state: { intensity: 30, strobeHz: 0 },
          };
          track = insertKeyframeSorted(track, kfOn);
          track = insertKeyframeSorted(track, kfOff);
        }
        return track;
      }) as FixtureTrack[];
      return { ...s, tracks, updatedAt: Date.now() };
    });
    persistShows(shows);
    set({ shows });
    get().recomputePreview();
  },

  attachAudioTrack: (name, duration, beats, bpm) => {
    const showId = get().activeShowId;
    if (!showId) return;
    const shows = get().shows.map((s) =>
      s.id === showId
        ? {
            ...s,
            audioTrack: { name, duration, beats, bpm },
            duration: Math.max(s.duration, Math.ceil(duration)),
            updatedAt: Date.now(),
          }
        : s,
    );
    persistShows(shows);
    set({ shows });
  },

  openManagerModal: () => set({ showManagerModal: true }),
  closeManagerModal: () => set({ showManagerModal: false, compareShowId: null }),
  setCompareShow: (id) => set({ compareShowId: id }),

  updateThumbnail: (showId, dataUrl) => {
    const shows = get().shows.map((s) =>
      s.id === showId ? { ...s, thumbnailDataUrl: dataUrl, updatedAt: Date.now() } : s,
    );
    persistShows(shows);
    set({ shows });
  },

  exportDMX: (showId) => {
    const show = get().shows.find((s) => s.id === showId);
    if (!show) return;
    const csv = exportDMXToCSV(show);
    downloadCSV(csv, `${show.name.replace(/\s+/g, '_')}_DMX512.csv`);
  },

  recomputePreview: () => {
    const s = get();
    if (!s.activeShow) return;
    const state = interpolateAllTracks(s.activeShow.tracks, s.currentTime);
    if (s.isBlackout) {
      FIXTURE_IDS.forEach((id) => {
        state[id] = { ...state[id], intensity: 0 };
      });
    }
    set({ previewState: state });
  },
}));
