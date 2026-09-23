'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowUpRight, BarChart3, Box,
  Clock, FileWarning, MapPin, ShieldAlert,
  TrendingUp, Users, Activity, Zap, ChevronRight,
} from 'lucide-react';
import { KPICards } from '@/components/dashboard/KPICards';
import { TeamStatus } from '@/components/dashboard/TeamStatus';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { teamService } from '@/lib/services/teamService';
import { fieldReportService } from '@/lib/services/fieldReportService';
import { DashboardKPIs, FieldReport, FieldTeam, ServiceBox } from '@/types';

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

/* ── Reusable card wrapper ─────────────────────────────────────── */
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-700/40 bg-slate-800/50 backdrop-blur-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, iconColor, iconBg, title, action }: {
  icon: React.ElementType; iconColor: string; iconBg: string;
  title: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <span className="text-sm font-semibold text-slate-100">{title}</span>
      </div>
      {action}
    </div>
  );
}

function LinkAction({ href, label = 'Detay' }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 hover:text-blue-300 transition-colors"
    >
      {label} <ChevronRight className="h-3 w-3" />
    </Link>
  );
}

/* ══ Main Page ════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [kpis, setKpis]               = useState<DashboardKPIs | null>(null);
  const [allBoxes, setAllBoxes]       = useState<ServiceBox[]>([]);
  const [criticalBoxes, setCriticalBoxes] = useState<ServiceBox[]>([]);
  const [teams, setTeams]             = useState<FieldTeam[]>([]);
  const [reports, setReports]         = useState<FieldReport[]>([]);
  const [loading, setLoading]         = useState(true);

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
          if (Array.isArray(parsed) && parsed.length > 0) boxes = parsed;
        }
      } catch {}

      const totalServiceBoxes   = boxes.length;
      const criticalUnder7Days  = boxes.filter((b) => b.waitingDays < 8 && b.lastStatus !== 'Tamamlandı').length;
      const under15Days         = boxes.filter((b) => b.waitingDays < 16 && b.lastStatus !== 'Tamamlandı').length;
      const under30Days         = boxes.filter((b) => b.waitingDays < 31 && b.lastStatus !== 'Tamamlandı').length;
      const activeTeams           = allTeams.filter((t) => t.status === 'Aktif').length;
      const todayProductionMeters  = 0; // not in FieldTeam type

      setKpis({ totalServiceBoxes, criticalUnder7Days, under15Days, under30Days, activeTeams, todayProductionMeters });
      setAllBoxes(boxes);
      setCriticalBoxes([...boxes].filter((b) => b.lastStatus !== 'Tamamlandı').sort((a, b) => b.waitingDays - a.waitingDays).slice(0, 6));
      setTeams(allTeams);
      setReports(allReports.slice(0, 5));
      setLoading(false);
    }
    loadData();
  }, []);

  /* Derived stats */
  const totalBoxes          = allBoxes.length;
  const overdueBoxes        = allBoxes.filter((b) => b.waitingDays >= 90 && b.lastStatus !== 'Tamamlandı').length;
  const nearLimitBoxes      = allBoxes.filter((b) => b.waitingDays >= 75 && b.waitingDays < 90 && b.lastStatus !== 'Tamamlandı').length;
  const emptyStatusBoxes    = allBoxes.filter((b) => !b.lastStatus).length;
  const completedBoxes      = allBoxes.filter((b) => b.lastStatus === 'Tamamlandı').length;
  const maxWaitingBox       = [...allBoxes].sort((a, b) => b.waitingDays - a.waitingDays)[0];
  const averageWaiting      = totalBoxes ? Math.round(allBoxes.reduce((s, b) => s + b.waitingDays, 0) / totalBoxes) : 0;
  const topDistrict         = topBy(allBoxes.map((b) => b.district));
  const topSector           = topBy(allBoxes.map((b) => b.sectorRegionInfo || b.sectorInfo));
  const emptyStatusPercent  = formatPercent(emptyStatusBoxes, totalBoxes);
  const completionPercent   = formatPercent(completedBoxes, totalBoxes);

  const riskBands = [
    { label: '0–15 Gün',  count: allBoxes.filter((b) => b.waitingDays < 15 && b.lastStatus !== 'Tamamlandı').length,                                     bar: 'from-red-500 to-red-400',     pct: formatPercent(allBoxes.filter((b) => b.waitingDays < 15).length, totalBoxes) },
    { label: '15–30 Gün', count: allBoxes.filter((b) => b.waitingDays >= 15 && b.waitingDays < 30 && b.lastStatus !== 'Tamamlandı').length,               bar: 'from-orange-500 to-orange-400', pct: formatPercent(allBoxes.filter((b) => b.waitingDays >= 15 && b.waitingDays < 30).length, totalBoxes) },
    { label: '30–75 Gün', count: allBoxes.filter((b) => b.waitingDays >= 30 && b.waitingDays < 75 && b.lastStatus !== 'Tamamlandı').length,               bar: 'from-blue-500 to-blue-400',   pct: formatPercent(allBoxes.filter((b) => b.waitingDays >= 30 && b.waitingDays < 75).length, totalBoxes) },
    { label: '75+ Gün',   count: allBoxes.filter((b) => b.waitingDays >= 75 && b.lastStatus !== 'Tamamlandı').length,                                     bar: 'from-violet-500 to-violet-400', pct: formatPercent(allBoxes.filter((b) => b.waitingDays >= 75).length, totalBoxes) },
  ];

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-[1600px] space-y-5 p-5">

        {/* ══ Hero Banner ════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/60 backdrop-blur-sm">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-1/4 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl" />
            <div className="absolute -top-8 right-10 w-48 h-48 rounded-full bg-indigo-500/8 blur-3xl" />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
            {/* Left: title + quick stats */}
            <div className="p-6 sm:p-8 border-b border-slate-700/30 lg:border-b-0 lg:border-r">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-300 mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                Canlı Operasyon Görünümü
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                SAHA YAPIM TAKİP
              </h1>
              <p className="text-sm text-slate-400 max-w-xl leading-relaxed mb-6">
                Servis kutusu öncelikleri, ekip gerçekleşmeleri ve saha riskleri tek ekranda izlenir.
              </p>

              {/* 4 quick-stat pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: ShieldAlert, label: '90+ Gün', value: overdueBoxes,    sub: 'Yasal limit aşımı', color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20' },
                  { icon: Clock,       label: '75–90 Gün', value: nearLimitBoxes, sub: 'Limite yaklaşan', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                  { icon: FileWarning, label: 'Durum Boş', value: emptyStatusBoxes, sub: emptyStatusPercent + ' oran', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
                  { icon: Box,         label: 'Tamamlanan', value: completionPercent, sub: completedBoxes + ' kayıt', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                ].map(({ icon: Icon, label, value, sub, color, bg, border }) => (
                  <div key={label} className={`rounded-xl border ${border} ${bg} p-4`}>
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold ${color} uppercase tracking-wider mb-2`}>
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </div>
                    <div className={`text-2xl font-black ${color}`}>{value}</div>
                    <div className={`text-[10px] ${color} opacity-70 mt-1 font-medium`}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: radar panel */}
            <div className="p-6 sm:p-8 bg-slate-900/40 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-1">
                    Servis Kutusu Radarı
                  </p>
                  <p className="text-3xl font-black text-white">{averageWaiting} <span className="text-xl font-semibold text-slate-400">gün</span></p>
                  <p className="text-xs text-slate-500 mt-1">Ortalama bekleme süresi</p>
                </div>
                <Link
                  href="/yapim/service-boxes"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
                >
                  Detay <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Max waiting */}
              <div className="rounded-xl border border-slate-700/40 bg-slate-800/60 p-4 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>En uzun bekleyen</span>
                  <span className="text-red-400">{maxWaitingBox ? `${maxWaitingBox.waitingDays} gün` : '—'}</span>
                </div>
                <div className="text-sm font-semibold text-slate-100">{maxWaitingBox?.connectionObject || '—'}</div>
                <div className="text-xs text-slate-500 line-clamp-1">{maxWaitingBox?.address || 'Kayıt bulunmuyor'}</div>
              </div>

              {/* Top district & sector */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Yoğun İlçe',  value: topDistrict?.[0], count: topDistrict?.[1] },
                  { label: 'Yoğun Sektör', value: topSector?.[0],   count: topSector?.[1] },
                ].map(({ label, value, count }) => (
                  <div key={label} className="rounded-xl border border-slate-700/30 bg-slate-800/50 p-3">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
                    <div className="text-sm font-bold text-slate-100 truncate mt-1">{value || '—'}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{count || 0} kayıt</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ KPI Strip ══════════════════════════════════════════ */}
        {loading ? (
          <div className="flex h-24 items-center justify-center text-slate-600 gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
            Yükleniyor...
          </div>
        ) : kpis ? (
          <KPICards kpis={kpis} />
        ) : null}

        {/* ══ Row 2: Priority Breakdown + Critical List ═══════════ */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">

          {/* Priority Breakdown */}
          <GlassCard>
            <CardHeader
              icon={BarChart3}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10"
              title="Servis Kutusu Öncelik Dağılımı"
              action={<LinkAction href="/yapim/service-boxes" label="Servis Kutuları" />}
            />
            <div className="p-5 space-y-4">
              {riskBands.map((band) => (
                <div key={band.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{band.label}</span>
                    <span className="font-bold text-slate-100">
                      {band.count} <span className="font-normal text-slate-500">kayıt</span>
                      <span className="ml-2 text-slate-500 font-normal">({band.pct})</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-700/50">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${band.bar} transition-all duration-700`}
                      style={{ width: band.pct }}
                    />
                  </div>
                </div>
              ))}

              {/* Summary mini-stats */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-700/30">
                {[
                  { label: 'Toplam Kayıt',  value: totalBoxes,          sub: 'aktarılan' },
                  { label: 'Ort. Bekleme',  value: `${averageWaiting} gün`, sub: 'bekleme süresi' },
                  { label: 'Eksik Durum',   value: emptyStatusPercent,  sub: 'boş alan' },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-3 text-center">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
                    <div className="text-xl font-black text-white mt-1">{value}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Critical Items */}
          <GlassCard>
            <CardHeader
              icon={AlertTriangle}
              iconColor="text-red-400"
              iconBg="bg-red-500/10"
              title="Kritik İlk Kayıtlar"
              action={<LinkAction href="/yapim/service-boxes" />}
            />
            <div className="divide-y divide-slate-700/25">
              {criticalBoxes.slice(0, 5).map((box) => (
                <Link
                  key={box.id}
                  href={`/yapim/service-boxes/${box.id}`}
                  className="flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-slate-700/20 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-100 leading-tight">{box.connectionObject}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{box.address}</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-700/50 border border-slate-600/30 text-[10px] text-slate-400 font-medium">{box.district}</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-700/50 border border-slate-600/30 text-[10px] text-slate-400 font-medium">{box.sectorRegionInfo}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 rounded-xl bg-red-500/15 border border-red-500/25 px-3 py-2 text-center min-w-[52px]">
                    <div className="text-base font-black text-red-300">{box.waitingDays}</div>
                    <div className="text-[9px] font-bold text-red-500 uppercase">gün</div>
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ══ Row 3: Map placeholder + Team Status ═══════════════ */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* Map placeholder */}
          <GlassCard className="lg:col-span-2 min-h-[360px] flex flex-col">
            <CardHeader
              icon={MapPin}
              iconColor="text-teal-400"
              iconBg="bg-teal-500/10"
              title="Güncel Saha Operasyonu"
              action={
                <Link
                  href="/yapim/map"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-500/10 border border-teal-500/20 text-teal-300 hover:bg-teal-500/20 transition-all"
                >
                  Tam Harita <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
            <div className="flex-1 flex items-center justify-center bg-slate-900/30">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Harita modülü ayrı ekranda hazır</p>
                <Link href="/yapim/map" className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 mt-2 font-medium">
                  Haritaya Git <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </GlassCard>

          {/* Team Status */}
          <TeamStatus teams={teams} />
        </div>

        {/* ══ Row 4: Field Reports ════════════════════════════════ */}
        <GlassCard>
          <CardHeader
            icon={Zap}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
            title="Bugünkü Saha Bildirimleri"
            action={<LinkAction href="/yapim/field-reports" label="Tüm Bildirimler" />}
          />
          <div className="divide-y divide-slate-700/25">
            {reports.length === 0 && (
              <div className="py-10 text-center text-slate-600 text-sm">Bildirim bulunamadı</div>
            )}
            {reports.map((report) => (
              <div key={report.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-700/15 transition-colors">
                {/* Time pill */}
                <div className="flex-shrink-0 text-center">
                  <div className="text-xs font-bold text-slate-300">{report.time}</div>
                  <div className={`mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold ${
                    report.reportType === 'MORNING'
                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    {report.reportType === 'MORNING' ? 'Başlama' : 'Bitiş'}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">
                      {report.teamId.replace('team-0', 'Ekip ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{report.address}</div>
                  <div className="text-[11px] font-semibold text-slate-300 mt-0.5">
                    {report.workType}{report.productionMeters ? ` — ${report.productionMeters}m` : ''}
                  </div>
                </div>

                {/* Production badge */}
                {report.productionMeters ? (
                  <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-bold text-indigo-300">
                    <Activity className="h-3 w-3" />
                    {report.productionMeters}m
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
