'use client';
import { useEffect, useState, useMemo } from 'react';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { ServiceBox } from '@/types';
import {
  FilterBar,
  FilterState,
  WaitingDayRange,
  DEFAULT_FILTER_STATE,
} from '@/components/dashboard/FilterBar';
import { ServiceBoxTable } from '@/components/service-box/ServiceBoxTable';
import { ServiceBoxAnalytics } from '@/components/service-box/ServiceBoxAnalytics';
import { ExcelImportModal } from '@/components/service-box/ExcelImportModal';
import { Upload, Table2, BarChart2 } from 'lucide-react';

function matchWaitingDayRange(days: number, range: WaitingDayRange): boolean {
  switch (range) {
    case 'all': return true;
    case '<15': return days < 15;
    case '15-30': return days >= 15 && days < 30;
    case '30-45': return days >= 30 && days < 45;
    case '45-60': return days >= 45 && days < 60;
    case '60-75': return days >= 60 && days < 75;
    case '75-90': return days >= 75 && days < 90;
    case '>90': return days >= 90;
    default: return true;
  }
}

// No helper needed — listOpen is set on first user interaction

export default function ServiceBoxesPage() {
  const [boxes, setBoxes]           = useState<ServiceBox[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [importOpen, setImportOpen] = useState(false);
  const [fileName, setFileName]     = useState<string>('');
  const [activeTab, setActiveTab]   = useState<'list' | 'chart'>('list');
  const [listOpen, setListOpen]     = useState(false);

  /** Any filter interaction (including "Tümü") opens the list */
  const handleFiltersChange = (f: FilterState) => {
    setFilters(f);
    setListOpen(true);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const cachedName = localStorage.getItem('enerya_service_boxes_filename');
        if (cachedName) setFileName(cachedName);
      } catch (e) {
        console.error('Cache load error:', e);
      }
      const data = await serviceBoxService.getServiceBoxes();
      setBoxes(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleImport = (importedBoxes: ServiceBox[], meta?: { fileName: string; dateStr: string }) => {
    setBoxes(importedBoxes);
    if (meta?.fileName) setFileName(meta.fileName);
    try {
      localStorage.setItem('enerya_service_boxes', JSON.stringify(importedBoxes));
      if (meta?.fileName) localStorage.setItem('enerya_service_boxes_filename', meta.fileName);
    } catch (e) {
      console.error('Cache save error:', e);
    }
  };

  const districts = useMemo(
    () => [...new Set(boxes.map((b) => b.district))].filter(Boolean).sort(),
    [boxes]
  );

  const statusSummary = useMemo(() => {
    const base = boxes.filter((box) => {
      if (filters.sector !== 'all' && box.sectorRegionInfo !== filters.sector) return false;
      if (filters.district !== 'all' && box.district !== filters.district) return false;
      if (!matchWaitingDayRange(box.waitingDays, filters.waitingDayRange)) return false;
      return true;
    });
    const total = base.length;
    const empty = base.filter((b) => !b.lastStatus).length;
    const filled = total - empty;
    const byDistrict: Record<string, { total: number; empty: number; filled: number }> = {};
    boxes.forEach((box) => {
      if (filters.sector !== 'all' && box.sectorRegionInfo !== filters.sector) return;
      if (!matchWaitingDayRange(box.waitingDays, filters.waitingDayRange)) return;
      if (!byDistrict[box.district]) byDistrict[box.district] = { total: 0, empty: 0, filled: 0 };
      byDistrict[box.district].total++;
      box.lastStatus ? byDistrict[box.district].filled++ : byDistrict[box.district].empty++;
    });
    return { total, empty, filled, byDistrict };
  }, [boxes, filters.sector, filters.district, filters.waitingDayRange]);

  const rangeCounts = useMemo(() => {
    const base = boxes.filter((box) => {
      if (filters.sector !== 'all' && box.sectorRegionInfo !== filters.sector) return false;
      if (filters.district !== 'all' && box.district !== filters.district) return false;
      if (filters.statusFilter === 'empty' && box.lastStatus !== '') return false;
      if (filters.statusFilter === 'filled' && box.lastStatus === '') return false;
      if (!['all', 'empty', 'filled'].includes(filters.statusFilter) && box.lastStatus !== filters.statusFilter) return false;
      return true;
    });
    const ranges: WaitingDayRange[] = ['<15', '15-30', '30-45', '45-60', '60-75', '75-90', '>90'];
    const counts: Record<string, number> = { all: base.length };
    ranges.forEach((r) => { counts[r] = base.filter((b) => matchWaitingDayRange(b.waitingDays, r)).length; });
    return counts;
  }, [boxes, filters.sector, filters.district, filters.statusFilter]);

  const filteredBoxes = useMemo(() => {
    let result = boxes.filter((box) => {
      if (filters.sector !== 'all' && box.sectorRegionInfo !== filters.sector) return false;
      if (filters.district !== 'all' && box.district !== filters.district) return false;
      if (!matchWaitingDayRange(box.waitingDays, filters.waitingDayRange)) return false;
      if (filters.statusFilter === 'empty' && box.lastStatus !== '') return false;
      if (filters.statusFilter === 'filled' && box.lastStatus === '') return false;
      if (!['all', 'empty', 'filled'].includes(filters.statusFilter) && box.lastStatus !== filters.statusFilter) return false;
      return true;
    });
    if (filters.sortOption === 'waiting-desc')
      result = [...result].sort((a, b) => b.waitingDays - a.waitingDays);
    else if (filters.sortOption === 'waiting-asc')
      result = [...result].sort((a, b) => a.waitingDays - b.waitingDays);
    return result;
  }, [boxes, filters]);

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex min-h-0">

        {/* ── Main Content ──────────────────────────────────── */}
        <div className="flex-1 px-3 sm:px-6 py-3 sm:py-5 space-y-3.5 min-w-0">

          {/* ── Top Action Row ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {fileName && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/70 border border-slate-700/50 rounded-lg text-[11px] font-semibold text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" />
                  <span className="truncate max-w-[160px] sm:max-w-none">{fileName}</span>
                </div>
              )}
              {listOpen && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] font-semibold text-blue-300">
                  {filteredBoxes.length} / {boxes.length} kayıt
                </div>
              )}
              {listOpen && statusSummary.empty > 0 && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] font-semibold text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {statusSummary.empty} boş
                </div>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              {/* Mobile Tab Switcher */}
              {listOpen && (
                <div className="flex sm:hidden items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'list'
                        ? 'bg-blue-500/25 border border-blue-500/40 text-blue-200'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Table2 className="h-3.5 w-3.5" />
                    Liste
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chart')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'chart'
                        ? 'bg-indigo-500/25 border border-indigo-500/40 text-indigo-200'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    Grafik
                  </button>
                </div>
              )}

              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-md shadow-emerald-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Upload className="h-3.5 w-3.5" />
                Dosya Ekle
              </button>
            </div>
          </div>

          {/* ── Filter Bar ── */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
            <FilterBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              districts={districts}
              statusSummary={statusSummary}
              rangeCounts={rangeCounts}
            />
          </div>

          {/* ── Prompt: no filter selected ── */}
          {!listOpen && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
                <Table2 className="h-7 w-7 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-400">Listeyi görüntülemek için bir filtre seçin</p>
              <p className="text-xs text-slate-600">Gün aralığı, ilçe veya durum filtresinden birini seçin</p>
            </div>
          )}

          {/* ── Liste Tab ── */}
          {activeTab === 'list' && listOpen && (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl shadow-black/30">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/40 bg-slate-800/60">
                <div className="p-1 bg-blue-500/15 rounded-md">
                  <Table2 className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Liste Görünümü</span>
                <span className="ml-auto px-2 py-0.5 bg-slate-700/60 rounded-md text-[11px] font-medium text-slate-400">
                  {filteredBoxes.length} sonuç
                </span>
              </div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                    <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" />
                  </div>
                  <p className="text-sm text-slate-400 animate-pulse">Kayıtlar yükleniyor...</p>
                </div>
              ) : (
                <ServiceBoxTable boxes={filteredBoxes} />
              )}
            </div>
          )}

          {/* ── Grafik Tab ── */}
          {activeTab === 'chart' && listOpen && (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl shadow-black/30">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/40 bg-slate-800/60">
                <div className="p-1 bg-indigo-500/15 rounded-md">
                  <BarChart2 className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200">Grafik Analizi</span>
              </div>
              <div className="p-5">
                <ServiceBoxAnalytics
                  boxes={filteredBoxes}
                  selectedRange={filters.waitingDayRange}
                  selectedDistrict={filters.district}
                  onSelectRange={(range) => setFilters((prev) => ({ ...prev, waitingDayRange: range }))}
                  onSelectDistrict={(district) => setFilters((prev) => ({ ...prev, district }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Right-Rail: Vertical Tab Switcher (Masaüstü) ─────────── */}
        <div className="hidden sm:flex flex-col items-center gap-3 py-5 px-2.5 border-l border-slate-700/30">
          <button
            type="button"
            id="tab-list-view"
            onClick={() => setActiveTab('list')}
            title="Liste Görünümü"
            className={[
              'group flex flex-col items-center justify-center gap-2 w-12 py-5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-200',
              activeTab === 'list'
                ? 'bg-blue-500/15 border border-blue-500/35 text-blue-300'
                : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent',
            ].join(' ')}
          >
            <div className={[
              'p-1.5 rounded-lg transition-all duration-200',
              activeTab === 'list' ? 'bg-blue-500/20' : 'bg-slate-700/40 group-hover:bg-slate-700/70',
            ].join(' ')}>
              <Table2 className={`h-4 w-4 ${activeTab === 'list' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            </div>
            <span className="[writing-mode:vertical-lr] rotate-180 leading-none">liste</span>
          </button>

          <div className="h-px w-6 bg-slate-700/50" />

          <button
            type="button"
            id="tab-chart-view"
            onClick={() => setActiveTab('chart')}
            title="Grafik Analizi"
            className={[
              'group flex flex-col items-center justify-center gap-2 w-12 py-5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-200',
              activeTab === 'chart'
                ? 'bg-indigo-500/15 border border-indigo-500/35 text-indigo-300'
                : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent',
            ].join(' ')}
          >
            <div className={[
              'p-1.5 rounded-lg transition-all duration-200',
              activeTab === 'chart' ? 'bg-indigo-500/20' : 'bg-slate-700/40 group-hover:bg-slate-700/70',
            ].join(' ')}>
              <BarChart2 className={`h-4 w-4 ${activeTab === 'chart' ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            </div>
            <span className="[writing-mode:vertical-lr] rotate-180 leading-none">grafik</span>
          </button>
        </div>
      </div>

      {/* ── Import Modal ── */}
      <ExcelImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
