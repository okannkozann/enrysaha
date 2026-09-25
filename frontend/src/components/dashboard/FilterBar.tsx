'use client';
import { useState } from 'react';
import { FilterX, SlidersHorizontal, ChevronDown, Building2, AlertCircle, ArrowUpDown } from 'lucide-react';

export type WaitingDayRange = 'all' | '<15' | '15-30' | '30-45' | '45-60' | '60-75' | '75-90' | '>90';
export type StatusFilter = 'all' | 'empty' | 'filled' | 'Planlandı' | 'Devam Ediyor' | 'Bekliyor' | 'Tamamlandı';
export type SortOption = 'none' | 'waiting-desc' | 'waiting-asc';

export interface FilterState {
  sector: string;
  district: string;
  waitingDayRange: WaitingDayRange;
  statusFilter: StatusFilter;
  sortOption: SortOption;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  sector: 'all',
  district: 'all',
  waitingDayRange: 'all',
  statusFilter: 'all',
  sortOption: 'waiting-desc',
};

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  districts: string[];
  statusSummary: {
    total: number;
    empty: number;
    filled: number;
    filteredByStatusTotal?: number;
    byDistrict: Record<string, { total: number; empty: number; filled: number }>;
  };
  rangeCounts?: Record<string, number>;
}

const WAITING_RANGES: {
  value: WaitingDayRange;
  label: string;
  colorDot: string;
  colorActive: string;
  colorBorder: string;
}[] = [
  { value: 'all',   label: 'Tümü',      colorDot: 'bg-slate-400',  colorActive: 'bg-slate-600 border-slate-500 text-white',              colorBorder: 'border-slate-600/40' },
  { value: '<15',   label: '< 15',       colorDot: 'bg-red-500',    colorActive: 'bg-red-600/80 border-red-500/60 text-white',            colorBorder: 'border-red-500/30' },
  { value: '15-30', label: '15–30',      colorDot: 'bg-orange-500', colorActive: 'bg-orange-600/80 border-orange-500/60 text-white',      colorBorder: 'border-orange-500/30' },
  { value: '30-45', label: '30–45',      colorDot: 'bg-amber-500',  colorActive: 'bg-amber-600/80 border-amber-500/60 text-white',        colorBorder: 'border-amber-500/30' },
  { value: '45-60', label: '45–60',      colorDot: 'bg-yellow-400', colorActive: 'bg-yellow-600/80 border-yellow-500/60 text-white',      colorBorder: 'border-yellow-500/30' },
  { value: '60-75', label: '60–75',      colorDot: 'bg-blue-500',   colorActive: 'bg-blue-600/80 border-blue-500/60 text-white',          colorBorder: 'border-blue-500/30' },
  { value: '75-90', label: '75–90',      colorDot: 'bg-indigo-500', colorActive: 'bg-indigo-600/80 border-indigo-500/60 text-white',      colorBorder: 'border-indigo-500/30' },
  { value: '>90',   label: '> 90',       colorDot: 'bg-purple-500', colorActive: 'bg-purple-600/80 border-purple-500/60 text-white',      colorBorder: 'border-purple-500/30' },
];

