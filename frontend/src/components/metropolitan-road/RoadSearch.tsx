import React from 'react';
import { Search, X, Sparkles, Filter } from 'lucide-react';

interface RoadSearchProps {
  value: string;
  onChange: (value: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  districts: string[];
  districtCounts: Record<string, number>;
  resultCount: number;
  totalCount: number;
}

export function RoadSearch({
  value,
  onChange,
  selectedDistrict,
  onSelectDistrict,
  districts,
  districtCounts,
  resultCount,
  totalCount,
}: RoadSearchProps) {
  const isFiltering = value.trim().length > 0 || selectedDistrict !== 'ALL';

  return (
    <div className="w-full space-y-3">
      {/* Input container */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="h-5 w-5 text-blue-400" />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cadde, bulvar veya yol ara... (Örn: Yaşar Sobutay, Atatürk, 5036)"
          className="w-full h-11 pl-11 pr-10 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-100 placeholder-slate-400 hover:border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all shadow-inner"
          autoFocus
        />

        {value.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            title="Aramayı Temizle"
          >
            <div className="w-5 h-5 rounded-md bg-slate-700/60 flex items-center justify-center hover:bg-slate-600">
              <X className="h-3 w-3 text-slate-300" />
            </div>
          </button>
        )}
      </div>

      {/* District Selection Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 pr-1">
          <Filter className="h-3 w-3 text-blue-400" />
          İlçe:
        </span>

        {/* All Chips */}
        <button
          type="button"
          onClick={() => onSelectDistrict('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${selectedDistrict === 'ALL'
            ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm shadow-blue-500/20'
            : 'bg-slate-800/70 border-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
        >
          Tümü <span className="opacity-75 font-normal">({totalCount})</span>
        </button>

        {districts.map((dist) => {
          const count = districtCounts[dist] || 0;
          const isActive = selectedDistrict === dist;
          return (
            <button
              key={dist}
              type="button"
              onClick={() => onSelectDistrict(isActive ? 'ALL' : dist)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${isActive
                ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm shadow-blue-500/20'
                : 'bg-slate-800/70 border-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
              {dist} <span className="opacity-75 font-normal">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Counter & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs border-t border-slate-800/80 pt-2">


        <div className="flex items-center gap-2 shrink-0">
          {isFiltering ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold text-[11px]">
              <Sparkles className="h-3 w-3 text-blue-400" />
              {resultCount} sonuç bulundu
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-[11px]">
              Toplam {totalCount} cadde / bulvar / yol
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
