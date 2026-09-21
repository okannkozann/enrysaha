'use client';
import { useEffect, useState } from 'react';
import { fieldReportService } from '@/lib/services/fieldReportService';
import { FieldReport } from '@/types';
import { FilterBar } from '@/components/dashboard/FilterBar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function FieldReportsPage() {
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await fieldReportService.getFieldReports();
      setReports(data);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Saha Bildirimleri</h1>
          <p className="text-sm text-slate-500 mt-1">Saha ekiplerinden gelen günlük işe başlama ve tamamlama bildirimleri</p>
        </div>
      </div>

      <FilterBar />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Bildirimler yükleniyor...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead>Tarih/Saat</TableHead>
                <TableHead>Ekip</TableHead>
                <TableHead>Sektör/Adres</TableHead>
                <TableHead>İmalat Türü</TableHead>
                <TableHead>Metraj</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Bildirim Tipi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="font-medium text-slate-900">{report.date}</div>
                    <div className="text-xs text-slate-500">{report.time}</div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{report.teamId.replace('team-0', 'Ekip ')}</TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-slate-900">{report.sectorRegionInfo}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[250px]" title={report.address}>{report.address}</div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{report.workType}</TableCell>
                  <TableCell>
                    {report.productionMeters ? (
                      <span className="font-semibold text-slate-900">{report.productionMeters} <span className="text-xs font-normal text-slate-500">m</span></span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      report.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700' :
                      report.status === 'Devam Ediyor' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {report.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={report.reportType === 'MORNING' ? 'bg-blue-50 text-blue-700 hover:bg-blue-50' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'}>
                      {report.reportType === 'MORNING' ? 'İşe Başlama' : 'İmalat Bitiş'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Bildirim bulunamadı.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
