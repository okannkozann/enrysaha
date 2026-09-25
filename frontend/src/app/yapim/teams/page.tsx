'use client';
import { useEffect, useState } from 'react';
import { teamService } from '@/lib/services/teamService';
import { FieldTeam } from '@/types';
import { Users, Search, Plus, MapPin, HardHat } from 'lucide-react';
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

  // Filter
  const filteredTeams = teams.filter(t => {
    const term = search.toLowerCase();
    return (
      t.code.toLowerCase().includes(term) ||
      t.eneryaEmployee.name.toLowerCase().includes(term) ||
      t.controlEmployee.name.toLowerCase().includes(term) ||
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
    <div className="h-[calc(100vh-70px)] w-full flex flex-col bg-slate-950 text-slate-100 p-3 sm:p-4 md:p-5 overflow-hidden relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 min-h-0 space-y-3 max-w-[1600px] w-full mx-auto overflow-hidden">

        {/* Header (Compact Fit) */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none">Saha Ekipleri</h1>
              <p className="text-xs text-slate-400 mt-1">Enerya ve kontrol personellerinin operasyonel ekip takibi</p>
            </div>
          </div>
          <button
            onClick={() => { setTeamToEdit(null); setFormOpen(true); }}
            className="flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-900/30 shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Yeni Ekip
          </button>
        </div>

        {/* Table Card (Viewport-Fit Flex 1 Container) */}
        <div className="flex-1 min-h-0 flex flex-col bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-700/50 shrink-0 flex items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Ekip, personel, bölge ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8.5 bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder:text-slate-500 text-xs rounded-xl pl-9 pr-3 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Toplam <strong className="text-slate-200">{filteredTeams.length}</strong> Ekip
            </span>
          </div>

          {/* Desktop Table Container (Scrolls inside container) */}
          <div className="hidden md:block flex-1 overflow-y-auto min-h-0 relative">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-700/50">
                <tr>
                  {['Ekip', 'Enerya Personeli', 'Kontrol Personeli', 'Bölge', 'İmalat Türü', 'Durum', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                        <span className="text-xs font-medium">Ekip verileri yükleniyor...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-xs italic">Kriterlere uygun sonuç bulunamadı.</td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => {
                    const sc = getStatusConfig(team.status);
                    return (
                      <tr key={team.id} className="group hover:bg-slate-800/40 transition-colors cursor-pointer">
                        <td className="px-4 py-2.5">
                          <Link href={`/yapim/teams/${team.id}`} className="flex items-center gap-2 font-bold text-blue-400 hover:text-blue-300 transition-colors">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            {team.code}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <HardHat className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-200 font-semibold">{team.eneryaEmployee.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300 font-medium">{team.controlEmployee.name}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-semibold text-slate-300">{team.district}</span>
                            <span className="text-slate-500 text-[11px]">/ {team.neighborhood}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${getWorkTypeBadge(team.workType)}`}>
                            {team.workType}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold ${sc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label || team.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => { setTeamToEdit(team); setFormOpen(true); }}
                            className="opacity-0 group-hover:opacity-100 transition-all px-2.5 py-1 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md cursor-pointer"
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

          {/* Mobile Cards Container */}
          <div className="md:hidden flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  Yükleniyor...
                </div>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">Sonuç bulunamadı.</div>
            ) : (
              filteredTeams.map((team) => {
                const sc = getStatusConfig(team.status);
                return (
                  <div key={team.id} className="p-3.5 space-y-2.5">
                    {/* Top row */}
                    <div className="flex items-center justify-between">
                      <Link href={`/yapim/teams/${team.id}`} className="flex items-center gap-2 font-bold text-blue-400 text-xs">
                        <Users className="h-3.5 w-3.5" />
                        {team.code}
                      </Link>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {team.status}
                      </span>
                    </div>
                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-800/50 rounded-lg p-2">
                        <p className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wider">Enerya Personeli</p>
                        <p className="text-slate-200 font-semibold truncate">{team.eneryaEmployee.name}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2">
                        <p className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wider">Kontrol Personeli</p>
                        <p className="text-slate-300 font-medium truncate">{team.controlEmployee.name}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2 col-span-2">
                        <p className="text-slate-400 text-[10px] mb-0.5 uppercase tracking-wider">Bölge</p>
                        <p className="text-slate-300 font-medium">{team.district} / {team.neighborhood}</p>
                      </div>
                    </div>
                    {/* Bottom row */}
                    <div className="flex items-center justify-between pt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${getWorkTypeBadge(team.workType)}`}>
                        {team.workType}
                      </span>
                      <button
                        onClick={() => { setTeamToEdit(team); setFormOpen(true); }}
                        className="text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-md px-2.5 py-1 transition-colors cursor-pointer"
                      >
                        Düzenle
                      </button>
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
