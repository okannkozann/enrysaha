'use client';
import { DashboardKPIs } from "@/types";
import { Users, CheckCircle2, Box, Activity, AlertTriangle, Clock } from "lucide-react";

const CARDS = (kpis: DashboardKPIs) => [
  {
    title: "Toplam Servis Kutusu",
    value: kpis.totalServiceBoxes,
    icon: Box,
    accent: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    glow: "rgba(59,130,246,0.2)",
  },
  {
    title: "Kritik ≤ 7 Gün",
    value: kpis.criticalUnder7Days,
    icon: AlertTriangle,
    accent: "from-red-500/20 to-red-600/5",
    border: "border-red-500/20",
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
    glow: "rgba(239,68,68,0.2)",
    sub: "Öncelikli müdahale",
  },
  {
    title: "≤ 15 Gün",
    value: kpis.under15Days,
    icon: Clock,
    accent: "from-orange-500/20 to-orange-600/5",
    border: "border-orange-500/20",
    iconBg: "bg-orange-500/15",
    iconColor: "text-orange-400",
    glow: "rgba(249,115,22,0.2)",
  },
  {
    title: "≤ 30 Gün",
    value: kpis.under30Days,
    icon: CheckCircle2,
    accent: "from-slate-500/20 to-slate-600/5",
    border: "border-slate-500/20",
    iconBg: "bg-slate-500/15",
    iconColor: "text-slate-400",
    glow: "rgba(100,116,139,0.2)",
  },
  {
    title: "Aktif Saha Ekibi",
    value: kpis.activeTeams,
    icon: Users,
    accent: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    glow: "rgba(16,185,129,0.2)",
  },
  {
    title: "Bugünkü İmalat (m)",
    value: kpis.todayProductionMeters,
    icon: Activity,
    accent: "from-indigo-500/20 to-indigo-600/5",
    border: "border-indigo-500/20",
    iconBg: "bg-indigo-500/15",
    iconColor: "text-indigo-400",
    glow: "rgba(99,102,241,0.2)",
  },
];

export function KPICards({ kpis }: { kpis: DashboardKPIs }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {CARDS(kpis).map((card, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-br ${card.accent} backdrop-blur-sm p-4 flex flex-col gap-3 group transition-all duration-300 hover:scale-[1.02]`}
          style={{ boxShadow: `0 0 20px ${card.glow}` }}
        >
          {/* Ambient corner glow */}
          <div
            className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-30"
            style={{ background: card.glow }}
          />
          <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
            <card.icon className={`h-4.5 w-4.5 ${card.iconColor}`} style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] leading-tight">{card.title}</p>
            <p className="text-2xl font-black text-white mt-1 leading-none">{card.value}</p>
            {card.sub && (
              <p className="text-[10px] text-slate-500 mt-1 font-medium">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
