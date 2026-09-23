'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowUpRight, BarChart3, Box,
  Clock, FileWarning, MapPin, ShieldAlert,
  TrendingUp, Users, Activity, Zap, ChevronRight,
  HardHat, QrCode, Layers, CheckCircle2, Flame,
  Compass, ArrowRight, ShieldCheck, RefreshCw
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

/* ── Reusable card wrappers ─────────────────────────────────────── */
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-700/40 bg-slate-800/50 backdrop-blur-sm overflow-hidden ${className}`}>
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
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/30">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-100">{title}</span>
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
      // En uzun bekleyen ve henüz tamamlanmamış kritik kutular
      const sortedCritical = [...boxes]
        .filter((b) => b.lastStatus !== 'Tamamlandı')
        .sort((a, b) => b.waitingDays - a.waitingDays);
      setCriticalBoxes(sortedCritical.slice(0, 6));

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
  const overdueBoxes      = allBoxes.filter((b) => b.waitingDays >= 90 && b.lastStatus !== 'Tamamlandı').length; // Yasal limit aşımı
  const nearLimitBoxes    = allBoxes.filter((b) => b.waitingDays >= 60 && b.waitingDays < 90 && b.lastStatus !== 'Tamamlandı').length; // Yaklaşan risk
  const unassignedBoxes   = allBoxes.filter((b) => !b.lastStatus || b.lastStatus === 'Bekliyor').length;
  const activeTeamsCount  = teams.filter((t) => t.status === 'Aktif').length;
  const completionPercent = formatPercent(completedBoxes, totalBoxes);

  // Canlı Toplam Metraj (FieldReports + WorkSessions)
  const reportMeters  = reports.reduce((acc, r) => acc + (r.productionMeters || 0), 0);
  const sessionMeters = workSessions.reduce((acc, ws) => acc + (ws.quantityMeters || 0), 0);
  const totalMeters   = reportMeters + sessionMeters;

  // İmalat Türlerine Göre Metrajlar
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

  // SLA ve Bekleme Süresi İstatistikleri
  const averageWaiting = totalBoxes ? Math.round(allBoxes.reduce((s, b) => s + b.waitingDays, 0) / totalBoxes) : 0;
  const maxWaitingBox  = [...allBoxes].sort((a, b) => b.waitingDays - a.waitingDays)[0];

  // SLA Yaşlandırma Kademeleri (EPDK Yasal Süreçlerine Göre)
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

  // İlçe Bazlı Operasyonel Analiz
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

  // Extended KPIs for KPICards
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-[1600px] space-y-6 p-5 sm:p-7">

        {/* ══ 1. HERO OPERATIONAL BANNER ════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/60 backdrop-blur-md shadow-2xl">
          {/* Ambient decorative lighting */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/5 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
            <div className="absolute top-1/2 right-10 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-[1.55fr_1fr]">
            {/* Left Col: Operations Control Center */}
            <div className="p-6 sm:p-8 border-b border-slate-700/30 lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  Canlı Saha Senkronizasyonu
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Bölge: <span className="text-slate-200 font-semibold">Antalya Doğalgaz Dağıtım</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">
                SAHA YAPIM & OPERASYON MERKEZİ
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed mb-6">
                Servis kutusu bağlantı SLA süreleri, EPDK yasal limit takipleri, aktif saha ekipleri ve gerçekleşen günlük imalat metrajları.
              </p>

              {/* 4 Strategic Primary Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    90+ Gün Yasal Aşım
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-red-300">{overdueBoxes}</div>
                  <div className="text-[10px] text-red-400/80 mt-1 font-medium">EPDK Cezai Risk</div>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                    <Clock className="h-3.5 w-3.5" />
                    60–90 Gün Eşik
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300">{nearLimitBoxes}</div>
                  <div className="text-[10px] text-amber-400/80 mt-1 font-medium">Acil İş Emri Adayı</div>
                </div>

                <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
                    <Activity className="h-3.5 w-3.5" />
                    Bugünkü Metraj
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-300">{totalMeters}m</div>
                  <div className="text-[10px] text-indigo-400/80 mt-1 font-medium">PE ve Servis Hatları</div>
                </div>

                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    <Users className="h-3.5 w-3.5" />
                    Saha Kapasitesi
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300">
                    {teams.length ? `%${Math.round((activeTeamsCount / teams.length) * 100)}` : '0%'}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 mt-1 font-medium">
                    {activeTeamsCount} / {teams.length} Ekip Görevde
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: SLA Risk & Fast Action Panel */}
            <div className="p-6 sm:p-8 bg-slate-900/50 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">
                      SLA Bağlantı Radarı
                    </p>
                    <p className="text-3xl sm:text-4xl font-black text-white">
                      {averageWaiting} <span className="text-lg font-semibold text-slate-400">gün ortalama</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Abone başvurusundan montaja geçen süre</p>
                  </div>

                  <Link
                    href="/yapim/service-boxes"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600/30 border border-blue-500/40 hover:bg-blue-600/50 transition-all shadow-lg shadow-blue-500/10"
                  >
                    Kutular <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Longest waiting box snippet */}
                <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-800/70 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">En Uzun Bekleyen Abone</span>
                    <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 font-black">
                      {maxWaitingBox ? `${maxWaitingBox.waitingDays} GÜN` : '—'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {maxWaitingBox?.name || maxWaitingBox?.connectionObject || 'Kayıt bulunmuyor'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {maxWaitingBox ? `${maxWaitingBox.district} — ${maxWaitingBox.address}` : '—'}
                  </div>
                </div>
              </div>

              {/* Fast Module Navigations */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/30">
                <Link
                  href="/yapim/map"
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-700/40 hover:border-teal-500/30 transition-all text-center group"
                >
                  <MapPin className="h-4 w-4 text-teal-400 group-hover:scale-110 transition-transform mb-1" />
                  <span className="text-[11px] font-semibold text-slate-200">Saha Haritası</span>
                  <span className="text-[9px] text-slate-500">Coğrafi Takip</span>
                </Link>

                <Link
                  href="/yapim/qr"
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-700/40 hover:border-purple-500/30 transition-all text-center group"
                >
                  <QrCode className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform mb-1" />
                  <span className="text-[11px] font-semibold text-slate-200">QR İş Emri</span>
                  <span className="text-[9px] text-slate-500">{qrPackages.length} Paket</span>
                </Link>

                <Link
                  href="/yapim/field-reports"
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:bg-slate-700/40 hover:border-amber-500/30 transition-all text-center group"
                >
                  <Zap className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform mb-1" />
                  <span className="text-[11px] font-semibold text-slate-200">Raporlar</span>
                  <span className="text-[9px] text-slate-500">{reports.length} Bildirim</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ══ 2. 6-CARD OPERATIONAL METRICS STRIP ══════════════════════ */}
        {loading ? (
          <div className="flex h-24 items-center justify-center text-slate-500 gap-3">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            Operasyon verileri yükleniyor...
          </div>
        ) : (
          <KPICards kpis={extendedKpis} />
        )}

        {/* ══ 3. ROW: DISTRICT MATRIX + PRODUCTION TYPES ═══════════════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* District Operational Workload Matrix (2 Cols) */}
          <GlassCard className="lg:col-span-2">
            <CardHeader
              icon={MapPin}
              iconColor="text-teal-400"
              iconBg="bg-teal-500/10"
              title="İlçe Bazlı Yapım Yükü & Risk Dağılımı"
              subtitle="Antalya ilçelerine göre servis kutusu stoku, geciken aboneler ve görevli ekipler"
              action={<LinkAction href="/yapim/service-boxes" label="Kutulara Git" />}
            />
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700/40 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <th className="pb-3 pl-2">İlçe</th>
                    <th className="pb-3 text-center">Toplam Kutu</th>
                    <th className="pb-3 text-center">90+ Gün (Risk)</th>
                    <th className="pb-3 text-center">Tamamlanan</th>
                    <th className="pb-3 text-center">İlerleme</th>
                    <th className="pb-3 text-center">Aktif Ekip</th>
                    <th className="pb-3 text-right pr-2">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/25">
                  {districtMatrix.map((dist) => (
                    <tr key={dist.name} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 pl-2 font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {dist.name}
                      </td>
                      <td className="py-3 text-center font-bold text-slate-200">
                        {dist.total}
                      </td>
                      <td className="py-3 text-center">
                        {dist.overdue > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-300 font-extrabold text-[11px]">
                            {dist.overdue}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">0</span>
                        )}
                      </td>
                      <td className="py-3 text-center text-slate-300">
                        {dist.completed}
                      </td>
                      <td className="py-3 text-center min-w-[120px]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
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
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <Users className="h-3 w-3" />
                          {dist.teamsCount} Ekip
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2">
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

          {/* Daily Production by Work Type (1 Col) */}
          <GlassCard>
            <CardHeader
              icon={Activity}
              iconColor="text-indigo-400"
              iconBg="bg-indigo-500/10"
              title="İmalat Türleri & Metraj"
              subtitle="Canlı saha seansları ve imalat dökümü"
              action={<LinkAction href="/yapim/field-reports" label="Detay" />}
            />
            <div className="p-5 space-y-4">
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

              {/* Kutu Montajı */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Servis Kutusu Montajı
                  </span>
                  <span className="font-black text-purple-300">{completedBoxes} adet</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: completionPercent }}
                  />
                </div>
              </div>

              {/* Total Mini Stat Card */}
              <div className="pt-3 border-t border-slate-700/30 flex items-center justify-between bg-slate-900/40 p-3 rounded-xl mt-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Günlük Toplam</div>
                  <div className="text-lg font-black text-white mt-0.5">{totalMeters} m Hat</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif Oturum</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    {workSessions.filter((ws) => ws.status === 'IN_PROGRESS').length} Vardiya
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ══ 4. ROW: SLA AGING BANDS + CRITICAL ACTION BOXES ══════════ */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">

          {/* SLA Yaşlandırma Analizi (EPDK Süreçleri) */}
          <GlassCard>
            <CardHeader
              icon={BarChart3}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/10"
              title="Yasal SLA & Bekleme Süresi Yaşlandırması"
              subtitle="EPDK bağlantı anlaşması mevzuat limitlerine göre kutu dağılımı"
              action={<LinkAction href="/yapim/service-boxes" label="Tüm Servis Kutuları" />}
            />
            <div className="p-5 space-y-4">
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
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-700/50">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${band.bar} transition-all duration-700`}
                      style={{ width: band.pct }}
                    />
                  </div>
                </div>
              ))}

              {/* Bottom 3 Summary Pillars */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-700/30">
                <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Portföy</div>
                  <div className="text-xl font-black text-white mt-1">{totalBoxes}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">abone bağlantısı</div>
                </div>

                <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ortalama Süre</div>
                  <div className="text-xl font-black text-white mt-1">{averageWaiting} Gün</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">bağlantı süresi</div>
                </div>

                <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-3 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Montaj Başarısı</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">{completionPercent}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{completedBoxes} kutu hazır</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Acil Müdahale & Yasal Limit Aşımı Listesi (90+ Gün) */}
          <GlassCard>
            <CardHeader
              icon={AlertTriangle}
              iconColor="text-red-400"
              iconBg="bg-red-500/10"
              title="Acil Müdahale Listesi (90+ Gün)"
              subtitle="Yasal süresi dolan öncelikli servis kutuları"
              action={<LinkAction href="/yapim/service-boxes" label="Tümü" />}
            />
            <div className="divide-y divide-slate-700/25">
              {criticalBoxes.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Yasal süresi aşan kritik kutu bulunmuyor.
                </div>
              )}
              {criticalBoxes.map((box) => (
                <Link
                  key={box.id}
                  href={`/yapim/service-boxes`}
                  className="flex items-start justify-between gap-3 p-4 hover:bg-slate-700/25 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 group-hover:text-red-400 transition-colors">
                        {box.connectionObject}
                      </span>
                      {box.name && (
                        <span className="text-[11px] text-slate-400 truncate">
                          ({box.name})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-1">
                      {box.address}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600/30 text-[10px] font-semibold text-slate-300">
                        {box.district}
                      </span>
                      {box.sectorRegionInfo && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-600/30 text-[10px] text-slate-400">
                          Sektör: {box.sectorRegionInfo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-center rounded-xl bg-red-500/15 border border-red-500/25 px-3 py-2 min-w-[58px]">
                    <div className="text-base font-black text-red-300 leading-none">{box.waitingDays}</div>
                    <div className="text-[9px] font-bold text-red-400 uppercase mt-1">GÜN</div>
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ══ 5. ROW: LIVE FIELD TEAMS & SHIFT REPORTS ═════════════════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">

          {/* Team Status & Supervision Component */}
          <TeamStatus teams={teams} />

          {/* Field Notifications & Shift Timeline */}
          <GlassCard>
            <CardHeader
              icon={Zap}
              iconColor="text-amber-400"
              iconBg="bg-amber-500/10"
              title="Bugünkü Saha Bildirimleri & Olay Akışı"
              subtitle="Ekiplerden anlık gelen başlama, bitiş ve metraj bildirimleri"
              action={<LinkAction href="/yapim/field-reports" label="Tüm Raporlar" />}
            />
            <div className="divide-y divide-slate-700/25 max-h-[480px] overflow-y-auto">
              {reports.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Bugüne ait saha bildirimi bulunamadı.
                </div>
              )}
              {reports.map((report) => (
                <div key={report.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-700/20 transition-colors">
                  {/* Time pill */}
                  <div className="flex-shrink-0 text-center min-w-[54px]">
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

      </div>
    </div>
  );
}
