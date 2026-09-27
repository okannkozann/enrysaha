'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { serviceBoxService } from '@/lib/services/serviceBoxService';
import { ServiceBox } from '@/types';
import { WaitingDayRange, StatusFilter, SortOption } from '@/components/dashboard/FilterBar';
import { ServiceBoxTable } from '@/components/service-box/ServiceBoxTable';
import { ExcelImportModal } from '@/components/service-box/ExcelImportModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import {
  Upload, Table2, BarChart2, Building2, Search,
  ArrowUp, ArrowDown, FileText, CheckCircle2, AlertCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react';

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

const WAITING_RANGES: {
  value: WaitingDayRange;
  label: string;
  colorDot: string;
  colorActive: string;
  colorBorder: string;
  chartColor: string;
}[] = [
    { value: 'all', label: 'Tüm', colorDot: 'bg-slate-400', colorActive: 'bg-slate-700 border-slate-500 text-white', colorBorder: 'border-slate-700/60', color: '#94a3b8' },
    { value: '<15', label: '< 15', colorDot: 'bg-red-500', colorActive: 'bg-red-600/80 border-red-500/60 text-white', colorBorder: 'border-red-500/30', color: '#ef4444' },
    { value: '15-30', label: '15–30', colorDot: 'bg-orange-500', colorActive: 'bg-orange-600/80 border-orange-500/60 text-white', colorBorder: 'border-orange-500/30', color: '#f97316' },
    { value: '30-45', label: '30–45', colorDot: 'bg-amber-500', colorActive: 'bg-amber-600/80 border-amber-500/60 text-white', colorBorder: 'border-amber-500/30', color: '#f59e0b' },
    { value: '45-60', label: '45–60', colorDot: 'bg-yellow-400', colorActive: 'bg-yellow-600/80 border-yellow-500/60 text-white', colorBorder: 'border-yellow-500/30', color: '#eab308' },
    { value: '60-75', label: '60–75', colorDot: 'bg-blue-500', colorActive: 'bg-blue-600/80 border-blue-500/60 text-white', colorBorder: 'border-blue-500/30', color: '#3b82f6' },
    { value: '75-90', label: '75–90', colorDot: 'bg-indigo-500', colorActive: 'bg-indigo-600/80 border-indigo-500/60 text-white', colorBorder: 'border-indigo-500/30', color: '#6366f1' },
    { value: '>90', label: '> 90', colorDot: 'bg-purple-500', colorActive: 'bg-purple-600/80 border-purple-500/60 text-white', colorBorder: 'border-purple-500/30', color: '#a855f7' },
  ];

