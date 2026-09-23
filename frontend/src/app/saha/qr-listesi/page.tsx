'use client';
import { useState, useEffect } from 'react';
import { qrService } from '@/lib/services/qrService';
import { authService } from '@/lib/services/authService';
import { QRPackage, User } from '@/types';
import {
  LogOut, ClipboardList, PackageSearch, QrCode,
  Calendar, MapPin, ChevronRight, HardHat, RefreshCw,
  Sparkles, ArrowRight, Layers
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MobileQRListPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [qrPackages, setQrPackages]   = useState<QRPackage[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    authService.getCurrentFieldUser().then((user) => {
      setCurrentUser(user);
      loadQRs(user.teamId!);
    });
  }, []);

  const loadQRs = async (teamId: string) => {
    const all = await qrService.getQrPackages();
    const assigned = all.filter(
      (qr) => qr.assignedTeamId === teamId && (qr.status === 'SENT' || qr.status === 'VIEWED')
    );

    if (assigned.length > 0) {
      assigned.sort(
        (a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime()
      );
      // Auto-redirect to the most recent one
      router.replace(`/saha/qr-listesi/${assigned[0].id}`);
      return;
    }

    setQrPackages(assigned);
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-20 relative selection:bg-emerald-500/30 selection:text-white">

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-1/2 right-10 w-80 h-80 rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* ── Top Bar: Sticky Header ── */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 sm:p-5 sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <PackageSearch className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight">ENERYA SAHA</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 border border-blue-500/25 text-blue-300">
                  {currentUser?.teamName || 'Ekip 01'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Atanan Servis Kutusu Listeleri</div>
            </div>
          </div>

          <Link
            href="/"
            title="Çıkış Yap"
            className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/60 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* ── Main Container ── */}
      <div className="p-4 sm:p-6 max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 sm:gap-8 mt-2 relative z-10">

        {/* ── Sol Menü ── */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl p-3 shadow-xl space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-2 pb-1">
              Saha Menüsü
            </div>

            <Link
              href="/saha"
              className="flex items-center justify-between px-3.5 py-3 text-xs font-semibold rounded-xl transition-all text-slate-300 hover:bg-slate-800/80 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="h-4 w-4 text-slate-400" />
                <span>Bildirim İşlemleri</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            </Link>

            <Link
              href="/saha/qr-listesi"
              className="flex items-center justify-between px-3.5 py-3 text-xs font-bold rounded-xl transition-all bg-blue-500/20 border border-blue-500/35 text-white shadow-md shadow-blue-500/10"
            >
              <div className="flex items-center gap-2.5">
                <PackageSearch className="h-4 w-4 text-blue-400" />
                <span>Servis Kutuları</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
            </Link>
          </div>
        </aside>

        {/* ── Ana İçerik ── */}
        <main className="flex-1 space-y-4 min-w-0">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <QrCode className="h-4 w-4 text-blue-400" />
              Size Atanan İş Listeleri
            </h2>
            <span className="text-xs text-slate-400 font-medium">{qrPackages.length} Paket</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">Listeler taranıyor...</span>
            </div>
          ) : qrPackages.length === 0 ? (
            <div className="p-10 text-center bg-slate-900/60 rounded-2xl border border-slate-700/50 backdrop-blur-xl flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                <PackageSearch className="h-8 w-8 text-slate-500" />
              </div>
              <div className="text-sm font-bold text-slate-200">Atanan Liste Bulunamadı</div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Yapım ofisi tarafından ekibinize atanmış aktif bir servis kutusu QR paketi bulunmuyor.
              </p>
            </div>
          ) : (
            qrPackages.map((qr) => (
              <div
                key={qr.id}
                className={`rounded-2xl border p-5 backdrop-blur-xl transition-all hover:bg-slate-800/50 space-y-4 ${
                  qr.status === 'SENT'
                    ? 'border-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-700/50 bg-slate-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm tracking-wide">{qr.id}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{formatDate(qr.createdAt)}</div>
                    </div>
                  </div>

                  {qr.status === 'SENT' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Yeni İş Emri
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kayıt Sayısı</span>
                    <span className="font-black text-white text-sm mt-0.5 block">{qr.serviceBoxIds.length} Kutu</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">İlçeler</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                      {qr.filters.districts.length > 0 ? qr.filters.districts.join(', ') : 'Tümü'}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/saha/qr-listesi/${qr.id}`}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>LİSTEYİ AÇ</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))
          )}
        </main>
      </div>

    </div>
  );
}
