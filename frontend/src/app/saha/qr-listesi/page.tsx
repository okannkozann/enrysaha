'use client';

import { useState, useEffect } from 'react';
import { qrService } from '@/lib/services/qrService';
import { authService } from '@/lib/services/authService';
import { QRPackage, User } from '@/types';
import {
  PackageSearch, QrCode, Calendar, MapPin, ChevronRight,
  RefreshCw, Sparkles, ArrowRight, Layers, CheckCircle2,
  Clock, AlertCircle, Building2, Eye
} from 'lucide-react';
import Link from 'next/link';

export default function MobileQRListPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [qrPackages, setQrPackages] = useState<QRPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await authService.getCurrentFieldUser();
      setCurrentUser(user);

      const all = await qrService.getQrPackages();
      let assigned = all.filter(
        (qr) => qr.status === 'SENT' || qr.status === 'VIEWED'
      );

      if (user?.teamId) {
        assigned = assigned.filter((qr) => qr.assignedTeamId === user.teamId);
      }

      assigned.sort(
        (a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime()
      );

      setQrPackages(assigned);
    } catch (e) {
      console.error('Error loading QR packages:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const totalBoxesCount = qrPackages.reduce((acc, curr) => acc + (curr.serviceBoxIds?.length || 0), 0);
  const uniqueDistricts = Array.from(
    new Set(qrPackages.flatMap((qr) => qr.filters?.districts || []))
  );

  return (
    <div className="w-full space-y-5 py-2">

      {/* ── Section Title & Action Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20 shrink-0">
            <PackageSearch className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                SERVİS KUTUSU PAKET LİSTESİ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 border border-blue-500/35 text-blue-300">
                {qrPackages.length} Paket
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ekibinize atanan tüm aktif servis kutusu iş listeleri
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Yenile</span>
        </button>
      </div>




      {/* ── Package List View ── */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <div className="text-xs font-bold text-slate-300">Atanan paketler yükleniyor...</div>
        </div>
      ) : qrPackages.length === 0 ? (
        <div className="p-10 text-center bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-col items-center justify-center space-y-3 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shadow-inner">
            <PackageSearch className="h-8 w-8 text-slate-500" />
          </div>
          <div className="text-sm font-extrabold text-slate-200">Atanmış Servis Kutusu Paketiniz Bulunmuyor</div>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Yapım ofisi tarafından ekibinize henüz atanan bir servis kutusu QR paketi bulunmuyor. Yeni bir paket atandığında burada görüntülenecektir.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Paket Listesi ({qrPackages.length})</span>
            <span>İşlemler</span>
          </div>

          <div className="space-y-2.5">
            {qrPackages.map((qr) => (
              <div
                key={qr.id}
                className={`rounded-2xl border p-4 sm:p-4.5 backdrop-blur-xl transition-all duration-200 shadow-lg hover:shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${qr.status === 'SENT'
                  ? 'border-emerald-500/40 bg-slate-900/90 shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                  : 'border-slate-800 bg-slate-900/80 hover:bg-slate-900/95'
                  }`}
              >
                {/* Left info area */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-md">
                    <QrCode className="h-5.5 w-5.5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-white text-sm sm:text-base tracking-wide">
                        {qr.id}
                      </span>

                      {qr.status === 'SENT' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Yeni İş Emri
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 shrink-0">
                          <Eye className="h-3 w-3" />
                          Aktif Paket
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <div className="flex items-center gap-1 text-slate-300 font-semibold">
                        <Layers className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{qr.serviceBoxIds?.length || 0} Kutu</span>
                      </div>
                      <span className="text-slate-600">•</span>
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">
                          {qr.filters?.districts?.length > 0 ? qr.filters.districts.join(', ') : 'Tüm İlçeler'}
                        </span>
                      </div>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatDate(qr.sentAt || qr.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right button action */}
                <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <Link
                    href={`/saha/qr-listesi/${qr.id}`}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer group"
                  >
                    <span>LİSTEYİ VE HARİTAYI AÇ</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
