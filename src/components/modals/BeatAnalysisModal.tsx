import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Music, CheckCircle2, Loader2, Wand2, AlertCircle } from 'lucide-react';
import { BeatAnalysisResult, analyzeAudioFile } from '../../utils/beatAnalyzer';
import { useLightingStore } from '../../store/useLightingStore';
import { FixtureId, FIXTURE_IDS } from '../../types';
import { formatTimeCode } from '../../hooks/usePlaybackEngine';

export function BeatAnalysisModal() {
  const show = useLightingStore((s) => s.showBeatModal);
  const close = useLightingStore((s) => s.closeBeatModal);
  const pendingFile = useLightingStore((s) => s.pendingAudioFile);
  const setPending = useLightingStore((s) => s.setPendingAudioFile);
  const applyStrobes = useLightingStore((s) => s.applyStrobeKeyframesFromBeats);
  const attachAudioTrack = useLightingStore((s) => s.attachAudioTrack);
  const runAnalysis = useLightingStore((s) => s.runBeatAnalysis);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<BeatAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFixtures, setSelectedFixtures] = useState<Set<FixtureId>>(
    new Set(FIXTURE_IDS),
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingFile && !result && !analyzing) {
      runAnalyze(pendingFile);
    }
  }, [pendingFile, show]);

  useEffect(() => {
    if (show) {
      setResult(null);
      setError(null);
    }
  }, [show]);

  useEffect(() => {
    if (!result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
    const H = canvas.height = 160 * (window.devicePixelRatio || 1);
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    const cw = canvas.clientWidth;
    const ch = 160;

    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, cw, ch);

    ctx.strokeStyle = '#1e2a45';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (ch / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    const wave = result.waveformData;
    if (wave.length > 0) {
      const max = Math.max(...wave, 1e-6);
      ctx.beginPath();
      ctx.moveTo(0, ch / 2);
      for (let i = 0; i < wave.length; i++) {
        const x = (i / (wave.length - 1)) * cw;
        const v = wave[i] / max;
        ctx.lineTo(x, ch / 2 - v * (ch / 2 - 4));
      }
      for (let i = wave.length - 1; i >= 0; i--) {
        const x = (i / (wave.length - 1)) * cw;
        const v = wave[i] / max;
        ctx.lineTo(x, ch / 2 + v * (ch / 2 - 4));
      }
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.35)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.45)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const dur = result.duration;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    for (const b of result.beats) {
      const x = (b / dur) * cw;
      ctx.fillRect(x - 1.5, 6, 3, ch - 12);
    }
    ctx.fillStyle = '#fbbf24';
    for (const b of result.beats) {
      const x = (b / dur) * cw;
      ctx.beginPath();
      ctx.arc(x, 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const gradLine = ctx.createLinearGradient(0, 0, cw, 0);
    gradLine.addColorStop(0, 'transparent');
    gradLine.addColorStop(0.5, 'rgba(255, 61, 87, 0.8)');
    gradLine.addColorStop(1, 'transparent');
    ctx.fillStyle = gradLine;
    ctx.fillRect(0, ch / 2 - 0.5, cw, 1);
  }, [result]);

  async function runAnalyze(file: File) {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeAudioFile(file);
      setResult(res);
      runAnalysis(file).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : '音频分析失败');
    } finally {
      setAnalyzing(false);
    }
  }

  function toggleFixture(fid: FixtureId) {
    const next = new Set(selectedFixtures);
    if (next.has(fid)) next.delete(fid);
    else next.add(fid);
    setSelectedFixtures(next);
  }

  function confirm() {
    if (!result) return;
    const ids = Array.from(selectedFixtures) as FixtureId[];
    applyStrobes(result.beats, ids);
    if (pendingFile) attachAudioTrack(pendingFile.name, result.duration, result.beats, result.bpm);
    close();
  }

  const beatsInfo = useMemo(() => {
    if (!result) return null;
    const first = result.beats[0] || 0;
    const last = result.beats[result.beats.length - 1] || 0;
    return {
      count: result.beats.length,
      first: formatTimeCode(first),
      last: formatTimeCode(last),
    };
  }, [result]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#0d121e] border border-[#22304f] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2a45] bg-gradient-to-r from-violet-900/40 via-transparent to-cyan-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-slate-100 tracking-wide"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                音乐节拍分析
              </h2>
              <p className="text-xs text-slate-400">自动检测节拍并生成频闪关键帧</p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-sm hover:from-violet-500 hover:to-cyan-500 transition shadow-lg shadow-violet-500/20 disabled:opacity-60 flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 正在分析...
                </>
              ) : (
                <>
                  <Music className="w-4 h-4" /> 选择MP3文件
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPending(f);
                  runAnalyze(f);
                }
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            {pendingFile && (
              <div className="px-3 py-1.5 rounded bg-[#141b2d] border border-[#22304f] text-xs font-mono text-slate-300">
                📁 {pendingFile.name} ({(pendingFile.size / 1024 / 1024).toFixed(1)}MB)
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold">分析失败</div>
                <div className="opacity-80 mt-1">{error}</div>
              </div>
            </div>
          )}

          <div className="relative rounded-lg overflow-hidden border border-[#22304f] bg-[#05070d]">
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: 160, display: 'block' }}
            />
            {!result && !analyzing && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                上传音频文件后显示波形与节拍标记
              </div>
            )}
            {analyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-violet-300">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-mono text-sm">正在进行频率分析... 检测节拍中</span>
                </div>
              </div>
            )}
          </div>

          {result && beatsInfo && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <StatCard label="BPM 节拍速度" value={result.bpm.toString()} accent="text-amber-400" icon="♩=" />
                <StatCard label="总时长" value={formatTimeCode(result.duration).slice(0, 8)} accent="text-cyan-400" icon="⏱" />
                <StatCard label="节拍数" value={beatsInfo.count.toString()} accent="text-violet-400" icon="◆" />
                <StatCard label="首拍/末拍" value={`${beatsInfo.first.slice(3)} ~ ${beatsInfo.last.slice(3)}`} accent="text-emerald-400" icon="⇄" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    应用频闪到灯具组（{selectedFixtures.size}/8）
                  </div>
                  <div className="flex gap-1.5 text-[10px]">
                    <button
                      onClick={() => setSelectedFixtures(new Set(FIXTURE_IDS))}
                      className="px-2 py-1 rounded bg-[#141b2d] border border-[#22304f] text-slate-400 hover:text-amber-400 hover:border-amber-500 transition"
                    >
                      全选
                    </button>
                    <button
                      onClick={() => setSelectedFixtures(new Set())}
                      className="px-2 py-1 rounded bg-[#141b2d] border border-[#22304f] text-slate-400 hover:text-cyan-400 hover:border-cyan-500 transition"
                    >
                      清空
                    </button>
                    <button
                      onClick={() => setSelectedFixtures(new Set([1, 2, 3, 4] as FixtureId[]))}
                      className="px-2 py-1 rounded bg-[#141b2d] border border-[#22304f] text-slate-400 hover:text-violet-400 hover:border-violet-500 transition"
                    >
                      前排
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {FIXTURE_IDS.map((fid) => {
                    const on = selectedFixtures.has(fid);
                    return (
                      <button
                        key={fid}
                        onClick={() => toggleFixture(fid)}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center font-bold transition-all ${
                          on
                            ? 'bg-gradient-to-br from-amber-500/30 to-violet-500/30 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/20'
                            : 'bg-[#141b2d] border-[#22304f] text-slate-500 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-xl">{String(fid).padStart(2, '0')}</div>
                        <div className="text-[8px] mt-0.5 opacity-70">#{fid}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1e2a45] bg-[#0a0e17]">
          <button
            onClick={close}
            className="px-5 py-2 rounded-lg bg-[#141b2d] border border-[#22304f] text-slate-300 hover:text-white hover:border-slate-500 transition text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={confirm}
            disabled={!result || selectedFixtures.size === 0}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition shadow-lg shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            确认生成频闪关键帧
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: string;
  icon: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-[#141b2d] border border-[#22304f]">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
        <span>{icon}</span>
        {label}
      </div>
      <div className={`text-xl font-mono font-bold ${accent}`}>{value}</div>
    </div>
  );
}
