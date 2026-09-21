'use client';
import { useMemo } from 'react';
import { ServiceBox } from '@/types';
import { WaitingDayRange } from '@/components/dashboard/FilterBar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, AlertTriangle, Building2, CheckCircle2 } from 'lucide-react';

interface Props {
  boxes: ServiceBox[];
  onSelectRange?: (range: WaitingDayRange) => void;
  onSelectDistrict?: (district: string) => void;
  selectedRange?: WaitingDayRange;
  selectedDistrict?: string;
}

const RANGE_COLORS: Record<string, string> = {
  '<15': '#ef4444',
  '15-30': '#f97316',
  '30-45': '#f59e0b',
  '45-60': '#eab308',
  '60-75': '#3b82f6',
  '75-90': '#6366f1',
  '>90': '#a855f7',
};

const RANGES: { key: WaitingDayRange; label: string }[] = [
  { key: '<15', label: '< 15 Gün' },
  { key: '15-30', label: '15-30 Gün' },
  { key: '30-45', label: '30-45 Gün' },
  { key: '45-60', label: '45-60 Gün' },
  { key: '60-75', label: '60-75 Gün' },
  { key: '75-90', label: '75-90 Gün' },
  { key: '>90', label: '> 90 Gün' },
];

function matchWaitingDayRange(days: number, range: WaitingDayRange): boolean {
  switch (range) {
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

export function ServiceBoxAnalytics({
  boxes,
  onSelectRange,
  onSelectDistrict,
  selectedRange,
  selectedDistrict,
}: Props) {
  /* 1. Bekleme Süre Dağılımı Bar Chart Verisi */
  const rangeData = useMemo(() => {
    return RANGES.map(({ key, label }) => {
      const count = boxes.filter((b) => matchWaitingDayRange(b.waitingDays, key)).length;
      return {
        key,
        name: label,
        'Kutu Sayısı': count,
        color: RANGE_COLORS[key],
      };
    });
  }, [boxes]);

  /* 2. İlçe Bazlı Dağılım Bar Chart Verisi */
  const districtData = useMemo(() => {
    const map: Record<string, { total: number; empty: number; filled: number }> = {};
    boxes.forEach((b) => {
      const d = b.district || 'Belirtilmedi';
      if (!map[d]) map[d] = { total: 0, empty: 0, filled: 0 };
      map[d].total++;
      if (!b.lastStatus) map[d].empty++;
      else map[d].filled++;
    });

    return Object.entries(map)
      .map(([name, val]) => ({
        name,
        'Toplam Kutu': val.total,
        'Durumu Boş': val.empty,
        'Durumu Diğer': val.filled,
      }))
      .sort((a, b) => b['Toplam Kutu'] - a['Toplam Kutu']);
  }, [boxes]);

  /* 3. Durum Dağılımı Pie Chart Verisi */
  const statusPieData = useMemo(() => {
    const emptyCount = boxes.filter((b) => !b.lastStatus).length;
    const filledCount = boxes.length - emptyCount;
    return [
      { name: 'Son Durumu Boş', value: emptyCount, color: '#f59e0b' },
      { name: 'Son Durumu Diğer', value: filledCount, color: '#3b82f6' },
    ];
  }, [boxes]);

  return (
    <div className="space-y-6">
      {/* ── KPI Özet Şeridi ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam Kutu</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{boxes.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kritik (&ge;90 Gün)</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {boxes.filter((b) => b.waitingDays >= 90).length}
            </p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Durumu Boş</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {boxes.filter((b) => !b.lastStatus).length}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Durumu Diğer</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {boxes.filter((b) => !!b.lastStatus).length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ── Grafikler Ana Izgarası ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik 1: Bekleme Süresi Dağılımı (Bar Chart) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Bekleme Süresi Dağılımı (Gün)</h3>
            </div>
            <span className="text-xs text-slate-400">Grafikte bir çubuğa tıklayarak filtreleyin</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rangeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Bar
                  dataKey="Kutu Sayısı"
                  radius={[6, 6, 0, 0]}
                  onClick={(entry) => {
                    if (onSelectRange && entry && entry.key) {
                      onSelectRange(entry.key as WaitingDayRange);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {rangeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={selectedRange && selectedRange !== 'all' && selectedRange !== entry.key ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 2: Durum Oranı (Pie Chart) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b pb-3">
            <PieIcon className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Son Durum Oranları</h3>
          </div>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grafik 3: İlçe Bazlı Kutu Yoğunluğu */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900 text-sm">İlçe Bazlı Servis Kutusu Dağılımı</h3>
          </div>
          <span className="text-xs text-slate-400">İlçeye göre durum karşılaştırması</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={districtData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Bar
                dataKey="Durumu Boş"
                fill="#f59e0b"
                stackId="a"
                radius={[0, 0, 0, 0]}
                onClick={(entry) => onSelectDistrict && entry && onSelectDistrict(entry.name)}
                className="cursor-pointer"
              />
              <Bar
                dataKey="Durumu Diğer"
                fill="#3b82f6"
                stackId="a"
                radius={[6, 6, 0, 0]}
                onClick={(entry) => onSelectDistrict && entry && onSelectDistrict(entry.name)}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
