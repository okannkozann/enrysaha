'use client';
import { Box, AlertTriangle, Clock, Users, Activity, FileQuestion, CheckCircle2 } from "lucide-react";

export interface ExtendedDashboardKPIs {
  totalServiceBoxes: number;
  completedBoxes: number;
  completionRate: string;
  overdueBoxes: number;      // 90+ gün (Yasal limit aşımı)
  nearLimitBoxes: number;    // 60-90 gün (Kritik eşik)
  activeTeams: number;
  totalTeams: number;
  todayProductionMeters: number;
  unassignedBoxes: number;
  installedBoxCount?: number; // Montajı biten kutu sayısı
}

export function KPICards({ kpis }: { kpis: ExtendedDashboardKPIs }) {
  const cards = [
    {
      title: "Toplam Servis Kutusu",
      value: kpis.totalServiceBoxes,
      icon: Box,
      border: "border-blue-500/30",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      glow: "rgba(59,130,246,0.15)",
      sub: `${kpis.completedBoxes} aktif montaj`,
      subColor: "text-blue-300",
    },
    {
      title: "Montajı Biten Kutu",
      value: `${kpis.installedBoxCount ?? kpis.completedBoxes} Adet`,
      icon: CheckCircle2,
      border: "border-emerald-500/30",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      glow: "rgba(16,185,129,0.2)",
      sub: "Tamamlanan Kutu Montajı",
      subColor: "text-emerald-300 font-bold",
    },
    {
      title: "Yasal Risk (90+ Gün)",
      value: kpis.overdueBoxes,
      icon: AlertTriangle,
      border: "border-red-500/30",
      iconBg: "bg-red-500/15",
      iconColor: "text-red-400",
      glow: "rgba(239,68,68,0.2)",
      sub: "EPDK Yasal Limit Aşımı",
      subColor: "text-red-300 font-semibold",
    },
    {
      title: "Bugünkü İmalat",
      value: `${kpis.todayProductionMeters}m`,
      icon: Activity,
      border: "border-indigo-500/30",
      iconBg: "bg-indigo-500/15",
      iconColor: "text-indigo-400",
      glow: "rgba(99,102,241,0.15)",
      sub: "PE ve Servis Hatları",
      subColor: "text-indigo-300",
    },
    {
      title: "Aktif Saha Ekipleri",
      value: `${kpis.activeTeams} / ${kpis.totalTeams}`,
      icon: Users,
      border: "border-violet-500/30",
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-400",
      glow: "rgba(139,92,246,0.15)",
      sub: kpis.totalTeams ? `%${Math.round((kpis.activeTeams / kpis.totalTeams) * 100)} ekip sahada` : 'Ekip hazır',
      subColor: "text-violet-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-2xl border ${card.border} bg-slate-900/60 backdrop-blur-md p-4 flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] hover:bg-slate-800/80`}
          style={{ boxShadow: `0 4px 20px -2px ${card.glow}` }}
        >
          {/* Ambient corner glow */}
          <div
            className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-25 pointer-events-none"
            style={{ background: card.glow }}
          />

          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">
              {card.title}
            </span>
            <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0 border border-slate-700/30`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight leading-none">
              {card.value}
            </div>
            {card.sub && (
              <div className={`text-xs mt-2 font-medium ${card.subColor}`}>
                {card.sub}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
