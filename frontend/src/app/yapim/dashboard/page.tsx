'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Box,
  Clock,
  FileWarning,
  MapPin,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { KPICards } from '@/components/dashboard/KPICards';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { CriticalServiceBoxes } from '@/components/dashboard/CriticalServiceBoxes';
import { TeamStatus } from '@/components/dashboard/TeamStatus';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { teamService } from '@/lib/services/teamService';
import { fieldReportService } from '@/lib/services/fieldReportService';
import { DashboardKPIs, FieldReport, FieldTeam, ServiceBox } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function formatPercent(value: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function topBy(items: string[]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    if (!item) return acc;
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || null;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [allBoxes, setAllBoxes] = useState<ServiceBox[]>([]);
  const [criticalBoxes, setCriticalBoxes] = useState<ServiceBox[]>([]);
  const [teams, setTeams] = useState<FieldTeam[]>([]);
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [serviceBoxes, allTeams, allReports] = await Promise.all([
        serviceBoxService.getServiceBoxes(),
        teamService.getTeams(),
        fieldReportService.getFieldReports(),
      ]);
      let boxes = serviceBoxes;

      try {
        const cached = localStorage.getItem('enerya_service_boxes');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            boxes = parsed;
          }
        }
      } catch (error) {
        console.error('Dashboard service box cache load error:', error);
      }

      const totalServiceBoxes = boxes.length;
      const criticalUnder7Days = boxes.filter((box) => box.waitingDays < 8 && box.lastStatus !== 'Tamamlandı').length;
      const under15Days = boxes.filter((box) => box.waitingDays < 16 && box.lastStatus !== 'Tamamlandı').length;
      const under30Days = boxes.filter((box) => box.waitingDays < 31 && box.lastStatus !== 'Tamamlandı').length;
      const activeTeams = allTeams.filter((team) => team.status === 'Aktif').length;
      const todayProductionMeters = allTeams.reduce((sum, team) => sum + (team.todayProductionMeters || 0), 0);

      setKpis({
        totalServiceBoxes,
        criticalUnder7Days,
        under15Days,
        under30Days,
        activeTeams,
        todayProductionMeters,
      });

      setAllBoxes(boxes);
      setCriticalBoxes(
        [...boxes]
          .filter((box) => box.lastStatus !== 'Tamamlandı')
          .sort((a, b) => b.waitingDays - a.waitingDays)
          .slice(0, 6)
      );
      setTeams(allTeams);
      setReports(allReports.slice(0, 4));
      setLoading(false);
    }

    loadData();
  }, []);

  const totalBoxes = allBoxes.length;
  const overdueBoxes = allBoxes.filter((box) => box.waitingDays >= 90 && box.lastStatus !== 'Tamamlandı').length;
  const nearLimitBoxes = allBoxes.filter((box) => box.waitingDays >= 75 && box.waitingDays < 90 && box.lastStatus !== 'Tamamlandı').length;
  const emptyStatusBoxes = allBoxes.filter((box) => !box.lastStatus).length;
  const completedBoxes = allBoxes.filter((box) => box.lastStatus === 'Tamamlandı').length;
  const maxWaitingBox = [...allBoxes].sort((a, b) => b.waitingDays - a.waitingDays)[0];
  const averageWaiting = totalBoxes
    ? Math.round(allBoxes.reduce((sum, box) => sum + box.waitingDays, 0) / totalBoxes)
    : 0;
  const topDistrict = topBy(allBoxes.map((box) => box.district));
  const topSector = topBy(allBoxes.map((box) => box.sectorRegionInfo || box.sectorInfo));
  const statusCompletionPercent = formatPercent(completedBoxes, totalBoxes);
  const emptyStatusPercent = formatPercent(emptyStatusBoxes, totalBoxes);

  const riskBands = [
    {
      label: '0-15 Gün',
      count: allBoxes.filter((box) => box.waitingDays < 15 && box.lastStatus !== 'Tamamlandı').length,
      className: 'bg-red-500',
    },
    {
      label: '15-30 Gün',
      count: allBoxes.filter((box) => box.waitingDays >= 15 && box.waitingDays < 30 && box.lastStatus !== 'Tamamlandı').length,
      className: 'bg-orange-500',
    },
    {
      label: '30-75 Gün',
      count: allBoxes.filter((box) => box.waitingDays >= 30 && box.waitingDays < 75 && box.lastStatus !== 'Tamamlandı').length,
      className: 'bg-sky-500',
    },
    {
      label: '75+ Gün',
      count: allBoxes.filter((box) => box.waitingDays >= 75 && box.lastStatus !== 'Tamamlandı').length,
      className: 'bg-violet-600',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr]">
            <div className="relative p-6 sm:p-8">
              <div className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-blue-600" />
              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Canlı operasyon görünümü
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">SAHA YAPIM TAKİP</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      Servis kutusu öncelikleri, ekip gerçekleşmeleri ve saha riskleri tek ekranda izlenir.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-red-700">
                      <ShieldAlert className="h-4 w-4" />
                      90+ Gün
                    </div>
                    <div className="mt-2 text-2xl font-bold text-red-700">{overdueBoxes}</div>
                    <div className="mt-1 text-xs text-red-600">Yasal limit aşımı</div>
                  </div>
                  <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-700">
                      <Clock className="h-4 w-4" />
                      75-90 Gün
                    </div>
                    <div className="mt-2 text-2xl font-bold text-orange-700">{nearLimitBoxes}</div>
                    <div className="mt-1 text-xs text-orange-600">Limite yaklaşan</div>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                      <FileWarning className="h-4 w-4" />
                      Durum Boş
                    </div>
                    <div className="mt-2 text-2xl font-bold text-amber-700">{emptyStatusBoxes}</div>
                    <div className="mt-1 text-xs text-amber-600">{emptyStatusPercent} kayıt</div>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <Box className="h-4 w-4" />
                      Tamamlanan
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-700">{statusCompletionPercent}</div>
                    <div className="mt-1 text-xs text-emerald-600">{completedBoxes} kayıt</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-400">Servis kutusu radarı</div>
                  <div className="mt-2 text-3xl font-bold">{averageWaiting} gün</div>
                  <div className="mt-1 text-sm text-slate-300">Ortalama bekleme süresi</div>
                </div>
                <Button variant="secondary" size="sm" className="gap-2 bg-white text-slate-950 hover:bg-slate-100" asChild>
                  <Link href="/yapim/service-boxes">
                    Detay
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-7 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span>En uzun bekleyen</span>
                    <span>{maxWaitingBox ? `${maxWaitingBox.waitingDays} gün` : '-'}</span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="font-semibold">{maxWaitingBox?.connectionObject || '-'}</div>
                    <div className="mt-1 line-clamp-2 text-sm text-slate-300">{maxWaitingBox?.address || 'Kayıt bulunmuyor'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Yoğun ilçe</div>
                    <div className="mt-1 truncate text-lg font-semibold">{topDistrict?.[0] || '-'}</div>
                    <div className="mt-1 text-xs text-slate-400">{topDistrict?.[1] || 0} kayıt</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-slate-400">Yoğun sektör</div>
                    <div className="mt-1 truncate text-lg font-semibold">{topSector?.[0] || '-'}</div>
                    <div className="mt-1 text-xs text-slate-400">{topSector?.[1] || 0} kayıt</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FilterBar />

        {loading ? (
          <div className="flex h-24 items-center justify-center text-slate-500">Yükleniyor...</div>
        ) : kpis ? (
          <KPICards kpis={kpis} />
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Servis Kutusu Öncelik Dağılımı
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Servis kutusu sekmesindeki bekleme ve durum kırılımlarından özet.</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/yapim/service-boxes">Servis Kutuları</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-4">
                {riskBands.map((band) => (
                  <div key={band.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{band.label}</span>
                      <span className="font-semibold text-slate-950">
                        {band.count} <span className="font-normal text-slate-400">kayıt</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${band.className}`}
                        style={{ width: formatPercent(band.count, totalBoxes) }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">Adres/Kayıt</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{totalBoxes}</div>
                  <div className="mt-1 text-xs text-slate-500">Aktarılan toplam servis kutusu</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">Ortalama</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{averageWaiting} gün</div>
                  <div className="mt-1 text-xs text-slate-500">Bekleme süresi</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">Eksik durum</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{emptyStatusPercent}</div>
                  <div className="mt-1 text-xs text-slate-500">Son durum alanı boş</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Kritik İlk Kayıtlar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {criticalBoxes.slice(0, 4).map((box) => (
                <Link
                  key={box.id}
                  href={`/yapim/service-boxes/${box.id}`}
                  className="block border-b border-slate-100 p-4 transition-colors last:border-0 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-950">{box.connectionObject}</div>
                      <div className="mt-1 truncate text-sm text-slate-500">{box.address}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-md bg-slate-100 px-2 py-1">{box.district}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-1">{box.sectorRegionInfo}</span>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-center">
                      <div className="text-lg font-bold text-red-700">{box.waitingDays}</div>
                      <div className="text-[10px] font-semibold text-red-600">gün</div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="flex min-h-[400px] flex-col border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Güncel Saha Operasyonu (Harita)</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/yapim/map">Tam Ekran Harita</Link>
              </Button>
            </CardHeader>
            <CardContent className="relative flex flex-1 flex-col p-0">
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">Harita modülü ayrı ekranda hazır</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <TeamStatus teams={teams} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CriticalServiceBoxes boxes={criticalBoxes} />

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Bugünkü Saha Bildirimleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{report.time}</span>
                        <span className="text-sm font-semibold text-slate-900">{report.teamId.replace('team-0', 'Ekip ')}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {report.reportType === 'MORNING' ? 'İşe Başlama' : 'İmalat Bitiş'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">{report.address}</div>
                      <div className="mt-1 text-sm font-medium text-slate-700">
                        {report.workType} {report.productionMeters ? `- ${report.productionMeters}m` : ''}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="link" className="h-auto w-full p-0 text-blue-600" asChild>
                  <Link href="/yapim/field-reports">Tüm Bildirimleri Gör</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
