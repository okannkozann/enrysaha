'use client';

/**
 * InvestmentMapPanel.tsx
 *
 * Right-side investment detail panel for Yatırım İzleme (Harita).
 * Reacts to MapSelection — shows Antalya-wide, district-level, or
 * neighborhood-level summaries derived from the shared investmentService.
 */

import { useMemo } from 'react';
import { InvestmentRecord } from '@/lib/mock-data/investmentData';
import { investmentService, NeighborhoodInvestmentSummary } from '@/lib/services/investmentService';
import { MapSelection } from './types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('tr-TR');
}

function pct(n: number) {
  return `%${n.toFixed(1)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800 tabular-nums">
        {value}
        {sub && <span className="text-xs font-normal text-slate-400 ml-1">{sub}</span>}
      </span>
    </div>
  );
}

function CompletionBar({ rate }: { rate: number }) {
  const clamped = Math.max(0, Math.min(100, rate));
  const color = clamped >= 80 ? 'bg-emerald-500' : clamped >= 50 ? 'bg-blue-500' : 'bg-amber-500';
  return (
    <div className="mt-1">
      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
        <span>Gerçekleşme</span>
        <span className="font-medium text-slate-600">{pct(clamped)}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function NeighborhoodTable({ rows }: { rows: NeighborhoodInvestmentSummary[] }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-2 py-1.5 font-semibold text-slate-500 uppercase tracking-wide">Mahalle</th>
            <th className="text-right px-2 py-1.5 font-semibold text-slate-500 uppercase tracking-wide">PE63</th>
            <th className="text-right px-2 py-1.5 font-semibold text-slate-500 uppercase tracking-wide">PE125</th>
            <th className="text-right px-2 py-1.5 font-semibold text-slate-500 uppercase tracking-wide">Yapılan</th>
            <th className="text-right px-2 py-1.5 font-semibold text-slate-500 uppercase tracking-wide">Kalan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-2 py-1.5 text-slate-700 font-medium leading-tight">{r.neighborhood}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{fmt(r.pe63)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{fmt(r.pe125)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{fmt(r.completed)}</td>
              <td className={`px-2 py-1.5 text-right tabular-nums font-medium ${r.remaining < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                {fmt(r.remaining)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface Props {
  records: InvestmentRecord[];
  selection: MapSelection;
  onNeighborhoodClick: (key: string) => void;
}

export function InvestmentMapPanel({ records, selection, onNeighborhoodClick }: Props) {
  const { district, neighborhood } = selection;

  const scopedRecords = useMemo(
    () => investmentService.getRecordsBySelection(records, district, neighborhood),
    [records, district, neighborhood]
  );

  const kpis = useMemo(() => investmentService.calculateKPIs(scopedRecords), [scopedRecords]);

  const neighborhoodRows = useMemo(() => {
    // Only show neighborhood table when a district (but not a single neighborhood) is selected
    if (!district || neighborhood) return [];
    return investmentService.getNeighborhoodSummaries(records, district);
  }, [records, district, neighborhood]);

  // ── Title logic ──
  const panelTitle = neighborhood
    ? neighborhood
    : district
      ? district
      : 'Antalya Geneli';

  const panelSubtitle = neighborhood
    ? district
    : district
      ? 'İlçe Yatırım Özeti'
      : 'Tüm ilçeler · 2026 Yatırım Planı';

  // ── Trend indicator (simple: compare completed vs remaining) ──
  const trend =
    kpis.completionRate >= 80
      ? 'up'
      : kpis.completionRate >= 40
        ? 'neutral'
        : 'down';

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── Panel Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">
              {panelSubtitle}
            </p>
            <h2 className="text-base font-bold text-slate-800 leading-tight truncate">{panelTitle}</h2>
          </div>
          <div className="flex-shrink-0 ml-3 mt-0.5">
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
            {trend === 'neutral' && <Minus className="w-4 h-4 text-amber-400" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
          </div>
        </div>
        <CompletionBar rate={kpis.completionRate} />
      </div>

      {/* ── KPI Summary ── */}
      <div className="px-5 py-3 border-b border-slate-100">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Yatırım Özeti</p>
        <KpiRow label="PE63" value={fmt(kpis.totalPe63)} sub="m" />
        <KpiRow label="PE125" value={fmt(kpis.totalPe125)} sub="m" />
        <KpiRow label="Toplam PE" value={fmt(kpis.totalPlannedPe)} sub="m" />
        <KpiRow label="Yapılan" value={fmt(kpis.totalCompleted)} sub="m" />
        <KpiRow
          label="Kalan"
          value={fmt(kpis.totalRemaining)}
          sub={kpis.totalRemaining < 0 ? '(aşım)' : 'm'}
        />
      </div>

      {/* ── Neighborhood list (when district selected, no neighborhood) ── */}
      {neighborhoodRows.length > 0 && (
        <div className="px-5 py-3 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Mahalleler ({neighborhoodRows.length})
          </p>

          {/* Clickable neighborhood chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {neighborhoodRows.map((r, i) => (
              <button
                key={i}
                onClick={() => onNeighborhoodClick(r.neighborhood)}
                className="px-2 py-1 text-[11px] font-medium bg-slate-50 border border-slate-200 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors text-slate-600 leading-tight text-left"
              >
                {r.neighborhood}
              </button>
            ))}
          </div>

          <NeighborhoodTable rows={neighborhoodRows} />
        </div>
      )}

      {/* ── Single neighborhood detail ── */}
      {neighborhood && scopedRecords.length > 0 && (
        <div className="px-5 py-3 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Mahalle Detayı</p>
          <NeighborhoodTable
            rows={scopedRecords.map((r) => ({
              district: r.district,
              neighborhood: r.neighborhood,
              pe63: r.pe63,
              pe125: r.pe125,
              totalPe: r.totalPe,
              completed: r.completed,
              remaining: r.remaining,
              completionRate: r.totalPe > 0 ? (r.completed / r.totalPe) * 100 : 0,
            }))}
          />
        </div>
      )}

      {/* ── Empty state ── */}
      {scopedRecords.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs text-slate-400 text-center">
            Seçilen filtre için yatırım kaydı bulunamadı.
          </p>
        </div>
      )}
    </div>
  );
}
