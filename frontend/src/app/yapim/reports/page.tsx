'use client';
import { useEffect, useState } from 'react';
import { workSessionService } from '@/lib/services/workSessionService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, Line,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

/* ─── Custom Tooltip ──────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-700/60 rounded-2xl shadow-2xl px-4 py-3 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
        {label && <p className="text-slate-400 font-semibold mb-2">{label}</p>}
        {payload.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            <span className="text-slate-400">{e.name}:</span>
            <span className="text-slate-100 font-bold">{e.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── KPI Card ─────────────────────────────────────────────────────────── */
function KpiCard({ label, value, change, up, alert }: {
  label: string; value: string; change: string; up?: boolean; alert?: boolean;
}) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-3.5 shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        {alert
          ? <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center"><AlertCircle className="h-3 w-3 text-red-400" /></span>
          : up
            ? <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><TrendingUp className="h-3 w-3 text-emerald-400" /></span>
            : <span className="w-5 h-5 rounded-full bg-slate-700/60 flex items-center justify-center"><TrendingDown className="h-3 w-3 text-slate-400" /></span>
        }
      </div>
      <p className="text-xl font-extrabold text-slate-100 tracking-tight">{value}</p>
      <p className={`text-xs font-medium mt-0.5 ${up ? 'text-emerald-400' : alert ? 'text-red-400' : 'text-slate-500'}`}>
        {up ? '▲' : '▼'} {change}
      </p>
    </div>
  );
}

