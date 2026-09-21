'use client';
import { useEffect, useState } from 'react';
import { Bell, Search, Menu, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarContent } from '@/components/shared/Sidebar';

export function Header() {
  const { role, setRole } = useAppStore();
  const [fileName, setFileName] = useState<string>('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const updateName = () => {
      const name = localStorage.getItem('enerya_service_boxes_filename');
      if (name) setFileName(name);
    };

    updateName();
    window.addEventListener('storage', updateName);
    const interval = setInterval(updateName, 1000);
    return () => {
      window.removeEventListener('storage', updateName);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5 text-slate-500" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-0 w-64 bg-slate-900 text-slate-100">
            <SidebarContent onLinkClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        {fileName && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-xs font-medium">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>{fileName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-slate-500">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-500 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white" />
        </Button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 pl-2 pr-2 rounded-md hover:bg-slate-50 transition-colors h-10 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                  {role === 'YAPIM_MUHENDISI' ? 'YM' : 'SE'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-sm font-medium leading-none text-slate-900">
                  {role === 'YAPIM_MUHENDISI' ? 'Yapım Mühendisi' : 'Saha Ekibi'}
                </span>
                <span className="text-xs text-slate-500 mt-1">Demo Kullanıcı</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Rol Değiştir (Demo)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setRole('YAPIM_MUHENDISI')}
              className={role === 'YAPIM_MUHENDISI' ? 'bg-slate-100' : ''}
            >
              Yapım Mühendisi Görünümü
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setRole('SAHA_EKIBI')}
              className={role === 'SAHA_EKIBI' ? 'bg-slate-100' : ''}
            >
              Saha Ekibi Görünümü
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
