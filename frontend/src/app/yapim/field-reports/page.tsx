'use client';
import { useEffect, useState, useMemo } from 'react';
import { workSessionService } from '@/lib/services/workSessionService';
import { WorkSession } from '@/types';
import {
  ClipboardList, CheckCircle2, Clock, Users, Ruler, X, ChevronDown, RotateCcw, Activity, HardHat, Layers, Sparkles
} from 'lucide-react';

const STATUS_MAP = {
  COMPLETED: { label: 'Tamamlandı', dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]', badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  IN_PROGRESS: { label: 'Devam Ediyor', dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]', badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
};

const parseWorkType = (workType: string) => {
  if (!workType) return { category: 'İmalat', subType: '—' };
  
  if (workType.toLowerCase().includes('kutu')) {
    let subType = '—';
    if (workType.includes('CES200')) subType = 'CES200';
    else if (workType.includes('S700')) subType = 'S700';
    return { category: 'Servis Kutusu', subType };
  }

  if (workType.includes('PE63')) return { category: 'PE Ana Hat', subType: 'PE63' };
  if (workType.includes('PE125')) return { category: 'PE Ana Hat', subType: 'PE125' };
  if (workType.includes('ST4"')) return { category: 'ST Çelik Hat', subType: 'ST4"' };
  if (workType.includes('ST6"')) return { category: 'ST Çelik Hat', subType: 'ST6"' };
  if (workType.includes('ST8"')) return { category: 'ST Çelik Hat', subType: 'ST8"' };
  if (workType.includes('ST16"')) return { category: 'ST Çelik Hat', subType: 'ST16"' };
  if (workType.includes('PE32')) return { category: 'Servis Hattı', subType: 'PE32' };
  if (workType.includes('PE20')) return { category: 'Servis Hattı', subType: 'PE20' };

  if (workType === 'PE Ana Hat') return { category: 'PE Ana Hat', subType: 'PE Ana Hat' };
  if (workType === 'Servis Hattı') return { category: 'Servis Hattı', subType: 'PE32' };
  if (workType === 'ST Çelik Hat') return { category: 'ST Çelik Hat', subType: 'ST4"' };

  return { category: workType, subType: '—' };
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

  const pipeMeters = sessions
    .filter(s => !s.workType.toLowerCase().includes('kutu'))
    .reduce((acc, curr) => acc + (curr.quantityMeters || 0), 0);

  const installedBoxCount = sessions
    .filter(s => s.status === 'COMPLETED' && s.workType.toLowerCase().includes('kutu'))
    .reduce((acc, curr) => acc + (curr.quantityMeters || 0), 0);

  const activeTeams = new Set(sessions.map(s => s.teamId)).size;

  const hasActiveFilters = statusFilter !== 'ALL' || sectorFilter !== 'ALL' || workTypeFilter !== 'ALL';
  const activeFilterCount = (statusFilter !== 'ALL' ? 1 : 0) + (sectorFilter !== 'ALL' ? 1 : 0) + (workTypeFilter !== 'ALL' ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('ALL');
    setSectorFilter('ALL');
    setWorkTypeFilter('ALL');
  };

  const modernKpis = [
    {
      label: 'Takılan Kutu Sayısı',
      value: `${installedBoxCount} Adet`,
      sub: 'Tamamlanan Kutu Montajı',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15',
      iconBorder: 'border-emerald-500/30',
      glowBg: 'bg-emerald-500',
    },
    {
      label: 'Toplam Metraj',
      value: `${pipeMeters} m`,
      sub: 'Hat & Boru İmalatı',
      icon: Ruler,
      color: 'text-sky-400',
      iconBg: 'bg-sky-500/15',
      iconBorder: 'border-sky-500/30',
      glowBg: 'bg-sky-500',
    },
    {
      label: 'Aktif Ekip',
      value: `${activeTeams} Ekip`,
      sub: 'Sahadaki Ekipler',
      icon: Users,
      color: 'text-violet-400',
      iconBg: 'bg-violet-500/15',
      iconBorder: 'border-violet-500/30',
      glowBg: 'bg-violet-500',
    },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-slate-100 p-3 sm:p-4 md:p-5 overflow-hidden relative selection:bg-blue-500/30 selection:text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 min-h-0 space-y-3 max-w-[1600px] w-full mx-auto overflow-hidden">

        {/* ══ 1. CONTROL HUB HEADER (COMPACT FIT) ══════════════════════════ */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-xl px-4 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600" />
          
          <div className="flex items-center gap-3 pl-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10">
              <ClipboardList className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2 leading-none">
                  Saha Bildirimleri
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                </h1>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-blue-400" />
                    {activeFilterCount} Filtre
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Saha günlük çalışma, imalat ve ilerleme kayıtları takip merkezi</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Durum Filter */}
            <div className="relative flex-1 sm:flex-initial min-w-[130px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-200 hover:border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">Durum: Tümü</option>
                <option value="IN_PROGRESS" className="bg-slate-900 text-amber-300">Devam Ediyor</option>
                <option value="COMPLETED" className="bg-slate-900 text-emerald-300">Tamamlandı</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sektör Filter */}
            <div className="relative flex-1 sm:flex-initial min-w-[130px]">
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-200 hover:border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">Sektör: Tümü</option>
                {sectors.map((sec) => (
                  <option key={sec} value={sec} className="bg-slate-900 text-slate-200">{sec}</option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* İmalat Türü Filter */}
            <div className="relative flex-1 sm:flex-initial min-w-[140px]">
              <select
                value={workTypeFilter}
                onChange={(e) => setWorkTypeFilter(e.target.value)}
                className="w-full h-9 pl-3 pr-8 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-slate-200 hover:border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">İmalat: Tümü</option>
                {workTypes.map((wt) => (
                  <option key={wt} value={wt} className="bg-slate-900 text-slate-200">{wt}</option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-9 px-3.5 rounded-xl text-xs font-bold text-rose-300 border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Sıfırla</span>
              </button>
            )}
          </div>
        </div>

        {/* ══ 2. KPI CARDS STRIP (3 COLS) ═════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
          {modernKpis.map((k) => (
            <div
              key={k.label}
              className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/80 backdrop-blur-xl p-3.5 shadow-xl transition-all duration-300 hover:border-slate-600 group"
            >
              <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none ${k.glowBg}`} />

              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  {k.label}
                </span>
                <div className={`w-7.5 h-7.5 rounded-xl ${k.iconBg} border ${k.iconBorder} flex items-center justify-center shrink-0 shadow-sm`}>
                  <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <span className={`text-xl font-black ${k.color} tracking-tight leading-none`}>
                  {k.value}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-700/60">
                  {k.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ══ 3. TABLE CONTAINER (FULL WIDTH - VIEWPORT FIT FLEX-1) ═══════ */}
        <div className="flex-1 min-h-0 flex flex-col bg-gradient-to-b from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3.5 sm:p-4 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5 shrink-0">
            <h2 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              Saha İmalat Kayıtları
            </h2>
            <span className="text-xs font-semibold text-slate-400 bg-slate-800/60 px-2.5 py-0.5 rounded-lg border border-slate-700/50">
              Toplam <strong className="text-slate-200">{filteredSessions.length}</strong> Kayıt
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span className="text-xs font-medium">Bildirim verileri yükleniyor...</span>
            </div>
          ) : (
            <>
              {/* Desktop Table Container (Scrolls inside container) */}
              <div className="hidden md:block flex-1 overflow-y-auto min-h-0 relative mt-2">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-700/50">
                    <tr>
                      {['Tarih', 'İlçe', 'Ekip', 'İmalat', 'Tür', 'Başlangıç', 'Bitiş', 'Sonuç', 'Durum'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-slate-500 text-xs italic">
                          Seçilen kriterlere uygun saha bildirimi bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((session) => {
                        const st = STATUS_MAP[session.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.IN_PROGRESS;
                        const isBox = session.workType.toLowerCase().includes('kutu');
                        const info = parseWorkType(session.workType);
                        const districtName = session.district || session.sector || '—';
                        return (
                          <tr
                            key={session.id}
                            className="group hover:bg-slate-800/50 transition-all cursor-pointer"
                            onClick={() => setSelectedSession(session)}
                          >
                            <td className="px-4 py-2.5 text-slate-300 font-medium">{new Date(session.startDate).toLocaleDateString('tr-TR')}</td>
                            <td className="px-4 py-2.5 text-slate-200 font-semibold">{districtName}</td>
                            <td className="px-4 py-2.5 text-slate-100 font-bold flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                              {session.teamName}
                            </td>
                            <td className="px-4 py-2.5 text-slate-300 font-semibold">{info.category}</td>
                            <td className="px-4 py-2.5">
                              <span className="bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold px-2 py-0.5 rounded-md inline-block">
                                {info.subType}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-400">{session.startTime}</td>
                            <td className="px-4 py-2.5 text-slate-400">{session.endTime || '—'}</td>
                            <td className="px-4 py-2.5 font-extrabold text-emerald-400">
                              {session.quantityMeters
                                ? isBox
                                  ? `${session.quantityMeters} Kutu`
                                  : `${session.quantityMeters} m`
                                : '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold ${st.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards Container */}
              <div className="md:hidden flex-1 overflow-y-auto space-y-2.5 mt-2">
                {filteredSessions.map((session) => {
                  const st = STATUS_MAP[session.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.IN_PROGRESS;
                  const isBox = session.workType.toLowerCase().includes('kutu');
                  const info = parseWorkType(session.workType);
                  const districtName = session.district || session.sector || '—';
                  return (
                    <div
                      key={session.id}
                      className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 space-y-2 cursor-pointer hover:bg-slate-800/80 transition-all shadow-md"
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-blue-400" />
                          {session.teamName} <span className="text-slate-400 font-normal">({districtName})</span>
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${st.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/40">
                          <p className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wider font-bold">İmalat</p>
                          <p className="text-slate-200 font-semibold truncate">{info.category}</p>
                        </div>
                        <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/40">
                          <p className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wider font-bold">Tür</p>
                          <p className="text-blue-300 font-bold truncate">{info.subType}</p>
                        </div>
                        <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/40">
                          <p className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wider font-bold">Tarih</p>
                          <p className="text-slate-200 font-semibold">{new Date(session.startDate).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/40">
                          <p className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wider font-bold">Sonuç</p>
                          <p className="text-emerald-400 font-extrabold">
                            {session.quantityMeters
                              ? isBox
                                ? `${session.quantityMeters} Kutu`
                                : `${session.quantityMeters} m`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Modern Detail Modal Dialog */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedSession(null)} />
          <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/70 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-700/50">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-400" />
                  Saha Çalışması Detayı
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedSession.teamName} bildirimi</p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const info = parseWorkType(selectedSession.workType);
                return [
                  { label: 'İlçe', value: selectedSession.district || selectedSession.sector || '—', icon: null },
                  { label: 'Ekip', value: selectedSession.teamName, icon: <Users className="h-3.5 w-3.5 text-blue-400" /> },
                  { label: 'İmalat', value: info.category, icon: <HardHat className="h-3.5 w-3.5 text-amber-400" /> },
                  { label: 'Tür', value: info.subType, icon: <Layers className="h-3.5 w-3.5 text-blue-400" /> },
                  {
                    label: 'Durum',
                    value: selectedSession.status === 'COMPLETED' ? 'Tamamlandı' : 'Devam Ediyor',
                    icon: selectedSession.status === 'COMPLETED' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Clock className="h-3.5 w-3.5 text-amber-400" />,
                    color: selectedSession.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400',
                  },
                  { label: 'Başlangıç', value: `${new Date(selectedSession.startDate).toLocaleDateString('tr-TR')} ${selectedSession.startTime}`, icon: null },
                  { label: 'Bitiş', value: selectedSession.endDate ? `${new Date(selectedSession.endDate).toLocaleDateString('tr-TR')} ${selectedSession.endTime}` : 'Devam ediyor', icon: null },
                ];
              })().map((item) => (
                <div key={item.label} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5 font-medium">{item.icon}{item.label}</p>
                  <p className={`text-xs font-bold ${(item as { color?: string }).color ?? 'text-slate-100'}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Result highlight */}
            {selectedSession.quantityMeters && (
              <div className="bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Ruler className="h-4 w-4" />
                  <span className="text-xs font-bold">
                    {selectedSession.workType.toLowerCase().includes('kutu') ? 'Tamamlanan Kutu Montajı' : 'Toplam İmalat Metrajı'}
                  </span>
                </div>
                <span className="text-xl font-black text-emerald-300">
                  {selectedSession.quantityMeters}{' '}
                  <span className="text-xs font-normal text-emerald-400">
                    {selectedSession.workType.toLowerCase().includes('kutu') ? 'Kutu' : 'm'}
                  </span>
                </span>
              </div>
            )}

            <button
              onClick={() => setSelectedSession(null)}
              className="w-full py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
