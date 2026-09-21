'use client';
import { useEffect, useState } from 'react';
import { teamService } from '@/lib/services/teamService';
import { FieldTeam } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Activity, MapPin } from 'lucide-react';

export default function TeamsPage() {
  const [teams, setTeams] = useState<FieldTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await teamService.getTeams();
      setTeams(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Aktif': return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case 'Tamamlandı': return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
      case 'Bekliyor': return "bg-slate-100 text-slate-800 hover:bg-slate-100";
      default: return "bg-slate-100 text-slate-800 hover:bg-slate-100";
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Saha Ekipleri</h1>
        <p className="text-sm text-slate-500 mt-1">Ekiplerin güncel çalışma durumu ve günlük imalat üretimleri</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Ekipler yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="shadow-sm border-slate-200">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{team.code}</h3>
                      <Badge variant="outline" className={`mt-1 ${getStatusClass(team.status)}`}>
                        {team.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-medium">Bölge Bilgisi</span>
                    <span className="text-sm font-semibold text-slate-900">{team.sectorRegionInfo}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 font-medium">Günlük Üretim</span>
                    <span className="text-sm font-semibold text-indigo-600">
                      {team.todayProductionMeters > 0 ? `${team.todayProductionMeters} m` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Son Bildirim
                    </span>
                    <span className="text-sm font-medium text-slate-700">{team.lastReportTime || 'Yok'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
