'use client';
import { useEffect, useState } from 'react';
import { teamService } from '@/lib/services/teamService';
import { FieldTeam } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, Plus, MapPin } from 'lucide-react';
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

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Aktif': return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case 'Tamamlandı': return "bg-blue-100 text-blue-800 border-blue-200";
      case 'Bekliyor': return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

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

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Saha Ekipleri</h1>
          <p className="text-slate-500 mt-2 font-medium">Sahada görev yapan Enerya ve kontrol firması personellerinin operasyonel ekip bazında takibi.</p>
        </div>
        <Button 
          onClick={() => { setTeamToEdit(null); setFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 h-11 px-6 rounded-xl shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Yeni Ekip
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Toplam Ekip</p>
            <h3 className="text-3xl font-bold text-slate-900">{total}</h3>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-1">Aktif Ekip</p>
            <h3 className="text-3xl font-bold text-emerald-900">{active}</h3>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-1">Bekleyen Ekip</p>
            <h3 className="text-3xl font-bold text-amber-900">{waiting}</h3>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 shadow-sm rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-1">Tamamlanan</p>
            <h3 className="text-3xl font-bold text-blue-900">{completed}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Ekip, personel, bölge ara..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-slate-200 focus-visible:ring-blue-500 rounded-xl h-11"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Ekip</th>
                <th className="px-6 py-4">Enerya Personeli</th>
                <th className="px-6 py-4">Kontrol Firması</th>
                <th className="px-6 py-4">Kontrol Personeli</th>
                <th className="px-6 py-4">Bölge</th>
                <th className="px-6 py-4">İmalat Türü</th>
                <th className="px-6 py-4 text-center">Servis Kutusu</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">Yükleniyor...</td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">Sonuç bulunamadı.</td>
                </tr>
              ) : (
                filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/yapim/teams/${team.id}`} className="font-bold text-blue-600 hover:underline flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {team.code}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{team.eneryaEmployee.name}</td>
                    <td className="px-6 py-4 text-slate-600">{team.controlCompany.name}</td>
                    <td className="px-6 py-4 text-slate-900">{team.controlEmployee.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-slate-600">
                        <span className="font-medium text-slate-900">{team.district}</span>
                        <span className="text-xs">{team.neighborhood}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        {team.workType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-slate-900">{team.serviceBoxIds.length}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`${getStatusClass(team.status)} font-semibold shadow-sm`}>
                        {team.status === 'Aktif' ? '🟢' : team.status === 'Bekliyor' ? '🟠' : '⚪'} {team.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setTeamToEdit(team); setFormOpen(true); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Düzenle
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
