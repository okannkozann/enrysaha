'use client';
import { useEffect, useState } from 'react';
import { teamService } from '@/lib/services/teamService';
import { FieldTeam } from '@/types';
import { Users, Search, Plus, MapPin, Building2, HardHat, CheckCircle2, Clock, Activity } from 'lucide-react';
import Link from 'next/link';
import { TeamForm } from '@/components/teams/TeamForm';

export default function TeamsPage() {
  const [teams, setTeams] = useState<FieldTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<FieldTeam | null>(null);

  const loadData = async () => {
    const data = await teamService.getTeams();
    setTeams(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // KPIs
  const total = teams.length;
  const active = teams.filter(t => t.status === 'Aktif').length;
  const waiting = teams.filter(t => t.status === 'Bekliyor').length;
  const completed = teams.filter(t => t.status === 'Tamamlandı').length;

  // Filter
  const filteredTeams = teams.filter(t => {
    const term = search.toLowerCase();
    return (
      t.code.toLowerCase().includes(term) ||
      t.eneryaEmployee.name.toLowerCase().includes(term) ||
      t.controlEmployee.name.toLowerCase().includes(term) ||
      t.controlCompany.name.toLowerCase().includes(term) ||
      t.district.toLowerCase().includes(term) ||
      t.neighborhood.toLowerCase().includes(term)
    );
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Aktif':
        return {
          dot: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
          badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        };
      case 'Bekliyor':
        return {
          dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]',
          badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        };
      case 'Tamamlandı':
        return {
          dot: 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]',
          badge: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
        };
      default:
        return {
          dot: 'bg-slate-400',
          badge: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
        };
    }
  };

  const getWorkTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      'PE Ana Hat': 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
      'Servis Hattı': 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
      'ST Çelik Hat': 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
      'Servis Kutusu': 'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    };
    return map[type] ?? 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">Saha Ekipleri</h1>
              <p className="text-xs text-slate-400 mt-0.5">Enerya ve kontrol firması personellerinin operasyonel ekip takibi</p>
            </div>
          </div>
          <button
            onClick={() => { setTeamToEdit(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Yeni Ekip
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Ekip', value: total, icon: <Users className="h-4 w-4" />, color: 'text-slate-300', glow: '', bg: 'bg-slate-800/40', border: 'border-slate-700/50' },
            { label: 'Aktif', value: active, icon: <Activity className="h-4 w-4" />, color: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.08)]', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
            { label: 'Bekliyor', value: waiting, icon: <Clock className="h-4 w-4" />, color: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.08)]', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
            { label: 'Tamamlandı', value: completed, icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-sky-400', glow: 'shadow-[0_0_20px_rgba(56,189,248,0.08)]', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
          ].map((kpi) => (
            <div key={kpi.label} className={`${kpi.bg} ${kpi.glow} backdrop-blur-xl border ${kpi.border} rounded-2xl p-3.5`}>
              <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{kpi.label}</p>
              <p className={`text-xl font-extrabold ${kpi.color}`}>{loading ? '—' : kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Ekip, personel, bölge ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder:text-slate-500 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Ekip', 'Enerya Personeli', 'Kontrol Firması', 'Kontrol Personeli', 'Bölge', 'İmalat Türü', 'Kutu', 'Durum', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                        Yükleniyor...
                      </div>
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-slate-500">Sonuç bulunamadı.</td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => {
                    const sc = getStatusConfig(team.status);
                    return (
                      <tr key={team.id} className="group hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4">
                          <Link href={`/yapim/teams/${team.id}`} className="flex items-center gap-2 font-bold text-blue-400 hover:text-blue-300 transition-colors">
                            <Users className="h-4 w-4 shrink-0" />
                            {team.code}
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <HardHat className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-200 font-medium">{team.eneryaEmployee.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-400">{team.controlCompany.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{team.controlEmployee.name}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium text-slate-300">{team.district}</span>
                            <span className="text-slate-500 text-xs">/ {team.neighborhood}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getWorkTypeBadge(team.workType)}`}>
                            {team.workType}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm">
                            {team.serviceBoxIds.length}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {team.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => { setTeamToEdit(team); setFormOpen(true); }}
                            className="opacity-0 group-hover:opacity-100 transition-all px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg"
                          >
                            Düzenle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  Yükleniyor...
                </div>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Sonuç bulunamadı.</div>
            ) : (
              filteredTeams.map((team) => {
                const sc = getStatusConfig(team.status);
                return (
                  <div key={team.id} className="p-4 space-y-3">
                    {/* Top row */}
                    <div className="flex items-center justify-between">
                      <Link href={`/yapim/teams/${team.id}`} className="flex items-center gap-2 font-bold text-blue-400">
                        <Users className="h-4 w-4" />
                        {team.code}
                      </Link>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {team.status}
                      </span>
                    </div>
                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-800/50 rounded-lg p-2.5">
                        <p className="text-slate-500 mb-0.5">Enerya Personeli</p>
                        <p className="text-slate-200 font-semibold">{team.eneryaEmployee.name}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2.5">
                        <p className="text-slate-500 mb-0.5">Kontrol Firması</p>
                        <p className="text-slate-300 font-medium">{team.controlCompany.name}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2.5">
                        <p className="text-slate-500 mb-0.5">Kontrol Personeli</p>
                        <p className="text-slate-300 font-medium">{team.controlEmployee.name}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2.5">
                        <p className="text-slate-500 mb-0.5">Bölge</p>
                        <p className="text-slate-300 font-medium">{team.district} / {team.neighborhood}</p>
                      </div>
                    </div>
                    {/* Bottom row */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getWorkTypeBadge(team.workType)}`}>
                        {team.workType}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          <span className="font-bold text-slate-200">{team.serviceBoxIds.length}</span> kutu
                        </span>
                        <button
                          onClick={() => { setTeamToEdit(team); setFormOpen(true); }}
                          className="text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          Düzenle
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <TeamForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        teamToEdit={teamToEdit}
        onSuccess={loadData}
      />
    </div>
  );
}
