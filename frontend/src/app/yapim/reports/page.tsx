'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function ReportsPage() {
  const dailyProductionData = [
    { name: 'Pzt', PE: 400, ST: 240, Servis: 120 },
    { name: 'Sal', PE: 300, ST: 139, Servis: 220 },
    { name: 'Çar', PE: 200, ST: 980, Servis: 229 },
    { name: 'Per', PE: 278, ST: 390, Servis: 200 },
    { name: 'Cum', PE: 189, ST: 480, Servis: 218 },
    { name: 'Cmt', PE: 239, ST: 380, Servis: 250 },
    { name: 'Paz', PE: 349, ST: 430, Servis: 210 },
  ];

  const teamPerformanceData = [
    { name: 'Ekip 01', imalat: 1240 },
    { name: 'Ekip 02', imalat: 980 },
    { name: 'Ekip 03', imalat: 1450 },
    { name: 'Ekip 04', imalat: 850 },
    { name: 'Ekip 05', imalat: 1100 },
    { name: 'Ekip 06', imalat: 1300 },
  ];

  const sectorDistributionData = [
    { name: 'Kepez', value: 400 },
    { name: 'Muratpaşa', value: 300 },
    { name: 'Konyaaltı', value: 300 },
    { name: 'Aksu', value: 200 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Raporlar ve Analizler</h1>
        <p className="text-sm text-slate-500 mt-1">Saha üretim verileri ve ekip performans metrikleri</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Günlük İmalat Miktarları (m)</CardTitle>
            <CardDescription>Son 7 günün hat tipi bazında imalat metreleri</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyProductionData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey="PE" stackId="a" fill="#3b82f6" name="PE Ana Hat" radius={[0, 0, 4, 4]} />
                <Bar dataKey="ST" stackId="a" fill="#10b981" name="ST Çelik Hat" />
                <Bar dataKey="Servis" stackId="a" fill="#f59e0b" name="Servis Hattı" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Ekip Performansları (Aylık Toplam)</CardTitle>
            <CardDescription>Ekiplerin bu ay içerisindeki toplam imalat metrajları</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teamPerformanceData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="imalat" fill="#6366f1" name="Toplam İmalat (m)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Sektör Bazlı İş Yükü Dağılımı</CardTitle>
            <CardDescription>Açık servis kutusu kayıtlarının bölgelere göre dağılımı</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sectorDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tamamlanma Trendi</CardTitle>
            <CardDescription>Son 30 gün içinde tamamlanan servis kutusu sayısı</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { name: '1 Eyl', tamamlanan: 12 },
                  { name: '8 Eyl', tamamlanan: 25 },
                  { name: '15 Eyl', tamamlanan: 45 },
                  { name: '22 Eyl', tamamlanan: 38 },
                  { name: '29 Eyl', tamamlanan: 65 },
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="tamamlanan" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Tamamlanan İş" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
