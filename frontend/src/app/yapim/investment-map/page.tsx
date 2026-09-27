'use client';

/**
 * /yapim/investment-map — Yatırım İzleme (Harita Dashboard)
 *
 * Kullanıcının ilettiği referans ekran görüntüsüne sadık kalınarak oluşturulmuştur:
 *  - Sol Üst: 19 İlçe Şematik Haritası (Sol üstte ilçe seçici dropdown)
 *  - Sol Alt: Haritadan veya dropdown'dan seçilen ilçeye/Antalya genelinde dinamik gerçekleşme istatistikleri
 *  - Sağ Kolon: Yönetimsel Özet Dashboard (KPI Kartları, Aylık Trend, Mahalle Dağılımı ve İlçe Karşılaştırma)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { InvestmentRecord } from '@/lib/mock-data/investmentData';
import { investmentService } from '@/lib/services/investmentService';
import { AntalyaInvestmentMap } from '@/components/investment-map/AntalyaInvestmentMap';
import { MapBottomStatsCard, RightDashboardPanel } from '@/components/investment-map/InvestmentMapDashboardStats';
import { MapSelection } from '@/components/investment-map/types';
import { Map, Layers, RotateCcw } from 'lucide-react';
import districtMeta from '@/lib/mock-data/antalyaDistricts.json';

const ALL_DISTRICTS = [
  'KAŞ', 'DEMRE', 'FİNİKE', 'ELMALI', 'KUMLUCA', 'KEMER', 'KORKUTELİ', 
  'KONYAALTI', 'DÖŞEMEALTI', 'KEPEZ', 'MURATPAŞA', 'AKSU', 'SERİK', 
  'İBRADI', 'MANAVGAT', 'AKSEKİ', 'GÜNDOĞMUŞ', 'ALANYA', 'GAZİPAŞA'
];

export default function InvestmentMapPage() {
  const [records, setRecords] = useState<InvestmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Central selection state — drives map, bottom card, and right dashboard
  const [selection, setSelection] = useState<MapSelection>({});

  // ── Load shared investment data ──
  useEffect(() => {
    investmentService.getInvestmentRecords().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  // ── Handlers ──
  const handleDistrictClick = useCallback((districtKey: string) => {
    setSelection({ district: districtKey, neighborhood: undefined });
  }, []);

  const handleDropdownSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'ALL' || !val) {
      setSelection({});
    } else {
      setSelection({ district: val, neighborhood: undefined });
    }
  }, []);

  const handleNeighborhoodClick = useCallback((neighborhoodKey: string | undefined) => {
    setSelection((prev) => ({ ...prev, neighborhood: neighborhoodKey }));
  }, []);

  const handleReset = useCallback(() => {
    setSelection({});
  }, []);

  if (loading) {
    return (
      <div className="h-full min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-blue-500/20" />
          <p className="text-xs font-semibold text-slate-400 tracking-wide">Yatırım Dashboard Yükleniyor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto lg:overflow-hidden font-sans p-2.5 sm:p-4 gap-3 sm:gap-4 selection:bg-blue-500/30">

      {/* ── Ambient Background Lighting ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-emerald-600/10 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-indigo-500/5 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-15" />
      </div>

      {/* ── Main Dashboard Layout Grid ── */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:overflow-hidden min-h-0">

        {/* ── LEFT COLUMN (7/12 width on desktop): Map + Bottom Stats ── */}
        <div className="lg:col-span-7 flex flex-col gap-3 sm:gap-4 lg:overflow-hidden h-auto lg:h-full min-h-0">

          {/* 1. Top Card: Map Container */}
          <div className="relative flex-1 min-h-[260px] sm:min-h-[280px] lg:min-h-[200px] bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800/90 shadow-2xl overflow-hidden flex flex-col">

            {/* SVG Map Engine */}
            <div className="flex-1 w-full h-full min-h-[240px]">
              <AntalyaInvestmentMap
                geometryLayer={{ source: 'HGM-2025', districts: [] }}
                selection={selection}
                onDistrictClick={handleDistrictClick}
                onNeighborhoodClick={handleNeighborhoodClick}
                onReset={handleReset}
              />
            </div>
          </div>

          {/* 2. Bottom Card: Yatırım Gerçekleşme Metraj Profili Alanı */}
          <div className="h-auto md:h-80 lg:h-[330px] flex-shrink-0">
            <MapBottomStatsCard records={records} selection={selection} />
          </div>

        </div>

        {/* ── RIGHT COLUMN (5/12 width on desktop): Executive Dashboard Panel ── */}
        <div className="lg:col-span-5 h-auto lg:h-full lg:overflow-hidden">
          <RightDashboardPanel
            records={records}
            selection={selection}
            onDistrictSelect={handleDistrictClick}
            onNeighborhoodSelect={handleNeighborhoodClick}
          />
        </div>

      </div>

    </div>
  );
}


