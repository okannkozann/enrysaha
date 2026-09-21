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
import { Button } from '@/components/ui/button';
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

export default function ServiceBoxesPage() {
  const [boxes, setBoxes]           = useState<ServiceBox[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [importOpen, setImportOpen] = useState(false);
  const [fileName, setFileName]     = useState<string>('');
  const [activeTab, setActiveTab]   = useState<'list' | 'chart'>('list');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const cachedName = localStorage.getItem('enerya_service_boxes_filename');
        if (cachedName) {
          setFileName(cachedName);
        }

        const cached = localStorage.getItem('enerya_service_boxes');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBoxes(parsed);
            setLoading(false);
            return;
          }
        }
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
    if (meta?.fileName) {
      setFileName(meta.fileName);
    }
    try {
      localStorage.setItem('enerya_service_boxes', JSON.stringify(importedBoxes));
      if (meta?.fileName) {
        localStorage.setItem('enerya_service_boxes_filename', meta.fileName);
      }
    } catch (e) {
      console.error('Cache save error:', e);
    }
  };

  /* Unique districts */
  const districts = useMemo(
    () => [...new Set(boxes.map((b) => b.district))].filter(Boolean).sort(),
    [boxes]
  );

  /* Status summary */
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

  /* Range counts */
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

  /* Filtered + sorted service boxes */
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
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {fileName && (
            <div className="mb-1.5 inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-semibold text-slate-900">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{fileName}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Servis Kutuları</h1>
          <p className="text-sm text-slate-500 mt-1">Tüm servis kutusu kayıtları ve imalat durumları</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm font-medium">
            Gösterilen: {filteredBoxes.length} / {boxes.length}
          </div>
          {statusSummary.empty > 0 && (
            <div className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Durumu Boş: {statusSummary.empty}
            </div>
          )}

          <Button
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Dosya Ekle
          </Button>
        </div>
      </div>

      {/* ── View Switcher Tabs (Liste & Grafik) ── */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table2 className="h-4 w-4 text-blue-600" />
            <span>Liste Görünümü</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
              activeTab === 'chart'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="h-4 w-4 text-emerald-600" />
            <span>Grafik Analizi</span>
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        districts={districts}
        statusSummary={statusSummary}
        rangeCounts={rangeCounts}
      />

      {/* ── Tab 1: ServiceBoxTable ── */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Kayıtlar yükleniyor...
              </div>
            </div>
          ) : (
            <ServiceBoxTable boxes={filteredBoxes} />
          )}
        </div>
      )}

      {/* ── Tab 2: ServiceBoxAnalytics (Grafik Analizi) ── */}
      {activeTab === 'chart' && (
        <ServiceBoxAnalytics
          boxes={filteredBoxes}
          selectedRange={filters.waitingDayRange}
          selectedDistrict={filters.district}
          onSelectRange={(range) => setFilters((prev) => ({ ...prev, waitingDayRange: range }))}
          onSelectDistrict={(district) => setFilters((prev) => ({ ...prev, district }))}
        />
      )}

      {/* ── Import Modal ── */}
      <ExcelImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}


