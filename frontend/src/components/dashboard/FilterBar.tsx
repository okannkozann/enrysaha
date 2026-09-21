'use client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterX, ArrowUpDown } from "lucide-react";

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

const WAITING_RANGES: { value: WaitingDayRange; label: string; color: string }[] = [
  { value: 'all', label: 'Tümü', color: '' },
  { value: '<15', label: '< 15 Gün', color: 'bg-red-500' },
  { value: '15-30', label: '15-30 Gün', color: 'bg-orange-500' },
  { value: '30-45', label: '30-45 Gün', color: 'bg-amber-500' },
  { value: '45-60', label: '45-60 Gün', color: 'bg-yellow-500' },
  { value: '60-75', label: '60-75 Gün', color: 'bg-blue-500' },
  { value: '75-90', label: '75-90 Gün', color: 'bg-indigo-500' },
  { value: '>90', label: '> 90 Gün', color: 'bg-purple-500' },
];

export function FilterBar({
  filters,
  onFiltersChange,
  districts,
  statusSummary,
  rangeCounts,
}: FilterBarProps) {
  if (!filters) return null;

  const update = (patch: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const clearAll = () => onFiltersChange(DEFAULT_FILTER_STATE);

  const hasActiveFilters =
    filters.sector !== 'all' ||
    filters.district !== 'all' ||
    filters.waitingDayRange !== 'all' ||
    filters.statusFilter !== 'all' ||
    filters.sortOption !== 'none';

  return (
    <div className="space-y-3">
      {/* ── Bekleme süresi chip'leri ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {WAITING_RANGES.map(({ value, label, color }) => {
          const isActive = filters.waitingDayRange === value;
          const count = rangeCounts?.[value];
          return (
            <button
              key={value}
              type="button"
              onClick={() =>
                update({ waitingDayRange: isActive && value !== 'all' ? 'all' : value })
              }
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap snap-start',
                'transition-all duration-200 border cursor-pointer',
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:shadow-sm',
              ].join(' ')}
            >
              {color && (
                <span
                  className={[
                    'h-2 w-2 rounded-full flex-shrink-0',
                    color,
                    isActive ? 'ring-2 ring-white/40' : '',
                  ].join(' ')}
                />
              )}
              {label}
              {count !== undefined && (
                <span
                  className={[
                    'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                  ].join(' ')}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Alt filtre satırı (3 adet filtreleme: İlçe, Son Durum, Sıralama) ── */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center">
        {/* İlçe — servis kutu sayısıyla */}
        <Select value={filters.district} onValueChange={(v) => update({ district: v, statusFilter: 'all' })}>
          <SelectTrigger className="w-[190px] h-9 text-sm">
            <span className="truncate">
              {filters.district === 'all' ? `İlçe (${statusSummary.total})` : filters.district}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Tüm İlçeler ({statusSummary.total})
            </SelectItem>
            {districts.map((d) => {
              const info = statusSummary.byDistrict[d];
              return (
                <SelectItem key={d} value={d}>
                  {d} — {info?.total ?? 0} adet
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Son Durum */}
        <Select
          value={filters.statusFilter}
          onValueChange={(v) => update({ statusFilter: v as StatusFilter })}
        >
          <SelectTrigger className="w-[210px] h-9 text-sm">
            <span className="truncate">
              {filters.statusFilter === 'all'
                ? `Son Durum (${statusSummary.total})`
                : filters.statusFilter === 'empty'
                ? `Son Durumu Boş (${statusSummary.empty})`
                : `Son Durumu Diğer (${statusSummary.filled})`}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar ({statusSummary.total})</SelectItem>
            <SelectItem value="empty">
              Son Durumu Boş ({statusSummary.empty})
            </SelectItem>
            <SelectItem value="filled">
              Son Durumu Diğer ({statusSummary.filled})
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Sıralama */}
        <Select
          value={filters.sortOption}
          onValueChange={(v) => update({ sortOption: v as SortOption })}
        >
          <SelectTrigger className="w-[220px] h-9 text-sm">
            <span className="truncate">
              {filters.sortOption === 'waiting-desc' || filters.sortOption === 'none'
                ? 'Sıralama: Büyükten Küçüğe'
                : 'Sıralama: Küçükten Büyüğe'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="waiting-desc">⬇ Bekleme: Büyükten Küçüğe (Varsayılan)</SelectItem>
            <SelectItem value="waiting-asc">⬆ Bekleme: Küçükten Büyüğe</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            onClick={clearAll}
          >
            <FilterX className="h-4 w-4" />
            Filtreleri Temizle
          </Button>
        )}
      </div>
    </div>
  );
}
