import React from 'react';
import { InvestmentKPIs } from '@/lib/services/investmentService';
import { formatNumber } from './ExecutiveKpiStrip';
import { Activity, Target, CheckCircle2, Clock } from 'lucide-react';

interface PlanVsRealizedVisualProps {
  kpis: InvestmentKPIs;
}

export function PlanVsRealizedVisual({ kpis }: PlanVsRealizedVisualProps) {
  const completedPct = Math.min(100, Math.max(0, kpis.completionRate));

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100">
              Yatırım Gerçekleşme Durumu (Ana Yönetim Göstergesi)
            </h2>
            <p className="text-[11px] text-slate-400">
              Planlanan toplam metraj, gerçekleşen imalat ve kalan yatırım karşılaştırması
            </p>
          </div>
        </div>

        <div className="px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 font-extrabold text-xs">
          Genel Tamamlanma: %{kpis.completionRate.toFixed(1).replace('.', ',')}
        </div>
      </div>

      {/* Corporate Bullet / Stacked Progress Visualization */}
      <div className="space-y-2.5">
        {/* Metric Label Row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-slate-800/60 border border-slate-700/40 rounded-xl space-y-0.5">
            <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider block flex items-center justify-center gap-1">
              <Target className="h-3 w-3 text-blue-400" /> Planlanan
            </span>
            <strong className="text-slate-100 font-black text-sm sm:text-base">
              {formatNumber(kpis.totalPlannedPe)} m
            </strong>
          </div>

          <div className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-0.5">
            <span className="text-emerald-400/90 font-medium text-[10px] uppercase tracking-wider block flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Gerçekleşen
            </span>
            <strong className="text-emerald-300 font-black text-sm sm:text-base">
              {formatNumber(kpis.totalCompleted)} m
            </strong>
          </div>

          <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-0.5">
            <span className="text-amber-400/90 font-medium text-[10px] uppercase tracking-wider block flex items-center justify-center gap-1">
              <Clock className="h-3 w-3 text-amber-400" /> Kalan
            </span>
            <strong className="text-amber-300 font-black text-sm sm:text-base">
              {formatNumber(kpis.totalRemaining)} m
            </strong>
          </div>
        </div>

        {/* Progress Bar Graphic */}
        <div className="space-y-1">
          <div className="h-4 bg-slate-950 border border-slate-800 rounded-full overflow-hidden p-0.5 relative flex items-center shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${completedPct}%` }}
            />
          </div>

          {/* Scale Labels */}
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 px-1">
            <span>0 m (%0)</span>
            <span className="text-emerald-400 font-bold">
              {formatNumber(kpis.totalCompleted)} m (%{kpis.completionRate.toFixed(1).replace('.', ',')})
            </span>
            <span>Hedef: {formatNumber(kpis.totalPlannedPe)} m (%100)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
