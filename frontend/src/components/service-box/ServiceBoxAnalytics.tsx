'use client';
import { useMemo } from 'react';
import { ServiceBox } from '@/types';
import { WaitingDayRange } from '@/components/dashboard/FilterBar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
  BarChart3, AlertTriangle, Building2, Box, Clock,
} from 'lucide-react';

interface Props {
  boxes: ServiceBox[];
  onSelectRange?: (range: WaitingDayRange) => void;
  onSelectDistrict?: (district: string) => void;
  selectedRange?: WaitingDayRange;
  selectedDistrict?: string;
}

/* ── Palette ───────────────────────────────────────────── */
const RANGE_META: { key: WaitingDayRange; label: string; color: string; glow: string }[] = [
  { key: '<15',   label: '< 15 Gün',  color: '#ef4444', glow: 'rgba(239,68,68,0.35)' },
  { key: '15-30', label: '15–30 Gün', color: '#f97316', glow: 'rgba(249,115,22,0.35)' },
  { key: '30-45', label: '30–45 Gün', color: '#f59e0b', glow: 'rgba(245,158,11,0.35)' },
  { key: '45-60', label: '45–60 Gün', color: '#eab308', glow: 'rgba(234,179,8,0.35)' },
  { key: '60-75', label: '60–75 Gün', color: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
  { key: '75-90', label: '75–90 Gün', color: '#6366f1', glow: 'rgba(99,102,241,0.35)' },
  { key: '>90',   label: '> 90 Gün',  color: '#a855f7', glow: 'rgba(168,85,247,0.35)' },
];

function matchRange(days: number, range: WaitingDayRange): boolean {
  switch (range) {
    case '<15':   return days < 15;
    case '15-30': return days >= 15 && days < 30;
    case '30-45': return days >= 30 && days < 45;
    case '45-60': return days >= 45 && days < 60;
    case '60-75': return days >= 60 && days < 75;
    case '75-90': return days >= 75 && days < 90;
    case '>90':   return days >= 90;
    default:      return true;
  }
}

/* ── Custom Tooltip ─────────────────────────────────────── */
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-slate-300 font-medium">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── KPI Card ───────────────────────────────────────────── */
function KPICard({
  label, value, sub, icon: Icon, colorClass, bgClass, glowClass,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; colorClass: string; bgClass: string; glowClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-700/40 bg-slate-800/50 backdrop-blur-sm p-3 flex items-center justify-between group transition-all duration-200 hover:border-slate-600/60 hover:bg-slate-800/70">
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-0 group-hover:opacity-25 transition-opacity duration-300 ${glowClass}`} />
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <p className={`text-xl font-black ${colorClass} leading-none`}>{value}</p>
          {sub && <span className="text-[10px] text-slate-400 font-medium">{sub}</span>}
        </div>
      </div>
      <div className={`p-2 rounded-lg ${bgClass} flex-shrink-0`}>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </div>
    </div>
  );
}

/* ── Chart Section Card ─────────────────────────────────── */
function ChartCard({ title, subtitle, icon: Icon, iconColor, children }: {
  title: string; subtitle?: string; icon: React.ElementType;
  iconColor: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-800/50 backdrop-blur-sm overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-700/50">
            <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          </div>
          <span className="text-xs font-bold text-slate-100">{title}</span>
        </div>
        {subtitle && (
          <span className="text-[10px] text-slate-400 font-medium hidden sm:block">{subtitle}</span>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/* ══ Main Component ═══════════════════════════════════════ */
export function ServiceBoxAnalytics({ boxes, onSelectRange, onSelectDistrict, selectedRange, selectedDistrict }: Props) {

  /* Computed data */
  const rangeData = useMemo(() =>
    RANGE_META.map(({ key, label, color }) => ({
      key, name: label, color,
      'Kutu Sayısı': boxes.filter((b) => matchRange(b.waitingDays, key)).length,
    })),
  [boxes]);

  const districtData = useMemo(() => {
    const map: Record<string, { total: number; empty: number; filled: number }> = {};
    boxes.forEach((b) => {
      const d = b.district || 'Belirtilmedi';
      if (!map[d]) map[d] = { total: 0, empty: 0, filled: 0 };
      map[d].total++;
      if (!b.lastStatus) map[d].empty++; else map[d].filled++;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, 'Durumu Boş': v.empty, 'Durumu Diğer': v.filled, 'Toplam': v.total }))
      .sort((a, b) => b['Toplam'] - a['Toplam'])
      .slice(0, 10);
  }, [boxes]);

  const criticalCount = boxes.filter((b) => b.waitingDays >= 90).length;
  const avgWaiting    = boxes.length ? Math.round(boxes.reduce((s, b) => s + b.waitingDays, 0) / boxes.length) : 0;
  const emptyCount    = boxes.filter((b) => !b.lastStatus).length;
  const emptyPct      = boxes.length ? Math.round((emptyCount / boxes.length) * 100) : 0;

  return (
    <div className="space-y-3">

      {/* ══ KPI Strip ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Toplam Kutu"
          value={boxes.length.toLocaleString('tr')}
          sub="kayıt"
          icon={Box}
          colorClass="text-blue-400"
          bgClass="bg-blue-500/10"
          glowClass="bg-blue-500"
        />
        <KPICard
          label="Kritik (≥ 90 Gün)"
          value={criticalCount}
          sub={boxes.length ? `%${Math.round(criticalCount/boxes.length*100)}` : ''}
          icon={AlertTriangle}
          colorClass="text-red-400"
          bgClass="bg-red-500/10"
          glowClass="bg-red-500"
        />
        <KPICard
          label="Durumu Boş"
          value={emptyCount}
          sub={`%${emptyPct}`}
          icon={AlertTriangle}
          colorClass="text-amber-400"
          bgClass="bg-amber-500/10"
          glowClass="bg-amber-500"
        />
        <KPICard
          label="Ort. Bekleme"
          value={`${avgWaiting}`}
          sub="gün"
          icon={Clock}
          colorClass="text-emerald-400"
          bgClass="bg-emerald-500/10"
          glowClass="bg-emerald-500"
        />
      </div>

      {/* ══ Side-by-Side Charts ════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Bekleme Süresi Dağılımı */}
        <ChartCard
          title="Bekleme Süresi Dağılımı"
          subtitle="Tıklayarak filtreleyin"
          icon={BarChart3}
          iconColor="text-blue-400"
        >
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rangeData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} barCategoryGap="25%">
                <defs>
                  {RANGE_META.map(({ key, color }) => (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.55} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgba(148,163,184,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false} tickLine={false}
                  width={32}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)', radius: 6 }} />
                <Bar
                  dataKey="Kutu Sayısı"
                  radius={[5, 5, 2, 2]}
                  onClick={(entry) => onSelectRange && entry?.key && onSelectRange(entry.key as WaitingDayRange)}
                  className="cursor-pointer"
                >
                  {rangeData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={`url(#grad-${entry.key})`}
                      opacity={selectedRange && selectedRange !== 'all' && selectedRange !== entry.key ? 0.25 : 1}
                      stroke={selectedRange === entry.key ? entry.color : 'transparent'}
                      strokeWidth={1.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-slate-700/30 justify-center">
            {RANGE_META.map(({ key, label, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => onSelectRange && onSelectRange(key)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                {label}
              </button>
            ))}
          </div>
        </ChartCard>

        {/* İlçe Bazlı Dağılım */}
        <ChartCard
          title="İlçe Bazlı Servis Kutusu Dağılımı"
          subtitle="Tıklayarak filtreleyin"
          icon={Building2}
          iconColor="text-emerald-400"
        >
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 8, right: 8, left: -20, bottom: 15 }} barCategoryGap="25%">
                <defs>
                  <linearGradient id="grad-empty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="grad-filled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgba(148,163,184,0.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false} tickLine={false}
                  angle={-25} textAnchor="end" height={35}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)', radius: 6 }} />
                <Legend
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px', color: '#94a3b8' }}
                  formatter={(value) => <span style={{ color: '#94a3b8', fontWeight: 600 }}>{value}</span>}
                />
                <Bar
                  dataKey="Durumu Boş"
                  fill="url(#grad-empty)"
                  stackId="a"
                  radius={[0, 0, 2, 2]}
                  onClick={(e) => onSelectDistrict && e?.name && onSelectDistrict(e.name)}
                  className="cursor-pointer"
                  opacity={selectedDistrict && selectedDistrict !== 'all' ? 0.7 : 1}
                />
                <Bar
                  dataKey="Durumu Diğer"
                  fill="url(#grad-filled)"
                  stackId="a"
                  radius={[5, 5, 0, 0]}
                  onClick={(e) => onSelectDistrict && e?.name && onSelectDistrict(e.name)}
                  className="cursor-pointer"
                  opacity={selectedDistrict && selectedDistrict !== 'all' ? 0.7 : 1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

    </div>
  );
}

