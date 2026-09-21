import { Card, CardContent } from "@/components/ui/card";
import { DashboardKPIs } from "@/types";
import { Users, CheckCircle2, Box, Activity, AlertTriangle, Clock } from "lucide-react";

export function KPICards({ kpis }: { kpis: DashboardKPIs }) {
  const cards = [
    {
      title: "Toplam Servis Kutusu",
      value: kpis.totalServiceBoxes,
      icon: Box,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Kritik ≤ 7 Gün",
      value: kpis.criticalUnder7Days,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: "Öncelikli müdahale gerektirir",
    },
    {
      title: "≤ 15 Gün",
      value: kpis.under15Days,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "≤ 30 Gün",
      value: kpis.under30Days,
      icon: CheckCircle2,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
    },
    {
      title: "Aktif Saha Ekibi",
      value: kpis.activeTeams,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Bugünkü İmalat (m)",
      value: kpis.todayProductionMeters,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx} className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex flex-col items-start gap-3">
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{card.value}</h3>
              {card.trend && <p className="text-[10px] text-red-500 mt-1 font-medium">{card.trend}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
