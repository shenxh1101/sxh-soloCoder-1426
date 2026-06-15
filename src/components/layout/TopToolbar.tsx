import { useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Plus,
  FolderUp,
  FolderDown,
  Music,
  Download,
  ZapOff,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useLightingStore } from '../../store/useLightingStore';
import { formatTimeCode } from '../../hooks/usePlaybackEngine';

export function TopToolbar() {
  const activeShow = useLightingStore((s) => s.activeShow);
  const isPlaying = useLightingStore((s) => s.isPlaying);
  const currentTime = useLightingStore((s) => s.currentTime);
  const isBlackout = useLightingStore((s) => s.isBlackout);
  const playbackSpeed = useLightingStore((s) => s.playbackSpeed);

  const play = useLightingStore((s) => s.play);
  const pause = useLightingStore((s) => s.pause);
  const stop = useLightingStore((s) => s.stop);
  const createShow = useLightingStore((s) => s.createShow);
  const openBeatModal = useLightingStore((s) => s.openBeatModal);
  const openManagerModal = useLightingStore((s) => s.openManagerModal);
  const toggleBlackout = useLightingStore((s) => s.toggleBlackout);
  const setPlaybackSpeed = useLightingStore((s) => s.setPlaybackSpeed);
  const exportDMX = useLightingStore((s) => s.exportDMX);
  const activeShowId = useLightingStore((s) => s.activeShowId);
  const saveShowToFile = useLightingStore((s) => s.saveShowToFile);
  const loadShowFromFile = useLightingStore((s) => s.loadShowFromFile);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-12 bg-[#0d121e] border-b border-[#1e2a45] flex items-center px-4 gap-4 relative z-50 select-none">
      <div className="flex items-center gap-2 pr-4 border-r border-[#1e2a45]">
        <Sparkles className="w-6 h-6 text-amber-400" />
        <span
          className="text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          STAGE LIGHT STUDIO
        </span>
      </div>

      <div className="flex items-center gap-2 min-w-[200px]">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mr-1">方案</div>
        <div className="px-3 py-1 bg-[#141b2d] border border-[#22304f] rounded text-sm text-amber-300 font-mono max-w-[220px] truncate">
          {activeShow?.name || '无'}
        </div>
        <button
          onClick={() => createShow()}
          className="p-1.5 rounded bg-[#141b2d] border border-[#22304f] text-slate-300 hover:text-amber-400 hover:border-amber-500 transition"
          title="新建方案"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => openManagerModal()}
          className="p-1.5 rounded bg-[#141b2d] border border-[#22304f] text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition"
          title="方案管理"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 px-3 border-l border-r border-[#1e2a45] h-full">
        <ToolButton
          onClick={() => openBeatModal()}
          icon={<Music className="w-4 h-4" />}
          label="音乐节拍"
          color="purple"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) {
              useLightingStore.getState().setPendingAudioFile(f);
              openBeatModal();
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
        <ToolButton
          onClick={() => jsonInputRef.current?.click()}
          icon={<FolderUp className="w-4 h-4" />}
          label="导入方案"
          color="cyan"
        />
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json,.lighting.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await loadShowFromFile(f);
            if (jsonInputRef.current) jsonInputRef.current.value = '';
          }}
        />
        <ToolButton
          onClick={() => activeShowId && saveShowToFile(activeShowId)}
          icon={<FolderDown className="w-4 h-4" />}
          label="保存JSON"
          color="green"
        />
        <ToolButton
          onClick={() => activeShowId && exportDMX(activeShowId)}
          icon={<Download className="w-4 h-4" />}
          label="导出DMX"
          color="blue"
        />
        <ToolButton
          onClick={toggleBlackout}
          icon={<ZapOff className="w-4 h-4" />}
          label="黑场"
          color={isBlackout ? 'redActive' : 'red'}
        />
      </div>

      <div className="flex-1 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1 bg-[#141b2d] rounded border border-[#22304f] p-1">
          <button
            onClick={stop}
            className="p-2 rounded hover:bg-[#1e2a45] text-slate-300 transition"
            title="停止"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={isPlaying ? pause : play}
            className={`p-2 rounded transition ${
              isPlaying
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-emerald-500 text-black hover:bg-emerald-400'
            }`}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
        </div>

        <div className="flex items-center gap-1 text-xs">
          {[0.25, 0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setPlaybackSpeed(s)}
              className={`px-2 py-1 rounded border transition font-mono ${
                playbackSpeed === s
                  ? 'bg-amber-500 border-amber-400 text-black'
                  : 'bg-[#141b2d] border-[#22304f] text-slate-400 hover:text-amber-300 hover:border-amber-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div
          className="px-5 py-1.5 bg-black/60 border border-[#2a3a5f] rounded text-emerald-400 font-mono text-lg tracking-widest shadow-inner shadow-emerald-900/30"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="text-slate-500 text-xs mr-2">TC</span>
          {formatTimeCode(currentTime)}
          <span className="text-slate-600 text-xs ml-2">/ {activeShow?.duration.toFixed(0)}s</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pr-2">
        <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          {isPlaying ? 'LIVE' : 'IDLE'}
        </span>
        {isBlackout && (
          <div className="ml-2 px-2 py-0.5 bg-red-500/20 border border-red-500 rounded text-red-400 text-xs font-bold animate-pulse">
            BLACKOUT
          </div>
        )}
      </div>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: 'red' | 'redActive' | 'cyan' | 'green' | 'blue' | 'purple';
}) {
  const colorClass: Record<string, string> = {
    red: 'text-red-400 hover:bg-red-500/10 hover:border-red-500/60 border-red-500/30',
    redActive:
      'text-white bg-red-500/40 border-red-500 animate-pulse',
    cyan: 'text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/60 border-cyan-500/30',
    green: 'text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60 border-emerald-500/30',
    blue: 'text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/60 border-blue-500/30',
    purple: 'text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/60 border-violet-500/30',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs transition ${colorClass[color]}`}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
