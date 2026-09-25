'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, MapPin, ShieldAlert,
  Users, Activity, Zap, ChevronRight,
  QrCode, RefreshCw, LayoutDashboard, Radio
} from 'lucide-react';
import { KPICards, ExtendedDashboardKPIs } from '@/components/dashboard/KPICards';
import { TeamStatus } from '@/components/dashboard/TeamStatus';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { teamService } from '@/lib/services/teamService';
import { fieldReportService } from '@/lib/services/fieldReportService';
import { workSessionService } from '@/lib/services/workSessionService';
import { qrService } from '@/lib/services/qrService';
import { FieldReport, FieldTeam, ServiceBox, WorkSession, QRPackage } from '@/types';

function formatPercent(value: number, total: number) {
  if (!total) return '0%';
  return `%${Math.round((value / total) * 100)}`;
}

/* ── Reusable card components ───────────────────────────────────── */
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  action
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/30">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg ${iconBg} border border-slate-700/30`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-100">{title}</span>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function LinkAction({ href, label = 'Tümünü Gör' }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
    >
      {label} <ChevronRight className="h-3 w-3" />
    </Link>
  );
}

/* ══ Main Page ════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [allBoxes, setAllBoxes]         = useState<ServiceBox[]>([]);
  const [criticalBoxes, setCriticalBoxes] = useState<ServiceBox[]>([]);
  const [teams, setTeams]               = useState<FieldTeam[]>([]);
  const [reports, setReports]           = useState<FieldReport[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [qrPackages, setQrPackages]     = useState<QRPackage[]>([]);
  const [loading, setLoading]           = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'teams_reports'>('overview');
  const [analysisSubTab, setAnalysisSubTab] = useState<'sla' | 'meters'>('sla');

  async function loadData() {
    setLoading(true);
    try {
      const [serviceBoxes, allTeams, allReports, allSessions, allQrs] = await Promise.all([
        serviceBoxService.getServiceBoxes(),
        teamService.getTeams(),
        fieldReportService.getFieldReports(),
        workSessionService.getWorkSessions(),
        qrService.getQrPackages(),
      ]);

      let boxes = serviceBoxes;
      try {
        const cached = localStorage.getItem('enerya_service_boxes');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) boxes = parsed;
        }
      } catch {}

      setAllBoxes(boxes);
      const sortedCritical = [...boxes]
        .filter((b) => !b.lastStatus || b.lastStatus.trim() === '')
        .sort((a, b) => b.waitingDays - a.waitingDays);
      setCriticalBoxes(sortedCritical.slice(0, 10));

      setTeams(allTeams);
      setReports(allReports);
      setWorkSessions(allSessions);
      setQrPackages(allQrs);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ── Calculations & Metrics ────────────────────────────────────── */
  const totalBoxes        = allBoxes.length;
  const completedBoxes    = allBoxes.filter((b) => b.lastStatus === 'Tamamlandı').length;
  const overdueBoxes      = allBoxes.filter((b) => b.waitingDays >= 90 && b.lastStatus !== 'Tamamlandı').length;
  const nearLimitBoxes    = allBoxes.filter((b) => b.waitingDays >= 60 && b.waitingDays < 90 && b.lastStatus !== 'Tamamlandı').length;
  const unassignedBoxes   = allBoxes.filter((b) => !b.lastStatus || b.lastStatus === 'Bekliyor').length;
  const activeTeamsCount  = teams.filter((t) => t.status === 'Aktif').length;
  const completionPercent = formatPercent(completedBoxes, totalBoxes);

  const reportMeters  = reports.reduce((acc, r) => acc + (r.productionMeters || 0), 0);
  const sessionMeters = workSessions.reduce((acc, ws) => acc + (ws.quantityMeters || 0), 0);
  const totalMeters   = reportMeters + sessionMeters;

  const peHatMeters = reports
    .filter((r) => r.workType === 'PE Ana Hat')
    .reduce((s, r) => s + (r.productionMeters || 0), 0) +
    workSessions
    .filter((ws) => ws.workType === 'PE Ana Hat')
    .reduce((s, ws) => s + (ws.quantityMeters || 0), 0);

  const servisHattiMeters = reports
    .filter((r) => r.workType === 'Servis Hattı')
    .reduce((s, r) => s + (r.productionMeters || 0), 0) +
    workSessions
    .filter((ws) => ws.workType === 'Servis Hattı')
    .reduce((s, ws) => s + (ws.quantityMeters || 0), 0);

  const celikHatMeters = reports
    .filter((r) => r.workType === 'ST Çelik Hat')
    .reduce((s, r) => s + (r.productionMeters || 0), 0) +
    workSessions
    .filter((ws) => ws.workType === 'ST Çelik Hat')
    .reduce((s, ws) => s + (ws.quantityMeters || 0), 0);

  const averageWaiting = totalBoxes ? Math.round(allBoxes.reduce((s, b) => s + b.waitingDays, 0) / totalBoxes) : 0;
  const maxWaitingBox  = [...allBoxes].sort((a, b) => b.waitingDays - a.waitingDays)[0];

  const slaBands = [
    {
      label: '90+ Gün (Yasal Limit Aşımı)',
      count: overdueBoxes,
      pct: formatPercent(overdueBoxes, totalBoxes),
      bar: 'from-red-500 to-rose-400',
      badge: 'Cezai Risk',
      badgeClass: 'bg-red-500/15 text-red-300 border-red-500/25',
    },
    {
      label: '60–90 Gün (Kritik Eşik)',
      count: nearLimitBoxes,
      pct: formatPercent(nearLimitBoxes, totalBoxes),
      bar: 'from-amber-500 to-orange-400',
      badge: 'Acil Program',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    },
    {
      label: '30–60 Gün (Planlama & İmalat)',
      count: allBoxes.filter((b) => b.waitingDays >= 30 && b.waitingDays < 60 && b.lastStatus !== 'Tamamlandı').length,
      pct: formatPercent(allBoxes.filter((b) => b.waitingDays >= 30 && b.waitingDays < 60 && b.lastStatus !== 'Tamamlandı').length, totalBoxes),
      bar: 'from-blue-500 to-cyan-400',
      badge: 'Süreçte',
      badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    },
    {
      label: '0–30 Gün (Yeni Başvurular)',
      count: allBoxes.filter((b) => b.waitingDays < 30 && b.lastStatus !== 'Tamamlandı').length,
      pct: formatPercent(allBoxes.filter((b) => b.waitingDays < 30 && b.lastStatus !== 'Tamamlandı').length, totalBoxes),
      bar: 'from-emerald-500 to-teal-400',
      badge: 'Güvenli Bölge',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    },
  ];

  const districtList = ['Kepez', 'Muratpaşa', 'Konyaaltı', 'Döşemealtı', 'Aksu', 'Serik'];
  const districtMatrix = districtList.map((dist) => {
    const distBoxes     = allBoxes.filter((b) => b.district?.toLowerCase().includes(dist.toLowerCase()));
    const distOverdue   = distBoxes.filter((b) => b.waitingDays >= 90 && b.lastStatus !== 'Tamamlandı').length;
    const distCompleted = distBoxes.filter((b) => b.lastStatus === 'Tamamlandı').length;
    const distTeams     = teams.filter((t) => t.district?.toLowerCase().includes(dist.toLowerCase()));
    const distPercent   = distBoxes.length ? Math.round((distCompleted / distBoxes.length) * 100) : 0;

    let riskLevel = 'Normal';
    let riskClass = 'text-slate-400 bg-slate-700/40 border-slate-600/30';
    if (distOverdue > 10) {
      riskLevel = 'Yüksek Risk';
      riskClass = 'text-red-300 bg-red-500/15 border-red-500/25';
    } else if (distOverdue > 0) {
      riskLevel = 'Takipte';
      riskClass = 'text-amber-300 bg-amber-500/15 border-amber-500/25';
    } else if (distCompleted > 0) {
      riskLevel = 'Dengeli';
      riskClass = 'text-emerald-300 bg-emerald-500/15 border-emerald-500/25';
    }

    return {
      name: dist,
      total: distBoxes.length,
      overdue: distOverdue,
      completed: distCompleted,
      completionRate: distPercent,
      teamsCount: distTeams.length,
      riskLevel,
      riskClass,
    };
  }).filter((d) => d.total > 0 || d.teamsCount > 0);

  const boxInstallationsCount = workSessions
    .filter((ws) => ws.status === 'COMPLETED' && ws.workType.toLowerCase().includes('kutu'))
    .reduce((acc, ws) => acc + (ws.quantityMeters || 0), 0);
  const totalInstalledBoxes = completedBoxes + boxInstallationsCount;

  const extendedKpis: ExtendedDashboardKPIs = {
    totalServiceBoxes: totalBoxes,
    completedBoxes,
    completionRate: completionPercent,
    overdueBoxes,
    nearLimitBoxes,
    activeTeams: activeTeamsCount,
    totalTeams: teams.length,
    todayProductionMeters: totalMeters,
    unassignedBoxes,
    installedBoxCount: totalInstalledBoxes,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">

        {/* ══ HEADER BAR ══════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">SAHA YAPIM & OPERASYON MERKEZİ</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                Canlı Saha Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Antalya Bölgesi • Servis kutusu SLA takibi, EPDK yasal limitleri ve canlı saha aksiyonları
            </p>
          </div>

          {/* Quick Module Shortcut Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/yapim/map"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 hover:text-white transition-all shadow-sm"
            >
              <MapPin className="h-3.5 w-3.5 text-teal-400" />
              Saha Haritası
            </Link>
            <Link
              href="/yapim/qr"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 hover:text-white transition-all shadow-sm"
            >
              <QrCode className="h-3.5 w-3.5 text-purple-400" />
              QR İş Emri ({qrPackages.length})
            </Link>
            <Link
              href="/yapim/field-reports"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 hover:text-white transition-all shadow-sm"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Raporlar ({reports.length})
            </Link>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/50 hover:text-slate-200 transition-all"
              title="Yenile"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* ══ 5-KPI STRIP ═════════════════════════════════════════════════ */}
        {loading ? (
          <div className="flex h-20 items-center justify-center text-slate-500 gap-3 bg-slate-900/40 rounded-2xl border border-slate-800">
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-xs">Operasyon verileri güncelleniyor...</span>
          </div>
        ) : (
          <KPICards kpis={extendedKpis} />
        )}

        {/* ══ TAB NAVIGATION BAR ══════════════════════════════════════════ */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300 shadow-md shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Operasyonel Analiz & İlçe Matrisi
            </button>
            <button
              onClick={() => setActiveTab('teams_reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'teams_reports'
                  ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300 shadow-md shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              Saha Akışı & Ekipler ({teams.length} Ekip, {reports.length} Rapor)
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block font-medium">
            Ortalama SLA Bağlantı Süresi: <span className="font-bold text-slate-100">{averageWaiting} Gün</span>
          </div>
        </div>

        {/* ══ TAB 1: OPERASYONEL ANALİZ ═══════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Left 2 Cols: District Matrix & Dual Analysis Widget */}
            <div className="lg:col-span-2 space-y-6">

              {/* District Operational Workload Matrix */}
              <GlassCard>
                <CardHeader
                  icon={MapPin}
                  iconColor="text-teal-400"
                  iconBg="bg-teal-500/10"
                  title="İlçe Bazlı Yapım Yükü & Risk Dağılımı"
                  subtitle="Antalya ilçelerine göre servis kutusu stoku, geciken aboneler ve aktif ekipler"
                  action={<LinkAction href="/yapim/service-boxes" label="Tüm Kutular" />}
                />
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/40 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        <th className="pb-2.5 pl-2">İlçe</th>
                        <th className="pb-2.5 text-center">Toplam Kutu</th>
                        <th className="pb-2.5 text-center">90+ Gün (Risk)</th>
                        <th className="pb-2.5 text-center">Tamamlanan</th>
                        <th className="pb-2.5 text-center">İlerleme</th>
                        <th className="pb-2.5 text-center">Aktif Ekip</th>
                        <th className="pb-2.5 text-right pr-2">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/25">
                      {districtMatrix.map((dist) => (
                        <tr key={dist.name} className="hover:bg-slate-700/20 transition-colors">
                          <td className="py-2.5 pl-2 font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {dist.name}
                          </td>
                          <td className="py-2.5 text-center font-bold text-slate-200">
                            {dist.total}
                          </td>
                          <td className="py-2.5 text-center">
                            {dist.overdue > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-300 font-extrabold text-[11px]">
                                {dist.overdue}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium">0</span>
                            )}
                          </td>
                          <td className="py-2.5 text-center text-slate-300 font-medium">
                            {dist.completed}
                          </td>
                          <td className="py-2.5 text-center min-w-[110px]">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-14 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                                  style={{ width: `${dist.completionRate}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-300">
                                %{dist.completionRate}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <Users className="h-3 w-3" />
                              {dist.teamsCount} Ekip
                            </span>
                          </td>
                          <td className="py-2.5 text-right pr-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${dist.riskClass}`}>
                              {dist.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* Dual Analysis Widget: SLA Age Bands & Work Type Production */}
              <GlassCard>
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/30 bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAnalysisSubTab('sla')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        analysisSubTab === 'sla'
                          ? 'bg-blue-600/30 border border-blue-500/40 text-blue-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      EPDK Yasal SLA Yaşlandırması
                    </button>
                    <button
                      onClick={() => setAnalysisSubTab('meters')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        analysisSubTab === 'meters'
                          ? 'bg-blue-600/30 border border-blue-500/40 text-blue-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      İmalat Türleri & Metraj Dökümü
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Analiz Görünümü
                  </span>
                </div>

                <div className="p-5">
                  {analysisSubTab === 'sla' ? (
                    <div className="space-y-3.5">
                      {slaBands.map((band) => (
                        <div key={band.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200">{band.label}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${band.badgeClass}`}>
                                {band.badge}
                              </span>
                            </div>
                            <span className="font-bold text-slate-100">
                              {band.count} <span className="font-normal text-slate-400">kutu</span>
                              <span className="ml-1.5 text-slate-400 font-semibold">({band.pct})</span>
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
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* PE Hat */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            PE Ana Hat İmalatı
                          </span>
                          <span className="font-black text-blue-300">{peHatMeters} m</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                            style={{ width: `${Math.min(100, totalMeters ? (peHatMeters / totalMeters) * 100 : 0)}%` }}
                          />
                        </div>
                      </div>

                      {/* Servis Hattı */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Servis Hattı Çekimi
                          </span>
                          <span className="font-black text-emerald-300">{servisHattiMeters} m</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{ width: `${Math.min(100, totalMeters ? (servisHattiMeters / totalMeters) * 100 : 0)}%` }}
                          />
                        </div>
                      </div>

                      {/* ST Çelik Hat */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            ST Çelik Hat İmalatı
                          </span>
                          <span className="font-black text-amber-300">{celikHatMeters} m</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                            style={{ width: `${Math.min(100, totalMeters ? (celikHatMeters / totalMeters) * 100 : 0)}%` }}
                          />
                        </div>
                      </div>

                      {/* Total Bar */}
                      <div className="pt-3 border-t border-slate-700/30 flex items-center justify-between bg-slate-950/40 p-3 rounded-xl">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bugünkü Toplam</div>
                          <div className="text-base font-black text-white mt-0.5">{totalMeters} m Hat</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Montajı Biten Kutu</div>
                          <div className="text-base font-black text-emerald-400 mt-0.5">{totalInstalledBoxes} Adet</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>

            </div>

            {/* Right 1 Col: Urgent List & Executive Summary Card */}
            <div className="space-y-6">

              {/* Acil Müdahale Listesi (Durumu Boş - Top 10) */}
              <GlassCard>
                <CardHeader
                  icon={AlertTriangle}
                  iconColor="text-red-400"
                  iconBg="bg-red-500/10"
                  title="Acil Müdahale Listesi (Durumu Boş)"
                  subtitle="Son durumu henüz girilmemiş en çok bekleyen 10 servis kutusu"
                  action={<LinkAction href="/yapim/service-boxes" label="Tümü" />}
                />
                <div className="divide-y divide-slate-700/25 max-h-[460px] overflow-y-auto">
                  {criticalBoxes.length === 0 && (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      Son durumu boş olan kritik kutu bulunmuyor.
                    </div>
                  )}
                  {criticalBoxes.map((box) => (
                    <Link
                      key={box.id}
                      href={`/yapim/service-boxes`}
                      className="flex items-start justify-between gap-3 p-3.5 hover:bg-slate-700/20 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 group-hover:text-red-400 transition-colors truncate">
                            {box.connectionObject}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {box.name || box.address}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300">
                            {box.district}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-center rounded-xl bg-red-500/15 border border-red-500/25 px-2.5 py-1.5 min-w-[50px]">
                        <div className="text-sm font-black text-red-300 leading-none">{box.waitingDays}</div>
                        <div className="text-[8px] font-bold text-red-400 uppercase mt-0.5">GÜN</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </GlassCard>

              {/* SLA & Performance Executive Card */}
              <GlassCard className="p-4 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    SLA & Portföy Özeti
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-300">
                    EPDK Uyumlu
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400">En Uzun Bekleyen Abone</div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5 truncate max-w-[170px]">
                        {maxWaitingBox?.name || maxWaitingBox?.connectionObject || '—'}
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 font-black text-xs">
                      {maxWaitingBox ? `${maxWaitingBox.waitingDays} Gün` : '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                      <div className="text-[10px] font-semibold text-slate-400">Genel Tamamlanma</div>
                      <div className="text-base font-black text-emerald-400 mt-0.5">{completionPercent}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                      <div className="text-[10px] font-semibold text-slate-400">Ortalama Bekleme</div>
                      <div className="text-base font-black text-blue-400 mt-0.5">{averageWaiting} Gün</div>
                    </div>
                  </div>
                </div>
              </GlassCard>

            </div>

          </div>
        )}

        {/* ══ TAB 2: SAHA AKIŞI & EKİPLER ═════════════════════════════════ */}
        {activeTab === 'teams_reports' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Team Status Component */}
            <TeamStatus teams={teams} />

            {/* Field Notifications Timeline */}
            <GlassCard>
              <CardHeader
                icon={Zap}
                iconColor="text-amber-400"
                iconBg="bg-amber-500/10"
                title="Bugünkü Saha Bildirimleri & Olay Akışı"
                subtitle="Ekiplerden anlık gelen başlama, bitiş ve imalat bildirimleri"
                action={<LinkAction href="/yapim/field-reports" label="Tüm Raporlar" />}
              />
              <div className="divide-y divide-slate-700/25 max-h-[540px] overflow-y-auto">
                {reports.length === 0 && (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Bugüne ait saha bildirimi bulunamadı.
                  </div>
                )}
                {reports.map((report) => (
                  <div key={report.id} className="flex items-start gap-3.5 px-4 py-3 hover:bg-slate-700/20 transition-colors">
                    {/* Time pill */}
                    <div className="flex-shrink-0 text-center min-w-[50px]">
                      <div className="text-xs font-bold text-slate-200">{report.time}</div>
                      <div className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        report.reportType === 'MORNING'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                      }`}>
                        {report.reportType === 'MORNING' ? 'Başlama' : 'Bitiş'}
                      </div>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">
                          {report.teamId.toUpperCase().replace('TEAM-0', 'Ekip ')}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          • {report.district} ({report.neighborhood})
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {report.address}
                      </div>

                      <div className="text-[11px] font-medium text-slate-300 mt-1">
                        {report.workType}
                        {report.description && (
                          <span className="text-slate-400 font-normal ml-1">
                            — {report.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Production badge */}
                    {report.productionMeters ? (
                      <div className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-xs font-bold text-indigo-300">
                        <Activity className="h-3 w-3" />
                        {report.productionMeters}m
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>
        )}

      </div>
    </div>
  );
}

