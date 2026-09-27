import React from 'react';
import { DistrictInvestmentSummary } from '@/lib/services/investmentService';
import { formatNumber } from './ExecutiveKpiStrip';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface DistrictInvestmentChartProps {
  summaries: DistrictInvestmentSummary[];
  onSelectDistrict?: (district: string) => void;
  selectedDistrict?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DistrictInvestmentSummary;
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
        <div className="font-black text-slate-100 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
          <span>{label} İLÇESİ</span>
          <span className="text-indigo-400 font-extrabold">%{data.completionRate.toFixed(1).replace('.', ',')}</span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Planlanan:
            </span>
            <strong className="text-slate-100">{formatNumber(data.totalPe)} m</strong>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Gerçekleşen:
            </span>
            <strong className="font-bold">{formatNumber(data.completed)} m</strong>
          </div>
          <div className="flex items-center justify-between gap-4 text-amber-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Kalan:
            </span>
            <strong className="font-bold">{formatNumber(data.remaining)} m</strong>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function DistrictInvestmentChart({
  summaries,
  onSelectDistrict,
  selectedDistrict = 'ALL',
}: DistrictInvestmentChartProps) {
  const chartData = summaries.map((s) => ({
    ...s,
    name: s.district,
    plan: s.totalPe,
    yapilan: s.completed,
  }));

  const axisStyle = { fill: '#94a3b8', fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif' };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-100">
              İlçe Bazlı Plan vs Gerçekleşen Yatırım Karşılaştırması
            </h2>
            <p className="text-[11px] text-slate-400">
              İlçelere göre hedeflenen ve sahada tamamlanan boru hattı metrajları
            </p>
          </div>
        </div>

        {selectedDistrict !== 'ALL' && (
          <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
            Seçili İlçe: {selectedDistrict}
          </span>
        )}
      </div>

      {/* Horizontal Bar Chart Container */}
      <div className="h-[280px] sm:h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activeLabel && onSelectDistrict) {
                onSelectDistrict(state.activeLabel as string);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={axisStyle}
              tickFormatter={(v) => formatNumber(v)}
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={axisStyle}
              width={85}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30, 41, 59, 0.6)' }} />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: '600', color: '#cbd5e1' }}
            />
            <Bar dataKey="plan" name="Planlanan Yatırım (m)" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
            <Bar dataKey="yapilan" name="Gerçekleşen Yatırım (m)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
