'use client';
import { useEffect, useState } from 'react';
import { KPICards } from '@/components/dashboard/KPICards';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { CriticalServiceBoxes } from '@/components/dashboard/CriticalServiceBoxes';
import { TeamStatus } from '@/components/dashboard/TeamStatus';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { teamService } from '@/lib/services/teamService';
import { fieldReportService } from '@/lib/services/fieldReportService';
import { DashboardKPIs, ServiceBox, FieldTeam, FieldReport } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [criticalBoxes, setCriticalBoxes] = useState<ServiceBox[]>([]);
  const [teams, setTeams] = useState<FieldTeam[]>([]);
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [allBoxes, allTeams, allReports] = await Promise.all([
        serviceBoxService.getServiceBoxes(),
        teamService.getTeams(),
        fieldReportService.getFieldReports()
      ]);

      const totalServiceBoxes = allBoxes.length;
      const criticalUnder7Days = allBoxes.filter(b => b.waitingDays < 8 && b.lastStatus !== 'Tamamlandı').length;
      const under15Days = allBoxes.filter(b => b.waitingDays < 16 && b.lastStatus !== 'Tamamlandı').length;
      const under30Days = allBoxes.filter(b => b.waitingDays < 31 && b.lastStatus !== 'Tamamlandı').length;
      
      const activeTeams = allTeams.filter(t => t.status === 'Aktif').length;
      const todayProductionMeters = allTeams.reduce((sum, t) => sum + (t.todayProductionMeters || 0), 0);

      setKpis({
        totalServiceBoxes,
        criticalUnder7Days,
        under15Days,
        under30Days,
        activeTeams,
        todayProductionMeters,
      });

      // Filter critical boxes
      const sortedBoxes = [...allBoxes]
        .filter(b => b.lastStatus !== 'Tamamlandı')
        .sort((a, b) => a.waitingDays - b.waitingDays);
      setCriticalBoxes(sortedBoxes.slice(0, 5));

      setTeams(allTeams);
      setReports(allReports.slice(0, 4));

      setLoading(false);
    }

    loadData();
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">SAHA YAPIM TAKİP</h1>
        <p className="text-sm text-slate-500 mt-1">Operasyonun genel durumu ve saha gerçekleşmeleri</p>
      </div>

      <FilterBar />

      {loading ? (
        <div className="h-24 flex items-center justify-center text-slate-500">Yükleniyor...</div>
      ) : kpis ? (
        <KPICards kpis={kpis} />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Güncel Saha Operasyonu (Harita)</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/map">Tam Ekran Harita</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col relative">
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">Harita Modülü (Faz 7'de eklenecektir)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <TeamStatus teams={teams} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CriticalServiceBoxes boxes={criticalBoxes} />
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Bugünkü Saha Bildirimleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-start justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{report.time}</span>
                      <span className="text-sm font-semibold text-slate-900">{report.teamId.replace('team-0', 'Ekip ')}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {report.reportType === 'MORNING' ? 'İşe Başlama' : 'İmalat Bitiş'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{report.address}</div>
                    <div className="text-sm font-medium mt-1 text-slate-700">
                      {report.workType} {report.productionMeters ? `- ${report.productionMeters}m` : ''}
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="link" className="w-full text-blue-600 p-0 h-auto" asChild>
                <Link href="/field-reports">Tüm Bildirimleri Gör →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