/* ── Reusable compact filter item button ─────────────────────────── */
function FilterOption({
  active,
  onClick,
  children,
  className = '',
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer select-none text-left',
        active
          ? 'bg-blue-500/25 border-blue-500/50 text-blue-200 shadow-inner shadow-blue-500/10'
          : 'bg-slate-900/60 border-slate-700/40 text-slate-300 hover:bg-slate-800/80 hover:text-white hover:border-slate-600/60',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* ══ Main Component ═══════════════════════════════════════════════ */
export function FilterBar({
  filters,
  onFiltersChange,
  districts,
  statusSummary,
  rangeCounts,
}: FilterBarProps) {
  const [accordionOpen, setAccordionOpen] = useState(false);

  if (!filters) return null;

  const update = (patch: Partial<FilterState>) =>
    onFiltersChange({ ...filters, ...patch });

  const clearAll = () => {
    onFiltersChange(DEFAULT_FILTER_STATE);
    setAccordionOpen(false);
  };

  const activeSubFilters = [
    filters.district !== 'all',
    filters.statusFilter !== 'all',
    filters.sortOption !== 'none' && filters.sortOption !== 'waiting-desc',
  ].filter(Boolean).length;

  const hasAnyActive = filters.waitingDayRange !== 'all' || activeSubFilters > 0;

  return (
    <div className="space-y-2">

      {/* ── Row 1: Gün Chip'leri + Filtre Butonları ────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        
        {/* Day range chips */}
        <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5 flex-1">
          {WAITING_RANGES.map(({ value, label, colorDot, colorActive, colorBorder }) => {
            const isActive = filters.waitingDayRange === value;
            const count    = rangeCounts?.[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => update({ waitingDayRange: isActive && value !== 'all' ? 'all' : value })}
                className={[
                  'flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border transition-all duration-150 cursor-pointer select-none text-center',
                  isActive
                    ? colorActive
                    : `bg-slate-800/70 text-slate-300 ${colorBorder} hover:bg-slate-700/70`,
                ].join(' ')}
              >
                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${colorDot} ${isActive ? 'opacity-90' : 'opacity-60'}`} />
                <span className="truncate">{label}</span>
                {count !== undefined && (
                  <span className={[
                    'px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-bold leading-none',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-700/80 text-slate-400',
                  ].join(' ')}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action buttons (Clear & Accordion Toggle) */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {hasAnyActive && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all"
            >
              <FilterX className="h-3.5 w-3.5" />
              Temizle
            </button>
          )}

          <button
            type="button"
            id="filter-accordion-toggle"
            onClick={() => setAccordionOpen((prev) => !prev)}
            className={[
              'inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 active:scale-95',
              accordionOpen
                ? 'bg-blue-500/25 border-blue-500/50 text-blue-200 shadow-sm shadow-blue-500/20'
                : 'bg-slate-700/60 border-slate-600/40 text-slate-300 hover:bg-slate-700 hover:text-white',
            ].join(' ')}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtreler</span>
            {activeSubFilters > 0 && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-500 text-white text-[9px] font-bold">
                {activeSubFilters}
              </span>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${accordionOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* ── Accordion Panel (Kompress & Kompakt Filtre Paneli) ────────── */}
      <div
        className={[
          'grid transition-all duration-300 ease-in-out overflow-hidden',
          accordionOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        ].join(' ')}
      >
        <div className="min-h-0">
          <div className="mt-1 bg-slate-900/90 border border-slate-700/60 rounded-xl p-3 backdrop-blur-md shadow-xl space-y-3">

            {/* 1. Kutu Son Durumu (Üstte İlk Seçim) */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Kutu Son Durumu</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { value: 'all',    label: 'Tümü',          count: statusSummary.total,  dot: 'bg-slate-400' },
                  { value: 'empty',  label: 'Durumu Boş',    count: statusSummary.empty,  dot: 'bg-amber-400' },
                  { value: 'filled', label: 'Durumu Diğer',  count: statusSummary.filled, dot: 'bg-blue-400'  },
                ] as const).map(({ value, label, count, dot }) => (
                  <FilterOption
                    key={value}
                    active={filters.statusFilter === value}
                    onClick={() => update({ statusFilter: value as StatusFilter })}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
                      <span className="truncate">{label}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                      filters.statusFilter === value ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </FilterOption>
                ))}
              </div>
            </div>

            {/* 2. İlçe Seçimi (Kutu Son Durumuna Göre Filtreli) */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Building2 className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. İlçe Filtresi</span>
                {filters.statusFilter !== 'all' && (
                  <span className="text-[9px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 ml-1">
                    Seçili duruma göre
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterOption
                  active={filters.district === 'all'}
                  onClick={() => update({ district: 'all' })}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                    <span className="truncate">Tümü</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    filters.district === 'all' ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {statusSummary.filteredByStatusTotal ?? statusSummary.total}
                  </span>
                </FilterOption>

                {districts.map((d) => {
                  const info   = statusSummary.byDistrict[d];
                  const active = filters.district === d;
                  const distCount = filters.statusFilter === 'empty'
                    ? info?.empty
                    : filters.statusFilter === 'filled'
                      ? info?.filled
                      : info?.total;

                  return (
                    <FilterOption
                      key={d}
                      active={active}
                      onClick={() => update({ district: d })}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${active ? 'bg-blue-400' : 'bg-slate-500'}`} />
                        <span className="truncate">{d}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                        active ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {distCount ?? 0}
                      </span>
                    </FilterOption>
                  );
                })}
              </div>
            </div>

            {/* 3. Kayıt Sıralaması */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ArrowUpDown className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3. Kayıt Sıralaması</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { value: 'waiting-desc', label: 'Büyükten Küçüğe ⬇' },
                  { value: 'waiting-asc',  label: 'Küçükten Büyüğe ⬆' },
                ] as const).map(({ value, label }) => (
                  <FilterOption
                    key={value}
                    active={filters.sortOption === value}
                    onClick={() => update({ sortOption: value })}
                  >
                    <span>{label}</span>
                  </FilterOption>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

