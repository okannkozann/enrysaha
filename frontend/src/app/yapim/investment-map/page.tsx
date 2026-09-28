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
import {
  MapBottomStatsCard,
  RightDashboardPanel,
  ModernDistrictNeighborhoodPieChartCard,
} from '@/components/investment-map/InvestmentMapDashboardStats';
import { MapSelection } from '@/components/investment-map/types';

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
  const handleDistrictClick = useCallback((districtKey: string | undefined) => {
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
    <div className="relative flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden font-sans p-2.5 sm:p-3 gap-2.5 sm:gap-3 selection:bg-blue-500/30">

      {/* ── Ambient Background Lighting ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-blue-600/10 blur-[130px]" />
        <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-emerald-600/10 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-indigo-500/5 blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-15" />
      </div>

      {/* ── Main Dashboard Layout Grid (4-Quadrant Executive Architecture) ── */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 overflow-hidden min-h-0 w-full h-full max-w-[1850px] mx-auto">

        {/* ── LEFT COLUMN (7/12 width): Map (Top) + Metraj Profili (Bottom) ── */}
        <div className="lg:col-span-7 flex flex-col gap-2.5 sm:gap-3 overflow-hidden h-full min-h-0">

          {/* 1. Map Container (Top-Left) */}
          <div className="relative flex-[1.2] min-h-0 bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800/90 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 w-full h-full min-h-0">
              <AntalyaInvestmentMap
                geometryLayer={{ source: 'HGM-2025', districts: [] }}
                selection={selection}
                onDistrictClick={handleDistrictClick}
                onNeighborhoodClick={handleNeighborhoodClick}
                onReset={handleReset}
              />
            </div>
          </div>

          {/* 2. Metraj Profili Card (Bottom-Left) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MapBottomStatsCard records={records} selection={selection} />
          </div>

        </div>

        {/* ── RIGHT COLUMN (5/12 width): İlçe Yatırım Tablosu (Top) + İmalat Pastası (Bottom) ── */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 sm:gap-3 overflow-hidden h-full min-h-0">

          {/* 3. İlçe Bazlı Yatırım Özeti Panel (Top-Right) */}
          <div className="flex-[1.4] min-h-0 overflow-hidden">
            <RightDashboardPanel
              records={records}
              selection={selection}
              onDistrictSelect={handleDistrictClick}
              onNeighborhoodSelect={handleNeighborhoodClick}
            />
          </div>

          {/* 4. Antalya Geneli İlçe İmalat Dağılım Pastası Card (Bottom-Right) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ModernDistrictNeighborhoodPieChartCard records={records} selection={selection} />
          </div>

        </div>

      </div>

    </div>
  );
}


