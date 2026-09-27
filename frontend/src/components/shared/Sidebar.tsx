'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Box, 
  Users, 
  Settings, 
  QrCode,
  CheckSquare,
  FileCheck,
  TrendingUp,
  Building2,
  ChevronDown,
  ChevronRight,
  MessageSquareWarning
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SubItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

type NavItem = {
  name: string;
  href?: string;
  icon: React.ElementType;
  subItems?: SubItem[];
};

export function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/yapim/dashboard', icon: LayoutDashboard },
    {
      name: 'Yapım Ofis',
      icon: Building2,
      subItems: [
        { name: 'Büyükşehir Yetki Kontrolü', href: '/yapim/excavation-permits', icon: FileCheck },
        { name: 'Servis Kutuları', href: '/yapim/service-boxes', icon: Box },
        { name: 'Yatırım İzleme', href: '/yapim/reports', icon: TrendingUp },
        { name: 'Yatırım İzleme (Harita)', href: '/yapim/investment-map', icon: MapIcon },
        { name: 'Şikayet Listesi', href: '/yapim/complaints', icon: MessageSquareWarning },
      ],
    },
    { name: 'Saha Bildirimleri', href: '/yapim/field-reports', icon: CheckSquare },
    { name: 'Ekipler', href: '/yapim/teams', icon: Users },
    { name: 'Operasyon Haritası', href: '/yapim/map', icon: MapIcon },
    { name: 'Servis Kutuları (Saha)', href: '/yapim/qr', icon: QrCode },
  ];

  // Auto-expand group if current pathname belongs to one of its subItems
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSub = item.subItems.some(
          (sub) => pathname === sub.href || (sub.href !== '/' && pathname.startsWith(sub.href))
        );
        if (hasActiveSub) initial[item.name] = true;
      }
    });
    return initial;
  });

  useEffect(() => {
    navItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSub = item.subItems.some(
          (sub) => pathname === sub.href || (sub.href !== '/' && pathname.startsWith(sub.href))
        );
        if (hasActiveSub) {
          setOpenGroups((prev) => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [pathname]);

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-tight">ENERYA</h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Saha Yapım Takip</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {navItems.map((item) => {
          if (item.subItems) {
            const isGroupOpen = !!openGroups[item.name];
            const isAnySubActive = item.subItems.some(
              (sub) => pathname === sub.href || (sub.href !== '/' && pathname.startsWith(sub.href))
            );

            return (
              <div key={item.name} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left",
                    isAnySubActive
                      ? "text-blue-400 bg-slate-800/60 font-semibold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className={cn("mr-3 h-5 w-5", isAnySubActive ? "text-blue-400" : "text-slate-400")} />
                    <span>{item.name}</span>
                  </div>
                  {isGroupOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {isGroupOpen && (
                  <div className="pl-4 ml-3 border-l border-slate-700/60 space-y-1 py-0.5">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href || (sub.href !== '/' && pathname.startsWith(sub.href));
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={onLinkClick}
                          className={cn(
                            "flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors",
                            isSubActive
                              ? "bg-blue-600/20 text-white font-bold border border-blue-500/30"
                              : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                          )}
                        >
                          <sub.icon className={cn("mr-2.5 h-4 w-4 shrink-0", isSubActive ? "text-blue-400" : "text-slate-400")} />
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = item.href && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));
          return (
            <Link
              key={item.name}
              href={item.href!}
              onClick={onLinkClick}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-slate-800 text-white font-semibold" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-blue-400" : "text-slate-400")} />
              {item.name}
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
