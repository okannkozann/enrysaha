'use client';
import { useMemo } from 'react';
import { Complaint } from '@/types';
import { MessageSquareWarning, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  complaints: Complaint[];
}

export function ComplaintKpi({ complaints }: Props) {
  const stats = useMemo(() => {
    const total = complaints.length;

    // Today's date string in YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];

    // Count received today
    const todayReceived = complaints.filter((c) => c.receivedDate === todayStr).length;

    // Count planned (status === 'Planlandı' or plannedDate >= today)
    const planned = complaints.filter(
      (c) => c.status === 'Planlandı' || (c.plannedDate && c.plannedDate >= todayStr)
    ).length;

    // Count repeating (repeatCount > 0)
    const repeating = complaints.filter((c) => c.repeatCount > 0).length;

    return { total, todayReceived, planned, repeating };
  }, [complaints]);

  const cards = [
    {
      label: 'Toplam Şikayet',
      value: stats.total,
      subtext: 'Kayıtlı tüm şikayetler',
      icon: MessageSquareWarning,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      border: 'border-slate-700/50',
    },
    {
      label: 'Bugün Gelen',
      value: stats.todayReceived,
      subtext: 'Bugün oluşturulan ihbarlar',
      icon: Calendar,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      border: 'border-slate-700/50',
    },
    {
      label: 'Planlanan',
      value: stats.planned,
      subtext: 'İşleme alınan / randevulu',
      icon: Clock,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      border: 'border-slate-700/50',
    },
    {
      label: 'Tekrar Eden',
      value: stats.repeating,
      subtext: '1 veya daha fazla tekrar',
      icon: AlertTriangle,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/10',
      border: 'border-rose-500/20 bg-rose-950/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`p-3 rounded-xl border bg-slate-800/60 backdrop-blur-sm transition-all ${card.border}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg ${card.iconBg}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white tracking-tight">
                {card.value}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
