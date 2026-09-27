'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { User } from '@/types';
import {
  HardHat, Clock, LogOut, RefreshCw, ClipboardList,
  PackageSearch, CalendarCheck, LayoutDashboard,
  Radio, ShieldCheck, Menu, X, ChevronRight
} from 'lucide-react';

export default function SahaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    authService.getCurrentFieldUser().then((user) => setCurrentUser(user));
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Active state helpers
  const isBildirimIslemleriActive = pathname === '/saha' || pathname.startsWith('/saha/ise-baslama') || pathname.startsWith('/saha/imalat-tamamla') || pathname.startsWith('/saha/kutu-montaji');
  const isServisKutulariActive = pathname.startsWith('/saha/qr-listesi') || pathname.startsWith('/saha/servis-kutulari');
  const isIzinlerActive = pathname.startsWith('/saha/izinler');

  return (
    <div className="min-h-screen h-auto w-full flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-white font-sans relative overflow-x-hidden overflow-y-auto">

      {/* Ambient background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[150px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[160px]" />
        <div className="absolute bottom-0 left-10 w-[450px] h-[450px] rounded-full bg-violet-600/10 blur-[140px]" />
      </div>

      {/* ── Top Bar Header (With Hamburger Button on Mobile) ── */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 py-2 sm:px-4 sm:py-3 sticky top-0 z-40 shadow-xl shadow-black/40 shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button (Mobile Only) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800/90 text-slate-200 hover:text-white border border-slate-700/80 active:scale-95 transition-all cursor-pointer"
              aria-label="Dashboard Menü"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-emerald-400" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-1 ring-white/20 shrink-0">
              <HardHat className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-white text-xs sm:text-base tracking-tight">ENERYA SAHA</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {currentUser?.teamName || 'Ekip 01'}
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate max-w-[160px] sm:max-w-none">
                Saha Operasyon Takip Sistemi
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300 shadow-inner">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>{formatDate(currentTime)}</span>
              <span className="text-slate-500">•</span>
              <span className="text-white font-bold">{formatTime(currentTime)}</span>
            </div>

            <button
              onClick={() => window.location.reload()}
              title="Yenile"
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <Link
              href="/"
              title="Çıkış Yap"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/60 transition-all"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile Hamburger Drawer (Slide-Over Drawer) ── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80%] bg-slate-900 border-r border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-5">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-black tracking-wider text-white uppercase">
                    DASHBOARD
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                <Link
                  href="/saha"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                    isBildirimIslemleriActive
                      ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/20 border-emerald-500/50 text-white shadow-lg'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className={`h-4.5 w-4.5 ${isBildirimIslemleriActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>Bildirim İşlemleri</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Link>

                <Link
                  href="/saha/qr-listesi"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                    isServisKutulariActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 border-blue-500/50 text-white shadow-lg'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PackageSearch className={`h-4.5 w-4.5 ${isServisKutulariActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>Servis Kutuları</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Link>

                <Link
                  href="/saha/izinler"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                    isIzinlerActive
                      ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/20 border-amber-500/50 text-white shadow-lg'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarCheck className={`h-4.5 w-4.5 ${isIzinlerActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>İzinler</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Link>
              </nav>
            </div>

            {/* Mobile Footer Status */}
            <div className="pt-4 border-t border-slate-800">
              <div className="rounded-xl bg-slate-800/60 p-3 text-xs space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Yetkili Ekip</span>
                <span className="font-bold text-white block">{currentUser?.teamName || 'Ekip 01'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout Container (Allows Smooth Scroll on Mobile) ── */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-5 lg:gap-6 relative z-10 items-stretch min-h-0">

        {/* ══ DESKTOP LEFT SIDEBAR ═══════════════════════════════════════════════ */}
        <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col min-h-[calc(100vh-110px)]">
          
          <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-4 shadow-2xl flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              {/* Sidebar Title / Header: DASHBOARD */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-black tracking-wider text-white uppercase">
                  DASHBOARD
                </h2>
              </div>

              {/* Navigation Menu Buttons */}
              <nav className="space-y-2">
                
                {/* 1. Bildirim İşlemleri */}
                <Link
                  href="/saha"
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isBildirimIslemleriActive
                      ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/20 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className={`h-4.5 w-4.5 ${isBildirimIslemleriActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>Bildirim İşlemleri</span>
                  </div>
                  {isBildirimIslemleriActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                  )}
                </Link>

                {/* 2. Servis Kutuları */}
                <Link
                  href="/saha/qr-listesi"
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isServisKutulariActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 border-blue-500/50 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PackageSearch className={`h-4.5 w-4.5 ${isServisKutulariActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>Servis Kutuları</span>
                  </div>
                  {isServisKutulariActive && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)] animate-pulse" />
                  )}
                </Link>

                {/* 3. İzinler */}
                <Link
                  href="/saha/izinler"
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isIzinlerActive
                      ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/20 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarCheck className={`h-4.5 w-4.5 ${isIzinlerActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>İzinler</span>
                  </div>
                  {isIzinlerActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse" />
                  )}
                </Link>

              </nav>
            </div>

          </div>

        </aside>

        {/* ══ MAIN CONTENT AREA (Smooth Scroll Allowed) ══════════════════════════ */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          {children}
        </main>

      </div>

    </div>
  );
}
