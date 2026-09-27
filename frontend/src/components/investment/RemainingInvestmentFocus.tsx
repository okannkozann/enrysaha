import React from 'react';
import { DistrictInvestmentSummary } from '@/lib/services/investmentService';
import { formatNumber } from './ExecutiveKpiStrip';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface RemainingInvestmentFocusProps {
  summaries: DistrictInvestmentSummary[];
  onSelectDistrict?: (district: string) => void;
}

export function RemainingInvestmentFocus({
  summaries,
  onSelectDistrict,
}: RemainingInvestmentFocusProps) {
  // Sort by remaining descending
  const sortedByRemaining = [...summaries].sort((a, b) => b.remaining - a.remaining);
  const totalRemaining = summaries.reduce((acc, s) => acc + s.remaining, 0);

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100">
              Kalan Yatırım Görünümü (İlçe Bazlı Dağılım)
            </h2>
            <p className="text-[11px] text-slate-400">
              Tamamlanmayı bekleyen imalat metrajlarının bölge bazlı görünümü
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
          Toplam Kalan: {formatNumber(totalRemaining)} m
        </span>
      </div>

      {/* Top Remaining Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {sortedByRemaining.map((item) => {
          const isOverCompleted = item.remaining < 0;
          const remainingPct = item.totalPe > 0 ? (item.remaining / item.totalPe) * 100 : 0;

          return (
            <div
              key={item.district}
              onClick={() => onSelectDistrict && onSelectDistrict(item.district)}
              className="p-3 bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-200 group-hover:text-blue-300 transition-colors">
                  {item.district}
                </span>
                {isOverCompleted ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Plan Üzeri (+{formatNumber(Math.abs(item.remaining))})
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    %{remainingPct.toFixed(1).replace('.', ',')} Kalan
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 block font-medium">Kalan Metraj</span>
                  <strong className={`text-base font-black ${isOverCompleted ? 'text-purple-300' : 'text-amber-400'}`}>
                    {formatNumber(item.remaining)} <span className="text-xs font-normal">m</span>
                  </strong>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-[10px] text-slate-400 block font-medium">Toplam Plan</span>
                  <span className="text-xs text-slate-300 font-bold">{formatNumber(item.totalPe)} m</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
