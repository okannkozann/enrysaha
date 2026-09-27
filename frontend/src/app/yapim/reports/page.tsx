'use client';

import { useState, useEffect, useMemo } from 'react';
import { InvestmentRecord } from '@/lib/mock-data/investmentData';
import { investmentService } from '@/lib/services/investmentService';
import { ExecutiveKpiStrip } from '@/components/investment/ExecutiveKpiStrip';
import { PlanVsRealizedVisual } from '@/components/investment/PlanVsRealizedVisual';
import { DistrictInvestmentChart } from '@/components/investment/DistrictInvestmentChart';
import { DistrictInvestmentTable } from '@/components/investment/DistrictInvestmentTable';
import { RemainingInvestmentFocus } from '@/components/investment/RemainingInvestmentFocus';
import { NeighborhoodDetailTable } from '@/components/investment/NeighborhoodDetailTable';
import { InvestmentFilterBar } from '@/components/investment/InvestmentFilterBar';
import { TrendingUp, ShieldCheck, Download, Layers } from 'lucide-react';

export default function InvestmentTrackingPage() {
  const [records, setRecords] = useState<InvestmentRecord[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [allRecords, distList] = await Promise.all([
        investmentService.getInvestmentRecords(),
        investmentService.getDistricts(),
      ]);
      setRecords(allRecords);
      setDistricts(distList);
      setLoading(false);
    }
    loadData();
  }, []);

  // Filtered Neighborhoods based on selected district
  const filteredNeighborhoods = useMemo(() => {
    let dataset = records;
    if (selectedDistrict !== 'ALL') {
      dataset = dataset.filter((r) => r.district === selectedDistrict);
    }
    return [...new Set(dataset.map((r) => r.neighborhood))];
  }, [records, selectedDistrict]);

  // Filtered Records based on current filters
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedDistrict !== 'ALL' && r.district !== selectedDistrict) return false;
      if (selectedNeighborhood !== 'ALL' && r.neighborhood !== selectedNeighborhood) return false;
      return true;
    });
  }, [records, selectedDistrict, selectedNeighborhood]);

  // Dynamically Calculated KPIs from dataset
  const kpis = useMemo(() => {
    return investmentService.calculateKPIs(filteredRecords);
  }, [filteredRecords]);

  // Dynamically Calculated District Summaries
  const districtSummaries = useMemo(() => {
    return investmentService.getDistrictSummaries(filteredRecords);
  }, [filteredRecords]);

  const hasActiveFilters = selectedDistrict !== 'ALL' || selectedNeighborhood !== 'ALL' || selectedYear !== '2026';

  const resetFilters = () => {
    setSelectedYear('2026');
    setSelectedDistrict('ALL');
    setSelectedNeighborhood('ALL');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 font-sans relative selection:bg-blue-500/30 selection:text-white">
      {/* Ambient executive glow background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-[1650px] mx-auto space-y-5">
        {/* ══ HEADER BAR ═══════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-xl px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-emerald-500" />

          <div className="flex items-center gap-3.5 pl-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
                Yatırım İzleme
                <span className="text-[10px] font-extrabold text-blue-300 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 uppercase tracking-widest">
                  Üst Yönetim Karar Destek
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Yıllık doğalgaz yatırım planı, boru hattı imalatı ve saha gerçekleşmelerinin yönetimsel görünümü.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Resmi İmalat Matrisi</span>
            </div>
          </div>
        </div>

        {/* ══ COMPACT FILTER BAR ═══════════════════════════════════════════ */}
        <InvestmentFilterBar
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          selectedNeighborhood={selectedNeighborhood}
          onSelectNeighborhood={setSelectedNeighborhood}
          districts={districts}
          neighborhoods={filteredNeighborhoods}
          onReset={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* ══ EXECUTIVE KPI STRIP ══════════════════════════════════════════ */}
        <ExecutiveKpiStrip kpis={kpis} />

        {/* ══ PRIMARY VISUAL: PLAN vs GERÇEKLEŞEN ══════════════════════════ */}
        <PlanVsRealizedVisual kpis={kpis} />

        {/* ══ DISTRICT ANALYSIS GRID (CHART & SUMMARY TABLE) ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DistrictInvestmentChart
            summaries={districtSummaries}
            onSelectDistrict={(dist) => setSelectedDistrict(dist)}
            selectedDistrict={selectedDistrict}
          />
          <DistrictInvestmentTable
            summaries={districtSummaries}
            onSelectDistrict={(dist) => setSelectedDistrict(dist)}
            selectedDistrict={selectedDistrict}
          />
        </div>

        {/* ══ REMAINING INVESTMENT FOCUS ═══════════════════════════════════ */}
        <RemainingInvestmentFocus
          summaries={districtSummaries}
          onSelectDistrict={(dist) => setSelectedDistrict(dist)}
        />

        {/* ══ HIGH DENSITY NEIGHBORHOOD DETAIL TABLE ═══════════════════════ */}
        <NeighborhoodDetailTable
          records={filteredRecords}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(dist) => setSelectedDistrict(dist)}
        />
      </div>
    </div>
  );
}
