'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Box, 
  Users, 
  FileText, 
  Settings, 
  QrCode,
  CheckSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const role = useAppStore(state => state.role);
  const isOffice = role === 'YAPIM_MUHENDISI';

  const officeLinks = [
    { name: 'Dashboard', href: '/yapim/dashboard', icon: LayoutDashboard },
    { name: 'Servis Kutuları', href: '/yapim/service-boxes', icon: Box },
    { name: 'Saha Bildirimleri', href: '/yapim/field-reports', icon: CheckSquare },
    { name: 'Ekipler', href: '/yapim/teams', icon: Users },
    { name: 'Operasyon Haritası', href: '/yapim/map', icon: MapIcon },
    { name: 'QR Yönetimi', href: '/yapim/qr', icon: QrCode },
    { name: 'Raporlar', href: '/yapim/reports', icon: FileText },
  ];

  const links = officeLinks;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-tight">ENERYA</h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Saha Yapım Takip</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <link.icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-400" : "text-slate-400")} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 mt-auto">
        <Link href="/settings" onClick={onLinkClick} className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
          <Settings className="mr-3 h-5 w-5 text-slate-400" />
          Ayarlar
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 hidden md:flex flex-col h-screen">
      <SidebarContent />
    </aside>
  );
}
