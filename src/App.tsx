import { useEffect, useRef, useState } from 'react';
import { TopToolbar } from './components/layout/TopToolbar';
import { LeftFixturePanel } from './components/layout/LeftFixturePanel';
import { RightPropertyPanel } from './components/layout/RightPropertyPanel';
import { BottomTimeline } from './components/layout/BottomTimeline';
import { StageCanvas } from './components/scene3d/StageCanvas';
import { BeatAnalysisModal } from './components/modals/BeatAnalysisModal';
import { ShowManagerModal } from './components/modals/ShowManagerModal';
import { useLightingStore } from './store/useLightingStore';
import { usePlaybackEngine, formatTimeCode } from './hooks/usePlaybackEngine';
import { Activity, Eye, Clock, Cpu } from 'lucide-react';

export default function App() {
  const initStore = useLightingStore((s) => s.initStore);
  const activeShow = useLightingStore((s) => s.activeShow);
  const currentTime = useLightingStore((s) => s.currentTime);
  const isPlaying = useLightingStore((s) => s.isPlaying);
  const isBlackout = useLightingStore((s) => s.isBlackout);
  const selectedFixtureId = useLightingStore((s) => s.selectedFixtureId);
  const totalKeyframes = activeShow
    ? activeShow.tracks.reduce((n, t) => n + t.keyframes.length, 0)
    : 0;

  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());

  usePlaybackEngine();

  useEffect(() => {
    initStore();
  }, [initStore]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useLightingStore.getState();
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        s.isPlaying ? s.pause() : s.play();
      } else if (e.code === 'KeyB') {
        s.toggleBlackout();
      } else if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (s.activeShowId) s.saveShowToFile(s.activeShowId);
      } else if (e.code === 'KeyM') {
        s.openBeatModal();
      } else if (e.code === 'KeyL') {
        s.openManagerModal();
      } else if (e.code === 'Digit1') s.selectFixture(1);
      else if (e.code === 'Digit2') s.selectFixture(2);
      else if (e.code === 'Digit3') s.selectFixture(3);
      else if (e.code === 'Digit4') s.selectFixture(4);
      else if (e.code === 'Digit5') s.selectFixture(5);
      else if (e.code === 'Digit6') s.selectFixture(6);
      else if (e.code === 'Digit7') s.selectFixture(7);
      else if (e.code === 'Digit8') s.selectFixture(8);
      else if (e.code === 'ArrowLeft') s.seek(Math.max(0, s.currentTime - 0.5));
      else if (e.code === 'ArrowRight') s.seek(s.currentTime + 0.5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#05070d] relative overflow-hidden text-slate-200">
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-40 z-[60]" />
      <div className="overlay-scanline" />

      <TopToolbar />

      <div className="flex-1 flex overflow-hidden relative">
        <LeftFixturePanel />

        <div className="flex-1 relative flex flex-col min-w-0">
          <StageCanvas />

          <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-30">
            <div className="flex flex-col gap-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/55 backdrop-blur border border-[#1e2a45]/80 text-xs font-mono shadow-lg">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">VIEW</span>
                <span className="text-cyan-300">3D PERSPECTIVE</span>
                <span className="text-slate-600 mx-1">|</span>
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">FPS</span>
                <span
                  className={`font-bold ${
                    fps >= 45 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-red-400'
                  }`}
                >
                  {fps}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-black/55 backdrop-blur border border-[#1e2a45]/80 text-[10px] font-mono">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-slate-400">TC</span>
                <span className="text-amber-300 tabular-nums">{formatTimeCode(currentTime)}</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400 tabular-nums">{activeShow?.duration || 120}s</span>
                <span className="text-slate-600 mx-1">·</span>
                <span className="text-slate-400">KF</span>
                <span className="text-violet-300 font-bold">{totalKeyframes}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              {isBlackout && (
                <div className="px-3 py-1.5 rounded-md bg-red-500/90 text-black text-xs font-bold animate-pulse-fast flex items-center gap-2 shadow-neon-red">
                  ⚡ BLACKOUT 黑场模式 ⚡
                </div>
              )}
              {isPlaying && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/85 text-black text-xs font-bold shadow-lg shadow-emerald-500/30">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  LIVE · {useLightingStore.getState().playbackSpeed}x
                </div>
              )}
              {selectedFixtureId && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-black/55 backdrop-blur border border-amber-500/40 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-400 led-dot text-amber-400" />
                  <span className="text-slate-400">SELECTED</span>
                  <span className="text-amber-300 font-bold">FIX #{selectedFixtureId}</span>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-30">
            <div className="px-4 py-1.5 rounded-full bg-black/55 backdrop-blur border border-[#1e2a45]/80 text-[10px] font-mono text-slate-500 flex items-center gap-3 shadow-lg">
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#141b2d] border border-[#22304f] text-slate-400">Space</kbd> 播放/暂停</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#141b2d] border border-[#22304f] text-slate-400">B</kbd> 黑场</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#141b2d] border border-[#22304f] text-slate-400">1-8</kbd> 选灯</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#141b2d] border border-[#22304f] text-slate-400">M</kbd> 音乐</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-[#141b2d] border border-[#22304f] text-slate-400">←/→</kbd> 逐帧</span>
            </div>
          </div>
        </div>

        <RightPropertyPanel />
      </div>

      <BottomTimeline />

      <BeatAnalysisModal />
      <ShowManagerModal />
    </div>
  );
}
