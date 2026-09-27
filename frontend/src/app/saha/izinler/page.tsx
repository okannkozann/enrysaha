'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, ShieldCheck, Download, Search, Filter,
  CheckCircle2, Clock, AlertCircle, FileText, ArrowLeft
} from 'lucide-react';

export default function SahaIzinlerPage() {
  const [search, setSearch] = useState('');

  const samplePermits = [
    {
      id: 'IZN-2026-089',
      title: 'Kepez / Fabrikalar Mah. Kazı ve Altyapı Ruhsatı',
      type: 'Büyükşehir Kazı İzni',
      authority: 'Antalya Büyükşehir Belediyesi (AYKOME)',
      startDate: '15.09.2026',
      endDate: '15.10.2026',
      status: 'APPROVED',
    },
    {
      id: 'IZN-2026-092',
      title: 'Muratpaşa / Fener Mah. Servis Hattı Çalışma İzni',
      type: 'İlçe Belediyesi İzni',
      authority: 'Muratpaşa Belediyesi',
      startDate: '20.09.2026',
      endDate: '20.10.2026',
      status: 'APPROVED',
    },
    {
      id: 'IZN-2026-104',
      title: 'Konyaaltı / Arapsuyu Mah. Trafik Düzenleme İzni',
      type: 'Ulaşım & Trafik İzni',
      authority: 'İl Emniyet Müd. Trafik Şube',
      startDate: '01.10.2026',
      endDate: '10.10.2026',
      status: 'PENDING',
    },
  ];

  const filteredPermits = samplePermits.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 py-2">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">
              Saha Çalışma İzinleri
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Ekibinize tanımlı aktif kazı, ruhsat ve çalışma izin belgelerini inceleyin.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shrink-0">
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          <span>{samplePermits.length} Aktif İzin Kaydı</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="İzin No, Mahalle veya İzin Türü ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-500"
          />
        </div>

        <span className="text-xs font-bold text-slate-400">
          Son Güncelleme: <strong className="text-white">Bugün 20:45</strong>
        </span>
      </div>

      {/* Permit Cards Grid */}
      <div className="space-y-4">
        {filteredPermits.map((permit) => (
          <div
            key={permit.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-5 shadow-xl space-y-3 hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{permit.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {permit.type}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 mt-0.5">{permit.title}</h3>
                </div>
              </div>

              {permit.status === 'APPROVED' ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Ruhsat Onaylı
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shrink-0">
                  <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  Onay Bekliyor
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Yetkili Kurum</span>
                <span className="font-semibold text-slate-200">{permit.authority}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Geçerlilik Tarihi</span>
                <span className="font-semibold text-slate-200">{permit.startDate} — {permit.endDate}</span>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => alert(`${permit.id} belgesi indiriliyor...`)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-amber-400" />
                  <span>İzin Evrağını İndir</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
