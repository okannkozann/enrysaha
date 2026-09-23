'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu, X, LogOut, LayoutDashboard, Box,
  CheckSquare, Users, Map as MapIcon, QrCode,
  FileText, Shield, ChevronRight
} from 'lucide-react';

const MODULE_LINKS = [
  { name: 'Dashboard',         href: '/yapim/dashboard',     icon: LayoutDashboard },
  { name: 'Servis Kutuları',   href: '/yapim/service-boxes', icon: Box },
  { name: 'Saha Bildirimleri', href: '/yapim/field-reports', icon: CheckSquare },
  { name: 'Ekipler',           href: '/yapim/teams',         icon: Users },
  { name: 'Operasyon Haritası',href: '/yapim/map',           icon: MapIcon },
  { name: 'QR Yönetimi',       href: '/yapim/qr',            icon: QrCode },
  { name: 'Raporlar',          href: '/yapim/reports',       icon: FileText },
];

export function Header() {
  const router   = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sayfa değiştiğinde mobil menüyü otomatik kapat
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // ESC tuşuna basıldığında menüyü kapat
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    }
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const activeModule = MODULE_LINKS.find((item) => pathname.startsWith(item.href))?.name ?? 'Enerya';

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 h-12 flex items-center justify-between px-3 sm:px-5 z-20 sticky top-0">
        {/* Sol Taraf: Mobil Hamburger Butonu & Marka */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menüyü Aç"
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobilde ENERYA logosu / başlığı */}
          <div className="flex items-center gap-1.5 md:hidden">
            <span className="text-sm font-black tracking-tight text-white">ENERYA</span>
            <span className="text-[10px] font-semibold text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              Saha
            </span>
          </div>
        </div>

        {/* Sağ Taraf: Aktif Modül Başlığı & Çıkış İkonu */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {activeModule}
          </span>
          <div className="h-4 w-px bg-slate-700/70" />
          <button
            type="button"
            onClick={() => router.push('/')}
            title="Çıkış Yap"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Mobil Hamburger Menü Çekmecesi (Drawer) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Arka plan karartması (Backdrop blur) */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Kayarak açılan menü paneli */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 border-r border-slate-700/60 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out">
            {/* Menü Başlığı & Kapatma Butonu */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  ENERYA
                  <span className="text-[10px] font-bold text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/25">
                    SAHA
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Saha Yapım Takip Modülleri</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/40 transition-colors"
                aria-label="Menüyü Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigasyon Sekmeleri */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Operasyon Sekmeleri
              </div>

              {MODULE_LINKS.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-white border border-blue-500/35 shadow-[0_0_15px_rgba(59,130,246,0.15)] font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <link.icon
                        className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}
                      />
                      <span>{link.name}</span>
                    </div>
                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-slate-600" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Alt Bilgi & Çıkış */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/60 space-y-2">
              <div className="px-2 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40 flex items-center gap-2 text-[11px] text-slate-300">
                <Shield className="h-3.5 w-3.5 text-blue-400" />
                <span>Yapım Mühendisliği</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
