import { useRef, useState } from 'react';
import {
  X,
  Layers,
  Copy,
  Trash2,
  Edit3,
  Check,
  Play,
  Plus,
  Download,
  Upload,
} from 'lucide-react';
import { LightShow } from '../../types';
import { useLightingStore } from '../../store/useLightingStore';

export function ShowManagerModal() {
  const show = useLightingStore((s) => s.showManagerModal);
  const close = useLightingStore((s) => s.closeManagerModal);
  const shows = useLightingStore((s) => s.shows);
  const activeShowId = useLightingStore((s) => s.activeShowId);
  const compareShowId = useLightingStore((s) => s.compareShowId);

  const createShow = useLightingStore((s) => s.createShow);
  const duplicateShow = useLightingStore((s) => s.duplicateShow);
  const deleteShow = useLightingStore((s) => s.deleteShow);
  const renameShow = useLightingStore((s) => s.renameShow);
  const switchShow = useLightingStore((s) => s.switchShow);
  const setCompareShow = useLightingStore((s) => s.setCompareShow);
  const saveShowToFile = useLightingStore((s) => s.saveShowToFile);
  const loadShowFromFile = useLightingStore((s) => s.loadShowFromFile);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!show) return null;

  function startEdit(s: LightShow) {
    setEditingId(s.id);
    setEditingName(s.name);
  }
  function commitEdit() {
    if (editingId && editingName.trim()) renameShow(editingId, editingName.trim());
    setEditingId(null);
  }

  function formatDate(ts: number): string {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function totalKeyframes(s: LightShow): number {
    return s.tracks.reduce((sum, t) => sum + t.keyframes.length, 0);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[88vh] bg-[#0d121e] border border-[#22304f] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2a45] bg-gradient-to-r from-cyan-900/30 via-transparent to-amber-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-slate-100 tracking-wide"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                方案管理器
              </h2>
              <p className="text-xs text-slate-400">创建、复制、切换灯光秀方案 · 共 {shows.length} 个方案</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,.lighting.json';
                input.onchange = async () => {
                  const f = input.files?.[0];
                  if (f) await loadShowFromFile(f);
                };
                input.click();
              }}
              className="px-3 py-2 rounded-lg bg-[#141b2d] border border-[#22304f] text-cyan-400 hover:border-cyan-500 flex items-center gap-1.5 text-sm transition"
            >
              <Upload className="w-4 h-4" /> 导入
            </button>
            <button
              onClick={() => createShow()}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-medium hover:from-cyan-500 hover:to-emerald-500 flex items-center gap-1.5 text-sm transition shadow shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" /> 新建
            </button>
            <button
              onClick={close}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {shows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Layers className="w-16 h-16 mb-4 opacity-20" />
              <p>暂无方案，点击"新建"创建第一个灯光秀方案</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {shows.map((s) => {
                const isActive = s.id === activeShowId;
                const isCompare = s.id === compareShowId;
                return (
                  <div
                    key={s.id}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all group ${
                      isActive
                        ? 'border-amber-400 shadow-2xl shadow-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent'
                        : isCompare
                          ? 'border-cyan-400 shadow-lg shadow-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent'
                          : 'border-[#22304f] bg-[#141b2d] hover:border-slate-500'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold flex items-center gap-1 shadow-lg">
                        <Play className="w-3 h-3" /> 正在编辑
                      </div>
                    )}
                    {isCompare && (
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-cyan-500 text-black text-[10px] font-bold shadow-lg">
                        对比中
                      </div>
                    )}

                    <div className="aspect-video bg-[#05070d] relative overflow-hidden border-b border-[#22304f]">
                      {s.thumbnailDataUrl ? (
                        <img
                          src={s.thumbnailDataUrl}
                          alt={s.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="grid grid-cols-4 gap-1.5 opacity-30">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <div
                                key={i}
                                className="w-5 h-5 rounded-full"
                                style={{
                                  background: `hsl(${i * 40},80%,55%)`,
                                  boxShadow: `0 0 8px hsl(${i * 40},80%,55%)`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                        <div className="text-[10px] font-mono text-slate-400">
                          ◆ {totalKeyframes(s)} KF · {s.duration}s
                          {s.audioTrack && ` · ♫ ${s.audioTrack.bpm}BPM`}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 space-y-3">
                      {editingId === s.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                            onBlur={commitEdit}
                            className="flex-1 px-2 py-1 rounded bg-black/40 border border-amber-500 text-sm text-amber-300 focus:outline-none font-mono"
                          />
                          <button
                            onClick={commitEdit}
                            className="p-1 rounded bg-amber-500 text-black"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={`font-bold text-sm truncate ${
                              isActive ? 'text-amber-300' : 'text-slate-200'
                            }`}
                          >
                            {s.name}
                          </div>
                          <button
                            onClick={() => startEdit(s)}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-400 hover:bg-white/5 transition"
                            title="重命名"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="text-[10px] font-mono text-slate-500 grid grid-cols-2 gap-1">
                        <div>创建: {formatDate(s.createdAt)}</div>
                        <div>更新: {formatDate(s.updatedAt)}</div>
                      </div>

                      {s.description && (
                        <div className="text-[11px] text-slate-400 line-clamp-2 p-2 rounded bg-black/30 border border-[#22304f]">
                          {s.description}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-1">
                        {!isActive && (
                          <button
                            onClick={() => {
                              switchShow(s.id);
                              close();
                            }}
                            className="flex-1 px-2 py-1.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold hover:from-amber-400 hover:to-orange-400 transition shadow shadow-amber-500/20 flex items-center justify-center gap-1"
                          >
                            <Play className="w-3 h-3" /> 切换
                          </button>
                        )}
                        <button
                          onClick={() => duplicateShow(s.id)}
                          className="p-1.5 rounded bg-[#0a0e17] border border-[#22304f] text-cyan-400 hover:border-cyan-500 transition"
                          title="复制方案"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => saveShowToFile(s.id)}
                          className="p-1.5 rounded bg-[#0a0e17] border border-[#22304f] text-emerald-400 hover:border-emerald-500 transition"
                          title="导出JSON"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {!isCompare && shows.length > 1 && (
                          <button
                            onClick={() => setCompareShow(isCompare ? null : s.id)}
                            className={`text-[10px] px-2 py-1.5 rounded font-medium transition ${
                              isCompare
                                ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                                : 'bg-[#0a0e17] border border-[#22304f] text-slate-400 hover:text-violet-400 hover:border-violet-500'
                            }`}
                            title="对比方案"
                          >
                            对比
                          </button>
                        )}
                        {shows.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`确定删除方案 "${s.name}" 吗？`)) deleteShow(s.id);
                            }}
                            className="p-1.5 rounded bg-[#0a0e17] border border-[#22304f] text-red-400 hover:border-red-500 hover:bg-red-500/10 transition"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#1e2a45] bg-[#0a0e17] text-[11px] text-slate-500 flex items-center justify-between">
          <span>💡 小提示：方案数据自动保存在浏览器 localStorage 中，定期导出 JSON 备份以防丢失</span>
          <button
            onClick={close}
            className="px-4 py-1.5 rounded bg-[#141b2d] border border-[#22304f] text-slate-300 hover:text-white hover:border-slate-500 transition text-xs"
          >
            关闭
          </button>
        </div>
      </div>
      <input ref={(r) => (jsonInputRef[1] = r)} type="file" className="hidden" />
    </div>
  );
}
