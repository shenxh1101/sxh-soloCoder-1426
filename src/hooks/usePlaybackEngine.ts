import { useEffect, useRef } from 'react';
import { useLightingStore } from '../store/useLightingStore';

export function usePlaybackEngine() {
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const tick = useLightingStore((s) => s.tick);
  const isPlaying = useLightingStore((s) => s.isPlaying);

  useEffect(() => {
    const loop = (ts: number) => {
      if (lastRef.current === 0) lastRef.current = ts;
      const delta = Math.min(0.1, (ts - lastRef.current) / 1000);
      lastRef.current = ts;
      if (isPlaying) tick(delta);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };
  }, [isPlaying, tick]);
}

export function formatTimeCode(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 100);
  const hh = h > 0 ? `${String(h).padStart(2, '0')}:` : '';
  return `${hh}${String(m).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}
