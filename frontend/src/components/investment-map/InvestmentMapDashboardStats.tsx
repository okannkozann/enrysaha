'use client';

import { useMemo } from 'react';
import { InvestmentRecord } from '@/lib/mock-data/investmentData';
import { investmentService, NeighborhoodInvestmentSummary } from '@/lib/services/investmentService';
import { MapSelection } from './types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Activity, MapPin, TrendingUp, CheckCircle2, Clock, AlertCircle, Layers } from 'lucide-react';

interface Props {
  records: InvestmentRecord[];
  selection: MapSelection;
  onDistrictSelect: (district: string | undefined) => void;
  onNeighborhoodSelect: (neighborhood: string | undefined) => void;
}

function fmt(n: number) {
  return n.toLocaleString('tr-TR');
}

function pct(n: number) {
  return `%${n.toFixed(1)}`;
}

// Color Palette for Charts
const COLORS = {
  completed: '#10b981', // Emerald-500
  remaining: '#f59e0b', // Amber-500
  pe63: '#3b82f6',      // Blue-500
  pe125: '#8b5cf6',     // Purple-500
};

/**
 * Bottom-Left Statistics Card Component (Harita Altı İstatistik Görünümü - Dikey Tam Sığacak Şekilde Enlarged)
 */
export function MapBottomStatsCard({ records, selection }: { records: InvestmentRecord[]; selection: MapSelection }) {
  const { district } = selection;

  // Filter records by district ONLY so bottom stats card does not shift when a neighborhood is selected
  const scopedRecords = useMemo(
    () => investmentService.getRecordsBySelection(records, district),
    [records, district]
  );

  const kpis = useMemo(() => investmentService.calculateKPIs(scopedRecords), [scopedRecords]);

  // Donut chart data
  const pieData = useMemo(() => {
    if (kpis.totalPlannedPe === 0) return [];
    return [
      { name: 'Yapılan (Tamamlanan)', value: kpis.totalCompleted, color: COLORS.completed },
      { name: 'Kalan Metraj', value: Math.max(0, kpis.totalRemaining), color: COLORS.remaining },
    ];
  }, [kpis]);

  // PE type breakdown bars
  const barProgressData = useMemo(() => {
    return [
      { name: 'PE63', Planlanan: kpis.totalPe63, Tamamlanan: Math.round(kpis.totalPe63 * (kpis.completionRate / 100)) },
      { name: 'PE125', Planlanan: kpis.totalPe125, Tamamlanan: Math.round(kpis.totalPe125 * (kpis.completionRate / 100)) },
    ];
  }, [kpis]);

  const hasData = scopedRecords.length > 0 && kpis.totalPlannedPe > 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800/90 shadow-2xl p-3 sm:p-3.5 flex flex-col justify-between h-full overflow-hidden text-slate-100">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-none">
              Yatırım Gerçekleşme & Metraj Profili
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 leading-none mt-1">
              {district ? (
                <span className="font-semibold text-blue-400 flex items-center gap-1 inline-flex">
                  <MapPin className="w-3 h-3" /> {district} İlçesi İstatistikleri
                </span>
              ) : (
                'Antalya Geneli İstatistikleri (Tüm İlçeler)'
              )}
            </p>
          </div>
        </div>

        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-300 bg-slate-800/80 px-2 sm:px-2.5 py-0.5 rounded-full border border-slate-700/80 whitespace-nowrap">
          {scopedRecords.length} Mahalle Kaydı
        </span>
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center p-3 text-center bg-slate-950/40 rounded-lg border border-dashed border-slate-800 min-h-[140px]">
          <AlertCircle className="w-7 h-7 text-slate-500 mb-1" />
          <h4 className="text-xs font-semibold text-slate-300">
            {district ? `${district} İlçesinde` : 'Antalya Genelinde'} Aktif Yatırım Bulunmuyor
          </h4>
          <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
            2026 yatırım planında tanımlı PE hattı bulunmamaktadır.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center flex-1 min-h-0 py-1 overflow-y-auto md:overflow-hidden">

          {/* 1. Left: Donut Chart with Rate % */}
          <div className="col-span-1 md:col-span-4 flex flex-col items-center justify-center relative py-1 md:py-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={34}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${fmt(Number(value))} m`, 'Metraj']}
                    contentStyle={{ backgroundColor: '#090d16', borderRadius: '8px', border: '1px solid #1e293b', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Percentage */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
                  {pct(kpis.completionRate)}
                </span>
                <span className="text-[8.5px] uppercase font-bold text-slate-400 mt-0.5">Yapılan</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold mt-0.5">
              <div className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span>Yapılan</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <span>Kalan</span>
              </div>
            </div>
          </div>

          {/* 2. Middle: Key Metric Numbers */}
          <div className="col-span-1 md:col-span-4 flex flex-col justify-center gap-1.5 border-y md:border-y-0 md:border-x border-slate-800/80 py-2 md:py-0 px-0 md:px-2.5">
            <div className="bg-slate-800/70 py-1.5 px-2.5 rounded-lg border border-slate-700/70 flex items-center justify-between shadow-sm">
              <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-slate-400">
                Planlanan
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white tabular-nums">
                {fmt(kpis.totalPlannedPe)} m
              </span>
            </div>

            <div className="bg-emerald-950/40 py-1.5 px-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-between shadow-sm">
              <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-emerald-400">
                Gerçekleşen
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-400 tabular-nums">
                {fmt(kpis.totalCompleted)} m
              </span>
            </div>

            <div className="bg-amber-950/40 py-1.5 px-2.5 rounded-lg border border-amber-500/30 flex items-center justify-between shadow-sm">
              <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-amber-400">
                Kalan Hat
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-400 tabular-nums">
                {fmt(kpis.totalRemaining)} m
              </span>
            </div>
          </div>

          {/* 3. Right: PE Type Breakdown Chart */}
          <div className="col-span-1 md:col-span-4 flex flex-col justify-between h-[130px] md:h-full pl-0 md:pl-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-slate-400">
                PE63 vs PE125
              </span>
              <div className="flex items-center gap-1.5 text-[9px] font-bold">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded bg-slate-600 inline-block" /> Plan
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2 h-2 rounded bg-blue-500 inline-block" /> Yapılan
                </span>
              </div>
            </div>
            <div className="w-full flex-1 min-h-[90px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barProgressData} margin={{ top: 12, right: 5, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9.5} fontWeight={700} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={9}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${fmt(Number(val))} m`, 'Metraj']}
                    contentStyle={{ backgroundColor: '#090d16', borderRadius: '8px', border: '1px solid #1e293b', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="Planlanan" fill="#334155" radius={[3, 3, 0, 0]} barSize={14} />
                  <Bar dataKey="Tamamlanan" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

/**
 * Subcomponent: Premium Neighborhoods List Table for Selected District
 */
function DistrictNeighborhoodsTable({
  district,
  records,
  onNeighborhoodSelect,
  selectedNeighborhood,
}: {
  district: string;
  records: InvestmentRecord[];
  onNeighborhoodSelect: (n: string | undefined) => void;
  selectedNeighborhood?: string;
}) {
  const neighborhoodSummaries = useMemo(() => {
    return investmentService.getNeighborhoodSummaries(records, district);
  }, [records, district]);

  if (neighborhoodSummaries.length === 0) {
    return (
      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex-1 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-6 h-6 text-slate-500 mb-1" />
        <h4 className="text-xs font-semibold text-slate-300">{district} İlçesinde Mahalle Kaydı Bulunmuyor</h4>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Bu ilçe için 2026 yatırım planında mahalle seviyesinde tanımlı PE hattı bulunmamaktadır.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950/50 backdrop-blur-md p-3 rounded-xl border border-slate-800/80 flex-1 flex flex-col min-h-[220px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">{district} Mahalle Bazlı Yatırım Detayları</h4>
            <p className="text-[10px] text-slate-400">Yatırım gerçekleşen, kalan ve PE hat detayları</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
          {neighborhoodSummaries.length} Mahalle
        </span>
      </div>

      <div className="overflow-x-auto flex-1 max-h-56 scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[340px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="py-1.5 px-2 whitespace-nowrap">Mahalle</th>
              <th className="py-1.5 px-1.5 text-right whitespace-nowrap">Plan (M)</th>
              <th className="py-1.5 px-1.5 text-right whitespace-nowrap">Yapılan (M)</th>
              <th className="py-1.5 px-1.5 text-right whitespace-nowrap">Kalan (M)</th>
              <th className="py-1.5 px-1.5 text-center whitespace-nowrap">Gerçekleşme %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-[11px]">
            {neighborhoodSummaries.map((r, i) => {
              const isSelected = selectedNeighborhood === r.neighborhood;
              const rate = r.completionRate;
              const rateColor =
                rate >= 80
                  ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40'
                  : rate >= 40
                  ? 'text-blue-300 bg-blue-500/20 border-blue-500/40'
                  : 'text-amber-300 bg-amber-500/20 border-amber-500/40';

              return (
                <tr
                  key={i}
                  onClick={() => onNeighborhoodSelect(isSelected ? undefined : r.neighborhood)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-950/60 font-bold border-l-4 border-l-blue-500 shadow-sm' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <td className="py-1.5 px-2 text-slate-100 font-bold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="uppercase truncate max-w-[120px]">{r.neighborhood}</span>
                      {isSelected && <span className="text-[9px] text-blue-400 font-bold">(Seçili)</span>}
                    </div>
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-mono font-bold text-slate-200 whitespace-nowrap">
                    {fmt(r.totalPe)}
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {fmt(r.completed)}
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                    {r.remaining < 0 ? `(${fmt(Math.abs(r.remaining))})` : fmt(r.remaining)}
                  </td>
                  <td className="py-1.5 px-1.5 text-center whitespace-nowrap">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${rateColor}`}>
                      %{rate.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Subcomponent: District Investment Summary Table (İlçe Bazlı Yatırım Özeti Tablosu)
 * Rendered when no specific district is selected (Antalya Geneli view), matching user design reference.
 */
function DistrictSummaryTable({
  records,
  onDistrictSelect,
}: {
  records: InvestmentRecord[];
  onDistrictSelect: (district: string) => void;
}) {
  const districtSummaries = useMemo(() => {
    return investmentService.getDistrictSummaries(records).sort((a, b) => b.totalPe - a.totalPe);
  }, [records]);

  return (
    <div className="bg-slate-950/50 backdrop-blur-md p-3 rounded-xl border border-slate-800/80 flex-1 flex flex-col min-h-[220px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">İlçe Bazlı Yatırım Özeti</h4>
            <p className="text-[10px] text-slate-400">Tüm ilçelerin yatırım planı, saha imalatı ve kalan metraj özetleri</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
          {districtSummaries.length} İlçe / Bölge
        </span>
      </div>

      <div className="overflow-x-auto flex-1 max-h-56 scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[400px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="py-1.5 px-2 whitespace-nowrap">İlçe / Bölge</th>
              <th className="py-1.5 px-1.5 text-right whitespace-nowrap">Plan (M)</th>
              <th className="py-1.5 px-1.5 text-right whitespace-nowrap">Yapılan (M)</th>
              <th className="py-1.5 px-1.5 text-right whitespace-nowrap">Kalan (M)</th>
              <th className="py-1.5 px-1.5 text-center whitespace-nowrap">Gerçekleşme %</th>
              <th className="py-1.5 px-2 text-center whitespace-nowrap">Mahalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-[11px]">
            {districtSummaries.map((s, i) => {
              const rate = s.completionRate;
              const rateColor =
                rate >= 80
                  ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40'
                  : rate >= 40
                  ? 'text-blue-300 bg-blue-500/20 border-blue-500/40'
                  : 'text-amber-300 bg-amber-500/20 border-amber-500/40';

              return (
                <tr
                  key={i}
                  onClick={() => onDistrictSelect(s.district)}
                  className="cursor-pointer transition-colors hover:bg-slate-800/50"
                >
                  <td className="py-1.5 px-2 text-slate-100 font-bold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="uppercase">{s.district}</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-mono font-bold text-slate-200 whitespace-nowrap">
                    {fmt(s.totalPe)}
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                    {fmt(s.completed)}
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                    {s.remaining < 0 ? `(${fmt(Math.abs(s.remaining))})` : fmt(s.remaining)}
                  </td>
                  <td className="py-1.5 px-1.5 text-center whitespace-nowrap">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${rateColor}`}>
                      %{rate.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono font-semibold text-slate-400 whitespace-nowrap">
                    {s.recordCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Right Column Full Dashboard Panel (Ekranın Sağ Tarafı — Tam Yetkin Dashboard)
 */
export function RightDashboardPanel({
  records,
  selection,
  onDistrictSelect,
  onNeighborhoodSelect,
}: Props) {
  const { district, neighborhood } = selection;

  const scopedRecords = useMemo(
    () => investmentService.getRecordsBySelection(records, district, neighborhood),
    [records, district, neighborhood]
  );

  const kpis = useMemo(() => investmentService.calculateKPIs(scopedRecords), [scopedRecords]);

  // Data for PE63 vs PE125 Distribution Chart
  const peDistributionData = useMemo(() => {
    const total = kpis.totalPlannedPe || 1;
    const pe63Pct = Number(((kpis.totalPe63 / total) * 100).toFixed(1));
    const pe125Pct = Number(((kpis.totalPe125 / total) * 100).toFixed(1));
    return [
      { name: 'PE63 Hat', value: kpis.totalPe63, percentage: pe63Pct, color: '#3b82f6' },
      { name: 'PE125 Hat', value: kpis.totalPe125, percentage: pe125Pct, color: '#8b5cf6' },
    ];
  }, [kpis]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800/90 shadow-2xl p-4 flex flex-col gap-3 h-full overflow-y-auto text-slate-100">

      {/* 1. Toplam Metraj & İki Farklı Hat Ok Hiyerarşisi + Kalan Metraj Ayrı Field */}
      <div className="space-y-2">
        
        {/* Main Total Card */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950/80 to-slate-950 text-white p-3 rounded-xl shadow-lg border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block">
                {neighborhood
                  ? `${neighborhood.toUpperCase()} Toplam PE Metrajı`
                  : district
                    ? `${district} Toplam PE Metrajı`
                    : 'Antalya Toplam PE Metrajı'}
              </span>
              <p className="text-lg font-black tracking-tight tabular-nums mt-0.5">
                {fmt(kpis.totalPlannedPe)} <span className="text-xs font-medium text-slate-300">m</span>
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Two Branching Arrow Cards (PE63 & PE125) */}
          <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-800/80">
            {/* Left Arrow: PE63 */}
            <div className="bg-slate-950/80 border border-blue-500/30 p-2 rounded-lg text-left">
              <div className="flex items-center gap-1 text-blue-400 font-semibold text-[10px] mb-0.5">
                <span>↙ PE63 Metrajı</span>
              </div>
              <p className="text-xs font-bold text-white tabular-nums">{fmt(kpis.totalPe63)} m</p>
            </div>

            {/* Right Arrow: PE125 */}
            <div className="bg-slate-950/80 border border-purple-500/30 p-2 rounded-lg text-left">
              <div className="flex items-center gap-1 text-purple-400 font-semibold text-[10px] mb-0.5">
                <span>↘ PE125 Metrajı</span>
              </div>
              <p className="text-xs font-bold text-white tabular-nums">{fmt(kpis.totalPe125)} m</p>
            </div>
          </div>
        </div>

        {/* Separate Distinct Field: Kalan Metraj Bilgisi */}
        <div className="bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                {neighborhood ? `${neighborhood.toUpperCase()} Kalan Metraj Bilgisi` : 'Kalan Metraj Bilgisi (Kalan Hat)'}
              </span>
              <p className="text-sm font-extrabold text-amber-300 tabular-nums leading-tight">
                {fmt(kpis.totalRemaining)} <span className="text-xs font-normal text-amber-400/80">m</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-amber-400/90 font-semibold block">Yapılan: {fmt(kpis.totalCompleted)} m</span>
            <span className="text-[9px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 inline-block mt-0.5">
              %{kpis.completionRate.toFixed(1)} Yapıldı
            </span>
          </div>
        </div>

      </div>

      {/* 2. CONDITIONAL RENDER: 
          - If NO district selected (Antalya Geneli): Show DistrictSummaryTable
          - If district selected: Show DistrictNeighborhoodsTable */}
      {!district ? (
        <DistrictSummaryTable records={records} onDistrictSelect={onDistrictSelect} />
      ) : (
        <DistrictNeighborhoodsTable
          district={district}
          records={records}
          onNeighborhoodSelect={onNeighborhoodSelect}
          selectedNeighborhood={neighborhood}
        />
      )}

      {/* 4. PE63 vs PE125 Metraj Dağılım Grafiği */}
      <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 mt-2.5 sm:mt-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-bold text-white">
              {neighborhood
                ? `${neighborhood.toUpperCase()} PE63 vs PE125 Dağılımı`
                : district
                  ? `${district} PE63 vs PE125 Dağılımı`
                  : 'Antalya Geneli PE63 ve PE125 Hat Dağılımı'}
            </h4>
            <p className="text-[10px] text-slate-400">Boru Çapına Göre Metraj Oranları</p>
          </div>
        </div>

        {/* Horizontal Stacked Progress Bar */}
        <div className="space-y-2.5 mt-2">
          <div className="h-4.5 w-full bg-slate-800/80 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${peDistributionData[0].percentage}%` }}
              className="bg-blue-500 h-full flex items-center justify-center text-[9.5px] font-bold text-white transition-all duration-500"
              title={`PE63: ${fmt(kpis.totalPe63)} m (%${peDistributionData[0].percentage})`}
            >
              %{peDistributionData[0].percentage}
            </div>
            <div
              style={{ width: `${peDistributionData[1].percentage}%` }}
              className="bg-purple-600 h-full flex items-center justify-center text-[9.5px] font-bold text-white transition-all duration-500"
              title={`PE125: ${fmt(kpis.totalPe125)} m (%${peDistributionData[1].percentage})`}
            >
              %{peDistributionData[1].percentage}
            </div>
          </div>

          {/* Cards for PE63 and PE125 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-950/40 p-2 rounded-lg border border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <div>
                  <span className="text-[10px] font-bold text-blue-200 block leading-tight">PE63 Hat</span>
                  <span className="text-[9px] text-blue-400 font-medium">%{peDistributionData[0].percentage} Pay</span>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-200 tabular-nums">{fmt(kpis.totalPe63)} m</span>
            </div>

            <div className="bg-purple-950/40 p-2 rounded-lg border border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                <div>
                  <span className="text-[10px] font-bold text-purple-200 block leading-tight">PE125 Hat</span>
                  <span className="text-[9px] text-purple-400 font-medium">%{peDistributionData[1].percentage} Pay</span>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-200 tabular-nums">{fmt(kpis.totalPe125)} m</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
