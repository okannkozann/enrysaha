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

/* ── Reusable sub-filter item button ─────────────────────────── */
function FilterOption({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer',
        active
          ? 'bg-blue-500/25 border-blue-500/50 text-blue-200 shadow-inner shadow-blue-500/10'
          : 'bg-slate-900/50 border-slate-700/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 hover:border-slate-600/50',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* ── Section label ───────────────────────────────────────────── */
function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className="h-3 w-3 text-slate-500" />
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">{label}</span>
    </div>
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
    <div className="space-y-2.5">

      {/* ── Row 1: Gün Chip'leri + Filtreler Butonu ─────────────── */}
      <div className="flex items-start gap-3">
        {/* Day range chips */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {WAITING_RANGES.map(({ value, label, colorDot, colorActive, colorBorder }) => {
            const isActive = filters.waitingDayRange === value;
            const count    = rangeCounts?.[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => update({ waitingDayRange: isActive && value !== 'all' ? 'all' : value })}
                className={[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150 cursor-pointer select-none',
                  isActive
                    ? colorActive
                    : `bg-slate-800/60 text-slate-300 ${colorBorder} hover:bg-slate-700/60`,
                ].join(' ')}
              >
                <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${colorDot} ${isActive ? 'opacity-80' : 'opacity-60'}`} />
                {label}
                {count !== undefined && (
                  <span className={[
                    'px-1 rounded text-[10px] font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400',
                  ].join(' ')}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {hasAnyActive && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-400 border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 transition-all duration-150"
            >
              <FilterX className="h-3 w-3" />
              Temizle
            </button>
          )}
          <button
            type="button"
            id="filter-accordion-toggle"
            onClick={() => setAccordionOpen((prev) => !prev)}
            className={[
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200',
              accordionOpen
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-700/60 border-slate-600/40 text-slate-300 hover:bg-slate-700 hover:text-white',
            ].join(' ')}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtreler
            {activeSubFilters > 0 && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-blue-500 text-white text-[9px] font-bold">
                {activeSubFilters}
              </span>
            )}
            <ChevronDown
              className={`h-3 w-3 transition-transform duration-200 ${accordionOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* ── Accordion Panel ──────────────────────────────────────── */}
      <div
        className={[
          'grid transition-all duration-300 ease-in-out overflow-hidden',
          accordionOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        ].join(' ')}
      >
        <div className="min-h-0">
          <div className="mt-1 bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-md shadow-xl shadow-black/20 space-y-4">

            {/* ── İlçe ─────────────────────────────────────────── */}
            <div>
              <SectionLabel icon={Building2} label="İlçe" />
              <div className="flex flex-wrap gap-1.5">
                {/* All */}
                <FilterOption
                  active={filters.district === 'all'}
                  onClick={() => update({ district: 'all', statusFilter: 'all' })}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                  Tümü
                  <span className={`text-[10px] px-1 rounded font-bold ${filters.district === 'all' ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-500'}`}>
                    {statusSummary.total}
                  </span>
                </FilterOption>
                {districts.map((d) => {
                  const info = statusSummary.byDistrict[d];
                  const active = filters.district === d;
                  return (
                    <FilterOption
                      key={d}
                      active={active}
                      onClick={() => update({ district: d, statusFilter: 'all' })}
                    >
                      {d}
                      <span className={`text-[10px] px-1 rounded font-bold ${active ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-500'}`}>
                        {info?.total ?? 0}
                      </span>
                    </FilterOption>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-700/40" />

            {/* ── Son Durum ─────────────────────────────────────── */}
            <div>
              <SectionLabel icon={AlertCircle} label="Son Durum" />
              <div className="flex gap-2">
                {([
                  { value: 'all',   label: 'Tümü',          count: statusSummary.total,  dot: 'bg-slate-400' },
                  { value: 'empty', label: 'Durumu Boş',     count: statusSummary.empty,  dot: 'bg-amber-400' },
                  { value: 'filled',label: 'Durumu Diğer',   count: statusSummary.filled, dot: 'bg-blue-400'  },
                ] as const).map(({ value, label, count, dot }) => (
                  <FilterOption
                    key={value}
                    active={filters.statusFilter === value}
                    onClick={() => update({ statusFilter: value as StatusFilter })}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dot}`} />
                    {label}
                    <span className={`text-[10px] px-1 rounded font-bold ${
                      filters.statusFilter === value ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </FilterOption>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-700/40" />

            {/* ── Sıralama ─────────────────────────────────────── */}
            <div>
              <SectionLabel icon={ArrowUpDown} label="Sıralama" />
              <div className="flex gap-2">
                {([
                  { value: 'waiting-desc', label: 'Büyükten Küçüğe', icon: '⬇' },
                  { value: 'waiting-asc',  label: 'Küçükten Büyüğe', icon: '⬆' },
                ] as const).map(({ value, label, icon }) => (
                  <FilterOption
                    key={value}
                    active={filters.sortOption === value}
                    onClick={() => update({ sortOption: value })}
                  >
                    <span className="text-base leading-none">{icon}</span>
                    {label}
                    {value === 'waiting-desc' && (
                      <span className="text-[9px] font-normal text-slate-600 ml-0.5">varsayılan</span>
                    )}
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
