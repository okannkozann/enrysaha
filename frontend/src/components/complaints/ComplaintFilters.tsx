'use client';
import { Search, Filter, X, FileSpreadsheet, Plus, ArrowUpDown } from 'lucide-react';
import { SortOption } from '@/app/yapim/complaints/page';

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  complaintTypes: string[];
  onlyRepeating: boolean;
  onOnlyRepeatingChange: (val: boolean) => void;
  sortKey: SortOption;
  onSortKeyChange: (val: SortOption) => void;
  onResetFilters: () => void;
  onExportXls: () => void;
  onOpenAddModal: () => void;
  totalFiltered: number;
}

export function ComplaintFilters({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  complaintTypes,
  onlyRepeating,
  onOnlyRepeatingChange,
  sortKey,
  onSortKeyChange,
  onResetFilters,
  onExportXls,
  onOpenAddModal,
  totalFiltered,
}: Props) {
  const hasActiveFilters = Boolean(searchTerm || selectedType || onlyRepeating || sortKey !== 'RECEIVED_DESC');

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-slate-700/40 bg-slate-800/50 backdrop-blur-sm">
      {/* Sol Taraf: Arama, Filtre ve Sıralama Grubu */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {/* Arama Input */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="İsim, nesne no, adres, tel..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Şikayet Türü Filtresi */}
        <div className="relative min-w-[140px]">
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full pl-3 pr-7 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/50 cursor-pointer transition-all appearance-none"
          >
            <option value="">Tüm Şikayet Türleri</option>
            {complaintTypes.map((t) => (
              <option key={t} value={t} className="bg-slate-900 text-white">
                {t}
              </option>
            ))}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Sıralama Seçimi (Dropdown) */}
        <div className="relative min-w-[165px]">
          <select
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as SortOption)}
            className="w-full pl-3 pr-7 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/50 cursor-pointer transition-all appearance-none"
          >
            <option value="RECEIVED_DESC">Gelen Tarih (En Yeni)</option>
            <option value="RECEIVED_ASC">Gelen Tarih (En Eski)</option>
            <option value="REPEAT_DESC">Tekrar Sayısı (En Çok)</option>
            <option value="REPEAT_ASC">Tekrar Sayısı (En Az)</option>
            <option value="PLANNED_DESC">Planlanan Tarih (En Yeni)</option>
            <option value="PLANNED_ASC">Planlanan Tarih (En Eski)</option>
          </select>
          <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-400 pointer-events-none" />
        </div>



        {/* Filtre Sıfırla */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-2 py-1 rounded text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Sıfırla
          </button>
        )}
      </div>

      {/* Sağ Taraf: XLS Export & + Şikayet Ekle Butonları */}
      <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700/40">
        <button
          type="button"
          onClick={onExportXls}
          disabled={totalFiltered === 0}
          title="Filtrelenmiş verileri .xls formatında indir"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
          <span>XLS İndir</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/25 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>+ Şikayet Ekle</span>
        </button>
      </div>
    </div>
  );
}
