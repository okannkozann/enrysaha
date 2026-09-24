'use client';
import { useEffect, useState } from 'react';
import { workSessionService } from '@/lib/services/workSessionService';
import { WorkSession } from '@/types';
import { ClipboardList, CheckCircle2, Clock, Users, Ruler, X } from 'lucide-react';

const STATUS_MAP = {
  COMPLETED: { label: 'Tamamlandı', dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]', badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  IN_PROGRESS: { label: 'Devam Ediyor', dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]', badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
};

export default function FieldReportsPage() {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<WorkSession | null>(null);

  useEffect(() => {
    async function loadData() {
      const data = await workSessionService.getWorkSessions();
      setSessions(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const activeCount = sessions.filter(s => s.status === 'IN_PROGRESS').length;
  const completedCount = sessions.filter(s => s.status === 'COMPLETED').length;
  const totalMeters = sessions.reduce((acc, curr) => acc + (curr.quantityMeters || 0), 0);
  const activeTeams = new Set(sessions.map(s => s.teamId)).size;

  const kpis = [
    { label: 'Aktif İşler', value: activeCount, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { label: 'Tamamlanan', value: completedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { label: 'Top. İmalat', value: `${totalMeters} m`, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
    { label: 'Aktif Ekip', value: activeTeams, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
    { label: 'Bildirim', value: sessions.length, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-600/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">Saha Bildirimleri</h1>
              <p className="text-xs text-slate-400 mt-0.5">Saha ekiplerinin günlük çalışma ve imalat bildirimleri</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-1.5 shrink-0">
            Son güncelleme: {new Date().toLocaleString('tr-TR')}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className={`${k.bg} backdrop-blur-xl border ${k.border} rounded-2xl p-3.5`}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{k.label}</p>
              <p className={`text-xl font-extrabold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Table */}
          <div className="lg:col-span-3 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  Bildirimler yükleniyor...
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        {['Tarih', 'Ekip', 'Sektör', 'İmalat Türü', 'Başlangıç', 'Bitiş', 'Metraj', 'Durum'].map(h => (
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {sessions.length === 0 ? (
                        <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">Bildirim bulunamadı.</td></tr>
                      ) : sessions.map((session) => {
                        const st = STATUS_MAP[session.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.IN_PROGRESS;
                        return (
                          <tr
                            key={session.id}
                            className="group hover:bg-slate-800/40 transition-colors cursor-pointer"
                            onClick={() => setSelectedSession(session)}
                          >
                            <td className="px-5 py-4 text-slate-300 font-medium">{new Date(session.startDate).toLocaleDateString('tr-TR')}</td>
                            <td className="px-5 py-4 text-slate-200 font-semibold">{session.teamName}</td>
                            <td className="px-5 py-4 text-slate-300">{session.sector}</td>
                            <td className="px-5 py-4 text-slate-400">{session.workType}</td>
                            <td className="px-5 py-4 text-slate-400">{session.startTime}</td>
                            <td className="px-5 py-4 text-slate-400">{session.endTime || '—'}</td>
                            <td className="px-5 py-4 text-right">
                              {session.quantityMeters
                                ? <span className="font-bold text-slate-200">{session.quantityMeters} <span className="text-xs font-normal text-slate-500">m</span></span>
                                : <span className="text-slate-600">—</span>}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${st.badge}`}>
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

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-800/60">
                  {sessions.map((session) => {
                    const st = STATUS_MAP[session.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.IN_PROGRESS;
                    return (
                      <div key={session.id} className="p-4 space-y-3" onClick={() => setSelectedSession(session)}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{session.teamName}</span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${st.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-800/50 rounded-lg p-2.5">
                            <p className="text-slate-500 mb-0.5">Sektör</p>
                            <p className="text-slate-300 font-medium">{session.sector}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-2.5">
                            <p className="text-slate-500 mb-0.5">İmalat Türü</p>
                            <p className="text-slate-300 font-medium">{session.workType}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-2.5">
                            <p className="text-slate-500 mb-0.5">Tarih</p>
                            <p className="text-slate-300 font-medium">{new Date(session.startDate).toLocaleDateString('tr-TR')}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-2.5">
                            <p className="text-slate-500 mb-0.5">Metraj</p>
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

          {/* Timeline Sidebar */}
          <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-5">
            <h2 className="text-sm font-bold text-slate-200 mb-4 pb-3 border-b border-slate-700/50">Bugünkü Saha İlerlemesi</h2>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-500">Henüz bildirim yok.</p>
              ) : sessions.sort((a, b) => b.startTime.localeCompare(a.startTime)).map((s, idx) => (
                <div key={`${s.id}-${idx}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.status === 'COMPLETED' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'}`} />
                    {idx !== sessions.length - 1 && <div className="w-px flex-1 bg-slate-700/60 my-1" />}
                  </div>
                  <div className="pb-3 min-w-0">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">{s.status === 'COMPLETED' ? s.endTime : s.startTime}</div>
                    <div className="text-xs font-semibold text-slate-300 truncate">{s.teamName}</div>
                    <div className="text-[10px] text-slate-500">{s.status === 'COMPLETED' ? 'tamamlandı' : 'başladı'}{s.quantityMeters ? ` · ${s.quantityMeters} m` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel (slide-in) */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSession(null)} />
          <div className="relative bg-slate-900 border border-slate-700/50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Saha Çalışması Detayı</h2>
                <p className="text-sm text-slate-400">{selectedSession.teamName} tarafından yapılan bildirim</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-colors">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ekip', value: selectedSession.teamName, icon: <Users className="h-3 w-3" /> },
                { label: 'Sektör', value: selectedSession.sector, icon: <ClipboardList className="h-3 w-3" /> },
                { label: 'İmalat Türü', value: selectedSession.workType, icon: null },
                { label: 'Durum', value: selectedSession.status === 'COMPLETED' ? 'Tamamlandı' : 'Devam Ediyor', icon: selectedSession.status === 'COMPLETED' ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Clock className="h-3 w-3 text-amber-400" />, color: selectedSession.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400' },
                { label: 'Başlangıç', value: `${new Date(selectedSession.startDate).toLocaleDateString('tr-TR')} ${selectedSession.startTime}`, icon: null },
                { label: 'Bitiş', value: selectedSession.endDate ? `${new Date(selectedSession.endDate).toLocaleDateString('tr-TR')} ${selectedSession.endTime}` : 'Devam ediyor', icon: null },
              ].map((item) => (
                <div key={item.label} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">{item.icon}{item.label}</p>
                  <p className={`text-sm font-semibold ${(item as {color?: string}).color ?? 'text-slate-200'}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Metraj highlight */}
            {selectedSession.quantityMeters && (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-400">
                  <Ruler className="h-4 w-4" />
                  <span className="text-sm font-semibold">Toplam Metraj</span>
                </div>
                <span className="text-2xl font-extrabold text-sky-300">{selectedSession.quantityMeters} <span className="text-sm font-normal text-sky-400">m</span></span>
              </div>
            )}

            <button
              onClick={() => setSelectedSession(null)}
              className="w-full py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

