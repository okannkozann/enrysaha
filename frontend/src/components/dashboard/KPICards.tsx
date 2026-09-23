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
}

export function KPICards({ kpis }: { kpis: ExtendedDashboardKPIs }) {
  const cards = [
    {
      title: "Toplam Servis Kutusu",
      value: kpis.totalServiceBoxes,
      icon: Box,
      accent: "from-blue-500/20 to-blue-600/5",
      border: "border-blue-500/25",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-400",
      glow: "rgba(59,130,246,0.2)",
      sub: `${kpis.completedBoxes} tamamlandı (${kpis.completionRate})`,
      subColor: "text-blue-300",
    },
    {
      title: "Yasal Risk (90+ Gün)",
      value: kpis.overdueBoxes,
      icon: AlertTriangle,
      accent: "from-red-500/20 to-red-600/5",
      border: "border-red-500/25",
      iconBg: "bg-red-500/15",
      iconColor: "text-red-400",
      glow: "rgba(239,68,68,0.25)",
      sub: "EPDK yasal limit aşımı",
      subColor: "text-red-300 font-semibold",
    },
    {
      title: "Kritik Eşik (60–90 Gün)",
      value: kpis.nearLimitBoxes,
      icon: Clock,
      accent: "from-amber-500/20 to-amber-600/5",
      border: "border-amber-500/25",
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400",
      glow: "rgba(245,158,11,0.2)",
      sub: "Acil iş programı adayı",
      subColor: "text-amber-300",
    },
    {
      title: "Aktif Saha Ekipleri",
      value: `${kpis.activeTeams} / ${kpis.totalTeams}`,
      icon: Users,
      accent: "from-emerald-500/20 to-emerald-600/5",
      border: "border-emerald-500/25",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      glow: "rgba(16,185,129,0.2)",
      sub: kpis.totalTeams ? `%${Math.round((kpis.activeTeams / kpis.totalTeams) * 100)} ekip sahada` : 'Ekip hazır',
      subColor: "text-emerald-300",
    },
    {
      title: "Bugünkü İmalat (m)",
      value: `${kpis.todayProductionMeters}m`,
      icon: Activity,
      accent: "from-indigo-500/20 to-indigo-600/5",
      border: "border-indigo-500/25",
      iconBg: "bg-indigo-500/15",
      iconColor: "text-indigo-400",
      glow: "rgba(99,102,241,0.2)",
      sub: "PE ve Servis Hatları",
      subColor: "text-indigo-300",
    },
    {
      title: "Atama / Durum Bekleyen",
      value: kpis.unassignedBoxes,
      icon: FileQuestion,
      accent: "from-purple-500/20 to-purple-600/5",
      border: "border-purple-500/25",
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-400",
      glow: "rgba(168,85,247,0.2)",
      sub: "Durumu girilmemiş kutu",
      subColor: "text-purple-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-2xl border ${card.border} bg-slate-800/60 backdrop-blur-sm p-4 flex flex-col justify-between group transition-all duration-300 hover:scale-[1.02] hover:bg-slate-800/80`}
          style={{ boxShadow: `0 0 24px ${card.glow}` }}
        >
          {/* Ambient corner glow */}
          <div
            className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ background: card.glow }}
          />

          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] leading-tight">
              {card.title}
            </span>
            <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
              {card.value}
            </div>
            {card.sub && (
              <div className={`text-[11px] mt-2 font-medium ${card.subColor}`}>
                {card.sub}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
