import { useEffect, useMemo, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { FixtureId, FIXTURE_IDS, FIXTURE_POSITIONS, Keyframe } from '../../types';
import { useLightingStore } from '../../store/useLightingStore';
import { formatTimeCode } from '../../hooks/usePlaybackEngine';

export function BottomTimeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activeShow = useLightingStore((s) => s.activeShow);
  const currentTime = useLightingStore((s) => s.currentTime);
  const timelineScale = useLightingStore((s) => s.timelineScale);
  const setTimelineScale = useLightingStore((s) => s.setTimelineScale);
  const selectedFixtureId = useLightingStore((s) => s.selectedFixtureId);
  const selectedKeyframeId = useLightingStore((s) => s.selectedKeyframeId);
  const selectKeyframe = useLightingStore((s) => s.selectKeyframe);
  const moveKeyframe = useLightingStore((s) => s.moveKeyframe);
  const seek = useLightingStore((s) => s.seek);
  const isPlaying = useLightingStore((s) => s.isPlaying);
  const play = useLightingStore((s) => s.play);
  const pause = useLightingStore((s) => s.pause);
  const updateShowDuration = useLightingStore((s) => s.updateShowDuration);

  const [dragging, setDragging] = useState<
    | { type: 'playhead'; startX: number; startTime: number }
    | { type: 'keyframe'; id: string; startX: number; startTime: number }
    | { type: 'pan'; startX: number; startOffset: number }
    | null
  >(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hoverInfo, setHoverInfo] = useState<{ time: number; fid?: FixtureId; kid?: string } | null>(
    null,
  );

  const duration = activeShow?.duration || 120;
  const totalWidth = Math.max(2000, duration * timelineScale);
  const TRACK_HEIGHT = 28;
  const RULER_HEIGHT = 32;
  const LABEL_WIDTH = 88;
  const topHeight = RULER_HEIGHT + TRACK_HEIGHT * FIXTURE_IDS.length + 20;

  const keyframesByTrack = useMemo(() => {
    const map = new Map<FixtureId, Keyframe[]>();
    if (!activeShow) return map;
    for (const t of activeShow.tracks) {
      map.set(t.fixtureId, t.keyframes);
    }
    return map;
  }, [activeShow]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = topHeight * dpr;
    canvas.style.height = `${topHeight}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawTimeline(ctx, rect.width);
  }, [
    activeShow,
    currentTime,
    timelineScale,
    selectedFixtureId,
    selectedKeyframeId,
    scrollLeft,
    totalWidth,
    duration,
    topHeight,
  ]);

  function drawTimeline(ctx: CanvasRenderingContext2D, width: number) {
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, topHeight);

    const contentStart = LABEL_WIDTH;

    ctx.fillStyle = '#0d121e';
    ctx.fillRect(contentStart, 0, width - contentStart, RULER_HEIGHT);
    ctx.strokeStyle = '#1e2a45';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(contentStart, RULER_HEIGHT);
    ctx.lineTo(width, RULER_HEIGHT);
    ctx.stroke();

    const audioBeats = activeShow?.audioTrack?.beats;

    const secStep = timelineScale < 20 ? 5 : timelineScale < 50 ? 2 : 1;
    ctx.strokeStyle = '#1e2a45';
    ctx.fillStyle = '#5a6780';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textBaseline = 'top';

    const startSec = Math.floor(scrollLeft / timelineScale / secStep) * secStep;
    const endSec = Math.ceil((scrollLeft + width) / timelineScale / secStep) * secStep;
    for (let s = startSec; s <= endSec; s += secStep) {
      const x = contentStart + s * timelineScale - scrollLeft;
      if (x < contentStart - 1) continue;
      ctx.strokeStyle = s % (secStep * 5) === 0 ? '#2e3f66' : '#1e2a45';
      ctx.beginPath();
      ctx.moveTo(x, RULER_HEIGHT);
      ctx.lineTo(x, topHeight);
      ctx.stroke();
      if (s % (secStep * 5) === 0) {
        ctx.strokeStyle = '#3a4d78';
        ctx.beginPath();
        ctx.moveTo(x, 6);
        ctx.lineTo(x, RULER_HEIGHT);
        ctx.stroke();
        ctx.fillStyle = '#7a8aa6';
        ctx.fillText(formatTimeCode(s), x + 3, 8);
      }
    }

    if (audioBeats) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      for (const b of audioBeats) {
        const bx = contentStart + b * timelineScale - scrollLeft;
        if (bx < contentStart || bx > width) continue;
        ctx.fillRect(bx - 1, RULER_HEIGHT, 2, topHeight - RULER_HEIGHT);
      }
      ctx.fillStyle = '#a855f7';
      for (const b of audioBeats) {
        const bx = contentStart + b * timelineScale - scrollLeft;
        if (bx < contentStart || bx > width) continue;
        ctx.beginPath();
        ctx.arc(bx, RULER_HEIGHT - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    FIXTURE_IDS.forEach((fid, idx) => {
      const y = RULER_HEIGHT + idx * TRACK_HEIGHT + 6;
      const h = TRACK_HEIGHT - 12;

      const trackBg = selectedFixtureId === fid ? '#1a2340' : '#11182a';
      ctx.fillStyle = trackBg;
      ctx.fillRect(contentStart, y - 2, width - contentStart, h + 4);

      ctx.strokeStyle = selectedFixtureId === fid ? 'rgba(251, 191, 36, 0.4)' : '#1e2a45';
      ctx.strokeRect(contentStart + 0.5, y - 1.5, width - contentStart - 1, h + 3);

      const label = FIXTURE_POSITIONS[fid].name;
      ctx.fillStyle = '#0d121e';
      ctx.fillRect(0, y - 2, LABEL_WIDTH, h + 4);
      ctx.strokeStyle = '#1e2a45';
      ctx.strokeRect(0.5, y - 1.5, LABEL_WIDTH - 1, h + 3);
      ctx.fillStyle = selectedFixtureId === fid ? '#fbbf24' : '#8a96b3';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(`#${fid} ${label.split(' ')[0]}`, 8, y + h / 2);

      const state = activeShow?.audioTrack ? null : null;
      void state;

      const kfs = keyframesByTrack.get(fid) || [];
      for (const kf of kfs) {
        const kx = contentStart + kf.time * timelineScale - scrollLeft;
        if (kx < contentStart - 20 || kx > width + 20) continue;
        const isSel = selectedKeyframeId === kf.id;
        drawDiamond(ctx, kx, y + h / 2, 7, isSel ? '#fbbf24' : '#4fc3f7', isSel);
      }
    });

    const px = contentStart + currentTime * timelineScale - scrollLeft;
    ctx.strokeStyle = '#ff3d57';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff3d57';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, topHeight);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff3d57';
    ctx.beginPath();
    ctx.moveTo(px - 7, 0);
    ctx.lineTo(px + 7, 0);
    ctx.lineTo(px + 7, 14);
    ctx.lineTo(px, 22);
    ctx.lineTo(px - 7, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatTimeCode(currentTime).slice(3), px, 9);
    ctx.textAlign = 'left';
  }

  function drawDiamond(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    color: string,
    selected: boolean,
  ) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    if (selected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = color;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }

  function pixelToTime(px: number): number {
    const t = (px + scrollLeft - LABEL_WIDTH) / timelineScale;
    return Math.max(0, t);
  }

  function hitTest(x: number, y: number): { type: 'playhead' } | { type: 'keyframe'; kf: Keyframe } | null {
    if (y < RULER_HEIGHT) {
      const px = LABEL_WIDTH + currentTime * timelineScale - scrollLeft;
      if (Math.abs(x - px) < 8) return { type: 'playhead' };
      return null;
    }
    const idx = Math.floor((y - RULER_HEIGHT) / TRACK_HEIGHT);
    if (idx < 0 || idx >= FIXTURE_IDS.length) return null;
    const fid = FIXTURE_IDS[idx];
    const kfs = keyframesByTrack.get(fid) || [];
    for (const kf of kfs) {
      const kx = LABEL_WIDTH + kf.time * timelineScale - scrollLeft;
      if (Math.abs(x - kx) < 10) return { type: 'keyframe', kf };
    }
    return null;
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitTest(x, y);

    if (hit?.type === 'playhead') {
      setDragging({ type: 'playhead', startX: x, startTime: currentTime });
    } else if (hit?.type === 'keyframe') {
      selectKeyframe(hit.kf.id);
      setDragging({ type: 'keyframe', id: hit.kf.id, startX: x, startTime: hit.kf.time });
    } else if (e.button === 1 || e.shiftKey) {
      setDragging({ type: 'pan', startX: x, startOffset: scrollLeft });
    } else {
      const t = pixelToTime(x);
      seek(t);
      setDragging({ type: 'playhead', startX: x, startTime: t });
    }
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHoverInfo({ time: pixelToTime(x) });

    if (!dragging) {
      const hit = hitTest(x, y);
      if (hit?.type === 'keyframe') {
        setHoverInfo({ time: pixelToTime(x), fid: hit.kf.fixtureId, kid: hit.kf.id });
      }
      return;
    }
    const dx = x - dragging.startX;
    if (dragging.type === 'playhead') {
      const t = Math.max(0, Math.min(duration, dragging.startTime + dx / timelineScale));
      seek(Math.round(t * 100) / 100);
    } else if (dragging.type === 'keyframe') {
      const t = Math.max(0, Math.min(duration, dragging.startTime + dx / timelineScale));
      moveKeyframe(dragging.id, Math.round(t * 100) / 100);
    } else if (dragging.type === 'pan') {
      setScrollLeft(Math.max(0, dragging.startOffset - dx));
    }
  }

  function onMouseUp() {
    setDragging(null);
  }

  function onDblClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (y < RULER_HEIGHT) {
      if (isPlaying) pause();
      else play();
      return;
    }
    const idx = Math.floor((y - RULER_HEIGHT) / TRACK_HEIGHT);
    if (idx < 0 || idx >= FIXTURE_IDS.length) return;
    const fid = FIXTURE_IDS[idx];
    const t = pixelToTime(x);
    const store = useLightingStore.getState();
    const state = store.previewState[fid];
    store.addKeyframe(fid, Math.round(t * 100) / 100, { ...state });
  }

  const maxScroll = Math.max(0, totalWidth + LABEL_WIDTH - (wrapRef.current?.clientWidth || 800));

  return (
    <div className="h-[220px] bg-[#0a0e17] border-t border-[#1e2a45] flex flex-col select-none">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e2a45] bg-[#0d121e]">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold tracking-wider text-slate-400"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            ⏱ TIMELINE EDITOR
          </span>
          <div className="text-[10px] font-mono text-slate-500">
            双击轨道添加关键帧 · Shift+拖拽平移 · 菱形=关键帧
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTimelineScale(timelineScale / 1.4)}
            className="p-1 rounded bg-[#141b2d] border border-[#22304f] text-slate-400 hover:text-amber-400 hover:border-amber-500 transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="px-2 py-0.5 rounded bg-black/40 border border-[#22304f] text-[10px] font-mono text-amber-400 min-w-[70px] text-center">
            {timelineScale}px/s
          </div>
          <button
            onClick={() => setTimelineScale(timelineScale * 1.4)}
            className="p-1 rounded bg-[#141b2d] border border-[#22304f] text-slate-400 hover:text-amber-400 hover:border-amber-500 transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[#22304f] mx-1" />
          <button
            onClick={() => {
              setScrollLeft(0);
              setTimelineScale(40);
            }}
            className="p-1 rounded bg-[#141b2d] border border-[#22304f] text-slate-400 hover:text-cyan-400 hover:border-cyan-500 transition"
            title="重置视图"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[#22304f] mx-1" />
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="text-slate-500">DURATION</span>
            <input
              type="number"
              min={10}
              max={600}
              step={10}
              value={duration}
              onChange={(e) => updateShowDuration(Math.max(10, Math.min(600, Number(e.target.value))))}
              className="w-16 px-2 py-0.5 bg-black/40 border border-[#22304f] rounded text-cyan-400 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-500">秒</span>
          </div>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar"
        onScroll={(e) => setScrollLeft((e.target as HTMLDivElement).scrollLeft)}
      >
        <div style={{ width: Math.max(totalWidth + LABEL_WIDTH + 200, 100) }}>
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onDoubleClick={onDblClick}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setTimelineScale(Math.max(8, Math.min(200, timelineScale * (e.deltaY < 0 ? 1.2 : 0.8))));
              }
            }}
            style={{
              width: '100%',
              cursor: dragging
                ? dragging.type === 'pan'
                  ? 'grabbing'
                  : 'ew-resize'
                : hoverInfo?.kid
                  ? 'pointer'
                  : 'crosshair',
              display: 'block',
            }}
          />
        </div>

        {hoverInfo && (
          <div
            className="absolute pointer-events-none top-1 px-2 py-0.5 rounded bg-black/80 border border-[#22304f] text-[10px] font-mono text-amber-300"
            style={{
              left: Math.min(
                (wrapRef.current?.clientWidth || 800) - 80,
                Math.max(4, LABEL_WIDTH + hoverInfo.time * timelineScale - scrollLeft + 10),
              ),
            }}
          >
            {formatTimeCode(hoverInfo.time)}
            {hoverInfo.fid && <span className="text-cyan-400 ml-2">FIX#{hoverInfo.fid}</span>}
          </div>
        )}
      </div>
      void maxScroll;
    </div>
  );
}
