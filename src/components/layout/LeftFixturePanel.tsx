import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { FIXTURE_IDS, FIXTURE_POSITIONS, FixtureId } from '../../types';
import { useLightingStore } from '../../store/useLightingStore';

export function LeftFixturePanel() {
  const selectedFixtureId = useLightingStore((s) => s.selectedFixtureId);
  const selectFixture = useLightingStore((s) => s.selectFixture);
  const previewState = useLightingStore((s) => s.previewState);
  const isBlackout = useLightingStore((s) => s.isBlackout);
  const activeShow = useLightingStore((s) => s.activeShow);

  return (
    <div className="w-[260px] h-full bg-[#0d121e] border-r border-[#1e2a45] flex flex-col overflow-hidden select-none">
      <div className="px-4 py-3 border-b border-[#1e2a45]">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h2
            className="text-sm font-bold tracking-wider text-slate-200"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            FIXTURE PATCH
          </h2>
        </div>
        <div className="mt-1 text-[10px] text-slate-500 font-mono">
          {FIXTURE_IDS.length} GROUPS / 8 UNITS
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {FIXTURE_IDS.map((fid) => {
          const state = previewState[fid];
          const pos = FIXTURE_POSITIONS[fid];
          const isSelected = selectedFixtureId === fid;
          const track = activeShow?.tracks.find((t) => t.fixtureId === fid);
          const kfCount = track?.keyframes.length || 0;
          const rgb = isBlackout
            ? 'rgb(0,0,0)'
            : `rgb(${state.colorR},${state.colorG},${state.colorB})`;
          const dimIntensity = isBlackout ? 0 : state.intensity;
          const isOn = dimIntensity > 1;

          return (
            <div
              key={fid}
              onClick={() => selectFixture(fid)}
              className={`relative rounded border p-3 cursor-pointer transition-all duration-150 group ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                  : 'border-[#22304f] bg-[#141b2d] hover:border-[#354977] hover:bg-[#18213a]'
              }`}
            >
              {isSelected && (
                <div className="absolute -left-px top-2 bottom-2 w-1 bg-amber-400 rounded-r shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              )}

              <div className="flex items-start gap-3">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-[#0c1120] border-[#22304f] text-slate-400'
                    }`}
                  >
                    {String(fid).padStart(2, '0')}
                  </div>
                  <div
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black/60 ${
                      isOn
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                        : 'bg-slate-700'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{pos.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      CH {(fid - 1) * 12 + 1}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded border border-white/20 shadow-inner"
                      style={{
                        backgroundColor: rgb,
                        boxShadow: isOn
                          ? `0 0 8px ${rgb}, inset 0 0 4px rgba(255,255,255,0.4)`
                          : 'none',
                        opacity: 0.3 + (dimIntensity / 100) * 0.7,
                      }}
                    />
                    <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-75"
                        style={{
                          width: `${dimIntensity}%`,
                          backgroundColor: rgb,
                          boxShadow: `0 0 4px ${rgb}`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono w-8 text-right">
                      {Math.round(dimIntensity)}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>
                      P{state.pan.toFixed(0)}° T{state.tilt.toFixed(0)}°
                    </span>
                    <span className={`${kfCount > 1 ? 'text-amber-400' : ''}`}>
                      ◆ {kfCount} KF
                    </span>
                  </div>
                </div>
              </div>

              {state.strobeHz > 0 && !isBlackout && (
                <div className="mt-2 px-2 py-0.5 inline-flex items-center gap-1 rounded bg-violet-500/20 border border-violet-500/50 text-violet-300 text-[10px] font-mono">
                  ⚡ STROBE {state.strobeHz}Hz
                </div>
              )}
            </div>
          );
        })}
      </div>

      <FixtureQuickStats />
    </div>
  );
}

function FixtureQuickStats() {
  return (
    <div className="border-t border-[#1e2a45] p-3 bg-[#0a0e17]">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">快速视角</div>
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        {[
          { n: '正面', c: 'text-cyan-400' },
          { n: '侧面', c: 'text-violet-400' },
          { n: '顶视', c: 'text-emerald-400' },
          { n: '全局', c: 'text-amber-400' },
        ].map((v) => (
          <button
            key={v.n}
            className={`px-2 py-1.5 rounded bg-[#141b2d] border border-[#22304f] hover:border-current transition ${v.c}`}
          >
            {v.n}
          </button>
        ))}
      </div>
    </div>
  );
}
