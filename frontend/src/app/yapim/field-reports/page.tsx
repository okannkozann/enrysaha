'use client';
import { useEffect, useState, useMemo } from 'react';
import { workSessionService } from '@/lib/services/workSessionService';
import { WorkSession } from '@/types';
import { ClipboardList, CheckCircle2, Clock, Users, Ruler, X, FilterX, SlidersHorizontal } from 'lucide-react';

const STATUS_MAP = {
  COMPLETED: { label: 'Tamamlandı', dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]', badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  IN_PROGRESS: { label: 'Devam Ediyor', dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]', badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
};

export default function FieldReportsPage() {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<WorkSession | null>(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    async function loadData() {
      const data = await workSessionService.getWorkSessions();
      setSessions(data);
      setLoading(false);
    }
    loadData();
  }, []);

  // Filter lists
  const sectors = useMemo(() => {
    return Array.from(new Set(sessions.map((s) => s.sector).filter(Boolean))).sort();
  }, [sessions]);

  const workTypes = useMemo(() => {
    return Array.from(new Set(sessions.map((s) => s.workType).filter(Boolean))).sort();
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (sectorFilter !== 'ALL' && s.sector !== sectorFilter) return false;
      if (workTypeFilter !== 'ALL' && s.workType !== workTypeFilter) return false;
      return true;
    });
  }, [sessions, statusFilter, sectorFilter, workTypeFilter]);

  const activeCount = sessions.filter(s => s.status === 'IN_PROGRESS').length;
  const completedCount = sessions.filter(s => s.status === 'COMPLETED').length;
  const totalMeters = sessions.reduce((acc, curr) => acc + (curr.quantityMeters || 0), 0);
  const activeTeams = new Set(sessions.map(s => s.teamId)).size;

  const hasActiveFilters = statusFilter !== 'ALL' || sectorFilter !== 'ALL' || workTypeFilter !== 'ALL';

  const clearFilters = () => {
    setStatusFilter('ALL');
    setSectorFilter('ALL');
    setWorkTypeFilter('ALL');
  };

  const kpis = [
    { label: 'Aktif İşler', value: activeCount, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { label: 'Tamamlanan', value: completedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { label: 'Top. İmalat', value: `${totalMeters} m`, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
    { label: 'Aktif Ekip', value: activeTeams, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
    { label: 'Bildirim', value: sessions.length, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 p-3 sm:p-4 overflow-hidden space-y-2.5 relative">
      {/* Ambient decorative lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-600/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 h-full min-h-0 space-y-2.5 max-w-[1600px] w-full mx-auto overflow-hidden">

        {/* ══ 1. HEADER & COMPACT FILTER DROPDOWNS ══════════════════════ */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-lg px-3.5 py-2 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <ClipboardList className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-slate-100 tracking-tight leading-none">Saha Bildirimleri</h1>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Günlük çalışma ve imalat akışı</p>
            </div>
          </div>

          {/* Compact Dropdown Select Filters */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2 py-0.5">
              <SlidersHorizontal className="h-3 w-3 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-[11px] font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">Durum: Tümü</option>
                <option value="IN_PROGRESS" className="bg-slate-900 text-amber-300">Devam Ediyor</option>
                <option value="COMPLETED" className="bg-slate-900 text-emerald-300">Tamamlandı</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2 py-0.5">
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-[11px] font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">Sektör: Tümü</option>
                {sectors.map((sec) => (
                  <option key={sec} value={sec} className="bg-slate-900 text-slate-200">{sec}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2 py-0.5">
              <select
                value={workTypeFilter}
                onChange={(e) => setWorkTypeFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-[11px] font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">İmalat: Tümü</option>
                {workTypes.map((wt) => (
                  <option key={wt} value={wt} className="bg-slate-900 text-slate-200">{wt}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-rose-400 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all"
                title="Filtreleri Temizle"
              >
                <FilterX className="h-3 w-3" />
                Temizle
              </button>
            )}
          </div>
        </div>

        {/* ══ 2. KPI CARDS STRIP ═════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 shrink-0">
          {kpis.map((k) => (
            <div key={k.label} className={`${k.bg} backdrop-blur-xl border ${k.border} rounded-xl px-3 py-1.5 flex items-center justify-between`}>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
                <p className={`text-base font-black ${k.color} leading-none mt-0.5`}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ══ 3. MAIN GRID ══════════════════════════════════════════════ */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0 overflow-hidden">

          {/* Left Column: Table (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden min-h-0">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  <span className="text-xs">Bildirimler yükleniyor...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table Container */}
                <div className="hidden md:block flex-1 overflow-y-auto min-h-0 relative">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-700/50">
                      <tr>
                        {['Tarih', 'Ekip', 'Sektör', 'İmalat Türü', 'Başlangıç', 'Bitiş', 'Metraj', 'Durum'].map(h => (
                          <th key={h} className="px-3.5 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredSessions.length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Kriterlere uygun bildirim bulunamadı.</td></tr>
                      ) : filteredSessions.map((session) => {
                        const st = STATUS_MAP[session.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.IN_PROGRESS;
                        return (
                          <tr
                            key={session.id}
                            className="group hover:bg-slate-800/40 transition-colors cursor-pointer"
                            onClick={() => setSelectedSession(session)}
                          >
                            <td className="px-3.5 py-2 text-slate-300 font-medium">{new Date(session.startDate).toLocaleDateString('tr-TR')}</td>
                            <td className="px-3.5 py-2 text-slate-200 font-semibold">{session.teamName}</td>
                            <td className="px-3.5 py-2 text-slate-300">{session.sector}</td>
                            <td className="px-3.5 py-2 text-slate-400">{session.workType}</td>
                            <td className="px-3.5 py-2 text-slate-400">{session.startTime}</td>
                            <td className="px-3.5 py-2 text-slate-400">{session.endTime || '—'}</td>
                            <td className="px-3.5 py-2 text-right">
                              {session.quantityMeters
                                ? <span className="font-bold text-slate-200">{session.quantityMeters} <span className="text-[10px] font-normal text-slate-500">m</span></span>
                                : <span className="text-slate-600">—</span>}
                            </td>
                            <td className="px-3.5 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${st.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards Container */}
                <div className="md:hidden flex-1 overflow-y-auto divide-y divide-slate-800/60">
                  {filteredSessions.map((session) => {
                    const st = STATUS_MAP[session.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.IN_PROGRESS;
                    return (
                      <div key={session.id} className="p-2.5 space-y-1.5" onClick={() => setSelectedSession(session)}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 text-xs">{session.teamName}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${st.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <div className="bg-slate-800/50 rounded-lg p-1.5">
                            <p className="text-slate-500 text-[9px] mb-0.5">Sektör</p>
                            <p className="text-slate-300 font-medium truncate">{session.sector}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-1.5">
                            <p className="text-slate-500 text-[9px] mb-0.5">İmalat Türü</p>
                            <p className="text-slate-300 font-medium truncate">{session.workType}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-1.5">
                            <p className="text-slate-500 text-[9px] mb-0.5">Tarih</p>
                            <p className="text-slate-300 font-medium">{new Date(session.startDate).toLocaleDateString('tr-TR')}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-1.5">
                            <p className="text-slate-500 text-[9px] mb-0.5">Metraj</p>
                            <p className="text-sky-400 font-bold">{session.quantityMeters ? `${session.quantityMeters} m` : '—'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right Column: Timeline Sidebar (1 Col) */}
          <div className="lg:col-span-1 flex flex-col bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-3.5 overflow-hidden min-h-0">
            <h2 className="text-xs font-bold text-slate-200 pb-2 mb-2.5 border-b border-slate-700/50 shrink-0">Bugünkü Saha İlerlemesi</h2>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
              {filteredSessions.length === 0 ? (
                <p className="text-xs text-slate-500">Henüz bildirim yok.</p>
              ) : [...filteredSessions].sort((a, b) => b.startTime.localeCompare(a.startTime)).map((s, idx) => (
                <div key={`${s.id}-${idx}`} className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'COMPLETED' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'}`} />
                    {idx !== filteredSessions.length - 1 && <div className="w-px flex-1 bg-slate-700/60 my-1" />}
                  </div>
                  <div className="pb-1.5 min-w-0">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">{s.status === 'COMPLETED' ? s.endTime : s.startTime}</div>
                    <div className="text-[11px] font-semibold text-slate-200 truncate">{s.teamName}</div>
                    <div className="text-[9px] text-slate-400">{s.status === 'COMPLETED' ? 'tamamlandı' : 'başladı'}{s.quantityMeters ? ` · ${s.quantityMeters} m` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Detail Panel (slide-in) */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSession(null)} />
          <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md p-4 space-y-3 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Saha Çalışması Detayı</h2>
                <p className="text-xs text-slate-400">{selectedSession.teamName} bildirimi</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors">
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Ekip', value: selectedSession.teamName, icon: <Users className="h-3 w-3" /> },
                { label: 'Sektör', value: selectedSession.sector, icon: <ClipboardList className="h-3 w-3" /> },
                { label: 'İmalat Türü', value: selectedSession.workType, icon: null },
                { label: 'Durum', value: selectedSession.status === 'COMPLETED' ? 'Tamamlandı' : 'Devam Ediyor', icon: selectedSession.status === 'COMPLETED' ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Clock className="h-3 w-3 text-amber-400" />, color: selectedSession.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400' },
                { label: 'Başlangıç', value: `${new Date(selectedSession.startDate).toLocaleDateString('tr-TR')} ${selectedSession.startTime}`, icon: null },
                { label: 'Bitiş', value: selectedSession.endDate ? `${new Date(selectedSession.endDate).toLocaleDateString('tr-TR')} ${selectedSession.endTime}` : 'Devam ediyor', icon: null },
              ].map((item) => (
                <div key={item.label} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-2">
                  <p className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">{item.icon}{item.label}</p>
                  <p className={`text-xs font-semibold ${(item as {color?: string}).color ?? 'text-slate-200'}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Metraj highlight */}
            {selectedSession.quantityMeters && (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-400">
                  <Ruler className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">Toplam Metraj</span>
                </div>
                <span className="text-lg font-extrabold text-sky-300">{selectedSession.quantityMeters} <span className="text-xs font-normal text-sky-400">m</span></span>
              </div>
            )}

            <button
              onClick={() => setSelectedSession(null)}
              className="w-full py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



