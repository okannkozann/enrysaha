import React from 'react';
import { InvestmentKPIs } from '@/lib/services/investmentService';
import { Target, CheckCircle2, Clock, Percent, Layers, PieChart } from 'lucide-react';

interface ExecutiveKpiStripProps {
  kpis: InvestmentKPIs;
}

export function formatNumber(val: number): string {
  if (val < 0) {
    return `(${Math.abs(val).toLocaleString('tr-TR')})`;
  }
  return val.toLocaleString('tr-TR');
}

export function ExecutiveKpiStrip({ kpis }: ExecutiveKpiStripProps) {
  const pe63Percent = kpis.totalPlannedPe > 0 ? (kpis.totalPe63 / kpis.totalPlannedPe) * 100 : 0;
  const pe125Percent = kpis.totalPlannedPe > 0 ? (kpis.totalPe125 / kpis.totalPlannedPe) * 100 : 0;

  return (
    <div className="w-full space-y-3">
      {/* Top 4 Primary Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Toplam Planlanan Yatırım */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 backdrop-blur-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              Toplam Planlanan Yatırım
            </span>
            <div className="w-7.5 h-7.5 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Target className="h-3.5 w-3.5 text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-2xl font-black text-slate-100 tracking-tight leading-none">
              {formatNumber(kpis.totalPlannedPe)} <span className="text-xs font-normal text-slate-400">m</span>
            </span>
            <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
              Hedef Matrisi
            </span>
          </div>
        </div>

        {/* 2. Yapılan (Gerçekleşen) */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 backdrop-blur-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              Gerçekleşen Yatırım
            </span>
            <div className="w-7.5 h-7.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-2xl font-black text-emerald-400 tracking-tight leading-none">
              {formatNumber(kpis.totalCompleted)} <span className="text-xs font-normal text-emerald-500/80">m</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Saha İmalatı
            </span>
          </div>
        </div>

        {/* 3. Kalan Yatırım */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 backdrop-blur-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              Kalan Yatırım
            </span>
            <div className="w-7.5 h-7.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-2xl font-black text-amber-400 tracking-tight leading-none">
              {formatNumber(kpis.totalRemaining)} <span className="text-xs font-normal text-amber-500/80">m</span>
            </span>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              Devam Eden
            </span>
          </div>
        </div>

        {/* 4. Gerçekleşme Oranı */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 backdrop-blur-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
              Genel Gerçekleşme Oranı
            </span>
            <div className="w-7.5 h-7.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Percent className="h-3.5 w-3.5 text-indigo-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <span className="text-2xl font-black text-indigo-300 tracking-tight leading-none">
              %{kpis.completionRate.toFixed(1).replace('.', ',')}
            </span>
            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
              Yatırım Performansı
            </span>
          </div>
        </div>
      </div>

      {/* PE63 / PE125 Composition Strip (Plan Dağılımı) */}
      <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200">Planlanan İmalat Bileşimi (Boru Çapı Dağılımı)</span>
            <p className="text-[11px] text-slate-400">PE63 ve PE125 boru tipi bazlı yatırım hedefleri</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs">
          {/* PE63 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-slate-400 font-medium">PE63:</span>
            <strong className="text-slate-100 font-bold">{formatNumber(kpis.totalPe63)} m</strong>
            <span className="text-[10px] text-blue-400 font-semibold">({pe63Percent.toFixed(1).replace('.', ',')}%)</span>
          </div>

          {/* PE125 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-400 font-medium">PE125:</span>
            <strong className="text-slate-100 font-bold">{formatNumber(kpis.totalPe125)} m</strong>
            <span className="text-[10px] text-cyan-400 font-semibold">({pe125Percent.toFixed(1).replace('.', ',')}%)</span>
          </div>

          {/* Total Verification */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/25 text-emerald-300 font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Toplam: {formatNumber(kpis.totalPlannedPe)} m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
