import React from 'react';
import { DistrictInvestmentSummary } from '@/lib/services/investmentService';
import { formatNumber } from './ExecutiveKpiStrip';
import { MapPin, ChevronRight, Layers } from 'lucide-react';

interface DistrictInvestmentTableProps {
  summaries: DistrictInvestmentSummary[];
  onSelectDistrict: (district: string) => void;
  selectedDistrict: string;
}

export function DistrictInvestmentTable({
  summaries,
  onSelectDistrict,
  selectedDistrict,
}: DistrictInvestmentTableProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-700/60 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-900/95">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100">
              İlçe Bazlı Yatırım Özeti
            </h2>
            <p className="text-[11px] text-slate-400">
              Tüm ilçelerin yatırım planı, saha imalatı ve kalan metraj özetleri
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/50">
          {summaries.length} İlçe / Bölge
        </span>
      </div>

      {/* High Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-900/90 border-b border-slate-700/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">İlçe / Bölge</th>
              <th className="px-4 py-3 text-right">Plan (m)</th>
              <th className="px-4 py-3 text-right">Yapılan (m)</th>
              <th className="px-4 py-3 text-right">Kalan (m)</th>
              <th className="px-4 py-3 text-right">Gerçekleşme %</th>
              <th className="px-4 py-3 text-center">Mahalle</th>
              <th className="px-4 py-3 text-right">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {summaries.map((s) => {
              const isSelected = selectedDistrict === s.district;
              const isOverCompleted = s.remaining < 0;

              return (
                <tr
                  key={s.district}
                  onClick={() => onSelectDistrict(isSelected ? 'ALL' : s.district)}
                  className={`group transition-all cursor-pointer select-none hover:bg-slate-800/50 ${
                    isSelected ? 'bg-blue-600/15 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  {/* İlçe */}
                  <td className="px-4 py-2.5 font-bold text-slate-100 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>{s.district}</span>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-2.5 text-right text-slate-200 font-semibold">
                    {formatNumber(s.totalPe)}
                  </td>

                  {/* Yapılan */}
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-400">
                    {formatNumber(s.completed)}
                  </td>

                  {/* Kalan */}
                  <td className={`px-4 py-2.5 text-right font-bold ${isOverCompleted ? 'text-purple-300 font-black' : 'text-amber-400'}`}>
                    {formatNumber(s.remaining)}
                  </td>

                  {/* Gerçekleşme % */}
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      %{s.completionRate.toFixed(1).replace('.', ',')}
                    </span>
                  </td>

                  {/* Mahalle Sayısı */}
                  <td className="px-4 py-2.5 text-center text-slate-400 font-semibold">
                    {s.recordCount}
                  </td>

                  {/* Ok */}
                  <td className="px-4 py-2.5 text-right">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition-all ml-auto">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
