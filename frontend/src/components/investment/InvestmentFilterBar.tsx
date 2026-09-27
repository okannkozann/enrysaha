import React from 'react';
import { Filter, RotateCcw, Calendar, MapPin, Building2 } from 'lucide-react';

interface InvestmentFilterBarProps {
  selectedYear: string;
  onSelectYear: (year: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  selectedNeighborhood: string;
  onSelectNeighborhood: (neighborhood: string) => void;
  districts: string[];
  neighborhoods: string[];
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function InvestmentFilterBar({
  selectedYear,
  onSelectYear,
  selectedDistrict,
  onSelectDistrict,
  selectedNeighborhood,
  onSelectNeighborhood,
  districts,
  neighborhoods,
  onReset,
  hasActiveFilters,
}: InvestmentFilterBarProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 sm:p-3.5 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider pr-1">
          <Filter className="h-3.5 w-3.5 text-blue-400" />
          <span>Filtreler:</span>
        </div>

        {/* Yıl Selector */}
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => onSelectYear(e.target.value)}
            className="h-9 pl-8 pr-7 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-slate-200 hover:border-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
          >
            <option value="2026" className="bg-slate-900 text-slate-200">2026 Yatırım Yılı</option>
            <option value="2027" className="bg-slate-900 text-slate-200">2027 Yılı (Hedef)</option>
          </select>
          <Calendar className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* İlçe Selector */}
        <div className="relative flex-1 sm:flex-initial min-w-[140px]">
          <select
            value={selectedDistrict}
            onChange={(e) => {
              onSelectDistrict(e.target.value);
              onSelectNeighborhood('ALL');
            }}
            className="w-full h-9 pl-8 pr-7 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-slate-200 hover:border-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
          >
            <option value="ALL" className="bg-slate-900 text-slate-200">İlçe: Tümü</option>
            {districts.map((d) => (
              <option key={d} value={d} className="bg-slate-900 text-slate-200">{d}</option>
            ))}
          </select>
          <MapPin className="h-3.5 w-3.5 text-blue-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Mahalle Selector (Dependent on İlçe) */}
        <div className="relative flex-1 sm:flex-initial min-w-[160px]">
          <select
            value={selectedNeighborhood}
            onChange={(e) => onSelectNeighborhood(e.target.value)}
            className="w-full h-9 pl-8 pr-7 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-slate-200 hover:border-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none truncate"
          >
            <option value="ALL" className="bg-slate-900 text-slate-200">Mahalle: Tümü</option>
            {neighborhoods.map((n) => (
              <option key={n} value={n} className="bg-slate-900 text-slate-200">{n}</option>
            ))}
          </select>
          <Building2 className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="h-9 px-3.5 rounded-xl text-xs font-bold text-rose-300 border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Filtreleri Sıfırla</span>
          </button>
        )}
      </div>

      {/* Corporate Info Tag */}
      <div className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Resmi Yatırım Planı & Canlı Saha İmalat Matrisi</span>
      </div>
    </div>
  );
}