/* ─── Chart Card ───────────────────────────────────────────────────────── */
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-200">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function ReportsPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    async function loadSessions() {
      const data = await workSessionService.getWorkSessions();
      setSessions(data);
    }
    loadSessions();
  }, []);

  const completedBoxSessions = sessions.filter(
    (s) => s.status === 'COMPLETED' && s.workType?.toLowerCase().includes('kutu')
  );
  const sessionBoxCount = completedBoxSessions.reduce((sum, s) => sum + (s.quantityMeters || 0), 0);
  const totalCompletedBoxes = 65 + sessionBoxCount;

  const s700Count = completedBoxSessions
    .filter((s) => s.workType?.includes('S700'))
    .reduce((sum, s) => sum + (s.quantityMeters || 0), 0) + 38;

  const ces200Count = completedBoxSessions
    .filter((s) => s.workType?.includes('CES200'))
    .reduce((sum, s) => sum + (s.quantityMeters || 0), 0) + 27;

  const boxTypeData = [
    { name: 'S700 Kutu', value: s700Count },
    { name: 'CES200 Kutu', value: ces200Count },
  ];

  /* Data */
  const weeklyProductionData = [
    { name: 'Pzt', toplam: 760, hedef: 700 },
    { name: 'Sal', toplam: 659, hedef: 700 },
    { name: 'Çar', toplam: 1409, hedef: 700 },
    { name: 'Per', toplam: 868, hedef: 700 },
    { name: 'Cum', toplam: 887, hedef: 700 },
    { name: 'Cmt', toplam: 869, hedef: 700 },
    { name: 'Paz', toplam: 989, hedef: 700 },
  ];

  const teamPerformanceData = [
    { name: 'Ekip 01', imalat: 1240 },
    { name: 'Ekip 02', imalat: 980 },
    { name: 'Ekip 03', imalat: 1450 },
    { name: 'Ekip 04', imalat: 850 },
    { name: 'Ekip 05', imalat: 1100 },
    { name: 'Ekip 06', imalat: 1300 },
  ];

  const sectorData = [
    { name: 'Kepez', value: 400 },
    { name: 'Muratpaşa', value: 300 },
    { name: 'Konyaaltı', value: 300 },
    { name: 'Aksu', value: 200 },
  ];

  const workTypeData = [
    { name: 'PE Ana Hat', value: 45 },
    { name: 'Servis Hattı', value: 25 },
    { name: 'ST Çelik Hat', value: 20 },
    { name: 'Servis Kutusu', value: 10 },
  ];

  const trendData = [
    { name: '1 Eyl', tamamlanan: 12, kutuMontaj: 8 },
    { name: '8 Eyl', tamamlanan: 25, kutuMontaj: 15 },
    { name: '15 Eyl', tamamlanan: 45, kutuMontaj: 28 },
    { name: '22 Eyl', tamamlanan: 38, kutuMontaj: 22 },
    { name: '29 Eyl', tamamlanan: 65, kutuMontaj: totalCompletedBoxes },
  ];

  /* Corporate color palette */
  const TEAM_COLORS = ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
  const PIE_COLORS = ['#1d4ed8', '#0891b2', '#059669', '#d97706'];
  const TYPE_COLORS = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb'];
  const BOX_COLORS = ['#8b5cf6', '#ec4899'];

  const total = sectorData.reduce((a, b) => a + b.value, 0);

  const axisStyle = { fill: '#64748b', fontSize: 11, fontFamily: 'Inter, sans-serif' };
  const gridStroke = '#1e293b';

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 font-sans">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-[1600px] mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">Raporlar ve Analizler</h1>
            <p className="text-slate-400 text-xs mt-0.5">Saha üretim verileri, servis kutusu montajları ve ekip performans metrikleri</p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-1.5 font-medium">
            Eylül 2026
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Toplam Metraj" value="8.230 m" change="10% geçen haftaya göre" up />
          <KpiCard label="Aktif Ekip" value="6" change="10% artış" up />
          <KpiCard label="Montajı Biten Kutu" value={`${totalCompletedBoxes} Adet`} change="Canlı kutu montaj sync" up />
          <KpiCard label="Hedef Sapması" value="%16" change="Hedefin üzerinde" alert />
        </div>

        {/* Row 2 — 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Donut — İmalat Türü */}
          <ChartCard title="İmalat Türü Dağılımı">
            <div className="flex items-center gap-4 h-[220px]">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie
                    data={workTypeData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    dataKey="value" stroke="none"
                  >
                    {workTypeData.map((_, i) => (
                      <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1">
                {workTypeData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TYPE_COLORS[i] }} />
                    <span className="text-xs text-slate-400 truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Horizontal Bar — Ekip Performansı */}
          <ChartCard title="Ekip Metraj Performansı">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformanceData} layout="vertical" margin={{ top: 0, right: 10, left: 38, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={axisStyle} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={axisStyle} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f5f3ff' }} />
                  <Bar dataKey="imalat" name="İmalat (m)" radius={[0, 6, 6, 0]}>
                    {teamPerformanceData.map((_, i) => (
                      <Cell key={i} fill={TEAM_COLORS[i % TEAM_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Pie — Bölge Dağılımı */}
          <ChartCard title="Bölge Bazlı İş Yükü">
            <div className="flex items-center gap-4 h-[220px]">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%" cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    stroke="none"
                  >
                    {sectorData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2.5 flex-1">
                {sectorData.map((entry, i) => {
                  const pct = Math.round((entry.value / total) * 100);
                  return (
                    <div key={entry.name}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-300 font-medium">{entry.name}</span>
                        <span className="text-slate-500">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PIE_COLORS[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Row 3 — 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Area Chart — Haftalık İmalat */}
          <ChartCard title="Haftalık İmalat Trendi">
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
              <span className="flex items-center gap-1"><span className="w-3 h-1 bg-cyan-500 rounded inline-block" /> Gerçekleşen</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1 bg-slate-600 border-dashed border-t-2 inline-block" /> Hedef</span>
              <span className="ml-auto text-emerald-400 font-semibold flex items-center gap-1"><TrendingUp className="h-3 w-3" /> %8 artış</span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyProductionData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSlate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#475569" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisStyle} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="hedef" stroke="#475569" strokeWidth={2} strokeDasharray="6 4" fill="url(#gradSlate)" name="Hedef (m)" dot={false} />
                  <Area type="monotone" dataKey="toplam" stroke="#0891b2" strokeWidth={2.5} fill="url(#gradCyan)" name="Gerçekleşen (m)" dot={{ r: 4, fill: '#0891b2', stroke: '#cffafe', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Bar + Line — Tamamlanma Trendi */}
          <ChartCard title="Tamamlanma Trendi">
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Tamamlanan</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1 border-dashed border-t-2 border-slate-600 inline-block" /> Hedef Seyri</span>
              <span className="ml-auto text-emerald-400 font-semibold flex items-center gap-1"><TrendingUp className="h-3 w-3" /> %10 artış</span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisStyle} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37,99,235,0.08)' }} />
                  <Bar dataKey="tamamlanan" name="Tamamlanan" fill="#2563eb" radius={[6, 6, 0, 0]} opacity={0.85} />
                  <Line
                    type="monotone"
                    dataKey="kutuMontaj"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="Kutu Montajı (Adet)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

        </div>

        {/* Row 4 — Servis Kutusu Montaj İstatistik ve Grafik Dökümü */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Servis Kutusu Montaj Türü Dağılımı (S700 / CES200)">
            <div className="flex items-center gap-4 h-[220px]">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie
                    data={boxTypeData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value" stroke="none"
                  >
                    {boxTypeData.map((_, i) => (
                      <Cell key={i} fill={BOX_COLORS[i % BOX_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3 flex-1">
                {boxTypeData.map((entry, i) => (
                  <div key={entry.name} className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: BOX_COLORS[i] }} />
                        {entry.name}
                      </span>
                      <span className="text-white font-extrabold">{entry.value} Kutu</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Saha ekipleri tarafından montajı tamamlanan {entry.name} tipi servis kutusu
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Haftalık Servis Kutusu Montaj Trendi">
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" /> Montaj Yapılan Kutu</span>
              <span className="ml-auto text-emerald-400 font-semibold flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Toplam {totalCompletedBoxes} Kutu</span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisStyle} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(139,92,246,0.1)' }} />
                  <Bar dataKey="kutuMontaj" name="Kutu Montajı (Adet)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

