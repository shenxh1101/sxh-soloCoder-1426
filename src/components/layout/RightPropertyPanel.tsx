import { useEffect, useState } from 'react';
import { Sliders, Palette, Crosshair, Zap, Grid3X3, Plus, Trash2 } from 'lucide-react';
import { FixtureId, LightState, PATTERN_NAMES } from '../../types';
import { useLightingStore } from '../../store/useLightingStore';

export function RightPropertyPanel() {
  const selectedFixtureId = useLightingStore((s) => s.selectedFixtureId);
  const selectedKeyframeId = useLightingStore((s) => s.selectedKeyframeId);
  const previewState = useLightingStore((s) => s.previewState);
  const livePreviewOverride = useLightingStore((s) => s.livePreviewOverride);
  const currentTime = useLightingStore((s) => s.currentTime);
  const activeShow = useLightingStore((s) => s.activeShow);

  const addKeyframe = useLightingStore((s) => s.addKeyframe);
  const deleteKeyframe = useLightingStore((s) => s.deleteKeyframe);
  const updateKeyframe = useLightingStore((s) => s.updateKeyframe);
  const setLivePreview = useLightingStore((s) => s.setLivePreview);
  const clearLivePreview = useLightingStore((s) => s.clearLivePreview);

  const [liveState, setLiveState] = useState<Partial<LightState>>({});

  useEffect(() => {
    setLiveState({});
  }, [selectedFixtureId, selectedKeyframeId]);

  useEffect(() => {
    return () => {
      if (selectedFixtureId) clearLivePreview(selectedFixtureId);
    };
  }, [selectedFixtureId, clearLivePreview]);

  const effectiveState: LightState = {
    ...(selectedFixtureId ? previewState[selectedFixtureId] : ({} as LightState)),
    ...liveState,
  } as LightState;

  const hasLiveEdits =
    selectedFixtureId &&
    (livePreviewOverride[selectedFixtureId] &&
      Object.keys(livePreviewOverride[selectedFixtureId]!).length > 0);

  const selectedKf = activeShow?.tracks
    .flatMap((t) => t.keyframes)
    .find((k) => k.id === selectedKeyframeId);

  const updateProp = (key: keyof LightState, value: number) => {
    if (!selectedFixtureId) return;
    setLiveState((prev) => ({ ...prev, [key]: value }));
    setLivePreview(selectedFixtureId, { [key]: value } as Partial<LightState>);

    if (selectedKf && selectedKf.fixtureId === selectedFixtureId) {
      updateKeyframe(selectedKf.id, { state: { ...selectedKf.state, [key]: value } });
    }
  };

  const handleAddKeyframe = () => {
    if (!selectedFixtureId) return;
    const final: Partial<LightState> = { ...effectiveState };
    addKeyframe(selectedFixtureId, Math.round(currentTime * 100) / 100, final);
    setLiveState({});
    clearLivePreview(selectedFixtureId);
  };

  return (
    <div className="w-[300px] h-full bg-[#0d121e] border-l border-[#1e2a45] flex flex-col overflow-hidden select-none">
      <div className="px-4 py-3 border-b border-[#1e2a45]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2
              className="text-sm font-bold tracking-wider text-slate-200"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              PROPERTY EDITOR
            </h2>
          </div>
          <span className="text-xs font-mono text-amber-400">
            {selectedFixtureId ? `FIX #${selectedFixtureId}` : '未选择'}
          </span>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleAddKeyframe}
            disabled={!selectedFixtureId}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-xs hover:from-amber-400 hover:to-orange-400 transition disabled:opacity-40 disabled:cursor-not-allowed shadow shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            插入关键帧 @ {currentTime.toFixed(2)}s
          </button>
          {selectedKf && (
            <button
              onClick={() => deleteKeyframe(selectedKf.id)}
              className="px-2.5 py-1.5 rounded bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition"
              title="删除选中关键帧"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!selectedFixtureId ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <Crosshair className="w-12 h-12 mx-auto mb-3 opacity-30" />
            请在左侧或3D场景中选择灯具组
          </div>
        ) : (
          <div className="divide-y divide-[#1e2a45]">
            <Section title="POSITION 位置" icon={<Crosshair className="w-3.5 h-3.5" />} defaultOpen>
              <DialKnob
                label="PAN 水平"
                value={effectiveState.pan || 0}
                min={-180}
                max={180}
                unit="°"
                color="#f59e0b"
                onChange={(v) => updateProp('pan', v)}
              />
              <DialKnob
                label="TILT 垂直"
                value={effectiveState.tilt || 0}
                min={-90}
                max={90}
                unit="°"
                color="#06b6d4"
                onChange={(v) => updateProp('tilt', v)}
              />
            </Section>

            <Section title="COLOR 颜色" icon={<Palette className="w-3.5 h-3.5" />} defaultOpen>
              <ColorSlider
                label="RED"
                value={effectiveState.colorR ?? 0}
                color="#ef4444"
                onChange={(v) => updateProp('colorR', v)}
              />
              <ColorSlider
                label="GREEN"
                value={effectiveState.colorG ?? 0}
                color="#22c55e"
                onChange={(v) => updateProp('colorG', v)}
              />
              <ColorSlider
                label="BLUE"
                value={effectiveState.colorB ?? 0}
                color="#3b82f6"
                onChange={(v) => updateProp('colorB', v)}
              />
              <div className="mt-3 p-3 rounded bg-black/40 border border-[#22304f] flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded border border-white/20 shadow-inner"
                  style={{
                    backgroundColor: `rgb(${effectiveState.colorR ?? 0},${effectiveState.colorG ?? 0},${effectiveState.colorB ?? 0})`,
                    boxShadow: `0 0 20px rgba(${effectiveState.colorR ?? 0},${effectiveState.colorG ?? 0},${effectiveState.colorB ?? 0},0.5)`,
                  }}
                />
                <div className="flex-1 text-xs font-mono">
                  <div className="text-slate-400">HEX</div>
                  <div className="text-slate-200">
                    #{rgbToHex(effectiveState.colorR ?? 0)}{rgbToHex(effectiveState.colorG ?? 0)}
                    {rgbToHex(effectiveState.colorB ?? 0)}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="BEAM 光束" icon={<Grid3X3 className="w-3.5 h-3.5" />}>
              <Slider
                label="INTENSITY 亮度"
                value={effectiveState.intensity ?? 0}
                min={0}
                max={100}
                unit="%"
                color="#fbbf24"
                onChange={(v) => updateProp('intensity', v)}
              />
              <div className="mb-3">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 block">
                  PATTERN 图案
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PATTERN_NAMES.map((name, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateProp('pattern', idx)}
                      className={`relative aspect-square rounded border text-[9px] font-bold transition flex flex-col items-center justify-center ${
                        (effectiveState.pattern ?? 0) === idx
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-[#22304f] bg-[#141b2d] text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-lg leading-none">{['●','▦','✦','▩','≋','*','◉'][idx] || '○'}</div>
                      <div className="text-[8px] mt-0.5">{idx}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 text-[10px] text-slate-500 text-center font-mono">
                  {PATTERN_NAMES[effectiveState.pattern ?? 0]}
                </div>
              </div>
            </Section>

            <Section title="STROBE 频闪" icon={<Zap className="w-3.5 h-3.5" />}>
              <Slider
                label="FREQUENCY 频率"
                value={effectiveState.strobeHz ?? 0}
                min={0}
                max={30}
                unit="Hz"
                color="#a855f7"
                step={0.5}
                onChange={(v) => updateProp('strobeHz', v)}
              />
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[
                  { n: 'OFF', v: 0 },
                  { n: '慢', v: 4 },
                  { n: '中', v: 12 },
                  { n: '快', v: 24 },
                ].map((p) => (
                  <button
                    key={p.n}
                    onClick={() => updateProp('strobeHz', p.v)}
                    className={`py-1.5 rounded text-[10px] font-bold transition ${
                      (effectiveState.strobeHz || 0) === p.v
                        ? 'bg-violet-500/30 border border-violet-400 text-violet-200'
                        : 'bg-[#141b2d] border border-[#22304f] text-slate-500 hover:border-violet-500/50 hover:text-violet-300'
                    }`}
                  >
                    {p.n}
                  </button>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="p-3">
      <button
        className="w-full flex items-center justify-between mb-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 text-slate-300 text-xs font-bold tracking-wider">
          {icon}
          {title}
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        )}
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  color,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color: string;
  step?: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
        <span
          className="text-xs font-mono font-bold"
          style={{ color }}
        >
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-black/60 border border-[#22304f]" />
        <div
          className="absolute h-1.5 rounded-full left-0"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute w-3.5 h-3.5 rounded-full border-2 bg-[#0c1120] shadow-md"
          style={{
            left: `calc(${pct}% - 7px)`,
            borderColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function ColorSlider({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return <Slider label={label} value={value} min={0} max={255} unit="" color={color} onChange={onChange} />;
}

function DialKnob({
  label,
  value,
  min,
  max,
  unit,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color: string;
  onChange: (v: number) => void;
}) {
  const size = 72;
  const strokeWidth = 5;
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r * 0.75;
  const angle = ((value - min) / (max - min)) * 270 - 135;
  const dash = circumference;
  const offset = dash - ((value - min) / (max - min)) * circumference;
  const nx = cx + (r - 8) * Math.cos((angle * Math.PI) / 180);
  const ny = cy + (r - 8) * Math.sin((angle * Math.PI) / 180);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#0c1120"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} 9999`}
            strokeDashoffset={-circumference * 0.125}
            strokeLinecap="round"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} 9999`}
            strokeDashoffset={offset - circumference * 0.125}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, #2a3041 0%, #141827 60%, #0a0d16 100%)`,
            margin: 12,
            border: `1px solid ${color}66`,
            boxShadow: `inset 0 2px 8px rgba(0,0,0,0.7)`,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: nx - 3,
            top: ny - 3,
            width: 6,
            height: 6,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
        />
      </div>
      <div className="flex-1">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-xl font-mono font-bold" style={{ color }}>
          {value >= 0 ? '+' : ''}
          {value.toFixed(0)}
          {unit}
        </div>
        <div className="flex gap-1 mt-1">
          {[-90, 0, 90].filter((v) => v >= min && v <= max).map((preset) => (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              className="text-[9px] px-1.5 py-0.5 rounded bg-[#141b2d] border border-[#22304f] text-slate-500 hover:text-slate-300 hover:border-slate-500 transition font-mono"
            >
              {preset}°
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function rgbToHex(v: number): string {
  return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase();
}
