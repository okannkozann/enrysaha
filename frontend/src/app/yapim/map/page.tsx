'use client';
import { useEffect, useState } from 'react';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { teamService } from '@/lib/services/teamService';
import { fieldReportService } from '@/lib/services/fieldReportService';
import { ServiceBox, FieldTeam, FieldReport } from '@/types';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamically import map component with ssr: false since leaflet uses window
const DynamicMap = dynamic(() => import('@/components/map/OperationMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[500px] bg-slate-100 flex items-center justify-center text-slate-500">Harita yükleniyor...</div>
});

export default function MapPage() {
  const [boxes, setBoxes] = useState<ServiceBox[]>([]);
  const [teams, setTeams] = useState<FieldTeam[]>([]);
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [allBoxes, allTeams, allReports] = await Promise.all([
        serviceBoxService.getServiceBoxes(),
        teamService.getTeams(),
        fieldReportService.getFieldReports()
      ]);
      setBoxes(allBoxes);
      setTeams(allTeams);
      setReports(allReports);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="bg-white border-b border-slate-200 p-4 flex-shrink-0 flex justify-between items-center z-10 relative shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Operasyon Haritası</h1>
          <p className="text-xs text-slate-500 mt-0.5">Saha hareketleri ve güncel imalat lokasyonları</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filtreler
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
            <MapPin className="h-4 w-4" /> Sadece Kritikler
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* Map Container */}
        <div className="flex-1 relative z-0">
          {!loading && (
            <DynamicMap 
              boxes={boxes} 
              teams={teams} 
              reports={reports} 
            />
          )}
        </div>

        {/* Sidebar/Panel for Map */}
        <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto flex-shrink-0 z-10 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] p-4 space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" /> Aktif Ekipler ({teams.filter(t => t.status === 'Aktif').length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {teams.map(team => (
                  <div key={team.id} className="flex justify-between items-center text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                    <div>
                      <span className="font-medium text-slate-900">{team.code}</span>
                      <p className="text-[10px] text-slate-500">{team.sectorRegionInfo}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                      team.status === 'Aktif' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {team.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Tarihsel İlerleme (Faz 8)</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded border border-dashed border-slate-200">
                Bu alanda gün içindeki saatlik imalat hareketleri ve timeline animasyonu yer alacaktır.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