const formatChartLabel = (val: any) => (val && Number(val) > 0 ? String(val) : '');

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-lg px-2.5 py-1.5 shadow-xl backdrop-blur-md">
      <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5 text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-slate-300 font-medium">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ServiceBoxesPage() {
  const [boxes, setBoxes] = useState<ServiceBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter States
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedDayRange, setSelectedDayRange] = useState<WaitingDayRange>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('waiting-desc');

  // Scroll Ref for Card Deck
  const cardScrollRef = useRef<HTMLDivElement>(null);

  const scrollCards = (direction: 'left' | 'right') => {
    if (cardScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      cardScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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

  // Extract all unique districts from boxes
  const districts = useMemo(() => {
    return [...new Set(boxes.map((b) => b.district))].filter(Boolean).sort();
  }, [boxes]);

  // Overall status summary
  const statusSummary = useMemo(() => {
    const base = boxes.filter((box) => {
      if (selectedDistrict !== 'all' && box.district !== selectedDistrict) return false;
      if (!matchWaitingDayRange(box.waitingDays, selectedDayRange)) return false;
      return true;
    });
    const total = base.length;
    const empty = base.filter((b) => !b.lastStatus).length;
    const filled = total - empty;

    const byDistrict: Record<string, { total: number; empty: number; filled: number }> = {};
    boxes.forEach((box) => {
      if (!byDistrict[box.district]) byDistrict[box.district] = { total: 0, empty: 0, filled: 0 };
      byDistrict[box.district].total++;
      box.lastStatus ? byDistrict[box.district].filled++ : byDistrict[box.district].empty++;
    });

    return { total, empty, filled, byDistrict };
  }, [boxes, selectedDistrict, selectedDayRange]);

  // Range counts for side bar
  const rangeCounts = useMemo(() => {
    const base = boxes.filter((box) => {
      if (selectedDistrict !== 'all' && box.district !== selectedDistrict) return false;
      if (selectedStatus === 'empty' && box.lastStatus !== '') return false;
      if (selectedStatus === 'filled' && box.lastStatus === '') return false;
      return true;
    });
    const ranges: WaitingDayRange[] = ['<15', '15-30', '30-45', '45-60', '60-75', '75-90', '>90'];
    const counts: Record<string, number> = { all: base.length };
    ranges.forEach((r) => { counts[r] = base.filter((b) => matchWaitingDayRange(b.waitingDays, r)).length; });
    return counts;
  }, [boxes, selectedDistrict, selectedStatus]);

  // Filtered Boxes for List & Charts
  const filteredBoxes = useMemo(() => {
    let result = boxes.filter((box) => {
      if (selectedDistrict !== 'all' && box.district !== selectedDistrict) return false;
      if (!matchWaitingDayRange(box.waitingDays, selectedDayRange)) return false;
      if (selectedStatus === 'empty' && box.lastStatus !== '') return false;
      if (selectedStatus === 'filled' && box.lastStatus === '') return false;
      return true;
    });

    if (selectedSort === 'waiting-desc')
      result = [...result].sort((a, b) => b.waitingDays - a.waitingDays);
    else if (selectedSort === 'waiting-asc')
      result = [...result].sort((a, b) => a.waitingDays - b.waitingDays);

    return result;
  }, [boxes, selectedDistrict, selectedDayRange, selectedStatus, selectedSort]);

  // Additional Search query filtering on the right list
  const searchedAndFilteredBoxes = useMemo(() => {
    if (!searchQuery.trim()) return filteredBoxes;
    const q = searchQuery.toLowerCase().trim();
    return filteredBoxes.filter(
      (b) =>
        b.connectionObject?.toLowerCase().includes(q) ||
        b.district?.toLowerCase().includes(q) ||
        b.sectorInfo?.toLowerCase().includes(q) ||
        b.name?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q)
    );
  }, [filteredBoxes, searchQuery]);

  // Chart 1: Bekleme Süresi Dağılımı
  const rangeChartData = useMemo(() => {
    return WAITING_RANGES.filter((r) => r.value !== 'all').map((r) => ({
      name: r.label,
      'Kutu Sayısı': filteredBoxes.filter((b) => matchWaitingDayRange(b.waitingDays, r.value)).length,
      color: r.color,
    }));
  }, [filteredBoxes]);

  // Chart 2: İlçe Bazlı Servis Kutusu Dağılımı
  const districtChartData = useMemo(() => {
    const map: Record<string, { total: number; empty: number; filled: number }> = {};
    filteredBoxes.forEach((b) => {
      const d = b.district || 'Belirtilmedi';
      if (!map[d]) map[d] = { total: 0, empty: 0, filled: 0 };
      map[d].total++;
      if (!b.lastStatus) map[d].empty++; else map[d].filled++;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, 'Durumu Boş': v.empty, 'Durumu Diğer': v.filled, 'Toplam': v.total }))
      .sort((a, b) => b['Toplam'] - a['Toplam'])
      .slice(0, 8);
  }, [filteredBoxes]);

  return (
    <div className="h-full max-h-full overflow-hidden flex flex-col bg-slate-950 text-slate-100 p-2 sm:p-3 gap-2">
      {/* ── TOP HEADER / ACTION ROW ── */}
      <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Servis Kutuları Yönetimi
              <span className="text-[9.5px] font-bold text-blue-400 px-1.5 py-0.2 rounded-full bg-blue-500/15 border border-blue-500/30">
                Saha Operasyon
              </span>
            </h1>
          </div>

          {fileName && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded-md text-[10.5px] font-semibold text-slate-300 ml-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" />
              <span className="truncate max-w-[140px] sm:max-w-none">{fileName}</span>
            </div>
          )}

          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[10.5px] font-semibold text-blue-300">
            {filteredBoxes.length} / {boxes.length} kayıt gösteriliyor
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-md shadow-emerald-600/20 transition-all duration-200 active:scale-95 shrink-0"
          >
            <Upload className="h-3.5 w-3.5" />
            Dosya Ekle
          </button>
        </div>
      </div>

      {/* ── SPLIT MAIN CONTENT (LEFT: FILTER & CHARTS | RIGHT: LIST) ── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 overflow-hidden">

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ── SOL TARAF: İLÇE SEÇİMİ + DİKEY GÜN FİLTRESİ + KART & GRAFİK ── */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="lg:w-[50%] flex flex-col min-h-0 gap-2 overflow-y-auto lg:overflow-hidden">

          {/* ── 1. ÜST ALAN: ANTALYA BUTONU + İLÇE GRİDİ + DURUM/SIRALAMA FİLTRELERİ ── */}
          <div className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 backdrop-blur-md space-y-2 shadow-md">
            {/* ── SEÇİLEBİLECEK İLÇELER: CAROUSEL WITH LEFT/RIGHT ARROWS ── */}
            <div className="space-y-1">
              <div className="relative flex items-center gap-1">
                {/* SOL OK BUTONU */}
                <button
                  type="button"
                  onClick={() => scrollCards('left')}
                  className="shrink-0 p-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500 shadow-md shadow-black/20 transition-all active:scale-95 cursor-pointer z-10"
                  title="Sola Kaydır"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* KARTLARIN DİZİLDİĞİ KAYDIRILABİLİR KONTEYNER */}
                <div
                  ref={cardScrollRef}
                  className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 px-0.5 scrollbar-none scroll-smooth select-none min-h-[56px] flex-1"
                >
                  {/* 1. ANTALYA CARD */}
                  {(() => {
                    const isAllActive = selectedDistrict === 'all';
                    return (
                      <button
                        type="button"
                        onClick={() => setSelectedDistrict('all')}
                        className={`group relative shrink-0 w-20 sm:w-22 h-10 sm:h-12 rounded-lg p-1 border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-0.5 overflow-hidden ${isAllActive
                            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 border-blue-400 text-white shadow-md shadow-blue-500/30 -translate-y-1 scale-105 z-20 ring-1.5 ring-blue-400/40'
                            : 'bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border-slate-700/60 text-slate-300 hover:-translate-y-0.5 hover:scale-105 hover:z-30 hover:border-blue-400/60 hover:shadow-md hover:shadow-blue-500/20'
                          }`}
                      >
                        <div className="flex flex-col items-center w-full z-10 leading-none px-0.5">
                          <span className="text-[8.5px] sm:text-[9.5px] font-bold tracking-tight uppercase truncate w-full text-center">
                            ANTALYA
                          </span>
                          <span className={`text-[10px] sm:text-[11px] font-black tracking-tight mt-0.5 ${isAllActive ? 'text-blue-100' : 'text-blue-400'
                            }`}>
                            {boxes.length}
                          </span>
                        </div>
                      </button>
                    );
                  })()}

                  {/* DISTRICT CARDS */}
                  {districts.map((d) => {
                    const isActive = selectedDistrict === d;
                    const info = statusSummary.byDistrict[d];
                    const count = info?.total || 0;

                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDistrict(isActive ? 'all' : d)}
                        className={`group relative shrink-0 w-20 sm:w-22 h-10 sm:h-12 rounded-lg p-1 border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-0.5 overflow-hidden ${isActive
                            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 border-blue-400 text-white shadow-md shadow-blue-500/30 -translate-y-1 scale-105 z-20 ring-1.5 ring-blue-400/40'
                            : 'bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border-slate-700/60 text-slate-300 hover:-translate-y-0.5 hover:scale-105 hover:z-30 hover:border-blue-400/60 hover:shadow-md hover:shadow-blue-500/20'
                          }`}
                      >
                        <div className="flex flex-col items-center w-full z-10 leading-none px-0.5">
                          <span className="text-[8.5px] sm:text-[9.5px] font-bold tracking-tight uppercase truncate w-full text-center" title={d}>
                            {d}
                          </span>
                          <span className={`text-[10px] sm:text-[11px] font-black tracking-tight mt-0.5 ${isActive ? 'text-white' : 'text-slate-200'
                            }`}>
                            {count}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* SAĞ OK BUTONU */}
                <button
                  type="button"
                  onClick={() => scrollCards('right')}
                  className="shrink-0 p-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500 shadow-md shadow-black/20 transition-all active:scale-95 cursor-pointer z-10"
                  title="Sağa Kaydır"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status Toggles & Sort Buttons (Boş, Diğer, Alt Ok ⬆, Üst Ok ⬇) */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Durum:</span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus(selectedStatus === 'empty' ? 'all' : 'empty')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 ${selectedStatus === 'empty'
                    ? 'bg-amber-500/25 border-amber-500/60 text-amber-200 shadow-sm'
                    : 'bg-slate-800/70 border-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Boş ({statusSummary.empty})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus(selectedStatus === 'filled' ? 'all' : 'filled')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 ${selectedStatus === 'filled'
                    ? 'bg-blue-500/25 border-blue-500/60 text-blue-200 shadow-sm'
                    : 'bg-slate-800/70 border-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Diğer ({statusSummary.filled})
                </button>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Sıralama:</span>
                <button
                  type="button"
                  onClick={() => setSelectedSort(selectedSort === 'waiting-asc' ? 'waiting-desc' : 'waiting-asc')}
                  title="Bekleme Süresi: Küçükten Büyüğe (Alt Ok)"
                  className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border transition-all flex items-center gap-1 ${selectedSort === 'waiting-asc'
                    ? 'bg-indigo-500/30 border-indigo-500/60 text-indigo-200'
                    : 'bg-slate-800/70 border-slate-700/50 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <ArrowUp className="h-3 w-3 text-indigo-400" />

                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSort(selectedSort === 'waiting-desc' ? 'waiting-asc' : 'waiting-desc')}
                  title="Bekleme Süresi: Büyükten Küçüğe (Üst Ok)"
                  className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border transition-all flex items-center gap-1 ${selectedSort === 'waiting-desc'
                    ? 'bg-indigo-500/30 border-indigo-500/60 text-indigo-200'
                    : 'bg-slate-800/70 border-slate-700/50 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <ArrowDown className="h-3 w-3 text-indigo-400" />

                </button>
              </div>
            </div>
          </div>

          {/* ── 2. ALT ALAN: DİKEY GÜN FİLTRESİ (SOL) + İLÇE KART & GRAFİKLER (SAĞ) ── */}
          <div className="flex-1 min-h-0 flex gap-2 overflow-hidden">

            {/* Dikey Gün Filtresi Selector Bar */}
            <div className="shrink-0 flex flex-col gap-1 w-16 sm:w-20 overflow-y-auto pr-0.5 select-none">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center py-0.5">
                Bekleme
              </span>
              {WAITING_RANGES.map(({ value, label, colorDot, colorActive, colorBorder }) => {
                const isActive = selectedDayRange === value;
                const count = rangeCounts?.[value];
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedDayRange(isActive && value !== 'all' ? 'all' : value)}
                    className={`py-1 px-1 rounded-md text-[9.5px] font-bold border transition-all flex items-center justify-between gap-1 text-left cursor-pointer ${isActive
                      ? colorActive
                      : `bg-slate-900/80 text-slate-300 ${colorBorder} hover:bg-slate-800`
                      }`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${colorDot}`} />
                      <span className="truncate">{label}</span>
                    </div>
                    {count !== undefined && (
                      <span className={`text-[8.5px] px-1 rounded font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* İlçe Bazlı Kart & Grafikler Panel */}
            <div className="flex-1 min-h-0 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 backdrop-blur-md flex flex-col justify-between overflow-hidden shadow-md">
              {/* Card Title Header */}
              <div className="shrink-0 flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-blue-400" />
                  <h2 className="text-xs font-black text-slate-100 tracking-wider uppercase">
                    {selectedDistrict === 'all' ? 'ANTALYA GENELİ' : selectedDistrict}
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    {filteredBoxes.length} Kayıt
                  </span>
                </div>
              </div>

              {/* Charts area */}
              <div className="flex-1 min-h-0 flex flex-col justify-around gap-2.5">
                {/* Chart 1: Bekleme Süresi Dağılımı */}
                <div className="flex-1 min-h-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1 shrink-0">
                    <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1">
                      <BarChart2 className="h-3 w-3 text-blue-400" />
                      Bekleme Süresi Dağılımı
                    </span>
                  </div>
                  <div className="h-[145px] sm:h-[175px] w-full bg-slate-950/40 rounded-lg p-1.5 border border-slate-800/60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rangeChartData} margin={{ top: 16, right: 6, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgba(148,163,184,0.08)" />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} width={22} />
                        <Tooltip content={<DarkTooltip />} />
                        <Bar dataKey="Kutu Sayısı" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="Kutu Sayısı" position="top" fill="#cbd5e1" fontSize={9} fontWeight={700} formatter={formatChartLabel} />
                          {rangeChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: İlçe Bazlı Servis Kutusu Dağılımı */}
                <div className="flex-1 min-h-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1 shrink-0">
                    <span className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1">
                      <BarChart2 className="h-3 w-3 text-emerald-400" />
                      İlçe Bazlı Servis Kutusu Dağılımı
                    </span>
                  </div>
                  <div className="h-[145px] sm:h-[175px] w-full bg-slate-950/40 rounded-lg p-1.5 border border-slate-800/60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={districtChartData} margin={{ top: 16, right: 6, left: -25, bottom: 12 }}>
                        <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgba(148,163,184,0.08)" />
                        <XAxis dataKey="name" tick={{ fontSize: 8.5, fill: '#64748b' }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={22} />
                        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} width={22} />
                        <Tooltip content={<DarkTooltip />} />
                        <Bar dataKey="Durumu Boş" fill="#f59e0b" stackId="a" radius={[0, 0, 2, 2]}>
                          <LabelList dataKey="Durumu Boş" position="center" fill="#ffffff" fontSize={8} fontWeight={700} formatter={formatChartLabel} />
                        </Bar>
                        <Bar dataKey="Durumu Diğer" fill="#3b82f6" stackId="a" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="Toplam" position="top" fill="#cbd5e1" fontSize={9} fontWeight={700} formatter={formatChartLabel} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ── SAĞ TARAF: SEÇİLEN İLÇE VE FİLTRELERİN SONUCU LİSTE ───────── */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="lg:w-[50%] flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-900/90 border border-slate-800 rounded-xl backdrop-blur-md shadow-xl">

          {/* Top Header of Right List */}
          <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800 bg-slate-800/80">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 bg-blue-500/15 rounded-md">
                <Table2 className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-xs font-black text-slate-100 tracking-wider">
                LİSTE
              </span>
              <span className="px-2 py-0.2 rounded bg-slate-950/70 border border-slate-700/60 text-[10px] font-bold text-blue-300">
                {searchedAndFilteredBoxes.length} kayıt
              </span>
            </div>

            {/* In-list Search Filter Input */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search className="h-3 w-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Listede ara..."
                  className="w-32 sm:w-44 h-6.5 pl-7 pr-2 rounded-md bg-slate-950/80 border border-slate-700/60 text-[10.5px] text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin" />
              </div>
              <p className="text-xs text-slate-400 animate-pulse">Kayıtlar yükleniyor...</p>
            </div>
          ) : (
            <ServiceBoxTable boxes={searchedAndFilteredBoxes} />
          )}
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

