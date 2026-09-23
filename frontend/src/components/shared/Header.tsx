'use client';
import { LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const MODULE_NAMES: Record<string, string> = {
  '/yapim/service-boxes': 'Servis Kutuları',
  '/yapim/dashboard':     'Dashboard',
  '/yapim/field-reports': 'Saha Bildirimleri',
  '/yapim/teams':         'Ekipler',
  '/yapim/map':           'Operasyon Haritası',
  '/yapim/qr':            'QR Yönetimi',
  '/yapim/reports':       'Raporlar',
};

export function Header() {
  const router   = useRouter();
  const pathname = usePathname();

  const moduleName =
    Object.entries(MODULE_NAMES).find(([path]) => pathname.startsWith(path))?.[1]
    ?? 'Enerya';

  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 h-11 flex items-center justify-end px-4 lg:px-6 z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {moduleName}
        </span>
        <div className="h-4 w-px bg-slate-700" />
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
  );
}
